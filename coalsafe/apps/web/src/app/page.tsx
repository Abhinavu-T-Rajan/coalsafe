export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-[#090d16] text-slate-100">
      <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900/60 p-8 shadow-2xl backdrop-blur-md">
        <div className="flex items-center space-x-3 mb-6">
          <div className="h-3.5 w-3.5 rounded-full bg-amber-500 animate-pulse" />
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">
            COALSAFE
          </h1>
        </div>

        <div className="space-y-4">
          <p className="text-sm font-medium uppercase tracking-wider text-slate-400">
            Development Environment
          </p>

          <div className="rounded-lg border border-emerald-900/40 bg-emerald-950/20 px-4 py-3 flex items-center justify-between">
            <span className="text-xs text-slate-300 font-medium">Status</span>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Frontend: Online
            </span>
          </div>
        </div>

        <div className="mt-8 border-t border-slate-800 pt-4 text-xs text-slate-500 text-center">
          SIH1645 · Phase 0 Foundation
        </div>
      </div>
    </main>
  );
}
