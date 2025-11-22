export function formatUrgeId(addressHex: string): string {
  const hex = addressHex.startsWith("0x") ? addressHex.slice(2) : addressHex;
  return `urge:${hex}`;
}

