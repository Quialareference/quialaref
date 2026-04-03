import { WikiHeader } from "@/components/WikiHeader";

export default function SubmitLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <WikiHeader />
      {children}
    </>
  );
}
