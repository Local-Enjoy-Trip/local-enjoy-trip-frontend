import { useAuthUser } from "@/features/auth/authStore";
import {
  createCourse,
  getCachedApiCourse,
  getMyCourses,
  getPublicCourse,
  recommendCourseOrder,
  updateCourse,
  type CourseResponse,
} from "@/features/course/courseApi";
import { normalizeCourseTags } from "@/features/course/courseTags";
import { CourseDraftCalendar } from "@/features/course/components/CourseCreatePanel";
import { CoursePlacePickerOverlay } from "@/features/course/detail/CoursePlacePickerOverlay";
import { CourseRouteDrawer } from "@/features/course/detail/CourseRouteDrawer";
import { CourseRouteMap } from "@/features/course/detail/CourseRouteMap";
import {
  appendStopsToCourseRequest,
  createCourseRequestFromStops,
  getCourseResponseTags,
  getFirstRealPointImage,
  getFirstRealStopImage,
  getNumericPointId,
  sortedCourseItems,
  startOfMonth,
  toCourseItemRequest,
  toCourseUpdateRequest,
  toDisplayRouteStops,
} from "@/features/course/detail/courseDetailModels";
import {
  clipRoundRect,
  downloadCanvas,
  drawCoverImage,
  drawRoundRect,
  drawSingleLineText,
  drawWrappedText,
  loadCanvasImage,
} from "@/features/course/detail/courseImageExport";
import type { CourseStop } from "@/features/course/detail/types";
import {
  getAttractionDetail,
  type AttractionDetailResponse,
} from "@/features/attractions/attractionApi";
import { getFriends as getServiceFriends } from "@/features/friends/friendApi";
import type { MapPoint } from "@/features/map/types";
import { BottomSheet } from "@/shared/ui/BottomSheet";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  CheckSquare,
  ChevronRight,
  Download,
  Map as MapIcon,
  Plus,
  WandSparkles,
  X,
  Pencil,
} from "lucide-react";
import { motion } from "motion/react";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";

const HEADER_EXPANDED_HEIGHT = 255;
const HEADER_COMPACT_HEIGHT = 74;
const COURSE_MAP_HEIGHT = 232;
const DRAWER_COLLAPSED_TOP = 214;

