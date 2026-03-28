import { createClient } from "@/lib/supabase/server";
import { FriendsClient } from "./friends-client";

export default async function FriendsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Get user's profile for invite code
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // Get accepted friendships with profiles
  const { data: acceptedRaw } = await supabase
    .from("friendships")
    .select(
      "*, requester:profiles!friendships_requester_id_fkey(*), addressee:profiles!friendships_addressee_id_fkey(*)"
    )
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
    .eq("status", "accepted");

  const friends = (acceptedRaw ?? []).map((f: any) =>
    f.requester_id === user.id ? f.addressee : f.requester
  );

  // Get pending requests TO this user
  const { data: pendingRaw } = await supabase
    .from("friendships")
    .select("*, requester:profiles!friendships_requester_id_fkey(*)")
    .eq("addressee_id", user.id)
    .eq("status", "pending");

  const pendingRequests = (pendingRaw ?? []).map((f: any) => ({
    friendshipId: f.id,
    profile: f.requester,
  }));

  return (
    <FriendsClient
      userId={user.id}
      inviteCode={profile?.invite_code ?? ""}
      friends={friends}
      pendingRequests={pendingRequests}
    />
  );
}
