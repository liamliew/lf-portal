import type { Metadata } from "next";
import { Topbar } from "@/components/topbar";
import { getProjects } from "@/app/actions/projects";
import { ProjectsClient } from "./projects-client";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Projects — LF Creative" };

const PAGE_SIZE = 20;

export default async function ProjectsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { projects, total } = await getProjects({ limit: PAGE_SIZE });

  return (
    <>
      <Topbar crumbs={["Projects"]} />
      <div className="content">
        <div className="content-narrow">
          <ProjectsClient initialProjects={projects} total={total} pageSize={PAGE_SIZE} />
        </div>
      </div>
    </>
  );
}
