/**
 * Abyss Gateway - GraphQL API for Demiurge chain data and chat system.
 */

import { createServer } from "http";
import { yoga } from "./server";
import { chatDb } from "./chatDb";

const PORT = process.env.PORT || 4000;

const server = createServer(yoga);

// Cleanup inactive rooms every 5 minutes
setInterval(() => {
  try {
    const deleted = chatDb.cleanupInactiveRooms();
    if (deleted > 0) {
      console.log(`Cleaned up ${deleted} inactive room(s)`);
    }
  } catch (error) {
    console.error("Error cleaning up inactive rooms:", error);
  }
}, 5 * 60 * 1000); // 5 minutes

server.listen(PORT, () => {
  console.log(`Abyss Gateway running on http://localhost:${PORT}/graphql`);
  console.log(`GraphiQL available at http://localhost:${PORT}/graphql`);
});

export function main() {
  // Server is started above
}

