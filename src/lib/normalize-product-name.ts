const removableWords = ["new", "신제품", "신규", "출시", "시즌"];

export function normalizeProductName(name: string) {
  let normalized = name.normalize("NFKC").toLocaleLowerCase("ko-KR");
  for (const word of removableWords) normalized = normalized.replaceAll(word, "");
  return normalized.replace(/\([^)]*(홍보|기념|콜라보|한정)[^)]*\)/g, "").replace(/[^a-z0-9가-힣]/g, "").trim();
}

export function isSameProduct(left: { brand: string; name: string }, right: { brand: string; name: string }) {
  return normalizeProductName(left.brand) === normalizeProductName(right.brand) && normalizeProductName(left.name) === normalizeProductName(right.name);
}

