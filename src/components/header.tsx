"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { categoryGroups } from "@/lib/category-groups";

export function Header() {
  const pathname = usePathname();
  const currentPath = pathname.replace(/\/$/, "") || "/";
  return <><header className="site-header"><div className="header-inner">
    <Link className="brand" href="/" aria-label="오늘신상 홈"><span className="brand-mark">오</span><span>오늘신상</span></Link>
    <nav className="header-nav" aria-label="주 메뉴"><Link className={currentPath === "/" ? "active" : ""} href="/">홈</Link><Link className={currentPath === "/review" ? "active" : ""} href="/review">수집 현황</Link><Link href="/#about">서비스 소개</Link></nav>
  </div><nav className="category-nav" aria-label="상품 카테고리">{categoryGroups.map(group => <Link className={currentPath === `/categories/${group.slug}` ? "active" : ""} href={`/categories/${group.slug}`} key={group.slug}><span aria-hidden="true">{group.emoji}</span>{group.shortLabel}</Link>)}</nav></header><aside className="demo-notice" aria-label="데이터 출처 안내">공식 브랜드 발표를 매일 확인해 갱신합니다. 상품별 공식 출처에서 세부 정보를 확인하세요.</aside></>;
}
