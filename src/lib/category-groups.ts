import type { ProductCategory } from "@/types/product";

export type CategoryGroup = {
  slug: string;
  label: string;
  shortLabel: string;
  emoji: string;
  description: string;
  categories: ProductCategory[];
};

export const categoryGroups: CategoryGroup[] = [
  { slug: "convenience", label: "편의점 신상", shortLabel: "편의점", emoji: "🏪", description: "CU·세븐일레븐·이마트24 공식 NEW 상품", categories: ["convenience"] },
  { slug: "cafe", label: "카페 신상", shortLabel: "카페", emoji: "☕", description: "커피 브랜드의 신메뉴·푸드·MD", categories: ["cafe"] },
  { slug: "foodservice", label: "햄버거·피자·치킨", shortLabel: "햄버거·피자·치킨", emoji: "🍔", description: "외식 브랜드 공식 메뉴의 NEW 상품", categories: ["burger", "pizza", "chicken"] },
  { slug: "meal", label: "식사 신상", shortLabel: "식사", emoji: "🍜", description: "라면과 간편식 신상품", categories: ["ramen", "meal"] },
  { slug: "snack", label: "간식·디저트 신상", shortLabel: "간식·디저트", emoji: "🍰", description: "과자·디저트·아이스크림 신상품", categories: ["snack", "dessert", "icecream"] },
  { slug: "drink", label: "음료·기타 신상", shortLabel: "음료", emoji: "🥤", description: "음료와 기타 생활 신상품", categories: ["drink", "etc"] },
];

export function getCategoryGroup(slug: string) {
  return categoryGroups.find(group => group.slug === slug);
}

export function getCategoryGroupForCategory(category: ProductCategory) {
  return categoryGroups.find(group => group.categories.includes(category));
}
