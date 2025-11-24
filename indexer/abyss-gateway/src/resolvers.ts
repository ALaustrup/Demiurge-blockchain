/**
 * GraphQL resolvers for chat system.
 */

import { chatDb, ChatUser, ChatMessage, ChatRoom, getDb, upsertDeveloper, getDeveloperByAddress, getDeveloperByUsername, listDevelopers, createProject, getProjectBySlug, addMaintainer, getMaintainers, listProjects, upsertDevCapsule, getDevCapsuleById, getDevCapsulesByOwner, getDevCapsulesByProject } from "./chatDb";
import { createPubSub, PubSub } from "@graphql-yoga/node";

const DEMIURGE_RPC_URL = process.env.DEMIURGE_RPC_URL || "http://127.0.0.1:8545/rpc";
import * as http from "http";

export const pubsub = createPubSub<{
  WORLD_CHAT: [ChatMessage & { sender: ChatUser }];
  [key: `ROOM_${string}`]: [ChatMessage & { sender: ChatUser }];
}>();

/**
 * Context type for GraphQL resolvers.
 */
export interface ChatContext {
  currentUser: ChatUser | null;
  resolvers: typeof resolvers;
  pubsub: typeof pubsub;
}

/**
 * Resolve current user from headers.
 */
export async function resolveCurrentUser(
  address?: string,
  username?: string
): Promise<ChatUser | null> {
  if (!address) {
    return null;
  }

  // Get or create user
  let user = chatDb.getOrCreateUser(address, username);
  
  // If username looks like an address, try to sync from chain
  if (user.username.length >= 16 && /^[0-9a-f]+$/i.test(user.username)) {
    // Sync username from chain (synchronous for immediate update)
    try {
      const response = await fetch(DEMIURGE_RPC_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "urgeid_get",
          params: { address },
          id: 1,
        }),
      });
      
      const data = await response.json();
      if (data.result?.username && data.result.username !== user.username) {
        // Update username in chat_users table
        const db = getDb();
        const existing = db
          .prepare("SELECT id FROM chat_users WHERE username = ? AND address != ?")
          .get(data.result.username, address);
        
        if (!existing) {
          db.prepare("UPDATE chat_users SET username = ? WHERE address = ?")
            .run(data.result.username, address);
          // Re-fetch user with updated username
          user = chatDb.getUserByAddress(address) || user;
        }
      }
    } catch (e) {
      // Silently fail - username sync is best-effort
      console.debug(`Failed to sync username for ${address}:`, e);
    }
  }
  
  return user;
}

/**
 * Resolver implementations.
 */
