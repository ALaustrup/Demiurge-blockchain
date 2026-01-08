export function formatQorId(addressHex: string): string {
  const hex = addressHex.startsWith("0x") ? addressHex.slice(2) : addressHex;
  return `qor:${hex}`;
}

// Legacy exports for backward compatibility
/** @deprecated Use formatQorId instead */
export const formatAbyssId = formatQorId;
/** @deprecated Use formatQorId instead */
export const formatUrgeId = formatQorId;
