import { validateShare } from "@/app/actions/shares";
import { supabase } from "@/lib/supabase";
import { clerkClient } from "@clerk/nextjs/server";
import { ShareClient } from "./share-client";

interface Props {
  params: Promise<{ token: string }>;
}

export default async function SharePage({ params }: Props) {
  const { token } = await params;

  // Find share by token
  const { data: share, error: shareError } = await supabase
    .from('project_shares')
    .select('*')
    .eq('token', token)
    .single();

  if (shareError || !share) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <h2>Link not found</h2>
      </div>
    );
  }

  // Check expiry
  if (share.expires_at && new Date(share.expires_at) < new Date()) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <h2>This link has expired</h2>
      </div>
    );
  }

  const requiresPassword = !!share.password_hash;
  const requiresPin = !!share.pin;

  // Resolve project owner display name
  const { data: projectRow } = await supabase
    .from("projects")
    .select("created_by")
    .eq("id", share.project_id)
    .single();

  let createdByName = projectRow?.created_by ?? "";
  if (createdByName) {
    try {
      const clerk = await clerkClient();
      const user = await clerk.users.getUser(createdByName);
      createdByName = user.fullName ?? user.username ?? createdByName;
    } catch {
      // Fall back to raw userId
    }
  }

  type ShareData = {
    project: { name: string; created_by: string };
    files: Record<string, { id: string; filename: string; mime_type?: string; version: number; size: number; uploaded_at: string }[]>;
  };
  let initialData: ShareData | null = null;
  if (!requiresPassword && !requiresPin) {
    try {
      initialData = (await validateShare(token)) as ShareData;
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <ShareClient
      token={token}
      initialData={initialData}
      requiresPassword={requiresPassword}
      requiresPin={requiresPin}
      createdByName={createdByName}
    />
  );
}
