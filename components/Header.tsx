"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { ThemeToggle } from "./ThemeToggle";

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const isInGame = pathname.startsWith("/room/");
  const isWiki = pathname.startsWith("/wiki");
  const [showConfirm, setShowConfirm] = useState(false);

  function handleLogoClick(e: React.MouseEvent) {
    if (isInGame) {
      e.preventDefault();
      setShowConfirm(true);
    }
  }

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-[--border] bg-[--bg]/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto flex items-center justify-between py-2.5 px-4">

          {/* Left */}
          <div className="flex items-center gap-2 w-44">
            <ThemeToggle />
            {session?.user ? (
              <Link
                href="/settings"
                className="flex items-center gap-1.5 text-xs font-bold bg-white text-gray-900 hover:bg-yellow-300 transition-colors px-3 py-1.5 rounded-full whitespace-nowrap max-w-[120px]"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 shrink-0">
                  <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clipRule="evenodd" />
                </svg>
                <span className="truncate">{session.user.username ?? session.user.email?.split("@")[0]}</span>
              </Link>
            ) : (
              <Link
                href="/auth/signin"
                className="flex items-center gap-1.5 text-xs font-bold bg-white text-gray-900 hover:bg-yellow-300 transition-colors px-3 py-1.5 rounded-full whitespace-nowrap"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                  <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clipRule="evenodd" />
                </svg>
                Se connecter
              </Link>
            )}
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
