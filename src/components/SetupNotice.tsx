import { KeyRound } from 'lucide-react';

export function SetupNotice() {
  return (
    <div className="flex min-h-screen items-center justify-center px-5">
      <div className="rise w-full max-w-lg rounded-2xl bg-white p-7 shadow-sm ring-1 ring-slate-200">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 ring-1 ring-amber-200">
            <KeyRound className="h-5 w-5" />
          </span>
          <h1 className="text-lg font-semibold text-slate-900">Не заданы ключи Supabase</h1>
        </div>
        <p className="mt-4 text-sm text-slate-600">
          Создайте файл <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">.env.local</code> в корне проекта и
          скопируйте в него значения из Supabase Dashboard (Settings → API):
        </p>
        <pre className="mt-3 overflow-x-auto rounded-xl bg-slate-900 px-4 py-3 text-xs text-slate-100">
          VITE_SUPABASE_URL=https://xxxx.supabase.co
          {'\n'}
          VITE_SUPABASE_ANON_KEY=xxxx
        </pre>
        <p className="mt-3 text-sm text-slate-500">После этого перезапустите dev-сервер.</p>
      </div>
    </div>
  );
}
