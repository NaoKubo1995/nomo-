"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { Availability, Profile } from "@/lib/types";
import { CalendarPicker } from "@/components/calendar-picker";

type Props = {
  userId: string;
  profile: Profile | null;
  availabilities: (Availability & { profile: Profile })[];
};

export function FeedClient({ userId, profile, availabilities }: Props) {
  const router = useRouter();
  const [showCalendar, setShowCalendar] = useState(false);

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
    const dayAfter = new Date(today);
    dayAfter.setDate(dayAfter.getDate() + 2);
    if (d.toDateString() === dayAfter.toDateString()) return "明後日";
    return d.toLocaleDateString("ja-JP", { month: "short", day: "numeric" });
  };

  const myAvailabilities = availabilities.filter((a) => a.user_id === userId);

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
          {myAvailabilities.length > 0 ? "📅 空き時間を編集" : "📅 空いてる時間を選ぶ"}
        </button>
      ) : (
        <CalendarPicker
          userId={userId}
          onClose={() => setShowCalendar(false)}
          onSaved={() => {
            setShowCalendar(false);
            router.refresh();
          }}
          existingAvailabilities={availabilities}
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
              「空いてる時間を選ぶ」を押して最初の一人になろう
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
