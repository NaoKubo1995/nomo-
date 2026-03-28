import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { InviteClient } from "./invite-client";

type Props = {
  params: Promise<{ code: string }>;
};

export default async function InvitePage({ params }: Props) {
  const { code } = await params;
  const supabase = await createClient();

  // Look up who owns this invite code
  const { data: inviter } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url")
    .eq("invite_code", code)
    .single();

  if (!inviter) {
    return (
      <div className="flex flex-col items-center justify-center min-h-dvh px-6">
        <p className="text-4xl mb-4">😢</p>
        <p className="text-lg font-bold">無効な招待リンクです</p>
      </div>
    );
  }

  // Check if current user is logged in
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    // Already logged in — auto-send friend request if not already friends
    if (user.id !== inviter.id) {
      const { data: existing } = await supabase
        .from("friendships")
        .select("id")
        .or(
          `and(requester_id.eq.${user.id},addressee_id.eq.${inviter.id}),and(requester_id.eq.${inviter.id},addressee_id.eq.${user.id})`
        )
        .maybeSingle();

      if (!existing) {
        await supabase.from("friendships").insert({
          requester_id: user.id,
          addressee_id: inviter.id,
          status: "accepted", // Auto-accept invite links
        });
      }
    }
    redirect("/");
  }

  return <InviteClient inviter={inviter} code={code} />;
}
