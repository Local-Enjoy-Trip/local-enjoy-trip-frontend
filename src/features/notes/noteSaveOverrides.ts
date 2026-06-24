const noteSaveOverridesKey = "spot:note-save-overrides";
const noteSaveOverridesEvent = "spot:note-save-overrides-change";

export type NoteSaveOverride = {
  saved: boolean;
  updatedAt: number;
};

export function getNoteSaveOverride(id: number | string) {
  return readNoteSaveOverrides()[normalizeNoteId(id)];
}

export function setNoteSaveOverride(id: number | string, saved: boolean) {
  if (typeof window === "undefined") return;

  const overrides = readNoteSaveOverrides();
  overrides[normalizeNoteId(id)] = { saved, updatedAt: Date.now() };
  window.localStorage.setItem(noteSaveOverridesKey, JSON.stringify(overrides));
  window.dispatchEvent(new Event(noteSaveOverridesEvent));
}

export function subscribeNoteSaveOverrides(listener: () => void) {
  if (typeof window === "undefined") return () => {};

  const handleStorage = (event: StorageEvent) => {
    if (event.key === noteSaveOverridesKey) listener();
  };

  window.addEventListener(noteSaveOverridesEvent, listener);
  window.addEventListener("storage", handleStorage);

  return () => {
    window.removeEventListener(noteSaveOverridesEvent, listener);
    window.removeEventListener("storage", handleStorage);
  };
}

export function applyNoteSaveOverride<T extends {
  favoriteCount?: number;
  id: string;
  saved: boolean;
}>(note: T): T {
  const override = getNoteSaveOverride(note.id);
  if (!override || override.saved === note.saved) return note;

  return {
    ...note,
    favoriteCount:
      note.favoriteCount === undefined
        ? note.favoriteCount
        : Math.max(0, note.favoriteCount + (override.saved ? 1 : -1)),
    saved: override.saved,
  };
}

export function readNoteSaveOverrides() {
  if (typeof window === "undefined") return {} as Record<string, NoteSaveOverride>;

  try {
    const value = window.localStorage.getItem(noteSaveOverridesKey);
    if (!value) return {};
    return JSON.parse(value) as Record<string, NoteSaveOverride>;
  } catch {
    return {};
  }
}

function normalizeNoteId(id: number | string) {
  return String(id).replace(/^note-/, "");
}
