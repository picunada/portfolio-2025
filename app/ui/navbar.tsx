'use client'
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";

export default function Navbar() {
  const pathname = usePathname()

  const items = [
    { href: '/about', label: 'about' },
    { href: '/blog', label: 'blog' },
    { href: '/contacts', label: 'contacts' },
  ] as const

  return (
    <nav className="fixed bottom-10 rounded-4xl border border-stone-800 row-start-3 flex gap-[24px] px-2 py-1 flex-wrap items-center justify-center bg-black/20 backdrop-blur supports-[backdrop-filter]:bg-black/10">
      {items.map(({ href, label }) => {
        const isActive = pathname === href
        return (
          <Link key={href} href={href} aria-current={isActive ? 'page' : undefined} className="relative isolate">
            <div className="relative px-3 py-2 rounded-3xl text-sm font-medium text-white/80 hover:text-white transition-colors">
              {isActive && (
                <motion.span
                  layoutId="active-nav-pill"
                  className="absolute inset-0 -z-10 rounded-3xl bg-white"
                  transition={{ type: 'spring', stiffness: 500, damping: 40, mass: 0.9 }}
                />
              )}
              <span className={isActive ? 'text-black' : ''}>{label}</span>
            </div>
          </Link>
        )
      })}
    </nav>
  );
}
