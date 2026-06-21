import {
  ChevronDown,
  ChevronRight,
  Check,
  Globe2,
  ImagePlus,
  LockKeyhole,
  Users,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { ChangeEvent, FormEvent, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { homeLocationOptions } from "@/features/home/types/homeTypes";
import type { NoteLocationSelection } from "@/pages/NoteLocationPage";
import noteLocationPinUrl from "@/assets/note-location-pin.png";
import type { Visibility } from "@/shared/types/domain";

const MAX_BODY_LENGTH = 80;
const defaultNoteLocation = homeLocationOptions[0];
const noteDraftStorageKey = "spot-note-draft";
const defaultNoteTags = ["산책", "맛집", "카페"];
const visibilityOptions = [
  { value: "public", label: "전체공개", shortLabel: "전체", Icon: Globe2 },
  { value: "friends", label: "친구공개", shortLabel: "친구", Icon: Users },
  { value: "private", label: "나만보기", shortLabel: "나만", Icon: LockKeyhole },
] as const;

type NoteDraft = {
  body: string;
  imagePreview: string | null;
  location: NoteLocationSelection;
  tags: string[];
  visibility: Visibility;
};

type CreateNoteRouteState = {
  noteLocation?: NoteLocationSelection;
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
  const routeLocation = useLocation();
  const routeState = routeLocation.state as CreateNoteRouteState | null;
  const initialDraft = readDraft();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [noteLocation] = useState<NoteLocationSelection>(
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
    const payload = {
      body: body.trim(),
      tags: tagValues.map((tag) => tag.trim()).filter(Boolean),
      visibility,
      coordinates: noteLocation.coordinates,
      imageAttached: Boolean(imagePreview),
    };

    console.log("create note payload", payload);
    window.sessionStorage.removeItem(noteDraftStorageKey);
    window.alert("백엔드 연결 후 쪽지가 등록됩니다.");
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
        noteLocation,
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

  return (
    <section className="min-h-dvh bg-white px-5 pt-[calc(26px+env(safe-area-inset-top))] pb-8 text-[#151515]">
      <header>
        <h1 className="m-0 text-[1.78rem] leading-tight font-black tracking-[-0.035em]">
          박기현님의 SPOT 쪽지
        </h1>
        <p className="mt-2 mb-0 text-[0.94rem] leading-relaxed font-semibold text-[#777]">
          방금 스친 장소의 온도와 기분을 짧게 남겨보세요.
        </p>

        <button
          className="mt-7 flex w-full items-center justify-between gap-4 rounded-[26px] border border-white/80 bg-white/72 px-4 py-4 text-left shadow-[0_16px_36px_rgba(39,32,25,0.07),inset_0_1px_0_rgba(255,255,255,0.72)] backdrop-blur transition-[border-color,transform,box-shadow] active:scale-[0.995]"
          type="button"
          onClick={openLocationPage}
        >
          <span className="flex min-w-0 items-center gap-3">
            <span className="grid h-12 w-12 flex-none place-items-center rounded-2xl bg-[#fff4ef]">
              <img
                className="h-9 w-9 object-contain"
                src={noteLocationPinUrl}
                alt=""
              />
            </span>
            <span className="min-w-0">
              <strong className="block truncate text-[0.98rem] font-black text-[#242424]">
                {noteLocation.name}
              </strong>
              <small className="mt-1 block truncate text-[0.78rem] font-semibold text-[#8b8580]">
                {noteLocation.address}
              </small>
            </span>
          </span>
          <span className="grid h-9 w-9 flex-none place-items-center rounded-full bg-white/80 text-[#FF4300] shadow-[inset_0_0_0_1px_rgba(255,67,0,0.08)]">
            <ChevronRight size={20} strokeWidth={2.7} />
          </span>
        </button>
      </header>

      <form className="mt-7 grid gap-6" onSubmit={handleSubmit}>
        <input
          ref={fileInputRef}
          className="sr-only"
          type="file"
          accept="image/*"
          onChange={handleImageChange}
        />

        <section>
          <div className="grid grid-cols-[1.28fr_1fr] gap-2.5">
            <AnimatePresence mode="wait">
              {imagePreview ? (
                <motion.div
                  className="relative aspect-square overflow-hidden rounded-[24px] bg-[#f3f1ef] shadow-[0_14px_32px_rgba(39,32,25,0.06)]"
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
                  className="grid aspect-square place-items-center rounded-[24px] bg-[#f3f1ef] text-center shadow-[0_14px_32px_rgba(39,32,25,0.05)] transition-[background-color,transform] active:scale-[0.99]"
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
                    <strong className="mt-3 block text-sm font-black text-[#242424]">
                      사진
                    </strong>
                    <small className="mt-1 block text-[0.7rem] font-semibold text-[#9a948e]">
                      한 장 추가
                    </small>
                  </span>
                </motion.button>
              )}
            </AnimatePresence>

            <div className="relative grid grid-cols-2 grid-rows-2 gap-2.5">
              {tagValues.map((tag, index) => (
                <label
                  className="flex min-h-0 items-center justify-center rounded-[19px] bg-[#f3f1ef] px-2 text-center shadow-[0_10px_24px_rgba(39,32,25,0.045)] transition-[background-color,box-shadow] focus-within:bg-[#fff3ed] focus-within:shadow-[inset_0_0_0_1px_#FF4300]"
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
                className="min-h-0 rounded-[19px] bg-[#f3f1ef] px-2 text-sm font-black text-[#242424] shadow-[0_10px_24px_rgba(39,32,25,0.045)] transition-transform active:scale-[0.98]"
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

          <label className="mt-3 block font-black text-[#242424]">
            <span className="sr-only">쪽지 내용</span>
            <div className="relative">
              <textarea
                className="min-h-[190px] w-full resize-none rounded-[24px] border border-[#efeae5] bg-white p-5 pb-10 leading-relaxed font-semibold text-[#242424] shadow-[0_14px_32px_rgba(39,32,25,0.045)] outline-none transition-[border-color,box-shadow] placeholder:font-semibold placeholder:text-[#b6b0aa] focus:border-[#FF4300] focus:shadow-[0_0_0_4px_rgba(255,67,0,0.08)]"
                maxLength={MAX_BODY_LENGTH}
                onChange={(event) =>
                  setBody(event.target.value.slice(0, MAX_BODY_LENGTH))
                }
                placeholder="이 장소에서 남기고 싶은 한 줄을 적어보세요."
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
          className="inline-flex min-h-[58px] w-full items-center justify-center gap-2 rounded-[22px] border-0 bg-[#FF4300] font-black text-white shadow-[0_16px_30px_rgba(255,67,0,0.22)] transition-[opacity,transform,box-shadow] active:scale-[0.99] disabled:bg-[#efefef] disabled:text-[#aaa] disabled:shadow-none"
          disabled={!body.trim()}
          type="submit"
        >
          {body.trim() ? <Check size={19} strokeWidth={3} /> : null}
          등록하기
        </button>
      </form>
    </section>
  );
}
