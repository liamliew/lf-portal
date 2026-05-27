import { Topbar } from "@/components/topbar";

export default function SettingsPage() {
  return (
    <>
      <Topbar crumbs={["Settings"]} />
      <main style={{ padding: "32px 40px" }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Settings</h1>
        <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Settings coming soon.</p>
      </main>
    </>
  );
}
