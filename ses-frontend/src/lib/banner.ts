// The backend has no event-image field. We synthesize a stable, brand-
// flavored gradient per event from a deterministic hash of (id, title)
// so each card looks distinct without any uploads.

const PALETTES: [string, string, string][] = [
  ['#6366F1', '#06B6D4', '#F59E0B'],
  ['#7C3AED', '#06B6D4', '#10B981'],
  ['#EC4899', '#6366F1', '#06B6D4'],
  ['#F59E0B', '#EF4444', '#8B5CF6'],
  ['#06B6D4', '#10B981', '#F59E0B'],
  ['#8B5CF6', '#EC4899', '#F59E0B'],
  ['#0EA5E9', '#6366F1', '#EC4899'],
  ['#10B981', '#0EA5E9', '#6366F1'],
];

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

export function eventGradient(seed: string): string {
  const palette = PALETTES[hash(seed) % PALETTES.length];
  const angle = (hash(seed) % 180) + 90;
  return `linear-gradient(${angle}deg, ${palette[0]} 0%, ${palette[1]} 55%, ${palette[2]} 100%)`;
}
