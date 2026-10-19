import { notFound } from "next/navigation";
import { CoffeeSourceDirectory } from "@/components/coffee-source-directory";
import { Header } from "@/components/header";
import { ProductExplorer } from "@/components/product-explorer";
import { BrandCollectionSources } from "@/components/brand-collection-sources";
import { coffeeBrandSources } from "@/data/coffee-sources";
import { chickenBrandSources, icecreamBrandSources } from "@/data/food-brand-sources";
import { categoryGroups, getCategoryGroup,productInCategoryGroup } from "@/lib/category-groups";
import { products } from "@/lib/products";
import {CollectionCoverage} from "@/components/collection-coverage";

export function generateStaticParams() {
  return categoryGroups.map(({ slug }) => ({ slug }));
}

export default async function CategoryPage(props: PageProps<"/categories/[slug]">) {
  const { slug } = await props.params;
  const group = getCategoryGroup(slug);
  if (!group) notFound();
  const categoryProducts = products.filter(product => productInCategoryGroup(product,slug));

  return <><Header /><main className="category-page">
    <section className="category-hero"><span aria-hidden="true">{group.emoji}</span><div><p className="section-kicker">CATEGORY</p><h1>{group.label}</h1><p>{group.description}</p></div><strong>{categoryProducts.length}<small>개 신상</small></strong></section>
    <ProductExplorer products={categoryProducts} title={group.label} description={["convenience","meal","snack","drink"].includes(slug)?"공식 사이트의 NEW 상품입니다. 공식 분류가 명확한 CU 상품은 편의점과 식사·간식·음료 메뉴에 함께 표시하며 원래 분류·상품 기록은 유지합니다.":"공식 사이트의 NEW 상품입니다. 기간 제한 없이 NEW 표시 유지 여부를 추적합니다."} />
    <CollectionCoverage products={products.map(({brand,category,subCategory,sourceType})=>({brand,category,subCategory,sourceType}))} additionalCategory={slug==="foodservice"?"chicken":slug==="snack"?"icecream":undefined} groups={slug==="cafe"?["coffee"]:slug==="convenience"?["cu","convenience"]:slug==="foodservice"?["foodservice","additional"]:slug==="snack"?["cu","convenience","icecream","additional","press"]:["cu","convenience","press"]}/>
    {slug === "cafe" && <CoffeeSourceDirectory sources={coffeeBrandSources} />}
    {slug === "foodservice" && <BrandCollectionSources title="치킨 브랜드 수집 경로" sources={chickenBrandSources} />}
    {slug === "snack" && <BrandCollectionSources title="아이스크림 브랜드 수집 경로" sources={icecreamBrandSources} />}
  </main></>;
}
