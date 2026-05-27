import { auth } from "@clerk/nextjs/server";
import { Sidebar } from "@/components/sidebar";
import { supabase } from "@/lib/supabase";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();

  let projectCount = 0;
  let shareCount = 0;

  if (userId) {
    const { data: projects } = await supabase
      .from("projects")
      .select("id")
      .eq("created_by", userId);

    const projectIds = (projects ?? []).map((p: { id: string }) => p.id);
    projectCount = projectIds.length;

    if (projectIds.length > 0) {
      const { count } = await supabase
        .from("project_shares")
        .select("*", { count: "exact", head: true })
        .in("project_id", projectIds);
      shareCount = count ?? 0;
    }
  }

  return (
    <div className="app">
      <Sidebar projectCount={projectCount} shareCount={shareCount} />
      <main className="main">{children}</main>
    </div>
  );
}
