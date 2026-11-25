import { APP_CONFIG, EXAM_AT } from '../data/config';
import type { Block } from '../data/types';

export function parseClockTime(label: string, baseDate: Date): Date {
  const match = label.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return new Date(baseDate);
  let hour = parseInt(match[1], 10);
  const minute = parseInt(match[2], 10);
  const period = match[3].toUpperCase();
  if (period === 'PM' && hour !== 12) hour += 12;
  if (period === 'AM' && hour === 12) hour = 0;

  const d = new Date(baseDate);
  d.setHours(hour, minute, 0, 0);
  return d;
}

export function getNightWindow(examDate: Date): { start: Date; end: Date } {
  const end = new Date(examDate);
  const start = new Date(examDate);
  start.setDate(start.getDate() - 1);
  start.setHours(APP_CONFIG.nightWindow.startHour, 0, 0, 0);
  return { start, end };
}

export function getExamDate(): Date {
  const parsed = new Date(EXAM_AT);
  if (!Number.isNaN(parsed.getTime())) return parsed;
  const fallback = new Date();
  fallback.setDate(fallback.getDate() + 1);
  fallback.setHours(9, 0, 0, 0);
  return fallback;
}

export function getNightStats(now: Date) {
  const examDate = getExamDate();
  const { start, end } = getNightWindow(examDate);
  const totalMs = Math.max(1, end.getTime() - start.getTime());
  const elapsedMs = now.getTime() - start.getTime();
  const rawPct = (elapsedMs / totalMs) * 100;
  const elapsedPct = Math.max(0, Math.min(100, Math.round(rawPct)));

  const remainingMs = Math.max(0, examDate.getTime() - now.getTime());
  const totalSecs = Math.floor(remainingMs / 1000);
  const hours = Math.floor(totalSecs / 3600);
  const minutes = Math.floor((totalSecs % 3600) / 60);
  const seconds = totalSecs % 60;

  const examTomorrow = examDate.toDateString() !== now.toDateString();
  const examTimeStr = examDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  const chipLabel =
    remainingMs === 0
      ? 'Exam starts now'
      : examTomorrow
        ? `Exam tomorrow, ${examTimeStr}`
        : `Exam today, ${examTimeStr}`;

  return {
    examDate,
    elapsedPct,
    remainingMs,
    hours,
    minutes,
    seconds,
    chipLabel,
  };
}

export function getBlockBounds(block: Block, examDate: Date): { start: Date; end: Date } {
  const { start: nightStart } = getNightWindow(examDate);
  const start = parseClockTime(block.start, nightStart);
  if (start.getHours() < APP_CONFIG.nightWindow.startHour) {
    start.setDate(start.getDate() + 1);
  }
  let end: Date;
  if (block.end) {
    end = parseClockTime(block.end, nightStart);
    if (end.getHours() <= APP_CONFIG.nightWindow.startHour && end.getHours() < 17) {
      end.setDate(end.getDate() + 1);
    }
    if (end.getTime() < start.getTime()) {
      end.setDate(end.getDate() + 1);
    }
  } else {
    end = new Date(start.getTime() + 60 * 60 * 1000);
  }
  return { start, end };
}

export function getActiveBlockIndex(blocks: Block[], now: Date, examDate: Date): number {
  const nowMs = now.getTime();
  for (let i = 0; i < blocks.length; i++) {
    const { start, end } = getBlockBounds(blocks[i], examDate);
    if (nowMs >= start.getTime() && nowMs < end.getTime()) {
      return i;
    }
  }
  // If before 5 PM start, point to first block; if after exam, last block
  const first = getBlockBounds(blocks[0], examDate).start.getTime();
  if (nowMs < first) return 0;
  return blocks.length - 1;
}
