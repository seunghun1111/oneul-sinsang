const origin = new URL(process.env.RUNTIME_CHECK_ORIGIN ?? "http://127.0.0.1:8788");
const loopbackHosts = new Set(["127.0.0.1", "localhost", "[::1]"]);

if (origin.protocol !== "http:" || !loopbackHosts.has(origin.hostname) || origin.username || origin.password) {
  throw new Error("RUNTIME_CHECK_ORIGIN must be an unauthenticated HTTP loopback URL.");
}

async function request(path, init) {
  const response = await fetch(new URL(path, origin), {
    ...init,
    redirect: "error",
    signal: AbortSignal.timeout(5_000),
  });
  const contentType = response.headers.get("content-type") ?? "";
  const body = contentType.includes("application/json") ? await response.json() : await response.text();
  return { response, body };
}

const home = await request("/");
if (home.response.status !== 200 || typeof home.body !== "string" || !home.body.includes("오늘신상")) {
  throw new Error("Home page smoke check failed.");
}

const products = await request("/api/products");
if (
  products.response.status !== 200 ||
  products.response.headers.get("cache-control") !== "no-store" ||
  !Array.isArray(products.body?.products)
) {
  throw new Error("Products API smoke check failed.");
}
const internalFields = ["slug", "normalizedName", "retailer", "createdAt", "updatedAt"];
if (products.body.products.some(product => internalFields.some(field => Object.hasOwn(product, field)))) {
  throw new Error("Products API exposed an internal field.");
}

const blockedWrite = await request("/api/products", { method: "POST" });
if (blockedWrite.response.status !== 403 || blockedWrite.body?.error !== "공개 상품 등록은 중단되었습니다.") {
  throw new Error("Public product write guard smoke check failed.");
}

console.log(`로컬 런타임 확인 완료 · 상품 ${products.body.products.length}건 · 공개 쓰기 차단 정상`);
