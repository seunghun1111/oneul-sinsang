import {Header} from "@/components/header";
import {CollectionCoverage} from "@/components/collection-coverage";
import {products} from "@/lib/products";
export const metadata={title:"브랜드별 수집 범위·상태 | 신상발견"};
export default function SourcesPage(){return <><Header/><main><CollectionCoverage products={products.map(({brand,category,subCategory,sourceType})=>({brand,category,subCategory,sourceType}))}/></main></>;}
