"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { AnimatePresence, motion } from "framer-motion";
import { ThemeToggle } from "./ThemeToggle";

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const isInGame = pathname.startsWith("/room/");
  const isWiki = pathname.startsWith("/wiki");
  const [showConfirm, setShowConfirm] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  function handleLogoClick(e: React.MouseEvent) {
    if (isInGame) {
      e.preventDefault();
      setShowConfirm(true);
    }
  }

  const userIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 shrink-0">
      <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clipRule="evenodd" />
    </svg>
  );

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-[--border] bg-[--header-bg] backdrop-blur-md">
        <div className="max-w-5xl mx-auto flex items-center justify-between py-2.5 px-4">

          {/* Mobile: hamburger — Desktop: left buttons */}
          <div className="flex items-center gap-2 w-44">

            {/* Hamburger (mobile only) */}
            <button
              className="sm:hidden flex flex-col gap-1.5 p-1"
              onClick={() => setMenuOpen(true)}
              aria-label="Menu"
            >
              <span className="block w-5 h-0.5 bg-[--text]" />
              <span className="block w-5 h-0.5 bg-[--text]" />
              <span className="block w-5 h-0.5 bg-[--text]" />
            </button>

            {/* Desktop left items */}
            <div className="hidden sm:flex items-center gap-2">
              <ThemeToggle />
              {session?.user ? (
                <Link
                  href="/settings"
                  className="flex items-center gap-1.5 text-xs font-bold bg-white text-gray-900 hover:bg-yellow-300 transition-colors px-3 py-1.5 rounded-full whitespace-nowrap max-w-[120px]"
                >
                  {userIcon}
                  <span className="truncate">{session.user.username ?? session.user.email?.split("@")[0]}</span>
                </Link>
              ) : (
                <Link
                  href="/auth/signin"
                  className="flex items-center gap-1.5 text-xs font-bold bg-white text-gray-900 hover:bg-yellow-300 transition-colors px-3 py-1.5 rounded-full whitespace-nowrap"
                >
                  {userIcon}
                  Se connecter
                </Link>
              )}
            </div>
          </div>

          {/* Logo centré */}
          <Link
            href={isWiki ? "/wiki" : "/"}
            onClick={handleLogoClick}
            className="flex-shrink-0 block transition-transform duration-200 hover:scale-105 cursor-pointer"
          >
            <Image
              src={isWiki ? "/logo-wiki.png" : "/logo.png"}
              alt={isWiki ? "Wikiref" : "Qui a la réf ?"}
              width={200}
              height={70}
              className="h-14 w-auto pointer-events-none"
              priority
            />
          </Link>

          {/* Right */}
          <div className="flex items-center justify-end gap-2 w-44">
            <a
              href="https://wikiref.fr/submit"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold bg-white text-gray-900 hover:bg-yellow-300 transition-colors px-3 py-1.5 rounded-full hidden sm:block whitespace-nowrap"
            >
              + Ajouter une réf
            </a>
            <a
              href="https://wikiref.fr"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold bg-white text-gray-900 hover:bg-yellow-300 transition-colors px-3 py-1.5 rounded-full hidden sm:block whitespace-nowrap"
            >
              Parcourir
            </a>
          </div>

        </div>
      </header>

      {/* Mobile menu overlay */}
      <AnimatePresence>
      {menuOpen && (
        <div className="fixed inset-0 z-[100] sm:hidden">
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setMenuOpen(false)}
          />
          <motion.div
            className="absolute top-0 left-0 h-full w-72 max-w-[85vw] bg-[--bg-card] border-r border-[--border] flex flex-col p-6 gap-4 shadow-2xl"
            initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
            transition={{ type: "tween", duration: 0.25 }}
          >
            {/* Close + logo */}
            <div className="flex items-center justify-between mb-2">
              <Image src="/logo.png" alt="Qui a la réf ?" width={120} height={42} className="h-10 w-auto" />
              <button onClick={() => setMenuOpen(false)} className="text-[--text-muted] hover:text-[--text] text-2xl leading-none">✕</button>
            </div>

            <div className="border-t border-[--border]" />

            {/* Theme toggle */}
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <span className="text-[--text-muted] text-sm">Thème</span>
            </div>

            <div className="border-t border-[--border]" />

            {/* Auth */}
            {session?.user ? (
              <Link
                href="/settings"
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-center gap-2 text-sm font-bold bg-white text-gray-900 hover:bg-yellow-300 transition-colors px-4 py-3 rounded-xl"
              >
                {userIcon}
                <span className="truncate">{session.user.username ?? session.user.email?.split("@")[0]}</span>
              </Link>
            ) : (
              <Link
                href="/auth/signin"
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-center gap-2 text-sm font-bold bg-white text-gray-900 hover:bg-yellow-300 transition-colors px-4 py-3 rounded-xl"
              >
                {userIcon}
                Se connecter
              </Link>
            )}

            <a
              href="https://wikiref.fr/submit"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMenuOpen(false)}
              className="text-sm font-bold bg-white text-gray-900 hover:bg-yellow-300 transition-colors px-4 py-3 rounded-xl text-center"
            >
              + Ajouter une réf
            </a>

            <a
              href="https://wikiref.fr"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMenuOpen(false)}
              className="text-sm font-bold bg-white text-gray-900 hover:bg-yellow-300 transition-colors px-4 py-3 rounded-xl text-center"
            >
              Parcourir le wiki
            </a>
          </motion.div>
        </div>
      )}
      </AnimatePresence>

      {/* Confirm modal — in-game only */}
      {showConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowConfirm(false)} />
          <div className="relative bg-[--bg-card] border border-[--border] rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <p className="text-2xl text-center mb-3">🚪</p>
            <h2 className="text-[--text] font-black text-lg text-center mb-2">Quitter la partie ?</h2>
            <p className="text-[--text-muted] text-sm text-center mb-6">
              Tu vas abandonner la partie en cours. Les autres joueurs continueront sans toi.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 bg-white/10 hover:bg-white/20 text-[--text] font-semibold py-2.5 rounded-xl transition-colors"
              >
                Rester
              </button>
              <button
                onClick={() => { setShowConfirm(false); router.push("/"); }}
                className="flex-1 bg-red-500/80 hover:bg-red-500 text-white font-bold py-2.5 rounded-xl transition-colors"
              >
                Quitter
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
