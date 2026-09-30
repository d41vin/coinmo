/**
 * Username rules shared by the Convex functions and the browser forms, so a
 * value that passes the live field check is the same value the mutation
 * accepts. This module must stay free of Convex runtime imports: the Next app
 * imports it directly.
 */

export const USERNAME_MIN_LENGTH = 4
export const USERNAME_MAX_LENGTH = 20
export const DISPLAY_NAME_MAX_LENGTH = 80

/**
 * 4-20 characters: lowercase letters and digits, with single underscores
 * allowed in the middle only. The quantified middle group is what makes the
 * total length 4-20 once the required first and last characters are counted.
 */
const USERNAME_REGEX = /^[a-z0-9](?:[a-z0-9]|_(?!_)){2,18}[a-z0-9]$/

/** Mirrors the regex for `pattern` attributes on inputs. */
export const USERNAME_PATTERN = "[a-z0-9][a-z0-9_]{2,18}[a-z0-9]"

/**
 * Names coinmo owns: app routes, product words and handles that must never
 * read as a real account.
 */
export const RESERVED_USERNAMES: readonly string[] = [
  "admin",
  "api",
  "coinmo",
  "home",
  "me",
  "monad",
  "onboarding",
  "pay",
  "profile",
  "request",
  "send",
  "settings",
  "split",
  "support",
  "usdc",
  "wallet",
]

export const USERNAME_HINT =
  "4–20 lowercase letters, numbers, or underscores. Start and end with a " +
  "letter or number; no consecutive underscores."

export function normalizeUsername(input: string): string {
  return input.trim().toLowerCase()
}

/** Turn a display name into a username suggestion, e.g. "Ada Lovelace". */
export function suggestUsername(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, USERNAME_MAX_LENGTH)
}

/**
 * Returns a human-readable reason the username is unusable, or null when it
 * is. Never throws, so both the form and the mutation can share it.
 */
export function usernameError(username: string): string | null {
  const normalized = normalizeUsername(username)

  if (normalized.length < USERNAME_MIN_LENGTH) {
    return `Usernames are at least ${USERNAME_MIN_LENGTH} characters.`
  }
  if (normalized.length > USERNAME_MAX_LENGTH) {
    return `Usernames are at most ${USERNAME_MAX_LENGTH} characters.`
  }
  if (!USERNAME_REGEX.test(normalized)) {
    return USERNAME_HINT
  }
  if (RESERVED_USERNAMES.includes(normalized)) {
    return "That username is reserved on coinmo."
  }

  return null
}

export function isValidUsername(username: string): boolean {
  return usernameError(username) === null
}

export function displayNameError(displayName: string): string | null {
  const trimmed = displayName.trim()

  if (trimmed.length === 0) {
    return "Display name is required."
  }
  if (trimmed.length > DISPLAY_NAME_MAX_LENGTH) {
    return `Display names are at most ${DISPLAY_NAME_MAX_LENGTH} characters.`
  }

  return null
}
