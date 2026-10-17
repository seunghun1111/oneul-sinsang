import {Header} from "@/components/header";
import {ProductExplorer} from "@/components/product-explorer";
import {products} from "@/lib/products";
export const metadata={title:"상품·브랜드 통합 검색 | 신상발견"};
export default function SearchPage(){return <><Header/><main className="search-page"><ProductExplorer products={products} title="어떤 NEW를 찾으세요?" description="전체 카테고리에서 상품·브랜드를 검색하고 원하는 분류로 좁혀 보세요."/></main></>;}
