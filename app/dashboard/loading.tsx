// app/(dashboard)/loading.tsx
"use client";

export default function DashboardLoading() {
  return (
    <div className="flex h-full w-full flex-col p-6 sm:p-10 space-y-6 animate-pulse">
      {/* Page Header Placeholder */}
      <div className="space-y-2">
        <div className="h-3 w-24 rounded-sm bg-ink/10 dark:bg-white/10" />
        <div className="h-7 w-48 rounded-md bg-ink/10 dark:bg-white/10" />
      </div>

      {/* Main Content Card Shell Placeholder */}
      <div className="w-full flex-1 rounded-md border border-ink/10 bg-white p-4 dark:border-white/10 dark:bg-paper-darkdim min-h-[400px]">
        <div className="space-y-4">
          {/* Simulated Table Headers / Search bar */}
          <div className="flex justify-between items-center pb-4 border-b border-ink/5">
            <div className="h-8 w-1/3 rounded-md bg-ink/5 dark:bg-white/5" />
            <div className="h-8 w-24 rounded-md bg-ink/5 dark:bg-white/5" />
          </div>

          {/* Simulated Data Rows */}
          {[1, 2, 3, 4, 5].map((row) => (
            <div key={row} className="flex items-center justify-between py-3 border-b border-ink/[0.03]">
              <div className="space-y-1.5 flex-1">
                <div className="h-4 w-1/4 rounded-xs bg-ink/10 dark:bg-white/10" />
                <div className="h-3 w-1/2 rounded-xs bg-ink/5 dark:bg-white/5" />
              </div>
              <div className="h-4 w-16 rounded-xs bg-ink/5 dark:bg-white/5" />
              <div className="h-6 w-24 rounded-full bg-ink/10 dark:bg-white/10" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}