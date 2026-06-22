import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthUser } from "@/features/auth/authStore";
import { NoteCard } from "@/features/notes/components/NoteCard";
import {
  deleteNote,
  getSavedNotes,
  savedNotesQueryKey,
  type NoteResponse,
} from "@/features/notes/noteApi";
import { resolveNoteImageUrl } from "@/features/notes/noteImage";

export function MyNotesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: user } = useAuthUser();
  const notesQuery = useQuery({
    queryFn: () => getSavedNotes(),
    queryKey: savedNotesQueryKey,
  });
  const myNotes = (notesQuery.data ?? []).filter(
    (note) => note.authorUserId === user?.id,
  );
  const deleteMutation = useMutation({
    mutationFn: deleteNote,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: savedNotesQueryKey });
    },
  });

  function handleDelete(note: NoteResponse) {
    if (window.confirm(`“${note.title || "쪽지"}”를 삭제할까요?`)) {
      deleteMutation.mutate(note.id);
    }
  }

  return (
    <section className="min-h-screen bg-white px-5 pt-[calc(20px+env(safe-area-inset-top))] pb-[calc(96px+env(safe-area-inset-bottom))] text-[#171717]">
      <header className="flex items-center gap-3">
        <button
          aria-label="마이페이지로 돌아가기"
          className="grid size-10 place-items-center rounded-full bg-[#F4F3EF]"
          onClick={() => navigate("/my")}
          type="button"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <p className="m-0 text-xs font-black tracking-[0.12em] text-[#8B857C]">
            MY NOTES
          </p>
          <h1 className="mt-1 mb-0 text-2xl font-black">내 쪽지</h1>
        </div>
      </header>

      {notesQuery.isPending ? (
        <StateMessage>쪽지를 불러오는 중...</StateMessage>
      ) : notesQuery.isError ? (
        <StateMessage error>
          {notesQuery.error instanceof Error
            ? notesQuery.error.message
            : "쪽지를 불러오지 못했습니다."}
        </StateMessage>
      ) : myNotes.length === 0 ? (
        <StateMessage>아직 작성한 쪽지가 없어요.</StateMessage>
      ) : (
        <div className="mt-6 grid gap-5">
          {myNotes.map((note) => (
            <article className="relative" key={note.id}>
              <NoteCard
                note={{
                  authorName: user?.name ?? note.authorUserId,
                  body: note.content,
                  createdAt: note.createdAt,
                  id: String(note.id),
                  imageAlt: note.regionName,
                  imageUrl: resolveNoteImageUrl(note.imageObjectKey),
                  locationLabel: note.regionName || "위치 정보 없음",
                  profileImageUrl: user?.profileImageUrl,
                  saved: true,
                }}
                wide
              />
              <div className="absolute top-3 right-3 z-10 flex gap-1.5">
                <button
                  aria-label="쪽지 수정"
                  className="grid size-9 place-items-center rounded-full bg-white/92 text-[#3F3B36] shadow-[0_4px_12px_rgba(17,17,17,0.14)] backdrop-blur"
                  onClick={() =>
                    navigate(`/note/${note.id}/edit`, { state: { note } })
                  }
                  type="button"
                >
                  <Pencil size={16} />
                </button>
                <button
                  aria-label="쪽지 삭제"
                  className="grid size-9 place-items-center rounded-full bg-[#FFF0EE]/95 text-[#D5483D] shadow-[0_4px_12px_rgba(17,17,17,0.12)] backdrop-blur disabled:opacity-50"
                  disabled={deleteMutation.isPending}
                  onClick={() => handleDelete(note)}
                  type="button"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {deleteMutation.isError ? (
        <p className="mt-3 mb-0 text-center text-sm font-bold text-[#D5483D]">
          {deleteMutation.error instanceof Error
            ? deleteMutation.error.message
            : "쪽지를 삭제하지 못했습니다."}
        </p>
      ) : null}
    </section>
  );
}

function StateMessage({
  children,
  error = false,
}: {
  children: ReactNode;
  error?: boolean;
}) {
  return (
    <p
      className={`mt-6 rounded-2xl p-5 text-sm font-bold ${
        error ? "bg-[#FFF0EE] text-[#D5483D]" : "bg-[#F6F5F1] text-[#746F67]"
      }`}
    >
      {children}
    </p>
  );
}
