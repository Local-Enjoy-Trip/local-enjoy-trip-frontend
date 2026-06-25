import { useAuthUser } from "@/features/auth/authStore";
import { homeLocationOptions } from "@/features/home/types/homeTypes";
import {
  createNote,
  getSavedNotes,
  myNotesQueryKey,
  savedNotesQueryKey,
  updateNote,
  uploadNoteImage,
  type NoteCategory,
  type NoteResponse,
  type NoteVisibility,
} from "@/features/notes/noteApi";
import { resolveNoteImageUrl } from "@/features/notes/noteImage";
import type { NoteLocationSelection } from "@/pages/NoteLocationPage";
import type { Visibility } from "@/shared/types/domain";
import { PageLoadingSkeleton } from "@/shared/ui/Skeleton";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Check,
  ChevronDown,
  ChevronRight,
  Globe2,
  ImagePlus,
  LockKeyhole,
  Plus,
  Users,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

const MAX_BODY_LENGTH = 80;
const defaultNoteLocation = homeLocationOptions[0];
const noteDraftStorageKey = "spot-note-draft";
const defaultNoteTags: string[] = [];
const visibilityOptions = [
  { value: "public", label: "전체공개", shortLabel: "전체", Icon: Globe2 },
  { value: "friends", label: "친구공개", shortLabel: "친구", Icon: Users },
  { value: "private", label: "나만보기", shortLabel: "나만", Icon: LockKeyhole },
] as const;

const categoryByTag: Record<string, NoteCategory> = {
  꿀팁: "TIP",
  맛집: "BEST",
  책: "BOOK",
  영화: "MOVIE",
  음악: "MUSIC",
  이동: "TRANSIT_TIP",
};

type NoteDraft = {
  body: string;
  imagePreview: string | null;
  location: NoteLocationSelection;
  tags: string[];
  visibility: Visibility;
};

type CreateNoteRouteState = {
  note?: NoteResponse;
  noteLocation?: NoteLocationSelection;
  returnTo?: string;
};

function getDefaultLocation(): NoteLocationSelection {
  return {
    address: defaultNoteLocation.weatherArea,
    coordinates: defaultNoteLocation.coordinates,
    name: defaultNoteLocation.label,
  };
}

function readDraft(): NoteDraft {
  const fallbackDraft: NoteDraft = {
    body: "",
    imagePreview: null,
    location: getDefaultLocation(),
    tags: defaultNoteTags,
    visibility: "friends",
  };

  try {
    const savedDraft = window.sessionStorage.getItem(noteDraftStorageKey);

    if (!savedDraft) {
      return fallbackDraft;
    }

    return {
      ...fallbackDraft,
      ...JSON.parse(savedDraft),
    };
  } catch {
    return fallbackDraft;
  }
}

function writeDraft(draft: NoteDraft) {
  try {
    window.sessionStorage.setItem(noteDraftStorageKey, JSON.stringify(draft));
  } catch {
    try {
      window.sessionStorage.setItem(
        noteDraftStorageKey,
        JSON.stringify({ ...draft, imagePreview: null })
      );
    } catch {
      // Keep navigation available even when the browser refuses draft storage.
    }
  }
}

