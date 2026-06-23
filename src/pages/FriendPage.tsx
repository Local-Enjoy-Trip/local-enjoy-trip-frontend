import {
  Check,
  ChevronLeft,
  Search,
  Send,
  UserPlus,
  X,
} from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getAuthErrorMessage, useAuthUser } from "@/features/auth/authStore";
import { Skeleton } from "@/shared/ui/Skeleton";
import {
  acceptFriendshipRequest,
  cancelFriendshipRequest,
  deleteFriendship,
  friendsQueryKey,
  getFriends,
  getMembers,
  getReceivedFriendRequests,
  getSentFriendRequests,
  memberSearchQueryKey,
  receivedFriendRequestsQueryKey,
  rejectFriendshipRequest,
  requestFriendship,
  sentFriendRequestsQueryKey,
  type Friend,
  type Friendship,
  type MemberSearchResult,
} from "@/features/friends/friendApi";

type Tab = "friends" | "received" | "sent";

const tabs: { label: string; value: Tab }[] = [
  { label: "친구", value: "friends" },
  { label: "받은 요청", value: "received" },
  { label: "보낸 요청", value: "sent" },
];

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getInitial(name: string) {
  return name.trim().slice(0, 1).toUpperCase() || "?";
}

function getDisplayName(member: MemberSearchResult) {
  return member.nickname?.trim() || member.name || member.userId;
}

function useRefreshFriendQueries() {
  const queryClient = useQueryClient();

  return async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: friendsQueryKey }),
      queryClient.invalidateQueries({ queryKey: receivedFriendRequestsQueryKey }),
      queryClient.invalidateQueries({ queryKey: sentFriendRequestsQueryKey }),
    ]);
  };
}

