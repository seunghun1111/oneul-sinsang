import {readFile,writeFile} from "node:fs/promises";
import {buildCollectionHealth,type CollectionGroup} from "../chatgpt-site/lib/review/collection-health.ts";
import {coffeeBrandSources} from "../src/data/coffee-sources.ts";
import {automatedBrandSources} from "./lib/manual-brand-collector.ts";
const data=new URL("../src/data/",import.meta.url);
const sources=[
 {id:"cu",label:"편의점 · CU",brands:["CU"],file:"cu-collection-status.json"},
 {id:"convenience",label:"편의점 · 세븐·이마트24",brands:["세븐일레븐","이마트24"],file:"convenience-collection-status.json"},
 {id:"foodservice",label:"외식",brands:["롯데리아","맥도날드","버거킹","맘스터치","도미노피자","피자헛","굽네","교촌치킨","KFC"],file:"foodservice-collection-status.json"},
 {id:"icecream",label:"아이스크림",brands:["배스킨라빈스"],file:"icecream-collection-status.json"},
 {id:"coffee",label:"카페",brands:coffeeBrandSources.map(source=>source.brand),file:"coffee-collection-status.json"},
 {id:"additional",label:"추가 치킨·아이스크림",brands:automatedBrandSources.map(source=>source.brand),file:"brand-collection-status.json"},
 {id:"press",label:"식품 공식 발표",brands:["빙그레","매일유업","오리온","풀무원","삼양식품"],file:"press-collection-status.json"},
] satisfies (CollectionGroup&{file:string})[];
async function read(file:string) {
 try{return JSON.parse(await readFile(new URL(file,data),"utf8"));}
 catch(error){if(error instanceof SyntaxError||(error as NodeJS.ErrnoException).code==="ENOENT")return undefined;throw error;}
}
const reports=Object.fromEntries(await Promise.all(sources.map(async source=>[source.id,await read(source.file)])));
const previous=await read("collection-health.json");
const health=buildCollectionHealth(sources,reports,previous);
await writeFile(new URL("collection-health.json",data),JSON.stringify(health,null,2)+"\n");
console.log(`수집 운영 현황 ${health.rows.length}개 브랜드 경로 기록`);
