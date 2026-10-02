const retailerPatterns: Array<[RegExp, string]> = [
  [/매일다이렉트/, "매일다이렉트"],
  [/올리브영/, "올리브영"],
  [/카카오\s*선물하기/, "카카오 선물하기"],
  [/네이버\s*(?:브랜드|공식)?몰/, "네이버 공식몰"],
  [/네이버\s*스마트스토어/, "네이버 스마트스토어"],
  [/삼양식품\s*(?:공식\s*)?(?:온라인)?몰/, "삼양식품 공식몰"],
  [/쿠팡/, "쿠팡"],
  [/G마켓|지마켓/, "G마켓"],
  [/(?:마켓)?컬리/, "컬리"],
  [/전국\s*(?:대형)?마트/, "전국 대형마트"],
  [/CU|씨유/, "CU"],
  [/GS25/, "GS25"],
  [/세븐일레븐/, "세븐일레븐"],
  [/이마트24/, "이마트24"],
  [/주요\s*온라인\s*판매채널|다양한\s*온라인\s*커머스\s*사이트/, "주요 온라인몰"],
];

function numericPrice(text: string) {
  const match = text.match(/(?:판매가|소비자가|권장소비자가|출고가|가격)(?:는|은|가|으로|:|\s){0,8}(?:한\s*세트\s*)?([0-9]{1,3}(?:,[0-9]{3})+|[0-9]{3,7})\s*원/);
  if (!match) return null;
  const price = Number(match[1].replaceAll(",", ""));
  return price >= 100 && price <= 1_000_000 ? price : null;
}

function koreanUnitPrice(text: string) {
  const match = text.match(/(?:판매가|소비자가|권장소비자가|출고가|가격)[^。.!?]{0,40}?(\d+)만(?:(\d+)천)?(?:(\d+)백)?(?:(\d{1,3}))?\s*원/);
  if (!match) return null;
  const price = Number(match[1]) * 10_000 + Number(match[2] ?? 0) * 1_000 + Number(match[3] ?? 0) * 100 + Number(match[4] ?? 0);
  return price >= 100 && price <= 1_000_000 ? price : null;
}

export function extractCommerce(text: string) {
  const retailers = retailerPatterns.filter(([pattern]) => pattern.test(text)).map(([, label]) => label);
  return {
    price: numericPrice(text) ?? koreanUnitPrice(text),
    retailer: retailers.length > 0 ? [...new Set(retailers)].join(" · ") : null,
  };
}
