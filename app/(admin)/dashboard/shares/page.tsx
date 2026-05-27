import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { Topbar } from "@/components/topbar";
import { supabase } from "@/lib/supabase";
import { AllSharesClient } from "./shares-client";

export default async function AllSharesPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { data: shares } = await supabase
    .from("project_shares")
    .select("*, projects!inner(id, name, created_by)")
    .eq("projects.created_by", userId)
    .order("created_at", { ascending: false });

  return (
    <>
      <Topbar crumbs={["Share links"]} />
      <div className="content">
        <div className="content-narrow">
          <AllSharesClient shares={shares ?? []} />
        </div>
      </div>
    </>
  );
}
