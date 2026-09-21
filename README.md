# 오늘신상 (oneul-sinsang)

편의점, 카페, 식품 브랜드의 신상품과 시즌 메뉴를 한곳에 모으는 모바일 우선 웹 서비스입니다.

## 미리 보기

GitHub Pages: <https://seunghun1111.github.io/oneul-sinsang/>

`main` 브랜치에 변경 사항이 올라오면 `.github/workflows/deploy-pages.yml`이 정적 사이트를 자동으로 빌드하고 배포합니다. 저장소의 **Settings → Pages → Source**는 **GitHub Actions**로 설정해야 합니다.

## 로컬 실행

```bash
npm install
npm run dev
```

브라우저에서 <http://localhost:3000>을 엽니다.

## 현재 구현

- 반응형 상품 목록과 상품 상세 화면
- 카테고리 필터와 출시일/발견일 정렬
- GitHub Pages 정적 내보내기 및 자동 배포
- 상품명 정규화와 동일 상품 판별 기반
- 실제 수집기와 DB 연결 전 UI 검증용 Mock 데이터

## 검증

```bash
npm run lint
npm run build
```

## 다음 단계

PostgreSQL/Prisma 연결 후 스타벅스 Collector 한 개를 구현해 수집 → 신규 판별 → 저장 → 화면 노출의 End-to-End 흐름을 완성합니다. 서버 기능은 GitHub Pages와 별도의 런타임에 배포합니다.
