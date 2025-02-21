import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function detectSchemaVersion(feedId: string) {
    // Remove the '0x' prefix if present
  if (feedId.startsWith("0x")) {
    feedId = feedId.slice(2);
  }

  // Extract the first two bytes (4 hex characters)
  const firstTwoBytesHex = feedId.slice(0, 4);

  // Convert hex to a number and return with 'v' prefix
  return `v${parseInt(firstTwoBytesHex, 16)}`;
}
