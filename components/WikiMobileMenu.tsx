"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ThemeToggle } from "./ThemeToggle";

interface WikiMobileMenuProps {
  username: string | null;
  isLoggedIn: boolean;
}

const userIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 shrink-0">
    <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clipRule="evenodd" />
  </svg>
);

export function WikiMobileMenu({ username, isLoggedIn }: WikiMobileMenuProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
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
              <Image src="/logo-wiki.png" alt="Wikiref" width={120} height={42} className="h-10 w-auto" />
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
            {isLoggedIn ? (
              <Link
                href="/settings"
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-center gap-2 text-sm font-bold bg-white text-gray-900 hover:bg-yellow-300 transition-colors px-4 py-3 rounded-xl"
              >
                {userIcon}
                <span className="truncate">{username ?? "Mon compte"}</span>
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

            <Link
              href="/submit"
              onClick={() => setMenuOpen(false)}
              className="text-sm font-bold bg-white text-gray-900 hover:bg-yellow-300 transition-colors px-4 py-3 rounded-xl text-center"
            >
              + Ajouter une réf
            </Link>

            <a
              href="https://quialaref.fr"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMenuOpen(false)}
              className="text-sm font-bold bg-white text-gray-900 hover:bg-yellow-300 transition-colors px-4 py-3 rounded-xl text-center"
            >
              🎮 Jouer
            </a>
          </motion.div>
        </div>
      )}
      </AnimatePresence>
    </>
  );
}
