"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { Availability, Profile, Reaction, Comment } from "@/lib/types";
import { CalendarPicker } from "@/components/calendar-picker";

type Props = {
  userId: string;
  profile: Profile | null;
  availabilities: (Availability & { profile: Profile; reactions: Reaction[]; comments: Comment[] })[];
};

export function FeedClient({ userId, profile, availabilities }: Props) {
  const router = useRouter();
  const [showCalendar, setShowCalendar] = useState(false);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [openComments, setOpenComments] = useState<Set<string>>(new Set());

  const handleDelete = async (id: string) => {
    const supabase = createClient();
    await supabase.from("availabilities").delete().eq("id", id);
    router.refresh();
  };

  const handleReaction = async (availabilityId: string, type: "like" | "interested") => {
    const supabase = createClient();
    const existing = availabilities
      .find((a) => a.id === availabilityId)
      ?.reactions?.find((r) => r.user_id === userId && r.type === type);

    if (existing) {
      await supabase.from("reactions").delete().eq("id", existing.id);
    } else {
      await supabase.from("reactions").insert({
        availability_id: availabilityId,
        user_id: userId,
        type,
      });
    }
    router.refresh();
  };

  const handleComment = async (availabilityId: string) => {
    const text = commentInputs[availabilityId]?.trim();
    if (!text) return;
    const supabase = createClient();
    await supabase.from("comments").insert({
      availability_id: availabilityId,
      user_id: userId,
      text,
    });
    setCommentInputs((prev) => ({ ...prev, [availabilityId]: "" }));
    router.refresh();
  };

  const handleDeleteComment = async (commentId: string) => {
    const supabase = createClient();
    await supabase.from("comments").delete().eq("id", commentId);
    router.refresh();
  };

  const toggleComments = (id: string) => {
    setOpenComments((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return "今日";
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (d.toDateString() === tomorrow.toDateString()) return "明日";
    const dayAfter = new Date(today);
    dayAfter.setDate(dayAfter.getDate() + 2);
    if (d.toDateString() === dayAfter.toDateString()) return "明後日";
    return d.toLocaleDateString("ja-JP", { month: "short", day: "numeric" });
  };

  const formatCommentTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diffMin = Math.floor((now.getTime() - d.getTime()) / 60000);
    if (diffMin < 1) return "たった今";
    if (diffMin < 60) return `${diffMin}分前`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour}時間前`;
    return `${Math.floor(diffHour / 24)}日前`;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "var(--color-primary)" }}>
          nomo!
        </h1>
        <span className="text-sm" style={{ color: "var(--color-text-sub)" }}>
          {profile?.display_name}
        </span>
      </div>

      {!showCalendar ? (
        <button
          onClick={() => setShowCalendar(true)}
          className="w-full py-4 rounded-2xl text-white font-bold text-lg shadow-lg active:scale-[0.98] transition-transform"
          style={{ background: "var(--color-available)" }}
        >
          📅 ヒマな時間をシェアする
        </button>
      ) : (
        <CalendarPicker
          userId={userId}
          onClose={() => setShowCalendar(false)}
          onSaved={() => {
            setShowCalendar(false);
            router.refresh();
          }}
          existingAvailabilities={[]}
        />
      )}

      <div className="mt-6">
        <h2 className="text-sm font-bold mb-3" style={{ color: "var(--color-text-sub)" }}>
          みんなの空き状況
        </h2>

        {availabilities.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">🍻</p>
            <p className="text-sm" style={{ color: "var(--color-text-sub)" }}>
              まだ誰もヒマを出していません
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--color-text-sub)" }}>
              「ヒマな時間をシェアする」を押して最初の一人になろう
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {availabilities.map((av) => {
              const likes = (av.reactions ?? []).filter((r) => r.type === "like");
              const interests = (av.reactions ?? []).filter((r) => r.type === "interested");
              const comments = av.comments ?? [];
              const hasLiked = likes.some((r) => r.user_id === userId);
              const hasInterested = interests.some((r) => r.user_id === userId);
              const isCommentsOpen = openComments.has(av.id);

              return (
                <div
                  key={av.id}
                  className="rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
                  style={{ background: "var(--color-card)" }}
                >
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      {av.profile?.avatar_url ? (
                        <img src={av.profile.avatar_url} alt="" className="w-10 h-10 rounded-full" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-lg">😊</div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm">{av.profile?.display_name}</span>
                          <span className="text-xs px-2 py-0.5 rounded-full text-white" style={{ background: "var(--color-available)" }}>
                            ヒマ！
                          </span>
                        </div>
                        <p className="text-sm mt-1">{av.message || "ヒマです！"}</p>
                        <p className="text-xs mt-1" style={{ color: "var(--color-text-sub)" }}>
                          {formatDate(av.start_time)} {formatTime(av.start_time)} 〜 {formatTime(av.end_time)}
                        </p>
                      </div>
                      {av.user_id === userId && (
                        <button onClick={() => handleDelete(av.id)} className="text-gray-400 hover:text-red-500 text-xs">✕</button>
                      )}
                    </div>
                  </div>

                  <div className="px-4 pb-3 flex items-center gap-2">
                    <button
                      onClick={() => handleReaction(av.id, "like")}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                        hasLiked ? "border-red-200 bg-red-50 text-red-500" : "border-gray-200 text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      {hasLiked ? "❤️" : "🤍"} {likes.length > 0 && likes.length}
                    </button>
                    <button
                      onClick={() => handleReaction(av.id, "interested")}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                        hasInterested ? "border-yellow-200 bg-yellow-50 text-yellow-600" : "border-gray-200 text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      🙋 興味あり{interests.length > 0 && ` ${interests.length}`}
                    </button>
                    <button
                      onClick={() => toggleComments(av.id)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border border-gray-200 text-gray-500 hover:bg-gray-50"
                    >
                      💬 {comments.length > 0 && comments.length}
                    </button>
                  </div>

                  {(likes.length > 0 || interests.length > 0) && (
                    <div className="px-4 pb-2">
                      {likes.length > 0 && (
                        <p className="text-[11px]" style={{ color: "var(--color-text-sub)" }}>
                          ❤️ {likes.map((r) => r.profile?.display_name).join("、")}
                        </p>
                      )}
                      {interests.length > 0 && (
                        <p className="text-[11px]" style={{ color: "var(--color-text-sub)" }}>
                          🙋 {interests.map((r) => r.profile?.display_name).join("、")} が興味あり
                        </p>
                      )}
                    </div>
                  )}

                  {isCommentsOpen && (
                    <div className="border-t border-gray-100">
                      {comments.length > 0 && (
                        <div className="px-4 py-2 space-y-2">
                          {comments.map((c) => (
                            <div key={c.id} className="flex items-start gap-2">
                              {c.profile?.avatar_url ? (
                                <img src={c.profile.avatar_url} alt="" className="w-6 h-6 rounded-full mt-0.5" referrerPolicy="no-referrer" />
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs mt-0.5">😊</div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-baseline gap-2">
                                  <span className="text-xs font-bold">{c.profile?.display_name}</span>
                                  <span className="text-[10px]" style={{ color: "var(--color-text-sub)" }}>{formatCommentTime(c.created_at)}</span>
                                </div>
                                <p className="text-xs mt-0.5">{c.text}</p>
                              </div>
                              {c.user_id === userId && (
                                <button onClick={() => handleDeleteComment(c.id)} className="text-gray-300 hover:text-red-400 text-[10px]">✕</button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="px-4 py-2 flex gap-2">
                        <input
                          type="text"
                          placeholder="コメントを書く..."
                          value={commentInputs[av.id] || ""}
                          onChange={(e) => setCommentInputs((prev) => ({ ...prev, [av.id]: e.target.value }))}
                          onKeyDown={(e) => { if (e.key === "Enter") handleComment(av.id); }}
                          className="flex-1 px-3 py-1.5 border border-gray-200 rounded-full text-xs focus:outline-none focus:border-[var(--color-primary)]"
                        />
                        <button
                          onClick={() => handleComment(av.id)}
                          disabled={!commentInputs[av.id]?.trim()}
                          className="px-3 py-1.5 rounded-full text-white text-xs font-bold disabled:opacity-30"
                          style={{ background: "var(--color-primary)" }}
                        >
                          送信
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
