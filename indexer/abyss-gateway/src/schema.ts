/**
 * GraphQL schema for chat system.
 */

import { GraphQLSchema, GraphQLObjectType, GraphQLString, GraphQLID, GraphQLList, GraphQLInt, GraphQLBoolean, GraphQLNonNull } from "graphql";

// ChatUser type
const ChatUserType = new GraphQLObjectType({
  name: "ChatUser",
  fields: () => ({
    id: { type: new GraphQLNonNull(GraphQLID) },
    address: { type: new GraphQLNonNull(GraphQLString) },
    username: { type: new GraphQLNonNull(GraphQLString) },
    displayName: { type: GraphQLString },
    isArchon: { type: new GraphQLNonNull(GraphQLBoolean) },
  }),
});

// ChatMessage type
const ChatMessageType = new GraphQLObjectType({
  name: "ChatMessage",
  fields: () => ({
    id: { type: new GraphQLNonNull(GraphQLID) },
    roomId: { type: new GraphQLNonNull(GraphQLID) },
    sender: { type: new GraphQLNonNull(ChatUserType) },
    content: { type: new GraphQLNonNull(GraphQLString) },
    nftId: { type: GraphQLString },
    mediaUrl: { type: GraphQLString },
    mediaType: { type: GraphQLString },
    isBlurred: { type: new GraphQLNonNull(GraphQLBoolean) },
    createdAt: { type: new GraphQLNonNull(GraphQLString) },
  }),
});

// SystemMessage type
const SystemMessageType = new GraphQLObjectType({
  name: "SystemMessage",
  fields: () => ({
    id: { type: new GraphQLNonNull(GraphQLID) },
    roomId: { type: new GraphQLNonNull(GraphQLID) },
    content: { type: new GraphQLNonNull(GraphQLString) },
    intervalSeconds: { type: new GraphQLNonNull(GraphQLInt) },
    lastSentAt: { type: GraphQLString },
    isActive: { type: new GraphQLNonNull(GraphQLBoolean) },
    createdAt: { type: new GraphQLNonNull(GraphQLString) },
  }),
});

// RoomMusicItem type
const RoomMusicItemType = new GraphQLObjectType({
  name: "RoomMusicItem",
  fields: () => ({
    id: { type: new GraphQLNonNull(GraphQLID) },
    roomId: { type: new GraphQLNonNull(GraphQLID) },
    sourceType: { type: new GraphQLNonNull(GraphQLString) },
    sourceUrl: { type: new GraphQLNonNull(GraphQLString) },
    title: { type: GraphQLString },
    artist: { type: GraphQLString },
    position: { type: new GraphQLNonNull(GraphQLInt) },
    isPlaying: { type: new GraphQLNonNull(GraphQLBoolean) },
    createdAt: { type: new GraphQLNonNull(GraphQLString) },
  }),
});

// RoomSettings type
const RoomSettingsType = new GraphQLObjectType({
  name: "RoomSettings",
  fields: () => ({
    fontFamily: { type: GraphQLString },
    fontSize: { type: GraphQLInt },
    rules: { type: GraphQLString },
  }),
});

// ChatAnalytics type
const ChatAnalyticsType = new GraphQLObjectType({
  name: "ChatAnalytics",
  fields: () => ({
    totalMessages: { type: new GraphQLNonNull(GraphQLInt) },
    worldChatMessages: { type: new GraphQLNonNull(GraphQLInt) },
    dmMessages: { type: new GraphQLNonNull(GraphQLInt) },
    customRoomMessages: { type: new GraphQLNonNull(GraphQLInt) },
    roomsCreated: { type: new GraphQLNonNull(GraphQLInt) },
    roomsModerated: { type: new GraphQLNonNull(GraphQLInt) },
    mediaShared: { type: new GraphQLNonNull(GraphQLInt) },
    firstMessageAt: { type: GraphQLString },
    lastMessageAt: { type: GraphQLString },
  }),
});

// Developer type
const DeveloperType = new GraphQLObjectType({
  name: "Developer",
  fields: () => ({
    address: { type: new GraphQLNonNull(GraphQLID) },
    username: { type: new GraphQLNonNull(GraphQLString) },
    reputation: { type: new GraphQLNonNull(GraphQLInt) },
    createdAt: { type: new GraphQLNonNull(GraphQLString) },
  }),
});