export const resolvers = {
  async worldChatMessages(
    args: { limit?: number; beforeId?: string },
    context: ChatContext
  ): Promise<any[]> {
    try {
      const worldRoom = chatDb.getOrCreateWorldRoom();
      const beforeIdNum = args.beforeId ? parseInt(args.beforeId, 10) : undefined;
      const messages = chatDb.getRoomMessages(
        worldRoom.id,
        args.limit || 50,
        beforeIdNum
      );

      // Reverse to show newest at bottom and enrich with sender info
      const enrichedMessages = await Promise.all(
        messages.reverse().map(async (msg) => {
          try {
            return await enrichMessage(msg);
          } catch (e: any) {
            console.error(`Error enriching message ${msg.id}:`, e);
            throw new Error(`Failed to enrich message: ${e.message}`);
          }
        })
      );
      return enrichedMessages;
    } catch (e: any) {
      console.error("Error in worldChatMessages:", e);
      throw e;
    }
  },

  async dmRooms(context: ChatContext): Promise<any[]> {
    if (!context.currentUser) {
      return [];
    }

    const rooms = chatDb.getDmRoomsForUser(context.currentUser.id);
    
    // Enrich with members and last message
    return await Promise.all(rooms.map(async (room) => {
      const members = chatDb.getRoomMembers(room.id).map((m) => ({
        id: String(m.id),
        address: m.address,
        username: m.username,
        displayName: m.display_name,
        isArchon: m.is_archon === 1,
      }));
      
      const lastMessage = chatDb.getLastMessage(room.id);
      
      return {
        id: String(room.id),
        type: room.type,
        slug: room.slug,
        members,
        lastMessage: lastMessage ? await enrichMessage(lastMessage) : null,
      };
    }));
  },

  async roomMessages(
    args: { roomId: string; limit?: number; beforeId?: string },
    context: ChatContext
  ): Promise<any[]> {
    const roomId = parseInt(args.roomId, 10);
    
    // Check access (world room is open to all)
    if (context.currentUser) {
      const hasAccess = chatDb.isRoomMember(roomId, context.currentUser.id);
      if (!hasAccess) {
        throw new Error("Access denied to this room");
      }
    }

    const beforeIdNum = args.beforeId ? parseInt(args.beforeId, 10) : undefined;
    const messages = chatDb.getRoomMessages(
      roomId,
      args.limit || 50,
      beforeIdNum
    );

    // Reverse to show newest at bottom
    const enrichedMessages = await Promise.all(
      messages.reverse().map(enrichMessage)
    );
    return enrichedMessages;
  },

  async sendWorldMessage(
    args: { content: string; nftId?: string | null; mediaUrl?: string | null; mediaType?: string | null },
    context: ChatContext
  ): Promise<any> {
    if (!context.currentUser) {
      throw new Error("Authentication required");
    }

    if (!args.content || args.content.trim().length === 0) {
      throw new Error("Message content cannot be empty");
    }

    const worldRoom = chatDb.getOrCreateWorldRoom();
    const message = chatDb.createMessage(
      worldRoom.id,
      context.currentUser.id,
      args.content,
      args.nftId || null,
      args.mediaUrl || null,
      args.mediaType || null
    );

    const enriched = await enrichMessage(message);
    
    // Publish to subscription
    context.pubsub.publish("WORLD_CHAT", enriched);

    return enriched;
  },

  async sendDirectMessage(
    args: { toUsername: string; content: string; nftId?: string | null; mediaUrl?: string | null; mediaType?: string | null },
    context: ChatContext
  ): Promise<any> {
    if (!context.currentUser) {
      throw new Error("Authentication required");
    }

    if (!args.content || args.content.trim().length === 0) {
      throw new Error("Message content cannot be empty");
    }

    // Find recipient
    const recipient = chatDb.getUserByUsername(args.toUsername);
    if (!recipient) {
      throw new Error(`Recipient not found: @${args.toUsername}`);
    }

    // Get or create DM room
    const room = chatDb.getOrCreateDmRoom(
      context.currentUser.id,
      recipient.id
    );

    // Create message
    const message = chatDb.createMessage(
      room.id,
      context.currentUser.id,
      args.content,
      args.nftId || null,
      args.mediaUrl || null,
      args.mediaType || null
    );

    const enriched = await enrichMessage(message);
    
    // Publish to subscription
    context.pubsub.publish(`ROOM_${room.id}`, enriched);

    return enriched;
  },

  async blurMedia(
    args: { messageId: string },
    context: ChatContext
  ): Promise<any> {
    if (!context.currentUser) {
      throw new Error("Authentication required");
    }

    const messageId = parseInt(args.messageId, 10);
    if (isNaN(messageId)) {
      throw new Error("Invalid message ID");
    }

    const blurredMessage = chatDb.blurMessage(messageId);
    if (!blurredMessage) {
      throw new Error("Message not found or does not contain media");
    }

    const enriched = await enrichMessage(blurredMessage);
    
    // Publish update to room subscription
    context.pubsub.publish(`ROOM_${blurredMessage.room_id}`, enriched);
    
    // Also publish to world chat if it's a world message
    const worldRoom = chatDb.getOrCreateWorldRoom();
    if (blurredMessage.room_id === worldRoom.id) {
      context.pubsub.publish("WORLD_CHAT", enriched);
    }

    return enriched;
  },

  async sendRoomMessage(
    args: { roomId: string; content: string; nftId?: string | null; mediaUrl?: string | null; mediaType?: string | null },
    context: ChatContext
  ): Promise<any> {
    if (!context.currentUser) {
      throw new Error("Authentication required");
    }

    if (!args.content || args.content.trim().length === 0) {
      throw new Error("Message content cannot be empty");
    }

    const roomId = parseInt(args.roomId, 10);
    if (isNaN(roomId)) {
      throw new Error("Invalid room ID");
    }

    // Check if room exists
    const room = chatDb.getRoomById(roomId);
    if (!room) {
      throw new Error("Room not found");
    }

    // Check if user is a member (for custom rooms) or allow for world room
    if (room.type === "custom") {
      if (!chatDb.isRoomMember(roomId, context.currentUser.id)) {
        throw new Error("You must join this room before sending messages");
      }
    }

    // Create message
    const message = chatDb.createMessage(
      roomId,
      context.currentUser.id,
      args.content,
      args.nftId || null,
      args.mediaUrl || null,
      args.mediaType || null
    );

    const enriched = await enrichMessage(message);
    
    // Publish to subscription
    context.pubsub.publish(`ROOM_${roomId}`, enriched);
    
    // Also publish to world chat if it's a world message
    if (room.type === "world") {
      context.pubsub.publish("WORLD_CHAT", enriched);
    }

    return enriched;
  },

  async customRooms(context: ChatContext): Promise<any[]> {
    // Return all custom rooms (public listing)
    // No authentication required to view rooms
    const rooms = chatDb.getAllCustomRooms();
    return await Promise.all(rooms.map(async (room) => {
      const members = chatDb.getRoomMembers(room.id);
      const moderators = chatDb.getRoomModerators(room.id);
      const activeUsers = chatDb.getActiveUsersInRoom(room.id);
      const lastMessage = chatDb.getLastMessage(room.id);
      const musicQueue = chatDb.getRoomMusicQueue(room.id);
      
      const creator = room.creator_id 
        ? (chatDb.getUserById(room.creator_id) || null)
        : null;
      
      return {
        id: String(room.id),
        type: room.type,
        slug: room.slug,
        name: room.name,
        description: room.description,
        creator: creator ? {
          id: String(creator.id),
          address: creator.address,
          username: creator.username,
          displayName: creator.display_name || null,
          isArchon: creator.is_archon === 1,
        } : null,
        moderators: moderators.map((m) => ({
          id: String(m.id),
          address: m.address,
          username: m.username,
          displayName: m.display_name || null,
          isArchon: m.is_archon === 1,
        })),
        members: members.map((m) => ({
          id: String(m.id),
          address: m.address,
          username: m.username,
          displayName: m.display_name || null,
          isArchon: m.is_archon === 1,
        })),
        activeUsers: activeUsers.map((u) => ({
          id: String(u.id),
          address: u.address,
          username: u.username,
          displayName: u.display_name || null,
          isArchon: u.is_archon === 1,
        })),
        lastMessage: lastMessage ? await enrichMessage(lastMessage) : null,
        settings: {
          fontFamily: room.font_family || 'system-ui',
          fontSize: room.font_size || 14,
          rules: room.rules || null,
        },
        musicQueue: musicQueue.map((m) => ({
          id: String(m.id),
          roomId: String(m.room_id),
          sourceType: m.source_type,
          sourceUrl: m.source_url,
          title: m.title || null,
          artist: m.artist || null,
          position: m.position,
          isPlaying: m.is_playing === 1,
          createdAt: m.created_at,
        })),
      };
    }));
  },

  async roomSettings(args: { roomId: string }, context: ChatContext): Promise<any> {
    const roomId = parseInt(args.roomId, 10);
    const room = chatDb.getRoomById(roomId);
    if (!room) {
      throw new Error("Room not found");
    }
    return {
      fontFamily: room.font_family || 'system-ui',
      fontSize: room.font_size || 14,
      rules: room.rules || null,
    };
  },

  async roomSystemMessages(args: { roomId: string }, context: ChatContext): Promise<any[]> {
    const roomId = parseInt(args.roomId, 10);
    const messages = chatDb.getSystemMessages(roomId);
    return messages.map((m) => ({
      id: String(m.id),
      roomId: String(m.room_id),
      content: m.content,
      intervalSeconds: m.interval_seconds,
      lastSentAt: m.last_sent_at || null,
      isActive: m.is_active === 1,
      createdAt: m.created_at,
    }));
  },

  async createCustomRoom(
    args: { name: string; description?: string | null; slug: string },
    context: ChatContext
  ): Promise<any> {
    if (!context.currentUser) {
      throw new Error("Authentication required");
    }

    // Validate slug is unique
    const existing = chatDb.getRoomBySlug(args.slug);
    if (existing) {
      throw new Error("Room slug already taken");
    }

    // Create room
    const room = chatDb.createCustomRoom(
      args.name,
      args.description || null,
      context.currentUser.id,
      args.slug
    );

    // Return enriched room
    const members = chatDb.getRoomMembers(room.id);
    const moderators = chatDb.getRoomModerators(room.id);
    const musicQueue = chatDb.getRoomMusicQueue(room.id);

    return {
      id: String(room.id),
      type: room.type,
      slug: room.slug,
      name: room.name,
      description: room.description,
      creator: {
        id: String(context.currentUser.id),
        address: context.currentUser.address,
        username: context.currentUser.username,
        displayName: context.currentUser.display_name || null,
        isArchon: context.currentUser.is_archon === 1,
      },
      moderators: moderators.map((m) => ({
        id: String(m.id),
        address: m.address,
        username: m.username,
        displayName: m.display_name || null,
        isArchon: m.is_archon === 1,
      })),
      members: members.map((m) => ({
        id: String(m.id),
        address: m.address,
        username: m.username,
        displayName: m.display_name || null,
        isArchon: m.is_archon === 1,
      })),
      lastMessage: null,
      settings: {
        fontFamily: room.font_family || 'system-ui',
        fontSize: room.font_size || 14,
        rules: room.rules || null,
      },
      musicQueue: musicQueue.map((m) => ({
        id: String(m.id),
        roomId: String(m.room_id),
        sourceType: m.source_type,
        sourceUrl: m.source_url,
        title: m.title || null,
        artist: m.artist || null,
        position: m.position,
        isPlaying: m.is_playing === 1,
        createdAt: m.created_at,
      })),
    };
  },

  async joinCustomRoom(
    args: { roomId: string },
    context: ChatContext
  ): Promise<any> {
    if (!context.currentUser) {
      throw new Error("Authentication required");
    }

    const roomId = parseInt(args.roomId, 10);
    const room = chatDb.getRoomById(roomId);
    if (!room || room.type !== 'custom') {
      throw new Error("Room not found or not a custom room");
    }

    // Add user as member if not already
    const members = chatDb.getRoomMembers(roomId);
    const isMember = members.some(m => m.id === context.currentUser!.id);
    
    if (!isMember) {
      const db = getDb();
      db.prepare(
        "INSERT INTO chat_room_members (room_id, user_id, is_moderator) VALUES (?, ?, 0)"
      ).run(roomId, context.currentUser.id);
    }

    // Return enriched room
    const updatedMembers = chatDb.getRoomMembers(roomId);
    const moderators = chatDb.getRoomModerators(roomId);
    const lastMessage = chatDb.getLastMessage(roomId);
    const musicQueue = chatDb.getRoomMusicQueue(roomId);
    
    const creator = room.creator_id 
      ? (chatDb.getUserById(room.creator_id) || null)
      : null;

    return {
      id: String(room.id),
      type: room.type,
      slug: room.slug,
      name: room.name,
      description: room.description,
      creator: creator ? {
        id: String(creator.id),
        address: creator.address,
        username: creator.username,
        displayName: creator.display_name || null,
        isArchon: creator.is_archon === 1,
      } : null,
      moderators: moderators.map((m) => ({
        id: String(m.id),
        address: m.address,
        username: m.username,
        displayName: m.display_name || null,
        isArchon: m.is_archon === 1,
      })),
      members: updatedMembers.map((m) => ({
        id: String(m.id),
        address: m.address,
        username: m.username,
        displayName: m.display_name || null,
        isArchon: m.is_archon === 1,
      })),
      lastMessage: lastMessage ? await enrichMessage(lastMessage) : null,
      settings: {
        fontFamily: room.font_family || 'system-ui',
        fontSize: room.font_size || 14,
        rules: room.rules || null,
      },
      musicQueue: musicQueue.map((m) => ({
        id: String(m.id),
        roomId: String(m.room_id),
        sourceType: m.source_type,
        sourceUrl: m.source_url,
        title: m.title || null,
        artist: m.artist || null,
        position: m.position,
        isPlaying: m.is_playing === 1,
        createdAt: m.created_at,
      })),
    };
  },

  async leaveCustomRoom(
    args: { roomId: string },
    context: ChatContext
  ): Promise<boolean> {
    if (!context.currentUser) {
      throw new Error("Authentication required");
    }
    const roomId = parseInt(args.roomId, 10);
    const room = chatDb.getRoomById(roomId);
    if (!room) {
      throw new Error("Room not found");
    }
    if (room.type !== "custom") {
      throw new Error("Can only leave custom rooms");
    }
    
    const success = chatDb.leaveCustomRoom(roomId, context.currentUser.id);
    if (!success) {
      throw new Error("Failed to leave room");
    }
    
    return true;
  },

  async promoteToModerator(
    args: { roomId: string; username: string },
    context: ChatContext
  ): Promise<boolean> {
    if (!context.currentUser) {
      throw new Error("Authentication required");
    }

    const roomId = parseInt(args.roomId, 10);
    
    // Check if World Chat (never allow moderation changes)
    const room = chatDb.getRoomById(roomId);
    if (room && room.type === 'world') {
      throw new Error("Cannot modify World Chat");
    }

    // Check if user is moderator
    if (!chatDb.isRoomModerator(roomId, context.currentUser.id)) {
      throw new Error("Only moderators can promote users");
    }

    // Find user by username
    const user = chatDb.getUserByUsername(args.username);
    if (!user) {
      throw new Error("User not found");
    }

    // Add as moderator
    chatDb.addRoomModerator(roomId, user.id);
    return true;
  },

  async removeModerator(
    args: { roomId: string; username: string },
    context: ChatContext
  ): Promise<boolean> {
    if (!context.currentUser) {
      throw new Error("Authentication required");
    }

    const roomId = parseInt(args.roomId, 10);
    
    // Check if World Chat (never allow moderation changes)
    const room = chatDb.getRoomById(roomId);
    if (room && room.type === 'world') {
      throw new Error("Cannot modify World Chat");
    }

    // Check if user is moderator
    if (!chatDb.isRoomModerator(roomId, context.currentUser.id)) {
      throw new Error("Only moderators can remove moderators");
    }

    // Find user by username
    const user = chatDb.getUserByUsername(args.username);
    if (!user) {
      throw new Error("User not found");
    }

    // Don't allow removing the creator
    if (room && room.creator_id === user.id) {
      throw new Error("Cannot remove room creator as moderator");
    }

    // Remove moderator
    chatDb.removeRoomModerator(roomId, user.id);
    return true;
  },

  async updateRoomSettings(
    args: { roomId: string; fontFamily?: string | null; fontSize?: number | null; rules?: string | null },
    context: ChatContext
  ): Promise<any> {
    if (!context.currentUser) {
      throw new Error("Authentication required");
    }

    const roomId = parseInt(args.roomId, 10);
    
    // Check if World Chat (never allow settings changes)
    const room = chatDb.getRoomById(roomId);
    if (room && room.type === 'world') {
      throw new Error("Cannot modify World Chat settings");
    }

    // Check if user is moderator
    if (!chatDb.isRoomModerator(roomId, context.currentUser.id)) {
      throw new Error("Only moderators can update room settings");
    }

    // Update settings
    chatDb.updateRoomSettings(roomId, {
      fontFamily: args.fontFamily || undefined,
      fontSize: args.fontSize || undefined,
      rules: args.rules || undefined,
    });

    // Return updated settings
    const updatedRoom = chatDb.getRoomById(roomId);
    return {
      fontFamily: updatedRoom?.font_family || 'system-ui',
      fontSize: updatedRoom?.font_size || 14,
      rules: updatedRoom?.rules || null,
    };
  },

  async createSystemMessage(
    args: { roomId: string; content: string; intervalSeconds?: number | null },
    context: ChatContext
  ): Promise<any> {
    if (!context.currentUser) {
      throw new Error("Authentication required");
    }

    const roomId = parseInt(args.roomId, 10);
    
    // Check if World Chat (never allow system messages)
    const room = chatDb.getRoomById(roomId);
    if (room && room.type === 'world') {
      throw new Error("Cannot create system messages in World Chat");
    }

    // Check if user is moderator
    if (!chatDb.isRoomModerator(roomId, context.currentUser.id)) {
      throw new Error("Only moderators can create system messages");
    }

    const message = chatDb.createSystemMessage(
      roomId,
      args.content,
      args.intervalSeconds || 3600
    );

    return {
      id: String(message.id),
      roomId: String(message.room_id),
      content: message.content,
      intervalSeconds: message.interval_seconds,
      lastSentAt: message.last_sent_at || null,
      isActive: message.is_active === 1,
      createdAt: message.created_at,
    };
  },

  async addMusicToQueue(
    args: { roomId: string; sourceType: string; sourceUrl: string; title?: string | null; artist?: string | null },
    context: ChatContext
  ): Promise<any> {
    if (!context.currentUser) {
      throw new Error("Authentication required");
    }

    const roomId = parseInt(args.roomId, 10);
    
    // Check if user is moderator (for custom rooms) or allow for World Chat
    const room = chatDb.getRoomById(roomId);
    if (room && room.type === 'custom') {
      if (!chatDb.isRoomModerator(roomId, context.currentUser.id)) {
        throw new Error("Only moderators can add music to custom rooms");
      }
    }

    // Validate source type
    const validTypes = ['spotify', 'soundcloud', 'youtube', 'nft'];
    if (!validTypes.includes(args.sourceType.toLowerCase())) {
      throw new Error(`Invalid source type. Must be one of: ${validTypes.join(', ')}`);
    }

    const musicItem = chatDb.addMusicToQueue(
      roomId,
      args.sourceType.toLowerCase(),
      args.sourceUrl,
      args.title || undefined,
      args.artist || undefined
    );

    return {
      id: String(musicItem.id),
      roomId: String(musicItem.room_id),
      sourceType: musicItem.source_type,
      sourceUrl: musicItem.source_url,
      title: musicItem.title || null,
      artist: musicItem.artist || null,
      position: musicItem.position,
      isPlaying: musicItem.is_playing === 1,
      createdAt: musicItem.created_at,
    };
  },

  async setPlayingMusic(
    args: { roomId: string; musicId?: string | null },
    context: ChatContext
  ): Promise<boolean> {
    if (!context.currentUser) {
      throw new Error("Authentication required");
    }

    const roomId = parseInt(args.roomId, 10);
    
    // Check if user is moderator (for custom rooms) or allow for World Chat
    const room = chatDb.getRoomById(roomId);
    if (room && room.type === 'custom') {
      if (!chatDb.isRoomModerator(roomId, context.currentUser.id)) {
        throw new Error("Only moderators can control music in custom rooms");
      }
    }

    const musicId = args.musicId ? parseInt(args.musicId, 10) : null;
    chatDb.setPlayingMusic(roomId, musicId);
    return true;
  },

  async removeMusicFromQueue(
    args: { musicId: string },
    context: ChatContext
  ): Promise<boolean> {
    if (!context.currentUser) {
      throw new Error("Authentication required");
    }

    const musicId = parseInt(args.musicId, 10);
    
    // Get the music item to find the room
    const db = getDb();
    const musicItem = db
      .prepare("SELECT * FROM room_music_queue WHERE id = ?")
      .get(musicId) as any;
    
    if (!musicItem) {
      throw new Error("Music item not found");
    }

    const roomId = musicItem.room_id;
    const room = chatDb.getRoomById(roomId);
    
    // Check if user is moderator (for custom rooms) or allow for World Chat
    if (room && room.type === 'custom') {
      if (!chatDb.isRoomModerator(roomId, context.currentUser.id)) {
        throw new Error("Only moderators can remove music from custom rooms");
      }
    }

    chatDb.removeMusicFromQueue(musicId);
    return true;
  },

  async userChatAnalytics(
    args: { address: string },
    context: ChatContext
  ): Promise<any> {
    // No authentication required - analytics are public
    return chatDb.getUserChatAnalytics(args.address);
  },

  async userMessageActivity(
    args: { address: string },
    context: ChatContext
  ): Promise<any[]> {
    // No authentication required - analytics are public
    return chatDb.getUserMessageActivity(args.address);
  },

  // Developer Registry resolvers
  async getDevelopers(
    args: {},
    context: ChatContext
  ): Promise<any[]> {
    const devs = listDevelopers();
    return devs.map(d => ({
      address: d.address,
      username: d.username,
      reputation: d.reputation,
      createdAt: new Date(d.created_at).toISOString(),
    }));
  },

  async getDeveloper(
    args: { address?: string; username?: string },
    context: ChatContext
  ): Promise<any | null> {
    let dev = null;
    if (args.address) {
      dev = getDeveloperByAddress(args.address);
    } else if (args.username) {
      // Normalize username (lowercase, trim) for lookup
      const normalizedUsername = args.username.toLowerCase().trim();
      dev = getDeveloperByUsername(normalizedUsername);
    }
    if (!dev) {
      console.log("Developer not found:", args);
      return null;
    }
    return {
      address: dev.address,
      username: dev.username,
      reputation: dev.reputation,
      createdAt: new Date(dev.created_at).toISOString(),
    };
  },

  async getProjects(
    args: {},
    context: ChatContext
  ): Promise<any[]> {
    const projects = listProjects();
    return projects.map(p => ({
      slug: p.slug,
      name: p.name,
      description: p.description,
      createdAt: new Date(p.created_at).toISOString(),
    }));
  },

  async getProject(
    args: { slug: string },
    context: ChatContext
  ): Promise<any | null> {
    const project = getProjectBySlug(args.slug);
    if (!project) return null;
    return {
      slug: project.slug,
      name: project.name,
      description: project.description,
      createdAt: new Date(project.created_at).toISOString(),
    };
  },

  async getProjectMaintainers(
    slug: string,
    context: ChatContext
  ): Promise<any[]> {
    const maintainers = getMaintainers(slug);
    return maintainers.map(d => ({
      address: d.address,
      username: d.username,
      reputation: d.reputation,
      createdAt: new Date(d.created_at).toISOString(),
    }));
  },

  async registerDeveloper(
    args: { username: string },
    context: ChatContext
  ): Promise<any> {
    if (!context.currentUser) {
      throw new Error("Authentication required");
    }

    const address = context.currentUser.address;
    const username = args.username.toLowerCase().trim();

    // Validate username
    if (!/^[a-z0-9_]{3,32}$/.test(username)) {
      throw new Error("Invalid username: must be 3-32 characters, lowercase alphanumeric + underscore");
    }

    // Check if username is already taken by a different address
    const existingByUsername = getDeveloperByUsername(username);
    if (existingByUsername && existingByUsername.address.toLowerCase() !== address.toLowerCase()) {
      throw new Error(`Username "${username}" is already registered to a different address. Please choose a different username.`);
    }

    // Check if address already has a developer record
    const existingByAddress = getDeveloperByAddress(address);
    if (existingByAddress) {
      // If address is already registered, allow updating username if it matches the provided username
      if (existingByAddress.username.toLowerCase() === username.toLowerCase()) {
        // Already registered with this username - return existing profile
        return {
          address: existingByAddress.address,
          username: existingByAddress.username,
          reputation: existingByAddress.reputation,
          createdAt: new Date(existingByAddress.created_at).toISOString(),
        };
      } else {
        // Address is registered but with a different username
        // Allow updating to the new username if it's not taken
        if (existingByUsername) {
          throw new Error(`Username "${username}" is already taken. Your current developer profile uses username "${existingByAddress.username}".`);
        }
        // Update the username
        upsertDeveloper(address, username, existingByAddress.reputation);
        const updated = getDeveloperByAddress(address);
        return {
          address: updated.address,
          username: updated.username,
          reputation: updated.reputation,
          createdAt: new Date(updated.created_at).toISOString(),
        };
      }
    }

    // Try to register on-chain first (if RPC available)
    try {
      const response = await fetch(DEMIURGE_RPC_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "dev_registerDeveloper",
          params: {
            address,
            username,
            signed_tx_hex: "", // TODO: Sign transaction properly
          },
          id: 1,
        }),
      });
      const data = await response.json();
      if (data.error) {
        // Check if error is about username already taken or address already registered
        const errorMsg = data.error.message || "";
        if (errorMsg.includes("already taken") || errorMsg.includes("already registered")) {
          throw new Error(errorMsg);
        }
        console.warn("On-chain registration failed:", data.error);
        // Continue with off-chain registration
      }
    } catch (e: any) {
      // If it's a user-facing error, re-throw it
      if (e.message && (e.message.includes("already taken") || e.message.includes("already registered"))) {
        throw e;
      }
      console.warn("Failed to register on-chain:", e);
      // Continue with off-chain registration
    }

    // Upsert in SQLite
    upsertDeveloper(address, username, 0);

    const dev = getDeveloperByAddress(address);
    if (!dev) {
      throw new Error("Failed to create developer profile");
    }

    return {
      address: dev.address,
      username: dev.username,
      reputation: dev.reputation,
      createdAt: new Date(dev.created_at).toISOString(),
    };
  },

  async createProject(
    args: { slug: string; name: string; description?: string },
    context: ChatContext
  ): Promise<any> {
    if (!context.currentUser) {
      throw new Error("Authentication required");
    }

    const slug = args.slug.toLowerCase().trim();
    if (!/^[a-z0-9_-]{3,64}$/.test(slug)) {
      throw new Error("Invalid slug: must be 3-64 characters, lowercase alphanumeric + dash/underscore");
    }

    const project = createProject(slug, args.name, args.description || null);
    
    // Add creator as maintainer
    try {
      addMaintainer(slug, context.currentUser.address);
    } catch (e) {
      // Developer might not be registered yet
      console.warn("Failed to add creator as maintainer:", e);
    }

    return {
      slug: project.slug,
      name: project.name,
      description: project.description,
      createdAt: new Date(project.created_at).toISOString(),
    };
  },

  async addProjectMaintainer(
    args: { slug: string; address: string },
    context: ChatContext
  ): Promise<any> {
    if (!context.currentUser) {
      throw new Error("Authentication required");
    }

    // Check if caller is already a maintainer
    const maintainers = getMaintainers(args.slug);
    const isMaintainer = maintainers.some(m => m.address === context.currentUser!.address);
    
    if (!isMaintainer) {
      throw new Error("Only project maintainers can add new maintainers");
    }

    addMaintainer(args.slug, args.address);
    
    const project = getProjectBySlug(args.slug);
    if (!project) {
      throw new Error("Project not found");
    }

    return {
      slug: project.slug,
      name: project.name,
      description: project.description,
      createdAt: new Date(project.created_at).toISOString(),
    };
  },

  // Dev Capsules resolvers
  async getDevCapsulesByOwner(
    args: { owner: string },
    context: ChatContext
  ): Promise<any[]> {
    // Try to fetch from chain RPC first, then cache in SQLite
    try {
      const response = await fetch(DEMIURGE_RPC_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "devCapsule_listByOwner",
          params: { owner: args.owner },
          id: 1,
        }),
      });
      const data = await response.json();
      if (data.result && Array.isArray(data.result)) {
        // Cache in SQLite
        for (const capsule of data.result) {
          upsertDevCapsule(
            capsule.id,
            capsule.owner,
            capsule.project_slug,
            capsule.status,
            capsule.created_at,
            capsule.updated_at,
            capsule.notes
          );
        }
        return data.result.map((c: any) => ({
          id: String(c.id),
          owner: c.owner,
          projectSlug: c.project_slug,
          status: c.status,
          createdAt: c.created_at,
          updatedAt: c.updated_at,
          notes: c.notes,
        }));
      }
    } catch (e) {
      console.warn("Failed to fetch capsules from chain:", e);
    }

    // Fallback to SQLite
    const capsules = getDevCapsulesByOwner(args.owner);
    return capsules.map(c => ({
      id: String(c.id),
      owner: c.owner_address,
      projectSlug: c.project_slug,
      status: c.status,
      createdAt: c.created_at,
      updatedAt: c.updated_at,
      notes: c.notes,
    }));
  },

  async getDevCapsulesByProject(
    args: { projectSlug: string },
    context: ChatContext
  ): Promise<any[]> {
    // For now, just read from SQLite (could sync from chain if needed)
    const capsules = getDevCapsulesByProject(args.projectSlug);
    return capsules.map(c => ({
      id: String(c.id),
      owner: c.owner_address,
      projectSlug: c.project_slug,
      status: c.status,
      createdAt: c.created_at,
      updatedAt: c.updated_at,
      notes: c.notes,
    }));
  },

  async getDevCapsule(
    args: { id: string },
    context: ChatContext
  ): Promise<any | null> {
    const id = parseInt(args.id, 10);
    if (isNaN(id)) {
      return null;
    }

    // Try chain RPC first
    try {
      const response = await fetch(DEMIURGE_RPC_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "devCapsule_get",
          params: { id },
          id: 1,
        }),
      });
      const data = await response.json();
      if (data.result && data.result !== null) {
        // Cache in SQLite
        upsertDevCapsule(
          data.result.id,
          data.result.owner,
          data.result.project_slug,
          data.result.status,
          data.result.created_at,
          data.result.updated_at,
          data.result.notes
        );
        return {
          id: String(data.result.id),
          owner: data.result.owner,
          projectSlug: data.result.project_slug,
          status: data.result.status,
          createdAt: data.result.created_at,
          updatedAt: data.result.updated_at,
          notes: data.result.notes,
        };
      }
    } catch (e) {
      console.warn("Failed to fetch capsule from chain:", e);
    }

    // Fallback to SQLite
    const capsule = getDevCapsuleById(id);
    if (!capsule) {
      return null;
    }
    return {
      id: String(capsule.id),
      owner: capsule.owner_address,
      projectSlug: capsule.project_slug,
      status: capsule.status,
      createdAt: capsule.created_at,
      updatedAt: capsule.updated_at,
      notes: capsule.notes,
    };
  },

  async createDevCapsule(
    args: { owner: string; projectSlug: string; notes: string },
    context: ChatContext
  ): Promise<any> {
    if (!context.currentUser) {
      throw new Error("Authentication required");
    }

    // Call chain RPC to create capsule
    try {
      const response = await fetch(DEMIURGE_RPC_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "devCapsule_create",
          params: {
            owner: args.owner,
            project_slug: args.projectSlug,
            notes: args.notes,
          },
          id: 1,
        }),
      });
      const data = await response.json();
      if (data.error) {
        throw new Error(data.error.message || "Failed to create capsule");
      }
      if (data.result) {
        // Cache in SQLite
        upsertDevCapsule(
          data.result.id,
          data.result.owner,
          data.result.project_slug,
          data.result.status,
          data.result.created_at,
          data.result.updated_at,
          data.result.notes
        );
        return {
          id: String(data.result.id),
          owner: data.result.owner,
          projectSlug: data.result.project_slug,
          status: data.result.status,
          createdAt: data.result.created_at,
          updatedAt: data.result.updated_at,
          notes: data.result.notes,
        };
      }
    } catch (e: any) {
      throw new Error(`Failed to create capsule: ${e.message}`);
    }
    throw new Error("Failed to create capsule: no result from RPC");
  },

  async updateDevCapsuleStatus(
    args: { id: string; status: string },
    context: ChatContext
  ): Promise<any> {
    if (!context.currentUser) {
      throw new Error("Authentication required");
    }

    const id = parseInt(args.id, 10);
    if (isNaN(id)) {
      throw new Error("Invalid capsule ID");
    }

    // Validate status
    const validStatuses = ["draft", "live", "paused", "archived"];
    if (!validStatuses.includes(args.status)) {
      throw new Error(`Invalid status. Must be one of: ${validStatuses.join(", ")}`);
    }

    // Call chain RPC to update status
    try {
      const response = await fetch(DEMIURGE_RPC_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "devCapsule_updateStatus",
          params: {
            id,
            status: args.status,
          },
          id: 1,
        }),
      });
      const data = await response.json();
      if (data.error) {
        throw new Error(data.error.message || "Failed to update capsule status");
      }
      if (data.result) {
        // Cache in SQLite
        upsertDevCapsule(
          data.result.id,
          data.result.owner,
          data.result.project_slug,
          data.result.status,
          data.result.created_at,
          data.result.updated_at,
          data.result.notes
        );
        return {
          id: String(data.result.id),
          owner: data.result.owner,
          projectSlug: data.result.project_slug,
          status: data.result.status,
          createdAt: data.result.created_at,
          updatedAt: data.result.updated_at,
          notes: data.result.notes,
        };
      }
    } catch (e: any) {
      throw new Error(`Failed to update capsule status: ${e.message}`);
    }
    throw new Error("Failed to update capsule status: no result from RPC");
  },
};

