"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { Availability, Profile } from "@/lib/types";

type Props = {
  userId: string;
  profile: Profile | null;
  availabilities: (Availability & { profile: Profile })[];
};

export function FeedClient({ userId, profile, availabilities }: Props) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState("");
  const [hours, setHours] = useState(2);
  const [submitting, setSubmitting] = useState(false);

  const handleQuickAvailable = async () => {
    const supabase = createClient();
    const start = new Date();
    const end = new Date(start.getTime() + hours * 60 * 60 * 1000);

    setSubmitting(true);
    await supabase.from("availabilities").insert({
      user_id: userId,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      message: message || "ヒマです！",
    });
    setSubmitting(false);
    setShowForm(false);
    setMessage("");
    router.refresh();
  };

  const handleDelete = async (id: string) => {
    const supabase = createClient();
    await supabase.from("availabilities").delete().eq("id", id);
    router.refresh();
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
    return d.toLocaleDateString("ja-JP", { month: "short", day: "numeric" });
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "var(--color-primary)" }}>
          nomo!
        </h1>
        <span className="text-sm" style={{ color: "var(--color-text-sub)" }}>
          {profile?.display_name}
        </span>
      </div>

      {/* Quick Action */}
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="w-full py-4 rounded-2xl text-white font-bold text-lg shadow-lg active:scale-[0.98] transition-transform"
          style={{ background: "var(--color-available)" }}
        >
          🙋 今ヒマ！
        </button>
      ) : (
        <div
          className="p-4 rounded-2xl border-2 mb-2"
          style={{ borderColor: "var(--color-available)", background: "var(--color-card)" }}
        >
          <input
            type="text"
            placeholder="何したい？（例：飲みたい！映画見たい）"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm mb-3 focus:outline-none focus:border-[var(--color-primary)]"
          />
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm" style={{ color: "var(--color-text-sub)" }}>
              空き時間:
            </span>
            {[1, 2, 3, 4].map((h) => (
              <button
                key={h}
                onClick={() => setHours(h)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  hours === h
                    ? "text-white"
                    : "bg-gray-100 text-gray-600"
                }`}
                style={hours === h ? { background: "var(--color-available)" } : {}}
              >
                {h}h
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowForm(false)}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium"
            >
              キャンセル
            </button>
            <button
              onClick={handleQuickAvailable}
              disabled={submitting}
              className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-50"
              style={{ background: "var(--color-available)" }}
            >
              {submitting ? "..." : "シェアする"}
            </button>
          </div>
        </div>
      )}

      {/* Feed */}
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
              「今ヒマ！」を押して最初の一人になろう
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {availabilities.map((av) => (
              <div
                key={av.id}
                className="p-4 rounded-2xl border border-gray-100 shadow-sm"
                style={{ background: "var(--color-card)" }}
              >
                <div className="flex items-start gap-3">
                  {av.profile?.avatar_url ? (
                    <img
                      src={av.profile.avatar_url}
                      alt=""
                      className="w-10 h-10 rounded-full"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-lg">
                      😊
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm">
                        {av.profile?.display_name}
                      </span>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full text-white"
                        style={{ background: "var(--color-available)" }}
                      >
                        ヒマ！
                      </span>
                    </div>
                    <p className="text-sm mt-1">{av.message || "ヒマです！"}</p>
                    <p
                      className="text-xs mt-1"
                      style={{ color: "var(--color-text-sub)" }}
                    >
                      {formatDate(av.start_time)} {formatTime(av.start_time)} 〜{" "}
                      {formatTime(av.end_time)}
                    </p>
                  </div>
                  {av.user_id === userId && (
                    <button
                      onClick={() => handleDelete(av.id)}
                      className="text-gray-400 hover:text-red-500 text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
