/**
 * GraphQL client for Abyss Gateway chat system.
 */

const ABYSS_GATEWAY_URL =
  process.env.NEXT_PUBLIC_ABYSS_GATEWAY_URL || "http://localhost:4000/graphql";

export interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string }>;
}

/**
 * Execute a GraphQL query or mutation.
 */
export async function graphqlRequest<T>(
  query: string,
  variables?: Record<string, any>,
  headers?: Record<string, string>
): Promise<T> {
  try {
    const response = await fetch(ABYSS_GATEWAY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const json: GraphQLResponse<T> = await response.json();

    if (json.errors) {
      const errorDetails = json.errors.map(e => e.message).join(", ");
      console.error("GraphQL errors:", json.errors);
      throw new Error(errorDetails);
    }

    if (!json.data) {
      console.error("No data in response:", json);
      throw new Error("No data returned from GraphQL query");
    }

    return json.data;
  } catch (error: any) {
    if (error.message?.includes("fetch") || error.message?.includes("Failed to fetch")) {
      throw new Error(`Connection failed: Unable to reach Abyss Gateway at ${ABYSS_GATEWAY_URL}. Make sure the gateway is running.`);
    }
    throw error;
  }
}

/**
 * Get headers with current user identity.
 */
export function getChatHeaders(address?: string, username?: string): Record<string, string> {
  const headers: Record<string, string> = {};
  
  if (address) {
    headers["x-demiurge-address"] = address;
  }
  
  if (username) {
    headers["x-demiurge-username"] = username;
  }
  
  return headers;
}

// GraphQL queries and mutations
export const QUERIES = {
  WORLD_CHAT_MESSAGES: `
    query WorldChatMessages($limit: Int, $beforeId: ID) {
      worldChatMessages(limit: $limit, beforeId: $beforeId) {
        id
        roomId
        sender {
          id
          address
          username
          displayName
          isArchon
        }
        content
        nftId
        mediaUrl
        mediaType
        isBlurred
        createdAt
      }
    }
  `,
  
  DM_ROOMS: `
    query DmRooms {
      dmRooms {
        id
        type
        slug
        members {
          id
          address
          username
          displayName
          isArchon
        }
        lastMessage {
          id
          content
          createdAt
          sender {
            username
          }
        }
      }
    }
  `,
  
  ROOM_MESSAGES: `
    query RoomMessages($roomId: ID!, $limit: Int, $beforeId: ID) {
      roomMessages(roomId: $roomId, limit: $limit, beforeId: $beforeId) {
        id
        roomId
        sender {
          id
          address
          username
          displayName
          isArchon
        }
        content
        nftId
        mediaUrl
        mediaType
        isBlurred
        createdAt
      }
    }
  `,
  CUSTOM_ROOMS: `
    query CustomRooms {
      customRooms {
        id
        type
        slug
        name
        description
        creator {
          id
          address
          username
          displayName
          isArchon
        }
        moderators {
          id
          address
          username
          displayName
          isArchon
        }
        members {
          id
          address
          username
          displayName
          isArchon
        }
        lastMessage {
          id
          roomId
          sender {
            id
            address
            username
            displayName
            isArchon
          }
          content
          createdAt
        }
        settings {
          fontFamily
          fontSize
          rules
        }
        musicQueue {
          id
          roomId
          sourceType
          sourceUrl
          title
          artist
          position
          isPlaying
          createdAt
        }
      }
    }
  `,
  ROOM_SETTINGS: `
    query RoomSettings($roomId: ID!) {
      roomSettings(roomId: $roomId) {
        fontFamily
        fontSize
        rules
      }
    }
  `,
  ROOM_SYSTEM_MESSAGES: `
    query RoomSystemMessages($roomId: ID!) {
      roomSystemMessages(roomId: $roomId) {
        id
        roomId
        content
        intervalSeconds
        lastSentAt
        isActive
        createdAt
      }
    }
  `,
  USER_CHAT_ANALYTICS: `
    query UserChatAnalytics($address: String!) {
      userChatAnalytics(address: $address) {
        totalMessages
        worldChatMessages
        dmMessages
        customRoomMessages
        roomsCreated
        roomsModerated
        mediaShared
        firstMessageAt
        lastMessageAt
      }
    }
  `,
  USER_MESSAGE_ACTIVITY: `
    query UserMessageActivity($address: String!) {
      userMessageActivity(address: $address) {
        date
        count
      }
    }
  `,
  DEV_CAPSULES_BY_PROJECT: `
    query DevCapsulesByProject($projectSlug: String!) {
      devCapsulesByProject(projectSlug: $projectSlug) {
        id
        owner
        projectSlug
        status
        createdAt
        updatedAt
        notes
      }
    }
  `,
  DEV_CAPSULES_BY_OWNER: `
    query DevCapsulesByOwner($owner: String!) {
      devCapsulesByOwner(owner: $owner) {
        id
        owner
        projectSlug
        status
        createdAt
        updatedAt
        notes
      }
    }
  `,
  DEV_CAPSULE: `
    query DevCapsule($id: ID!) {
      devCapsule(id: $id) {
        id
        owner
        projectSlug
        status
        createdAt
        updatedAt
        notes
      }
    }
  `,
};

export const MUTATIONS = {
  SEND_WORLD_MESSAGE: `
    mutation SendWorldMessage($content: String!, $nftId: String, $mediaUrl: String, $mediaType: String) {
      sendWorldMessage(content: $content, nftId: $nftId, mediaUrl: $mediaUrl, mediaType: $mediaType) {
        id
        roomId
        sender {
          id
          address
          username
          displayName
          isArchon
        }
        content
        nftId
        mediaUrl
        mediaType
        isBlurred
        createdAt
      }
    }
  `,
  
  SEND_DIRECT_MESSAGE: `
    mutation SendDirectMessage($toUsername: String!, $content: String!, $nftId: String, $mediaUrl: String, $mediaType: String) {
      sendDirectMessage(toUsername: $toUsername, content: $content, nftId: $nftId, mediaUrl: $mediaUrl, mediaType: $mediaType) {
        id
        roomId
        sender {
          id
          address
          username
          displayName
          isArchon
        }
        content
        nftId
        mediaUrl
        mediaType
        isBlurred
        createdAt
      }
    }
  `,
  SEND_ROOM_MESSAGE: `
    mutation SendRoomMessage($roomId: ID!, $content: String!, $nftId: String, $mediaUrl: String, $mediaType: String) {
      sendRoomMessage(roomId: $roomId, content: $content, nftId: $nftId, mediaUrl: $mediaUrl, mediaType: $mediaType) {
        id
        roomId
        sender {
          id
          address
          username
          displayName
          isArchon
        }
        content
        nftId
        mediaUrl
        mediaType
        isBlurred
        createdAt
      }
    }
  `,
  
  BLUR_MEDIA: `
    mutation BlurMedia($messageId: ID!) {
      blurMedia(messageId: $messageId) {
        id
        roomId
        sender {
          id
          address
          username
          displayName
          isArchon
        }
        content
        nftId
        mediaUrl
        mediaType
        isBlurred
        createdAt
      }
    }
  `,
  CREATE_CUSTOM_ROOM: `
    mutation CreateCustomRoom($name: String!, $description: String, $slug: String!) {
      createCustomRoom(name: $name, description: $description, slug: $slug) {
        id
        type
        slug
        name
        description
        creator {
          id
          address
          username
          displayName
          isArchon
        }
        moderators {
          id
          address
          username
          displayName
          isArchon
        }
        members {
          id
          address
          username
          displayName
          isArchon
        }
        settings {
          fontFamily
          fontSize
          rules
        }
        musicQueue {
          id
          roomId
          sourceType
          sourceUrl
          title
          artist
          position
          isPlaying
          createdAt
        }
      }
    }
  `,
  JOIN_CUSTOM_ROOM: `
    mutation JoinCustomRoom($roomId: ID!) {
      joinCustomRoom(roomId: $roomId) {
        id
        type
        slug
        name
        description
        creator {
          id
          address
          username
          displayName
          isArchon
        }
        moderators {
          id
          address
          username
          displayName
          isArchon
        }
        members {
          id
          address
          username
          displayName
          isArchon
        }
        settings {
          fontFamily
          fontSize
          rules
        }
        musicQueue {
          id
          roomId
          sourceType
          sourceUrl
          title
          artist
          position
          isPlaying
          createdAt
        }
      }
    }
  `,
  LEAVE_CUSTOM_ROOM: `
    mutation LeaveCustomRoom($roomId: ID!) {
      leaveCustomRoom(roomId: $roomId)
    }
  `,
  PROMOTE_TO_MODERATOR: `
    mutation PromoteToModerator($roomId: ID!, $username: String!) {
      promoteToModerator(roomId: $roomId, username: $username)
    }
  `,
  REMOVE_MODERATOR: `
    mutation RemoveModerator($roomId: ID!, $username: String!) {
      removeModerator(roomId: $roomId, username: $username)
    }
  `,
  UPDATE_ROOM_SETTINGS: `
    mutation UpdateRoomSettings($roomId: ID!, $fontFamily: String, $fontSize: Int, $rules: String) {
      updateRoomSettings(roomId: $roomId, fontFamily: $fontFamily, fontSize: $fontSize, rules: $rules) {
        fontFamily
        fontSize
        rules
      }
    }
  `,
  CREATE_SYSTEM_MESSAGE: `
    mutation CreateSystemMessage($roomId: ID!, $content: String!, $intervalSeconds: Int) {
      createSystemMessage(roomId: $roomId, content: $content, intervalSeconds: $intervalSeconds) {
        id
        roomId
        content
        intervalSeconds
        lastSentAt
        isActive
        createdAt
      }
    }
  `,
  ADD_MUSIC_TO_QUEUE: `
    mutation AddMusicToQueue($roomId: ID!, $sourceType: String!, $sourceUrl: String!, $title: String, $artist: String) {
      addMusicToQueue(roomId: $roomId, sourceType: $sourceType, sourceUrl: $sourceUrl, title: $title, artist: $artist) {
        id
        roomId
        sourceType
        sourceUrl
        title
        artist
        position
        isPlaying
        createdAt
      }
    }
  `,
  SET_PLAYING_MUSIC: `
    mutation SetPlayingMusic($roomId: ID!, $musicId: ID) {
      setPlayingMusic(roomId: $roomId, musicId: $musicId)
    }
  `,
  REMOVE_MUSIC_FROM_QUEUE: `
    mutation RemoveMusicFromQueue($musicId: ID!) {
      removeMusicFromQueue(musicId: $musicId)
    }
  `,
  CREATE_DEV_CAPSULE: `
    mutation CreateDevCapsule($owner: String!, $projectSlug: String!, $notes: String!) {
      createDevCapsule(owner: $owner, projectSlug: $projectSlug, notes: $notes) {
        id
        owner
        projectSlug
        status
        createdAt
        updatedAt
        notes
      }
    }
  `,
  UPDATE_DEV_CAPSULE_STATUS: `
    mutation UpdateDevCapsuleStatus($id: ID!, $status: String!) {
      updateDevCapsuleStatus(id: $id, status: $status) {
        id
        owner
        projectSlug
        status
        createdAt
        updatedAt
        notes
      }
    }
  `,
  REGISTER_DEVELOPER: `
    mutation RegisterDeveloper($username: String!) {
      registerDeveloper(username: $username) {
        address
        username
        reputation
        createdAt
      }
    }
  `,
};

// Type definitions
export interface ChatUser {
  id: string;
  address: string;
  username: string;
  displayName?: string | null;
  isArchon: boolean;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  sender: ChatUser;
  content: string;
  nftId?: string | null;
  mediaUrl?: string | null;
  mediaType?: string | null;
  isBlurred?: boolean;
  createdAt: string;
}

export interface ChatRoom {
  id: string;
  type: string;
  slug?: string | null;
  name?: string | null;
  description?: string | null;
  creator?: ChatUser | null;
  moderators?: ChatUser[];
  members: ChatUser[];
  activeUsers?: ChatUser[];
  lastMessage?: ChatMessage | null;
  settings?: {
    fontFamily?: string | null;
    fontSize?: number | null;
    rules?: string | null;
  };
  musicQueue?: RoomMusicItem[];
}

export interface SystemMessage {
  id: string;
  roomId: string;
  content: string;
  intervalSeconds: number;
  lastSentAt?: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface ChatAnalytics {
  totalMessages: number;
  worldChatMessages: number;
  dmMessages: number;
  customRoomMessages: number;
  roomsCreated: number;
  roomsModerated: number;
  mediaShared: number;
  firstMessageAt?: string | null;
  lastMessageAt?: string | null;
}

export interface MessageActivity {
  date: string;
  count: number;
}

export interface RoomMusicItem {
  id: string;
  roomId: string;
  sourceType: string;
  sourceUrl: string;
  title?: string | null;
  artist?: string | null;
  position: number;
  isPlaying: boolean;
  createdAt: string;
}

/**
 * Simple GraphQL query helper (for developers pages)
 */
export async function graphqlQuery(
  query: string,
  headers?: Record<string, string>
): Promise<any> {
  return graphqlRequest(query, undefined, headers);
}

// Dev Capsules helper functions

export interface DevCapsule {
  id: string;
  owner: string;
  projectSlug: string;
  status: "draft" | "live" | "paused" | "archived";
  createdAt: number;
  updatedAt: number;
  notes: string;
}

export async function getDevCapsulesByProject(
  projectSlug: string
): Promise<DevCapsule[]> {
  const response = await graphqlRequest<{ devCapsulesByProject: DevCapsule[] }>(
    QUERIES.DEV_CAPSULES_BY_PROJECT,
    { projectSlug }
  );
  return response.devCapsulesByProject;
}

export async function createDevCapsule(
  owner: string,
  projectSlug: string,
  notes: string,
  address?: string,
  username?: string
): Promise<DevCapsule> {
  const response = await graphqlRequest<{ createDevCapsule: DevCapsule }>(
    MUTATIONS.CREATE_DEV_CAPSULE,
    { owner, projectSlug, notes },
    getChatHeaders(address, username)
  );
  return response.createDevCapsule;
}

export async function updateDevCapsuleStatus(
  id: string,
  status: "draft" | "live" | "paused" | "archived",
  address?: string,
  username?: string
): Promise<DevCapsule> {
  const response = await graphqlRequest<{ updateDevCapsuleStatus: DevCapsule }>(
    MUTATIONS.UPDATE_DEV_CAPSULE_STATUS,
    { id, status },
    getChatHeaders(address, username)
  );
  return response.updateDevCapsuleStatus;
}

