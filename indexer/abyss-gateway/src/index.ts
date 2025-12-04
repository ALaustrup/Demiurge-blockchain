/**
 * Abyss Gateway - GraphQL API for Demiurge chain data and chat system.
 */

import { createServer } from "http";
import { yoga } from "./server";
import { chatDb } from "./chatDb";
import { startSnapshotService } from "./snapshotService";

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

// Start snapshot service (every 5 minutes, or disable with DISABLE_SNAPSHOT_SERVICE=true)
const snapshotInterval = process.env.DISABLE_SNAPSHOT_SERVICE === "true"
  ? null
  : startSnapshotService(parseInt(process.env.SNAPSHOT_INTERVAL_MS || "300000", 10));

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("Shutting down gracefully...");
  if (snapshotInterval) {
    clearInterval(snapshotInterval);
  }
  server.close();
});

server.listen(PORT, () => {
  console.log(`Abyss Gateway running on http://localhost:${PORT}/graphql`);
  console.log(`GraphiQL available at http://localhost:${PORT}/graphql`);
  if (snapshotInterval) {
    const intervalMinutes = parseInt(process.env.SNAPSHOT_INTERVAL_MS || "300000", 10) / 60000;
    console.log(`Snapshot service started (interval: ${intervalMinutes} minutes)`);
  } else {
    console.log("Snapshot service disabled (DISABLE_SNAPSHOT_SERVICE=true)");
  }
});

export function main() {
  // Server is started above
}

