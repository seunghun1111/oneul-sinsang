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
  { brand:"bhc", category:"chicken", url:"https://www.bhc.co.kr/menu/22", label:"공식 isNew 확인 · 검수 후 공개", mode:"automatic" },
  { brand:"BBQ", category:"chicken", url:"https://dt.bbq.co.kr/menu/menuList.asp?cidx=113", label:"개별 NEW 배지 확인 · 검수 후 공개", mode:"automatic" },
  { brand:"푸라닭", category:"chicken", url:"https://puradakchicken.com/menu/product.asp", label:"공식 NEW 배지 · 검수 후 공개", mode:"automatic" },
  { brand:"네네치킨", category:"chicken", url:"https://nenechicken.com/home_menu.asp", label:"공식 NEW 배지 · 검수 후 공개", mode:"automatic" },
];

export const icecreamBrandSources: BrandCollectionSource[] = [
  { brand:"배스킨라빈스", category:"icecream", url:"https://www.baskinrobbins.co.kr/menu/fom.php", label:"이달의 맛", mode:"automatic" },
  { brand:"빙그레", category:"icecream", url:"https://www.bing.co.kr/newsroom/news", label:"공식 신제품 발표", mode:"automatic" },
  { brand:"나뚜루", category:"icecream", url:"https://www.lottesweetmall.com/product/list_ice.html?cate_no=344&sort_method=5", label:"공식 스위트몰 NEW 배지 확인", mode:"automatic" },
  { brand:"하겐다즈", category:"icecream", url:"https://haagendazs-store.co.kr/product/list.html?cate_no=25&sort_method=5", label:"공식몰 최신 목록 NEW 배지 확인", mode:"automatic" },
  { brand:"롯데웰푸드", category:"icecream", url:"https://www.lottesweetmall.com/product/list_ice.html?cate_no=343&sort_method=5", label:"공식 스위트몰 NEW 배지 확인", mode:"automatic" },
];
