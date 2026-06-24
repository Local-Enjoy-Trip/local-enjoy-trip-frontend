export type SavedCourseStop = {
  attractionId?: number;
  id: number;
  noteId?: number;
  title: string;
  category: string;
  description: string;
  imageUrl: string;
  lat: number;
  lng: number;
};

export type SavedCourse = {
  id: string;
  title: string;
  area: string;
  companion: string;
  date?: string;
  styles: string[];
  pace: string;
  savedAt: string;
  collaborators: string[];
  stops: SavedCourseStop[];
};

const storageKey = "spot:saved-courses";

export function getSavedCourses(): SavedCourse[] {
  try {
    const value = window.localStorage.getItem(storageKey);
    return value ? (JSON.parse(value) as SavedCourse[]) : [];
  } catch {
    return [];
  }
}

export function getSavedCourse(id: string) {
  return getSavedCourses().find((course) => course.id === id);
}

export function saveCourse(course: SavedCourse) {
  const courses = getSavedCourses();
  const nextCourses = [course, ...courses.filter((item) => item.id !== course.id)];
  window.localStorage.setItem(storageKey, JSON.stringify(nextCourses));
  window.dispatchEvent(new CustomEvent("spot:courses-changed"));
}

export function updateCourseCollaborators(id: string, collaborators: string[]) {
  const courses = getSavedCourses().map((course) =>
    course.id === id ? { ...course, collaborators } : course,
  );
  window.localStorage.setItem(storageKey, JSON.stringify(courses));
  window.dispatchEvent(new CustomEvent("spot:courses-changed"));
}
