import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { Topbar } from "@/components/topbar";
import { getAllFiles } from "@/app/actions/files";
import { getActiveDrives } from "@/lib/drives";
import { getProjects } from "@/app/actions/projects";
import { getFolders, getFolderBreadcrumb, type NASFolder } from "@/app/actions/folders";
import { AllFilesClient } from "./files-client";

export default async function AllFilesPage({
  searchParams,
}: {
  searchParams: Promise<{ folderId?: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { folderId } = await searchParams;

  const [groups, drives, projects, folders, breadcrumb] = await Promise.all([
    getAllFiles(folderId).catch(() => []),
    getActiveDrives().catch(() => []),
    getProjects().catch(() => []),
    getFolders(folderId).catch(() => []),
    folderId ? getFolderBreadcrumb(folderId).catch(() => [] as NASFolder[]) : Promise.resolve([] as NASFolder[]),
  ]);

  return (
    <>
      <Topbar crumbs={["All files"]} />
      <div className="content">
        <div className="content-narrow">
          <AllFilesClient
            groups={groups}
            drives={drives}
            projects={projects}
            folders={folders}
            breadcrumb={breadcrumb}
            currentFolderId={folderId}
          />
        </div>
      </div>
    </>
  );
}
