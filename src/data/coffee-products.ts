import type { Product } from "@/types/product";

const checkedAt = "2026-10-06T02:00:00.000Z";

const rawCoffeeProducts: Product[] = [
  { id:"mega-house-milk-latte-2026-fall", brand:"메가MGC커피", name:"하우스밀크 라떼", normalizedName:"하우스밀크라떼", category:"cafe", subCategory:"음료", productType:"seasonal", currency:"KRW", sourceUrl:"https://www.mega-mgccoffee.com/", sourceType:"official_site", firstDetectedAt:checkedAt, lastCheckedAt:checkedAt, description:"메가MGC커피 하우스밀크와 에스프레소를 블렌딩한 2026 가을 시즌 라떼", isActive:true, createdAt:checkedAt, updatedAt:checkedAt },
  { id:"mega-orzo-latte-2026-fall", brand:"메가MGC커피", name:"무카페인 오르조라떼", normalizedName:"무카페인오르조라떼", category:"cafe", subCategory:"음료", productType:"seasonal", currency:"KRW", sourceUrl:"https://www.mega-mgccoffee.com/", sourceType:"official_site", firstDetectedAt:checkedAt, lastCheckedAt:checkedAt, description:"이탈리아산 오르조와 우유를 조합한 무카페인 2026 가을 시즌 라떼", isActive:true, createdAt:checkedAt, updatedAt:checkedAt },
  { id:"mega-golden-apple-black-tea-2026-fall", brand:"메가MGC커피", name:"저당 골든애플 블랙티", normalizedName:"저당골든애플블랙티", category:"cafe", subCategory:"음료", productType:"seasonal", currency:"KRW", sourceUrl:"https://www.mega-mgccoffee.com/", sourceType:"official_site", firstDetectedAt:checkedAt, lastCheckedAt:checkedAt, description:"사과와 블랙티를 조합하고 알룰로스를 사용한 저당 시즌 음료", isActive:true, createdAt:checkedAt, updatedAt:checkedAt },
  { id:"mega-sweet-harvest-bread-2026-fall", brand:"메가MGC커피", name:"밤고구마단호박팥크림치즈빵", normalizedName:"밤고구마단호박팥크림치즈빵", category:"cafe", subCategory:"푸드", productType:"seasonal", currency:"KRW", sourceUrl:"https://www.mega-mgccoffee.com/", sourceType:"official_site", firstDetectedAt:checkedAt, lastCheckedAt:checkedAt, description:"밤·고구마·단호박·팥과 크림치즈를 담은 2026 가을 시즌 베이커리", isActive:true, createdAt:checkedAt, updatedAt:checkedAt },
  { id:"coffeebean-sparkling-apple-spice-2026", brand:"커피빈코리아", name:"스파클링 애플 스파이스", normalizedName:"스파클링애플스파이스", category:"cafe", subCategory:"음료", productType:"seasonal", currency:"KRW", sourceUrl:"https://www.coffeebeankorea.com/menu/list.asp?category=32", sourceType:"official_site", releaseDate:"2026-09-01", firstDetectedAt:checkedAt, lastCheckedAt:checkedAt, description:"사과에 시나몬과 진저 풍미를 더한 가을 시즌 스파클링 음료", isActive:true, createdAt:checkedAt, updatedAt:checkedAt },
  { id:"coffeebean-apple-spice-tea-2026", brand:"커피빈코리아", name:"애플 스파이스 티", normalizedName:"애플스파이스티", category:"cafe", subCategory:"음료", productType:"seasonal", currency:"KRW", sourceUrl:"https://www.coffeebeankorea.com/menu/list.asp?category=32", sourceType:"official_site", releaseDate:"2026-09-01", firstDetectedAt:checkedAt, lastCheckedAt:checkedAt, description:"사과와 시나몬, 진저 향이 어우러진 가을 시즌 티 음료", isActive:true, createdAt:checkedAt, updatedAt:checkedAt },
  { id:"coffeebean-apple-pie-cream-latte-2026", brand:"커피빈코리아", name:"애플파이 크림라떼", normalizedName:"애플파이크림라떼", category:"cafe", subCategory:"음료", productType:"seasonal", currency:"KRW", sourceUrl:"https://www.coffeebeankorea.com/menu/list.asp?category=32", sourceType:"official_site", releaseDate:"2026-09-01", firstDetectedAt:checkedAt, lastCheckedAt:checkedAt, description:"사과·카라멜·시나몬 베이스에 에스프레소와 애플 카라멜 크림을 더한 시즌 라떼", isActive:true, createdAt:checkedAt, updatedAt:checkedAt },
  { id:"coffeebean-iced-apple-pie-cream-latte-2026", brand:"커피빈코리아", name:"아이스 애플파이 크림라떼", normalizedName:"아이스애플파이크림라떼", category:"cafe", subCategory:"음료", productType:"seasonal", currency:"KRW", sourceUrl:"https://www.coffeebeankorea.com/menu/list.asp?category=32", sourceType:"official_site", releaseDate:"2026-09-01", firstDetectedAt:checkedAt, lastCheckedAt:checkedAt, description:"애플 카라멜 크림을 더해 가을의 맛을 담은 아이스 시즌 라떼", isActive:true, createdAt:checkedAt, updatedAt:checkedAt },
  { id:"coffeebean-ribbon-garden-tumbler-2026", brand:"커피빈코리아", name:"리본가든 텀블러 MD", normalizedName:"리본가든텀블러MD", category:"cafe", subCategory:"MD", productType:"limited", currency:"KRW", sourceUrl:"https://www.coffeebeankorea.com/news/view.asp?category=1&page=1&seq=435&viewMode=1", sourceType:"official_site", releaseDate:"2026-07-01", firstDetectedAt:checkedAt, lastCheckedAt:checkedAt, description:"커피빈코리아가 공식 새소식으로 공개한 리본가든 시즌 텀블러", isActive:true, createdAt:checkedAt, updatedAt:checkedAt },
  { id:"paulbassett-nutty-mellow-dripbag-2026", brand:"폴 바셋", name:"드립백 너티멜로우", normalizedName:"드립백너티멜로우", category:"cafe", subCategory:"원두·캡슐", productType:"new", currency:"KRW", sourceUrl:"https://www.baristapaulbassett.co.kr/menu/List.pb?cid1=E", sourceType:"official_site", firstDetectedAt:checkedAt, lastCheckedAt:checkedAt, description:"폴 바셋 공식 PRODUCT 목록에서 NEW로 확인된 너티멜로우 드립백", isActive:true, createdAt:checkedAt, updatedAt:checkedAt },
  { id:"paulbassett-soil-mug-green-2026", brand:"폴 바셋", name:"소일머그 그린", normalizedName:"소일머그그린", category:"cafe", subCategory:"MD", productType:"new", currency:"KRW", sourceUrl:"https://www.baristapaulbassett.co.kr/menu/List.pb?cid1=E&cid2=A", sourceType:"official_site", firstDetectedAt:checkedAt, lastCheckedAt:checkedAt, description:"폴 바셋 공식 PRODUCT 목록에서 NEW로 확인된 그린 컬러 머그", isActive:true, createdAt:checkedAt, updatedAt:checkedAt },
  { id:"paulbassett-dripbag-signature-2026", brand:"폴 바셋", name:"드립백 시그니처 블렌드", normalizedName:"드립백시그니처블렌드", category:"cafe", subCategory:"원두·캡슐", productType:"new", currency:"KRW", sourceUrl:"https://www.baristapaulbassett.co.kr/menu/List.pb?cid1=E", sourceType:"official_site", firstDetectedAt:checkedAt, lastCheckedAt:checkedAt, description:"폴 바셋 공식 PRODUCT 목록에서 NEW로 확인된 시그니처 블렌드 드립백", isActive:true, createdAt:checkedAt, updatedAt:checkedAt },
  { id:"paulbassett-dripbag-ethiopia-2026", brand:"폴 바셋", name:"드립백 에티오피아", normalizedName:"드립백에티오피아", category:"cafe", subCategory:"원두·캡슐", productType:"new", currency:"KRW", sourceUrl:"https://www.baristapaulbassett.co.kr/menu/List.pb?cid1=E", sourceType:"official_site", firstDetectedAt:checkedAt, lastCheckedAt:checkedAt, description:"폴 바셋 공식 PRODUCT 목록에서 NEW로 확인된 에티오피아 드립백", isActive:true, createdAt:checkedAt, updatedAt:checkedAt },
  { id:"paulbassett-dripbag-guatemala-2026", brand:"폴 바셋", name:"드립백 과테말라", normalizedName:"드립백과테말라", category:"cafe", subCategory:"원두·캡슐", productType:"new", currency:"KRW", sourceUrl:"https://www.baristapaulbassett.co.kr/menu/List.pb?cid1=E", sourceType:"official_site", firstDetectedAt:checkedAt, lastCheckedAt:checkedAt, description:"폴 바셋 공식 PRODUCT 목록에서 NEW로 확인된 과테말라 드립백", isActive:true, createdAt:checkedAt, updatedAt:checkedAt },
  { id:"paulbassett-dripbag-decaf-2026", brand:"폴 바셋", name:"드립백 디카페인 블렌드", normalizedName:"드립백디카페인블렌드", category:"cafe", subCategory:"원두·캡슐", productType:"new", currency:"KRW", sourceUrl:"https://www.baristapaulbassett.co.kr/menu/List.pb?cid1=E", sourceType:"official_site", firstDetectedAt:checkedAt, lastCheckedAt:checkedAt, description:"폴 바셋 공식 PRODUCT 목록에서 NEW로 확인된 디카페인 블렌드 드립백", isActive:true, createdAt:checkedAt, updatedAt:checkedAt },
  { id:"paulbassett-nutty-mellow-blend-2026", brand:"폴 바셋", name:"너티멜로우 블렌드", normalizedName:"너티멜로우블렌드", category:"cafe", subCategory:"원두·캡슐", productType:"new", currency:"KRW", sourceUrl:"https://www.baristapaulbassett.co.kr/menu/List.pb?cid1=E", sourceType:"official_site", firstDetectedAt:checkedAt, lastCheckedAt:checkedAt, description:"폴 바셋 공식 PRODUCT 목록에서 NEW로 확인된 너티멜로우 원두", isActive:true, createdAt:checkedAt, updatedAt:checkedAt },
  { id:"paulbassett-soil-mug-brown-2026", brand:"폴 바셋", name:"소일머그 브라운", normalizedName:"소일머그브라운", category:"cafe", subCategory:"MD", productType:"new", currency:"KRW", sourceUrl:"https://www.baristapaulbassett.co.kr/menu/List.pb?cid1=E", sourceType:"official_site", firstDetectedAt:checkedAt, lastCheckedAt:checkedAt, description:"폴 바셋 공식 PRODUCT 목록에서 NEW로 확인된 브라운 컬러 머그", isActive:true, createdAt:checkedAt, updatedAt:checkedAt },
  { id:"hollys-hanbok-hollybear-keyring-2026", brand:"할리스", name:"한복 할리베어 키링", normalizedName:"한복할리베어키링", category:"cafe", subCategory:"MD", productType:"limited", currency:"KRW", sourceUrl:"https://www.hollys.co.kr/menu/md.do", sourceType:"official_site", firstDetectedAt:checkedAt, lastCheckedAt:checkedAt, description:"할리스 공식 MD 목록에서 확인된 한복 콘셉트 할리베어 키링", isActive:true, createdAt:checkedAt, updatedAt:checkedAt },
  { id:"paik-chunbae-collaboration-2026", brand:"빽다방", name:"춘배와 친구들 콜라보 음료·MD", normalizedName:"춘배와친구들콜라보음료MD", category:"cafe", subCategory:"콜라보 MD", productType:"limited", currency:"KRW", retailer:"일부 판매 매장", sourceUrl:"https://paikdabang.com/post_news/meowman/", sourceType:"official_site", releaseDate:"2026-05-21", firstDetectedAt:checkedAt, lastCheckedAt:checkedAt, description:"콜라보 음료 2종과 키링·변온컵·인형키링 세트로 구성된 한정 상품", isActive:true, createdAt:checkedAt, updatedAt:checkedAt },
];

