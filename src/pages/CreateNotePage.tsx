import { Camera, MapPinned } from "lucide-react";
import { FormEvent, useState } from "react";
import { PageHeader } from "@/shared/components/PageHeader";
import type { Visibility } from "@/shared/types/domain";

export function CreateNotePage() {
  const [visibility, setVisibility] = useState<Visibility>("friends");
  const [body, setBody] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    window.alert("백엔드 연결 후 쪽지가 등록됩니다.");
  }

  return (
    <section className="p-[22px_18px_28px]">
      <PageHeader
        eyebrow="빠른 기록"
        title="쪽지 남기기"
        description="지도에서 위치를 고르고, 그 순간의 감각을 한 줄로 남겨보세요."
      />

      <form className="grid gap-4" onSubmit={handleSubmit}>
        <label className="grid gap-2 font-black text-[#3d3932]">
          한 줄 내용
          <textarea
            className="w-full resize-y rounded-lg border border-black/10 bg-white p-3.5 leading-normal text-[#24231f]"
            maxLength={80}
            onChange={(event) => setBody(event.target.value)}
            placeholder="시장 소리가 멀어질 때쯤 잔잔한 음악이 잘 어울려요."
            rows={4}
            value={body}
          />
          <small className="justify-self-end text-[#8d887f]">
            {body.length}/80
          </small>
        </label>

        <button
          className="flex w-full items-center gap-3 rounded-lg border border-black/10 bg-white p-4 text-left text-[#24231f]"
          type="button"
        >
          <MapPinned size={22} />
          <span className="grid gap-1">
            <strong>위치 선택</strong>
            <small className="text-[#6f6a60]">
              지도에서 쪽지를 남길 위치를 고릅니다.
            </small>
          </span>
        </button>

        <button
          className="flex w-full items-center gap-3 rounded-lg border border-black/10 bg-white p-4 text-left text-[#24231f]"
          type="button"
        >
          <Camera size={22} />
          <span className="grid gap-1">
            <strong>사진 첨부</strong>
            <small className="text-[#6f6a60]">
              선택 사항 · MVP에서는 파일 업로드로 시작합니다.
            </small>
          </span>
        </button>

        <fieldset className="flex gap-2 border-0 p-0">
          <legend className="mb-2 w-full font-black">공개 범위</legend>
          {[
            ["public", "전체공개"],
            ["friends", "친구공개"],
            ["private", "나만보기"],
          ].map(([value, label]) => (
            <button
              className={`min-h-9 rounded-full border border-black/10 px-3.5 text-sm font-extrabold ${
                visibility === value
                  ? "bg-[#116149] text-[#fffaf0]"
                  : "bg-[#fffaf0]/90 text-[#625d54]"
              }`}
              key={value}
              onClick={() => setVisibility(value as Visibility)}
              type="button"
            >
              {label}
            </button>
          ))}
        </fieldset>

        <button
          className="mt-1 inline-flex min-h-[52px] w-full items-center justify-center rounded-lg bg-[#116149] font-black text-[#fffaf0] disabled:bg-[#e6e0d5] disabled:text-[#8d887f]"
          disabled={!body.trim()}
          type="submit"
        >
          등록하기
        </button>
      </form>
    </section>
  );
}
