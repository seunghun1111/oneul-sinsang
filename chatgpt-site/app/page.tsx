"use client";
/* eslint-disable @next/next/no-img-element -- 공식 이미지를 복제·최적화하지 않고 원본 주소로 표시합니다. */
import { useEffect, useMemo, useState } from "react";
import { Grid2X2, List, RefreshCw, Search } from "lucide-react";
import offerData from "../data/offers.json";

type Product = { id:string|number; brand:string; name:string; category:string; subCategory?:string; productType:string; price:number|null; retailer:string|null; releaseDate:string|null; announcedDate:string|null; description:string; emoji:string; sourceUrl:string; imageUrl:string|null; availabilityStatus?:string; availabilityCheckedAt?:string };
type Offer = { id:string; productSlug:string; retailer:string; title:string; url:string; price:number; regularPrice:number|null; quantity:number; unit:string; stockStatus:"in_stock"|"out_of_stock"|"unknown"; observedAt:string };
type CoffeeSource = { id:string; brand:string; note:string; priceAccess:"web"|"app"|"none"; priceNote:string; channels:{ kind:"menu"|"md"|"news"|"shop"; label:string; url:string; providesPrice?:boolean; priceScope?:string }[] };
const fallbackOffers = offerData as Offer[];
const cats = [["all","전체"],["cafe","카페"],["drink","음료"],["ramen","라면"],["meal","간편식"],["snack","과자"],["dessert","디저트"],["icecream","아이스크림"],["etc","기타"]];
const labels = Object.fromEntries(cats);

function ProductVisual({ product }: { product: Product }) {
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null);
  return <div className={`visual visual-${product.category}`}>
    {product.imageUrl && product.imageUrl !== failedImageUrl
      ? <img className="product-photo" src={product.imageUrl} alt={`${product.name} 상품 이미지`} loading="lazy" referrerPolicy="no-referrer" onError={() => setFailedImageUrl(product.imageUrl)} />
      : <span aria-hidden="true">{product.emoji}</span>}
  </div>;
}

function ProductCard({ product, offers }: { product: Product; offers: Offer[] }) {
  const summary = product.description.replace(/^공식 발표 \d{4}-\d{2}-\d{2} · /, "").trim();
  const productOffers = offers.filter(offer => offer.productSlug === productSlug(product.sourceUrl));
  const lowestOffer = productOffers.filter(offer => offer.stockStatus === "in_stock").toSorted((a,b)=>a.price-b.price)[0];
  const saleCheckedAt = lowestOffer?.observedAt ?? product.availabilityCheckedAt;
  return <article>
    <ProductVisual product={product}/>
    <div className="card-body">
      <p>{product.brand} · {product.subCategory ?? labels[product.category] ?? "기타"}</p>
      <h2>{product.name}</h2>
      {summary && <p className="summary">{summary}</p>}
      <div className="meta">
        {lowestOffer ? <strong>{lowestOffer.price.toLocaleString("ko-KR")}원부터</strong> : product.price != null ? <strong>{product.price.toLocaleString("ko-KR")}원</strong> : <strong className="price-unavailable">공식 가격 미제공</strong>}
        {saleCheckedAt && <time dateTime={saleCheckedAt}>판매 확인 {saleCheckedAt.slice(0,10).replaceAll("-", ".")}</time>}
      </div>
      {product.retailer && <p className="retailer">판매처 {product.retailer}</p>}
      {productOffers.length > 0 && <div className="offers" aria-label={`${product.name} 온라인 판매 정보`}>{productOffers.map(offer=><a key={offer.id} href={offer.url} target="_blank" rel="noopener noreferrer"><span><b>{offer.retailer}</b><small>{offer.quantity > 1 ? `${offer.quantity}개 · ` : ""}{offer.unit}</small></span><span><strong>{offer.price.toLocaleString("ko-KR")}원</strong><small>{offer.stockStatus === "in_stock" ? "판매 중" : offer.stockStatus === "out_of_stock" ? "품절" : "상태 확인 필요"}</small></span></a>)}</div>}
      {product.sourceUrl && <a className="source" href={product.sourceUrl} target="_blank" rel="noopener noreferrer">공식 출처 보기</a>}
    </div>
  </article>;
}

function productSlug(sourceUrl:string) {
  const url = new URL(sourceUrl);
  if (url.hostname === "www.orionworld.com") return `orion-${url.searchParams.get("boardno")}`;
  if (url.hostname === "www.maeil.com") return `maeil-${url.searchParams.get("idx")}`;
  if (url.hostname === "samyangfoods.com") return `samyang-${url.searchParams.get("seq")}`;
  if (url.hostname === "www.bing.co.kr") return `binggrae-${url.searchParams.get("anno_idx")}`;
  if (url.hostname === "news.pulmuone.co.kr") return `pulmuone-${url.searchParams.get("id")}`;
  return "";
}

