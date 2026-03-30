"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { Profile, FriendTag } from "@/lib/types";

type Props = {
  userId: string;
  inviteCode: string;
  friends: Profile[];
  pendingRequests: { friendshipId: string; profile: Profile }[];
  friendsOfFriends: (Profile & { mutualFriends: string[] })[];
  tags: FriendTag[];
};

export function FriendsClient({
  userId,
  inviteCode,
  friends,
  pendingRequests,
  friendsOfFriends,
  tags: initialTags,
}: Props) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [sendingRequest, setSendingRequest] = useState<Set<string>>(new Set());

  // Tags state
  const [tags, setTags] = useState<FriendTag[]>(initialTags);
  const [tagModalFriend, setTagModalFriend] = useState<string | null>(null);
  const [newTagName, setNewTagName] = useState("");
  const [creatingTag, setCreatingTag] = useState(false);
  const [showTagManager, setShowTagManager] = useState(false);

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

  // タグ作成
  const handleCreateTag = async () => {
    const name = newTagName.trim();
    if (!name || tags.length >= 10 || creatingTag) return;
    setCreatingTag(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("friend_tags")
      .insert({ user_id: userId, name })
      .select()
      .single();
    if (data) {
      setTags((prev) => [...prev, { ...data, members: [] }]);
      setNewTagName("");
    }
    setCreatingTag(false);
  };

  // タグ削除
  const handleDeleteTag = async (tagId: string) => {
    const supabase = createClient();
    await supabase.from("friend_tags").delete().eq("id", tagId);
    setTags((prev) => prev.filter((t) => t.id !== tagId));
  };

  // フレンドをタグに追加/削除
  const handleToggleTagMember = async (tagId: string, friendId: string) => {
    const tag = tags.find((t) => t.id === tagId);
    if (!tag) return;
    const isMember = (tag.members ?? []).some((m) => m.friend_user_id === friendId);
    const supabase = createClient();

    if (isMember) {
      await supabase
        .from("friend_tag_members")
        .delete()
        .eq("tag_id", tagId)
        .eq("friend_user_id", friendId);
      setTags((prev) =>
        prev.map((t) =>
          t.id === tagId
            ? { ...t, members: (t.members ?? []).filter((m) => m.friend_user_id !== friendId) }
            : t
        )
      );
    } else {
      await supabase
        .from("friend_tag_members")
        .insert({ tag_id: tagId, friend_user_id: friendId });
      setTags((prev) =>
        prev.map((t) =>
          t.id === tagId
            ? { ...t, members: [...(t.members ?? []), { friend_user_id: friendId }] }
            : t
        )
      );
    }
  };

  // フレンドについているタグ一覧
  const getFriendTags = (friendId: string) =>
    tags.filter((t) => (t.members ?? []).some((m) => m.friend_user_id === friendId));

  const tagModalFriendProfile = friends.find((f) => f.id === tagModalFriend);

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">フレンド</h1>

      {/* Invite Link */}
      <div
        className="p-4 rounded-2xl mb-6 border"
        style={{ borderColor: "var(--color-primary)", background: "#FFF5F0" }}
      >
        <p className="text-sm font-bold mb-2" style={{ color: "var(--color-primary)" }}>
          友達を招待しよう！
        </p>
        <p className="text-xs mb-3" style={{ color: "var(--color-text-sub)" }}>
          下のリンクを友達に送ってnomo!に招待しよう
        </p>
        <button
          onClick={handleCopyInvite}
          className="w-full py-2.5 rounded-xl text-white text-sm font-bold active:scale-[0.98] transition-transform"
          style={{ background: "var(--color-primary)" }}
        >
          {copied ? "コピーしました！ ✓" : "招待リンクをコピー"}
        </button>
      </div>

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-bold mb-3" style={{ color: "var(--color-text-sub)" }}>
            フレンド申請 ({pendingRequests.length})
          </h2>
          <div className="space-y-2">
            {pendingRequests.map(({ friendshipId, profile }) => (
              <div
                key={friendshipId}
                className="flex items-center gap-3 p-3 rounded-xl border border-gray-100"
                style={{ background: "var(--color-card)" }}
              >
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="w-10 h-10 rounded-full" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">😊</div>
                )}
                <span className="flex-1 font-medium text-sm">{profile.display_name}</span>
                <button
                  onClick={() => handleAccept(friendshipId)}
                  className="px-3 py-1.5 rounded-lg text-white text-xs font-bold"
                  style={{ background: "var(--color-available)" }}
                >
                  承認
                </button>
                <button
                  onClick={() => handleReject(friendshipId)}
                  className="px-3 py-1.5 rounded-lg bg-gray-100 text-xs font-medium text-gray-500"
                >
                  拒否
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Friends List */}
      <div className="mb-6">
        <h2 className="text-sm font-bold mb-3" style={{ color: "var(--color-text-sub)" }}>
          フレンド一覧 ({friends.length})
        </h2>
        {friends.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-3xl mb-2">👋</p>
            <p className="text-sm" style={{ color: "var(--color-text-sub)" }}>
              まだフレンドがいません
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--color-text-sub)" }}>
              招待リンクを友達に送ろう！
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {friends.map((friend) => {
              const friendTags = getFriendTags(friend.id);
              return (
                <div
                  key={friend.id}
                  className="flex items-center gap-3 p-3 rounded-xl border border-gray-100"
                  style={{ background: "var(--color-card)" }}
                >
                  {friend.avatar_url ? (
                    <img src={friend.avatar_url} alt="" className="w-10 h-10 rounded-full" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">😊</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-sm block">{friend.display_name}</span>
                    {friendTags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {friendTags.map((tag) => (
                          <span
                            key={tag.id}
                            className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                            style={{ background: "#FFF0EB", color: "var(--color-primary)" }}
                          >
                            {tag.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => setTagModalFriend(friend.id)}
                    className="text-lg px-1 text-gray-400 hover:text-gray-600"
                    title="タグを管理"
                  >
                    🏷️
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Tag Manager */}
      <div className="mb-6">
        <button
          onClick={() => setShowTagManager(!showTagManager)}
          className="flex items-center gap-2 text-sm font-bold w-full mb-3"
          style={{ color: "var(--color-text-sub)" }}
        >
          タグ管理 ({tags.length}/10)
          <span className="text-gray-400 text-xs ml-auto">{showTagManager ? "▲" : "▼"}</span>
        </button>
        {showTagManager && (
          <div
            className="p-4 rounded-2xl border border-gray-100"
            style={{ background: "var(--color-card)" }}
          >
            {tags.length === 0 ? (
              <p className="text-xs text-center py-2" style={{ color: "var(--color-text-sub)" }}>
                タグがまだありません
              </p>
            ) : (
              <div className="flex flex-wrap gap-2 mb-3">
                {tags.map((tag) => (
                  <div
                    key={tag.id}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium"
                    style={{ background: "#FFF0EB", color: "var(--color-primary)" }}
                  >
                    <span>{tag.name}</span>
                    <span className="text-[10px] opacity-60">
                      {(tag.members ?? []).length}人
                    </span>
                    <button
                      onClick={() => handleDeleteTag(tag.id)}
                      className="ml-1 opacity-50 hover:opacity-100 text-xs"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
            {tags.length < 10 && (
              <div className="flex gap-2">
                <input
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreateTag()}
                  placeholder="タグ名（例：親友、大学、会社）"
                  maxLength={20}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[var(--color-primary)]"
                />
                <button
                  onClick={handleCreateTag}
                  disabled={!newTagName.trim() || creatingTag}
                  className="px-4 py-2 rounded-xl text-white text-sm font-bold disabled:opacity-40"
                  style={{ background: "var(--color-primary)" }}
                >
                  追加
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Friends of Friends (知り合いかも) */}
      {friendsOfFriends.length > 0 && (
        <div>
          <h2 className="text-sm font-bold mb-3" style={{ color: "var(--color-text-sub)" }}>
            知り合いかも？
          </h2>
          <div className="space-y-2">
            {friendsOfFriends.map((fof) => (
              <div
                key={fof.id}
                className="flex items-center gap-3 p-3 rounded-xl border border-gray-100"
                style={{ background: "var(--color-card)" }}
              >
                {fof.avatar_url ? (
                  <img src={fof.avatar_url} alt="" className="w-10 h-10 rounded-full" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">😊</div>
                )}
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-sm block">{fof.display_name}</span>
                  <span className="text-[10px]" style={{ color: "var(--color-text-sub)" }}>
                    {fof.mutualFriends.join("、")} と友達
                  </span>
                </div>
                {sendingRequest.has(fof.id) ? (
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
            ))}
          </div>
        </div>
      )}

      {/* Tag Assignment Modal */}
      {tagModalFriend && tagModalFriendProfile && (
        <div
          className="fixed inset-0 bg-black/50 flex items-end z-50"
          onClick={() => setTagModalFriend(null)}
        >
          <div
            className="bg-white w-full rounded-t-2xl p-5 max-h-[70vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              {tagModalFriendProfile.avatar_url ? (
                <img src={tagModalFriendProfile.avatar_url} alt="" className="w-9 h-9 rounded-full" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center">😊</div>
              )}
              <h3 className="font-bold text-base">{tagModalFriendProfile.display_name} のタグ</h3>
            </div>

            {tags.length === 0 ? (
              <p className="text-sm text-center py-4" style={{ color: "var(--color-text-sub)" }}>
                タグがまだありません。タグ管理から作成してください。
              </p>
            ) : (
              <div className="space-y-1 mb-4">
                {tags.map((tag) => {
                  const isMember = (tag.members ?? []).some(
                    (m) => m.friend_user_id === tagModalFriend
                  );
                  return (
                    <button
                      key={tag.id}
                      onClick={() => handleToggleTagMember(tag.id, tagModalFriend)}
                      className="w-full flex items-center gap-3 py-3 px-2 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors"
                    >
                      <span
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all ${
                          isMember
                            ? "text-white border-transparent"
                            : "border-gray-300 bg-white"
                        }`}
                        style={isMember ? { background: "var(--color-primary)", borderColor: "var(--color-primary)" } : {}}
                      >
                        {isMember && "✓"}
                      </span>
                      <span className="flex-1 text-sm font-medium text-left">{tag.name}</span>
                      <span className="text-xs" style={{ color: "var(--color-text-sub)" }}>
                        {(tag.members ?? []).length}人
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* 新しいタグを作成 */}
            {tags.length < 10 && (
              <div className="flex gap-2 mb-3 pt-2 border-t border-gray-100">
                <input
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreateTag()}
                  placeholder="新しいタグ名"
                  maxLength={20}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[var(--color-primary)]"
                />
                <button
                  onClick={handleCreateTag}
                  disabled={!newTagName.trim() || creatingTag}
                  className="px-4 py-2 rounded-xl text-white text-sm font-bold disabled:opacity-40"
                  style={{ background: "var(--color-primary)" }}
                >
                  作成
                </button>
              </div>
            )}

            <button
              onClick={() => setTagModalFriend(null)}
              className="w-full py-3 text-sm font-medium text-gray-500 rounded-xl bg-gray-100"
            >
              閉じる
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
