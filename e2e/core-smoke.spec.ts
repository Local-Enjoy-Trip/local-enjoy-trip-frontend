import { expect, test, type Route } from "@playwright/test";

const mockUser = {
  createdAt: "2026-07-05T00:00:00Z",
  email: "tester@example.com",
  name: "테스터",
  nickname: "테스터",
  profileImageUrl: null,
  representativeLatitude: 37.5446,
  representativeLongitude: 127.0557,
  representativeRegionName: "성수동",
  userId: "user-e2e",
};

const emptyCourseList = { courses: [] };
const emptyNotes = { notes: [] };

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.sessionStorage.setItem("local-enjoy-trip-access-token", "e2e-token");
    window.sessionStorage.setItem(
      "local-enjoy-trip-auth-expires-at",
      String(Date.now() + 60 * 60 * 1000),
    );
    window.sessionStorage.setItem("local-enjoy-trip-auth-provider", "email");
    window.sessionStorage.setItem("local-enjoy-trip-auth-user-id", "user-e2e");
  });

  await page.route("**/api/**", routeApi);
});

test("core authenticated user journey stays usable", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText(/테스터님,/)).toBeVisible();

  await page.getByRole("link", { name: "탐색" }).click();
  await expect(page.getByText("새 하루 코스 만들기")).toBeVisible();

  await page.getByText("새 하루 코스 만들기").click();
  await page.getByRole("button", { name: /AI 추천받기/ }).click();

  await page.getByRole("button", { name: "성수" }).click();
  await page.getByRole("button", { name: /다음/ }).click();
  await page.getByRole("button", { name: "친구와" }).click();
  await page.getByRole("button", { name: /다음/ }).click();
  await page.getByRole("button", { name: "로컬 산책" }).click();
  await page.getByRole("button", { name: /다음/ }).click();
  await page.getByRole("button", { name: "알맞게" }).click();
  await page.getByRole("button", { name: /내 코스 추천받기/ }).click();

  await expect(page.getByText("AI 추천 완성")).toBeVisible();
  await expect(page.getByText("성수 산책 코스")).toBeVisible();
  await expect(page.getByText("서울숲")).toBeVisible();

  await page.goto("/note/new");
  await expect(page.getByRole("heading", { name: "테스터님의 쪽지" })).toBeVisible();
  await page
    .getByLabel("쪽지 내용")
    .fill("리팩토링 후에도 쪽지 작성 화면이 정상 동작해요.");
  await page.getByRole("button", { name: "태그 추가" }).click();
  await page.getByPlaceholder("태그").fill("산책");
  await expect(page.getByLabel("쪽지 내용")).toHaveValue(
    "리팩토링 후에도 쪽지 작성 화면이 정상 동작해요.",
  );
  await expect(page.getByPlaceholder("태그")).toHaveValue("산책");

  await page.getByRole("link", { name: "마이" }).click();
  await expect(page.getByRole("heading", { name: "마이페이지" })).toBeVisible();
  await expect(page.getByRole("button", { name: "내 쪽지" })).toBeVisible();
});

async function routeApi(route: Route) {
  const request = route.request();
  const url = new URL(request.url());
  const path = url.pathname;

  if (path === "/api/members/me") {
    await fulfillJson(route, { user: mockUser });
    return;
  }

  if (path === "/api/courses/me") {
    await fulfillJson(route, emptyCourseList);
    return;
  }

  if (path === "/api/courses/recommendations") {
    await fulfillJson(route, emptyCourseList);
    return;
  }

  if (path === "/api/courses/ai-generate") {
    await fulfillJson(route, {
      title: "성수 산책 코스",
      stops: [
        {
          attractionId: 101,
          title: "서울숲",
          addr1: "서울 성동구 뚝섬로 273",
          firstImage: placeholderImage,
        },
        {
          attractionId: 102,
          title: "성수 카페거리",
          addr1: "서울 성동구 성수동2가",
          firstImage: placeholderImage,
        },
      ],
    });
    return;
  }

  if (path === "/api/attractions/101") {
    await fulfillJson(route, {
      id: 101,
      title: "서울숲",
      address: "서울 성동구 뚝섬로 273",
      imageUrl: placeholderImage,
      latitude: 37.5446,
      longitude: 127.0374,
      overview: "성수의 대표 산책 장소",
    });
    return;
  }

  if (path === "/api/attractions/102") {
    await fulfillJson(route, {
      id: 102,
      title: "성수 카페거리",
      address: "서울 성동구 성수동2가",
      imageUrl: placeholderImage,
      latitude: 37.5422,
      longitude: 127.0567,
      overview: "로컬 카페가 모인 거리",
    });
    return;
  }

  if (path === "/api/neighborhood/briefing") {
    await fulfillJson(route, {
      briefing: "산책하기 좋은 날씨예요.",
      forecasts: [],
      region: "성수동",
      weather: {
        condition: "맑음",
        rainChance: 0,
        region: "성수동",
        sunrise: null,
        sunset: null,
        temperature: 22,
        tempMax: 25,
        tempMin: 18,
      },
    });
    return;
  }

  if (path === "/api/attractions/popular-nearby") {
    await fulfillJson(route, {
      attractions: [
        {
          addr1: "서울 성동구",
          addr2: "",
          contentTypeId: "12",
          distanceMeters: 300,
          firstImage: placeholderImage,
          id: 201,
          latitude: 37.5446,
          longitude: 127.0557,
          popularityCount: 7,
          saveCount: 3,
          title: "성수 산책길",
        },
      ],
    });
    return;
  }

  if (path === "/api/notes/nearby" || path === "/api/notes/recommendations") {
    await fulfillJson(route, emptyNotes);
    return;
  }

  if (path === "/api/notes/me" || path === "/api/notes/saved") {
    await fulfillJson(route, emptyNotes);
    return;
  }

  if (path === "/api/friendships" || path === "/api/friendships/requests/received") {
    await fulfillJson(route, path.endsWith("/received") ? { requests: [] } : { friends: [] });
    return;
  }

  await fulfillJson(route, {});
}

async function fulfillJson(route: Route, body: unknown) {
  await route.fulfill({
    body: JSON.stringify(body),
    contentType: "application/json",
  });
}

const placeholderImage =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23e9e7e2'/%3E%3Ctext x='200' y='155' text-anchor='middle' font-size='28' fill='%23716c65'%3ESmoke%3C/text%3E%3C/svg%3E";