// Project type
const ProjectType = new GraphQLObjectType({
  name: "Project",
  fields: () => ({
    slug: { type: new GraphQLNonNull(GraphQLID) },
    name: { type: new GraphQLNonNull(GraphQLString) },
    description: { type: GraphQLString },
    createdAt: { type: new GraphQLNonNull(GraphQLString) },
    maintainers: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(DeveloperType))),
      resolve: async (parent, args, context) => {
        return context.resolvers.getProjectMaintainers(parent.slug, context);
      },
    },
  }),
});

// DevCapsule type
const DevCapsuleType = new GraphQLObjectType({
  name: "DevCapsule",
  fields: () => ({
    id: { type: new GraphQLNonNull(GraphQLID) },
    owner: { type: new GraphQLNonNull(GraphQLString) },
    projectSlug: { type: new GraphQLNonNull(GraphQLString) },
    status: { type: new GraphQLNonNull(GraphQLString) },
    createdAt: { type: new GraphQLNonNull(GraphQLInt) },
    updatedAt: { type: new GraphQLNonNull(GraphQLInt) },
    notes: { type: new GraphQLNonNull(GraphQLString) },
  }),
});

// MessageActivity type
const MessageActivityType = new GraphQLObjectType({
  name: "MessageActivity",
  fields: () => ({
    date: { type: new GraphQLNonNull(GraphQLString) },
    count: { type: new GraphQLNonNull(GraphQLInt) },
  }),
});

// ChatRoom type
const ChatRoomType = new GraphQLObjectType({
  name: "ChatRoom",
  fields: () => ({
    id: { type: new GraphQLNonNull(GraphQLID) },
    type: { type: new GraphQLNonNull(GraphQLString) },
    slug: { type: GraphQLString },
    name: { type: GraphQLString },
    description: { type: GraphQLString },
    creator: { type: ChatUserType },
    moderators: { type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(ChatUserType))) },
    members: { type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(ChatUserType))) },
    activeUsers: { type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(ChatUserType))) },
    lastMessage: { type: ChatMessageType },
    settings: { type: RoomSettingsType },
    musicQueue: { type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(RoomMusicItemType))) },
  }),
});

// Query type
const QueryType = new GraphQLObjectType({
  name: "Query",
  fields: () => ({
    worldChatMessages: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(ChatMessageType))),
      args: {
        limit: { type: GraphQLInt, defaultValue: 50 },
        beforeId: { type: GraphQLID },
      },
      resolve: async (parent, args, context) => {
        return context.resolvers.worldChatMessages(args, context);
      },
    },
    dmRooms: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(ChatRoomType))),
      resolve: async (parent, args, context) => {
        return context.resolvers.dmRooms(context);
      },
    },
    roomMessages: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(ChatMessageType))),
      args: {
        roomId: { type: new GraphQLNonNull(GraphQLID) },
        limit: { type: GraphQLInt, defaultValue: 50 },
        beforeId: { type: GraphQLID },
      },
      resolve: async (parent, args, context) => {
        return context.resolvers.roomMessages(args, context);
      },
    },
    customRooms: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(ChatRoomType))),
      resolve: async (parent, args, context) => {
        return context.resolvers.customRooms(context);
      },
    },
    roomSettings: {
      type: RoomSettingsType,
      args: {
        roomId: { type: new GraphQLNonNull(GraphQLID) },
      },
      resolve: async (parent, args, context) => {
        return context.resolvers.roomSettings(args, context);
      },
    },
    roomSystemMessages: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(SystemMessageType))),
      args: {
        roomId: { type: new GraphQLNonNull(GraphQLID) },
      },
      resolve: async (parent, args, context) => {
        return context.resolvers.roomSystemMessages(args, context);
      },
    },
    userChatAnalytics: {
      type: ChatAnalyticsType,
      args: {
        address: { type: new GraphQLNonNull(GraphQLString) },
      },
      resolve: async (parent, args, context) => {
        return context.resolvers.userChatAnalytics(args, context);
      },
    },
    userMessageActivity: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(MessageActivityType))),
      args: {
        address: { type: new GraphQLNonNull(GraphQLString) },
      },
      resolve: async (parent, args, context) => {
        return context.resolvers.userMessageActivity(args, context);
      },
    },
    developers: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(DeveloperType))),
      resolve: async (parent, args, context) => {
        return context.resolvers.getDevelopers(args, context);
      },
    },
    developer: {
      type: DeveloperType,
      args: {
        address: { type: GraphQLID },
        username: { type: GraphQLString },
      },
      resolve: async (parent, args, context) => {
        return context.resolvers.getDeveloper(args, context);
      },
    },
    projects: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(ProjectType))),
      resolve: async (parent, args, context) => {
        return context.resolvers.getProjects(args, context);
      },
    },
    project: {
      type: ProjectType,
      args: {
        slug: { type: new GraphQLNonNull(GraphQLID) },
      },
      resolve: async (parent, args, context) => {
        return context.resolvers.getProject(args, context);
      },
    },
    devCapsulesByOwner: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(DevCapsuleType))),
      args: {
        owner: { type: new GraphQLNonNull(GraphQLString) },
      },
      resolve: async (parent, args, context) => {
        return context.resolvers.getDevCapsulesByOwner(args, context);
      },
    },
    devCapsulesByProject: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(DevCapsuleType))),
      args: {
        projectSlug: { type: new GraphQLNonNull(GraphQLString) },
      },
      resolve: async (parent, args, context) => {
        return context.resolvers.getDevCapsulesByProject(args, context);
      },
    },
    devCapsule: {
      type: DevCapsuleType,
      args: {
        id: { type: new GraphQLNonNull(GraphQLID) },
      },
      resolve: async (parent, args, context) => {
        return context.resolvers.getDevCapsule(args, context);
      },
    },
  }),
});

