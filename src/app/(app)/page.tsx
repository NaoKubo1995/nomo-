import { createClient } from "@/lib/supabase/server";
import { FeedClient } from "./feed-client";

export default async function HomePage() {
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

  const { data: friendships } = await supabase
    .from("friendships")
    .select("requester_id, addressee_id")
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
    .eq("status", "accepted");

  const friendIds = (friendships ?? []).map((f) =>
    f.requester_id === user.id ? f.addressee_id : f.requester_id
  );

  const now = new Date().toISOString();
  const allIds = [user.id, ...friendIds];

  let availabilities: any[] = [];
  if (allIds.length > 0) {
    const { data } = await supabase
      .from("availabilities")
      .select("*, profile:profiles(*), reactions(*, profile:profiles(*)), comments(*, profile:profiles(*))")
      .in("user_id", allIds)
      .gte("end_time", now)
      .order("start_time", { ascending: true });
    availabilities = data ?? [];
  }

  return (
    <FeedClient
      userId={user.id}
      profile={profile}
      availabilities={availabilities}
    />
  );
}
