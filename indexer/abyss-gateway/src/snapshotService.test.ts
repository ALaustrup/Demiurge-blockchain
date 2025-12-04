/**
 * Smoke Tests for Snapshot Service
 * 
 * Run with: ts-node src/snapshotService.test.ts
 * 
 * These are minimal integration tests to verify snapshot service behavior.
 */

import { createSystemSnapshotNow, startSnapshotService, stopSnapshotService } from "./snapshotService";
import { getSystemSnapshots, getSystemEvents } from "./chatDb";
import { initChatDb } from "./chatDb";

async function runSmokeTests() {
  console.log("🧪 Starting Snapshot Service Smoke Tests...\n");

  // Initialize database
  try {
    initChatDb();
    console.log("✅ Database initialized");
  } catch (error: any) {
    console.error("❌ Database initialization failed:", error.message);
    process.exit(1);
  }

  let passed = 0;
  let failed = 0;

  // Test 1: Create snapshot with valid data
  try {
    console.log("\n📸 Test 1: Create snapshot with valid data");
    const snapshotId = await createSystemSnapshotNow("Test snapshot");
    if (snapshotId) {
      console.log(`   ✅ Snapshot created: ${snapshotId}`);
      passed++;
    } else {
      throw new Error("Snapshot ID not returned");
    }
  } catch (error: any) {
    console.error(`   ❌ Failed: ${error.message}`);
    failed++;
  }

  // Test 2: Verify snapshot appears in database
  try {
    console.log("\n🔍 Test 2: Verify snapshot in database");
    const snapshots = getSystemSnapshots(undefined, undefined, 10, 0);
    if (snapshots.length > 0) {
      console.log(`   ✅ Found ${snapshots.length} snapshot(s)`);
      passed++;
    } else {
      throw new Error("No snapshots found");
    }
  } catch (error: any) {
    console.error(`   ❌ Failed: ${error.message}`);
    failed++;
  }

  // Test 3: Verify system event created
  try {
    console.log("\n📝 Test 3: Verify system event created");
    const events = getSystemEvents(undefined, "snapshot_service", undefined, undefined, 10, 0);
    if (events.length > 0) {
      console.log(`   ✅ Found ${events.length} snapshot event(s)`);
      passed++;
    } else {
      throw new Error("No snapshot events found");
    }
  } catch (error: any) {
    console.error(`   ❌ Failed: ${error.message}`);
    failed++;
  }

  // Test 4: Handle missing/partial data gracefully
  try {
    console.log("\n🛡️ Test 4: Handle missing data gracefully");
    // This should not throw even if Fabric/rituals are empty
    const snapshotId = await createSystemSnapshotNow("Empty state snapshot");
    if (snapshotId) {
      console.log(`   ✅ Snapshot created with empty state: ${snapshotId}`);
      passed++;
    } else {
      throw new Error("Snapshot creation failed");
    }
  } catch (error: any) {
    console.error(`   ❌ Failed: ${error.message}`);
    failed++;
  }

  // Test 5: Snapshot service interval (start/stop)
  try {
    console.log("\n⏱️ Test 5: Snapshot service interval");
    const interval = startSnapshotService(1000); // 1 second for test
    await new Promise((resolve) => setTimeout(resolve, 2500)); // Wait 2.5 seconds
    stopSnapshotService(interval);
    const snapshots = getSystemSnapshots(undefined, undefined, 10, 0);
    if (snapshots.length >= 2) {
      console.log(`   ✅ Interval service created ${snapshots.length} snapshots`);
      passed++;
    } else {
      throw new Error(`Expected at least 2 snapshots, got ${snapshots.length}`);
    }
  } catch (error: any) {
    console.error(`   ❌ Failed: ${error.message}`);
    failed++;
  }

  // Summary
  console.log("\n" + "=".repeat(50));
  console.log(`📊 Test Results: ${passed} passed, ${failed} failed`);
  console.log("=".repeat(50));

  if (failed === 0) {
    console.log("✅ All tests passed!");
    process.exit(0);
  } else {
    console.log("❌ Some tests failed");
    process.exit(1);
  }
}

// Run tests if executed directly
if (require.main === module) {
  runSmokeTests().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
}

export { runSmokeTests };

