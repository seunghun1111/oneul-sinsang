# 신상발견 (oneul-sinsang)

식품 브랜드의 신상품 발표를 공식 보도자료에서 확인해 모아 보는 모바일 우선 서비스입니다.

## 두 배포 형태

| 경로 | 역할 | 데이터 |
| --- | --- | --- |
| 저장소 루트 | [GitHub Pages 공개 서비스](https://seunghun1111.github.io/oneul-sinsang/) | 매일 갱신되는 정적 상품 JSON |
| [`chatgpt-site/`](chatgpt-site/) | 서버·DB를 사용하는 실제 서비스 | 공식 발표에서 수집한 상품 |

루트의 `main` 브랜치에 푸시하면 `.github/workflows/deploy-pages.yml`이 GitHub Pages를 자동 배포합니다. `.github/workflows/update-products.yml`은 매일 오전 6시 30분(한국 시간)에 CU·세븐일레븐·이마트24와 롯데리아·맥도날드·버거킹·맘스터치·도미노피자·피자헛·굽네·KFC·배스킨라빈스의 공식 상품 목록 및 공식 브랜드 발표를 읽어 `src/data/products.json`을 갱신하고, 변경이 있으면 커밋한 뒤 갱신된 정적 결과를 직접 Pages에 배포합니다. 야간 상품 갱신 이후이면서 출근 시간 전이고, GitHub Actions의 정각 실행 지연을 피할 수 있도록 6시 30분으로 설정했습니다. GitHub Pages 방문 시에는 외부 수집이나 DB 접근이 발생하지 않습니다.

## 로컬 실행과 검증

```bash
# GitHub Pages 정적 서비스
npm ci
npm run update:products
npm run dev
npm run build

# 서버·DB 사이트 (별도 터미널)
cd chatgpt-site
npm ci
npm run dev
node --experimental-strip-types --test lib/collectors/*.test.mjs
```

서버·DB 사이트의 추가 설정과 로컬 D1 마이그레이션 절차는 [`chatgpt-site/README.md`](chatgpt-site/README.md)를 참고하세요.

## 통합 검수함

관리 화면은 ChatGPT Site의 `/review`에서 제공합니다. GitHub Pages는 공개 상품 조회만 제공하며 기존 `/review` 화면은 제거했습니다.

Site 검수함은 GitHub의 최신 `products.json`, `coffee-products-auto.json`, `review-decisions.json`을 조회합니다. 카테고리·브랜드·검수 상태·상품명으로 필터링할 수 있습니다. 커피의 미검수 후보는 대기로, 기존 공식 수집 공개 상품은 승인으로 표시합니다. 신규 비커피 상품은 기존 공식 NEW 수집 기준을 유지합니다.

승인·제외 요청은 GitHub 이슈에 등록하고 저장소 권한 검증 후 Actions가 처리합니다. 모든 카테고리의 제외 결정은 별도 검수 기록에 남아 재수집 후에도 공개 목록에서 제외됩니다. 공개 목록은 기존 30일·판매 확인 조건을 계속 적용합니다. 사이트에서 버튼만 누르면 즉시 완료되는 방식은 아니며, GitHub에서 요청 등록까지 마쳐야 합니다.

## 데이터 갱신

`npm run update:brands`는 bhc·푸라닭·네네치킨·BBQ와 하겐다즈·나뚜루·롯데웰푸드 아이스크림을 확인합니다. 공식몰은 최신 정렬 첫 페이지를 읽고 상품별 명시적 NEW 배지만 후보로 채택합니다. 출시일을 확인하지 못한 후보는 검수 대기로 저장하며 승인 전에는 공개 목록에 노출하지 않습니다. 이미지 업로드일·할인 기간·신메뉴 카테고리 이름만으로 출시일을 추정하지 않습니다. 전체 NEW 목록을 읽는 치킨 3곳은 배지 소멸 시 종료 처리하고, 부분 목록인 공식몰은 누락만으로 판매 종료를 판정하지 않습니다.

추가 출처는 매 실행마다 robots.txt를 먼저 확인합니다. 정책이 차단하거나 403·5xx·HTML 오류를 반환하면 상품 요청을 중단합니다. 404·410은 정책 미제공으로 기록하며 허용 승인을 의미하지 않습니다. 계정·회원·주문·장바구니 API는 호출하지 않습니다. `src/data/brand-collection-status.json`에 브랜드별 성공/실패·NEW 후보 수·정책 확인 결과를 기록합니다. 수집 실패 시 기존 상품을 보존합니다.

검수함은 상품별 체크박스와 현재 표시 상품 선택을 제공합니다. 한 번에 최대 50개를 승인·제외 요청할 수 있으며 최종 확인 목록을 거쳐 GitHub 이슈 한 건으로 처리합니다. 필터 변경·새로고침 시 선택을 초기화합니다. 동일 상태는 건너뛰고, 존재하지 않는 ID가 있으면 반영 전에 전체 요청을 거부합니다. 처리 건수와 건너뛴 건수는 요청 이슈에 기록됩니다.

`chatgpt-site`의 빙그레·오리온·삼양식품·매일유업·풀무원 수집기를 GitHub Pages 데이터 갱신에도 재사용합니다. 루트에서 `npm run update:products`를 실행하면 성공한 출처의 결과를 기존 JSON에 병합하며, 실패한 출처의 기존 데이터는 보존합니다. 별도 API 키나 수집 토큰은 사용하지 않습니다.

배포 전에는 Sites의 DB 마이그레이션, 수집 인증 설정, 수집 결과와 화면 노출을 순서대로 확인해야 합니다. 운영 DB 쓰기와 배포는 명시적인 승인 후 진행합니다.
