# 신상발견 (oneul-sinsang)

브랜드가 공식 NEW로 소개하는 메뉴·식품·MD를 모아 보는 비상업적 모바일 우선 서비스입니다. 최초 발견일은 출시일이 아니며 NEW는 판매·재고 보증이 아닙니다. [현재 품질 기준과 제한](docs/current-baseline-2026-10-17.md)을 함께 확인하세요.

## 두 배포 형태

| 경로 | 역할 | 데이터 |
| --- | --- | --- |
| 저장소 루트 | [GitHub Pages 공개 서비스](https://seunghun1111.github.io/oneul-sinsang/) | 매일 갱신되는 정적 상품 JSON |
| [`chatgpt-site/`](chatgpt-site/) | 소유자 전용 통합검수함 | GitHub 상품·자동 판정·수동 결정·운영 현황 |

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

Site 검수함은 GitHub의 상품·자동 판정·수동 결정을 조회합니다. 카테고리·브랜드·세부 카테고리·처리 구분·상품명으로 필터링할 수 있습니다. 기본 화면은 관리자 확인이 필요한 예외이며, 단순 NEW 미확인은 비공개 관찰로 구분합니다. 수동 결정은 자동 판정보다 우선합니다.

승인·제외 요청은 GitHub 이슈에 등록하고 저장소 권한 검증 후 Actions가 처리합니다. 제외 결정은 재수집 후에도 보존됩니다. 공개 NEW 목록에는 출시일 30일 제한이나 판매 확인을 일괄 요구하지 않습니다. 검수 대기·제외·NEW 종료 상품은 숨기며, 교촌 공식 신메뉴 탭 예외는 정확한 공식 경로와 근거를 함께 확인합니다. 이번주·이번달은 최초 확인일 기준이고 2026-10-19부터 초기 수집을 제외합니다. 사이트 버튼 클릭만으로 승인이 완료되지 않으며 GitHub에서 요청 등록까지 마쳐야 합니다.

## 데이터 갱신

`npm run update:brands`는 bhc·푸라닭·네네치킨·BBQ와 하겐다즈·나뚜루·롯데웰푸드 아이스크림을 확인합니다. 공식몰은 최신 정렬 첫 페이지의 명시적 NEW만 후보로 채택합니다. 출시일 미공개만으로 수동 승인을 요구하지 않으며 추천 순서·이미지 날짜·할인 기간을 NEW로 추정하지 않습니다. 실패·갑작스러운 전체 0건은 기존 상품을 보존하고, 부분 목록의 누락이나 NEW 종료를 판매 종료로 단정하지 않습니다.

추가 출처는 매 실행마다 robots.txt를 먼저 확인합니다. 정책이 차단하거나 403·5xx·HTML 오류를 반환하면 상품 요청을 중단합니다. 404·410은 정책 미제공으로 기록하며 허용 승인을 의미하지 않습니다. 계정·회원·주문·장바구니 API는 호출하지 않습니다. `src/data/brand-collection-status.json`에 브랜드별 성공/실패·NEW 후보 수·정책 확인 결과를 기록합니다. 수집 실패 시 기존 상품을 보존합니다.

검수함은 상품별 체크박스와 현재 표시 상품 선택을 제공합니다. 한 번에 최대 50개를 승인·제외 요청할 수 있으며 최종 확인 목록을 거쳐 GitHub 이슈 한 건으로 처리합니다. 필터 변경·새로고침 시 선택을 초기화합니다. 동일 상태는 건너뛰고, 존재하지 않는 ID가 있으면 반영 전에 전체 요청을 거부합니다. 처리 건수와 건너뛴 건수는 요청 이슈에 기록됩니다.

`chatgpt-site`의 빙그레·오리온·삼양식품·매일유업·풀무원 수집기를 GitHub Pages 데이터 갱신에도 재사용합니다. 루트에서 `npm run update:products`를 실행하면 성공한 출처의 결과를 기존 JSON에 병합하며, 실패한 출처의 기존 데이터는 보존합니다. 별도 API 키나 수집 토큰은 사용하지 않습니다.

`npm run check:quality`는 외부 요청 없이 저장 데이터·공개 필터를 검사하고 docs/catalog-quality-current.json을 생성합니다. `npm run check:quality -- --check`는 파일을 쓰지 않는 CI 검사입니다. 중복 ID·가격 필드·깨진 필수 날짜·안전하지 않은 공개 출처는 오류, 이미지 누락·확인 지연은 보완 대상으로 구분합니다.

`npm run check:policies` 후 `npm run check:routes`로 외부 진입 경로를 점검할 수 있습니다. GET 응답만 검사하므로 POST·상세·동적 경로는 별도 확인이 필요하며 HTTP 200은 NEW 수집 성공이 아닙니다.

GitHub Pages와 비공개 Sites는 별도 배포입니다. Sites UI 변경은 공식 source helper 동기화·빌드·게시가 필요합니다. DB 마이그레이션은 모든 UI 변경의 필수 단계가 아닙니다. 운영 DB 쓰기·배포·권한 변경은 명시적 승인 후 진행합니다. 날짜가 붙은 과거 문서는 해당 작업 시점의 기록이므로 최신 상태는 배포 결과와 현재 품질 보고서로 확인하세요.
