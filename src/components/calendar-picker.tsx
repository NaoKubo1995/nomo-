"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Availability } from "@/lib/types";

type Props = {
  userId: string;
  onClose: () => void;
  onSaved: () => void;
  existingAvailabilities: Availability[];
};

type CalendarEvent = {
  id: string;
  summary: string;
  start: string;
  end: string;
};

const HOURS = Array.from({ length: 16 }, (_, i) => i + 8);

function getDateLabel(date: Date): string {
  const today = new Date();
  if (date.toDateString() === today.toDateString()) return "今日";
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (date.toDateString() === tomorrow.toDateString()) return "明日";
  const dayAfter = new Date(today);
  dayAfter.setDate(dayAfter.getDate() + 2);
  if (date.toDateString() === dayAfter.toDateString()) return "明後日";
  return date.toLocaleDateString("ja-JP", { month: "short", day: "numeric" });
}

function getWeekday(date: Date): string {
  return date.toLocaleDateString("ja-JP", { weekday: "short" });
}

function getDayNum(date: Date): number {
  return date.getDate();
}

function getThreeDays(): Date[] {
  const days: Date[] = [];
  for (let i = 0; i < 3; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    d.setHours(0, 0, 0, 0);
    days.push(d);
  }
  return days;
}

function localDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function slotKey(date: Date, hour: number): string {
  return `${localDateStr(date)}-${hour}`;
}

function getExistingSlots(availabilities: Availability[], userId: string): Set<string> {
  const slots = new Set<string>();
  availabilities
    .filter((a) => a.user_id === userId)
    .forEach((a) => {
      const start = new Date(a.start_time);
      const end = new Date(a.end_time);
      for (let h = start.getHours(); h < end.getHours() || (end.getMinutes() > 0 && h <= end.getHours()); h++) {
        const dateStr = localDateStr(start);
        if (HOURS.includes(h)) {
          slots.add(`${dateStr}-${h}`);
        }
      }
    });
  return slots;
}

function mapEventsToSlots(events: CalendarEvent[]): Map<string, string[]> {
  const slotEvents = new Map<string, string[]>();
  events.forEach((event) => {
    const start = new Date(event.start);
    const end = new Date(event.end);
    const startHour = start.getHours();
    const endHour = end.getHours() + (end.getMinutes() > 0 ? 1 : 0);
    const dateStr = localDateStr(start);

    for (let h = startHour; h < endHour; h++) {
      if (HOURS.includes(h)) {
        const key = `${dateStr}-${h}`;
        if (!slotEvents.has(key)) {
          slotEvents.set(key, []);
        }
        slotEvents.get(key)!.push(event.summary);
      }
    }
  });
  return slotEvents;
}

