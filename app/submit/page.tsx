import { SubmitRefForm } from "@/components/submit/SubmitRefForm";

export default function SubmitPage() {
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
