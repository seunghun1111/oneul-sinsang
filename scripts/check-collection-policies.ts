import {writeFile} from "node:fs/promises";
import {coffeeBrandSources} from "../src/data/coffee-sources.ts";
import {automatedBrandSources} from "./lib/manual-brand-collector.ts";
import {collectCu} from "./lib/cu-collector.ts";
import {collectSevenEleven,collectEmart24} from "./lib/convenience-collector.ts";
import {collectBaskinRobbins} from "./lib/icecream-collector.ts";
import {collectLotteria,collectDominos,collectGoobne,collectKyochon,collectMcDonalds,collectBurgerKing,collectMomstouch,collectKfc,collectPizzaHut} from "./lib/foodservice-collector.ts";
import {collectBinggrae} from "../chatgpt-site/lib/collectors/binggrae.ts";
import {collectMaeil} from "../chatgpt-site/lib/collectors/maeil.ts";
import {collectOrion} from "../chatgpt-site/lib/collectors/orion.ts";
import {collectPulmuone} from "../chatgpt-site/lib/collectors/pulmuone.ts";
import {collectSamyang} from "../chatgpt-site/lib/collectors/samyang.ts";
import {createPolicyPreflight} from "./lib/policy-preflight.ts";

const targets:{brand:string;url:string;method?:string}[]=coffeeBrandSources.flatMap(s=>s.channels.filter(c=>["menu","md","shop"].includes(c.kind)).map(c=>({brand:s.brand,url:c.url})));
targets.push(...automatedBrandSources.map(s=>({brand:s.brand,url:s.url})));
const entryCollectors=[
 ["CU",collectCu],["세븐일레븐",collectSevenEleven],["이마트24",collectEmart24],["배스킨라빈스",collectBaskinRobbins],
 ["롯데리아",collectLotteria],["도미노피자",collectDominos],["굽네",collectGoobne],["교촌치킨",collectKyochon],
 ["맥도날드",collectMcDonalds],["버거킹",collectBurgerKing],["맘스터치",collectMomstouch],["KFC",collectKfc],["피자헛",collectPizzaHut],
] as const;
// Discover actual entry URLs from collectors without performing any requests.
function discover(brand:string):typeof fetch{return async(input,init)=>{targets.push({brand,url:input instanceof Request?input.url:String(input),method:(init?.method??(input instanceof Request?input.method:"GET")).toUpperCase()});throw Error("preflight_discovery");};}
for(const [brand,collect] of entryCollectors)try{await collect(new Date().toISOString(),discover(brand));}catch{/* Expected: stop at the first request. */}
for(const [brand,collect] of [["빙그레",collectBinggrae],["매일유업",collectMaeil],["오리온",collectOrion],["풀무원",collectPulmuone],["삼양식품",collectSamyang]] as const)try{await collect(discover(brand));}catch{/* No network. */}
const unique=[...new Map(targets.map(t=>[t.brand+":"+t.url,t])).values()];
const preflight=createPolicyPreflight();
const results:{brand:string;url:string;status:string;reason:string}[]=[];
let index=0;
async function worker(){while(index<unique.length){const target=unique[index++];results.push({...target,...await preflight(target.url)});}}
await Promise.all(Array.from({length:4},worker));
results.sort((a,b)=>a.brand.localeCompare(b.brand,"ko")||a.url.localeCompare(b.url));
const totals:Record<string,number>={};for(const result of results)totals[result.status]=(totals[result.status]??0)+1;
await writeFile(new URL("../src/data/collection-policy-status.json",import.meta.url),JSON.stringify({checkedAt:new Date().toISOString(),scope:"수집 진입경로 정책 확인만 수행. 상품 요청·수집·검수·알림 없음",brands:new Set(results.map(r=>r.brand)).size,totals,results},null,2)+"\n");
console.log(JSON.stringify({brands:new Set(results.map(r=>r.brand)).size,paths:results.length,totals}));
for(const row of results.filter(r=>["failed","blocked","restricted"].includes(r.status)))console.log(`${row.brand}: ${row.status} / ${new URL(row.url).hostname}`);
