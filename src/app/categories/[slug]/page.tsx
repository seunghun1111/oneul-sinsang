import { notFound } from "next/navigation";
import { CoffeeSourceDirectory } from "@/components/coffee-source-directory";
import { Header } from "@/components/header";
import { ProductExplorer } from "@/components/product-explorer";
import { BrandCollectionSources } from "@/components/brand-collection-sources";
import { coffeeBrandSources } from "@/data/coffee-sources";
import { chickenBrandSources, icecreamBrandSources } from "@/data/food-brand-sources";
import { categoryGroups, getCategoryGroup } from "@/lib/category-groups";
import { products } from "@/lib/products";

export function generateStaticParams() {
  return categoryGroups.map(({ slug }) => ({ slug }));
}

export default async function CategoryPage(props: PageProps<"/categories/[slug]">) {
  const { slug } = await props.params;
  const group = getCategoryGroup(slug);
  if (!group) notFound();
  const categoryProducts = products.filter(product => group.categories.includes(product.category));

  return <><Header /><main className="category-page">
    <section className="category-hero"><span aria-hidden="true">{group.emoji}</span><div><p className="section-kicker">CATEGORY</p><h1>{group.label}</h1><p>{group.description}</p></div><strong>{categoryProducts.length}<small>개 신상</small></strong></section>
    <ProductExplorer products={categoryProducts} title={group.label} description="공식 출시일 또는 최초 확인일부터 30일 이내인 상품만 표시합니다." />
    {slug === "cafe" && <CoffeeSourceDirectory sources={coffeeBrandSources} />}
    {slug === "foodservice" && <BrandCollectionSources title="치킨 브랜드 수집 경로" sources={chickenBrandSources} />}
    {slug === "snack" && <BrandCollectionSources title="아이스크림 브랜드 수집 경로" sources={icecreamBrandSources} />}
  </main></>;
}
