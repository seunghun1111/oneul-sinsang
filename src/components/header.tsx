import Link from "next/link";

export function Header() {
  return <header className="site-header"><div className="header-inner">
    <Link className="brand" href="/" aria-label="오늘신상 홈"><span className="brand-mark">오</span><span>오늘신상</span></Link>
    <nav className="header-nav" aria-label="주 메뉴"><Link className="active" href="/">신상 찾기</Link><Link href="/#about">서비스 소개</Link></nav>
    <button className="bookmark-button" type="button" aria-label="저장한 상품">♡ <span>저장</span></button>
  </div></header>;
}

