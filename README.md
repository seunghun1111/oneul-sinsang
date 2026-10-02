# 오늘신상 (oneul-sinsang)

식품 브랜드의 신상품 발표를 공식 보도자료에서 확인해 모아 보는 모바일 우선 서비스입니다.

## 두 화면의 역할

| 경로 | 역할 | 데이터 |
| --- | --- | --- |
| 저장소 루트 | [GitHub Pages 미리 보기](https://seunghun1111.github.io/oneul-sinsang/) | UI 검증용 예시 상품 |
| [`chatgpt-site/`](chatgpt-site/) | 서버·DB를 사용하는 실제 서비스 | 공식 발표에서 수집한 상품 |

루트의 `main` 브랜치에 푸시하면 `.github/workflows/deploy-pages.yml`이 **GitHub Pages 미리 보기만** 자동 배포합니다. 서버·DB 사이트는 별도의 Sites 배포가 필요하며, 이 저장소에 코드를 포함했다고 자동 배포되지는 않습니다. GitHub Pages는 정적 사이트이므로 실제 수집이나 DB 저장을 수행하지 않습니다.

## 로컬 실행과 검증

```bash
# 정적 미리 보기
npm ci
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

`chatgpt-site`는 빙그레·오리온·삼양식품·매일유업·풀무원의 공식 발표를 읽는 수집기를 포함합니다. 읽기 전용 점검은 `chatgpt-site`에서 `npm run collect:check`로 실행할 수 있습니다. 실제 저장은 서버의 `POST /api/collect/all`로만 수행하며, 배포 환경에 별도로 설정한 `COLLECTOR_TOKEN` 인증이 필요합니다. 토큰을 저장소에 넣거나 공개하면 안 됩니다.

배포 전에는 Sites의 DB 마이그레이션, 수집 인증 설정, 수집 결과와 화면 노출을 순서대로 확인해야 합니다. 운영 DB 쓰기와 배포는 명시적인 승인 후 진행합니다.
