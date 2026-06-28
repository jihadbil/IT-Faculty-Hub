import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { EXTERNAL_API_BASE_URL, getStoredTokens } from "@/lib/external-api";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function resolveAssetUrl(url?: string | null): string {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) {
    return url;
  }
  const cleanUrl = url.startsWith("/") ? url.slice(1) : url;
  return `${EXTERNAL_API_BASE_URL}/${cleanUrl}`;
}

export async function forceDownloadFile(url: string, fileName: string) {
  try {
    const headers: Record<string, string> = {};
    const tokens = getStoredTokens();
    if (tokens?.token) {
      headers["Authorization"] = `Bearer ${tokens.token}`;
    }
    const response = await fetch(url, { headers });
    if (!response.ok) throw new Error("Failed to fetch file");
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
  } catch (error) {
    console.error("Failed to download file:", error);
    window.open(url, "_blank");
  }
}

export const ARABIC_DAYS = [
  "الأحد",
  "الاثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
  "السبت"
];

export const formatBytes = (bytes: number = 0, decimals = 2) => {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};
