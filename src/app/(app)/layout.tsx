import { createClient } from "@/lib/supabase/server";
import { BottomNav } from "@/components/bottom-nav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let unreadCount = 0;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("last_seen_feed_at")
      .eq("id", user.id)
      .single();

    const lastSeen = profile?.last_seen_feed_at ?? new Date(0).toISOString();

    const { data: myAvails } = await supabase
      .from("availabilities")
      .select("id")
      .eq("user_id", user.id);

    const myAvailIds = (myAvails ?? []).map((a: { id: string }) => a.id);

    let reactionCount = 0;
    let commentCount = 0;

    if (myAvailIds.length > 0) {
      const { count: rc } = await supabase
        .from("reactions")
        .select("id", { count: "exact", head: true })
        .in("availability_id", myAvailIds)
        .neq("user_id", user.id)
        .gt("created_at", lastSeen);
      reactionCount = rc ?? 0;

      const { count: cc } = await supabase
        .from("comments")
        .select("id", { count: "exact", head: true })
        .in("availability_id", myAvailIds)
        .neq("user_id", user.id)
        .gt("created_at", lastSeen);
      commentCount = cc ?? 0;
    }

    const { data: friendships } = await supabase
      .from("friendships")
      .select("requester_id, addressee_id")
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
      .eq("status", "accepted");

    const friendIds = (friendships ?? []).map((f: { requester_id: string; addressee_id: string }) =>
      f.requester_id === user.id ? f.addressee_id : f.requester_id
    );

    let newAvailCount = 0;
    if (friendIds.length > 0) {
      const { count: ac } = await supabase
        .from("availabilities")
        .select("id", { count: "exact", head: true })
        .in("user_id", friendIds)
        .gt("created_at", lastSeen);
      newAvailCount = ac ?? 0;
    }

    unreadCount = reactionCount + commentCount + newAvailCount;
  }

  return (
    <>
      <main className="pb-20 pt-4 px-4">{children}</main>
      <BottomNav unreadCount={unreadCount} />
    </>
  );
}
