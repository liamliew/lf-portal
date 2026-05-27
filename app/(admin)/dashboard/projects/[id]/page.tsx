import { notFound } from "next/navigation";
import { Topbar } from "@/components/topbar";
import { Icon } from "@/components/icon";
import { getFilesForProject } from "@/app/actions/files";
import { getShares } from "@/app/actions/shares";
import { getActiveDrives } from "@/lib/drives";
import { supabase } from "@/lib/supabase";
import { auth } from "@clerk/nextjs/server";
import { ProjectDetailClient } from "./project-detail-client";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ProjectPage({ params }: Props) {
  const { id } = await params;
  const { userId } = await auth();

  if (!userId) return notFound();

  const { data: project, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .eq("created_by", userId)
    .single();

  if (error || !project) return notFound();

  const [fileGroups, shareLinks, drives] = await Promise.all([
    getFilesForProject(id).catch(() => []),
    getShares(id).catch(() => []),
    getActiveDrives().catch(() => []),
  ]);

  return (
    <>
      <Topbar crumbs={["Workspace", "Projects", project.name]} />
      <div className="content">
        <div className="content-narrow">
          <div className="proj-hd">
            <div
              className="proj-hd-cover"
              style={{ background: `linear-gradient(135deg, #333 0%, #111 100%)` }}
            />
            <div className="proj-hd-info">
              <div className="proj-hd-code mono">
                <span>PROJ</span>
                <span>·</span>
                <span className="chip chip-active">
                  <span className="chip-dot" />
                  Active
                </span>
              </div>
              <h1 className="proj-hd-name">{project.name}</h1>
              <div className="proj-hd-meta">
                <div><span className="mono faint">CREATED</span><b>{new Date(project.created_at).toLocaleDateString()}</b></div>
                {project.description && (
                  <div><span className="mono faint">DESC</span><b>{project.description}</b></div>
                )}
              </div>
            </div>
            <div className="proj-hd-actions">
              <button className="btn btn-secondary">
                <Icon name="settings" size={14} /><span>Project settings</span>
              </button>
            </div>
          </div>

          <ProjectDetailClient
            project={project}
            fileGroups={fileGroups}
            shareLinks={shareLinks}
            drives={drives}
          />
        </div>
      </div>
    </>
  );
}