export function CourseDetailPage() {
  const [safeAreaTop, setSafeAreaTop] = useState(0);

  useEffect(() => {
    const div = document.createElement("div");
    div.style.position = "absolute";
    div.style.top = "env(safe-area-inset-top)";
    div.style.height = "0";
    div.style.width = "0";
    div.style.visibility = "hidden";
    document.body.appendChild(div);
    const computedTop = window.getComputedStyle(div).top;
    const parsed = parseFloat(computedTop);
    if (!isNaN(parsed)) {
      setSafeAreaTop(parsed);
    }
    document.body.removeChild(div);
  }, []);

  const [isRouteEditing, setIsRouteEditing] = useState(false);
  const [backupCourse, setBackupCourse] = useState<CourseResponse | null>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const location = useLocation();
  const { courseId = "course-1" } = useParams();
  const [searchParams] = useSearchParams();
  const locationState = location.state as
    | { createdAsMyCourse?: boolean; createdCourseId?: string }
    | null;
  const createdAsMyCourse =
    locationState?.createdAsMyCourse === true &&
    locationState.createdCourseId === courseId;
  const authUserQuery = useAuthUser();
  const userId = authUserQuery.data?.id;
  const [apiCourse, setApiCourse] = useState<CourseResponse | null>(
    () => getCachedApiCourse(courseId) ?? null,
  );
  const [attractionDetails, setAttractionDetails] = useState<
    Record<number, AttractionDetailResponse>
  >({});
  const myCoursesQuery = useQuery({
    enabled: !!userId,
    queryFn: getMyCourses,
    queryKey: ["courses", "me"],
    retry: 1,
  });
  const isMyApiCourse = useMemo(() => {
    if (createdAsMyCourse) return true;
    if (!apiCourse) return false;
    if (apiCourse.ownerUserId && userId && apiCourse.ownerUserId === userId) {
      return true;
    }
    return myCoursesQuery.data?.some((course) => course.id === apiCourse.id) ?? false;
  }, [apiCourse, createdAsMyCourse, myCoursesQuery.data, userId]);

  const isReadOnly =
    searchParams.get("view") === "1" ||
    !apiCourse ||
    (!isMyApiCourse && !myCoursesQuery.isLoading && !myCoursesQuery.isError);
  const canEditCourse = !isReadOnly;
  const routeStops = useMemo<CourseStop[]>(
    () =>
      apiCourse
        ? toDisplayRouteStops(apiCourse, attractionDetails)
        : [],
    [apiCourse, attractionDetails],
  );

  useEffect(() => {
    if (!apiCourse) return;
    const ids = apiCourse.items
      .map((item) => item.attractionId)
      .filter(
        (id): id is number =>
          typeof id === "number" && !attractionDetails[id],
      );

    if (ids.length === 0) return;

    async function fetchDetails() {
      try {
        const results = await Promise.all(
          ids.map((id) => getAttractionDetail(id).catch(() => null)),
        );
        const nextMap = { ...attractionDetails };
        let updated = false;
        results.forEach((res) => {
          if (res) {
            nextMap[res.id] = res;
            updated = true;
          }
        });
        if (updated) {
          setAttractionDetails(nextMap);
        }
      } catch {
        // Silently ignore
      }
    }

    void fetchDetails();
  }, [apiCourse, attractionDetails]);
  const courseTitle = apiCourse?.title ?? "망원 하루 코스";
  const companion = "내 일정";
  const descParts = apiCourse?.description?.split("|") ?? [];
  const apiDate = descParts[0]?.match(/^\d{4}-\d{2}-\d{2}$/)
    ? descParts[0]
    : (apiCourse?.description?.match(/^\d{4}-\d{2}-\d{2}$/) ? apiCourse.description : undefined);

  const apiTags = useMemo<string[]>(() => {
    if (!apiCourse) return [];
    return getCourseResponseTags(apiCourse);
  }, [apiCourse]);

  const dateLabel = apiDate
    ? apiDate.replace(/-/g, ".")
    : "날짜 미정";

  const styleLabel =
    apiTags.join(" · ") ||
    apiCourse?.regionName ||
    "로컬 산책";
  const [activeStopId, setActiveStopId] = useState(routeStops[0]?.id ?? 1);
  const [editTags, setEditTags] = useState<string[]>([]);
  const [drawerCoverOffset, setDrawerCoverOffset] = useState(0);
  const [headerOffset, setHeaderOffset] = useState(0);
  const [shareOpen, setShareOpen] = useState(false);
  const [copyOpen, setCopyOpen] = useState(false);
  const [friendsOpen, setFriendsOpen] = useState(false);
  const [optimizeOpen, setOptimizeOpen] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizedCourse] = useState<CourseResponse | null>(null);
  const [mapOpen, setMapOpen] = useState(false);
  const [placePickerOpen, setPlacePickerOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editTitle, setEditTitle] = useState(courseTitle);
  const [editDate, setEditDate] = useState(apiDate ?? "");
  const [calendarMonth, setCalendarMonth] = useState(() =>
    startOfMonth(new Date()),
  );
  const [editStops, setEditStops] = useState<CourseStop[]>([]);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isAddingPoint, setIsAddingPoint] = useState(false);
  const [isCopyingCourse, setIsCopyingCourse] = useState(false);
  const [copyTargetId, setCopyTargetId] = useState("");
  const [copyNewTitle, setCopyNewTitle] = useState("");
  const [notice, setNotice] = useState("");
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const friendsQuery = useQuery({
    enabled: friendsOpen,
    queryFn: getServiceFriends,
    queryKey: ["friends"],
  });
  const copyTargets = useMemo(() => {
    return (myCoursesQuery.data ?? [])
      .filter((course) => course.id !== apiCourse?.id)
      .map((course) => ({
        id: `api:${course.id}`,
        meta: `${course.regionName ?? "동네"} · ${course.items.length}곳`,
        title: course.title,
        type: "api" as const,
        value: course,
      }));
  }, [apiCourse?.id, myCoursesQuery.data]);
  const expandedHeaderHeight = HEADER_EXPANDED_HEIGHT + safeAreaTop;
  const drawerCollapsedTop = DRAWER_COLLAPSED_TOP;
  const headerCollapseDistance = expandedHeaderHeight - (HEADER_COMPACT_HEIGHT + safeAreaTop);

  const headerHeight = expandedHeaderHeight - headerOffset;
  const drawerTop = drawerCollapsedTop - drawerCoverOffset;
  const isHeaderCompact = headerOffset > 0;

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previousOverscroll = document.body.style.overscrollBehavior;
    document.body.style.overflow = "hidden";
    document.body.style.overscrollBehavior = "none";
    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.overscrollBehavior = previousOverscroll;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadCourse() {
      try {
        const course = await getPublicCourse(courseId);
        if (!cancelled) setApiCourse(course);
      } catch {
        if (
          !cancelled &&
          !getCachedApiCourse(courseId)
        ) {
          setNotice("코스를 불러오지 못했어요.");
        }
      }
    }

    void loadCourse();
    return () => {
      cancelled = true;
    };
  }, [courseId]);

  useEffect(() => {
    if (routeStops[0] && !routeStops.some((stop) => stop.id === activeStopId)) {
      setActiveStopId(routeStops[0].id);
    }
  }, [activeStopId, routeStops]);

  useEffect(() => {
    if (editOpen) {
      setEditTitle(courseTitle);
      const initialDate = apiDate ?? "";
      setEditDate(initialDate);
      setCalendarMonth(startOfMonth(initialDate ? new Date(initialDate) : new Date()));
      setEditStops(routeStops);
      setEditTags([...apiTags]);
    }
  }, [editOpen, routeStops, courseTitle, apiDate, apiTags]);

  useEffect(() => {
    if (!copyOpen) return;

    setCopyTargetId("");
    setCopyNewTitle(`${courseTitle} 복사`);
  }, [copyOpen, courseTitle]);

  function showNotice(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2200);
  }

  async function saveCourseEdit() {
    if (!canEditCourse || isSavingEdit) return;

    const title = editTitle.trim();
    if (!title) {
      showNotice("코스 제목을 입력해주세요.");
      return;
    }

    setIsSavingEdit(true);
    try {
      const trimmedTags = normalizeCourseTags(
        editTags,
        apiCourse?.regionName ?? "로컬",
      );
      if (apiCourse) {
        const nextItems = editStops.flatMap((stop, index) => {
          const item = toCourseItemRequest(stop, index);
          return item ? [item] : [];
        });

        const descriptionPayload = trimmedTags.length > 0 
          ? `${editDate || ""}|${trimmedTags.join(",")}`
          : (editDate || "");

        const updated = await updateCourse(apiCourse.id, {
          ...toCourseUpdateRequest(apiCourse),
          description: descriptionPayload || undefined,
          items: nextItems,
          tags: trimmedTags,
          title,
        });
        setApiCourse(updated);
      }
      setEditOpen(false);
      showNotice("코스 정보를 수정했어요.");
    } catch {
      showNotice("코스 정보를 저장하지 못했어요.");
    } finally {
      setIsSavingEdit(false);
    }
  }

  async function saveAsImage() {
    const width = 1080;
    const headerHeight = 350;
    const cardHeight = 205;
    const cardGap = 34;
    const height = Math.max(
      1500,
      headerHeight + routeStops.length * (cardHeight + cardGap) + 150,
    );
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) return;
    const drawingContext = context;

    async function render(includeImages: boolean) {
      const images = includeImages
        ? await Promise.all(routeStops.map((stop) => loadCanvasImage(stop.imageUrl)))
        : routeStops.map(() => null);

      drawingContext.clearRect(0, 0, width, height);
      drawingContext.fillStyle = "#F7F5F0";
      drawingContext.fillRect(0, 0, width, height);
      drawingContext.fillStyle = "#111111";
      drawingContext.font = "900 58px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
      drawingContext.fillText(courseTitle, 72, 116);
      drawingContext.fillStyle = "#FD4003";
      drawingContext.font = "900 28px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
      drawingContext.fillText("곳곳 COURSE", 72, 165);
      drawingContext.fillStyle = "#746F67";
      drawingContext.font = "800 28px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
      drawingContext.fillText(`${dateLabel} · ${companion}`, 72, 215);
      drawWrappedText(drawingContext, styleLabel, 72, 260, 900, 34, 2);

      routeStops.forEach((stop, index) => {
        const y = headerHeight + index * (cardHeight + cardGap);
        const cardX = 62;
        const cardY = y;
        const cardWidth = width - cardX * 2;
        const imageX = cardX + 28;
        const imageY = cardY + 28;
        const imageSize = 150;

        if (stop.distanceFromPrevious) {
          drawingContext.fillStyle = "#DEDAD2";
          drawingContext.fillRect(width / 2 - 124, cardY - 18, 248, 4);
          drawRoundRect(drawingContext, width / 2 - 62, cardY - 33, 124, 34, 17, "#FFFFFF");
          drawingContext.fillStyle = "#8B857C";
          drawingContext.font = "900 18px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
          drawingContext.textAlign = "center";
          drawingContext.fillText(stop.distanceFromPrevious, width / 2, cardY - 10);
          drawingContext.textAlign = "start";
        }

        drawRoundRect(drawingContext, cardX, cardY, cardWidth, cardHeight, 34, "#FFFFFF");
        drawRoundRect(drawingContext, imageX, imageY, imageSize, imageSize, 24, "#E7E3DC");

        const image = images[index];
        if (image) {
          drawingContext.save();
          clipRoundRect(drawingContext, imageX, imageY, imageSize, imageSize, 24);
          drawCoverImage(drawingContext, image, imageX, imageY, imageSize, imageSize);
          drawingContext.restore();
        }

        const textX = imageX + imageSize + 34;
        const numberX = textX;
        const numberY = cardY + 62;
        drawingContext.beginPath();
        drawingContext.arc(numberX + 24, numberY, 24, 0, Math.PI * 2);
        drawingContext.fillStyle = "#FD4003";
        drawingContext.fill();
        drawingContext.fillStyle = "#FFFFFF";
        drawingContext.font = "900 28px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
        drawingContext.textAlign = "center";
        drawingContext.fillText(String(index + 1), numberX + 24, numberY + 10);
        drawingContext.textAlign = "start";

        drawingContext.fillStyle = "#111111";
        drawingContext.font = "900 38px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
        drawSingleLineText(drawingContext, stop.title, textX + 68, numberY + 11, 550);
        drawingContext.fillStyle = "#807A73";
        drawingContext.font = "900 27px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
        drawSingleLineText(drawingContext, stop.category, textX, cardY + 120, 660);
        drawingContext.fillStyle = "#716C65";
        drawingContext.font = "800 26px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
        drawWrappedText(drawingContext, stop.description, textX, cardY + 158, 660, 32, 2);
      });
    }

    try {
      await render(true);
      downloadCanvas(canvas, courseTitle);
    } catch {
      await render(false);
      downloadCanvas(canvas, courseTitle);
    }

    setShareOpen(false);
    showNotice("긴 일정 이미지로 저장했어요.");
  }

  function saveFriends() {
    if (!canEditCourse) return;
    setFriendsOpen(false);
    showNotice(
      selectedFriends.length > 0
        ? `${selectedFriends.length}명에게 공유 요청을 보냈어요. 친구가 알림에서 수락하면 볼 수 있어요.`
        : "공유 요청을 보내지 않았어요.",
    );
  }

  async function addPointsToCourse(points: MapPoint[]) {
    if (!canEditCourse || !apiCourse || isAddingPoint || points.length === 0) return;

    setIsAddingPoint(true);
    try {
      const currentItems = sortedCourseItems(apiCourse).map((item) => ({
        attractionId: item.attractionId ?? undefined,
        day: item.day,
        itemType: item.itemType,
        memo: item.memo ?? undefined,
        noteId: item.noteId ?? undefined,
        position: item.position,
        stayMinutes: item.stayMinutes ?? undefined,
      }));
      const startPosition = currentItems.reduce(
        (max, item) => Math.max(max, item.position ?? 0),
        0,
      );
      const newItems = points.map((point, index) => {
        const numericId = getNumericPointId(point.id);
        return {
          attractionId: point.kind === "place" ? numericId ?? undefined : undefined,
          day: 1,
          itemType: point.kind === "place" ? "ATTRACTION" : "NOTE",
          memo: point.kind === "spot" ? point.source.body : undefined,
          noteId: point.kind === "spot" ? numericId ?? undefined : undefined,
          position: startPosition + index + 1,
          stayMinutes: 60,
        };
      });

      const updated = await updateCourse(apiCourse.id, {
        coverImageUrl:
          apiCourse.coverImageUrl ??
          getFirstRealStopImage(routeStops) ??
          getFirstRealPointImage(points),
        description: apiCourse.description ?? undefined,
        items: [...currentItems, ...newItems],
        regionName: apiCourse.regionName ?? undefined,
        status: apiCourse.status,
        tags: getCourseResponseTags(apiCourse),
        title: apiCourse.title,
        visibility: apiCourse.visibility,
      });
      setApiCourse(updated);

      setPlacePickerOpen(false);
      showNotice(`${points.length}개의 장소를 코스 맨 뒤에 추가했어요.`);
    } catch {
      showNotice("코스에 추가하지 못했어요.");
    } finally {
      setIsAddingPoint(false);
    }
  }

  async function addPublicCourseToTarget() {
    if (!apiCourse || !copyTargetId || isCopyingCourse) return;

    const target = copyTargets.find((course) => course.id === copyTargetId);
    if (!target) return;

    setIsCopyingCourse(true);
    try {
      const request = appendStopsToCourseRequest(target.value, routeStops);
      if (request.items.length <= target.value.items.length) {
        showNotice("담을 수 있는 실제 장소 ID가 부족해요.");
        return;
      }

      await updateCourse(target.value.id, request);
      setCopyOpen(false);
      showNotice(`${target.title}에 ${routeStops.length}곳을 담았어요.`);
    } catch {
      showNotice("선택한 코스에 담지 못했어요.");
    } finally {
      setIsCopyingCourse(false);
    }
  }

  async function createCourseFromPublicCourse() {
    if (!apiCourse || isCopyingCourse) return;

    const title = copyNewTitle.trim() || `${courseTitle} 복사`;
    const newCourseId = `mine-${apiCourse.id}-${Date.now()}`;
    setIsCopyingCourse(true);

    try {
      const request = createCourseRequestFromStops({
        id: newCourseId,
        sourceCourse: apiCourse,
        stops: routeStops,
        title,
      });

      if (request) {
        const course = await createCourse(request);
        setCopyOpen(false);
        showNotice("새 내 코스로 담았어요.");
        queryClient.setQueryData<CourseResponse[]>(["courses", "me"], (courses) =>
          courses
            ? [course, ...courses.filter((item) => item.id !== course.id)]
            : [course],
        );
        navigate(`/course/${course.id}`, {
          replace: true,
          state: { createdAsMyCourse: true, createdCourseId: course.id },
        });
        return;
      }
    } catch {
      showNotice("새 내 코스로 담지 못했어요.");
    } finally {
      setIsCopyingCourse(false);
    }
  }

  async function applyOptimizedOrder() {
    if (!canEditCourse) return;
    if (!apiCourse || !optimizedCourse) {
      setOptimizeOpen(false);
      showNotice("AI 추천 동선으로 정리했어요.");
      return;
    }

    try {
      const updated = await updateCourse(
        apiCourse.id,
        toCourseUpdateRequest(optimizedCourse),
      );
      setApiCourse(updated);
      setOptimizeOpen(false);
      showNotice("AI 추천 동선으로 저장했어요.");
    } catch {
      showNotice("추천 순서를 저장하지 못했어요.");
    }
  }

  async function handleDirectOptimize() {
    if (!canEditCourse || !apiCourse || isOptimizing) return;

    setIsOptimizing(true);
    try {
      setBackupCourse(apiCourse);
      const recommended = await recommendCourseOrder(apiCourse.id);
      const updated = await updateCourse(
        apiCourse.id,
        toCourseUpdateRequest(recommended),
      );
      setApiCourse(updated);
      showNotice("AI 추천 동선으로 정리했어요.");
    } catch {
      showNotice("AI 동선 추천을 불러오지 못했어요.");
      setBackupCourse(null);
    } finally {
      setIsOptimizing(false);
    }
  }

  async function handleRestore() {
    if (!canEditCourse || !backupCourse || !apiCourse) return;

    try {
      const restored = await updateCourse(
        apiCourse.id,
        toCourseUpdateRequest(backupCourse),
      );
      setApiCourse(restored);
      setBackupCourse(null);
      showNotice("원래 순서로 복구했어요.");
    } catch {
      showNotice("원래 순서로 복구하지 못했어요.");
    }
  }

  async function handleCommitStopsOrder(newStops: CourseStop[]) {
    if (!canEditCourse) return;

    if (apiCourse) {
      const newItems = newStops.map((stop, index) => {
        if (!stop.sourceItem) {
          throw new Error("Matching item not found during reorder");
        }

        return {
          ...stop.sourceItem,
          position: index + 1,
        };
      });

      const updatedCourse = {
        ...apiCourse,
        coverImageUrl: getFirstRealStopImage(newStops) ?? apiCourse.coverImageUrl,
        items: newItems,
      };

      if (!backupCourse) {
        setBackupCourse(apiCourse);
      }

      setApiCourse(updatedCourse);

      try {
        const updated = await updateCourse(
          apiCourse.id,
          toCourseUpdateRequest(updatedCourse),
        );
        setApiCourse(updated);
        showNotice("순서를 저장했어요.");
      } catch {
        showNotice("순서 변경을 저장하지 못했어요.");
        if (backupCourse) {
          setApiCourse(backupCourse);
        } else {
          setApiCourse(apiCourse);
        }
      }
    }
  }

  const actionButtons = (
    <div className="flex items-center gap-1">
      <button aria-label="일정 이미지 저장" className="grid size-10 place-items-center rounded-full border-0 bg-transparent text-[#333]" onClick={() => setShareOpen(true)} type="button"><Download size={23} /></button>
      <button aria-label="전체 지도 보기" className="grid size-10 place-items-center rounded-full border-0 bg-transparent text-[#333]" onClick={() => setMapOpen(true)} type="button"><MapIcon size={24} /></button>
    </div>
  );

  return (
    <>
      <section className="flex h-dvh flex-col overflow-hidden bg-white text-[#111]">
        <motion.div animate={{ height: headerHeight }} className="relative flex-none overflow-hidden bg-white" transition={{ type: "spring", stiffness: 360, damping: 34 }}>
          <div className="absolute inset-x-0 top-0 px-5 pt-[calc(20px+env(safe-area-inset-top))] pb-5" style={{ transform: `translateY(-${headerOffset}px)`, pointerEvents: isHeaderCompact ? "none" : "auto" }}>
            <header className="flex items-center justify-between">
              <button aria-label="뒤로 가기" className="grid size-10 place-items-center rounded-full border-0 bg-transparent text-[#333]" onClick={() => navigate(-1)} type="button"><ArrowLeft size={27} /></button>
              {actionButtons}
            </header>
            <div className="mt-5">
              <div className="flex items-end gap-2"><h1 className="m-0 truncate text-2xl leading-tight font-black text-[#202020]">{courseTitle}</h1>{canEditCourse ? <button className="mb-1 border-0 bg-transparent p-1 text-[#9A958E] hover:text-[#FD4003] transition-colors" onClick={() => setEditOpen(true)} aria-label="코스 정보 수정" type="button"><Pencil size={15} strokeWidth={2.8} /></button> : null}</div>
              <p className="mt-1.5 mb-0 text-base font-extrabold text-[#777]">{dateLabel}</p>
              <p className="mt-1.5 mb-0 truncate text-base font-bold text-[#777]">{companion} | {styleLabel}</p>
            </div>
            {canEditCourse ? <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
              <button className="inline-flex h-10 flex-none items-center gap-1.5 rounded-full bg-[#1F3D35] px-4 text-sm font-extrabold text-white" onClick={() => setPlacePickerOpen(true)} type="button"><Plus size={20} />장소 추가하기</button>
            </div> : apiCourse ? <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
              <button className="inline-flex h-10 flex-none items-center gap-1.5 rounded-full bg-[#1F3D35] px-4 text-sm font-extrabold text-white" onClick={() => setCopyOpen(true)} type="button"><Plus size={18} />내 코스에 추가</button>
              <span className="inline-flex h-10 flex-none items-center rounded-full bg-[#F3F3F3] px-3 text-xs font-extrabold text-[#777]">탐색한 코스</span>
            </div> : <div className="mt-5 inline-flex rounded-full bg-[#F3F3F3] px-3 py-2 text-xs font-extrabold text-[#777]">보기 전용 일정</div>}
          </div>

          <div className="absolute inset-x-0 top-0 z-10 bg-white px-5 pt-[calc(10px+env(safe-area-inset-top))] pb-3" style={{ opacity: isHeaderCompact ? 1 : 0, pointerEvents: isHeaderCompact ? "auto" : "none" }}>
            <header className="flex items-center gap-2"><button aria-label="뒤로 가기" className="grid size-8 flex-none place-items-center rounded-full border-0 bg-transparent text-[#333]" onClick={() => navigate(-1)} type="button"><ArrowLeft size={23} /></button><div className="min-w-0 flex-1"><h1 className="m-0 truncate text-sm font-black text-[#555]">{courseTitle}</h1><p className="mt-0.5 mb-0 truncate text-xs font-bold text-[#9A958E]">{companion} · {styleLabel}</p></div>{actionButtons}</header>
          </div>
        </motion.div>

        <div className="relative min-h-0 flex-1 overflow-hidden bg-[#E7F0E8]" data-testid="course-route-stage">
          <CourseRouteMap
            activeStopId={activeStopId}
            routeStops={routeStops}
            style={{ height: COURSE_MAP_HEIGHT }}
          />
          <CourseRouteDrawer
            activeStopId={activeStopId}
            canEdit={canEditCourse}
            drawerCoverOffset={drawerCoverOffset}
            drawerTop={drawerTop}
            headerOffset={headerOffset}
            routeStops={routeStops}
            setActiveStopId={setActiveStopId}
            setDrawerCoverOffset={setDrawerCoverOffset}
            setHeaderOffset={setHeaderOffset}
            isRouteEditing={isRouteEditing}
            setIsRouteEditing={setIsRouteEditing}
            hasBackup={backupCourse !== null}
            onRestore={handleRestore}
            clearBackup={() => setBackupCourse(null)}
            hasApiCourse={apiCourse !== null}
            onDirectOptimize={handleDirectOptimize}
            isOptimizing={isOptimizing}
            drawerCollapsedTop={drawerCollapsedTop}
            headerCollapseDistance={headerCollapseDistance}
            onCommitStopsOrder={handleCommitStopsOrder}
          />
        </div>
      </section>

      {mapOpen ? <section className="fixed inset-0 z-[70] mx-auto flex w-full max-w-[430px] flex-col bg-white text-[#171717]">
        <header className="flex items-center gap-3 px-5 pt-[calc(16px+env(safe-area-inset-top))] pb-4"><button aria-label="지도 닫기" className="grid size-10 place-items-center rounded-full border-0 bg-[#F4F2EE]" onClick={() => setMapOpen(false)} type="button"><X size={21} /></button><div className="min-w-0 flex-1"><h2 className="m-0 truncate text-lg font-black">{courseTitle}</h2><p className="mt-0.5 mb-0 text-xs font-bold text-[#8B857C]">장소를 넘기며 동선을 확인해보세요</p></div></header>
        <CourseRouteMap activeStopId={activeStopId} className="min-h-0 flex-1" routeStops={routeStops} />
        <div className="flex flex-none snap-x gap-3 overflow-x-auto bg-white px-5 py-4 pb-[calc(18px+env(safe-area-inset-bottom))]">{routeStops.length > 0 ? routeStops.map((stop, index) => <button className={`flex w-[78%] flex-none snap-center items-center gap-3 rounded-2xl border p-3 text-left ${activeStopId === stop.id ? "border-[#1F3D35] bg-[#EEF4EF]" : "border-[#E7E3DC] bg-white"}`} key={stop.id} onClick={() => setActiveStopId(stop.id)} type="button"><span className="grid size-9 flex-none place-items-center rounded-full bg-[#1F3D35] text-sm font-black text-white">{index + 1}</span><span className="min-w-0"><strong className="block truncate text-sm font-black">{stop.title}</strong><span className="mt-1 block truncate text-xs font-bold text-[#8B857C]">{stop.category}</span></span></button>) : <p className="m-0 w-full text-center text-sm font-black text-[#8B857C]">아직 추가한 장소가 없어요.</p>}</div>
      </section> : null}

      {placePickerOpen ? (
        <CoursePlacePickerOverlay
          isAdding={isAddingPoint}
          onClose={() => setPlacePickerOpen(false)}
          onConfirm={addPointsToCourse}
        />
      ) : null}

      <BottomSheet isOpen={copyOpen} onClose={() => setCopyOpen(false)} title="내 코스에 추가">
        <div className="grid gap-5">
          <section>
            <div className="flex items-center justify-between gap-3">
              <strong className="text-sm font-black text-[#24211E]">기존 코스에 담기</strong>
              <span className="text-xs font-black text-[#FD4003]">{routeStops.length}곳</span>
            </div>
            <div className="mt-3 grid max-h-64 gap-2 overflow-y-auto pr-1">
              {myCoursesQuery.isLoading ? (
                <p className="m-0 rounded-2xl bg-[#F6F5F1] p-4 text-sm font-black text-[#8B857C]">
                  내 코스를 불러오는 중이에요.
                </p>
              ) : copyTargets.length === 0 ? (
                <p className="m-0 rounded-2xl bg-[#F6F5F1] p-4 text-sm font-black text-[#8B857C]">
                  아직 담을 수 있는 내 코스가 없어요.
                </p>
              ) : (
                copyTargets.map((target) => {
                  const selected = copyTargetId === target.id;

                  return (
                    <button
                      className={`flex min-h-16 items-center gap-3 rounded-2xl border px-3 text-left ${
                        selected
                          ? "border-[#1F3D35] bg-[#F0F5F1]"
                          : "border-[#EBE7E0] bg-white"
                      }`}
                      key={target.id}
                      onClick={() => setCopyTargetId(target.id)}
                      type="button"
                    >
                      <span className="grid size-10 flex-none place-items-center rounded-full bg-[#FFF0EA] text-sm font-black text-[#FD4003]">
                        {target.type === "api" ? "API" : "내"}
                      </span>
                      <span className="min-w-0 flex-1">
                        <strong className="block truncate text-sm font-black text-[#24211E]">
                          {target.title}
                        </strong>
                        <span className="mt-1 block truncate text-xs font-bold text-[#928C84]">
                          {target.meta}
                        </span>
                      </span>
                      {selected ? (
                        <span className="grid size-7 place-items-center rounded-full bg-[#1F3D35] text-white">
                          <CheckSquare size={15} />
                        </span>
                      ) : null}
                    </button>
                  );
                })
              )}
            </div>
            <button
              className="mt-3 min-h-13 w-full rounded-2xl border-0 bg-[#1F3D35] font-black text-white disabled:bg-[#D8D4CC]"
              disabled={!copyTargetId || isCopyingCourse}
              onClick={addPublicCourseToTarget}
              type="button"
            >
              {isCopyingCourse ? "담는 중..." : "선택한 코스에 담기"}
            </button>
          </section>

          <section className="border-t border-[#EEEAE3] pt-5">
            <strong className="text-sm font-black text-[#24211E]">새 코스로 담기</strong>
            <label className="mt-3 grid gap-2 text-xs font-black text-[#8B857C]">
              코스 이름
              <input
                className="min-h-13 rounded-2xl border border-[#E5E1DA] px-4 text-sm font-semibold text-[#24211E] outline-none focus:border-[#1F3D35]"
                maxLength={30}
                onChange={(event) => setCopyNewTitle(event.target.value)}
                value={copyNewTitle}
              />
            </label>
            <button
              className="mt-3 min-h-13 w-full rounded-2xl border-0 bg-[#FD4003] font-black text-white disabled:bg-[#F1C4B3]"
              disabled={isCopyingCourse || routeStops.length === 0}
              onClick={createCourseFromPublicCourse}
              type="button"
            >
              {isCopyingCourse ? "새 코스 만드는 중..." : "새 코스 만들어 담기"}
            </button>
          </section>
        </div>
      </BottomSheet>

      <BottomSheet isOpen={shareOpen} onClose={() => setShareOpen(false)} title="일정 저장하기"><div className="grid gap-3"><button className="flex min-h-16 items-center gap-3 rounded-2xl border border-[#E9E5DE] bg-white px-4 text-left" onClick={saveAsImage} type="button"><span className="grid size-11 place-items-center rounded-xl bg-[#EEF4EF] text-[#1F3D35]"><Download size={21} /></span><span><strong className="block text-sm font-black">긴 일정 이미지로 저장하기</strong><span className="mt-1 block text-xs font-bold text-[#8B857C]">전체 리스트를 세로 이미지로 저장해요</span></span></button></div></BottomSheet>

      <BottomSheet isOpen={editOpen} onClose={() => setEditOpen(false)} title="코스 정보 편집">
        <div className="grid gap-5">
          <label className="grid gap-2 text-sm font-black text-[#24211E]">
            코스 제목
            <input
              className="min-h-13 rounded-2xl border border-[#E5E1DA] px-4 font-semibold outline-none focus:border-[#1F3D35]"
              maxLength={30}
              onChange={(event) => setEditTitle(event.target.value)}
              value={editTitle}
            />
          </label>
          <div className="grid gap-2 text-sm font-black text-[#24211E]">
            <div className="flex items-center justify-between gap-3">
              <span>여행 날짜</span>
              <label className="inline-flex min-h-9 items-center gap-2 rounded-full border border-[#E4DED3] bg-[#FAF8F4] px-3 text-xs font-black text-[#5F5A54]">
                <input
                  checked={!editDate}
                  className="size-4 accent-[#1F3D35]"
                  onChange={(event) => {
                    setEditDate(event.target.checked ? "" : new Date().toISOString().split("T")[0]);
                  }}
                  type="checkbox"
                />
                미정
              </label>
            </div>
            <CourseDraftCalendar
              month={calendarMonth}
              onMonthChange={setCalendarMonth}
              onSelectDate={setEditDate}
              selectedDate={editDate}
              undecided={!editDate}
            />
          </div>
          <div className="grid grid-cols-[42px_1fr] items-center gap-2 text-sm font-black text-[#24211E]">
            <h3 className="m-0 text-sm font-extrabold">태그</h3>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none [&::-webkit-scrollbar]:hidden">
                {editTags.map((tag, index) => (
                  <label
                    className="inline-flex h-8 min-w-0 flex-none items-center gap-1 rounded-none bg-[#F5F5F5] px-2 text-xs font-bold text-[#4A4641]"
                    key={index}
                  >
                    <span className="font-black text-[#FD4003]">#</span>
                    <input
                      className="w-10 min-w-0 border-0 bg-transparent text-xs font-bold text-[#4A4641] outline-none"
                      maxLength={6}
                      onChange={(event) => {
                        const newTags = [...editTags];
                        newTags[index] = event.target.value.replace(/^#/, "");
                        setEditTags(newTags);
                      }}
                      placeholder="태그"
                      value={tag}
                    />
                    <button
                      aria-label={`${tag || "태그"} 태그 삭제`}
                      className="text-[#A8A8A8]"
                      onClick={() => setEditTags(editTags.filter((_, i) => i !== index))}
                      type="button"
                    >
                      <X size={11} strokeWidth={2.6} />
                    </button>
                  </label>
                ))}
                <button
                  aria-label="태그 추가"
                  className="grid size-8 flex-none place-items-center bg-[#F5F5F5] text-[#A8A8A8] transition-colors hover:text-[#FD4003]"
                  onClick={() => setEditTags([...editTags, ""])}
                  type="button"
                >
                  <Plus size={15} strokeWidth={2.8} />
                </button>
              </div>
            </div>
          </div>
          <button
            className="min-h-14 rounded-2xl border-0 bg-[#FD4003] font-black text-white disabled:bg-[#F1C4B3] shadow-[0_6px_16px_rgba(253,64,3,0.16)]"
            disabled={isSavingEdit || !editTitle.trim()}
            onClick={saveCourseEdit}
            type="button"
          >
            {isSavingEdit ? "저장 중..." : "저장하기"}
          </button>
        </div>
      </BottomSheet>

      <BottomSheet isOpen={friendsOpen} onClose={() => setFriendsOpen(false)} title="친구에게 코스 공유"><p className="mt-0 text-sm font-bold text-[#8B857C]">서비스 안에서 이미 친구가 된 사람에게만 공유 요청을 보낼 수 있어요. 친구가 알림에서 수락해야 코스를 볼 수 있고, 수락 후에도 수정은 코스장인 나만 할 수 있어요.</p><div className="mt-4 grid gap-2">{friendsQuery.isLoading ? <p className="m-0 rounded-2xl bg-[#F6F5F1] p-4 text-sm font-black text-[#8B857C]">친구 목록을 불러오는 중이에요.</p> : (friendsQuery.data ?? []).length === 0 ? <p className="m-0 rounded-2xl bg-[#F6F5F1] p-4 text-sm font-black text-[#8B857C]">아직 공유할 수 있는 친구가 없어요.</p> : (friendsQuery.data ?? []).map((friend) => { const selected = selectedFriends.includes(friend.userId); return <button className={`flex min-h-16 items-center gap-3 rounded-2xl border px-3 text-left ${selected ? "border-[#1F3D35] bg-[#F0F5F1]" : "border-[#EBE7E0] bg-white"}`} key={friend.userId} onClick={() => setSelectedFriends((current) => selected ? current.filter((userId) => userId !== friend.userId) : [...current, friend.userId])} type="button"><span className="grid size-11 place-items-center rounded-full bg-[#DDEADB] text-sm font-black text-[#1F3D35]">{friend.displayName.slice(0, 1).toUpperCase() || "?"}</span><span className="min-w-0 flex-1"><strong className="block truncate font-black">{friend.displayName}</strong><span className="mt-1 block truncate text-xs font-bold text-[#928C84]">{friend.email ?? "서비스 친구"} · 수락 후 보기 전용</span></span>{selected ? <span className="grid size-7 place-items-center rounded-full bg-[#1F3D35] text-white"><CheckSquare size={15} /></span> : null}</button>; })}</div><button className="mt-5 min-h-14 w-full rounded-2xl border-0 bg-[#1F3D35] font-black text-white disabled:bg-[#D8D4CC]" disabled={friendsQuery.isLoading} onClick={saveFriends} type="button">{selectedFriends.length > 0 ? `${selectedFriends.length}명에게 공유 요청 보내기` : "공유하지 않기"}</button></BottomSheet>

      <BottomSheet isOpen={optimizeOpen} onClose={() => setOptimizeOpen(false)} title="AI 동선 정리"><div className="rounded-2xl bg-[#EEF4EF] p-4"><div className="flex items-center gap-2 text-[#1F3D35]"><WandSparkles size={21} /><strong className="font-black">{isOptimizing ? "AI가 동선을 계산하고 있어요" : apiCourse ? "서버 추천 동선을 불러왔어요" : "걷는 시간을 약 18분 줄일 수 있어요"}</strong></div><p className="mt-2 mb-0 text-sm leading-relaxed font-semibold text-[#667069]">{apiCourse ? "적용하면 추천 순서를 내 코스에 저장해요." : "가까운 장소끼리 묶고 마지막 장소가 대중교통과 이어지도록 순서를 정리했어요."}</p></div><div className="mt-4 flex flex-wrap items-center gap-2">{(optimizedCourse ? toDisplayRouteStops(optimizedCourse, attractionDetails) : routeStops).map((stop, index) => <span className="inline-flex items-center gap-1 text-xs font-black text-[#5D5852]" key={stop.id}><span className="grid size-6 place-items-center rounded-full bg-[#FD4003] text-white">{index + 1}</span>{stop.title}{index < routeStops.length - 1 ? <ChevronRight size={14} className="text-[#AAA49B]" /> : null}</span>)}</div><button className="mt-6 min-h-14 w-full rounded-2xl border-0 bg-[#1F3D35] font-black text-white disabled:bg-[#D8D4CC]" disabled={isOptimizing} onClick={applyOptimizedOrder} type="button">{isOptimizing ? "추천 받는 중..." : "이 순서로 적용하기"}</button></BottomSheet>

      {notice ? <div className="fixed inset-x-5 bottom-[calc(24px+env(safe-area-inset-bottom))] z-90 mx-auto max-w-[390px] rounded-2xl bg-[#171717] px-4 py-3 text-center text-sm font-black text-white shadow-xl">{notice}</div> : null}
    </>
  );
}
