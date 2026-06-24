import { Bell, Check, X } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import { hasAuthSession } from "@/features/auth/authStore";
import {
  acceptFriendshipRequest,
  friendsQueryKey,
  getReceivedFriendRequests,
  receivedFriendRequestsQueryKey,
  rejectFriendshipRequest,
} from "@/features/friends/friendApi";
import { Skeleton } from "@/shared/ui/Skeleton";

type NotificationDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
};

function getInitial(name: string) {
  return name.trim().slice(0, 1).toUpperCase() || "?";
}

export function NotificationDrawer({
  isOpen,
  onClose,
}: NotificationDrawerProps) {
  const queryClient = useQueryClient();
  const hasSession = hasAuthSession();
  const receivedRequestsQuery = useQuery({
    enabled: isOpen && hasSession,
    queryFn: getReceivedFriendRequests,
    queryKey: receivedFriendRequestsQueryKey,
    retry: false,
  });

  async function refreshNotificationState() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: friendsQueryKey }),
      queryClient.invalidateQueries({ queryKey: receivedFriendRequestsQueryKey }),
    ]);
  }

  const acceptMutation = useMutation({
    mutationFn: acceptFriendshipRequest,
    onSuccess: refreshNotificationState,
  });
  const rejectMutation = useMutation({
    mutationFn: rejectFriendshipRequest,
    onSuccess: refreshNotificationState,
  });
  const isPending = acceptMutation.isPending || rejectMutation.isPending;
  const requests = receivedRequestsQuery.data ?? [];

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          className="fixed inset-0 z-[80] flex justify-end bg-black/35"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
      <button
        aria-label="알림 닫기"
        className="absolute inset-0 cursor-default border-0 bg-transparent"
        onClick={onClose}
        type="button"
      />
      <motion.aside
        aria-label="알림"
        className="relative h-full w-[88%] max-w-[390px] bg-white px-5 pt-[calc(18px+env(safe-area-inset-top))] pb-[calc(24px+env(safe-area-inset-bottom))] shadow-[-18px_0_40px_rgba(17,17,17,0.18)]"
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 360, damping: 36 }}
      >
        <header className="flex items-center justify-between">
          <div>
            <h2 className="m-0 text-xl font-bold text-[#171717]">
              알림
            </h2>
          </div>
          <button
            aria-label="알림 닫기"
            className="grid size-10 place-items-center rounded-full bg-[#F4F3EF] text-[#333]"
            onClick={onClose}
            type="button"
          >
            <X size={20} />
          </button>
        </header>

        <section className="mt-6">
          <div className="grid gap-2">
            {receivedRequestsQuery.isLoading ? (
              <NotificationListSkeleton />
            ) : requests.length > 0 ? (
              requests.map((request) => (
                <article
                  className="flex min-h-16 items-center gap-3 rounded-2xl bg-[#F7F6F2] px-3"
                  key={request.id}
                >
                  <span className="grid size-11 flex-none place-items-center rounded-full bg-[#E2E0F8] text-sm font-black text-[#4D3C9F]">
                    {getInitial(request.requesterDisplayName)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <strong className="block truncate text-sm font-black">
                      {request.requesterDisplayName}
                    </strong>
                    <small className="mt-1 block truncate text-xs font-bold text-[#8B857C]">
                      친구 요청을 보냈어요.
                    </small>
                  </span>
                  <span className="flex flex-none gap-1.5">
                    <button
                      aria-label="친구 요청 수락"
                      className="grid size-9 place-items-center rounded-full bg-[#1F3D35] text-white disabled:opacity-50"
                      disabled={isPending}
                      onClick={() => acceptMutation.mutate(request.id)}
                      type="button"
                    >
                      <Check size={17} />
                    </button>
                    <button
                      aria-label="친구 요청 거절"
                      className="grid size-9 place-items-center rounded-full bg-[#FFF0EE] text-[#D5483D] disabled:opacity-50"
                      disabled={isPending}
                      onClick={() => rejectMutation.mutate(request.id)}
                      type="button"
                    >
                      <X size={17} />
                    </button>
                  </span>
                </article>
              ))
            ) : (
              <div className="grid min-h-36 place-items-center rounded-2xl bg-[#F7F6F2] px-4 text-center text-sm font-black text-[#8B857C]">
                <span>
                  <Bell className="mx-auto mb-3 text-[#C9C2B7]" size={27} />
                  새 알림이 없어요.
                </span>
              </div>
            )}
          </div>
        </section>
      </motion.aside>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function NotificationListSkeleton() {
  return (
    <>
      {Array.from({ length: 3 }).map((_, index) => (
        <article
          className="flex min-h-16 items-center gap-3 rounded-2xl bg-[#F7F6F2] px-3"
          key={index}
        >
          <Skeleton className="size-11 flex-none rounded-full" />
          <span className="min-w-0 flex-1">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="mt-2 h-3 w-40" />
          </span>
          <span className="flex flex-none gap-1.5">
            <Skeleton className="size-9 rounded-full" />
            <Skeleton className="size-9 rounded-full" />
          </span>
        </article>
      ))}
    </>
  );
}
