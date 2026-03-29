import { WikiHeader } from "@/components/WikiHeader";

export default function WikiLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <WikiHeader />
      {children}
    </>
  );
}
