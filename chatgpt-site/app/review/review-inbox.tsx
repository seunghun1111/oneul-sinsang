"use client";
import { useEffect, useMemo, useState } from "react";
import { reviewReason, type ReviewProduct } from "../../lib/review/catalog";
const categories: Record<string, string> = { convenience:"편의점", cafe:"카페", burger:"햄버거", pizza:"피자", chicken:"치킨", ramen:"라면", meal:"간편식", snack:"과자", drink:"음료", dessert:"디저트", icecream:"아이스크림", etc:"기타" };
const statuses: Record<string,string> = { pending:"검수 대기", approved:"승인", rejected:"제외" };
function decisionUrl(product: ReviewProduct, approve: boolean) {
  const params = new URLSearchParams({ title: "[상품 " + (approve ? "승인" : "거절") + "] " + product.id, body: "상품 ID: " + product.id + "\n브랜드: " + product.brand + "\n상품명: " + product.name + "\n공식 출처: " + product.sourceUrl + "\n\n최근 30일 신상품 및 현재 판매 여부를 확인했습니다." });
  return "https://github.com/seunghun1111/oneul-sinsang/issues/new?" + params;
}
export default function ReviewInbox() {
  const [products,setProducts] = useState<ReviewProduct[]>([]);
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState("");
  const [category,setCategory] = useState("all");
  const [brand,setBrand] = useState("all");
  const [status,setStatus] = useState("pending");
  const [query,setQuery] = useState("");
  const [page,setPage] = useState(1);
  async function load() {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/review", {cache:"no-store"});
      const data = await response.json() as { error?: string; products: ReviewProduct[] };
      if (!response.ok) throw new Error(data.error || "조회 실패");
      setProducts(data.products);
    } catch(error) { setError(error instanceof Error ? error.message : "조회 실패"); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); },[]);
  const brands = useMemo(() => [...new Set(products.filter(p => category === "all" || p.category === category).map(p=>p.brand))].sort(),[products,category]);
  const filtered = useMemo(() => products.filter(p => (category==="all" || p.category===category) && (brand==="all" || p.brand===brand) && (status==="all" || p.reviewStatus===status) && (p.name+" "+p.brand).toLowerCase().includes(query.toLowerCase())),[products,category,brand,status,query]);
  const visible = filtered.slice(0,page*40);
  return <main className="review-admin">
    <header><div><a href="/">오늘신상</a><h1>통합 검수함</h1><p>모든 카테고리의 수집 상품과 검수 근거를 한곳에서 확인합니다.</p></div><button onClick={()=>void load()} disabled={loading}>새로고침</button></header>
    <section className="review-totals" aria-label="전체 검수 현황">{Object.entries(statuses).map(([key,label])=><button key={key} aria-pressed={status===key} onClick={()=>{setStatus(key);setPage(1)}}>{label}<strong>{products.filter(p=>p.reviewStatus===key).length}</strong></button>)}</section>
    <section className="review-controls" aria-label="검수 필터">
      <label>카테고리<select value={category} onChange={e=>{setCategory(e.target.value);setBrand("all");setPage(1)}}><option value="all">전체</option>{Object.entries(categories).map(([key,label])=><option key={key} value={key}>{label} ({products.filter(p=>p.category===key).length})</option>)}</select></label>
      <label>브랜드<select value={brand} onChange={e=>{setBrand(e.target.value);setPage(1)}}><option value="all">전체</option>{brands.map(b=><option key={b}>{b}</option>)}</select></label>
      <label>상태<select value={status} onChange={e=>{setStatus(e.target.value);setPage(1)}}><option value="all">전체</option>{Object.entries(statuses).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label>
      <label>검색<input value={query} onChange={e=>{setQuery(e.target.value);setPage(1)}} placeholder="상품명·브랜드 검색"/></label>
    </section>
    <p className="review-help">승인·제외 버튼에서 검수 요청을 등록하면 저장소 권한 확인 후 공개 목록에 반영됩니다. 반영 완료 후 새로고침하세요. 기존 공개 상품은 승인 상태로 표시합니다.</p>
    {error && <p role="alert">{error}</p>}
    <p role="status">{loading ? "최신 수집 데이터 조회 중…" : filtered.length+"개 상품"}</p>
    {!loading && !error && filtered.length===0 && <p className="review-empty">선택한 조건에 해당하는 상품이 없습니다.</p>}
    <section aria-label="검수 상품 목록" className="review-admin-list">{visible.map(p=><article key={p.id}>
      <div><span>{categories[p.category] || p.category}{p.subCategory ? " · "+p.subCategory : ""}</span><b className={"review-badge "+p.reviewStatus}>{statuses[p.reviewStatus || "approved"]}</b><h2>{p.name}</h2><strong>{p.brand}</strong><p>{reviewReason(p)}</p><small>최초 확인 {p.firstDetectedAt?.slice(0,10)} · 최근 확인 {p.lastCheckedAt?.slice(0,10)}{p.releaseDate ? " · 출시 "+p.releaseDate : ""}{p.reviewedAt ? " · 검수 "+p.reviewedAt.slice(0,10) : ""}</small></div>
      <nav aria-label={p.name+" 검수"}><a href={p.sourceUrl} target="_blank" rel="noopener noreferrer">공식 출처 ↗</a>{p.reviewStatus!=="approved" && <a className="approve" href={decisionUrl(p,true)} target="_blank" rel="noopener noreferrer">승인 요청</a>}{p.reviewStatus!=="rejected" && <a href={decisionUrl(p,false)} target="_blank" rel="noopener noreferrer">제외 요청</a>}</nav>
    </article>)}</section>
    {visible.length<filtered.length && <button onClick={()=>setPage(page+1)}>더 보기 ({visible.length}/{filtered.length})</button>}
  </main>;
}

