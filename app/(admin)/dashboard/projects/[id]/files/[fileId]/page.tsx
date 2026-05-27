import { notFound } from "next/navigation";
import { Topbar } from "@/components/topbar";
import { supabase } from "@/lib/supabase";
import { auth } from "@clerk/nextjs/server";
import { FileDetailClient } from "./file-detail-client";
import type { NASFile } from "@/app/actions/files";

interface Props {
  params: Promise<{ id: string; fileId: string }>;
}

type RawFileRow = {
  id: string;
  drive_id: string;
  filename: string;
  storage_path: string;
  size: number;
  mime_type: string;
  parent_id: string | null;
  uploaded_by: string;
  uploaded_at: string;
  drives?: { name: string } | null;
};

function toNASFile(f: RawFileRow, versionNumber: number): NASFile {
  return {
    id: f.id,
    drive_id: f.drive_id,
    filename: f.filename,
    storage_path: f.storage_path,
    size: f.size,
    mime_type: f.mime_type,
    parent_id: f.parent_id,
    uploaded_by: f.uploaded_by,
    uploaded_at: f.uploaded_at,
    drive_name: f.drives?.name,
    versionNumber,
  };
}

export default async function FileDetailPage({ params }: Props) {
  const { id, fileId } = await params;
  const { userId } = await auth();

  if (!userId) return notFound();

  const { data: project } = await supabase
    .from("projects")
    .select("id, name")
    .eq("id", id)
    .eq("created_by", userId)
    .single();

  if (!project) return notFound();

  // Verify this file is linked to the project
  const { data: ref } = await supabase
    .from("project_file_refs")
    .select("file_id")
    .eq("project_id", id)
    .eq("file_id", fileId)
    .single();

  if (!ref) return notFound();

  const { data: targetFile } = await supabase
    .from("files")
    .select("*, drives(name)")
    .eq("id", fileId)
    .single() as { data: RawFileRow | null };

  if (!targetFile) return notFound();

  const rootId = targetFile.parent_id ?? targetFile.id;

  let rootRaw: RawFileRow = targetFile;
  if (targetFile.parent_id) {
    const { data } = await supabase
      .from("files")
      .select("*, drives(name)")
      .eq("id", rootId)
      .single() as { data: RawFileRow | null };
    if (!data) return notFound();
    rootRaw = data;
  }

  const { data: childrenRaw } = await supabase
    .from("files")
    .select("*, drives(name)")
    .eq("parent_id", rootId)
    .order("uploaded_at", { ascending: true }) as { data: RawFileRow[] | null };

  const rootNAS = toNASFile(rootRaw, 1);
  const childNAS: NASFile[] = (childrenRaw ?? []).map((c, i) => toNASFile(c, i + 2));
  const versions: NASFile[] = [rootNAS, ...childNAS].sort(
    (a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime()
  );

  return (
    <>
      <Topbar crumbs={["Workspace", "Projects", project.name, rootRaw.filename]} />
      <FileDetailClient file={versions[0]} project={project} versions={versions} />
    </>
  );
}
