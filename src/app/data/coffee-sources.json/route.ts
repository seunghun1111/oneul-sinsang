import { coffeeBrandSources } from "@/data/coffee-sources";
export const dynamic = "force-static";
export function GET() { return Response.json(coffeeBrandSources); }
