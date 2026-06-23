import {
  authUserQueryKey,
  logout,
  uploadProfileImage,
  useAuthUser,
} from "@/features/auth/authStore";
import { friendsQueryKey, getFriends } from "@/features/friends/friendApi";
import { getSavedNotes, savedNotesQueryKey } from "@/features/notes/noteApi";
import { courses } from "@/shared/data/mockData";
import { PageLoadingSkeleton } from "@/shared/ui/Skeleton";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import {
  Bookmark,
  ChevronRight,
  LogOut,
  MapPinned,
  Pencil,
  UserRound,
  UsersRound,
} from "lucide-react";
import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

function LoginPrompt() {
  const navigate = useNavigate();

  return (
    <section className="min-h-[calc(100dvh-72px)] bg-white px-5 pt-[calc(22px+env(safe-area-inset-top))] pb-4 text-[#111]">
      <header className="text-center">
        <h1 className="m-0 text-base font-extrabold">마이페이지</h1>
      </header>
      <article className="mt-8 rounded-2xl bg-[#F7F6F2] p-5">
        <div className="grid size-12 place-items-center rounded-full bg-[#1F3D35] text-white">
          <UserRound size={25} strokeWidth={2.4} />
        </div>
        <h2 className="mt-4 mb-0 text-lg font-black">로그인이 필요해요</h2>
        <p className="mt-2 mb-0 text-sm leading-relaxed font-semibold text-[#746F67]">
          저장한 쪽지와 친구 요청을 계정에 연결해 관리할 수 있어요.
        </p>
        <button
          className="mt-5 flex h-12 w-full items-center justify-center rounded-xl bg-[#1F3D35] text-sm font-black text-white"
          onClick={() => navigate("/login")}
          type="button"
        >
          로그인하기
        </button>
      </article>
    </section>
  );
}

