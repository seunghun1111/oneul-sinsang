import type {Product} from "../../src/types/product.ts";
import type {AutoReport,ReviewAction} from "./auto-review.ts";
export type QueueEntry={brand:string;action:ReviewAction|"manual_override";attempts:number;observation?:string;reason:string;nextCheckAt?:string};
export type ReviewQueue={version:1;generatedAt:string;policyVersion:"2026-10-16-v2";totals:Record<string,number>;products:Record<string,QueueEntry>};
export function buildReviewQueue(products:Product[],report:AutoReport,decisions:Record<string,unknown>,previous:ReviewQueue|undefined,now=new Date(),observations:Record<string,{checkedAt?:string;status:string}>={}):ReviewQueue {
  const queue:ReviewQueue={version:1,generatedAt:now.toISOString(),policyVersion:"2026-10-16-v2",totals:{},products:{}};
  for(const product of products) {
    const verdict=report.products[product.id];if(!verdict)continue;
    const prior=previous?.products?.[product.id];
    let action:QueueEntry["action"]=decisions[product.id]?"manual_override":verdict.action??(verdict.decision==="approved"?"publish":verdict.decision==="rejected"?"exclude":"observe");
    const source=observations[product.brand];
    if(!decisions[product.id]&&verdict.decision==="pending"&&source&&["failed","partial"].includes(source.status)&&!verdict.codes.some(c=>["identity","source","robots","evidence_invalid"].includes(c)))action="retry";
    const observation=action==="retry"&&source?.checkedAt?source.checkedAt:product.reviewEvidence?.checkedAt;
    // A timer/dry-run is not a new source observation; only fresh failed checks count.
    const attempts=action==="retry"?(prior?.action==="retry"||prior?.action==="manual"?prior.attempts:0)+(observation&&observation!==prior?.observation?1:0):0;
    let reason=verdict.reason;
    if(action==="retry"&&attempts>=3){action="manual";reason="새 수집 결과에서 3회 연속 근거 확인 실패: 상품 승인 대신 수집 경로를 확인하세요";}
    const entry:QueueEntry={brand:product.brand,action,attempts,...(observation?{observation}:{}),reason,
      ...(["retry","observe","scheduled"].includes(action)?{nextCheckAt:new Date(now.getTime()+86400000).toISOString()}:{} )};
    queue.products[product.id]=entry;queue.totals[action]=(queue.totals[action]??0)+1;
  }
  return queue;
}
