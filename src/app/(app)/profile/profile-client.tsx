"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { Profile } from "@/lib/types";

type Props = {
  profile: Profile | null;
  email: string;
};

export function ProfileClient({ profile, email }: Props) {
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <div>
      <h1 className="text-xl font-bold mb-6">マイページ</h1>

      <div
        className="p-6 rounded-2xl border border-gray-100 shadow-sm text-center mb-6"
        style={{ background: "var(--color-card)" }}
      >
        {profile?.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt=""
            className="w-20 h-20 rounded-full mx-auto mb-3"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center mx-auto mb-3 text-3xl">
            😊
          </div>
        )}
        <p className="text-lg font-bold">{profile?.display_name}</p>
        <p className="text-sm" style={{ color: "var(--color-text-sub)" }}>
          {email}
        </p>
      </div>

      <button
        onClick={handleLogout}
        className="w-full py-3 rounded-xl border border-red-200 text-red-500 text-sm font-medium hover:bg-red-50 transition-colors"
      >
        ログアウト
      </button>
    </div>
  );
}
