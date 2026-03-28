import { BottomNav } from "@/components/bottom-nav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <main className="pb-20 pt-4 px-4">{children}</main>
      <BottomNav />
    </>
  );
}
