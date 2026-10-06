"use client";
import { useEffect, useMemo, useState } from "react";
import { Grid2X2, List, RefreshCw, Search } from "lucide-react";

type Product = { id:string|number; brand:string; name:string; category:string; subCategory?:string; productType:string; price:number|null; retailer:string|null; releaseDate:string|null; announcedDate:string|null; description:string; emoji:string; sourceUrl:string; imageUrl:string|null; availabilityStatus?:string; availabilityCheckedAt?:string };
type CoffeeSource = { id:string; brand:string; note:string; channels:{ kind:"menu"|"md"|"news"|"shop"; label:string; url:string }[] };
const cats = [["all","전체"],["cafe","카페"],["drink","음료"],["ramen","라면"],["meal","간편식"],["snack","과자"],["dessert","디저트"],["icecream","아이스크림"],["etc","기타"]];
const labels = Object.fromEntries(cats);

function ProductVisual({ product }: { product: Product }) {
  return <div className={`visual visual-${product.category}`}><span aria-hidden="true">{product.emoji}</span></div>;
}

function ProductCard({ product }: { product: Product }) {
  const summary = `${product.brand} 공식 발표에서 확인된 ${product.name} 신상품`;
  const saleCheckedAt = product.availabilityCheckedAt ?? product.releaseDate ?? product.announcedDate;
  return <article>
    <ProductVisual product={product}/>
    <div className="card-body">
      <p>{product.brand} · {product.subCategory ?? labels[product.category] ?? "기타"}</p>
      <h2>{product.name}</h2>
      {summary && <p className="summary">{summary}</p>}
      <div className="meta"><strong>현재 판매 확인</strong>{saleCheckedAt && <time dateTime={saleCheckedAt}>확인일 {saleCheckedAt.slice(0,10).replaceAll("-", ".")}</time>}</div>
      {product.retailer && <p className="retailer">판매처 {product.retailer}</p>}
      {product.sourceUrl && <a className="source" href={product.sourceUrl} target="_blank" rel="noopener noreferrer">공식 출처 보기</a>}
    </div>
  </article>;
}

function mergeCurrentProducts(items:Product[], external:Product[]) {
  const sanitize = (product:Product) => ({...product, price:null, imageUrl:null, description:`${product.brand} 공식 발표에서 확인된 ${product.name} 신상품`});
  const coffee = external.filter(product => product.category === "cafe").map(product => sanitize({...product, retailer:product.retailer ?? null, releaseDate:product.releaseDate ?? null, announcedDate:product.releaseDate ?? null, emoji:product.subCategory?.includes("MD") ? "🎁" : "☕"}));
  const externalIds = new Set(external.map(product => String(product.id)));
  const now = Date.now();
  const verified = items.filter(product => {
    if (externalIds.has(String(product.id))) return true;
    const released = new Date(product.releaseDate ?? product.announcedDate ?? 0).getTime();
    const isNew = Number.isFinite(released) && now - released <= 90 * 86_400_000;
    return isNew;
  }).map(sanitize);
  return [...new Map([...verified,...coffee].map(product=>[String(product.id),product])).values()];
}

