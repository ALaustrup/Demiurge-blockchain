/**
 * 💀 RUNTIME REGISTRY CHECKER
 * 
 * PHASE OMEGA PART II: Verifies runtime module registry consistency
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { extractRuntimeRegistry } from './enforce-runtime-integrity';

/**
 * Check runtime registry against expected state
 */
function checkRuntimeRegistry(): void {
  const repoRoot = join(__dirname, '..');
  const modRsPath = join(repoRoot, 'chain/src/runtime/mod.rs');
  
  if (!existsSync(modRsPath)) {
    console.error('❌ chain/src/runtime/mod.rs not found');
    process.exit(1);
  }
  
  const registry = extractRuntimeRegistry(modRsPath);
  
  // Expected order (must match version.rs)
  const expectedOrder = [
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
  
  // Verify order
  for (let i = 0; i < expectedOrder.length; i++) {
    const expected = expectedOrder[i];
    const actual = registry.moduleIds[i];
    
    if (actual !== expected) {
      console.error(`❌ Module order mismatch at index ${i}: expected '${expected}', got '${actual}'`);
      process.exit(1);
    }
  }
  
  // Verify all modules have hashes
  for (const moduleId of registry.moduleIds) {
    if (!registry.moduleHashes[moduleId]) {
      console.error(`❌ Missing hash for module: ${moduleId}`);
      process.exit(1);
    }
  }
  
  console.log('✅ Runtime registry check passed');
  console.log(`   Version: ${registry.version}`);
  console.log(`   Modules: ${registry.moduleIds.length}`);
  console.log(`   Hash: ${registry.registryHash.substring(0, 16)}...`);
}

if (require.main === module) {
  checkRuntimeRegistry();
}

export { checkRuntimeRegistry };
