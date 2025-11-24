/**
 * Clear all Demiurge localStorage keys
 * 
 * Run this in your browser console (F12) to clear all Demiurge data:
 * 
 * Copy and paste this entire script, or run:
 * Object.keys(localStorage).filter(k => k.startsWith('demiurge_')).forEach(k => localStorage.removeItem(k))
 */

// Get all Demiurge keys
const demiurgeKeys = Object.keys(localStorage).filter(key => key.startsWith('demiurge_'));

console.log(`Found ${demiurgeKeys.length} Demiurge localStorage keys:`);
demiurgeKeys.forEach(key => {
  console.log(`  - ${key}`);
});

// Clear all Demiurge keys
demiurgeKeys.forEach(key => {
  localStorage.removeItem(key);
});

console.log(`✅ Cleared ${demiurgeKeys.length} localStorage keys`);
console.log('Refresh the page to see the changes.');