export function CreateNotePage() {
  const navigate = useNavigate();
  const { data: user } = useAuthUser();
  const { noteId } = useParams();
  const queryClient = useQueryClient();
  const routeLocation = useLocation();
  const routeState = routeLocation.state as CreateNoteRouteState | null;
  const routeNote = routeState?.note;
  const parsedNoteId = noteId ? Number(noteId) : null;
  const editNoteQuery = useQuery({
    enabled: Boolean(parsedNoteId) && !routeNote,
    queryFn: () => getSavedNotes(),
    queryKey: savedNotesQueryKey,
  });
  const editNote =
    routeNote ??
    editNoteQuery.data?.find((note) => note.id === parsedNoteId) ??
    null;
  const isEditing = parsedNoteId !== null;
  const submitReturnTo = routeState?.returnTo ?? (isEditing ? "/my/notes" : "/my");
  const locationReturnTo = isEditing && parsedNoteId !== null
    ? `/note/${parsedNoteId}/edit`
    : "/note/new";
  const initialDraft = readDraft();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hydratedEditNoteIdRef = useRef<number | null>(null);
  const [noteLocation, setNoteLocation] = useState<NoteLocationSelection>(
    routeState?.noteLocation ?? initialDraft.location
  );
  const [body, setBody] = useState(initialDraft.body);
  const [imagePreview, setImagePreview] = useState<string | null>(
    initialDraft.imagePreview
  );
  const [tagValues, setTagValues] = useState<string[]>(
    initialDraft.tags ?? defaultNoteTags
  );
  const [visibility, setVisibility] = useState<Visibility>(
    initialDraft.visibility
  );
  const [isVisibilityOpen, setIsVisibilityOpen] = useState(false);
  const selectedVisibility =
    visibilityOptions.find((option) => option.value === visibility) ??
    visibilityOptions[1];
  const displayName = user?.nickname ?? user?.realName ?? user?.name ?? "서울다람쥐";
  useEffect(() => {
    if (routeState?.noteLocation) return;
    if (!editNote || hydratedEditNoteIdRef.current === editNote.id) return;

    hydratedEditNoteIdRef.current = editNote.id;
    setBody(editNote.content);
    setImagePreview(resolveNoteImageUrl(editNote.imageObjectKey) ?? null);
    setNoteLocation({
      address: editNote.regionName || "위치 정보 없음",
      coordinates: { lat: editNote.latitude, lng: editNote.longitude },
      name: editNote.regionName || "선택한 위치",
    });
    setVisibility(editNote.visibility.toLowerCase() as Visibility);
  }, [editNote, routeState?.noteLocation]);

  const noteMutation = useMutation({
    mutationFn: async () => {
      const trimmedTags = tagValues.map((tag) => tag.trim()).filter(Boolean);
      const image = imagePreview?.startsWith("data:")
        ? await uploadNoteImage(imagePreview)
        : editNote?.imageObjectKey && imagePreview
          ? {
              contentType: getImageContentType(editNote.imageObjectKey),
              objectKey: editNote.imageObjectKey,
              publicUrl: imagePreview,
            }
          : undefined;
      const request = {
        category:
          editNote?.category ?? categoryByTag[trimmedTags[0]] ?? "UNCATEGORIZED",
        content: body.trim(),
        image,
        latitude: noteLocation.coordinates.lat,
        longitude: noteLocation.coordinates.lng,
        regionName: noteLocation.name,
        // 지도 목록 응답은 content 없이 title만 제공하므로 본문 요약을 함께 저장합니다.
        title: body.trim().slice(0, 100),
        visibility: visibility.toUpperCase() as NoteVisibility,
      };

      if (isEditing && parsedNoteId !== null) {
        return updateNote(parsedNoteId, request);
      }

      return createNote(request);
    },
    onSuccess: async () => {
      window.sessionStorage.removeItem(noteDraftStorageKey);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: myNotesQueryKey }),
        queryClient.invalidateQueries({ queryKey: savedNotesQueryKey }),
      ]);
      navigate(submitReturnTo, { replace: true });
    },
  });

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => setImagePreview(String(reader.result));
    reader.readAsDataURL(file);
  }

  function handleImageRemove() {
    setImagePreview(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (body.trim()) noteMutation.mutate();
  }

  function openLocationPage() {
    writeDraft({
      body,
      imagePreview,
      location: noteLocation,
      tags: tagValues,
      visibility,
    });

    navigate("/note/location", {
      state: {
        note: editNote ?? routeNote ?? undefined,
        noteLocation,
        noteReturnTo: submitReturnTo,
        returnTo: locationReturnTo,
      },
    });
  }

  function updateTag(index: number, value: string) {
    setTagValues((currentTags) =>
      currentTags.map((tag, tagIndex) =>
        tagIndex === index ? value.replace(/^#/, "") : tag
      )
    );
  }

  function addTag() {
    setTagValues((currentTags) => [...currentTags, ""]);
  }

  function removeTag(index: number) {
    setTagValues((currentTags) =>
      currentTags.filter((_, tagIndex) => tagIndex !== index)
    );
  }

  if (isEditing && editNoteQuery.isPending && !routeNote) {
    return <PageLoadingSkeleton type="list" />;
  }

  if (isEditing && !editNote) {
    return (
      <section className="grid min-h-screen place-items-center bg-white p-6 text-center">
        <div>
          <h1 className="m-0 text-xl font-black">쪽지를 찾지 못했어요</h1>
          <button
            className="mt-4 h-11 rounded-xl bg-[#1F3D35] px-4 text-sm font-black text-white"
            onClick={() => navigate("/my/notes")}
            type="button"
          >
            내 쪽지로 돌아가기
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-dvh bg-white px-4 pt-[calc(34px+env(safe-area-inset-top))] pb-[calc(32px+env(safe-area-inset-bottom))] text-[#202020]">
      <header>
        <h1 className="m-0 text-2xl leading-tight font-extrabold tracking-[-0.02em]">
          {displayName}님의 쪽지
        </h1>
        <p className="mt-3 mb-0 text-sm font-medium text-[#202020]">
          이 곳에 대한 나만의 추억 혹은 꿀팁을 남겨주세요
        </p>
      </header>

      <form className="mt-8 grid gap-0" onSubmit={handleSubmit}>
        <input
          ref={fileInputRef}
          className="sr-only"
          type="file"
          accept="image/*"
          onChange={handleImageChange}
        />

        <section>
          <h2 className="mt-2 m-0 text-sm font-extrabold">쪽지 위치</h2>
          <button
            aria-label="쪽지 위치 변경"
            className="flex w-full items-center justify-between gap-4 bg-white p-0 text-left text-[#202020]"
            onClick={openLocationPage}
            type="button"
          >
            <div className="min-w-0">
              <strong className="mt-4 block truncate text-[0.95rem] font-black">
                {noteLocation.name}
              </strong>
              <p className="mt-1.5 mb-0 truncate text-xs font-bold text-[#8D8D8D]">
                {noteLocation.address}
              </p>
            </div>
            <span className="grid size-12 flex-none items-end justify-center text-[#FF4300]">
              <ChevronRight size={21} strokeWidth={2.8} />
            </span>
          </button>

          <div className="mt-5 w-[116px] flex items-center justify-center border border-gray-300 rounded-[20px]">
            <AnimatePresence mode="wait">
              {imagePreview ? (
                <motion.div
                  className="relative aspect-square overflow-hidden rounded-xl bg-[#F5F3F1]"
                  key="preview"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.18 }}
                >
                  <img
                    className="h-full w-full object-cover"
                    src={imagePreview}
                    alt="첨부 사진 미리보기"
                  />
                  <div className="absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-black/55 to-transparent p-2 pt-8">
                    <button
                      className="rounded-full bg-white/90 px-2 py-1 text-[0.62rem] font-black text-[#333] backdrop-blur-md"
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      변경
                    </button>
                    <button
                      className="grid size-7 place-items-center rounded-full bg-black/35 text-white backdrop-blur-md"
                      type="button"
                      onClick={handleImageRemove}
                      aria-label="첨부 사진 삭제"
                    >
                      <X size={16} strokeWidth={2.5} />
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.button
                  className="grid aspect-square p-5 place-items-center rounded-xl bg-[#F5F3F1] text-center transition-transform active:scale-[0.99]"
                  key="empty"
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  aria-label="사진 한 장 첨부"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <span>
                    <span className="mx-auto grid size-9 place-items-center rounded-xl bg-[#FF2F12] text-white">
                      <ImagePlus size={18} strokeWidth={2.3} />
                    </span>
                    <strong className="mt-2.5 block text-[0.68rem] font-black text-[#56514D]">
                      사진
                    </strong>
                    <small className="mt-1 block text-[0.58rem] font-bold text-[#9A9691]">
                      한 장 추가
                    </small>
                  </span>
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </section>

        <section className="mt-10">
          <h2 className="m-0 text-sm font-extrabold">쪽지 내용</h2>
          <label className="mt-3 block">
            <span className="sr-only">쪽지 내용</span>
            <div className="relative">
              <textarea
                className="min-h-[120px] w-full resize-none rounded-2xl border border-[#E8E4DF] bg-white px-4 py-4 text-sm leading-relaxed text-[#2D2D2D] outline-none placeholder:font-bold placeholder:text-[#B7B3AE] focus:border-[#FF4300] focus:ring-3 focus:ring-[#FF4300]/10"
                maxLength={MAX_BODY_LENGTH}
                onChange={(event) =>
                  setBody(event.target.value.slice(0, MAX_BODY_LENGTH))
                }
                placeholder="이 장소에서 남기고 싶은 한 줄을 적어보세요."
                value={body}
              />
              <span
                className={`pointer-events-none absolute right-4 bottom-3 text-[0.68rem] font-bold ${
                  body.length >= MAX_BODY_LENGTH
                    ? "text-[#FF4300]"
                    : "text-[#C8C4BF]"
                }`}
              >
                {body.length}/{MAX_BODY_LENGTH}
              </span>
            </div>
          </label>
        </section>

        <section className="mt-5 grid gap-4">
          <div className="grid grid-cols-[42px_1fr] items-center gap-2">
            <h2 className="m-0 text-sm font-extrabold">태그</h2>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none [&::-webkit-scrollbar]:hidden">
                {tagValues.map((tag, index) => (
                  <label
                    className="inline-flex h-8 min-w-0 flex-none items-center gap-1 rounded-none bg-[#F5F5F5] px-2 text-xs font-bold text-[#4A4641]"
                    key={index}
                  >
                    <span className="font-black text-[#FF4300]">#</span>
                    <input
                      className="w-10 min-w-0 border-0 bg-transparent text-xs font-bold text-[#4A4641] outline-none"
                      maxLength={6}
                      onChange={(event) => updateTag(index, event.target.value)}
                      placeholder="태그"
                      value={tag}
                    />
                    <button
                      aria-label={`${tag || "태그"} 태그 삭제`}
                      className="text-[#A8A8A8]"
                      onClick={() => removeTag(index)}
                      type="button"
                    >
                      <X size={11} strokeWidth={2.6} />
                    </button>
                  </label>
                ))}
                <button
                  aria-label="태그 추가"
                  className="grid size-8 flex-none place-items-center bg-[#F5F5F5] text-[#A8A8A8] transition-colors hover:text-[#FF4300]"
                  onClick={addTag}
                  type="button"
                >
                  <Plus size={15} strokeWidth={2.8} />
                </button>
              </div>
            </div>
          </div>

          <div className="relative grid grid-cols-[70px_1fr] items-center gap-2">
            <h2 className="m-0 text-sm font-extrabold">공개 범위</h2>
            <div className="flex justify-end">
              <button
                aria-expanded={isVisibilityOpen}
                className="inline-flex h-9 items-center rounded-none bg-[#F2F2F2] text-[#171717]"
                onClick={() => setIsVisibilityOpen((isOpen) => !isOpen)}
                type="button"
              >
                <span className="inline-flex h-full items-center gap-1 px-2.5 text-sm font-extrabold">
                  {selectedVisibility.shortLabel}
                  <selectedVisibility.Icon size={14} strokeWidth={2.4} />
                </span>
                <span className="grid h-full w-9 place-items-center border-l border-white/75">
                  <ChevronDown
                    className={isVisibilityOpen ? "rotate-180" : ""}
                    size={18}
                    strokeWidth={2.8}
                  />
                </span>
              </button>
            </div>

            {isVisibilityOpen ? (
              <div className="absolute top-[calc(100%+8px)] right-0 z-20 grid w-[166px] gap-1 rounded-2xl border border-[#EEEEEE] bg-white p-1.5 shadow-[0_16px_34px_rgba(17,17,17,0.12)]">
                {visibilityOptions.map(({ value, label, Icon }) => {
                  const isSelected = visibility === value;

                  return (
                    <button
                      className={`flex min-h-10 items-center gap-2 rounded-xl px-3 text-left text-xs font-black ${
                        isSelected
                          ? "bg-[#FFF0EA] text-[#FF4300]"
                          : "text-[#5F5B56]"
                      }`}
                      key={value}
                      type="button"
                      onClick={() => {
                        setVisibility(value);
                        setIsVisibilityOpen(false);
                      }}
                    >
                      <Icon size={15} strokeWidth={2.3} />
                      {label}
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>
          <div aria-hidden="true" className="h-[146px]" />
        </section>

        <button
          className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-[20px] border border-transparent bg-[#FF4300] text-sm font-black text-white shadow-[0_12px_24px_rgba(255,67,0,0.18)] transition-[opacity,transform,box-shadow] active:scale-[0.99] disabled:border-[#FFD3C4] disabled:bg-[#FFF1EC] disabled:text-[#D97A5D] disabled:shadow-none"
          disabled={!body.trim() || noteMutation.isPending}
          type="submit"
        >
          {body.trim() && !noteMutation.isPending ? (
            <Check size={19} strokeWidth={3} />
          ) : null}
          {noteMutation.isPending
            ? isEditing
              ? "수정 중..."
              : "등록 중..."
            : isEditing
              ? "수정 완료"
              : "등록하기"}
        </button>
        {noteMutation.isError ? (
          <p className="-mt-3 mb-0 text-center text-sm font-bold text-[#D5483D]">
            {noteMutation.error instanceof Error
              ? noteMutation.error.message
              : `쪽지를 ${isEditing ? "수정" : "등록"}하지 못했습니다.`}
          </p>
        ) : null}
      </form>
    </section>
  );
}

function getImageContentType(objectKey: string) {
  const extension = objectKey.split(".").pop()?.toLowerCase();
  if (extension === "png") return "image/png";
  if (extension === "webp") return "image/webp";
  if (extension === "gif") return "image/gif";
  return "image/jpeg";
}
