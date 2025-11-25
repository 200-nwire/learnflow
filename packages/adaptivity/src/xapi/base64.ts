/**
 * Base64 encoding utility that works in both browser and worker contexts
 */

/**
 * Encode string to base64
 * Works in browser (btoa), Node.js (Buffer), and Web Workers
 */
export function encodeBase64(str: string): string {
  // Browser/Worker context
  if (typeof btoa !== "undefined") {
    return btoa(str);
  }
  
  // Node.js context
  if (typeof Buffer !== "undefined") {
    return Buffer.from(str).toString("base64");
  }
  
  // Fallback: manual base64 encoding
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let result = "";
  let i = 0;
  
  while (i < str.length) {
    const a = str.charCodeAt(i++);
    const b = i < str.length ? str.charCodeAt(i++) : 0;
    const c = i < str.length ? str.charCodeAt(i++) : 0;
    
    const bitmap = (a << 16) | (b << 8) | c;
    
    result += chars.charAt((bitmap >> 18) & 63);
    result += chars.charAt((bitmap >> 12) & 63);
    result += i - 2 < str.length ? chars.charAt((bitmap >> 6) & 63) : "=";
    result += i - 1 < str.length ? chars.charAt(bitmap & 63) : "=";
  }
  
  return result;
}

