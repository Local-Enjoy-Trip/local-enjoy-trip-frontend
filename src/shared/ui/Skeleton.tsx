import type { HTMLAttributes } from "react";

export function Skeleton({
  className = "",
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`skeleton-shimmer rounded-xl bg-[#EEF1F2] ${className}`}
      aria-hidden="true"
      {...props}
    />
  );
}

export function PageLoadingSkeleton({
  type = "list",
}: {
  type?: "home" | "list" | "map" | "profile";
}) {
  if (type === "map") {
    return (
      <div className="relative h-dvh overflow-hidden bg-[#EEF3EF]">
        <Skeleton className="absolute top-[calc(18px+env(safe-area-inset-top))] left-4 h-11 w-[calc(100%-32px)] rounded-2xl" />
        <div className="absolute inset-x-0 top-24 h-[58%] bg-[#E5EEE8]">
          <Skeleton className="absolute top-10 left-8 h-8 w-24 rounded-full" />
          <Skeleton className="absolute top-28 right-10 h-10 w-10 rounded-full" />
          <Skeleton className="absolute bottom-16 left-20 h-11 w-11 rounded-full" />
        </div>
        <div className="absolute inset-x-0 bottom-0 rounded-t-[28px] bg-white px-5 pt-5 pb-[calc(96px+env(safe-area-inset-bottom))] shadow-[0_-12px_34px_rgba(17,17,17,0.08)]">
          <Skeleton className="mx-auto h-1.5 w-10 rounded-full" />
          <Skeleton className="mt-5 h-5 w-32" />
          <Skeleton className="mt-4 h-20 w-full rounded-2xl" />
          <Skeleton className="mt-3 h-20 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (type === "profile") {
    return (
      <div className="min-h-screen bg-white px-5 pt-[calc(20px+env(safe-area-inset-top))] pb-[calc(96px+env(safe-area-inset-bottom))]">
        <Skeleton className="mx-auto h-5 w-20" />
        <div className="mt-8 grid grid-cols-[96px_1fr] items-center gap-4">
          <Skeleton className="size-24 rounded-full" />
          <div className="grid grid-cols-3 gap-2">
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
          </div>
        </div>
        <Skeleton className="mt-7 h-7 w-36" />
        <Skeleton className="mt-3 h-4 w-48" />
        <div className="mt-9 grid gap-3">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      </div>
    );
  }

  if (type === "home") {
    return (
      <div className="min-h-screen bg-white px-5 pt-[calc(18px+env(safe-area-inset-top))] pb-[calc(96px+env(safe-area-inset-bottom))]">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="size-10 rounded-full" />
        </div>
        <Skeleton className="mt-6 h-36 w-full rounded-3xl" />
        <Skeleton className="mt-8 h-5 w-36" />
        <div className="mt-4 flex gap-4">
          <Skeleton className="h-56 w-40 flex-none rounded-3xl" />
          <Skeleton className="h-56 w-40 flex-none rounded-3xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white px-5 pt-[calc(20px+env(safe-area-inset-top))] pb-[calc(96px+env(safe-area-inset-bottom))]">
      <Skeleton className="h-7 w-32" />
      <div className="mt-6 grid gap-3">
        <Skeleton className="h-20 w-full rounded-2xl" />
        <Skeleton className="h-20 w-full rounded-2xl" />
        <Skeleton className="h-20 w-full rounded-2xl" />
      </div>
    </div>
  );
}
