"use client";
/* eslint-disable @next/next/no-img-element -- 공식 이미지를 복제·최적화하지 않고 원본 주소로 표시합니다. */
import { useEffect, useMemo, useState } from "react";
import { Grid2X2, List, RefreshCw, Search } from "lucide-react";
import offerData from "../data/offers.json";

type Product = { id:string|number; brand:string; name:string; category:string; subCategory?:string; productType:string; price:number|null; retailer:string|null; releaseDate:string|null; announcedDate:string|null; description:string; emoji:string; sourceUrl:string; imageUrl:string|null };
type Offer = { id:string; productSlug:string; retailer:string; title:string; url:string; price:number; regularPrice:number|null; quantity:number; unit:string; stockStatus:"in_stock"|"out_of_stock"|"unknown"; observedAt:string };
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
  return <article>
    <ProductVisual product={product}/>
    <div className="card-body">
      <p>{product.brand} · {product.subCategory ?? labels[product.category] ?? "기타"}</p>
      <h2>{product.name}</h2>
      {summary && <p className="summary">{summary}</p>}
      <div className="meta">
        {lowestOffer ? <strong>{lowestOffer.price.toLocaleString("ko-KR")}원부터</strong> : product.price != null && <strong>{product.price.toLocaleString("ko-KR")}원</strong>}
        {product.announcedDate && <time dateTime={product.announcedDate}>공식 발표 {product.announcedDate.replaceAll("-", ".")}</time>}
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

function mergeCoffeeProducts(items:Product[], external:Product[]) {
  const coffee = external.filter(product => product.category === "cafe").map(product => ({...product, price:product.price ?? null, retailer:product.retailer ?? null, releaseDate:product.releaseDate ?? null, announcedDate:product.releaseDate ?? null, description:product.description ?? "", emoji:product.subCategory?.includes("MD") ? "🎁" : "☕", imageUrl:product.imageUrl ?? null}));
  return [...new Map([...items,...coffee].map(product=>[String(product.id),product])).values()];
}

export default function Home() {
  const [items,setItems] = useState<Product[]>([]);
  const [offers,setOffers] = useState<Offer[]>(fallbackOffers);
  const [cat,setCat] = useState("all");
  const [query,setQuery] = useState("");
  const [view,setView] = useState<"card"|"list">("card");
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState("");

  async function load() {
    setLoading(true); setError("");
    try {
      const [response, offerResponse, productResponse] = await Promise.all([
        fetch("/api/products", { cache: "no-store" }),
        fetch("https://seunghun1111.github.io/oneul-sinsang/data/offers.json", { cache: "no-store" }),
        fetch("https://seunghun1111.github.io/oneul-sinsang/data/products.json", { cache: "no-store" }),
      ]);
      const data = await response.json() as { error?: string; products?: Product[] };
      if (!response.ok) throw new Error(data.error ?? "상품을 불러오지 못했습니다.");
      const external = productResponse.ok ? await productResponse.json() as Product[] : [];
      setItems(mergeCoffeeProducts(data.products ?? [], external));
      if (offerResponse.ok) setOffers(await offerResponse.json() as Offer[]);
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
    ])
      .then(async ([response, offerResponse, productResponse]) => {
        const data = await response.json() as { error?: string; products?: Product[] };
        if (!response.ok) throw new Error(data.error ?? "상품을 불러오지 못했습니다.");
        const external = productResponse?.ok ? await productResponse.json() as Product[] : [];
        if (active) setItems(mergeCoffeeProducts(data.products ?? [], external));
        if (active && offerResponse?.ok) setOffers(await offerResponse.json() as Offer[]);
      })
      .catch(cause => { if (active) setError(cause instanceof Error ? cause.message : "상품을 불러오지 못했습니다."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  const availableCats = useMemo(() => cats.filter(([id]) => id === "all" || items.some(product => product.category === id)), [items]);
  const selectedCat = availableCats.some(([id]) => id === cat) ? cat : "all";
  const visible = useMemo(() => items.filter(product =>
    (selectedCat === "all" || product.category === selectedCat) &&
    `${product.brand} ${product.name}`.toLocaleLowerCase("ko-KR").includes(query.toLocaleLowerCase("ko-KR"))
  ), [items,selectedCat,query]);
  const latestAnnouncement = useMemo(() => items.map(product => product.announcedDate).filter((date): date is string => Boolean(date)).sort().at(-1), [items]);

  return <main>
    <header><div className="brand"><span>오</span>오늘신상</div><div className="status">공식 출처 기반</div></header>
    <section className="intro"><div><p className="eyebrow">출처를 확인할 수 있는 신상품만</p><h1>뭐가 새로 나왔지?</h1><p>식품·음료·카페 MD 신상품을 공식 발표일 순으로 찾아보세요.</p>{latestAnnouncement && <p><span className="latest">최근 공식 발표 {latestAnnouncement.replaceAll("-", ".")}</span></p>}<div className="sources">카페 수집 시작: 메가MGC커피·커피빈·폴 바셋·할리스·빽다방</div></div><div className="count"><strong>{loading ? "…" : error && items.length===0 ? "—" : items.length}</strong><span>등록된 신상</span></div></section>
    <section className="workspace" aria-labelledby="products-title" aria-busy={loading}><h2 id="products-title" className="sr-only">신상품 목록</h2><div className="toolbar"><label className="search"><Search size={18} aria-hidden="true"/><input aria-label="브랜드나 상품명 검색" value={query} onChange={event=>setQuery(event.target.value)} placeholder="브랜드나 상품명 검색"/></label><button type="button" className="refresh" onClick={()=>void load()} aria-label={loading ? "새로고침 중" : "새로고침"} disabled={loading}><RefreshCw size={18} aria-hidden="true" className={loading ? "spin" : undefined}/></button><div className="view-toggle" aria-label="목록 표시 방식"><button type="button" className={view==="card"?"active":""} aria-label="카드 보기" aria-pressed={view==="card"} onClick={()=>setView("card")}><Grid2X2 size={17}/></button><button type="button" className={view==="list"?"active":""} aria-label="리스트 보기" aria-pressed={view==="list"} onClick={()=>setView("list")}><List size={18}/></button></div></div>
      <nav aria-label="상품 분류">{availableCats.map(([id,label])=><button type="button" key={id} className={selectedCat===id?"active":""} aria-pressed={selectedCat===id} onClick={()=>setCat(id)}>{label}</button>)}</nav>
      {!loading && !error && <p className="sr-only" aria-live="polite">검색 결과 {visible.length}개</p>}
      {error && <div className="notice" role="alert">{error}<button type="button" onClick={()=>void load()}>다시 시도</button></div>}
      {loading ? <div className="loading" role="status" aria-live="polite">상품 데이터를 불러오는 중…</div> : error && items.length===0 ? null : visible.length===0 ? <div className="empty" role="status">{items.length===0 ? "확인된 상품이 아직 없습니다. 공식 출처를 검증한 뒤 등록할 예정입니다." : "검색 결과가 없습니다. 검색어나 분류를 바꿔보세요."}</div> : <div className={`grid view-${view}`}>{visible.map(product=><ProductCard key={product.id} product={product} offers={offers}/>)}</div>}
    </section>
  </main>;
}
