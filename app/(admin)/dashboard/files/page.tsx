import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { Topbar } from "@/components/topbar";
import { getAllFiles } from "@/app/actions/files";

export const metadata: Metadata = { title: "All Files — LF Creative" };
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

  const PAGE_SIZE = 50;
  const [{ groups, total }, drives, { projects }, folders, breadcrumb] = await Promise.all([
    getAllFiles({ folderId, limit: PAGE_SIZE }).catch(() => ({ groups: [], total: 0 })),
    getActiveDrives().catch(() => []),
    getProjects().catch(() => ({ projects: [], total: 0 })),
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
            total={total}
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
