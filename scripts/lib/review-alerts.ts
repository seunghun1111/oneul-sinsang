import { createHash } from "node:crypto";
import { reasons, type AutoReport } from "./auto-review.ts";
import type {ReviewQueue} from "./review-queue.ts";
export type Alert={key:string;text:string};
export function reviewAlerts(report:AutoReport, decisions:Record<string,unknown>, sent:Record<string,string>, failures:string[]=[],queue?:ReviewQueue):Alert[] {
  const alerts:Alert[]=[];
  if(queue) {
    const grouped=new Map<string,number>();
    for(const [id,entry] of Object.entries(queue.products))if(entry.action==="manual"&&!decisions[id]){
      const key=entry.brand+" / "+entry.reason;grouped.set(key,(grouped.get(key)??0)+1);
    }
    for(const [reason,count] of grouped)alerts.push({key:`review-queue:${reason}`,text:`관리자 확인: ${reason} (${count}개 상품, 승인보다 원인 수정 우선)`});
  }
  for(const [id,p] of Object.entries(report.products)) {
    if(queue)continue;
    if(p.decision!=="pending" || decisions[id]) continue;
    for(const code of p.codes.filter(code=>["identity","source","robots"].includes(code))) alerts.push({key:`product:${id}:${code}`,text:`${id}: ${reasons[code]??code}`});
  }
  failures.forEach(source=>alerts.push({key:`collector:${source}`,text:`수집 확인 필요: ${source}`}));
  return alerts.filter(alert=>!sent[alert.key]);
}
export const alertMarker=(key:string)=>`<!-- oneul-review:${createHash("sha256").update(key).digest("hex")} -->`;