export function CalendarPicker({ userId, onClose, onSaved, existingAvailabilities }: Props) {
  const days = getThreeDays();
  const [selected, setSelected] = useState<Set<string>>(
    () => getExistingSlots(existingAvailabilities, userId)
  );
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [dragMode, setDragMode] = useState<"select" | "deselect" | null>(null);
  const [calendarEvents, setCalendarEvents] = useState<Map<string, string[]>>(new Map());
  const [calendarLoading, setCalendarLoading] = useState(true);

  const now = new Date();
  const currentHour = now.getHours();

  useEffect(() => {
    async function fetchCalendar() {
      try {
        const res = await fetch("/api/calendar");
        const data = await res.json();
        if (data.events && data.events.length > 0) {
          setCalendarEvents(mapEventsToSlots(data.events));
        }
      } catch (e) {
        console.error("Failed to fetch calendar:", e);
      } finally {
        setCalendarLoading(false);
      }
    }
    fetchCalendar();
  }, []);

  const toggleSlot = (key: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) { next.delete(key); } else { next.add(key); }
      return next;
    });
  };

  const handlePointerDown = (key: string, isPast: boolean) => {
    if (isPast) return;
    const willSelect = !selected.has(key);
    setDragMode(willSelect ? "select" : "deselect");
    toggleSlot(key);
  };

  const handlePointerEnter = (key: string, isPast: boolean) => {
    if (isPast || !dragMode) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (dragMode === "select") { next.add(key); } else { next.delete(key); }
      return next;
    });
  };

  const handlePointerUp = () => { setDragMode(null); };

  useEffect(() => {
    window.addEventListener("pointerup", handlePointerUp);
    return () => window.removeEventListener("pointerup", handlePointerUp);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const supabase = createClient();
    await supabase.from("availabilities").delete().eq("user_id", userId);

    const slotsByDate = new Map<string, number[]>();
    selected.forEach((key) => {
      const parts = key.split("-");
      const hour = parseInt(parts[parts.length - 1]);
      const dateStr = parts.slice(0, 3).join("-");
      if (!slotsByDate.has(dateStr)) { slotsByDate.set(dateStr, []); }
      slotsByDate.get(dateStr)!.push(hour);
    });

    const inserts: { user_id: string; start_time: string; end_time: string; message: string }[] = [];
    slotsByDate.forEach((hours, dateStr) => {
      hours.sort((a, b) => a - b);
      let rangeStart = hours[0];
      let rangeEnd = hours[0];
      for (let i = 1; i < hours.length; i++) {
        if (hours[i] === rangeEnd + 1) {
          rangeEnd = hours[i];
        } else {
          const start = new Date(`${dateStr}T${String(rangeStart).padStart(2, "0")}:00:00`);
          const end = new Date(`${dateStr}T${String(rangeEnd + 1).padStart(2, "0")}:00:00`);
          inserts.push({ user_id: userId, start_time: start.toISOString(), end_time: end.toISOString(), message: message || "ヒマです！" });
          rangeStart = hours[i];
          rangeEnd = hours[i];
        }
      }
      const start = new Date(`${dateStr}T${String(rangeStart).padStart(2, "0")}:00:00`);
      const end = new Date(`${dateStr}T${String(rangeEnd + 1).padStart(2, "0")}:00:00`);
      inserts.push({ user_id: userId, start_time: start.toISOString(), end_time: end.toISOString(), message: message || "ヒマです！" });
    });

    if (inserts.length > 0) { await supabase.from("availabilities").insert(inserts); }
    setSaving(false);
    onSaved();
  };

  const selectedCount = selected.size;

  return (
    <div className="rounded-2xl border-2 overflow-hidden" style={{ borderColor: "var(--color-available)", background: "var(--color-card)" }}>
      <div className="px-4 py-3 flex items-center justify-between" style={{ background: "var(--color-available)" }}>
        <div className="flex items-center gap-2">
          <span className="text-white font-bold text-sm">空いてる時間を選択</span>
          {!calendarLoading && calendarEvents.size > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/20 text-white">📅 カレンダー連携中</span>
          )}
        </div>
        <button onClick={onClose} className="text-white/80 text-lg leading-none">✕</button>
      </div>

      <div className="px-4 pt-3">
        <input type="text" placeholder="何したい？（例：飲みたい！映画見たい）" value={message} onChange={(e) => setMessage(e.target.value)}
          className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[var(--color-primary)]" />
      </div>

      {!calendarLoading && calendarEvents.size > 0 && (
        <div className="px-4 pt-2 flex items-center gap-3 text-[10px]" style={{ color: "var(--color-text-sub)" }}>
          <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded" style={{ background: "var(--color-available)" }} />ヒマ</span>
          <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded bg-blue-100 border border-blue-200" style={{ backgroundImage: "repeating-linear-gradient(135deg, transparent, transparent 2px, rgba(59,130,246,0.15) 2px, rgba(59,130,246,0.15) 4px)" }} />予定あり</span>
        </div>
      )}

      <div className="px-2 py-3 overflow-x-auto" onPointerUp={handlePointerUp}>
        <div className="grid" style={{ gridTemplateColumns: "44px repeat(3, 1fr)", gap: "2px" }}>
          <div />
          {days.map((day) => (
            <div key={day.toISOString()} className="text-center pb-2">
              <div className="text-[10px] font-medium" style={{ color: "var(--color-text-sub)" }}>{getWeekday(day)}</div>
              <div className="text-sm font-bold" style={{ color: "var(--color-text)" }}>{getDateLabel(day)}</div>
              <div className="text-[10px]" style={{ color: "var(--color-text-sub)" }}>{getDayNum(day)}日</div>
            </div>
          ))}

          {HOURS.map((hour) => (
            <>
              <div key={`label-${hour}`} className="text-[10px] text-right pr-1 pt-0.5 select-none" style={{ color: "var(--color-text-sub)" }}>{hour}:00</div>
              {days.map((day) => {
                const key = slotKey(day, hour);
                const isSelected = selected.has(key);
                const isToday = day.toDateString() === now.toDateString();
                const isPast = isToday && hour < currentHour;
                const isCurrent = isToday && hour === currentHour;
                const eventNames = calendarEvents.get(key);
                const hasEvent = eventNames && eventNames.length > 0;

                return (
                  <div key={key}
                    onPointerDown={(e) => { e.preventDefault(); handlePointerDown(key, isPast); }}
                    onPointerEnter={() => handlePointerEnter(key, isPast)}
                    className={`h-9 rounded-lg border transition-all select-none cursor-pointer flex items-center justify-center text-xs font-medium relative overflow-hidden
                      ${isPast ? "border-gray-100 cursor-not-allowed opacity-40" : isSelected ? "border-transparent text-white shadow-sm" : isCurrent ? "border-orange-200 bg-orange-50" : hasEvent ? "border-blue-200 bg-blue-50" : "border-gray-100 bg-gray-50 hover:bg-gray-100 active:bg-gray-200"}`}
                    style={{
                      ...(isSelected && !isPast ? { background: "var(--color-available)" } : {}),
                      ...(hasEvent && !isSelected && !isPast ? { backgroundImage: "repeating-linear-gradient(135deg, transparent, transparent 3px, rgba(59,130,246,0.08) 3px, rgba(59,130,246,0.08) 6px)" } : {}),
                    }}>
                    {hasEvent && !isSelected && !isPast && (<span className="text-[9px] text-blue-400 truncate px-1 max-w-full" title={eventNames!.join(", ")}>{eventNames![0].length > 6 ? eventNames![0].slice(0, 6) + "…" : eventNames![0]}</span>)}
                    {isSelected && !isPast && (<span>{hasEvent ? "ヒマ✨" : "ヒマ"}</span>)}
                    {isCurrent && !isSelected && !hasEvent && (<span>今</span>)}
                    {isPast && hasEvent && (<span className="text-[9px] text-gray-400 truncate px-1">{eventNames![0].length > 6 ? eventNames![0].slice(0, 6) + "…" : eventNames![0]}</span>)}
                  </div>
                );
              })}
            </>
          ))}
        </div>
      </div>

      <div className="px-4 pb-4 flex items-center gap-2">
        <div className="flex-1 text-xs" style={{ color: "var(--color-text-sub)" }}>{selectedCount > 0 ? `${selectedCount}スロット選択中` : "タップで選択"}</div>
        <button onClick={onClose} className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium">キャンセル</button>
        <button onClick={handleSave} disabled={saving || selectedCount === 0} className="px-5 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-50" style={{ background: "var(--color-available)" }}>{saving ? "保存中..." : "シェアする"}</button>
      </div>
    </div>
  );
}
