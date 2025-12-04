/**
 * GraphQL Yoga server for Abyss Gateway.
 */

import { createYoga } from "@graphql-yoga/node";
import { schema } from "./schema";
import { resolvers, pubsub, resolveCurrentUser, ChatContext } from "./resolvers";
import { initChatDb } from "./chatDb";

// Initialize database
initChatDb();

// Create Yoga server
const yoga = createYoga({
  schema,
  context: async ({ request }) => {
    // Extract headers
    const address = request.headers.get("x-demiurge-address") || undefined;
    const username = request.headers.get("x-demiurge-username") || undefined;

    // Resolve current user (now async to sync usernames from chain)
    const currentUser = await resolveCurrentUser(address, username);

    return {
      currentUser,
      resolvers,
      pubsub,
    } as ChatContext;
  },
  graphiql: true, // Enable GraphiQL for development
});

export { yoga };

