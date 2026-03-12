import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { formatDistanceToNow, format, isToday, isYesterday, isSameYear } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMessageTime(date: Date | string): string {
  const d = new Date(date);
  return format(d, 'HH:mm');
}

export function formatChatTimestamp(date: Date | string): string {
  const d = new Date(date);
  if (isToday(d)) return format(d, 'HH:mm');
  if (isYesterday(d)) return 'Yesterday';
  if (isSameYear(d, new Date())) return format(d, 'MMM d');
  return format(d, 'MM/dd/yy');
}

export function formatLastSeen(date: Date | string): string {
  const d = new Date(date);
  if (isToday(d)) return `last seen today at ${format(d, 'HH:mm')}`;
  if (isYesterday(d)) return `last seen yesterday at ${format(d, 'HH:mm')}`;
  return `last seen ${formatDistanceToNow(d, { addSuffix: true })}`;
}

export function getAvatarInitials(name: string): string {
  if (!name || name.trim().length === 0) return '?';
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(n => n[0])
    .join('')
    .toUpperCase();
}

export function hashStringToColor(str: string): string {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function isImageType(mimeType?: string): boolean {
  return !!mimeType?.startsWith('image/');
}

export function isVideoType(mimeType?: string): boolean {
  return !!mimeType?.startsWith('video/');
}

export function isAudioType(mimeType?: string): boolean {
  return !!mimeType?.startsWith('audio/');
}