const confirmedCurrentSaleIds = new Set([
  "mega-house-milk-latte-2026-fall",
  "mega-orzo-latte-2026-fall",
  "mega-golden-apple-black-tea-2026-fall",
  "mega-sweet-harvest-bread-2026-fall",
  "coffeebean-sparkling-apple-spice-2026",
  "coffeebean-apple-spice-tea-2026",
  "coffeebean-apple-pie-cream-latte-2026",
  "coffeebean-iced-apple-pie-cream-latte-2026",
  "paulbassett-nutty-mellow-dripbag-2026",
  "paulbassett-soil-mug-green-2026",
  "paulbassett-dripbag-signature-2026",
  "paulbassett-dripbag-ethiopia-2026",
  "paulbassett-dripbag-guatemala-2026",
  "paulbassett-dripbag-decaf-2026",
  "paulbassett-nutty-mellow-blend-2026",
  "paulbassett-soil-mug-brown-2026",
  "hollys-hanbok-hollybear-keyring-2026",
]);

export const coffeeProducts: Product[] = rawCoffeeProducts.map(product => confirmedCurrentSaleIds.has(product.id)
  ? { ...product, availabilityStatus:"on_sale", availabilityCheckedAt:checkedAt }
  : { ...product, availabilityStatus:"unknown" });
