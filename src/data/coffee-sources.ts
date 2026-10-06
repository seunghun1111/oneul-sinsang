export type CoffeeSourceKind = "menu" | "md" | "news" | "shop";
export interface CoffeeSourceLink { kind: CoffeeSourceKind; label: string; url: string; providesPrice?: boolean; priceScope?: string; }
export interface CoffeeBrandSource { id: string; brand: string; channels: CoffeeSourceLink[]; note: string; priceAccess: "web" | "app" | "none"; priceNote: string; }

const baseCoffeeBrandSources: Omit<CoffeeBrandSource, "priceAccess" | "priceNote">[] = [
  { id:"starbucks", brand:"스타벅스", note:"신규·시즌 필터로 메뉴와 상품을 확인", channels:[{kind:"menu",label:"음료",url:"https://www.starbucks.co.kr/menu/drink_list.do"},{kind:"menu",label:"푸드",url:"https://www.starbucks.co.kr/menu/food_list.do"},{kind:"md",label:"MD 상품",url:"https://www.starbucks.co.kr/menu/product_list.do"},{kind:"shop",label:"원두·VIA",url:"https://www.starbucks.co.kr/coffee/product_list.do"}]},
  { id:"twosome", brand:"투썸플레이스", note:"NEW·커피·디저트·상품 통합 메뉴", channels:[{kind:"menu",label:"통합 메뉴",url:"https://d-mcdn.twosome.co.kr/mn/menuInfoList.do"},{kind:"news",label:"공식 홈페이지",url:"https://www.twosome.co.kr/"}]},
  { id:"ediya", brand:"이디야커피", note:"음료·푸드·MD를 공식 상품 목록에서 확인", channels:[{kind:"menu",label:"메뉴",url:"https://www.ediya.com/contents/drink.html"},{kind:"md",label:"MD 상품",url:"https://www.ediya.com/contents/product.html"},{kind:"news",label:"소식",url:"https://www.ediya.com/contents/notice.html"}]},
  { id:"mega", brand:"메가MGC커피", note:"메인 프로모션과 메뉴에서 시즌 상품 확인", channels:[{kind:"news",label:"시즌 소식",url:"https://www.mega-mgccoffee.com/"},{kind:"menu",label:"메뉴",url:"https://www.mega-mgccoffee.com/menu/"}]},
  { id:"compose", brand:"컴포즈커피", note:"시즌한정 메뉴와 MD상품 카테고리 확인", channels:[{kind:"menu",label:"메뉴",url:"https://composecoffee.com/menu"},{kind:"md",label:"MD 상품",url:"https://composecoffee.com/menu/category/98609"},{kind:"news",label:"새소식",url:"https://composecoffee.com/notice"}]},
  { id:"paik", brand:"빽다방", note:"신메뉴와 콜라보 MD를 공식 소식에서 확인", channels:[{kind:"menu",label:"메뉴",url:"https://paikdabang.com/menu/menu_new/"},{kind:"news",label:"소식",url:"https://paikdabang.com/news/"}]},
  { id:"theventi", brand:"더벤티", note:"신메뉴·음료·디저트 공식 메뉴 확인", channels:[{kind:"menu",label:"메뉴",url:"https://www.theventi.co.kr/new2022/menu/all.html"},{kind:"news",label:"소식",url:"https://www.theventi.co.kr/new2022/community/notice.html"}]},
  { id:"mammoth", brand:"매머드커피", note:"공식 홈페이지 메뉴와 공지 확인", channels:[{kind:"menu",label:"메뉴",url:"https://mmthcoffee.com/sub/menu/list.html"},{kind:"news",label:"공식 홈페이지",url:"https://mmthcoffee.com/"}]},
  { id:"hollys", brand:"할리스", note:"음료·푸드와 MD 전용 목록을 분리 수집", channels:[{kind:"menu",label:"메뉴",url:"https://www.hollys.co.kr/menu/espresso.do"},{kind:"md",label:"MD 상품",url:"https://www.hollys.co.kr/menu/md.do"},{kind:"news",label:"소식",url:"https://www.hollys.co.kr/news/notice/list.do"}]},
  { id:"coffeebean", brand:"커피빈코리아", note:"새소식에서 시즌 메뉴와 MD 출시 확인", channels:[{kind:"menu",label:"메뉴",url:"https://www.coffeebeankorea.com/menu/list.asp"},{kind:"news",label:"새소식",url:"https://www.coffeebeankorea.com/news/list.asp"}]},
  { id:"paulbassett", brand:"폴 바셋", note:"NEW 표시가 있는 메뉴·원두·MD 상품 확인", channels:[{kind:"menu",label:"메뉴",url:"https://www.baristapaulbassett.co.kr/menu/List.pb"},{kind:"md",label:"원두·MD",url:"https://www.baristapaulbassett.co.kr/menu/List.pb?cid1=E"},{kind:"news",label:"소식",url:"https://www.baristapaulbassett.co.kr/whatsNews/event/List.pb"}]},
  { id:"pascucci", brand:"파스쿠찌", note:"시즌 메뉴와 상품·프로모션을 공식 홈페이지에서 확인", channels:[{kind:"menu",label:"메뉴",url:"https://www.caffe-pascucci.co.kr/menu/menuList.asp"},{kind:"news",label:"소식",url:"https://www.caffe-pascucci.co.kr/event/eventList.asp"}]},
  { id:"angelinus", brand:"엔제리너스", note:"공식 메뉴와 이벤트·공지에서 신상품 확인", channels:[{kind:"menu",label:"메뉴",url:"https://www.angelinus.com/menu/menu.asp"},{kind:"news",label:"소식",url:"https://www.angelinus.com/Notice/Notice.asp"}]},
  { id:"tomntoms", brand:"탐앤탐스", note:"음료·푸드·MD와 공식 새소식 확인", channels:[{kind:"menu",label:"메뉴",url:"https://www.tomntoms.com/menu/menu.html"},{kind:"news",label:"공식 홈페이지",url:"https://www.tomntoms.com/"}]},
  { id:"coffeebay", brand:"커피베이", note:"신메뉴와 브랜드 소식을 공식 홈페이지에서 확인", channels:[{kind:"menu",label:"메뉴",url:"https://www.coffeebay.com/menu/menu.php"},{kind:"news",label:"공식 홈페이지",url:"https://www.coffeebay.com/"}]},
  { id:"gongcha", brand:"공차", note:"신메뉴·디저트·MD상품 전용 메뉴 확인", channels:[{kind:"menu",label:"신메뉴",url:"https://www.gong-cha.co.kr/brand/menu/new.php"},{kind:"md",label:"MD 상품",url:"https://www.gong-cha.co.kr/brand/menu/product.php"}]},
  { id:"bluebottle", brand:"블루보틀", note:"카페 메뉴 소식과 온라인 원두·MD 판매를 함께 확인", channels:[{kind:"news",label:"카페 소식",url:"https://kr.bluebottlecoffee.com/blogs/blue-bottle-cafe"},{kind:"shop",label:"원두·커피",url:"https://kr.bluebottlecoffee.com/collections/blends"},{kind:"md",label:"컵·텀블러",url:"https://kr.bluebottlecoffee.com/pages/all-cup-n-tumbler"}]},
  { id:"terarosa", brand:"테라로사", note:"온라인 숍에서 신규 원두·드립백·MD 확인", channels:[{kind:"shop",label:"온라인 숍",url:"https://terarosa.com/shop"},{kind:"news",label:"공식 홈페이지",url:"https://terarosa.com/"}]},
];

