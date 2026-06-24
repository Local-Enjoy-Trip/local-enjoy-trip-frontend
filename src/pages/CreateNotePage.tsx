import {
  ChevronDown,
  ChevronRight,
  Check,
  Globe2,
  ImagePlus,
  LockKeyhole,
  MapPin,
  PenLine,
  Users,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  createNote,
  getSavedNotes,
  saveNote,
  savedNotesQueryKey,
  updateNote,
  uploadNoteImage,
  type NoteCategory,
  type NoteResponse,
  type NoteVisibility,
} from "@/features/notes/noteApi";
import { resolveNoteImageUrl } from "@/features/notes/noteImage";
import { homeLocationOptions } from "@/features/home/types/homeTypes";
import type { NoteLocationSelection } from "@/pages/NoteLocationPage";
import type { Visibility } from "@/shared/types/domain";
import { PageLoadingSkeleton } from "@/shared/ui/Skeleton";

const MAX_BODY_LENGTH = 140;
const defaultNoteLocation = homeLocationOptions[0];
const noteDraftStorageKey = "spot-note-draft";
const defaultNoteTags = ["산책", "맛집", "카페"];
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

export function CreateNotePage() {
  const navigate = useNavigate();
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
    defaultNoteTags.map((defaultTag, index) =>
      initialDraft.tags[index] ?? defaultTag
    )
  );
  const [visibility, setVisibility] = useState<Visibility>(
    initialDraft.visibility
  );
  const [isVisibilityOpen, setIsVisibilityOpen] = useState(false);
  const selectedVisibility =
    visibilityOptions.find((option) => option.value === visibility) ??
    visibilityOptions[1];
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

      const note = await createNote(request);

      // Swagger에는 작성 쪽지 목록 API가 없어, 마이페이지 조회용으로 함께 저장합니다.
      await saveNote(note.id);
      return note;
    },
    onSuccess: async () => {
      window.sessionStorage.removeItem(noteDraftStorageKey);
      await queryClient.invalidateQueries({ queryKey: savedNotesQueryKey });
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
    window.sessionStorage.setItem(
      noteDraftStorageKey,
      JSON.stringify({
        body,
        imagePreview,
        location: noteLocation,
        tags: tagValues,
        visibility,
      } satisfies NoteDraft)
    );

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
    <section className="min-h-dvh bg-[#F8F3EC] px-4 pt-[calc(18px+env(safe-area-inset-top))] pb-[calc(18px+env(safe-area-inset-bottom))] text-[#201B16]">
      <header className="rounded-[30px] bg-[#FFFDF8] px-5 py-5 shadow-[0_18px_44px_rgba(93,65,37,0.08)]">
        <div className="flex items-start gap-3">
          <span className="grid size-12 flex-none place-items-center rounded-2xl bg-[#FFE7D9] text-[#FF4300]">
            <PenLine size={23} strokeWidth={2.5} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="m-0 text-xs font-black tracking-[0.16em] text-[#FF4300]">
              {isEditing ? "EDIT NOTE" : "LEAVE A NOTE"}
            </p>
            <h1 className="mt-2 mb-0 text-[1.75rem] leading-tight font-black tracking-[-0.055em]">
              {isEditing ? "남겨둔 쪽지를 다듬어요" : "이 장소에 작은 쪽지를 붙여요"}
            </h1>
            <p className="mt-2 mb-0 text-[0.9rem] leading-relaxed font-semibold text-[#8A7A6E]">
              {isEditing
                ? "그날의 문장과 사진을 조금 더 자연스럽게 고쳐보세요."
                : "길게 쓰지 않아도 괜찮아요. 다음 사람에게 닿을 한 줄이면 충분해요."}
            </p>
          </div>
        </div>
        <button
          className="mt-5 flex w-full items-center justify-between gap-4 rounded-[24px] border border-[#F4D9C8] bg-[#FFF6EF] px-4 py-4 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.72)] transition-[border-color,transform,box-shadow] active:scale-[0.995]"
          type="button"
          onClick={openLocationPage}
        >
          <span className="flex min-w-0 items-center gap-3">
            <span className="grid h-12 w-12 flex-none place-items-center rounded-2xl bg-white text-[#FF4300] shadow-[0_8px_18px_rgba(255,67,0,0.08)]">
              <MapPin size={22} fill="#FF4300" />
            </span>
            <span className="min-w-0">
              <small className="mb-1 block text-[0.68rem] font-black text-[#B76745]">
                붙일 위치
              </small>
              <strong className="block truncate text-[1rem] font-black text-[#2B241E]">
                {noteLocation.name}
              </strong>
              <small className="mt-1 block truncate text-[0.78rem] font-semibold text-[#9A7564]">
                {noteLocation.address}
              </small>
            </span>
          </span>
          <span className="grid h-9 w-9 flex-none place-items-center rounded-full bg-white/80 text-[#FF4300] shadow-[inset_0_0_0_1px_rgba(255,67,0,0.08)]">
            <ChevronRight size={20} strokeWidth={2.7} />
          </span>
        </button>
      </header>

      <form className="mt-5 grid gap-4" onSubmit={handleSubmit}>
        <input
          ref={fileInputRef}
          className="sr-only"
          type="file"
          accept="image/*"
          onChange={handleImageChange}
        />

        <section className="rounded-[30px] bg-[#FFFDF8] p-4 shadow-[0_18px_44px_rgba(93,65,37,0.08)]">
          <div className="grid grid-cols-[1.2fr_1fr] gap-3">
            <AnimatePresence mode="wait">
              {imagePreview ? (
                <motion.div
                  className="relative aspect-square overflow-hidden rounded-[25px] bg-[#F1E7DB] shadow-[0_14px_32px_rgba(39,32,25,0.06)]"
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
                  <div className="absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-black/55 to-transparent p-2.5 pt-9">
                    <button
                      className="rounded-full bg-white/90 px-2.5 py-1.5 text-[0.68rem] font-black text-[#333] backdrop-blur-md"
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      사진 변경
                    </button>
                    <button
                      className="grid h-8 w-8 place-items-center rounded-full bg-black/35 text-white backdrop-blur-md"
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
                  className="grid aspect-square place-items-center rounded-[25px] border border-dashed border-[#E8C9B8] bg-[#FBF2EA] text-center shadow-[0_14px_32px_rgba(39,32,25,0.05)] transition-[background-color,transform] active:scale-[0.99]"
                  key="empty"
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  aria-label="사진 한 장 첨부"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <span>
                    <span className="mx-auto grid h-13 w-13 place-items-center rounded-2xl bg-[#FF4300] text-white shadow-[0_12px_26px_rgba(255,67,0,0.18)]">
                      <ImagePlus size={23} strokeWidth={2.2} />
                    </span>
                    <strong className="mt-3 block text-sm font-black text-[#3A2E25]">
                      사진 한 장
                    </strong>
                    <small className="mt-1 block text-[0.7rem] font-semibold text-[#A18B7D]">
                      분위기를 같이 붙여요
                    </small>
                  </span>
                </motion.button>
              )}
            </AnimatePresence>

            <div className="relative grid grid-cols-2 grid-rows-2 gap-2.5">
              {tagValues.map((tag, index) => (
                <label
                  className="flex min-h-0 items-center justify-center rounded-[19px] bg-[#F7EEE5] px-2 text-center shadow-[0_10px_24px_rgba(39,32,25,0.035)] transition-[background-color,box-shadow] focus-within:bg-[#fff3ed] focus-within:shadow-[inset_0_0_0_1px_#FF4300]"
                  key={index}
                >
                  <span className="text-sm font-black text-[#FF4300]">#</span>
                  <input
                    className="min-w-0 w-full border-0 bg-transparent text-center text-[0.78rem] font-black text-[#756e67] outline-none"
                    maxLength={6}
                    onChange={(event) => updateTag(index, event.target.value)}
                    placeholder="태그"
                    value={tag}
                  />
                </label>
              ))}

              <button
                className="min-h-0 rounded-[19px] bg-[#F7EEE5] px-2 text-sm font-black text-[#3A2E25] shadow-[0_10px_24px_rgba(39,32,25,0.035)] transition-transform active:scale-[0.98]"
                type="button"
                onClick={() => setIsVisibilityOpen((isOpen) => !isOpen)}
                aria-expanded={isVisibilityOpen}
              >
                <span className="flex flex-col items-center gap-1">
                  <selectedVisibility.Icon size={18} strokeWidth={2.4} />
                  <span className="inline-flex items-center gap-0.5 whitespace-nowrap text-xs">
                    {selectedVisibility.shortLabel}
                    <ChevronDown
                      className={isVisibilityOpen ? "rotate-180" : ""}
                      size={13}
                      strokeWidth={2.8}
                    />
                  </span>
                </span>
              </button>

              {isVisibilityOpen ? (
                <div className="absolute top-[calc(100%+8px)] right-0 z-20 grid w-[166px] gap-1 rounded-2xl border border-[#efe9e3] bg-white p-1.5 shadow-[0_16px_34px_rgba(39,32,25,0.12)]">
                  {visibilityOptions.map(({ value, label, Icon }) => {
                    const isSelected = visibility === value;

                    return (
                      <button
                        className={`flex min-h-10 items-center gap-2 rounded-xl px-3 text-left text-xs font-black ${
                          isSelected
                            ? "bg-[#fff3ed] text-[#FF4300]"
                            : "text-[#6f6861]"
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
          </div>

          <label className="mt-4 block font-black text-[#3A2E25]">
            <span className="sr-only">쪽지 내용</span>
            <div className="relative">
              <textarea
                className="min-h-[230px] w-full resize-none rounded-[26px] border border-[#EFE0D5] bg-[linear-gradient(#fffdf8_31px,#f2e8de_32px)] bg-[length:100%_32px] p-5 pb-11 leading-8 font-semibold text-[#3A2E25] shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] outline-none transition-[border-color,box-shadow] placeholder:font-semibold placeholder:text-[#B7A69B] focus:border-[#FF4300] focus:shadow-[0_0_0_4px_rgba(255,67,0,0.08)]"
                maxLength={MAX_BODY_LENGTH}
                onChange={(event) =>
                  setBody(event.target.value.slice(0, MAX_BODY_LENGTH))
                }
                placeholder="예: 이 골목은 해질 때 조용해서 천천히 걷기 좋아요."
                value={body}
              />
              <span
                className={`pointer-events-none absolute right-4 bottom-3 text-xs font-bold ${
                  body.length >= MAX_BODY_LENGTH
                    ? "text-[#FF4300]"
                    : "text-[#bbb]"
                }`}
              >
                {body.length}/{MAX_BODY_LENGTH}
              </span>
            </div>
          </label>
        </section>

        <button
          className="sticky bottom-[calc(12px+env(safe-area-inset-bottom))] z-10 inline-flex min-h-[58px] w-full items-center justify-center gap-2 rounded-[22px] border-0 bg-[#FF4300] font-black text-white shadow-[0_16px_30px_rgba(255,67,0,0.22)] transition-[opacity,transform,box-shadow] active:scale-[0.99] disabled:bg-[#E7DDD3] disabled:text-[#A99B90] disabled:shadow-none"
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
