// app/forms/[id]/builder/loading.tsx
"use client";

export default function BuilderLoading() {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-paper-dim dark:bg-paper-dark animate-pulse">
      {/* Left Sidebar Skeleton */}
      <div className="hidden md:flex w-64 h-full flex-col border-r border-ink/10 bg-white p-4 space-y-4 dark:border-white/10 dark:bg-paper-darkdim">
        <div className="h-4 w-24 bg-ink/10 rounded-sm" />
        <div className="grid grid-cols-2 gap-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-14 rounded-md bg-ink/5 dark:bg-white/5 border border-ink/5" />
          ))}
        </div>
      </div>

      {/* Central Canvas Screen Skeleton */}
      <div className="flex-1 h-full p-6 overflow-y-auto flex flex-col items-center">
        <div className="w-full max-w-3xl space-y-4">
          {/* Top Bar inside Builder Section */}
          <div className="h-12 w-full bg-white dark:bg-paper-darkdim rounded-md border border-ink/10 dark:border-white/10" />
          
          {/* Canvas Sheet Fields Body */}
          <div className="w-full min-h-[500px] bg-white dark:bg-paper-darkdim border-2 border-dashed border-ink/10 dark:border-white/10 rounded-md p-6 space-y-4">
            {[1, 2, 3].map((field) => (
              <div key={field} className="h-20 w-full bg-ink/[0.02] dark:bg-white/[0.02] border border-ink/5 rounded-lg p-4 space-y-2">
                <div className="h-3 w-20 bg-ink/10 rounded-xs" />
                <div className="h-8 w-full bg-white dark:bg-paper-darkdim border border-ink/10 rounded-md" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Properties Panel Skeleton */}
      <div className="hidden lg:block w-72 h-full border-l border-ink/10 bg-white p-4 dark:border-white/10 dark:bg-paper-darkdim">
        <div className="space-y-4">
          <div className="h-4 w-32 bg-ink/10 rounded-sm" />
          <div className="h-32 w-full bg-ink/5 rounded-md" />
          <div className="h-8 w-full bg-ink/10 rounded-md" />
        </div>
      </div>
    </div>
  );
}