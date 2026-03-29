"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { ThemeToggle } from "./ThemeToggle";

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
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
            <Link
              href="/submit"
              className="text-xs font-bold bg-white text-gray-900 hover:bg-yellow-300 transition-colors px-3 py-1.5 rounded-full hidden sm:block whitespace-nowrap"
            >
              + Ajouter une réf
            </Link>
            <Link
              href="/wiki"
              className="text-xs font-bold bg-white text-gray-900 hover:bg-yellow-300 transition-colors px-3 py-1.5 rounded-full hidden sm:block whitespace-nowrap"
            >
              Parcourir
            </Link>
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
