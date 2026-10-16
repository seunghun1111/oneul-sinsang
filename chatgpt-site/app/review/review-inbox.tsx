"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { reviewReason, type ReviewProduct } from "../../lib/review/catalog";
import {CollectionHealthPanel} from "./collection-health-panel";
import type {CollectionHealth} from "../../lib/review/collection-health";
import {DiscoveryPanel} from "./discovery-panel";
import {categoryScope,filterReviewProducts,subCategoryOptions} from "../../lib/review/filters";
const categories: Record<string, string> = { convenience:"편의점", cafe:"카페", burger:"햄버거", pizza:"피자", chicken:"치킨", ramen:"라면", meal:"간편식", snack:"과자", drink:"음료", dessert:"디저트", icecream:"아이스크림", etc:"기타" };
const statuses: Record<string,string> = { pending:"검수 대기", approved:"승인", rejected:"제외" };
const actions:Record<string,string>={manual:"관리자 확인 필요",observe:"비공개 관찰",retry:"자동 재시도",scheduled:"날짜 도래 대기",archive:"과거 기록 보관",publish:"자동 승인",exclude:"자동 제외",manual_override:"관리자 기존 판정"};
function decisionUrl(product: ReviewProduct, approve: boolean) {
  const params = new URLSearchParams({ title: "[상품 " + (approve ? "승인" : "거절") + "] " + product.id, body: "상품 ID: " + product.id + "\n브랜드: " + product.brand + "\n상품명: " + product.name + "\n공식 출처: " + product.sourceUrl + "\n\n공식 사이트의 상품별 NEW 표시를 확인했습니다." });
  return "https://github.com/seunghun1111/oneul-sinsang/issues/new?" + params;
}
export default function ReviewInbox() {
  const [products,setProducts] = useState<ReviewProduct[]>([]);
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState("");
  const [collectionHealth,setCollectionHealth]=useState<CollectionHealth|null>(null);
  const [collectionHealthError,setCollectionHealthError]=useState("");
  const [collectionHealthLoading,setCollectionHealthLoading]=useState(true);
  const healthRequest=useRef(0);
  const [category,setCategory] = useState("all");
  const [subCategory,setSubCategory] = useState("all");
  const [brand,setBrand] = useState("all");
  const [status,setStatus] = useState("all");
  const [action,setAction]=useState("manual");
  const [query,setQuery] = useState("");
  const [page,setPage] = useState(1);
  const [selected,setSelected] = useState<string[]>([]);
  const [decision,setDecision] = useState<"승인" | "거절" | null>(null);
  async function loadHealth() {
    const request=++healthRequest.current;
    setCollectionHealthLoading(true);setCollectionHealthError("");
    try {
      const response=await fetch("/api/collection-health",{cache:"no-store"});
      const data=await response.json() as {collectionHealth?:CollectionHealth;error?:string};
      if(!response.ok||!data.collectionHealth)throw new Error(data.error||"운영 현황을 불러오지 못했습니다.");
      if(request===healthRequest.current)setCollectionHealth(data.collectionHealth);
    } catch {if(request===healthRequest.current)setCollectionHealthError("운영 현황을 갱신하지 못했습니다. 이전 표시가 남아 있다면 최신 상태가 아닐 수 있습니다. 상품 검수는 계속할 수 있습니다.");}
    finally {if(request===healthRequest.current)setCollectionHealthLoading(false);}
  }
  async function load() {
    void loadHealth();
    setLoading(true); setError(""); setSelected([]); setDecision(null);
    try {
      const response = await fetch("/api/review", {cache:"no-store"});
      const data = await response.json() as { error?: string; products: ReviewProduct[] };
      if (!response.ok) throw new Error(data.error || "조회 실패");
      setProducts(data.products);
    } catch(error) { setError(error instanceof Error ? error.message : "조회 실패"); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); },[]);
  const brands = useMemo(() => [...new Set(categoryScope(products,category).map(p=>p.brand))].sort(),[products,category]);
  const subCategories=useMemo(()=>subCategoryOptions(products,category,brand),[products,category,brand]);
  const filtered = useMemo(() => filterReviewProducts(products,{action,category,subCategory,brand,status,query}),[products,action,category,subCategory,brand,status,query]);
  const visible = filtered.slice(0,page*40);
  const selectedProducts = filtered.filter(product => selected.includes(product.id));
  const requestProducts = selectedProducts.filter(product => product.reviewStatus !== (decision === "승인" ? "approved" : "rejected"));
  const bulkParams = new URLSearchParams({title: `[상품 일괄 ${decision}] ${requestProducts.length}개`, body: "공식 출처에서 상품별 NEW 표시를 확인했습니다.\n\n```json\n" + JSON.stringify({productIds:requestProducts.map(product=>product.id)}) + "\n```"});
  const bulkUrl = "https://github.com/seunghun1111/oneul-sinsang/issues/new?" + bulkParams;
  function toggleSelection(id: string) {
    setDecision(null);
    setSelected(current => current.includes(id) ? current.filter(item=>item!==id) : current.length < 50 ? [...current,id] : current);
  }
  return <main className="review-admin">
    <header><div><a href="/">신상발견</a><h1>통합 검수함</h1><p>모든 카테고리의 수집 상품과 검수 근거를 한곳에서 확인합니다.</p></div><button onClick={()=>void load()} disabled={loading}>새로고침</button></header>
    <CollectionHealthPanel health={collectionHealth} error={collectionHealthError} loading={collectionHealthLoading}/>
    <p className="review-help">기본 화면에는 관리자 확인이 필요한 예외만 표시합니다. NEW 미확인 상품은 비공개 관찰하며 수동 승인할 필요가 없습니다.</p>
    <section className="review-totals" aria-label="전체 검수 현황" onClick={()=>{setSelected([]);setDecision(null)}}>{Object.entries(statuses).map(([key,label])=><button key={key} aria-pressed={status===key} onClick={()=>{setAction("all");setStatus(key);setPage(1)}}>{key==="pending"?"비공개·처리 대기":label}<strong>{products.filter(p=>p.reviewStatus===key).length}</strong></button>)}</section>
    <section className="review-controls" aria-label="검수 필터" onChange={()=>{setSelected([]);setDecision(null)}}>
      <label>자동 처리 구분<select value={action} onChange={e=>{setAction(e.target.value);setStatus("all");setPage(1)}}><option value="all">전체</option>{Object.entries(actions).map(([key,label])=><option key={key} value={key}>{label} ({products.filter(p=>p.automationAction===key).length})</option>)}</select></label>
      <label>카테고리<select value={category} onChange={e=>{setCategory(e.target.value);setSubCategory("all");setBrand("all");setPage(1)}}><option value="all">전체</option>{Object.entries(categories).map(([key,label])=><option key={key} value={key}>{label} ({products.filter(p=>p.category===key).length})</option>)}</select></label>
      <label>세부 카테고리<select value={subCategory} onChange={e=>{setSubCategory(e.target.value);setPage(1)}}><option value="all">전체</option>{subCategories.map(item=><option key={item.value} value={item.value}>{item.label} ({item.count})</option>)}</select></label>
      <label>브랜드<select value={brand} onChange={e=>{setBrand(e.target.value);setSubCategory("all");setPage(1)}}><option value="all">전체</option>{brands.map(b=><option key={b}>{b}</option>)}</select></label>
      <label>상태<select value={status} onChange={e=>{setStatus(e.target.value);setPage(1)}}><option value="all">전체</option>{Object.entries(statuses).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label>
      <label>검색<input value={query} onChange={e=>{setQuery(e.target.value);setPage(1)}} placeholder="상품명·브랜드 검색"/></label>
    </section>
    <p className="review-help">승인·제외 버튼에서 검수 요청을 등록하면 저장소 권한 확인 후 공개 목록에 반영됩니다. 반영 완료 후 새로고침하세요. 기존 공개 상품은 승인 상태로 표시합니다.</p>
    <section className="bulk-review" aria-label="일괄 검수">
      <strong aria-live="polite">{selectedProducts.length}개 선택</strong>
      <button type="button" disabled={loading || visible.length===0} onClick={()=>{setSelected(visible.slice(0,50).map(p=>p.id));setDecision(null)}}>현재 표시 상품 선택 (최대 50개)</button>
      <button type="button" disabled={selected.length===0} onClick={()=>{setSelected([]);setDecision(null)}}>선택 해제</button>
      <button type="button" disabled={loading || selectedProducts.length===0} onClick={()=>setDecision("승인")}>선택 승인</button>
      <button type="button" disabled={loading || selectedProducts.length===0} onClick={()=>setDecision("거절")}>선택 제외</button>
      {decision && <div className="bulk-confirm" role="region" aria-label="일괄 검수 요청 확인">
        <h2>{requestProducts.length}개 상품 {decision==="승인" ? "승인" : "제외"} 요청 확인</h2>
        <p>동일 상태인 {selectedProducts.length-requestProducts.length}개는 요청에서 제외됩니다. 아래 상품의 공식 출처를 확인한 뒤 요청을 등록하세요.</p>
        <ul>{requestProducts.map(p=><li key={p.id}>{p.brand} · {p.name}</li>)}</ul>
        {requestProducts.length>0 && bulkUrl.length<=7000 && <a href={bulkUrl} target="_blank" rel="noopener noreferrer">GitHub에서 일괄 요청 등록</a>}
        {bulkUrl.length>7000 && <p role="alert">요청 주소가 너무 깁니다. 선택 상품 수를 줄여 주세요.</p>}
        <button type="button" onClick={()=>setDecision(null)}>취소</button>
      </div>}
    </section>
    {error && <p role="alert">{error}</p>}
    <p role="status">{loading ? "최신 수집 데이터 조회 중…" : filtered.length+"개 상품"}</p>
    {!loading && !error && filtered.length===0 && <p className="review-empty">{action==="manual"?"현재 조건에서 관리자 확인이 필요한 항목이 없습니다. 카테고리의 전체 상품은 자동 처리 구분을 전체로 변경해 조회하세요.":"선택한 조건에 해당하는 상품이 없습니다."}</p>}
    <section aria-label="검수 상품 목록" className="review-admin-list">{visible.map(p=><article key={p.id}>
      <div><label className="review-select"><input type="checkbox" checked={selected.includes(p.id)} disabled={!selected.includes(p.id) && selected.length>=50} onChange={()=>toggleSelection(p.id)}/>{p.name} 선택</label><span>{categories[p.category] || p.category}{p.subCategory ? " · "+p.subCategory : ""}</span><b className={"review-badge "+p.reviewStatus}>{statuses[p.reviewStatus || "approved"]} · {p.decisionSource==="manual"?"관리자":p.decisionSource==="automatic"?"자동 판정":"기존 판정"}</b><h2>{p.name}</h2><small>{p.detectionKind==="initial"?"초기 수집":p.detectionKind==="newly_detected"?"새로 확인된 NEW":"이전 수집 기록"}</small><strong>{p.brand}</strong><p>{reviewReason(p)}</p><small>최초 확인 {p.firstDetectedAt?.slice(0,10)} · 최근 확인 {p.lastCheckedAt?.slice(0,10)}{p.verifiedDate ? " · 검증된 출시/발표 "+p.verifiedDate : p.releaseDate ? " · 기존 기록일(미검증) "+p.releaseDate : ""}{p.automaticCheckedAt ? " · 자동 판정 "+p.automaticCheckedAt.slice(0,10) : ""}{p.reviewedAt ? " · 검수 "+p.reviewedAt.slice(0,10) : ""}</small></div>
      <DiscoveryPanel product={p}/>
      <nav aria-label={p.name+" 검수"}><a href={p.sourceUrl} target="_blank" rel="noopener noreferrer">공식 출처 ↗</a>{p.reviewStatus!=="approved" && <a className="approve" href={decisionUrl(p,true)} target="_blank" rel="noopener noreferrer">승인 요청</a>}{p.reviewStatus!=="rejected" && <a href={decisionUrl(p,false)} target="_blank" rel="noopener noreferrer">제외 요청</a>}</nav>
    </article>)}</section>
    {visible.length<filtered.length && <button onClick={()=>setPage(page+1)}>더 보기 ({visible.length}/{filtered.length})</button>}
  </main>;
}

