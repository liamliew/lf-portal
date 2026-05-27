import type { Metadata } from "next";
import { Topbar } from "@/components/topbar";

export const metadata: Metadata = { title: "Inbox — LF Creative" };

export default function InboxPage() {
  return (
    <>
      <Topbar crumbs={["Inbox"]} />
      <main style={{ padding: "32px 40px" }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Inbox</h1>
        <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Inbox coming soon.</p>
      </main>
    </>
  );
}
