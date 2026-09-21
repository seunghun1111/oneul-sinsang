import type { Product } from "@/types/product";

const checkedAt = "2026-09-22T00:00:00.000Z";

export const products: Product[] = [
  makeProduct({ id: "autumn-cream-latte", brand: "스타벅스", name: "오텀 크림 라떼", normalizedName: "오텀크림라떼", category: "cafe", productType: "seasonal", price: 6500, retailer: "스타벅스", releaseDate: "2026-09-22", emoji: "☕", description: "부드러운 크림과 고소한 에스프레소가 어우러진 가을 시즌 라떼예요.", sourceUrl: "https://www.starbucks.co.kr/menu/drink_list.do" }),
  makeProduct({ id: "shin-gold-cup", brand: "농심", name: "신라면 골드 큰사발", normalizedName: "신라면골드큰사발", category: "ramen", productType: "new", price: 2200, retailer: "CU · GS25", releaseDate: "2026-09-21", emoji: "🍜", description: "진한 닭 육수에 신라면의 매운맛을 더한 새로운 큰사발면입니다.", sourceUrl: "https://www.nongshim.com/" }),
  makeProduct({ id: "marron-cream-bread", brand: "CU", name: "밤 크림 찰떡빵", normalizedName: "밤크림찰떡빵", category: "dessert", productType: "limited", price: 3200, retailer: "CU", releaseDate: "2026-09-20", emoji: "🌰", description: "쫀득한 빵 안에 국내산 밤 크림을 가득 넣은 가을 한정 디저트입니다.", sourceUrl: "https://cu.bgfretail.com/product/product.do" }),
  makeProduct({ id: "zero-peach-ade", brand: "빙그레", name: "제로 복숭아 에이드 500ml", normalizedName: "제로복숭아에이드500ml", category: "drink", productType: "new", price: 2500, retailer: "세븐일레븐", releaseDate: "2026-09-18", emoji: "🍑", description: "복숭아 향을 산뜻하게 살린 무설탕 탄산 에이드입니다.", sourceUrl: "https://www.bing.co.kr/" }),
  makeProduct({ id: "fig-mascarpone-cake", brand: "투썸플레이스", name: "무화과 마스카포네 케이크", normalizedName: "무화과마스카포네케이크", category: "dessert", productType: "seasonal", price: 7200, retailer: "투썸플레이스", releaseDate: "2026-09-16", emoji: "🍰", description: "무화과와 마스카포네 크림을 층층이 쌓은 시즌 케이크입니다.", sourceUrl: "https://www.twosome.co.kr/" }),
  makeProduct({ id: "yakgwa-crunch-icecream", brand: "GS25", name: "약과 크런치 아이스크림", normalizedName: "약과크런치아이스크림", category: "icecream", productType: "limited", price: 3500, retailer: "GS25", releaseDate: "2026-09-14", emoji: "🍦", description: "달콤한 약과 조각과 시나몬 크런치를 섞은 편의점 한정 아이스크림입니다.", sourceUrl: "http://gs25.gsretail.com/" }),
];

type Seed = Pick<Product, "id" | "brand" | "name" | "normalizedName" | "category" | "productType" | "price" | "retailer" | "releaseDate" | "description" | "sourceUrl"> & { emoji: string };

function makeProduct(seed: Seed): Product {
  return { ...seed, currency: "KRW", sourceType: "official_site", firstDetectedAt: `${seed.releaseDate}T03:00:00.000Z`, lastCheckedAt: checkedAt, isActive: true, createdAt: `${seed.releaseDate}T03:00:00.000Z`, updatedAt: checkedAt };
}

export function getProduct(id: string) { return products.find((product) => product.id === id); }

