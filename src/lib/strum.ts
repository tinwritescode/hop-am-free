// A small strum picture for a rhythm (điệu) tile. Decorative: the common pattern people learn for that name,
// not the song's exact rhythm (the song page has the AI's playable patterns).
import { fold } from "@hopamfree/core/text";

// Checked in order: the more specific name first ("slow rock" before "slow").
const PATTERNS: [RegExp, string][] = [
  [/slow ?rock/, "↓↓↓ ↓↓↓"],
  [/slow/, "↓ ↓↓ ↓↑"],
  [/ballad/, "↓ ↓↑ ↑↓"],
  [/blue/, "↓↑↓ ↓↑↓"],
  [/disco/, "↓↑ ↓↑ ↓↑"],
  [/boston/, "↓ ↓↑ ↓"],
  [/r(h)?umba/, "↓ ↓↑ ↑↓↑"],
  [/bolero/, "↓ ↓↓ ↑↓↑"],
  [/valse|waltz/, "↓ ↑ ↑"],
  [/fox/, "↓↑ ↓↑"],
  [/tango/, "↓ ↓ ↓↑↓"],
  [/pop|rock/, "↓ ↓↑ ↑↓↑"],
];
const FALLBACK = "↓ ↓↑ ↓↑";

export function strumGlyph(rhythm: string): string {
  const name = fold(rhythm);
  return PATTERNS.find(([re]) => re.test(name))?.[1] ?? FALLBACK;
}