export default function Home() {
  const [items,setItems] = useState<Product[]>([]);
  const [coffeeSources,setCoffeeSources] = useState<CoffeeSource[]>([]);
  const [cat,setCat] = useState("all");
  const [brand,setBrand] = useState("all");
  const [query,setQuery] = useState("");
  const [view,setView] = useState<"card"|"list">("list");
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState("");

  async function load() {
    setLoading(true); setError("");
    try {
      const [response, productResponse, sourceResponse] = await Promise.all([
        fetch("/api/products", { cache: "no-store" }),
        fetch("https://seunghun1111.github.io/oneul-sinsang/data/products.json", { cache: "no-store" }),
        fetch("https://seunghun1111.github.io/oneul-sinsang/data/coffee-sources.json", { cache: "no-store" }),
      ]);
      const data = await response.json() as { error?: string; products?: Product[] };
      if (!response.ok) throw new Error(data.error ?? "상품을 불러오지 못했습니다.");
      const external = productResponse.ok ? await productResponse.json() as Product[] : [];
      setItems(mergeCurrentProducts(data.products ?? [], external));
      if (sourceResponse.ok) setCoffeeSources(await sourceResponse.json() as CoffeeSource[]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "상품을 불러오지 못했습니다.");
    } finally { setLoading(false); }
  }
  useEffect(() => {
    let active = true;
    Promise.all([
      fetch("/api/products", { cache: "no-store" }),
      fetch("https://seunghun1111.github.io/oneul-sinsang/data/products.json", { cache: "no-store" }).catch(() => null),
      fetch("https://seunghun1111.github.io/oneul-sinsang/data/coffee-sources.json", { cache: "no-store" }).catch(() => null),
    ])
      .then(async ([response, productResponse, sourceResponse]) => {
        const data = await response.json() as { error?: string; products?: Product[] };
        if (!response.ok) throw new Error(data.error ?? "상품을 불러오지 못했습니다.");
        const external = productResponse?.ok ? await productResponse.json() as Product[] : [];
        if (active) setItems(mergeCurrentProducts(data.products ?? [], external));
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
    <section className="intro"><div><p className="eyebrow">현재 판매 중임이 확인된 신상품만</p><h1>지금 살 수 있는 신상</h1><p>최근 90일 이내 출시되고 14일 안에 판매 상태가 확인된 상품만 보여드려요.</p>{latestAnnouncement && <p><span className="latest">최근 출시 {latestAnnouncement.replaceAll("-", ".")}</span></p>}<div className="sources">커피 메뉴·MD 공식 경로 {coffeeSources.length || 18}개 브랜드 수집 대상</div></div><div className="count"><strong>{loading ? "…" : error && items.length===0 ? "—" : items.length}</strong><span>판매 중 신상</span></div></section>
    <section className="workspace" aria-labelledby="products-title" aria-busy={loading}><h2 id="products-title" className="sr-only">신상품 목록</h2><div className="toolbar"><label className="search"><Search size={18} aria-hidden="true"/><input aria-label="브랜드나 상품명 검색" value={query} onChange={event=>setQuery(event.target.value)} placeholder="브랜드나 상품명 검색"/></label><button type="button" className="refresh" onClick={()=>void load()} aria-label={loading ? "새로고침 중" : "새로고침"} disabled={loading}><RefreshCw size={18} aria-hidden="true" className={loading ? "spin" : undefined}/></button><div className="view-toggle" aria-label="목록 표시 방식"><button type="button" className={view==="card"?"active":""} aria-label="카드 보기" aria-pressed={view==="card"} onClick={()=>setView("card")}><Grid2X2 size={17}/></button><button type="button" className={view==="list"?"active":""} aria-label="리스트 보기" aria-pressed={view==="list"} onClick={()=>setView("list")}><List size={18}/></button></div></div>
      <div className="category-stack"><div className="category-row"><span>대분류</span><nav aria-label="대분류 상품 분류">{availableCats.map(([id,label])=><button type="button" key={id} className={selectedCat===id?"active":""} aria-pressed={selectedCat===id} onClick={()=>{setCat(id);setBrand("all")}}>{label}</button>)}</nav></div>{availableBrands.length>0&&<div className="category-row brand-row"><span>브랜드</span><nav aria-label="중분류 브랜드"><button type="button" className={brand==="all"?"active":""} aria-pressed={brand==="all"} onClick={()=>setBrand("all")}>전체</button>{availableBrands.map(item=><button type="button" key={item} className={brand===item?"active":""} aria-pressed={brand===item} onClick={()=>setBrand(item)}>{item}</button>)}</nav></div>}</div>
      {!loading && !error && <p className="sr-only" aria-live="polite">검색 결과 {visible.length}개</p>}
      {error && <div className="notice" role="alert">{error}<button type="button" onClick={()=>void load()}>다시 시도</button></div>}
      {loading ? <div className="loading" role="status" aria-live="polite">상품 데이터를 불러오는 중…</div> : error && items.length===0 ? null : visible.length===0 ? <div className="empty" role="status">{items.length===0 ? "확인된 상품이 아직 없습니다. 공식 출처를 검증한 뒤 등록할 예정입니다." : "검색 결과가 없습니다. 검색어나 분류를 바꿔보세요."}</div> : <div className={`grid view-${view}`}>{visible.map(product=><ProductCard key={product.id} product={product}/>)}</div>}
    </section>
    {coffeeSources.length > 0 && <section className="coffee-sources" aria-labelledby="coffee-source-title"><div className="source-head"><div><p>COFFEE WATCHLIST</p><h2 id="coffee-source-title">커피 브랜드 수집 경로</h2><span>메뉴·MD·공식 소식에서 현재 판매 중인 신상품을 확인합니다.</span></div><strong>{coffeeSources.length}개 브랜드</strong></div><div className={`source-grid source-${view}`}>{coffeeSources.map(source=><article key={source.id}><div><b>수집 대상</b><h3>{source.brand}</h3><p>{source.note}</p></div><nav aria-label={`${source.brand} 공식 경로`}>{source.channels.map(channel=><a key={`${channel.kind}-${channel.url}`} href={channel.url} target="_blank" rel="noopener noreferrer">{channel.label}</a>)}</nav></article>)}</div></section>}
    <section className="legal-note"><strong>비상업적 개인 프로젝트</strong><p>각 브랜드와 제휴·후원 관계가 없으며, 공식 출처에서 확인한 신상품 사실과 출처 링크만 제공합니다.</p><a href="https://github.com/seunghun1111/oneul-sinsang/issues" target="_blank" rel="noopener noreferrer">정정·삭제 요청</a></section>
  </main>;
}
