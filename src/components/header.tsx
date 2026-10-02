import Link from "next/link";

export function Header() {
  return <><header className="site-header"><div className="header-inner">
    <Link className="brand" href="/" aria-label="오늘신상 홈"><span className="brand-mark">오</span><span>오늘신상</span></Link>
    <nav className="header-nav" aria-label="주 메뉴"><Link className="active" href="/">신상 찾기</Link><Link href="/#about">서비스 소개</Link></nav>
  </div></header><aside className="demo-notice" aria-label="미리 보기 안내">화면 미리 보기 · 표시된 상품명, 가격, 출시일은 예시이며 실제 출시 정보가 아닙니다.</aside></>;
}
