import { AlertCircle, Construction } from "lucide-react";
import { Card } from "@/components/ui/shared";
import { EXTERNAL_API_BASE_URL } from "@/lib/external-api";

interface ApiNoticeProps {
  title?: string;
  description?: string;
  endpoints?: string[];
}

export function ApiNotice({
  title = "هذه الميزة تنتظر دعم الـ API",
  description = "لا توجد نقاط نهاية في الـ EducationalPlatformAPI الحالي تغطي هذه الصفحة بعد. سيظهر المحتوى تلقائياً بمجرد إضافتها.",
  endpoints,
}: ApiNoticeProps) {
  return (
    <Card className="p-6 border-amber-300 bg-amber-50/60">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0">
          <Construction className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-bold text-lg text-amber-900">{title}</h3>
          <p className="text-sm text-amber-800/80 mt-1 leading-relaxed">{description}</p>
          {endpoints && endpoints.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-bold text-amber-900 mb-2 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                نقاط النهاية المطلوبة في API الخاص بك:
              </p>
              <ul className="space-y-1">
                {endpoints.map((ep) => (
                  <li
                    key={ep}
                    className="text-xs font-mono bg-white/70 border border-amber-200 rounded-lg px-3 py-1.5 text-amber-900"
                    dir="ltr"
                  >
                    {ep}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <p className="text-xs text-amber-800/70 mt-4">
            متصل بـ:{" "}
            <span className="font-mono" dir="ltr">{EXTERNAL_API_BASE_URL}</span>
          </p>
        </div>
      </div>
    </Card>
  );
}
