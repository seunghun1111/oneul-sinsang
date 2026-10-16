"use client";
import {useSyncExternalStore} from "react";
import report from "@/data/collection-policy-status.json";
import {policyLabels,sourcePolicy} from "@/lib/source-policy";
const subscribe=(changed:()=>void)=>{const timer=setInterval(changed,60000);return()=>clearInterval(timer);};
const snapshot=()=>Math.floor(Date.now()/60000)*60000;
const serverSnapshot=()=>null;
export function usePolicyClock(){const time=useSyncExternalStore(subscribe,snapshot,serverSnapshot);return time===null?null:new Date(time);}
export function SourcePolicyBadge({brand,url}:{brand:string;url:string}){
 const now=usePolicyClock();
 const policy=now?sourcePolicy(report,brand,url,now):{state:"unknown" as const,reason:"점검 기록의 유효 시각을 확인하고 있습니다."};
 return <span className={`policy-badge policy-${policy.state}`} title={policy.reason}>{now?policyLabels[policy.state]:"정책 확인 중"}</span>;
}
