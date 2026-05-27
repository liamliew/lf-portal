import { Topbar } from "@/components/topbar";
import { getProjects } from "@/app/actions/projects";
import { supabase } from "@/lib/supabase";
import { ProjectsClient } from "./projects-client";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function ProjectsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const projects = await getProjects();
  const projectIds = projects.map((p) => p.id);
  const idFilter = projectIds.length > 0 ? projectIds : ["00000000-0000-0000-0000-000000000000"];

  // Fetch file stats via project_file_refs -> files
  const { data: fileStats } = await supabase
    .from("project_file_refs")
    .select("project_id, files(size)")
    .in("project_id", idFilter);

  // Fetch share stats scoped to this user's projects only
  const { data: shareStats } = await supabase
    .from("project_shares")
    .select("project_id, expires_at")
    .in("project_id", idFilter);

  // Map data to the format needed by the UI
  const projectStats = projects.map((p) => {
    const pFiles = (fileStats || []).filter((f) => f.project_id === p.id);
    const pShares = (shareStats || []).filter((s) => s.project_id === p.id);
    const activeLinks = pShares.filter((s) => !s.expires_at || new Date(s.expires_at) > new Date()).length;
    const totalSize = pFiles.reduce((acc, f) => {
      const filesArr = f.files as { size: number }[] | { size: number } | null;
      const size = Array.isArray(filesArr) ? (filesArr[0]?.size ?? 0) : (filesArr?.size ?? 0);
      return acc + Number(size);
    }, 0);

    return {
      ...p,
      fileCount: pFiles.length,
      totalSize,
      activeLinks,
    };
  });

  const active = projectStats; // Treat all real projects as active for now since status isn't in db schema

  return (
    <>
      <Topbar crumbs={["Projects"]} />
      <div className="content">
        <div className="content-narrow">
          <ProjectsClient initialProjects={active} />
        </div>
      </div>
    </>
  );
}
