import { Topbar } from "@/components/topbar";

export default function TeamPage() {
  return (
    <>
      <Topbar crumbs={["Team"]} />
      <main style={{ padding: "32px 40px" }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Team</h1>
        <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Team management coming soon.</p>
      </main>
    </>
  );
}
