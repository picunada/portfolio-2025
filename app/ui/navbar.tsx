'use client'
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-10 rounded-4xl border border-stone-800 row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
      <Link href="/portfolio" ><div className={`p-2 ${pathname === '/portfolio' ? 'bg-white text-black' : ''}`}>about</div></Link>
      <Link href="/blog" ><div className={`p-2 ${pathname === '/blog' ? 'bg-white' : ''}`}>blog</div></Link>
      <Link href="/contacts"><div className={`p-2 ${pathname === '/contacts' ? 'bg-white' : ''}`}>contacts</div></Link>
    </nav>
  );
}
