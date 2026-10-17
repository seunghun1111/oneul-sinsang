import {Header} from "@/components/header";
import {ProductExplorer} from "@/components/product-explorer";
import {products} from "@/lib/products";
export const metadata={title:"내 관심 신상 | 신상발견"};
export default function SavedPage(){return <><Header/><main><ProductExplorer products={products} favoritesPage title="내 관심 신상" description="상품 별표와 관심 브랜드로 나만의 목록을 만들어 보세요. 현재 브라우저에만 저장되며 다른 기기와 동기화되지 않습니다."/></main></>;}
