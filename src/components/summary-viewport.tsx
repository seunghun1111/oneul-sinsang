"use client";

import {useEffect,useId,useRef,useState,type ReactNode} from "react";

export function SummaryViewport({children,label}:{children:ReactNode;label:string}) {
  const id=useId(),viewport=useRef<HTMLDivElement>(null),content=useRef<HTMLDivElement>(null);
  const [height,setHeight]=useState(320),[overflow,setOverflow]=useState(false);
  useEffect(()=>{
    const element=viewport.current,inner=content.current;
    if(!element||!inner)return;
    const observer=new ResizeObserver(()=>setOverflow(element.scrollHeight>element.clientHeight+1));
    observer.observe(element);observer.observe(inner);
    return ()=>observer.disconnect();
  },[]);
  return <div className="summary-viewport">
    <div id={id} ref={viewport} className="summary-scroll" style={{maxHeight:height}} role="region" aria-label={`${label} 상품 목록`} tabIndex={0}>
      <div ref={content}>{children}</div>
    </div>
    <div className="summary-scroll-actions">
      {overflow&&height<1040&&<button type="button" aria-controls={id} onClick={()=>setHeight(value=>Math.min(1040,value+240))}>더보기 · 영역 늘리기</button>}
      {height>320&&<button type="button" aria-controls={id} onClick={()=>{setHeight(320);viewport.current?.scrollTo({top:0});}}>접기</button>}
      {overflow&&<small>목록 안에서 스크롤하여 전체 상품을 확인하세요.</small>}
    </div>
  </div>;
}