/**
 * Enrich a message with sender information.
 */
/**
 * Sync username from chain if it looks like an address (async, non-blocking).
 */
async function syncUsernameFromChain(address: string, currentUsername: string): Promise<void> {
  // Sync if username looks like an address (hex pattern) or matches address prefix
  const usernameIsAddress = currentUsername.length >= 16 && /^[0-9a-f]+$/i.test(currentUsername);
  const usernameMatchesAddress = currentUsername === address.slice(0, currentUsername.length);
  
  if (usernameIsAddress || usernameMatchesAddress) {
    try {
      console.log(`[syncUsernameFromChain] Fetching profile for ${address.slice(0, 8)}...`);
      const response = await fetch(DEMIURGE_RPC_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "urgeid_get",
          params: { address },
          id: 1,
        }),
      });
      
      const data = await response.json();
      console.log(`[syncUsernameFromChain] RPC response:`, JSON.stringify(data).slice(0, 200));
      
      if (data.result?.username && data.result.username !== currentUsername) {
        console.log(`[syncUsernameFromChain] Updating username from "${currentUsername.slice(0, 16)}" to "${data.result.username}"`);
        // Update username in chat_users table
        const db = getDb();
        
        // Check if username is taken by a different user
        const existing = db
          .prepare("SELECT id, address FROM chat_users WHERE username = ? AND address != ?")
          .get(data.result.username, address) as { id: number; address: string } | undefined;
        
        if (!existing) {
          // Username is available, update it
          const result = db.prepare("UPDATE chat_users SET username = ? WHERE address = ?")
            .run(data.result.username, address);
          console.log(`[syncUsernameFromChain] Updated ${result.changes} row(s) for address ${address.slice(0, 8)}...`);
        } else {
          // Username is taken by another user - check if that user's address matches
          // This could happen if the same address was registered twice with different usernames
          console.log(`[syncUsernameFromChain] Username "${data.result.username}" is taken by address ${existing.address.slice(0, 8)}...`);
          
          // If the existing user with this username has a different address, we have a conflict
          // In this case, we should update the existing user's username to their address
          // and then update our user to the chain username
          if (existing.address !== address) {
            console.log(`[syncUsernameFromChain] Resolving conflict: updating existing user ${existing.address.slice(0, 8)}... to use address as username`);
            // Update the conflicting user to use their address as username
            db.prepare("UPDATE chat_users SET username = ? WHERE id = ?")
              .run(existing.address.slice(0, 16), existing.id);
            
            // Now update our user to the chain username
            const result = db.prepare("UPDATE chat_users SET username = ? WHERE address = ?")
              .run(data.result.username, address);
            console.log(`[syncUsernameFromChain] Resolved conflict: updated ${result.changes} row(s) for address ${address.slice(0, 8)}...`);
          } else {
            // Same address, just update it
            const result = db.prepare("UPDATE chat_users SET username = ? WHERE address = ?")
              .run(data.result.username, address);
            console.log(`[syncUsernameFromChain] Updated ${result.changes} row(s) for same address`);
          }
        }
      } else if (!data.result?.username) {
        console.log(`[syncUsernameFromChain] No username found in chain for address ${address.slice(0, 8)}...`);
      } else {
        console.log(`[syncUsernameFromChain] Username already matches: "${data.result.username}"`);
      }
    } catch (e) {
      // Log errors for debugging
      console.error(`[syncUsernameFromChain] Failed to sync username for ${address.slice(0, 8)}...:`, e);
    }
  } else {
    console.log(`[syncUsernameFromChain] Skipping sync - username "${currentUsername}" doesn't look like an address`);
  }
}

