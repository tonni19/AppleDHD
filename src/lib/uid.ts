/**
 * Short unique id. The old model used `Date.now()`, which collides when two records
 * are created inside the same millisecond (easy when seeding or importing a backup).
 */
export function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
