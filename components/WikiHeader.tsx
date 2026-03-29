import Image from "next/image";
import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";
import { auth } from "@/lib/auth/config";

export async function WikiHeader() {
  const session = await auth();

  return (
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
        <Link href="/wiki" className="flex-shrink-0 block transition-transform duration-200 hover:scale-105 cursor-pointer">
          <Image
            src="/logo-wiki.png"
            alt="Wikiref"
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
          <a
            href="https://quialaref.fr"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-bold bg-white text-gray-900 hover:bg-yellow-300 transition-colors px-3 py-1.5 rounded-full hidden sm:block whitespace-nowrap"
          >
            🎮 Jouer
          </a>
        </div>

      </div>
    </header>
  );
}