export function MyPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const profileImageInputRef = useRef<HTMLInputElement | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const { data: user, isLoading } = useAuthUser();
  const savedNotesQuery = useQuery({
    enabled: Boolean(user),
    queryFn: () => getSavedNotes(),
    queryKey: savedNotesQueryKey,
  });
  const friendsQuery = useQuery({
    enabled: Boolean(user),
    queryFn: getFriends,
    queryKey: friendsQueryKey,
  });
  const friendCount = friendsQuery.data?.length ?? 0;
  const myNoteCount =
    savedNotesQuery.data?.filter((note) => note.authorUserId === user?.id).length ?? 0;
  const logoutMutation = useMutation({
    mutationFn: logout,
    onSettled: () => {
      setShowLogoutConfirm(false);
      queryClient.removeQueries({ queryKey: authUserQueryKey });
      navigate("/my", { replace: true });
    },
  });
  const profileImageMutation = useMutation({
    mutationFn: uploadProfileImage,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: authUserQueryKey });
    },
  });

  function handleProfileImageChange(file: File | undefined) {
    if (!file) return;
    profileImageMutation.mutate(file);
  }

  if (isLoading) {
    return <PageLoadingSkeleton type="profile" />;
  }

  if (!user) return <LoginPrompt />;

  return (
    <section className="min-h-[calc(100dvh-72px)] bg-white px-5 pt-[calc(20px+env(safe-area-inset-top))] pb-4 text-[#111]">
      <header className="text-center">
        <h1 className="m-0 text-base font-extrabold">마이페이지</h1>
      </header>

      <section className="mt-7">
        <div className="grid grid-cols-[96px_1fr] items-center gap-4">
          <div className="relative size-24">
            <div className="grid h-full w-full place-items-center overflow-hidden rounded-full bg-[#C9D1D9]">
              {user.profileImageUrl ? (
                <img
                  alt=""
                  className="h-full w-full object-cover"
                  src={user.profileImageUrl}
                />
              ) : (
                <UserRound className="text-[#69737D]" size={56} strokeWidth={1.65} />
              )}
            </div>
            <input
              accept="image/*"
              className="sr-only"
              onChange={(event) => {
                handleProfileImageChange(event.target.files?.[0]);
                event.target.value = "";
              }}
              ref={profileImageInputRef}
              type="file"
            />
            <button
              aria-label="프로필 사진 수정"
              className="absolute right-0 bottom-0 grid size-8 place-items-center rounded-full border-2 border-white bg-[#1F3D35] text-white shadow-[0_6px_14px_rgba(31,38,35,0.22)] disabled:opacity-60"
              disabled={profileImageMutation.isPending}
              onClick={() => profileImageInputRef.current?.click()}
              type="button"
            >
              <Pencil size={14} strokeWidth={2.7} />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              { label: "친구", value: friendCount },
              { label: "코스", value: courses.length },
              { label: "쪽지", value: myNoteCount },
            ].map((item) => (
              <div key={item.label}>
                <strong className="block text-xl font-black">{item.value}</strong>
                <span className="mt-0.5 block text-xs font-black text-[#34383D]">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 px-2">
          <div className="flex items-end gap-2">
            <h2 className="m-0 text-xl font-extrabold">{user.realName}</h2>
            {user.nickname && user.nickname !== user.realName ? (
              <span className="pb-0.5 text-sm font-black text-[#6F7780]">
                {user.nickname}
              </span>
            ) : null}
          </div>
          <p className="mt-1.5 mb-0 text-sm font-bold text-[#98A1AA]">
            {user.email}
          </p>
        </div>
      </section>

      <section className="mt-8 px-2">
        <div className="grid gap-1">
          <MenuButton
            icon={UsersRound}
            label="친구 관리"
            onClick={() => navigate("/friends")}
          />
          <MenuButton
            icon={Bookmark}
            label="내 쪽지"
            onClick={() => navigate("/my/notes")}
          />
          <MenuButton
            icon={MapPinned}
            label="내 코스"
            onClick={() => navigate("/course")}
          />
          <button
            className="flex min-h-14 w-full items-center gap-4 rounded-xl bg-white px-1 text-left text-[#D5483D] disabled:opacity-50"
            disabled={logoutMutation.isPending}
            onClick={() => setShowLogoutConfirm(true)}
            type="button"
          >
            <LogOut size={23} />
            <span className="min-w-0 flex-1 text-base font-semibold">
              {logoutMutation.isPending ? "로그아웃 중..." : "로그아웃"}
            </span>
          </button>
        </div>
      </section>

      <AnimatePresence>
        {showLogoutConfirm ? (
          <motion.div
            animate={{ opacity: 1 }}
            aria-modal="true"
            className="fixed inset-0 z-[100] grid place-items-center bg-black/35 px-5"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            role="dialog"
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            <motion.div
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="w-full max-w-[320px] rounded-2xl bg-white p-5 text-center shadow-[0_18px_42px_rgba(17,17,17,0.24)]"
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={{ type: "spring", stiffness: 420, damping: 32 }}
            >
              <h2 className="m-0 text-lg font-black text-[#111]">
                로그아웃 하시겠습니까?
              </h2>
              <div className="mt-5 grid grid-cols-2 gap-2">
                <button
                  className="h-11 rounded-xl bg-[#F1F3F5] text-sm font-black text-[#4F565E] disabled:opacity-50"
                  disabled={logoutMutation.isPending}
                  onClick={() => setShowLogoutConfirm(false)}
                  type="button"
                >
                  취소
                </button>
                <button
                  className="h-11 rounded-xl bg-[#D5483D] text-sm font-black text-white disabled:opacity-50"
                  disabled={logoutMutation.isPending}
                  onClick={() => logoutMutation.mutate()}
                  type="button"
                >
                  {logoutMutation.isPending ? "로그아웃 중..." : "로그아웃"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}

function MenuButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon: typeof UsersRound;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className="flex min-h-14 w-full items-center gap-4 rounded-xl bg-white px-1 text-left text-[#22272B]"
      onClick={onClick}
      type="button"
    >
      <Icon className="text-[#343A40]" size={23} strokeWidth={2.4} />
      <span className="min-w-0 flex-1 text-base font-semibold">{label}</span>
      <ChevronRight className="text-[#C0C6CC]" size={18} />
    </button>
  );
}
