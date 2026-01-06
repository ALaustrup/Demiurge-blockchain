/**
 * CGT Formatting Utilities
 * 
 * Handles formatting of Creator God Token amounts with proper precision
 * and support for the 369 billion supply.
 */

const CGT_DECIMALS = 8;
const CGT_MAX_SUPPLY = 369_000_000_000; // 369 billion CGT

/**
 * Format CGT amount from smallest units (u128) to display string
 * @param amountInSmallestUnits - Amount in smallest units (10^-8 precision)
 * @param decimals - Number of decimal places to show (default: 8)
 * @returns Formatted string like "1,234.56789012 CGT"
 */
export function formatCGT(amountInSmallestUnits: string | number | bigint, decimals: number = 8): string {
  // Convert to string to handle large numbers
  let amountStr = typeof amountInSmallestUnits === 'bigint' 
    ? amountInSmallestUnits.toString()
    : String(amountInSmallestUnits);
  
  // Handle negative (shouldn't happen, but safety)
  const isNegative = amountStr.startsWith('-');
  if (isNegative) {
    amountStr = amountStr.slice(1);
  }
  
  // Pad with zeros to ensure we have at least 8 decimal places
  while (amountStr.length <= CGT_DECIMALS) {
    amountStr = '0' + amountStr;
  }
  
  // Split into integer and decimal parts
  const integerPart = amountStr.slice(0, -CGT_DECIMALS) || '0';
  const decimalPart = amountStr.slice(-CGT_DECIMALS);
  
  // Format integer part with commas
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  
  // Truncate decimal part to requested decimals
  const formattedDecimal = decimalPart.slice(0, decimals).padEnd(decimals, '0');
  
  // Remove trailing zeros from decimal part
  const trimmedDecimal = formattedDecimal.replace(/0+$/, '');
  
  // Combine
  const result = trimmedDecimal 
    ? `${formattedInteger}.${trimmedDecimal}`
    : formattedInteger;
  
  return isNegative ? `-${result}` : result;
}

/**
 * Parse CGT amount from display string to smallest units
 * @param formattedAmount - String like "1,234.56789012" or "1234.56789012"
 * @returns Amount in smallest units as string
 */
export function parseCGT(formattedAmount: string): string {
  // Remove commas and trim
  const cleaned = formattedAmount.replace(/,/g, '').trim();
  
  // Split by decimal point
  const parts = cleaned.split('.');
  const integerPart = parts[0] || '0';
  let decimalPart = parts[1] || '';
  
  // Pad or truncate decimal part to 8 digits
  if (decimalPart.length > CGT_DECIMALS) {
    decimalPart = decimalPart.slice(0, CGT_DECIMALS);
  } else {
    decimalPart = decimalPart.padEnd(CGT_DECIMALS, '0');
  }
  
  // Combine and return
  return integerPart + decimalPart;
}

/**
 * Format CGT with symbol
 * @param amountInSmallestUnits - Amount in smallest units
 * @param decimals - Decimal places to show
 * @returns Formatted string with "CGT" suffix
 */
export function formatCGTWithSymbol(amountInSmallestUnits: string | number | bigint, decimals: number = 8): string {
  return `${formatCGT(amountInSmallestUnits, decimals)} CGT`;
}

/**
 * Format CGT for compact display (e.g., "1.23B CGT" for billions)
 * @param amountInSmallestUnits - Amount in smallest units
 * @returns Compact formatted string
 */
export function formatCGTCompact(amountInSmallestUnits: string | number | bigint): string {
  const amount = BigInt(String(amountInSmallestUnits));
  const divisor = BigInt(10 ** CGT_DECIMALS);
  const wholeCGT = Number(amount / divisor);
  const remainder = Number(amount % divisor);
  
  if (wholeCGT >= 1_000_000_000) {
    const billions = wholeCGT / 1_000_000_000;
    return `${billions.toFixed(2)}B CGT`;
  } else if (wholeCGT >= 1_000_000) {
    const millions = wholeCGT / 1_000_000;
    return `${millions.toFixed(2)}M CGT`;
  } else if (wholeCGT >= 1_000) {
    const thousands = wholeCGT / 1_000;
    return `${thousands.toFixed(2)}K CGT`;
  } else {
    return formatCGTWithSymbol(amountInSmallestUnits, 4);
  }
}

/**
 * Validate CGT amount
 * @param amountInSmallestUnits - Amount to validate
 * @returns true if valid, false otherwise
 */
export function validateCGTAmount(amountInSmallestUnits: string | number | bigint): boolean {
  try {
    const amount = BigInt(String(amountInSmallestUnits));
    const maxAmount = BigInt(CGT_MAX_SUPPLY) * BigInt(10 ** CGT_DECIMALS);
    
    if (amount < 0) return false;
    if (amount > maxAmount) return false;
    
    return true;
  } catch {
    return false;
  }
}

/**
 * Get max supply in display format
 */
export function getMaxSupplyFormatted(): string {
  return formatCGTWithSymbol(BigInt(CGT_MAX_SUPPLY) * BigInt(10 ** CGT_DECIMALS));
}