const priceProfiles: Record<string, { access:"web"|"app"|"none"; note:string; link?:CoffeeSourceLink }> = {
  starbucks:{access:"app",note:"매장 메뉴 가격은 스타벅스 앱 주문에서 확인"},
  twosome:{access:"app",note:"매장 메뉴 가격은 투썸하트 앱에서 확인"},
  ediya:{access:"web",note:"공식몰에서 원두·유통제품 가격 확인",link:{kind:"shop",label:"이디야 공식몰",url:"https://ediyastore.com/",providesPrice:true,priceScope:"원두·유통제품"}},
  mega:{access:"app",note:"매장별 메뉴 가격은 메가MGC커피 앱에서 확인"},
  compose:{access:"none",note:"공개 웹 메뉴에는 가격이 없어 매장 확인 필요"},
  paik:{access:"app",note:"매장 메뉴 가격은 빽다방 앱 스마트오더에서 확인"},
  theventi:{access:"app",note:"매장별 메뉴 가격은 더벤티 앱에서 확인"},
  mammoth:{access:"app",note:"매장별 메뉴 가격은 매머드오더 앱에서 확인"},
  hollys:{access:"web",note:"공식 E-Store에서 MD·원두 가격 확인",link:{kind:"shop",label:"할리스 E-Store",url:"https://smartstore.naver.com/hollyscoffee",providesPrice:true,priceScope:"MD·원두"}},
  coffeebean:{access:"web",note:"공식 온라인몰에서 원두·캡슐·MD 가격 확인",link:{kind:"shop",label:"커피빈 온라인몰",url:"https://www.coffeebeankorea.com/product/list.asp",providesPrice:true,priceScope:"원두·캡슐·MD"}},
  paulbassett:{access:"web",note:"공식 E-SHOP에서 커피상품 가격 확인",link:{kind:"shop",label:"폴 바셋 E-SHOP",url:"https://www.baristapaulbassett.co.kr/eshop/index.pb",providesPrice:true,priceScope:"원두·커피상품"}},
  pascucci:{access:"app",note:"매장 메뉴 가격은 해피오더 등 공식 주문 채널에서 확인"},
  angelinus:{access:"app",note:"매장 메뉴 가격은 롯데잇츠 주문 채널에서 확인"},
  tomntoms:{access:"none",note:"공개 공식 메뉴에는 가격이 없어 매장 확인 필요"},
  coffeebay:{access:"none",note:"공개 공식 메뉴에는 가격이 없어 매장 확인 필요"},
  gongcha:{access:"app",note:"매장별 메뉴 가격은 공차 멤버십 앱에서 확인"},
  bluebottle:{access:"web",note:"공식 온라인몰에서 원두·MD 가격과 재고 확인"},
  terarosa:{access:"web",note:"공식 온라인몰에서 원두·드립백·MD 가격 확인"},
};

export const coffeeBrandSources: CoffeeBrandSource[] = baseCoffeeBrandSources.map(source => {
  const profile = priceProfiles[source.id] ?? { access:"none" as const, note:"공식 가격 경로 확인 필요" };
  const channels = profile.link && !source.channels.some(channel => channel.url === profile.link?.url) ? [...source.channels, profile.link] : source.channels.map(channel => channel.kind === "shop" && profile.access === "web" ? { ...channel, providesPrice:true, priceScope:profile.note.replace(/^.*?에서 /, "").replace(/ 가격.*$/, "") } : channel);
  return { ...source, channels, priceAccess:profile.access, priceNote:profile.note };
});
