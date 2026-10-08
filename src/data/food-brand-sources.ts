export type BrandCollectionSource = {
  brand: string;
  category: "chicken" | "icecream";
  url: string;
  label: string;
  mode: "automatic" | "review";
};

export const chickenBrandSources: BrandCollectionSource[] = [
  { brand:"굽네", category:"chicken", url:"https://www.goobne.co.kr/main", label:"공식 신제품", mode:"automatic" },
  { brand:"교촌치킨", category:"chicken", url:"https://www.kyochon.com/menu/chicken.asp?code=21", label:"공식 신메뉴", mode:"automatic" },
  { brand:"KFC", category:"chicken", url:"https://www.kfckorea.com/promotion/newmenu", label:"공식 신제품", mode:"automatic" },
  { brand:"맘스터치", category:"chicken", url:"https://www.momstouch.co.kr/menu/new.php?s_sect1=new", label:"공식 신제품", mode:"automatic" },
  { brand:"bhc", category:"chicken", url:"https://www.bhc.co.kr/menu/22", label:"공식 NEW 메뉴", mode:"review" },
  { brand:"BBQ", category:"chicken", url:"https://mt.bbq.co.kr/menu/menuList.asp", label:"공식 신메뉴", mode:"review" },
  { brand:"푸라닭", category:"chicken", url:"https://puradakchicken.com/menu/product.asp", label:"공식 메뉴", mode:"review" },
  { brand:"네네치킨", category:"chicken", url:"https://nenechicken.com/index.asp", label:"공식 메뉴", mode:"review" },
];

export const icecreamBrandSources: BrandCollectionSource[] = [
  { brand:"배스킨라빈스", category:"icecream", url:"https://www.baskinrobbins.co.kr/menu/fom.php", label:"이달의 맛", mode:"automatic" },
  { brand:"빙그레", category:"icecream", url:"https://www.bing.co.kr/newsroom/news", label:"공식 신제품 발표", mode:"automatic" },
  { brand:"나뚜루", category:"icecream", url:"https://www.lottefoodmall.com/html?act=main", label:"롯데웰푸드 공식몰", mode:"review" },
  { brand:"하겐다즈", category:"icecream", url:"https://haagendazs-store.co.kr/", label:"공식 스토어 신상품", mode:"review" },
  { brand:"롯데웰푸드", category:"icecream", url:"https://www.lottefoodmall.com/html?act=main", label:"공식몰 신제품", mode:"review" },
];