// Mutation type
const MutationType = new GraphQLObjectType({
  name: "Mutation",
  fields: () => ({
    sendWorldMessage: {
      type: new GraphQLNonNull(ChatMessageType),
      args: {
        content: { type: new GraphQLNonNull(GraphQLString) },
        nftId: { type: GraphQLString },
        mediaUrl: { type: GraphQLString },
        mediaType: { type: GraphQLString },
      },
      resolve: async (parent, args, context) => {
        return context.resolvers.sendWorldMessage(args, context);
      },
    },
    sendDirectMessage: {
      type: new GraphQLNonNull(ChatMessageType),
      args: {
        toUsername: { type: new GraphQLNonNull(GraphQLString) },
        content: { type: new GraphQLNonNull(GraphQLString) },
        nftId: { type: GraphQLString },
        mediaUrl: { type: GraphQLString },
        mediaType: { type: GraphQLString },
      },
      resolve: async (parent, args, context) => {
        return context.resolvers.sendDirectMessage(args, context);
      },
    },
    sendRoomMessage: {
      type: new GraphQLNonNull(ChatMessageType),
      args: {
        roomId: { type: new GraphQLNonNull(GraphQLID) },
        content: { type: new GraphQLNonNull(GraphQLString) },
        nftId: { type: GraphQLString },
        mediaUrl: { type: GraphQLString },
        mediaType: { type: GraphQLString },
      },
      resolve: async (parent, args, context) => {
        return context.resolvers.sendRoomMessage(args, context);
      },
    },
    blurMedia: {
      type: new GraphQLNonNull(ChatMessageType),
      args: {
        messageId: { type: new GraphQLNonNull(GraphQLID) },
      },
      resolve: async (parent, args, context) => {
        return context.resolvers.blurMedia(args, context);
      },
    },
    createCustomRoom: {
      type: new GraphQLNonNull(ChatRoomType),
      args: {
        name: { type: new GraphQLNonNull(GraphQLString) },
        description: { type: GraphQLString },
        slug: { type: new GraphQLNonNull(GraphQLString) },
      },
      resolve: async (parent, args, context) => {
        return context.resolvers.createCustomRoom(args, context);
      },
    },
    joinCustomRoom: {
      type: new GraphQLNonNull(ChatRoomType),
      args: {
        roomId: { type: new GraphQLNonNull(GraphQLID) },
      },
      resolve: async (parent, args, context) => {
        return context.resolvers.joinCustomRoom(args, context);
      },
    },
    leaveCustomRoom: {
      type: new GraphQLNonNull(GraphQLBoolean),
      args: {
        roomId: { type: new GraphQLNonNull(GraphQLID) },
      },
      resolve: async (parent, args, context) => {
        return context.resolvers.leaveCustomRoom(args, context);
      },
    },
    promoteToModerator: {
      type: new GraphQLNonNull(GraphQLBoolean),
      args: {
        roomId: { type: new GraphQLNonNull(GraphQLID) },
        username: { type: new GraphQLNonNull(GraphQLString) },
      },
      resolve: async (parent, args, context) => {
        return context.resolvers.promoteToModerator(args, context);
      },
    },
    removeModerator: {
      type: new GraphQLNonNull(GraphQLBoolean),
      args: {
        roomId: { type: new GraphQLNonNull(GraphQLID) },
        username: { type: new GraphQLNonNull(GraphQLString) },
      },
      resolve: async (parent, args, context) => {
        return context.resolvers.removeModerator(args, context);
      },
    },
    updateRoomSettings: {
      type: new GraphQLNonNull(RoomSettingsType),
      args: {
        roomId: { type: new GraphQLNonNull(GraphQLID) },
        fontFamily: { type: GraphQLString },
        fontSize: { type: GraphQLInt },
        rules: { type: GraphQLString },
      },
      resolve: async (parent, args, context) => {
        return context.resolvers.updateRoomSettings(args, context);
      },
    },
    createSystemMessage: {
      type: new GraphQLNonNull(SystemMessageType),
      args: {
        roomId: { type: new GraphQLNonNull(GraphQLID) },
        content: { type: new GraphQLNonNull(GraphQLString) },
        intervalSeconds: { type: GraphQLInt, defaultValue: 3600 },
      },
      resolve: async (parent, args, context) => {
        return context.resolvers.createSystemMessage(args, context);
      },
    },
    addMusicToQueue: {
      type: new GraphQLNonNull(RoomMusicItemType),
      args: {
        roomId: { type: new GraphQLNonNull(GraphQLID) },
        sourceType: { type: new GraphQLNonNull(GraphQLString) },
        sourceUrl: { type: new GraphQLNonNull(GraphQLString) },
        title: { type: GraphQLString },
        artist: { type: GraphQLString },
      },
      resolve: async (parent, args, context) => {
        return context.resolvers.addMusicToQueue(args, context);
      },
    },
    setPlayingMusic: {
      type: new GraphQLNonNull(GraphQLBoolean),
      args: {
        roomId: { type: new GraphQLNonNull(GraphQLID) },
        musicId: { type: GraphQLID },
      },
      resolve: async (parent, args, context) => {
        return context.resolvers.setPlayingMusic(args, context);
      },
    },
    removeMusicFromQueue: {
      type: new GraphQLNonNull(GraphQLBoolean),
      args: {
        musicId: { type: new GraphQLNonNull(GraphQLID) },
      },
      resolve: async (parent, args, context) => {
        return context.resolvers.removeMusicFromQueue(args, context);
      },
    },
    registerDeveloper: {
      type: new GraphQLNonNull(DeveloperType),
      args: {
        username: { type: new GraphQLNonNull(GraphQLString) },
      },
      resolve: async (parent, args, context) => {
        return context.resolvers.registerDeveloper(args, context);
      },
    },
    createProject: {
      type: new GraphQLNonNull(ProjectType),
      args: {
        slug: { type: new GraphQLNonNull(GraphQLString) },
        name: { type: new GraphQLNonNull(GraphQLString) },
        description: { type: GraphQLString },
      },
      resolve: async (parent, args, context) => {
        return context.resolvers.createProject(args, context);
      },
    },
    addProjectMaintainer: {
      type: new GraphQLNonNull(ProjectType),
      args: {
        slug: { type: new GraphQLNonNull(GraphQLString) },
        address: { type: new GraphQLNonNull(GraphQLString) },
      },
      resolve: async (parent, args, context) => {
        return context.resolvers.addProjectMaintainer(args, context);
      },
    },
  }),
});

// Subscription type (using PubSub pattern)
const SubscriptionType = new GraphQLObjectType({
  name: "Subscription",
  fields: () => ({
    worldChatFeed: {
      type: new GraphQLNonNull(ChatMessageType),
      subscribe: async (parent, args, context) => {
        return context.pubsub.subscribe("WORLD_CHAT");
      },
    },
    roomMessagesFeed: {
      type: new GraphQLNonNull(ChatMessageType),
      args: {
        roomId: { type: new GraphQLNonNull(GraphQLID) },
      },
      subscribe: async (parent, args, context) => {
        return context.pubsub.subscribe(`ROOM_${args.roomId}`);
      },
    },
  }),
});

// Root schema
export const schema = new GraphQLSchema({
  query: QueryType,
  mutation: MutationType,
  subscription: SubscriptionType,
});

