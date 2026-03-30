import { createClient } from "@/lib/supabase/server";
import { FriendsClient } from "./friends-client";

export default async function FriendsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

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

  const friendIds = friends.map((f: any) => f.id);

  const { data: pendingRaw } = await supabase
    .from("friendships")
    .select("*, requester:profiles!friendships_requester_id_fkey(*)")
    .eq("addressee_id", user.id)
    .eq("status", "pending");

  const pendingRequests = (pendingRaw ?? []).map((f: any) => ({
    friendshipId: f.id,
    profile: f.requester,
  }));

  const { data: sentPendingRaw } = await supabase
    .from("friendships")
    .select("addressee_id")
    .eq("requester_id", user.id)
    .eq("status", "pending");

  const sentPendingIds = (sentPendingRaw ?? []).map((f: any) => f.addressee_id);

  let friendsOfFriends: any[] = [];
  if (friendIds.length > 0) {
    const { data: fofRaw } = await supabase
      .from("friendships")
      .select(
        "*, requester:profiles!friendships_requester_id_fkey(*), addressee:profiles!friendships_addressee_id_fkey(*)"
      )
      .or(
        friendIds.map((id: string) => `requester_id.eq.${id},addressee_id.eq.${id}`).join(",")
      )
      .eq("status", "accepted");

    const fofMap = new Map<string, { profile: any; mutualFriends: string[] }>();

    (fofRaw ?? []).forEach((f: any) => {
      const friendId = friendIds.includes(f.requester_id) ? f.requester_id : f.addressee_id;
      const friendName = friends.find((fr: any) => fr.id === friendId)?.display_name || "";
      const otherProfile = f.requester_id === friendId ? f.addressee : f.requester;
      const otherId = otherProfile.id;

      if (otherId === user.id || friendIds.includes(otherId) || sentPendingIds.includes(otherId)) return;

      if (fofMap.has(otherId)) {
        fofMap.get(otherId)!.mutualFriends.push(friendName);
      } else {
        fofMap.set(otherId, { profile: otherProfile, mutualFriends: [friendName] });
      }
    });

    friendsOfFriends = Array.from(fofMap.values()).map((v) => ({
      ...v.profile,
      mutualFriends: v.mutualFriends,
    }));
  }

  return (
    <FriendsClient
      userId={user.id}
      inviteCode={profile?.invite_code ?? ""}
      friends={friends}
      pendingRequests={pendingRequests}
      friendsOfFriends={friendsOfFriends}
    />
  );
}