export function FriendPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialEmail = searchParams.get("email") ?? "";
  const [activeTab, setActiveTab] = useState<Tab>("friends");
  const [emailInput, setEmailInput] = useState(initialEmail);
  const [selectedMember, setSelectedMember] = useState<MemberSearchResult | null>(null);
  const [notice, setNotice] = useState("");
  const { data: user } = useAuthUser();
  const refreshFriendQueries = useRefreshFriendQueries();

  const friendsQuery = useQuery({
    queryFn: getFriends,
    queryKey: friendsQueryKey,
  });
  const membersQuery = useQuery({
    queryFn: getMembers,
    queryKey: memberSearchQueryKey,
  });
  const receivedRequestsQuery = useQuery({
    queryFn: getReceivedFriendRequests,
    queryKey: receivedFriendRequestsQueryKey,
  });
  const sentRequestsQuery = useQuery({
    queryFn: getSentFriendRequests,
    queryKey: sentFriendRequestsQueryKey,
  });

  const normalizedEmailInput = emailInput.trim().toLowerCase();
  const searchResults = useMemo(() => {
    if (normalizedEmailInput.length < 2) return [];

    return (membersQuery.data ?? [])
      .filter((member) => member.email.toLowerCase().includes(normalizedEmailInput))
      .filter((member) => member.userId !== user?.id)
      .slice(0, 5);
  }, [membersQuery.data, normalizedEmailInput, user?.id]);
  const exactMember = searchResults.find(
    (member) => member.email.toLowerCase() === normalizedEmailInput,
  );
  const existingFriendUserIds = useMemo(
    () => new Set((friendsQuery.data ?? []).map((friend) => friend.userId)),
    [friendsQuery.data],
  );
  const pendingRequestUserIds = useMemo(
    () =>
      new Set([
        ...(sentRequestsQuery.data ?? []).map((request) => request.addresseeUserId),
        ...(receivedRequestsQuery.data ?? []).map((request) => request.requesterUserId),
    ]),
    [receivedRequestsQuery.data, sentRequestsQuery.data],
  );
  const emailByUserId = useMemo(
    () =>
      new Map(
        (membersQuery.data ?? []).map((member) => [member.userId, member.email]),
      ),
    [membersQuery.data],
  );
  function showNotice(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2200);
  }

  const requestMutation = useMutation({
    mutationFn: requestFriendship,
    onSuccess: async () => {
      setEmailInput("");
      setSelectedMember(null);
      await refreshFriendQueries();
    },
  });

  const acceptMutation = useMutation({
    mutationFn: acceptFriendshipRequest,
    onSuccess: async () => {
      await refreshFriendQueries();
    },
  });

  const rejectMutation = useMutation({
    mutationFn: rejectFriendshipRequest,
    onSuccess: async () => {
      await refreshFriendQueries();
    },
  });

  const cancelMutation = useMutation({
    mutationFn: cancelFriendshipRequest,
    onSuccess: async () => {
      await refreshFriendQueries();
      showNotice("보낸 요청을 취소했어요.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteFriendship,
    onSuccess: async () => {
      await refreshFriendQueries();
      showNotice("친구를 삭제했어요.");
    },
  });

  function handleEmailChange(nextEmail: string) {
    setEmailInput(nextEmail);
    setSelectedMember(null);
  }

  function handleSelectMember(member: MemberSearchResult) {
    setSelectedMember(member);
    setEmailInput(member.email);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!emailPattern.test(normalizedEmailInput)) {
      showNotice("이메일 형식을 확인해주세요.");
      return;
    }

    if (!exactMember || !selectedMember) {
      showNotice("검색 결과에서 친구를 선택해주세요.");
      return;
    }

    if (selectedMember.userId === user?.id) {
      showNotice("내 계정으로는 친구 요청을 보낼 수 없어요.");
      return;
    }

    if (existingFriendUserIds.has(selectedMember.userId)) {
      showNotice("이미 친구인 사용자예요.");
      return;
    }

    if (pendingRequestUserIds.has(selectedMember.userId)) {
      showNotice("이미 처리 대기 중인 요청이 있어요.");
      return;
    }

    requestMutation.mutate(selectedMember.userId);
  }

  function sendFriendRequest(member: MemberSearchResult) {
    setSelectedMember(member);

    if (existingFriendUserIds.has(member.userId)) {
      showNotice("이미 친구인 사용자예요.");
      return;
    }

    if (pendingRequestUserIds.has(member.userId)) {
      showNotice("이미 처리 대기 중인 요청이 있어요.");
      return;
    }

    requestMutation.mutate(member.userId);
  }

  const pendingError =
    requestMutation.error ??
    acceptMutation.error ??
    rejectMutation.error ??
    cancelMutation.error ??
    deleteMutation.error;
  const isMutating =
    requestMutation.isPending ||
    acceptMutation.isPending ||
    rejectMutation.isPending ||
    cancelMutation.isPending ||
    deleteMutation.isPending;

  return (
    <section className="min-h-screen bg-white px-4 pt-[calc(16px+env(safe-area-inset-top))] pb-[calc(96px+env(safe-area-inset-bottom))] text-[#111]">
      <header className="flex items-center gap-3">
        <button
          aria-label="뒤로 가기"
          className="grid size-9 flex-none place-items-center rounded-full bg-transparent text-[#333]"
          onClick={() => navigate(-1)}
          type="button"
        >
          <ChevronLeft size={23} />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="m-0 text-lg leading-tight font-black">
            친구 관리
          </h1>
        </div>
      </header>

      <form
        className="relative z-20 mt-5 bg-white"
        onSubmit={handleSubmit}
      >
        <label className="text-sm font-black text-[#333]" htmlFor="friend-email">
          이메일로 친구 검색
        </label>
        <div className="relative mt-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9A958E]" size={18} />
          <input
            autoComplete="off"
            className="h-11 w-full rounded-xl border border-[#E1DDD5] bg-[#FAF9F6] px-10 text-sm font-bold outline-none transition placeholder:text-xs placeholder:font-bold focus:border-[#1F3D35] focus:bg-white"
            id="friend-email"
            inputMode="email"
            onChange={(event) => handleEmailChange(event.target.value)}
            placeholder="friend@example.com"
            type="email"
            value={emailInput}
          />
        </div>

        <AnimatePresence>
        {normalizedEmailInput.length >= 2 ? (
        <motion.div
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="absolute inset-x-0 top-[calc(100%+6px)] z-30 max-h-72 origin-top overflow-y-auto rounded-xl border border-[#EEEAE3] bg-white shadow-[0_18px_34px_rgba(17,17,17,0.16)]"
          exit={{ opacity: 0, y: -4, scale: 0.98 }}
          initial={{ opacity: 0, y: -4, scale: 0.98 }}
          transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
        >
          {membersQuery.isLoading ? (
            <p className="m-0 px-3 py-3 text-xs font-bold text-[#8B857C]">
              회원을 검색하는 중이에요.
            </p>
          ) : searchResults.length === 0 ? (
            <p className="m-0 px-3 py-3 text-xs font-bold text-[#D5483D]">
              일치하는 회원이 없어 친구 요청을 보낼 수 없어요.
            </p>
          ) : (
            searchResults.map((member) => {
              const isSelected = selectedMember?.userId === member.userId;
              const isExistingFriend = existingFriendUserIds.has(member.userId);
              const isPending = pendingRequestUserIds.has(member.userId);

              return (
                <div
                  className={`flex min-h-14 w-full items-center gap-3 border-0 px-3 text-left ${
                    isSelected ? "bg-[#EEF4EF]" : "bg-white"
                  }`}
                  key={member.userId}
                  onClick={() => handleSelectMember(member)}
                >
                  <span className="grid size-9 flex-none place-items-center rounded-full bg-[#DDEADB] text-xs font-black text-[#1F3D35]">
                    {getInitial(getDisplayName(member))}
                  </span>
                  <span className="min-w-0 flex-1">
                    <strong className="block truncate text-sm font-black">
                      {getDisplayName(member)}
                    </strong>
                    <small className="mt-0.5 block truncate text-xs font-bold text-[#8B857C]">
                      {member.email}
                    </small>
                  </span>
                  {isExistingFriend || isPending ? (
                    <span className="text-xs font-black text-[#746F67]">
                      {isExistingFriend ? "친구" : "대기중"}
                    </span>
                  ) : (
                    <button
                      aria-label={`${getDisplayName(member)}에게 친구 요청 보내기`}
                      className="grid size-9 flex-none place-items-center rounded-lg bg-[#1F3D35] text-white transition-transform active:scale-95 disabled:opacity-50"
                      disabled={requestMutation.isPending}
                      onClick={(event) => {
                        event.stopPropagation();
                        handleSelectMember(member);
                        sendFriendRequest(member);
                      }}
                      type="button"
                    >
                      <Send size={17} />
                    </button>
                  )}
                </div>
              );
            })
          )}
        </motion.div>
        ) : null}
        </AnimatePresence>

        {requestMutation.error ? (
          <p className="mt-3 mb-0 text-xs font-bold text-[#D5483D]">
            {getAuthErrorMessage(requestMutation.error)}
          </p>
        ) : null}
      </form>

      <div className="mt-4 grid grid-cols-3 rounded-xl bg-[#F2F3F5] p-1">
        {tabs.map((tab) => (
          <button
            className={`min-h-10 rounded-lg text-xs font-black transition ${
              activeTab === tab.value
                ? "bg-[#1F3D35] text-white"
                : "bg-transparent text-[#746F67]"
            }`}
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>

      <section className="mt-4">
        {activeTab === "friends" ? (
          <FriendList
            emailByUserId={emailByUserId}
            friends={friendsQuery.data ?? []}
            isLoading={friendsQuery.isLoading}
            onDelete={(friendshipId) => deleteMutation.mutate(friendshipId)}
            pending={isMutating}
          />
        ) : null}
        {activeTab === "received" ? (
          <ReceivedRequestList
            emailByUserId={emailByUserId}
            onAccept={(friendshipId) => acceptMutation.mutate(friendshipId)}
            onReject={(friendshipId) => rejectMutation.mutate(friendshipId)}
            pending={isMutating}
            requests={receivedRequestsQuery.data ?? []}
            isLoading={receivedRequestsQuery.isLoading}
          />
        ) : null}
        {activeTab === "sent" ? (
          <SentRequestList
            emailByUserId={emailByUserId}
            onCancel={(friendshipId) => cancelMutation.mutate(friendshipId)}
            pending={isMutating}
            requests={sentRequestsQuery.data ?? []}
            isLoading={sentRequestsQuery.isLoading}
          />
        ) : null}
      </section>

      {pendingError && pendingError !== requestMutation.error ? (
        <p className="mt-4 rounded-xl bg-[#FFF0EE] px-3 py-2 text-xs font-bold text-[#D5483D]">
          {getAuthErrorMessage(pendingError)}
        </p>
      ) : null}

      {notice ? (
        <div className="fixed inset-x-5 bottom-[calc(24px+env(safe-area-inset-bottom))] z-[90] mx-auto max-w-[390px] rounded-2xl bg-[#171717] px-4 py-3 text-center text-sm font-black text-white shadow-xl">
          {notice}
        </div>
      ) : null}
    </section>
  );
}

function FriendList({
  emailByUserId,
  friends,
  isLoading,
  onDelete,
  pending,
}: {
  emailByUserId: Map<string, string>;
  friends: Friend[];
  isLoading: boolean;
  onDelete: (friendshipId: number) => void;
  pending: boolean;
}) {
  if (isLoading) return <FriendListSkeleton />;
  if (friends.length === 0) return <EmptyState message="아직 친구가 없어요." />;

  return (
    <div className="grid gap-2">
      {friends.map((friend, index) => (
        <motion.article
          animate={{ opacity: 1, y: 0 }}
          className="flex min-h-15 items-center gap-3 rounded-xl bg-[#F7F8F9] px-3"
          initial={{ opacity: 0, y: 8 }}
          key={friend.friendshipId}
          transition={{ delay: Math.min(index * 0.035, 0.18), duration: 0.18 }}
        >
          <span className="grid size-11 flex-none place-items-center rounded-full bg-[#DDEADB] text-sm font-black text-[#1F3D35]">
            {getInitial(friend.displayName)}
          </span>
          <span className="min-w-0 flex-1">
            <strong className="block truncate text-sm font-black">
              {friend.displayName}
            </strong>
            <small className="mt-1 block truncate text-xs font-bold text-[#8B857C]">
              {friend.email || emailByUserId.get(friend.userId) || friend.userId}
            </small>
          </span>
          <button
            aria-label={`${friend.displayName} 친구 삭제`}
            className="grid size-9 flex-none place-items-center rounded-full bg-[#FFF0EE] text-[#D5483D] disabled:opacity-50"
            disabled={pending}
            onClick={() => onDelete(friend.friendshipId)}
            type="button"
          >
            <X size={18} />
          </button>
        </motion.article>
      ))}
    </div>
  );
}

function ReceivedRequestList({
  emailByUserId,
  isLoading,
  onAccept,
  onReject,
  pending,
  requests,
}: {
  emailByUserId: Map<string, string>;
  isLoading: boolean;
  onAccept: (friendshipId: number) => void;
  onReject: (friendshipId: number) => void;
  pending: boolean;
  requests: Friendship[];
}) {
  if (isLoading) return <FriendListSkeleton withActions />;
  if (requests.length === 0) return <EmptyState message="받은 친구 요청이 없어요." />;

  return (
    <div className="grid gap-2">
      {requests.map((request, index) => (
        <RequestCard
          actions={
            <>
              <button
                aria-label="친구 요청 수락"
                className="grid size-10 place-items-center rounded-full bg-[#1F3D35] text-white transition-transform active:scale-95 disabled:opacity-50"
                disabled={pending}
                onClick={() => onAccept(request.id)}
                type="button"
              >
                <Check size={18} />
              </button>
              <button
                aria-label="친구 요청 거절"
                className="grid size-10 place-items-center rounded-full bg-[#FFF0EE] text-[#D5483D] transition-transform active:scale-95 disabled:opacity-50"
                disabled={pending}
                onClick={() => onReject(request.id)}
                type="button"
              >
                <X size={18} />
              </button>
            </>
          }
          displayName={request.requesterDisplayName}
          key={request.id}
          order={index}
          secondaryText={
            request.requesterEmail ||
            emailByUserId.get(request.requesterUserId) ||
            request.requesterUserId
          }
        />
      ))}
    </div>
  );
}

function SentRequestList({
  emailByUserId,
  isLoading,
  onCancel,
  pending,
  requests,
}: {
  emailByUserId: Map<string, string>;
  isLoading: boolean;
  onCancel: (friendshipId: number) => void;
  pending: boolean;
  requests: Friendship[];
}) {
  if (isLoading) return <FriendListSkeleton withActions />;
  if (requests.length === 0) return <EmptyState message="보낸 친구 요청이 없어요." />;

  return (
    <div className="grid gap-2">
      {requests.map((request, index) => (
        <RequestCard
          actions={
            <button
              aria-label="친구 요청 취소"
              className="grid size-10 place-items-center rounded-full bg-[#FFF0EE] text-[#D5483D] transition-transform active:scale-95 disabled:opacity-50"
              disabled={pending}
              onClick={() => onCancel(request.id)}
              type="button"
            >
              <X size={18} />
            </button>
          }
          displayName={request.addresseeDisplayName}
          key={request.id}
          order={index}
          secondaryText={
            request.addresseeEmail ||
            emailByUserId.get(request.addresseeUserId) ||
            request.addresseeUserId
          }
        />
      ))}
    </div>
  );
}

function RequestCard({
  actions,
  displayName,
  order = 0,
  secondaryText,
}: {
  actions: React.ReactNode;
  displayName: string;
  order?: number;
  secondaryText: string;
}) {
  return (
    <motion.article
      animate={{ opacity: 1, y: 0 }}
      className="flex min-h-15 items-center gap-3 rounded-xl bg-[#F7F8F9] px-3"
      initial={{ opacity: 0, y: 8 }}
      transition={{ delay: Math.min(order * 0.035, 0.18), duration: 0.18 }}
    >
      <span className="grid size-11 flex-none place-items-center rounded-full bg-[#E2E0F8] text-sm font-black text-[#4D3C9F]">
        {getInitial(displayName)}
      </span>
      <span className="min-w-0 flex-1">
        <strong className="block truncate text-sm font-black">{displayName}</strong>
        <small className="mt-1 block truncate text-xs font-bold text-[#8B857C]">
          {secondaryText}
        </small>
      </span>
      <span className="flex flex-none gap-2">{actions}</span>
    </motion.article>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="grid min-h-32 place-items-center rounded-xl bg-[#F7F8F9] px-3 text-center text-sm font-black text-[#8B857C]">
      <span>
        <UserPlus className="mx-auto mb-3 text-[#C9C2B7]" size={27} />
        {message}
      </span>
    </div>
  );
}

function FriendListSkeleton({ withActions = false }: { withActions?: boolean }) {
  return (
    <div className="grid gap-2">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          className="flex min-h-15 items-center gap-3 rounded-xl bg-[#F7F8F9] px-3"
          key={index}
        >
          <Skeleton className="size-11 flex-none rounded-full" />
          <span className="min-w-0 flex-1">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="mt-2 h-3 w-40" />
          </span>
          {withActions ? (
            <span className="flex flex-none gap-2">
              <Skeleton className="size-10 rounded-full" />
              <Skeleton className="size-10 rounded-full" />
            </span>
          ) : (
            <Skeleton className="size-9 flex-none rounded-full" />
          )}
        </div>
      ))}
    </div>
  );
}