async function enrichMessage(message: ChatMessage): Promise<any> {
  try {
    const db = getDb();
    let userRow = db
      .prepare("SELECT * FROM chat_users WHERE id = ?")
      .get(message.sender_id) as ChatUser | undefined;

    if (!userRow) {
      throw new Error(`Sender not found for message ${message.id}`);
    }

    // Always try to sync username from chain if:
    // 1. Username looks like an address (hex pattern, >= 16 chars), OR
    // 2. Username exactly matches the address (first 16 chars)
    const usernameIsAddress = userRow.username.length >= 16 && /^[0-9a-f]+$/i.test(userRow.username);
    const usernameMatchesAddress = userRow.username === userRow.address.slice(0, userRow.username.length);
    
    if (usernameIsAddress || usernameMatchesAddress) {
      console.log(`[enrichMessage] Syncing username for address ${userRow.address.slice(0, 8)}... (current: ${userRow.username})`);
      // Sync and wait for update, then re-fetch user
      await syncUsernameFromChain(userRow.address, userRow.username);
      // Re-fetch user to get updated username
      userRow = db
        .prepare("SELECT * FROM chat_users WHERE id = ?")
        .get(message.sender_id) as ChatUser | undefined;
      if (!userRow) {
        throw new Error(`Sender not found for message ${message.id} after sync`);
      }
      console.log(`[enrichMessage] After sync: username = ${userRow.username}`);
    }

    const finalUserRow = userRow;

    // Convert database fields to GraphQL schema format
    return {
      id: String(message.id),
      roomId: String(message.room_id),
      sender: {
        id: String(finalUserRow.id),
        address: finalUserRow.address,
        username: finalUserRow.username,
        displayName: finalUserRow.display_name || null,
        isArchon: finalUserRow.is_archon === 1,
      },
      content: message.content,
      nftId: message.nft_id || null,
      mediaUrl: message.media_url || null,
      mediaType: message.media_type || null,
      isBlurred: message.is_blurred === 1,
      createdAt: message.created_at,
    };
  } catch (e: any) {
    console.error(`Error enriching message ${message.id}:`, e);
    console.error("Message object:", message);
    throw new Error(`Failed to enrich message ${message.id}: ${e.message}`);
  }
}

