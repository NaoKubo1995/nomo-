"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { Profile } from "@/lib/types";

type Props = {
  userId: string;
  inviteCode: string;
  friends: Profile[];
  pendingRequests: { friendshipId: string; profile: Profile }[];
  friendsOfFriends: (Profile & { mutualFriends: string[] })[];
};

export function FriendsClient({
  userId,
  inviteCode,
  friends,
  pendingRequests,
  friendsOfFriends,
}: Props) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [sendingRequest, setSendingRequest] = useState<Set<string>>(new Set());
  const [viewingFriend, setViewingFriend] = useState<Profile | null>(null);
  const [friendOfFriendList, setFriendOfFriendList] = useState<Profile[]>([]);
  const [loadingFof, setLoadingFof] = useState(false);

  const inviteUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/invite/${inviteCode}`
      : "";

  const handleCopyInvite = async () => {
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAccept = async (friendshipId: string) => {
    const supabase = createClient();
    await supabase
      .from("friendships")
      .update({ status: "accepted" })
      .eq("id", friendshipId);
    router.refresh();
  };

  const handleReject = async (friendshipId: string) => {
    const supabase = createClient();
    await supabase.from("friendships").delete().eq("id", friendshipId);
    router.refresh();
  };

  const handleSendFriendRequest = async (targetUserId: string) => {
    setSendingRequest((prev) => new Set(prev).add(targetUserId));
    const supabase = createClient();
    await supabase.from("friendships").insert({
      requester_id: userId,
      addressee_id: targetUserId,
    });
    router.refresh();
  };

  const handleViewFriendsFriends = async (friend: Profile) => {
    setViewingFriend(friend);
    setLoadingFof(true);
    const supabase = createClient();

    const { data: fships } = await supabase
      .from("friendships")
      .select("requester_id, addressee_id")
      .or(`requester_id.eq.${friend.id},addressee_id.eq.${friend.id}`)
      .eq("status", "accepted");

    const fofIds = (fships ?? [])
      .map((f) => (f.requester_id === friend.id ? f.addressee_id : f.requester_id))
      .filter((id) => id !== userId);

    if (fofIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .in("id", fofIds);
      setFriendOfFriendList(profiles ?? []);
    } else {
      setFriendOfFriendList([]);
    }
    setLoadingFof(false);
  };

  const friendIds = friends.map((f) => f.id);
  const allSentIds = new Set([...sendingRequest]);

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">フレンド</h1>

      {/* フレンドのフレンド一覧モーダル */}
      {viewingFriend && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center">
          <div className="bg-white w-full max-w-md rounded-t-2xl max-h-[70vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-4 py-3 border-b flex items-center justify-between">
              <div>
                <p className="font-bold text-sm">{viewingFriend.display_name} のフレンド</p>
                <p className="text-[10px]" style={{ color: "var(--color-text-sub)" }}>{friendOfFriendList.length}人</p>
              </div>
              <button onClick={() => setViewingFriend(null)} className="text-gray-400 text-lg">✕</button>
            </div>
            <div className="px-4 py-3 space-y-2">
              {loadingFof ? (
                <p className="text-center py-8 text-sm" style={{ color: "var(--color-text-sub)" }}>読み込み中...</p>
              ) : friendOfFriendList.length === 0 ? (
                <p className="text-center py-8 text-sm" style={{ color: "var(--color-text-sub)" }}>フレンドがいません</p>
              ) : (
                friendOfFriendList.map((fof) => {
                  const isFriend = friendIds.includes(fof.id);
                  const isPending = allSentIds.has(fof.id);
                  return (
                    <div key={fof.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100">
                      {fof.avatar_url ? (
                        <img src={fof.avatar_url} alt="" className="w-10 h-10 rounded-full" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">😊</div>
                      )}
                      <span className="flex-1 font-medium text-sm">{fof.display_name}</span>
                      {isFriend ? (
                        <span className="text-xs text-gray-400">フレンド</span>
                      ) : isPending ? (
                        <span className="text-xs text-gray-400">申請済み</span>
                      ) : (
                        <button
                          onClick={() => handleSendFriendRequest(fof.id)}
                          className="px-3 py-1.5 rounded-lg text-white text-xs font-bold"
                          style={{ background: "var(--color-primary)" }}
                        >
                          フレンド申請
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* 招待リンク */}
      <div className="p-4 rounded-2xl mb-6 border" style={{ borderColor: "var(--color-primary)", background: "#FFF5F0" }}>
        <p className="text-sm font-bold mb-2" style={{ color: "var(--color-primary)" }}>友達を招待しよう！</p>
        <p className="text-xs mb-3" style={{ color: "var(--color-text-sub)" }}>下のリンクを友達に送ってnomo!に招待しよう</p>
        <button onClick={handleCopyInvite} className="w-full py-2.5 rounded-xl text-white text-sm font-bold active:scale-[0.98] transition-transform" style={{ background: "var(--color-primary)" }}>
          {copied ? "コピーしました！ ✓" : "招待リンクをコピー"}
        </button>
      </div>

      {/* フレンド申請 */}
      {pendingRequests.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-bold mb-3" style={{ color: "var(--color-text-sub)" }}>フレンド申請 ({pendingRequests.length})</h2>
          <div className="space-y-2">
            {pendingRequests.map(({ friendshipId, profile }) => (
              <div key={friendshipId} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100" style={{ background: "var(--color-card)" }}>
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="w-10 h-10 rounded-full" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">😊</div>
                )}
                <span className="flex-1 font-medium text-sm">{profile.display_name}</span>
                <button onClick={() => handleAccept(friendshipId)} className="px-3 py-1.5 rounded-lg text-white text-xs font-bold" style={{ background: "var(--color-available)" }}>承認</button>
                <button onClick={() => handleReject(friendshipId)} className="px-3 py-1.5 rounded-lg bg-gray-100 text-xs font-medium text-gray-500">拒否</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* フレンド一覧 */}
      <div className="mb-6">
        <h2 className="text-sm font-bold mb-3" style={{ color: "var(--color-text-sub)" }}>フレンド一覧 ({friends.length})</h2>
        {friends.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-3xl mb-2">👋</p>
            <p className="text-sm" style={{ color: "var(--color-text-sub)" }}>まだフレンドがいません</p>
            <p className="text-xs mt-1" style={{ color: "var(--color-text-sub)" }}>招待リンクを友達に送ろう！</p>
          </div>
        ) : (
          <div className="space-y-2">
            {friends.map((friend) => (
              <div key={friend.id} onClick={() => handleViewFriendsFriends(friend)}
                className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 cursor-pointer active:bg-gray-50 transition-colors" style={{ background: "var(--color-card)" }}>
                {friend.avatar_url ? (
                  <img src={friend.avatar_url} alt="" className="w-10 h-10 rounded-full" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">😊</div>
                )}
                <div className="flex-1">
                  <span className="font-medium text-sm">{friend.display_name}</span>
                </div>
                <span className="text-gray-300 text-sm">›</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 知り合いかも */}
      {friendsOfFriends.length > 0 && (
        <div>
          <h2 className="text-sm font-bold mb-3" style={{ color: "var(--color-text-sub)" }}>知り合いかも？</h2>
          <div className="space-y-2">
            {friendsOfFriends.map((fof) => (
              <div key={fof.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100" style={{ background: "var(--color-card)" }}>
                {fof.avatar_url ? (
                  <img src={fof.avatar_url} alt="" className="w-10 h-10 rounded-full" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">😊</div>
                )}
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-sm block">{fof.display_name}</span>
                  <span className="text-[10px]" style={{ color: "var(--color-text-sub)" }}>{fof.mutualFriends.join("、")} と友達</span>
                </div>
                {sendingRequest.has(fof.id) ? (
                  <span className="text-xs text-gray-400">申請済み</span>
                ) : (
                  <button onClick={() => handleSendFriendRequest(fof.id)} className="px-3 py-1.5 rounded-lg text-white text-xs font-bold" style={{ background: "var(--color-primary)" }}>フレンド申請</button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
