/**
 * Shared validation utilities for LifeOS
 */

/**
 * Validates whether an email string follows a strict standard email structure.
 * Rejects empty strings, strings without @, strings without domain, strings without TLD,
 * and strings containing spaces or invalid characters.
 * 
 * Examples:
 * - "abc" -> false
 * - "abc@" -> false
 * - "abc@gmail" -> false
 * - "@gmail.com" -> false
 * - "abc@gmail.com" -> true
 * - "varshini@example.com" -> true
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const trimmed = email.trim();
  if (!trimmed) return false;
  
  // Standard robust email regex:
  // Requires: non-space local part + @ + non-space domain + dot + 2+ char TLD
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(trimmed);
}
