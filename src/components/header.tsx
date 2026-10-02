import Link from "next/link";

export function Header() {
  return <><header className="site-header"><div className="header-inner">
    <Link className="brand" href="/" aria-label="오늘신상 홈"><span className="brand-mark">오</span><span>오늘신상</span></Link>
    <nav className="header-nav" aria-label="주 메뉴"><Link className="active" href="/">신상 찾기</Link><Link href="/#about">서비스 소개</Link></nav>
  </div></header><aside className="demo-notice" aria-label="데이터 출처 안내">공식 브랜드 발표를 매일 확인해 갱신합니다. 상품별 공식 출처에서 세부 정보를 확인하세요.</aside></>;
}
