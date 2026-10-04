export const MAX_TAGS_PER_PLACE = 10;
export const MAX_TAG_LENGTH = 20;

export function parseTags(input: string | undefined | null): string[] {
  if (!input) return [];
  const seen = new Set<string>();
  for (const raw of input.split(',')) {
    const tag = raw.trim().slice(0, MAX_TAG_LENGTH);
    if (tag && !seen.has(tag)) {
      seen.add(tag);
    }
    if (seen.size >= MAX_TAGS_PER_PLACE) break;
  }
  return [...seen];
}

export function formatTags(tags: string[] | undefined): string {
  return (tags ?? []).join(', ');
}
