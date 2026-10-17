"use client";
import {useId,useState,type ReactNode} from "react";
export function DiscoveryTabs({week,month,weekCount,monthCount}:{week:ReactNode;month:ReactNode;weekCount:number;monthCount:number}){
 const [selected,setSelected]=useState(0),id=useId();
 return <section className="discovery-summary" aria-label="기간별 신상 발견">
  <div className="discovery-period-tabs" role="tablist" aria-label="신상 발견 기간">{["이번 주","이번 달"].map((label,index)=><button key={label} type="button" role="tab" id={`${id}-tab-${index}`} aria-controls={`${id}-panel-${index}`} aria-selected={selected===index} tabIndex={selected===index?0:-1} onClick={()=>setSelected(index)} onKeyDown={e=>{const next=e.key==="Home"?0:e.key==="End"?1:["ArrowLeft","ArrowRight"].includes(e.key)?1-index:undefined;if(next===undefined)return;e.preventDefault();setSelected(next);e.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus();}}>{label}<span>{[weekCount,monthCount][index]}개</span></button>)}</div>
  {[week,month].map((content,index)=><div key={index} id={`${id}-panel-${index}`} role="tabpanel" aria-labelledby={`${id}-tab-${index}`} hidden={selected!==index}>{content}</div>)}
 </section>;
}
