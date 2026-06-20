import {
  Check,
  ImagePlus,
  MapPin,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { ChangeEvent, FormEvent, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { homeLocationOptions } from "@/features/home/types/homeTypes";
import type { NoteLocationSelection } from "@/pages/NoteLocationPage";
import type { Visibility } from "@/shared/types/domain";

const MAX_BODY_LENGTH = 80;
const defaultNoteLocation = homeLocationOptions[0];
const noteDraftStorageKey = "spot-note-draft";

type NoteDraft = {
  body: string;
  imagePreview: string | null;
  location: NoteLocationSelection;
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
  const [visibility, setVisibility] = useState<Visibility>(
    initialDraft.visibility
  );

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
        visibility,
      } satisfies NoteDraft)
    );

    navigate("/note/location", {
      state: {
        noteLocation,
      },
    });
  }

  return (
    <section className="min-h-screen bg-white px-5 pt-[calc(26px+env(safe-area-inset-top))] pb-8 text-[#111111]">
      <header>
        <h1 className="m-0 text-[1.85rem] leading-tight font-black tracking-[-0.045em]">
          박기현님의 SPOT 쪽지
        </h1>
        <p className="mt-2 mb-0 text-sm font-medium text-[#777]">
          여행지에서 발견한 순간을 한 장과 한 줄로 남겨보세요.
        </p>

        <button
          className="mt-5 flex w-full items-center justify-between gap-4 rounded-[22px] border border-[#ececec] bg-[#fafafa] px-4 py-3.5 text-left shadow-[0_8px_20px_rgba(17,17,17,0.04)]"
          type="button"
          onClick={openLocationPage}
        >
          <span className="flex min-w-0 items-center gap-3">
            <span className="grid h-11 w-11 flex-none place-items-center rounded-full bg-[#111] text-white">
              <MapPin size={22} fill="currentColor" strokeWidth={2.1} />
            </span>
            <span className="min-w-0">
              <strong className="block text-sm font-black text-[#222]">
                {noteLocation.name}
              </strong>
              <small className="mt-1 block truncate text-xs font-bold text-[#888]">
                {noteLocation.address}
              </small>
            </span>
          </span>
          <span className="flex-none rounded-full bg-[#fff0eb] px-3 py-1.5 text-xs font-black text-[#FF4300]">
            변경
          </span>
        </button>
      </header>

      <form className="mt-7 grid gap-7" onSubmit={handleSubmit}>
        <div>
          <div className="mb-3">
            <h2 className="m-0 text-base font-black">사진</h2>
            <p className="mt-1 mb-0 text-xs font-medium text-[#888]">
              선택 사항 · 한 장만 첨부할 수 있어요
            </p>
          </div>

          <input
            ref={fileInputRef}
            className="sr-only"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
          />

          <AnimatePresence mode="wait">
            {imagePreview ? (
              <motion.div
                className="relative aspect-[16/10] w-full overflow-hidden rounded-[22px] bg-[#f5f5f5]"
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
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-black/60 to-transparent p-3 pt-10">
                  <button
                    className="rounded-full border border-white/25 bg-black/30 px-3.5 py-2 text-xs font-black text-white backdrop-blur-md"
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    사진 변경
                  </button>
                  <button
                    className="grid h-9 w-9 place-items-center rounded-full border border-white/25 bg-black/30 text-white backdrop-blur-md"
                    type="button"
                    onClick={handleImageRemove}
                    aria-label="첨부 사진 삭제"
                  >
                    <X size={18} strokeWidth={2.5} />
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.button
                className="flex min-h-[148px] w-full items-center justify-center gap-4 rounded-[22px] border border-dashed border-[#d8d8d8] bg-[#fafafa] text-left transition-[border-color,background-color] hover:border-[#FF4300] hover:bg-[#fff8f5]"
                key="empty"
                type="button"
                onClick={() => fileInputRef.current?.click()}
                aria-label="사진 한 장 첨부"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <span className="grid h-13 w-13 flex-none place-items-center rounded-full bg-[#FF4300] text-white shadow-[0_8px_20px_rgba(255,67,0,0.2)]">
                  <ImagePlus size={23} strokeWidth={2.2} />
                </span>
                <span>
                  <strong className="block text-sm font-black text-[#222]">
                    사진 추가하기
                  </strong>
                  <small className="mt-1 block text-xs font-medium text-[#888]">
                    갤러리에서 여행 사진을 선택하세요
                  </small>
                </span>
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        <label className="grid gap-3 font-black text-[#222]">
          쪽지 내용
          <div className="relative">
            <textarea
              className="min-h-[154px] w-full resize-none rounded-[22px] border border-[#e5e5e5] bg-white p-4 pb-9 leading-relaxed font-semibold text-[#222] outline-none transition-[border-color,box-shadow] placeholder:font-medium placeholder:text-[#aaa] focus:border-[#FF4300] focus:shadow-[0_0_0_3px_rgba(255,67,0,0.09)]"
              maxLength={MAX_BODY_LENGTH}
              onChange={(event) => setBody(event.target.value)}
              placeholder="시장 소리가 멀어질 때쯤 잔잔한 음악이 잘 어울려요."
              value={body}
            />
            <span
              className={`pointer-events-none absolute right-4 bottom-3 text-xs font-bold ${
                body.length >= MAX_BODY_LENGTH ? "text-[#FF4300]" : "text-[#bbb]"
              }`}
            >
              {body.length}/{MAX_BODY_LENGTH}
            </span>
          </div>
        </label>

        <fieldset className="m-0 border-0 p-0">
          <legend className="mb-3 text-base font-black text-[#222]">
            공개 범위
          </legend>
          <div className="grid grid-cols-3 gap-2">
            {[
              ["public", "전체공개"],
              ["friends", "친구공개"],
              ["private", "나만보기"],
            ].map(([value, label]) => {
              const isSelected = visibility === value;

              return (
                <button
                  className={`min-h-11 rounded-xl border text-sm font-black transition-[background-color,border-color,color] ${
                    isSelected
                      ? "border-[#FF4300] bg-[#fff0eb] text-[#FF4300]"
                      : "border-[#e8e8e8] bg-white text-[#777]"
                  }`}
                  key={value}
                  type="button"
                  onClick={() => setVisibility(value as Visibility)}
                  aria-pressed={isSelected}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </fieldset>

        <button
          className="inline-flex min-h-[56px] w-full items-center justify-center gap-2 rounded-2xl border-0 bg-[#FF4300] font-black text-white shadow-[0_12px_26px_rgba(255,67,0,0.22)] transition-[opacity,transform,box-shadow] active:scale-[0.99] disabled:bg-[#efefef] disabled:text-[#aaa] disabled:shadow-none"
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
