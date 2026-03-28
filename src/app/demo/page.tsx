"use client";

import { useState } from "react";

// Mock data
const mockUsers = {
  me: { name: "直央", avatar: "🧑‍💻" },
  friends: [
    { name: "たくや", avatar: "😎" },
    { name: "みさき", avatar: "👩" },
    { name: "けんた", avatar: "🤓" },
    { name: "あやか", avatar: "👧" },
    { name: "りょう", avatar: "🧔" },
    { name: "ゆうき", avatar: "🙂" },
  ],
};

// Calendar-based availability data
const mockFreeNow = [
  { user: mockUsers.friends[0], freeUntil: "22:00" },
  { user: mockUsers.friends[1], freeUntil: "18:00" },
  { user: mockUsers.friends[3], freeUntil: "21:00" },
];

const mockFreeToday = [
  { user: mockUsers.friends[0], slots: ["18:00〜22:00"] },
  { user: mockUsers.friends[1], slots: ["14:00〜18:00"] },
  { user: mockUsers.friends[2], slots: ["19:30〜22:00"] },
  { user: mockUsers.friends[3], slots: ["15:00〜17:00", "19:00〜21:00"] },
  { user: mockUsers.friends[4], slots: ["20:00〜23:00"] },
];

const mockFreeTomorrow = [
  { user: mockUsers.friends[1], slots: ["10:00〜13:00", "18:00〜22:00"] },
  { user: mockUsers.friends[2], slots: ["終日OK"] },
  { user: mockUsers.friends[4], slots: ["11:00〜14:00"] },
  { user: mockUsers.friends[5], slots: ["13:00〜17:00"] },
];

const mockAvailabilities = [
  {
    id: "1",
    user: mockUsers.friends[0],
    message: "渋谷あたりで飲みたい！",
    start: "18:00",
    end: "22:00",
    date: "今日",
    ago: "5分前",
  },
  {
    id: "2",
    user: mockUsers.friends[1],
    message: "映画見に行きたい〜",
    start: "14:00",
    end: "18:00",
    date: "今日",
    ago: "12分前",
  },
  {
    id: "3",
    user: mockUsers.me,
    message: "ヒマです！誰かご飯いこ",
    start: "19:00",
    end: "23:00",
    date: "今日",
    ago: "30分前",
  },
  {
    id: "4",
    user: mockUsers.friends[2],
    message: "新宿で焼肉いける人〜",
    start: "19:30",
    end: "22:00",
    date: "今日",
    ago: "1時間前",
  },
  {
    id: "5",
    user: mockUsers.friends[4],
    message: "明日の昼ヒマ！ランチ行きたい",
    start: "11:00",
    end: "14:00",
    date: "明日",
    ago: "2時間前",
  },
];

const mockPending = [
  { id: "p1", user: mockUsers.friends[5] },
];

type Screen = "home" | "home-form" | "friends" | "profile" | "invite" | "login";

