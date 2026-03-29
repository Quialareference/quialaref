import Link from "next/link";

export default function VerifyPage() {
  return (
    <main className="max-w-sm mx-auto px-4 py-16 text-center">
      <p className="text-5xl mb-4">📬</p>
      <h1 className="text-2xl font-bold text-[--text] mb-2">Vérifie tes emails</h1>
      <p className="text-[--text-muted] mb-6">Clique sur le lien dans ton email pour te connecter.</p>
      <Link href="/" className="text-yellow-500 hover:text-yellow-400 text-sm transition-colors">← Retour</Link>
    </main>
  );
}
