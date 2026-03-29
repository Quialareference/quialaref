import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { SubmitRefForm } from "@/components/submit/SubmitRefForm";

export default async function SubmitPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin");

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[--text]">Soumettre une référence</h1>
        <p className="text-[--text-muted] text-sm mt-1">
          Ta soumission sera examinée avant d&apos;apparaître dans le jeu.
        </p>
      </div>
      <SubmitRefForm />
    </main>
  );
}
