const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Ids from URLs and request bodies are checked before they reach the database,
// so a malformed id gets a 400/404 instead of a database error.
export function isUuid(value: unknown): value is string {
  return typeof value === "string" && uuidPattern.test(value);
}
