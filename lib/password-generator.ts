import { randomBytes } from "crypto";

const LOWERCASE = "abcdefghijkmnopqrstuvwxyz"; // no 'l' to avoid confusion
const DIGITS = "23456789"; // no 0/1 to avoid confusion with O/l
const UPPERCASE = "ABCDEFGHJKMNPQRSTUVWXYZ"; // no I/L/O

/**
 * Generate an Apple-style password: 3 groups of 6 characters separated by
 * hyphens, with exactly 1 uppercase letter and 1 digit placed randomly.
 *
 * Example: `krm4dq-bTxnpq-amcwge`
 */
export function generateAppleStylePassword(): string {
  const totalChars = 18; // 3 groups × 6 chars
  const bytes = randomBytes(totalChars + 4); // extra entropy for position picks
  let byteIndex = 0;

  const nextByte = () => bytes[byteIndex++];

  // Fill all 18 positions with lowercase first
  const chars: string[] = [];
  for (let i = 0; i < totalChars; i++) {
    chars.push(LOWERCASE[nextByte() % LOWERCASE.length]);
  }

  // Pick two distinct random positions for the uppercase and digit
  const pos1 = nextByte() % totalChars;
  let pos2 = nextByte() % (totalChars - 1);
  if (pos2 >= pos1) pos2++;

  chars[pos1] = UPPERCASE[nextByte() % UPPERCASE.length];
  chars[pos2] = DIGITS[nextByte() % DIGITS.length];

  // Format as xxx-xxx-xxx
  const group1 = chars.slice(0, 6).join("");
  const group2 = chars.slice(6, 12).join("");
  const group3 = chars.slice(12, 18).join("");

  return `${group1}-${group2}-${group3}`;
}
