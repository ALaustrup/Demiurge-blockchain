/**
 * 💀 RUNTIME IMMUTABILITY ENFORCEMENT
 * 
 * PHASE OMEGA PART II: Enforces deterministic runtime module registration
 * and rejects any mutation without a version bump.
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { createHash } from 'crypto';

interface RuntimeModuleHash {
  moduleId: string;
  filePath: string;
  hash: string;
}

interface RuntimeRegistry {
  version: number;
  moduleCount: number;
  moduleIds: string[];
  moduleHashes: Record<string, string>;
  registryHash: string;
}

/**
 * Calculate SHA-256 hash of file content
 */
function hashFile(filePath: string): string {
  const content = readFileSync(filePath, 'utf-8');
  return createHash('sha256').update(content).digest('hex');
}

/**
 * Extract runtime module registration from mod.rs
 */
function extractRuntimeRegistry(modRsPath: string): RuntimeRegistry {
  const content = readFileSync(modRsPath, 'utf-8');
  
  // Extract module declarations
  const moduleMatches = content.matchAll(/pub mod (\w+);/g);
  const moduleIds: string[] = [];
  for (const match of moduleMatches) {
    if (match[1] !== 'version') {
      moduleIds.push(match[1]);
    }
  }
  
  // Extract version
  const versionMatch = content.match(/pub const RUNTIME_VERSION: u32 = (\d+);/);
  const version = versionMatch ? parseInt(versionMatch[1], 10) : 1;
  
  // Extract expected module count
  const countMatch = content.match(/pub const EXPECTED_MODULE_COUNT: usize = (\d+);/);
  const moduleCount = countMatch ? parseInt(countMatch[1], 10) : moduleIds.length;
  
  // Calculate module hashes
  const moduleHashes: Record<string, string> = {};
  const chainRuntimeDir = join(__dirname, '../chain/src/runtime');
  
  for (const moduleId of moduleIds) {
    const modulePath = join(chainRuntimeDir, `${moduleId}.rs`);
    if (existsSync(modulePath)) {
      moduleHashes[moduleId] = hashFile(modulePath);
    }
  }
  
  // Calculate registry hash
  const registryContent = JSON.stringify({
    version,
    moduleCount,
    moduleIds: moduleIds.sort(),
    moduleHashes,
  });
  const registryHash = createHash('sha256').update(registryContent).digest('hex');
  
  return {
    version,
    moduleCount,
    moduleIds,
    moduleHashes,
    registryHash,
  };
}

/**
 * Load seal and extract runtime registry hash
 */
function loadSealRuntimeHash(sealPath: string): string | null {
  if (!existsSync(sealPath)) {
    return null;
  }
  
  try {
    const seal = JSON.parse(readFileSync(sealPath, 'utf-8'));
    return seal.runtime?.registryHash || seal.runtime?.masterHash || null;
  } catch {
    return null;
  }
}

/**
 * Main enforcement function
 */
function enforceRuntimeIntegrity(): void {
  const repoRoot = join(__dirname, '..');
  const modRsPath = join(repoRoot, 'chain/src/runtime/mod.rs');
  const sealPath = join(repoRoot, 'REPO_STATE_SEAL.json');
  
  if (!existsSync(modRsPath)) {
    console.error('❌ ERROR: chain/src/runtime/mod.rs not found');
    process.exit(1);
  }
  
  console.log('🔒 Enforcing runtime immutability...');
  
  // Extract current registry
  const registry = extractRuntimeRegistry(modRsPath);
  
  console.log(`  Runtime Version: ${registry.version}`);
  console.log(`  Module Count: ${registry.moduleCount}`);
  console.log(`  Modules: ${registry.moduleIds.join(', ')}`);
  console.log(`  Registry Hash: ${registry.registryHash}`);
  
  // Verify module count matches
  if (registry.moduleIds.length !== registry.moduleCount) {
    console.error(`❌ ERROR: Module count mismatch: expected ${registry.moduleCount}, got ${registry.moduleIds.length}`);
    process.exit(1);
  }
  
  // Verify expected modules exist
  const expectedModules = [
    'bank_cgt',
    'urgeid_registry',
    'nft_dgen',
    'fabric_manager',
    'abyss_registry',
    'developer_registry',
    'dev_capsules',
    'recursion_registry',
    'work_claim',
  ];
  
  for (const expected of expectedModules) {
    if (!registry.moduleIds.includes(expected)) {
      console.error(`❌ ERROR: Missing required module: ${expected}`);
      process.exit(1);
    }
  }
  
  // Compare with seal if it exists
  const sealHash = loadSealRuntimeHash(sealPath);
  if (sealHash && sealHash !== registry.registryHash) {
    console.error('❌ ERROR: Runtime registry hash mismatch with seal');
    console.error(`  Seal Hash: ${sealHash}`);
    console.error(`  Current Hash: ${registry.registryHash}`);
    console.error('  → Runtime mutation detected without version bump!');
    process.exit(1);
  }
  
  console.log('✅ Runtime integrity verified');
}

// Execute
if (require.main === module) {
  enforceRuntimeIntegrity();
}

export { enforceRuntimeIntegrity, extractRuntimeRegistry, hashFile };
