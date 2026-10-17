# 자동 수집·배포 실행 환경 정리

## 변경 범위

- Checks, Pages 배포, 일일 수집, 상품 검수 워크플로의 실행 OS를 `ubuntu-24.04`로 고정.
- checkout/setup-node는 v5, deploy-pages는 v5로 변경. 액션 자체는 Node 24 기반이며 앱의 `node-version: 22`는 유지.
- Pages 패키징은 upload-pages-artifact v4, 실패 진단 업로드는 upload-artifact v6로 변경.
- 매일 06:30 KST 수집 일정, 권한, 검수 요청자 제한, 실패 진단 보존 7일, 오래된 수집 결과 게시 차단은 유지.

## 남은 제약

- 공식 upload-pages-artifact v4도 내부에서 upload-artifact v4.6.2를 사용한다. 따라서 전이 의존성의 Node 20 경고는 남을 수 있으며 경고 억제용 환경 변수나 자체 포크로 우회하지 않았다.
- 로컬 검증은 GitHub 호스팅 러너의 실행을 대체하지 않는다. 배포 승인을 받은 뒤 실제 Actions에서 빌드·게시 성공 여부와 잔여 경고를 확인해야 한다.
- 운영 워크플로 변경은 로컬 준비 상태이며 아직 커밋·푸시하지 않았다. 상품 데이터와 화면 코드는 변경하지 않았다.

## 검증

- 전체 테스트 187개 통과 (실행 환경·일정·인가 경계 회귀 검사 3개 추가).
- 워크플로 YAML 파싱, `git diff --check` 확인.

## 공식 근거

- https://github.com/actions/checkout/blob/v5/action.yml
- https://github.com/actions/setup-node/blob/v5/action.yml
- https://github.com/actions/deploy-pages/blob/v5/action.yml
- https://github.com/actions/upload-pages-artifact/blob/v4/action.yml
- https://github.com/actions/upload-artifact/blob/v6/action.yml