export default function DemoPage() {
  const [screen, setScreen] = useState<Screen>("home");

  return (
    <div className="min-h-dvh bg-gray-100 flex flex-col items-center py-6 px-4">
      <h1 className="text-xl font-bold mb-2">nomo! UI デモ</h1>
      <p className="text-sm text-gray-500 mb-4">各画面をタップして確認できます</p>

      {/* Screen selector */}
      <div className="flex flex-wrap gap-2 mb-6 justify-center">
        {[
          { key: "login", label: "ログイン" },
          { key: "invite", label: "招待" },
          { key: "home", label: "ホーム" },
          { key: "home-form", label: "ヒマ投稿" },
          { key: "friends", label: "フレンド" },
          { key: "profile", label: "マイページ" },
        ].map((s) => (
          <button
            key={s.key}
            onClick={() => setScreen(s.key as Screen)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
              screen === s.key
                ? "text-white"
                : "bg-white text-gray-600 border border-gray-200"
            }`}
            style={screen === s.key ? { background: "#FF6B35" } : {}}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Phone frame */}
      <div
        className="relative bg-black rounded-[3rem] p-3 shadow-2xl"
        style={{ width: 375, height: 812 }}
      >
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-36 h-7 bg-black rounded-b-2xl z-20" />

        {/* Screen */}
        <div
          className="w-full h-full rounded-[2.4rem] overflow-hidden overflow-y-auto"
          style={{ background: "#FFFBF5" }}
        >
          {screen === "login" && <LoginScreen />}
          {screen === "invite" && <InviteScreen />}
          {screen === "home" && <HomeScreen onOpenForm={() => setScreen("home-form")} />}
          {screen === "home-form" && <HomeFormScreen onClose={() => setScreen("home")} />}
          {screen === "friends" && <FriendsScreen />}
          {screen === "profile" && <ProfileScreen />}
        </div>
      </div>
    </div>
  );
}

/* ---- Login Screen ---- */
function LoginScreen() {
  return (
    <div className="flex flex-col items-center justify-center h-full px-8">
      <h1 className="text-5xl font-bold" style={{ color: "#FF6B35" }}>
        nomo!
      </h1>
      <p className="mt-3 text-lg text-gray-400">
        友達とヒマな時間をシェアしよう
      </p>
      <button className="flex items-center gap-3 px-6 py-3.5 bg-white border border-gray-300 rounded-xl shadow-sm mt-12 text-base font-medium">
        <GoogleIcon />
        Googleでログイン
      </button>
      <p className="mt-8 text-xs text-gray-400">
        ログインすることで、空き時間を友達とシェアできます
      </p>
    </div>
  );
}

/* ---- Invite Screen ---- */
function InviteScreen() {
  return (
    <div className="flex flex-col items-center justify-center h-full px-8">
      <h1 className="text-4xl font-bold mb-2" style={{ color: "#FF6B35" }}>
        nomo!
      </h1>
      <p className="text-sm text-gray-400 mb-8">
        友達とヒマな時間をシェアしよう
      </p>

      <div className="p-6 rounded-2xl border border-gray-100 shadow-sm text-center mb-8 bg-white w-full">
        <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center mx-auto mb-3 text-2xl">
          😎
        </div>
        <p className="font-bold">たくや</p>
        <p className="text-sm mt-1 text-gray-400">
          があなたをnomo!に招待しています
        </p>
      </div>

      <button className="flex items-center gap-3 px-6 py-3.5 bg-white border border-gray-300 rounded-xl shadow-sm text-base font-medium">
        <GoogleIcon />
        Googleでログインして参加
      </button>
    </div>
  );
}

/* ---- Home Screen ---- */
function HomeScreen({ onOpenForm }: { onOpenForm: () => void }) {
  const [isPublic, setIsPublic] = useState(true);
  const [timeTab, setTimeTab] = useState<"now" | "today" | "tomorrow">("now");

  return (
    <div className="pt-14 px-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold" style={{ color: "#FF6B35" }}>
          nomo!
        </h1>
        <span className="text-sm text-gray-400">{mockUsers.me.name}</span>
      </div>

      {/* Visibility Toggle */}
      <div
        className="flex items-center justify-between p-3 rounded-2xl mb-4 border"
        style={{
          borderColor: isPublic ? "#10B981" : "#D1D5DB",
          background: isPublic ? "#ECFDF5" : "#F9FAFB",
        }}
      >
        <div className="flex items-center gap-2.5">
          <span className="text-lg">{isPublic ? "📡" : "🔒"}</span>
          <div>
            <p className="text-sm font-bold" style={{ color: isPublic ? "#059669" : "#6B7280" }}>
              {isPublic ? "カレンダー公開中" : "非公開モード"}
            </p>
            <p className="text-[11px] text-gray-400">
              {isPublic
                ? "空き時間がフレンドに見えています"
                : "フレンドにあなたの空きは見えません"}
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsPublic(!isPublic)}
          className="relative w-12 h-7 rounded-full transition-colors"
          style={{ background: isPublic ? "#10B981" : "#D1D5DB" }}
        >
          <div
            className="absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform"
            style={{ left: isPublic ? 22 : 2 }}
          />
        </button>
      </div>

      {/* Quick Action */}
      <button
        onClick={onOpenForm}
        className="w-full py-4 rounded-2xl text-white font-bold text-lg shadow-lg active:scale-[0.98] transition-transform"
        style={{ background: "#10B981" }}
      >
        🙋 今ヒマ！
      </button>

      {/* Time Tab Selector */}
      <div className="mt-5 flex gap-1 p-1 bg-gray-100 rounded-xl">
        {([
          { key: "now", label: "今", count: mockFreeNow.length },
          { key: "today", label: "今日", count: mockFreeToday.length },
          { key: "tomorrow", label: "明日", count: mockFreeTomorrow.length },
        ] as const).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setTimeTab(tab.key)}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${
              timeTab === tab.key
                ? "bg-white shadow-sm"
                : "text-gray-400"
            }`}
            style={timeTab === tab.key ? { color: "#FF6B35" } : {}}
          >
            {tab.label}
            <span
              className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full"
              style={
                timeTab === tab.key
                  ? { background: "#FFF0EB", color: "#FF6B35" }
                  : { background: "#E5E7EB", color: "#9CA3AF" }
              }
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="mt-3">
        {timeTab === "now" && (
          <>
            <div className="flex items-center gap-2 mb-3">
              <span
                className="text-[10px] px-1.5 py-0.5 rounded-md font-medium"
                style={{ background: "#EEF2FF", color: "#6366F1" }}
              >
                カレンダー自動検出
              </span>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
              {mockFreeNow.map((f, i) => (
                <div
                  key={i}
                  className="flex-shrink-0 flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-white border border-gray-100 shadow-sm"
                  style={{ width: 88 }}
                >
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-xl">
                      {f.user.avatar}
                    </div>
                    <div
                      className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-white"
                      style={{ background: "#10B981" }}
                    />
                  </div>
                  <span className="text-xs font-bold">{f.user.name}</span>
                  <span className="text-[10px] text-gray-400">
                    〜{f.freeUntil}まで
                  </span>
                </div>
              ))}
            </div>
          </>
        )}

        {timeTab === "today" && (
          <div className="space-y-2">
            {mockFreeToday.map((f, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 rounded-xl bg-white border border-gray-100 shadow-sm"
              >
                <div className="relative flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-lg">
                    {f.user.avatar}
                  </div>
                  {mockFreeNow.some((n) => n.user.name === f.user.name) && (
                    <div
                      className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white"
                      style={{ background: "#10B981" }}
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm">{f.user.name}</span>
                    {mockFreeNow.some((n) => n.user.name === f.user.name) && (
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded-full text-white"
                        style={{ background: "#10B981" }}
                      >
                        今ヒマ
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {f.slots.map((slot, j) => (
                      <span
                        key={j}
                        className="text-[11px] px-2 py-0.5 rounded-lg"
                        style={{ background: "#F0FDF4", color: "#059669" }}
                      >
                        {slot}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {timeTab === "tomorrow" && (
          <div className="space-y-2">
            {mockFreeTomorrow.map((f, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 rounded-xl bg-white border border-gray-100 shadow-sm"
              >
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-lg flex-shrink-0">
                  {f.user.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-bold text-sm">{f.user.name}</span>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {f.slots.map((slot, j) => (
                      <span
                        key={j}
                        className="text-[11px] px-2 py-0.5 rounded-lg"
                        style={{ background: "#EEF2FF", color: "#6366F1" }}
                      >
                        {slot}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Feed */}
      <div className="mt-5">
        <h2 className="text-sm font-bold mb-3 text-gray-400">
          みんなの投稿
        </h2>
        <div className="space-y-3">
          {mockAvailabilities.map((av) => (
            <div
              key={av.id}
              className="p-4 rounded-2xl border border-gray-100 shadow-sm bg-white"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-lg flex-shrink-0">
                  {av.user.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm">{av.user.name}</span>
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full text-white"
                      style={{ background: "#10B981" }}
                    >
                      ヒマ！
                    </span>
                    <span className="text-[10px] text-gray-300 ml-auto">
                      {av.ago}
                    </span>
                  </div>
                  <p className="text-sm mt-1">{av.message}</p>
                  <p className="text-xs mt-1.5 text-gray-400">
                    {av.date} {av.start} 〜 {av.end}
                  </p>
                </div>
                {av.user.name === mockUsers.me.name && (
                  <span className="text-gray-300 text-xs mt-1">✕</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <BottomNavMock active="home" />
    </div>
  );
}

/* ---- Home Form Screen ---- */
function HomeFormScreen({ onClose }: { onClose: () => void }) {
  const [hours, setHours] = useState(2);

  return (
    <div className="pt-14 px-4 pb-24">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold" style={{ color: "#FF6B35" }}>
          nomo!
        </h1>
        <span className="text-sm text-gray-400">{mockUsers.me.name}</span>
      </div>

      {/* Form */}
      <div
        className="p-4 rounded-2xl border-2 mb-4"
        style={{ borderColor: "#10B981", background: "white" }}
      >
        <input
          type="text"
          defaultValue="渋谷あたりで飲みたい！"
          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm mb-3 focus:outline-none"
          style={{ borderColor: "#FF6B35" }}
          readOnly
        />
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm text-gray-400">空き時間:</span>
          {[1, 2, 3, 4].map((h) => (
            <button
              key={h}
              onClick={() => setHours(h)}
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                hours === h ? "text-white" : "bg-gray-100 text-gray-600"
              }`}
              style={hours === h ? { background: "#10B981" } : {}}
            >
              {h}h
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium"
          >
            キャンセル
          </button>
          <button
            className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold"
            style={{ background: "#10B981" }}
          >
            シェアする
          </button>
        </div>
      </div>

      {/* Feed below */}
      <div className="mt-4">
        <h2 className="text-sm font-bold mb-3 text-gray-400">
          みんなの空き状況
        </h2>
        <div className="space-y-3">
          {mockAvailabilities.slice(0, 3).map((av) => (
            <div
              key={av.id}
              className="p-4 rounded-2xl border border-gray-100 shadow-sm bg-white"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-lg flex-shrink-0">
                  {av.user.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm">{av.user.name}</span>
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full text-white"
                      style={{ background: "#10B981" }}
                    >
                      ヒマ！
                    </span>
                  </div>
                  <p className="text-sm mt-1">{av.message}</p>
                  <p className="text-xs mt-1.5 text-gray-400">
                    {av.date} {av.start} 〜 {av.end}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <BottomNavMock active="home" />
    </div>
  );
}

/* ---- Friends Screen ---- */
function FriendsScreen() {
  return (
    <div className="pt-14 px-4 pb-24">
      <h1 className="text-xl font-bold mb-4">フレンド</h1>

      {/* Invite */}
      <div
        className="p-4 rounded-2xl mb-5 border"
        style={{ borderColor: "#FF6B35", background: "#FFF5F0" }}
      >
        <p className="text-sm font-bold mb-1" style={{ color: "#FF6B35" }}>
          友達を招待しよう！
        </p>
        <p className="text-xs mb-3 text-gray-400">
          下のリンクを友達に送ってnomo!に招待しよう
        </p>
        <button
          className="w-full py-2.5 rounded-xl text-white text-sm font-bold"
          style={{ background: "#FF6B35" }}
        >
          招待リンクをコピー
        </button>
      </div>

      {/* Pending */}
      <div className="mb-5">
        <h2 className="text-sm font-bold mb-3 text-gray-400">
          フレンド申請 (1)
        </h2>
        {mockPending.map((p) => (
          <div
            key={p.id}
            className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 bg-white"
          >
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-lg">
              {p.user.avatar}
            </div>
            <span className="flex-1 font-medium text-sm">{p.user.name}</span>
            <button
              className="px-3 py-1.5 rounded-lg text-white text-xs font-bold"
              style={{ background: "#10B981" }}
            >
              承認
            </button>
            <button className="px-3 py-1.5 rounded-lg bg-gray-100 text-xs font-medium text-gray-500">
              拒否
            </button>
          </div>
        ))}
      </div>

      {/* Friends list */}
      <h2 className="text-sm font-bold mb-3 text-gray-400">
        フレンド一覧 ({mockUsers.friends.length - 1})
      </h2>
      <div className="space-y-2">
        {mockUsers.friends.slice(0, 5).map((f, i) => (
          <div
            key={i}
            className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 bg-white"
          >
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-lg">
                {f.avatar}
              </div>
              {i < 3 && (
                <div
                  className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white"
                  style={{ background: "#10B981" }}
                />
              )}
            </div>
            <span className="font-medium text-sm">{f.name}</span>
            {i < 3 && (
              <span
                className="ml-auto text-[10px] px-2 py-0.5 rounded-full text-white"
                style={{ background: "#10B981" }}
              >
                ヒマ中
              </span>
            )}
            {i >= 3 && (
              <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-400">
                予定あり
              </span>
            )}
          </div>
        ))}
      </div>

      <BottomNavMock active="friends" />
    </div>
  );
}

/* ---- Profile Screen ---- */
function ProfileScreen() {
  const [calendarConnected, setCalendarConnected] = useState(true);
  const [isPublic, setIsPublic] = useState(true);

  return (
    <div className="pt-14 px-4 pb-24">
      <h1 className="text-xl font-bold mb-6">マイページ</h1>

      <div className="p-6 rounded-2xl border border-gray-100 shadow-sm text-center mb-5 bg-white">
        <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3 text-4xl">
          🧑‍💻
        </div>
        <p className="text-lg font-bold">{mockUsers.me.name}</p>
        <p className="text-sm text-gray-400">naokubo@gmail.com</p>
      </div>

      {/* Settings */}
      <div className="space-y-3 mb-5">
        {/* Visibility toggle */}
        <div className="p-4 rounded-xl bg-white border border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span>{isPublic ? "📡" : "🔒"}</span>
            <div>
              <span className="text-sm font-medium">空き時間の公開</span>
              <p className="text-[11px] text-gray-400">
                {isPublic ? "フレンドに見えています" : "誰にも見えません"}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsPublic(!isPublic)}
            className="relative w-11 h-6 rounded-full transition-colors"
            style={{ background: isPublic ? "#10B981" : "#D1D5DB" }}
          >
            <div
              className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform"
              style={{ left: isPublic ? 20 : 2 }}
            />
          </button>
        </div>

        {/* Calendar connection */}
        <div className="p-4 rounded-xl bg-white border border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span>📅</span>
            <div>
              <span className="text-sm font-medium">Google Calendar</span>
              <p className="text-[11px] text-gray-400">
                {calendarConnected ? "連携中 ・ naokubo@gmail.com" : "未連携"}
              </p>
            </div>
          </div>
          {calendarConnected ? (
            <span className="text-xs font-bold" style={{ color: "#10B981" }}>
              接続済み
            </span>
          ) : (
            <button
              className="px-3 py-1.5 rounded-lg text-white text-xs font-bold"
              style={{ background: "#FF6B35" }}
            >
              連携する
            </button>
          )}
        </div>

        <div className="p-4 rounded-xl bg-white border border-gray-100 flex items-center justify-between">
          <span className="text-sm">今日の空き投稿</span>
          <span className="text-sm font-bold" style={{ color: "#10B981" }}>1件</span>
        </div>
        <div className="p-4 rounded-xl bg-white border border-gray-100 flex items-center justify-between">
          <span className="text-sm">フレンド数</span>
          <span className="text-sm font-bold" style={{ color: "#FF6B35" }}>5人</span>
        </div>
      </div>

      <button className="w-full py-3 rounded-xl border border-red-200 text-red-500 text-sm font-medium">
        ログアウト
      </button>

      <BottomNavMock active="profile" />
    </div>
  );
}

/* ---- Bottom Nav Mock ---- */
function BottomNavMock({ active }: { active: string }) {
  const items = [
    { key: "home", label: "ホーム", icon: "🏠" },
    { key: "friends", label: "フレンド", icon: "👥" },
    { key: "profile", label: "マイページ", icon: "👤" },
  ];

  return (
    <div className="fixed bottom-[3px] left-1/2 -translate-x-1/2 bg-white border-t border-gray-200 flex justify-around items-center h-14" style={{ width: 349, borderRadius: "0 0 2.4rem 2.4rem" }}>
      {items.map((item) => (
        <div key={item.key} className="flex flex-col items-center gap-0.5">
          <span className="text-lg">{item.icon}</span>
          <span
            className="text-[10px] font-medium"
            style={{
              color: active === item.key ? "#FF6B35" : "#6B7280",
            }}
          >
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ---- Google Icon ---- */
function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}
