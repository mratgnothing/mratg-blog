export const tagSlug = (tag: string) =>
  tag
    .trim()
    .normalize("NFKC")
    .toLocaleLowerCase("en-US")
    .replace(/&/g, " and ")
    .replace(/['’]/g, "")
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/^-+|-+$/g, "") || "tag";

export const tagHref = (tag: string) => `/tags/${encodeURIComponent(tagSlug(tag))}/`;

export const itemSlug = (value: string) => tagSlug(value);