function mergeCurrentProducts(items:Product[], external:Product[], currentOffers:Offer[]) {
  const coffee = external.filter(product => product.category === "cafe").map(product => ({...product, price:product.price ?? null, retailer:product.retailer ?? null, releaseDate:product.releaseDate ?? null, announcedDate:product.releaseDate ?? null, description:product.description ?? "", emoji:product.subCategory?.includes("MD") ? "🎁" : "☕", imageUrl:product.imageUrl ?? null}));
  const externalIds = new Set(external.map(product => String(product.id)));
  const now = Date.now();
  const verified = items.filter(product => {
    if (externalIds.has(String(product.id))) return true;
    const released = new Date(product.releaseDate ?? product.announcedDate ?? 0).getTime();
    const isNew = Number.isFinite(released) && now - released <= 90 * 86_400_000;
    const hasLiveOffer = currentOffers.some(offer => offer.productSlug === productSlug(product.sourceUrl) && offer.stockStatus === "in_stock" && now - new Date(offer.observedAt).getTime() <= 14 * 86_400_000);
    return isNew && hasLiveOffer;
  });
  return [...new Map([...verified,...coffee].map(product=>[String(product.id),product])).values()];
}

export default function Home() {
  const [items,setItems] = useState<Product[]>([]);
  const [offers,setOffers] = useState<Offer[]>(fallbackOffers);
  const [coffeeSources,setCoffeeSources] = useState<CoffeeSource[]>([]);
  const [cat,setCat] = useState("all");
  const [brand,setBrand] = useState("all");
  const [query,setQuery] = useState("");
  const [view,setView] = useState<"card"|"list">("card");
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState("");

  async function load() {
    setLoading(true); setError("");
    try {
      const [response, offerResponse, productResponse, sourceResponse] = await Promise.all([
        fetch("/api/products", { cache: "no-store" }),
        fetch("https://seunghun1111.github.io/oneul-sinsang/data/offers.json", { cache: "no-store" }),
        fetch("https://seunghun1111.github.io/oneul-sinsang/data/products.json", { cache: "no-store" }),
        fetch("https://seunghun1111.github.io/oneul-sinsang/data/coffee-sources.json", { cache: "no-store" }),
      ]);
      const data = await response.json() as { error?: string; products?: Product[] };
      if (!response.ok) throw new Error(data.error ?? "상품을 불러오지 못했습니다.");
      const external = productResponse.ok ? await productResponse.json() as Product[] : [];
      const currentOffers = offerResponse.ok ? await offerResponse.json() as Offer[] : fallbackOffers;
      setItems(mergeCurrentProducts(data.products ?? [], external, currentOffers));
      setOffers(currentOffers);
      if (sourceResponse.ok) setCoffeeSources(await sourceResponse.json() as CoffeeSource[]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "상품을 불러오지 못했습니다.");
    } finally { setLoading(false); }
  }
  useEffect(() => {
    let active = true;
    Promise.all([
      fetch("/api/products", { cache: "no-store" }),
      fetch("https://seunghun1111.github.io/oneul-sinsang/data/offers.json", { cache: "no-store" }).catch(() => null),
      fetch("https://seunghun1111.github.io/oneul-sinsang/data/products.json", { cache: "no-store" }).catch(() => null),
      fetch("https://seunghun1111.github.io/oneul-sinsang/data/coffee-sources.json", { cache: "no-store" }).catch(() => null),
    ])
      .then(async ([response, offerResponse, productResponse, sourceResponse]) => {
        const data = await response.json() as { error?: string; products?: Product[] };
        if (!response.ok) throw new Error(data.error ?? "상품을 불러오지 못했습니다.");
        const external = productResponse?.ok ? await productResponse.json() as Product[] : [];
        const currentOffers = offerResponse?.ok ? await offerResponse.json() as Offer[] : fallbackOffers;
        if (active) setItems(mergeCurrentProducts(data.products ?? [], external, currentOffers));
        if (active) setOffers(currentOffers);
        if (active && sourceResponse?.ok) setCoffeeSources(await sourceResponse.json() as CoffeeSource[]);
      })
      .catch(cause => { if (active) setError(cause instanceof Error ? cause.message : "상품을 불러오지 못했습니다."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  const availableCats = useMemo(() => cats.filter(([id]) => id === "all" || items.some(product => product.category === id)), [items]);
  const selectedCat = availableCats.some(([id]) => id === cat) ? cat : "all";
  const availableBrands = useMemo(() => selectedCat === "all" ? [] : [...new Set(items.filter(product => product.category === selectedCat).map(product => product.brand))].toSorted(), [items,selectedCat]);
  const visible = useMemo(() => items.filter(product =>
    (selectedCat === "all" || product.category === selectedCat) &&
    (brand === "all" || product.brand === brand) &&
    `${product.brand} ${product.name}`.toLocaleLowerCase("ko-KR").includes(query.toLocaleLowerCase("ko-KR"))
  ), [brand,items,selectedCat,query]);
  const latestAnnouncement = useMemo(() => items.map(product => product.announcedDate).filter((date): date is string => Boolean(date)).sort().at(-1), [items]);

  return <main>
    <header><div className="brand"><span>오</span>오늘신상</div><div className="status">공식 출처 기반</div></header>
    <section className="intro"><div><p className="eyebrow">현재 판매가 확인된 신상품만</p><h1>지금 살 수 있는 신상</h1><p>최근 90일 이내 출시되고 14일 안에 판매가 확인된 상품만 보여드려요.</p>{latestAnnouncement && <p><span className="latest">최근 출시 {latestAnnouncement.replaceAll("-", ".")}</span></p>}<div className="sources">커피 메뉴·MD 공식 경로 {coffeeSources.length || 18}개 브랜드 수집 대상</div></div><div className="count"><strong>{loading ? "…" : error && items.length===0 ? "—" : items.length}</strong><span>판매 중 신상</span></div></section>
    <section className="workspace" aria-labelledby="products-title" aria-busy={loading}><h2 id="products-title" className="sr-only">신상품 목록</h2><div className="toolbar"><label className="search"><Search size={18} aria-hidden="true"/><input aria-label="브랜드나 상품명 검색" value={query} onChange={event=>setQuery(event.target.value)} placeholder="브랜드나 상품명 검색"/></label><button type="button" className="refresh" onClick={()=>void load()} aria-label={loading ? "새로고침 중" : "새로고침"} disabled={loading}><RefreshCw size={18} aria-hidden="true" className={loading ? "spin" : undefined}/></button><div className="view-toggle" aria-label="목록 표시 방식"><button type="button" className={view==="card"?"active":""} aria-label="카드 보기" aria-pressed={view==="card"} onClick={()=>setView("card")}><Grid2X2 size={17}/></button><button type="button" className={view==="list"?"active":""} aria-label="리스트 보기" aria-pressed={view==="list"} onClick={()=>setView("list")}><List size={18}/></button></div></div>
      <div className="category-stack"><div className="category-row"><span>대분류</span><nav aria-label="대분류 상품 분류">{availableCats.map(([id,label])=><button type="button" key={id} className={selectedCat===id?"active":""} aria-pressed={selectedCat===id} onClick={()=>{setCat(id);setBrand("all")}}>{label}</button>)}</nav></div>{availableBrands.length>0&&<div className="category-row brand-row"><span>브랜드</span><nav aria-label="중분류 브랜드"><button type="button" className={brand==="all"?"active":""} aria-pressed={brand==="all"} onClick={()=>setBrand("all")}>전체</button>{availableBrands.map(item=><button type="button" key={item} className={brand===item?"active":""} aria-pressed={brand===item} onClick={()=>setBrand(item)}>{item}</button>)}</nav></div>}</div>
      {!loading && !error && <p className="sr-only" aria-live="polite">검색 결과 {visible.length}개</p>}
      {error && <div className="notice" role="alert">{error}<button type="button" onClick={()=>void load()}>다시 시도</button></div>}
      {loading ? <div className="loading" role="status" aria-live="polite">상품 데이터를 불러오는 중…</div> : error && items.length===0 ? null : visible.length===0 ? <div className="empty" role="status">{items.length===0 ? "확인된 상품이 아직 없습니다. 공식 출처를 검증한 뒤 등록할 예정입니다." : "검색 결과가 없습니다. 검색어나 분류를 바꿔보세요."}</div> : <div className={`grid view-${view}`}>{visible.map(product=><ProductCard key={product.id} product={product} offers={offers}/>)}</div>}
    </section>
    {coffeeSources.length > 0 && <section className="coffee-sources" aria-labelledby="coffee-source-title"><div className="source-head"><div><p>COFFEE WATCHLIST</p><h2 id="coffee-source-title">커피 브랜드 수집 경로</h2><span>신상품 발견 경로와 가격 확인 경로를 분리해 관리합니다.</span></div><strong>{coffeeSources.length}개 브랜드 · 웹 가격 {coffeeSources.filter(source=>source.priceAccess==="web").length}곳</strong></div><div className={`source-grid source-${view}`}>{coffeeSources.map(source=><article key={source.id}><div><b className={`price-${source.priceAccess}`}>{source.priceAccess==="web"?"웹 가격 확인":source.priceAccess==="app"?"앱 가격 확인":"가격 미공개"}</b><h3>{source.brand}</h3><p>{source.priceNote}</p></div><nav aria-label={`${source.brand} 공식 경로`}>{source.channels.map(channel=><a key={`${channel.kind}-${channel.url}`} href={channel.url} target="_blank" rel="noopener noreferrer">{channel.providesPrice?"가격 · ":""}{channel.label}{channel.priceScope&&<small>{channel.priceScope}</small>}</a>)}</nav></article>)}</div></section>}
  </main>;
}
