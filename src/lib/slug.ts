export function slugify(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export function createUniqueSlug(base: string, existingSlugs: Iterable<string>) {
  const normalized = slugify(base);
  const slugs = new Set(existingSlugs);

  if (!slugs.has(normalized)) {
    return normalized;
  }

  let suffix = 2;
  while (slugs.has(`${normalized}-${suffix}`)) {
    suffix += 1;
  }

  return `${normalized}-${suffix}`;
}
