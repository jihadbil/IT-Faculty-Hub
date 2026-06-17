export const EXTERNAL_API_BASE_URL = (
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "https://localhost:7079"
//"http://edapi.runasp.net/"
).replace(/\/$/, "");
