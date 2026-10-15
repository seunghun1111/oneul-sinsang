import {getChatGPTUser} from "../../chatgpt-auth";
import {loadCollectionHealth} from "../../../lib/review/load-collection-health";
export const dynamic="force-dynamic";
export async function GET() {
  const headers={"cache-control":"no-store"};
  if(!await getChatGPTUser())return Response.json({error:"로그인이 필요합니다."},{status:401,headers});
  const collectionHealth=await loadCollectionHealth();
  if(!collectionHealth)return Response.json({error:"운영 현황 기록을 불러오지 못했습니다. 상품 검수는 계속할 수 있습니다."},{status:502,headers});
  return Response.json({collectionHealth},{headers});
}
