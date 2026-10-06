# 오늘신상 (oneul-sinsang)

식품 브랜드의 신상품 발표를 공식 보도자료에서 확인해 모아 보는 모바일 우선 서비스입니다.

## 두 배포 형태

| 경로 | 역할 | 데이터 |
| --- | --- | --- |
| 저장소 루트 | [GitHub Pages 공개 서비스](https://seunghun1111.github.io/oneul-sinsang/) | 매일 갱신되는 정적 상품 JSON |
| [`chatgpt-site/`](chatgpt-site/) | 서버·DB를 사용하는 실제 서비스 | 공식 발표에서 수집한 상품 |

루트의 `main` 브랜치에 푸시하면 `.github/workflows/deploy-pages.yml`이 GitHub Pages를 자동 배포합니다. `.github/workflows/update-products.yml`은 매일 오전 6시 30분(한국 시간)에 CU·세븐일레븐·이마트24 공식 상품 목록과 공식 브랜드 발표를 읽어 `src/data/products.json`을 갱신하고, 변경이 있으면 커밋한 뒤 갱신된 정적 결과를 직접 Pages에 배포합니다. 야간 상품 갱신 이후이면서 출근 시간 전이고, GitHub Actions의 정각 실행 지연을 피할 수 있도록 6시 30분으로 설정했습니다. GitHub Pages 방문 시에는 외부 수집이나 DB 접근이 발생하지 않습니다.

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

## 데이터 갱신

`chatgpt-site`의 빙그레·오리온·삼양식품·매일유업·풀무원 수집기를 GitHub Pages 데이터 갱신에도 재사용합니다. 루트에서 `npm run update:products`를 실행하면 성공한 출처의 결과를 기존 JSON에 병합하며, 실패한 출처의 기존 데이터는 보존합니다. 별도 API 키나 수집 토큰은 사용하지 않습니다.

배포 전에는 Sites의 DB 마이그레이션, 수집 인증 설정, 수집 결과와 화면 노출을 순서대로 확인해야 합니다. 운영 DB 쓰기와 배포는 명시적인 승인 후 진행합니다.
