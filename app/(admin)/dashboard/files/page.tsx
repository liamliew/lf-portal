import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { Topbar } from "@/components/topbar";
import { getAllFiles } from "@/app/actions/files";
import { getActiveDrives } from "@/lib/drives";
import { getProjects } from "@/app/actions/projects";
import { AllFilesClient } from "./files-client";

export default async function AllFilesPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const [groups, drives, projects] = await Promise.all([
    getAllFiles().catch(() => []),
    getActiveDrives().catch(() => []),
    getProjects().catch(() => []),
  ]);

  return (
    <>
      <Topbar crumbs={["All files"]} />
      <div className="content">
        <div className="content-narrow">
          <AllFilesClient groups={groups} drives={drives} projects={projects} />
        </div>
      </div>
    </>
  );
}
