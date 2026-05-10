import { readFile } from "node:fs/promises";
import { expect, test, type Page } from "@playwright/test";

const APP_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173";

async function openSignUpTab(page: Page) {
  await page.getByRole("tab", { name: "계정 생성" }).click();
}

async function signUpAndEnter(
  page: Page,
  options: {
    email: string;
    displayName?: string;
    password?: string;
  },
) {
  await openSignUpTab(page);
  await page
    .getByLabel("이름")
    .fill(options.displayName ?? "김우중");
  await page.getByLabel("이메일", { exact: true }).fill(options.email);
  await page
    .getByLabel("비밀번호", { exact: true })
    .fill(options.password ?? "password123");
  await page.getByRole("button", { name: "계정 생성" }).click();
  await expect(page.getByLabel("보고서 편집")).toBeVisible();
}

test("shows a dedicated auth gate before login", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "사역보고서 v2" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "로그인" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "로그인" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(page.getByLabel("보고서 입력")).toHaveCount(0);
});

test("serves installable PWA metadata", async ({ request }) => {
  const manifestResponse = await request.get("/manifest.webmanifest");
  const manifest = await manifestResponse.json();

  expect(manifest.icons).toContainEqual({
    src: "/icon.svg",
    sizes: "any",
    type: "image/svg+xml",
    purpose: "any maskable",
  });

  const iconResponse = await request.get("/icon.svg");

  expect(iconResponse.ok()).toBe(true);
  expect(iconResponse.headers()["content-type"]).toContain("image/svg+xml");

  const pageResponse = await request.get("/");
  const html = await pageResponse.text();

  expect(html).toContain('<link rel="icon" type="image/svg+xml" href="/icon.svg" />');
  expect(html).toContain('<meta name="apple-mobile-web-app-capable" content="yes" />');
  expect(html).toContain('<meta name="apple-mobile-web-app-title" content="사역보고서" />');
});

test("prints viewer reports without app controls", async ({ page }) => {
  await page.goto("/");
  await signUpAndEnter(page, { email: "print@example.com" });
  await page.getByRole("button", { name: "뷰어" }).click();

  await page.evaluate(() => {
    window.print = () => {
      window.dispatchEvent(new Event("print-requested"));
    };
  });
  const printRequested = page.evaluate(
    () =>
      new Promise((resolve) => {
        window.addEventListener("print-requested", () => resolve(true), {
          once: true,
        });
      }),
  );

  await page.getByRole("button", { name: "인쇄" }).click();
  await expect(printRequested).resolves.toBe(true);

  await page.emulateMedia({ media: "print" });

  await expect(page.locator(".top-bar")).toBeHidden();
  await expect(page.locator(".viewer-actions")).toBeHidden();
  await expect(page.locator(".report-canvas")).toBeVisible();
});

test("edits report fields and shows the same data in viewer mode", async ({ page }) => {
  await page.goto("/");
  await signUpAndEnter(page, { email: "editor@example.com" });
  const elementarySection = page.locator(".department-edit").first();

  await page.getByLabel("제목", { exact: true }).fill("5월 첫째 주 사역보고");
  await page.getByLabel("보고일").fill("2026-05-03");
  await expect(page.getByLabel("교회")).toHaveCount(0);
  await expect(page.getByLabel("보고자", { exact: true })).toHaveValue("김우중");
  await elementarySection.getByRole("button", { name: "인원추가" }).click();
  await elementarySection.getByLabel("인원 추가").fill("새친구");
  await elementarySection.getByRole("button", { name: "추가", exact: true }).click();
  await elementarySection.getByRole("button", { name: /새친구.*결석/ }).click();
  await page
    .getByRole("group", { name: "부서별 보고" })
    .getByLabel("요약")
    .first()
    .fill("유초등부 새 학기 적응");
  await page.getByLabel("기도제목").fill("아이들의 믿음 성장을 위해");
  await page.getByLabel("광고 / 다음 계획").fill("다음 주 교사 모임");

  await expect(page.getByRole("heading", { name: "5월 첫째 주 사역보고" })).toBeVisible();
  await expect(page.locator(".department-list").getByText("3명", { exact: true })).toBeVisible();
  await expect(
    page.locator(".department-list").getByText("유초등부 새 학기 적응"),
  ).toBeVisible();

  await page.getByRole("button", { name: "뷰어" }).click();

  await expect(page.getByRole("heading", { name: "5월 첫째 주 사역보고" })).toBeVisible();
  await expect(page.getByText("연천장로교회")).toBeVisible();
  await expect(page.getByText("아이들의 믿음 성장을 위해")).toBeVisible();
  await expect(page.getByText("다음 주 교사 모임")).toBeVisible();
});

test("exports the current report as JSON", async ({ page }) => {
  await page.goto("/");
  await signUpAndEnter(page, { email: "export@example.com" });
  const elementarySection = page.locator(".department-edit").first();

  await page.getByLabel("제목", { exact: true }).fill("단일 내보내기 보고");
  await page.getByLabel("보고일").fill("2026-05-17");
  await expect(page.getByLabel("교회")).toHaveCount(0);

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "내보내기" }).click();
  const download = await downloadPromise;
  const exportPath = await download.path();

  expect(download.suggestedFilename()).toBe(
    "2026-05-17-ministry-report-v2.json",
  );
  expect(exportPath).toBeTruthy();

  const report = JSON.parse(await readFile(exportPath ?? "", "utf8"));

  expect(report.schemaVersion).toBe(2);
  expect(report.title).toBe("단일 내보내기 보고");
  expect(report.reportDate).toBe("2026-05-17");
  expect(report.churchName).toBe("연천장로교회");
  expect(report.departments.elementary).toMatchObject({
    key: "elementary",
    name: "유초등부",
    attendance: 2,
  });
  expect(report.departments.elementary.members).toEqual([
    expect.objectContaining({ name: "권상우", status: "present" }),
    expect.objectContaining({ name: "천주아", status: "present" }),
  ]);
});

test("creates an account and enters the app", async ({ page }) => {
  await page.goto("/");

  await signUpAndEnter(page, { email: "reporter@example.com" });

  await expect(
    page.getByLabel("보고자 계정").getByText("김우중", { exact: true }),
  ).toBeVisible();
  await expect(
    page.locator(".account-card").getByText("reporter@example.com"),
  ).toBeVisible();
  await expect(page.getByLabel("보고자", { exact: true })).toHaveValue("김우중");
});

test("looks up an account and shows a masked email", async ({ page }) => {
  await page.goto("/");
  await signUpAndEnter(page, { email: "lookup@example.com" });
  await page.getByRole("button", { name: "로그아웃" }).click();

  await page.getByRole("tab", { name: "계정 찾기" }).click();
  await page.getByLabel("이름").fill("김우중");
  await page.getByLabel("가입 이메일").fill("lookup@example.com");
  await page.getByRole("button", { name: "계정 확인" }).click();

  await expect(page.getByRole("status")).toContainText("가입 이메일: lo***@example.com");
  await expect(page.getByText("비밀번호는 관리자 복구가 필요합니다.")).toBeVisible();
});

test("shows a generic error when account lookup fails", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("tab", { name: "계정 찾기" }).click();
  await page.getByLabel("이름").fill("없는 사람");
  await page.getByLabel("가입 이메일").fill("missing@example.com");
  await page.getByRole("button", { name: "계정 확인" }).click();

  await expect(page.getByRole("alert")).toContainText(
    "일치하는 계정을 찾지 못했습니다.",
  );
});

test("prevents duplicate reporter emails", async ({ page }) => {
  await page.goto("/");
  await signUpAndEnter(page, { email: "duplicate@example.com" });
  await page.getByRole("button", { name: "로그아웃" }).click();

  await openSignUpTab(page);
  await page.getByLabel("이름").fill("중복 계정");
  await page
    .getByLabel("이메일", { exact: true })
    .fill("DUPLICATE@Example.com");
  await page.getByLabel("비밀번호", { exact: true }).fill("password456");
  await page.getByRole("button", { name: "계정 생성" }).click();

  await expect(page.getByRole("alert")).toContainText(
    "이미 등록된 이메일입니다.",
  );
  await expect(page.getByLabel("보고서 입력")).toHaveCount(0);
});

test("rejects invalid reporter email signup", async ({ page }) => {
  await page.goto("/");
  await openSignUpTab(page);

  const emailInput = page.getByLabel("이메일", { exact: true });
  await page.getByLabel("이름").fill("김우중");
  await emailInput.fill("not-an-email");
  await page.getByLabel("비밀번호", { exact: true }).fill("password123");
  await page.getByRole("button", { name: "계정 생성" }).click();

  await expect
    .poll(() => emailInput.evaluate((element) => element.checkValidity()))
    .toBe(false);
  await expect(page.locator(".account-card")).toHaveCount(0);
  await expect(page.getByLabel("보고서 입력")).toHaveCount(0);
});

test("rejects weak reporter password signup", async ({ page }) => {
  await page.goto("/");
  await openSignUpTab(page);

  await page.getByLabel("이름").fill("김우중");
  await page.getByLabel("이메일", { exact: true }).fill("weak-password@example.com");
  await page.getByLabel("비밀번호", { exact: true }).fill("short");
  await page.getByRole("button", { name: "계정 생성" }).click();

  await expect(page.getByRole("alert")).toContainText(
    "이메일 또는 비밀번호를 확인해 주세요.",
  );
  await expect(page.locator(".account-card")).toHaveCount(0);
  await expect(page.getByLabel("보고서 입력")).toHaveCount(0);
});

test("rejects blank reporter name signup", async ({ page }) => {
  await page.goto("/");
  await openSignUpTab(page);

  await page.getByLabel("이름").fill("   ");
  await page.getByLabel("이메일", { exact: true }).fill("missing-name@example.com");
  await page.getByLabel("비밀번호", { exact: true }).fill("password123");
  await page.getByRole("button", { name: "계정 생성" }).click();

  await expect(page.getByRole("alert")).toContainText(
    "이메일 또는 비밀번호를 확인해 주세요.",
  );
  await expect(page.locator(".account-card")).toHaveCount(0);
  await expect(page.getByLabel("보고서 입력")).toHaveCount(0);
});

test("requires report title before saving", async ({ page }) => {
  await page.goto("/");
  await signUpAndEnter(page, { email: "missing-title@example.com" });

  await page.getByLabel("제목", { exact: true }).fill("");
  await page.getByLabel("보고일").fill("");
  await page.getByRole("button", { name: "저장" }).click();

  await expect(page.getByRole("status")).toContainText("제목을 입력해 주세요.");
  await expect(page.getByLabel("저장 오류")).toContainText("제목을 입력해 주세요.");
  await expect(page.getByLabel("저장 오류")).toContainText("보고일을 선택해 주세요.");
  await expect(page.getByText("저장된 보고서가 없습니다.")).toBeVisible();
});

test("logs in with an existing reporter account", async ({ page }) => {
  await page.goto("/");
  await signUpAndEnter(page, { email: "login@example.com" });

  await page.getByRole("button", { name: "로그아웃" }).click();

  await page.getByLabel("로그인 이메일").fill("login@example.com");
  await page.getByLabel("로그인 비밀번호").fill("password123");
  await page.getByRole("button", { name: "로그인" }).click();

  await expect(page.locator(".account-card").getByText("login@example.com")).toBeVisible();
  await expect(page.getByRole("button", { name: "저장" })).toBeEnabled();
});

test("logs in with a normalized email address", async ({ page }) => {
  await page.goto("/");
  await signUpAndEnter(page, { email: "normalized@example.com" });

  await page.getByRole("button", { name: "로그아웃" }).click();

  await page.getByLabel("로그인 이메일").fill("  NORMALIZED@Example.com ");
  await page.getByLabel("로그인 비밀번호").fill("password123");
  await page.getByRole("button", { name: "로그인" }).click();

  await expect(
    page.locator(".account-card").getByText("normalized@example.com"),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "저장" })).toBeEnabled();
});

test("keeps save disabled after an invalid login", async ({ page }) => {
  await page.goto("/");
  await signUpAndEnter(page, { email: "invalid-login@example.com" });
  await expect(page.locator(".account-card")).toContainText(
    "invalid-login@example.com",
  );

  await page.getByRole("button", { name: "로그아웃" }).click();
  await page.getByLabel("로그인 이메일").fill("invalid-login@example.com");
  await page.getByLabel("로그인 비밀번호").fill("wrong-password");
  await page.getByRole("button", { name: "로그인" }).click();

  await expect(page.getByRole("alert")).toContainText(
    "이메일 또는 비밀번호를 확인해 주세요.",
  );
  await expect(page.getByRole("heading", { name: "로그인" })).toBeVisible();
  await expect(page.getByLabel("보고서 입력")).toHaveCount(0);
});

test("lets an admin set a temporary password for a reporter", async ({ page }) => {
  await page.goto("/");
  await signUpAndEnter(page, { email: "recover@example.com" });

  await page
    .getByLabel("복구 대상")
    .selectOption({ label: "김우중 (recover@example.com) - 정상" });
  await page.getByLabel("임시 비밀번호").fill("temporary123");
  await page.getByRole("button", { name: "임시 비밀번호 설정" }).click();

  await expect(page.getByLabel("비밀번호 복구").getByRole("status")).toContainText(
    "임시 비밀번호가 설정되었습니다.",
  );
  await expect(page.getByLabel("비밀번호 복구")).toContainText(
    "비밀번호 변경 필요",
  );
  await expect(
    page.getByLabel("보고자 계정").getByText("비밀번호 변경 필요"),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "저장" })).toBeDisabled();

  await page.getByLabel("현재/임시 비밀번호").fill("temporary123");
  await page.getByLabel("새 비밀번호").fill("changed123");
  await page.getByRole("button", { name: "비밀번호 변경" }).click();

  await expect(page.getByLabel("보고자 계정").getByRole("status")).toContainText(
    "비밀번호가 변경되었습니다.",
  );
  await expect(page.getByText("비밀번호 변경 필요")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "저장" })).toBeEnabled();
});

test("shows password change after logging in with a temporary password", async ({
  page,
}) => {
  await page.goto("/");
  await signUpAndEnter(page, { email: "temp-login@example.com" });

  await page
    .getByLabel("복구 대상")
    .selectOption({ label: "김우중 (temp-login@example.com) - 정상" });
  await page.getByLabel("임시 비밀번호").fill("temporary123");
  await page.getByRole("button", { name: "임시 비밀번호 설정" }).click();
  await page.getByRole("button", { name: "로그아웃" }).click();

  await page.getByLabel("로그인 이메일").fill("temp-login@example.com");
  await page.getByLabel("로그인 비밀번호").fill("temporary123");
  await page.getByRole("button", { name: "로그인" }).click();

  await expect(
    page.getByLabel("보고자 계정").getByText("비밀번호 변경 필요"),
  ).toBeVisible();
  await expect(page.getByLabel("현재/임시 비밀번호")).toBeVisible();
  await expect(page.getByLabel("새 비밀번호")).toBeVisible();
  await expect(page.getByRole("button", { name: "저장" })).toBeDisabled();
});

test("accepts only the changed password after a temporary password reset", async ({
  page,
}) => {
  await page.goto("/");
  await signUpAndEnter(page, { email: "password-rotate@example.com" });

  await page
    .getByLabel("복구 대상")
    .selectOption({ label: "김우중 (password-rotate@example.com) - 정상" });
  await page.getByLabel("임시 비밀번호").fill("temporary123");
  await page.getByRole("button", { name: "임시 비밀번호 설정" }).click();
  await page.getByRole("button", { name: "로그아웃" }).click();

  await page.getByLabel("로그인 이메일").fill("password-rotate@example.com");
  await page.getByLabel("로그인 비밀번호").fill("temporary123");
  await page.getByRole("button", { name: "로그인" }).click();

  await expect(
    page.getByLabel("보고자 계정").getByText("비밀번호 변경 필요"),
  ).toBeVisible();

  await page.getByLabel("현재/임시 비밀번호").fill("temporary123");
  await page.getByLabel("새 비밀번호").fill("renewed123");
  await page.getByRole("button", { name: "비밀번호 변경" }).click();

  await expect(page.getByLabel("보고자 계정").getByRole("status")).toContainText(
    "비밀번호가 변경되었습니다.",
  );

  await page.getByRole("button", { name: "로그아웃" }).click();
  await page.getByLabel("로그인 이메일").fill("password-rotate@example.com");
  await page.getByLabel("로그인 비밀번호").fill("temporary123");
  await page.getByRole("button", { name: "로그인" }).click();

  await expect(page.getByRole("alert")).toContainText(
    "이메일 또는 비밀번호를 확인해 주세요.",
  );
  await expect(page.getByRole("heading", { name: "로그인" })).toBeVisible();
  await expect(page.getByLabel("보고서 입력")).toHaveCount(0);

  await page.getByLabel("로그인 비밀번호").fill("renewed123");
  await page.getByRole("button", { name: "로그인" }).click();

  await expect(
    page.getByLabel("보고자 계정").getByText("비밀번호 변경 필요"),
  ).toHaveCount(0);
  await expect(page.getByRole("button", { name: "저장" })).toBeEnabled();
});

test("rejects a weak temporary password during admin recovery", async ({ page }) => {
  await page.goto("/");
  await signUpAndEnter(page, { email: "weak-recovery@example.com" });

  await page
    .getByLabel("복구 대상")
    .selectOption({ label: "김우중 (weak-recovery@example.com) - 정상" });
  await page.getByLabel("임시 비밀번호").fill("short");
  await page.getByRole("button", { name: "임시 비밀번호 설정" }).click();

  await expect(page.getByLabel("비밀번호 복구")).toContainText(
    "8자 이상의 임시 비밀번호를 입력해 주세요.",
  );
  await expect(
    page.getByLabel("보고자 계정").getByText("비밀번호 변경 필요"),
  ).toHaveCount(0);
  await expect(page.getByRole("button", { name: "저장" })).toBeEnabled();
});

test("rejects a weak new password during forced password change", async ({ page }) => {
  await page.goto("/");
  await signUpAndEnter(page, { email: "weak-change@example.com" });

  await page
    .getByLabel("복구 대상")
    .selectOption({ label: "김우중 (weak-change@example.com) - 정상" });
  await page.getByLabel("임시 비밀번호").fill("temporary123");
  await page.getByRole("button", { name: "임시 비밀번호 설정" }).click();

  await page.getByLabel("현재/임시 비밀번호").fill("temporary123");
  await page.getByLabel("새 비밀번호").fill("short");
  await page.getByRole("button", { name: "비밀번호 변경" }).click();

  await expect(page.getByLabel("보고자 계정").getByRole("status")).toContainText(
    "비밀번호를 확인해 주세요.",
  );
  await expect(
    page.getByLabel("보고자 계정").getByText("비밀번호 변경 필요"),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "저장" })).toBeDisabled();
});

test("rejects an incorrect temporary password during forced password change", async ({
  page,
}) => {
  await page.goto("/");
  await signUpAndEnter(page, { email: "wrong-current@example.com" });

  await page
    .getByLabel("복구 대상")
    .selectOption({ label: "김우중 (wrong-current@example.com) - 정상" });
  await page.getByLabel("임시 비밀번호").fill("temporary123");
  await page.getByRole("button", { name: "임시 비밀번호 설정" }).click();

  await page.getByLabel("현재/임시 비밀번호").fill("wrong-current");
  await page.getByLabel("새 비밀번호").fill("renewed123");
  await page.getByRole("button", { name: "비밀번호 변경" }).click();

  await expect(page.getByLabel("보고자 계정").getByRole("status")).toContainText(
    "비밀번호를 확인해 주세요.",
  );
  await expect(
    page.getByLabel("보고자 계정").getByText("비밀번호 변경 필요"),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "저장" })).toBeDisabled();
});

test("creates a new blank report draft", async ({ page }) => {
  await page.goto("/");
  await signUpAndEnter(page, { email: "new-report@example.com" });
  const elementarySection = page.locator(".department-edit").first();

  await page.getByLabel("제목", { exact: true }).fill("이전 보고서");
  await elementarySection.getByRole("button", { name: /권상우.*출석/ }).click();
  await elementarySection.getByRole("button", { name: /천주아.*출석/ }).click();

  await page.getByRole("button", { name: "새 보고서" }).click();

  await expect(page.getByRole("status")).toContainText(
    "새 보고서를 만들었습니다.",
  );
  await expect(page.getByLabel("제목", { exact: true })).toHaveValue(
    "주간 사역보고서",
  );
  await expect(page.getByLabel("보고자", { exact: true })).toHaveValue("김우중");
  await expect(page.locator(".department-list").getByText("2명").first()).toBeVisible();
  await expect(
    page.locator(".department-edit").first().getByRole("button", {
      name: /권상우.*출석/,
    }),
  ).toBeVisible();
});

test("restores the current draft after reload", async ({ page }) => {
  await page.goto("/");
  await signUpAndEnter(page, { email: "draft@example.com" });
  const elementarySection = page.locator(".department-edit").first();

  await page.getByLabel("제목", { exact: true }).fill("저장 전 자동 초안");
  await elementarySection.getByRole("button", { name: /권상우.*출석/ }).click();
  await page.getByLabel("기도제목").fill("자동 저장 확인");

  await page.reload();

  await expect(page.getByLabel("제목", { exact: true })).toHaveValue(
    "저장 전 자동 초안",
  );
  await expect(
    page.locator(".department-edit").first().getByRole("button", {
      name: /권상우.*결석/,
    }),
  ).toBeVisible();
  await expect(page.getByLabel("기도제목")).toHaveValue("자동 저장 확인");
});

test("imports legacy history JSON and reloads the latest report", async ({ page }) => {
  await page.goto("/");
  await signUpAndEnter(page, { email: "legacy-import@example.com" });

  const history = [
    {
      date: "2026-04-19",
      youth: { present: 5, absent: 1, total: 6 },
      young: { present: 8, absent: 2, total: 10 },
      nextWeekPlan: "이전 보고",
    },
    {
      date: "2026-04-26",
      youth: { present: 7, absent: 6, total: 13 },
      young: { present: 14, absent: 4, total: 18 },
      nextWeekPlan: "다음 주 정상 예배",
      prayer: "결석자들을 위해",
    },
  ];

  await page.getByLabel("기존 JSON").setInputFiles({
    name: "history.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(history)),
  });

  await expect(page.getByRole("status")).toContainText("2개 보고서를 가져왔습니다.");
  await expect(page.locator(".report-canvas").getByText("2026-04-26")).toBeVisible();
  await expect(page.locator(".report-canvas").getByText("21명")).toBeVisible();
  await expect(
    page.getByRole("button", { name: /2026-04-26 주간 사역보고서 현재 21명/ }),
  ).toBeVisible();

  await page.getByRole("button", { name: /2026-04-19 주간 사역보고서 13명/ }).click();

  await expect(page.getByRole("status")).toContainText(
    "2026-04-19 보고서를 불러왔습니다.",
  );
  await expect(page.locator(".report-canvas").getByText("2026-04-19")).toBeVisible();
  await expect(page.locator(".report-canvas").getByText("13명")).toBeVisible();
  await expect(
    page.getByRole("button", { name: /2026-04-19 주간 사역보고서 현재 13명/ }),
  ).toBeVisible();

  await page.reload();

  await expect(page.locator(".report-canvas").getByText("2026-04-19")).toBeVisible();
  await page.getByRole("button", { name: "뷰어" }).click();
  await expect(page.locator(".report-canvas").getByText("13명")).toBeVisible();
});

test("shows legacy import warnings", async ({ page }) => {
  await page.goto("/");
  await signUpAndEnter(page, { email: "legacy-warning@example.com" });

  const history = [
    {
      date: "2026-04-19",
      youth: { present: 5 },
      young: { present: 8 },
    },
  ];

  await page.getByLabel("기존 JSON").setInputFiles({
    name: "history.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(history)),
  });

  await expect(page.getByRole("status")).toContainText("1개 경고");
  await expect(page.getByLabel("가져오기 경고")).toContainText(
    "기존 데이터에 유초등부 항목이 없어 빈 부서로 생성했습니다.",
  );
});

test("clears stale import warnings after invalid JSON", async ({ page }) => {
  await page.goto("/");
  await signUpAndEnter(page, { email: "legacy-warning-clear@example.com" });

  await page.getByLabel("기존 JSON").setInputFiles({
    name: "history.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify([{ date: "2026-04-19" }])),
  });

  await expect(page.getByLabel("가져오기 경고")).toContainText(
    "기존 데이터에 유초등부 항목이 없어 빈 부서로 생성했습니다.",
  );

  await page.getByLabel("기존 JSON").setInputFiles({
    name: "broken.json",
    mimeType: "application/json",
    buffer: Buffer.from("{broken-json"),
  });

  await expect(page.getByRole("alert")).toContainText(
    "가져올 수 없는 데이터입니다.",
  );
  await expect(page.getByRole("status")).toContainText(
    "가져올 수 없는 데이터입니다.",
  );
  await expect(page.getByLabel("가져오기 경고")).toHaveCount(0);
});

test("imports a v2 backup bundle", async ({ page }) => {
  await page.goto("/");
  await signUpAndEnter(page, { email: "import-backup@example.com" });

  const backup = {
    schemaVersion: 2,
    exportedAt: "2026-05-01T00:00:00.000Z",
    reports: [
      {
        schemaVersion: 2,
        id: "backup-report-1",
        title: "유초등부 백업 보고",
        reportDate: "2026-04-19",
        departments: {
          elementary: {
            attendance: 10,
            summary: "백업 복원 확인",
          },
        },
      },
      {
        schemaVersion: 2,
        id: "backup-report-2",
        title: "청년부 백업 보고",
        reportDate: "2026-04-26",
        departments: {
          youngAdult: {
            attendance: 14,
          },
        },
      },
    ],
  };

  await page.getByLabel("기존 JSON").setInputFiles({
    name: "ministry-report-v2-backup.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(backup)),
  });

  await expect(page.getByRole("status")).toContainText("2개 보고서를 가져왔습니다.");
  await expect(page.getByLabel("저장 보고서 요약", { exact: true })).toContainText(
    "2개 보고서 · 출석 24명",
  );
  await expect(page.locator(".report-canvas").getByText("청년부 백업 보고")).toBeVisible();

  await page.getByRole("button", { name: /2026-04-19 유초등부 백업 보고 10명/ }).click();

  await expect(page.locator(".report-canvas").getByText("유초등부 백업 보고")).toBeVisible();
  await expect(page.locator(".report-canvas").getByText("백업 복원 확인")).toBeVisible();
});

test("imports a single exported v2 report", async ({ page }) => {
  await page.goto("/");
  await signUpAndEnter(page, { email: "import-single@example.com" });

  const report = {
    schemaVersion: 2,
    id: "single-report-1",
    title: "단일 복원 보고",
    reportDate: "2026-05-17",
    churchName: "연천장로교회",
    pastorName: "김우중",
    departments: {
      elementary: {
        attendance: 12,
        summary: "단일 보고서 복원",
      },
      adult: {
        attendance: 21,
      },
    },
    prayerRequests: ["복원 테스트"],
    announcements: ["다음 주 정상 예배"],
  };

  await page.getByLabel("기존 JSON").setInputFiles({
    name: "2026-05-17-ministry-report-v2.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(report)),
  });

  await expect(page.getByRole("status")).toContainText("1개 보고서를 가져왔습니다.");
  await expect(page.locator(".report-canvas").getByText("단일 복원 보고")).toBeVisible();
  await expect(page.locator(".department-list").getByText("유초등부")).toBeVisible();
  await expect(page.locator(".department-list").getByText("12명")).toBeVisible();
  await expect(page.locator(".department-list").getByText("21명")).toBeVisible();
  await expect(
    page.getByRole("button", { name: /2026-05-17 단일 복원 보고 현재 33명/ }),
  ).toBeVisible();
});

test("exports all saved reports as a v2 backup bundle", async ({ page }) => {
  await page.goto("/");
  await signUpAndEnter(page, { email: "backup-export@example.com" });

  const history = [
    {
      title: "유초등부 백업 대상",
      date: "2026-04-19",
      departments: {
        elementary: { attendance: 9 },
      },
    },
    {
      title: "청년부 백업 대상",
      date: "2026-04-26",
      departments: {
        youngAdult: { attendance: 14 },
      },
    },
  ];

  await page.getByLabel("기존 JSON").setInputFiles({
    name: "history.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(history)),
  });

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "전체 백업" }).click();
  const download = await downloadPromise;
  const backupPath = await download.path();

  expect(download.suggestedFilename()).toMatch(
    /^\d{4}-\d{2}-\d{2}-ministry-report-v2-backup\.json$/,
  );
  expect(backupPath).toBeTruthy();

  const backup = JSON.parse(await readFile(backupPath ?? "", "utf8"));

  expect(backup.schemaVersion).toBe(2);
  expect(backup.reports).toHaveLength(2);
  expect(backup.reports.map((report: { title: string }) => report.title)).toEqual([
    "청년부 백업 대상",
    "유초등부 백업 대상",
  ]);
});

test("restores a downloaded v2 backup bundle", async ({ browser }) => {
  const sourceContext = await browser.newContext();
  const sourcePage = await sourceContext.newPage();
  await sourcePage.goto(APP_URL);
  await signUpAndEnter(sourcePage, { email: "roundtrip-source@example.com" });

  const history = [
    {
      title: "복원 라운드트립 유초등부",
      date: "2026-04-19",
      departments: {
        elementary: { attendance: 9 },
      },
    },
    {
      title: "복원 라운드트립 장년",
      date: "2026-04-26",
      departments: {
        adult: { attendance: 20 },
      },
    },
  ];

  await sourcePage.getByLabel("기존 JSON").setInputFiles({
    name: "history.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(history)),
  });

  const downloadPromise = sourcePage.waitForEvent("download");
  await sourcePage.getByRole("button", { name: "전체 백업" }).click();
  const download = await downloadPromise;
  const backupPath = await download.path();
  expect(backupPath).toBeTruthy();
  const backupText = await readFile(backupPath ?? "", "utf8");
  await sourceContext.close();

  const restoreContext = await browser.newContext();
  const restorePage = await restoreContext.newPage();
  await restorePage.goto(APP_URL);
  await signUpAndEnter(restorePage, { email: "roundtrip-restore@example.com" });

  await restorePage.getByLabel("기존 JSON").setInputFiles({
    name: "roundtrip-ministry-report-v2-backup.json",
    mimeType: "application/json",
    buffer: Buffer.from(backupText),
  });

  await expect(restorePage.getByRole("status")).toContainText(
    "2개 보고서를 가져왔습니다.",
  );
  await expect(
    restorePage.getByLabel("저장 보고서 요약", { exact: true }),
  ).toContainText("2개 보고서 · 출석 29명");
  await expect(
    restorePage.getByRole("button", {
      name: /2026-04-19 복원 라운드트립 유초등부 9명/,
    }),
  ).toBeVisible();
  await expect(restorePage.locator(".report-canvas")).toContainText(
    "복원 라운드트립 장년",
  );
  await restoreContext.close();
});

test("deletes a saved report from history", async ({ page }) => {
  await page.goto("/");
  await signUpAndEnter(page, { email: "delete-history@example.com" });

  const history = [
    {
      date: "2026-04-19",
      youth: { present: 5 },
      young: { present: 8 },
    },
    {
      date: "2026-04-26",
      youth: { present: 7 },
      young: { present: 14 },
    },
  ];

  await page.getByLabel("기존 JSON").setInputFiles({
    name: "history.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(history)),
  });

  await page.getByRole("button", { name: /2026-04-19 주간 사역보고서 13명/ }).click();
  page.once("dialog", async (dialog) => {
    expect(dialog.message()).toContain("2026-04-19 보고서를 삭제할까요?");
    await dialog.accept();
  });
  await page.getByRole("button", { name: /2026-04-19 삭제/ }).click();

  await expect(page.getByRole("status")).toContainText(
    "2026-04-19 보고서를 삭제했습니다.",
  );
  await expect(
    page.getByRole("button", { name: /2026-04-19/ }),
  ).toHaveCount(0);
  await expect(page.locator(".report-canvas").getByText("2026-04-26")).toBeVisible();
  await expect(page.locator(".report-canvas").getByText("21명")).toBeVisible();
});

test("clears saved report summary after deleting the last report", async ({ page }) => {
  await page.goto("/");
  await signUpAndEnter(page, { email: "delete-last@example.com" });

  const history = [
    {
      title: "유초등부 예배 보고",
      date: "2026-04-19",
      departments: {
        elementary: { attendance: 9 },
        middleHigh: { attendance: 5 },
      },
    },
  ];

  await page.getByLabel("기존 JSON").setInputFiles({
    name: "history.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(history)),
  });

  await expect(page.getByLabel("저장 보고서 요약", { exact: true })).toContainText(
    "1개 보고서 · 출석 14명",
  );

  page.once("dialog", async (dialog) => {
    expect(dialog.message()).toContain("2026-04-19 보고서를 삭제할까요?");
    await dialog.accept();
  });
  await page.getByRole("button", { name: /2026-04-19 삭제/ }).click();

  await expect(page.getByText("저장된 보고서가 없습니다.")).toBeVisible();
  await expect(page.getByLabel("저장 보고서 요약", { exact: true })).toHaveCount(0);
  await expect(page.getByLabel("부서별 저장 보고서 요약")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "전체 백업" })).toHaveCount(0);
});

test("updates saved report summary after deleting a report", async ({ page }) => {
  await page.goto("/");
  await signUpAndEnter(page, { email: "delete-summary@example.com" });

  const history = [
    {
      title: "유초등부 예배 보고",
      date: "2026-04-19",
      departments: {
        elementary: { attendance: 9 },
        middleHigh: { attendance: 5 },
      },
    },
    {
      title: "청년부 수련회 보고",
      date: "2026-04-26",
      departments: {
        youngAdult: { attendance: 14 },
        adult: { attendance: 20 },
      },
    },
  ];

  await page.getByLabel("기존 JSON").setInputFiles({
    name: "history.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(history)),
  });

  await expect(page.getByLabel("저장 보고서 요약", { exact: true })).toContainText(
    "2개 보고서 · 출석 48명",
  );

  page.once("dialog", async (dialog) => {
    expect(dialog.message()).toContain("2026-04-19 보고서를 삭제할까요?");
    await dialog.accept();
  });
  await page.getByRole("button", { name: /2026-04-19 삭제/ }).click();

  await expect(page.getByLabel("저장 보고서 요약", { exact: true })).toContainText(
    "1개 보고서 · 출석 34명",
  );
  await expect(page.getByLabel("부서별 저장 보고서 요약")).toContainText(
    "유초등부0명중고등부0명청년부14명장년20명",
  );
});

test("cancels saved report deletion", async ({ page }) => {
  await page.goto("/");
  await signUpAndEnter(page, { email: "cancel-delete@example.com" });

  const history = [
    {
      date: "2026-04-19",
      youth: { present: 5 },
      young: { present: 8 },
    },
  ];

  await page.getByLabel("기존 JSON").setInputFiles({
    name: "history.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(history)),
  });

  const dialogPromise = page.waitForEvent("dialog");
  const clickPromise = page.getByRole("button", { name: /2026-04-19 삭제/ }).click();
  const dialog = await dialogPromise;

  expect(dialog.message()).toContain("2026-04-19 보고서를 삭제할까요?");
  await dialog.dismiss();
  await clickPromise;

  await expect(
    page.getByRole("button", { name: /2026-04-19 주간 사역보고서/ }),
  ).toBeVisible();
  await expect(page.locator(".report-canvas").getByText("2026-04-19")).toBeVisible();
});

test("keeps saved report summary after canceling deletion", async ({ page }) => {
  await page.goto("/");
  await signUpAndEnter(page, { email: "cancel-delete-summary@example.com" });

  const history = [
    {
      title: "유초등부 예배 보고",
      date: "2026-04-19",
      departments: {
        elementary: { attendance: 9 },
        middleHigh: { attendance: 5 },
      },
    },
    {
      title: "청년부 수련회 보고",
      date: "2026-04-26",
      departments: {
        youngAdult: { attendance: 14 },
        adult: { attendance: 20 },
      },
    },
  ];

  await page.getByLabel("기존 JSON").setInputFiles({
    name: "history.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(history)),
  });

  await expect(page.getByLabel("저장 보고서 요약", { exact: true })).toContainText(
    "2개 보고서 · 출석 48명",
  );

  const dialogPromise = page.waitForEvent("dialog");
  const clickPromise = page.getByRole("button", { name: /2026-04-19 삭제/ }).click();
  const dialog = await dialogPromise;

  expect(dialog.message()).toContain("2026-04-19 보고서를 삭제할까요?");
  await dialog.dismiss();
  await clickPromise;

  await expect(page.getByLabel("저장 보고서 요약", { exact: true })).toContainText(
    "2개 보고서 · 출석 48명",
  );
  await expect(page.getByLabel("부서별 저장 보고서 요약")).toContainText(
    "유초등부9명중고등부5명청년부14명장년20명",
  );
});

test("copies a saved report into a new draft", async ({ page }) => {
  await page.goto("/");
  await signUpAndEnter(page, { email: "copy-report@example.com" });

  const history = [
    {
      title: "유초등부 예배 보고",
      date: "2026-04-19",
      departments: {
        elementary: {
          attendance: 9,
          summary: "봄 성경학교 준비",
        },
      },
    },
    {
      title: "청년부 수련회 보고",
      date: "2026-04-26",
      departments: {
        youngAdult: {
          attendance: 14,
        },
      },
    },
  ];

  await page.getByLabel("기존 JSON").setInputFiles({
    name: "history.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(history)),
  });

  await page.getByRole("button", { name: /2026-04-19 복사/ }).click();

  await expect(page.getByRole("status")).toContainText(
    "2026-04-19 보고서를 복사해 새 보고서를 만들었습니다.",
  );
  await expect(page.getByLabel("제목", { exact: true })).toHaveValue(
    "유초등부 예배 보고 복사본",
  );
  await expect(
    page
      .getByRole("group", { name: "부서별 보고" })
      .getByLabel("출석")
      .first(),
  ).toHaveValue("9");
  await expect(page.getByLabel("저장 보고서 요약", { exact: true })).toContainText(
    "2개 보고서 · 출석 23명",
  );
  await expect(page.getByLabel("부서별 저장 보고서 요약")).toContainText(
    "유초등부9명중고등부0명청년부14명장년0명",
  );
});

test("filters saved reports by title and department summary", async ({ page }) => {
  await page.goto("/");
  await signUpAndEnter(page, { email: "filter-search@example.com" });

  const history = [
    {
      title: "유초등부 예배 보고",
      date: "2026-04-19",
      departments: {
        elementary: {
          attendance: 9,
          summary: "봄 성경학교 준비",
        },
        middleHigh: {
          attendance: 5,
        },
      },
    },
    {
      title: "청년부 수련회 보고",
      date: "2026-04-26",
      departments: {
        youngAdult: {
          attendance: 14,
          summary: "금요 모임 회복",
        },
        adult: {
          attendance: 20,
        },
      },
    },
  ];

  await page.getByLabel("기존 JSON").setInputFiles({
    name: "history.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(history)),
  });

  await page.getByLabel("보고서 검색").fill("청년부");

  await expect(
    page.getByRole("button", { name: /2026-04-26 청년부 수련회 보고 .*34명/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /유초등부 예배 보고/ }),
  ).toHaveCount(0);

  await page.getByLabel("보고서 검색").fill("봄 성경학교");

  await expect(
    page.getByRole("button", { name: /2026-04-19 유초등부 예배 보고 .*14명/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /청년부 수련회 보고/ }),
  ).toHaveCount(0);

  await page.getByLabel("보고서 검색").fill("없는 검색어");

  await expect(page.getByText("검색 결과가 없습니다.")).toBeVisible();
  await expect(page.getByLabel("저장 보고서 요약", { exact: true })).toContainText(
    "0개 보고서 · 출석 0명",
  );
  await expect(page.getByLabel("부서별 저장 보고서 요약")).toContainText(
    "유초등부0명중고등부0명청년부0명장년0명",
  );

  await page.getByLabel("보고서 검색").fill("");

  await expect(
    page.getByRole("button", { name: /2026-04-19 유초등부 예배 보고 .*14명/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /2026-04-26 청년부 수련회 보고 .*34명/ }),
  ).toBeVisible();
  await expect(page.getByLabel("저장 보고서 요약", { exact: true })).toContainText(
    "2개 보고서 · 출석 48명",
  );
  await expect(page.getByLabel("부서별 저장 보고서 요약")).toContainText(
    "유초등부9명중고등부5명청년부14명장년20명",
  );
});

test("filters saved reports by report month", async ({ page }) => {
  await page.goto("/");
  await signUpAndEnter(page, { email: "filter-month@example.com" });

  const history = [
    {
      title: "4월 유초등부 보고",
      date: "2026-04-19",
      departments: {
        elementary: { attendance: 9 },
      },
    },
    {
      title: "5월 청년부 보고",
      date: "2026-05-03",
      departments: {
        youngAdult: { attendance: 14 },
      },
    },
    {
      title: "5월 장년 보고",
      date: "2026-05-10",
      departments: {
        adult: { attendance: 20 },
      },
    },
  ];

  await page.getByLabel("기존 JSON").setInputFiles({
    name: "history.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(history)),
  });

  await page.getByLabel("보고월").fill("2026-05");

  await expect(page.getByLabel("저장 보고서 요약", { exact: true })).toContainText(
    "2개 보고서 · 출석 34명",
  );
  await expect(page.getByRole("button", { name: /5월 청년부 보고/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /5월 장년 보고/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /4월 유초등부 보고/ })).toHaveCount(0);

  await page.getByLabel("보고월").fill("2026-04");

  await expect(page.getByLabel("저장 보고서 요약", { exact: true })).toContainText(
    "1개 보고서 · 출석 9명",
  );
  await expect(page.getByRole("button", { name: /4월 유초등부 보고/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /5월 청년부 보고/ })).toHaveCount(0);

  await page.getByLabel("보고월").fill("2026-06");

  await expect(page.getByText("검색 결과가 없습니다.")).toBeVisible();
  await expect(page.getByLabel("저장 보고서 요약", { exact: true })).toContainText(
    "0개 보고서 · 출석 0명",
  );
  await expect(page.getByLabel("부서별 저장 보고서 요약")).toContainText(
    "유초등부0명중고등부0명청년부0명장년0명",
  );

  await page.getByLabel("보고월").fill("");

  await expect(page.getByRole("button", { name: /4월 유초등부 보고/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /5월 청년부 보고/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /5월 장년 보고/ })).toBeVisible();
  await expect(page.getByLabel("저장 보고서 요약", { exact: true })).toContainText(
    "3개 보고서 · 출석 43명",
  );
  await expect(page.getByLabel("부서별 저장 보고서 요약")).toContainText(
    "유초등부9명중고등부0명청년부14명장년20명",
  );

  await page.getByLabel("보고서 검색").fill("유초등부");
  await page.getByRole("button", { name: "필터 초기화" }).click();

  await expect(page.getByLabel("보고서 검색")).toHaveValue("");
  await expect(page.getByLabel("보고월")).toHaveValue("");
  await expect(page.getByLabel("저장 보고서 요약", { exact: true })).toContainText(
    "3개 보고서 · 출석 43명",
  );
  await expect(page.getByRole("button", { name: /5월 청년부 보고/ })).toBeVisible();
});

test("restores summaries with filter reset after zero-result filters", async ({
  page,
}) => {
  await page.goto("/");
  await signUpAndEnter(page, { email: "filter-reset@example.com" });

  const history = [
    {
      title: "4월 유초등부 보고",
      date: "2026-04-19",
      departments: {
        elementary: { attendance: 9 },
      },
    },
    {
      title: "5월 청년부 보고",
      date: "2026-05-03",
      departments: {
        youngAdult: { attendance: 14 },
      },
    },
    {
      title: "5월 장년 보고",
      date: "2026-05-10",
      departments: {
        adult: { attendance: 20 },
      },
    },
  ];

  await page.getByLabel("기존 JSON").setInputFiles({
    name: "history.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(history)),
  });

  await page.getByLabel("보고월").fill("2026-06");
  await page.getByLabel("보고서 검색").fill("없는 검색어");

  await expect(page.getByText("검색 결과가 없습니다.")).toBeVisible();
  await expect(page.getByLabel("저장 보고서 요약", { exact: true })).toContainText(
    "0개 보고서 · 출석 0명",
  );

  await page.getByRole("button", { name: "필터 초기화" }).click();

  await expect(page.getByLabel("보고서 검색")).toHaveValue("");
  await expect(page.getByLabel("보고월")).toHaveValue("");
  await expect(page.getByRole("button", { name: /4월 유초등부 보고/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /5월 청년부 보고/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /5월 장년 보고/ })).toBeVisible();
  await expect(page.getByLabel("저장 보고서 요약", { exact: true })).toContainText(
    "3개 보고서 · 출석 43명",
  );
  await expect(page.getByLabel("부서별 저장 보고서 요약")).toContainText(
    "유초등부9명중고등부0명청년부14명장년20명",
  );
});

test("shows the filter reset button only while filters are active", async ({
  page,
}) => {
  await page.goto("/");
  await signUpAndEnter(page, { email: "filter-button@example.com" });

  const history = [
    {
      title: "4월 유초등부 보고",
      date: "2026-04-19",
      departments: {
        elementary: { attendance: 9 },
      },
    },
    {
      title: "5월 청년부 보고",
      date: "2026-05-03",
      departments: {
        youngAdult: { attendance: 14 },
      },
    },
  ];

  await page.getByLabel("기존 JSON").setInputFiles({
    name: "history.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(history)),
  });

  await expect(page.getByRole("button", { name: "필터 초기화" })).toHaveCount(0);

  await page.getByLabel("보고서 검색").fill("청년부");
  await expect(page.getByRole("button", { name: "필터 초기화" })).toBeVisible();

  await page.getByLabel("보고서 검색").fill("");
  await expect(page.getByRole("button", { name: "필터 초기화" })).toHaveCount(0);

  await page.getByLabel("보고월").fill("2026-05");
  await expect(page.getByRole("button", { name: "필터 초기화" })).toBeVisible();

  await page.getByRole("button", { name: "필터 초기화" }).click();
  await expect(page.getByLabel("보고월")).toHaveValue("");
  await expect(page.getByRole("button", { name: "필터 초기화" })).toHaveCount(0);
});

test("summarizes saved report count and attendance", async ({ page }) => {
  await page.goto("/");
  await signUpAndEnter(page, { email: "summary@example.com" });

  const history = [
    {
      title: "유초등부 예배 보고",
      date: "2026-04-19",
      departments: {
        elementary: { attendance: 9 },
        middleHigh: { attendance: 5 },
      },
    },
    {
      title: "청년부 수련회 보고",
      date: "2026-04-26",
      departments: {
        youngAdult: { attendance: 14 },
        adult: { attendance: 20 },
      },
    },
  ];

  await page.getByLabel("기존 JSON").setInputFiles({
    name: "history.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(history)),
  });

  await expect(page.getByLabel("저장 보고서 요약", { exact: true })).toContainText(
    "2개 보고서 · 출석 48명",
  );
  await expect(page.getByLabel("부서별 저장 보고서 요약")).toContainText(
    "유초등부9명중고등부5명청년부14명장년20명",
  );

  await page.getByLabel("보고서 검색").fill("청년부");

  await expect(page.getByLabel("저장 보고서 요약", { exact: true })).toContainText(
    "1개 보고서 · 출석 34명",
  );
  await expect(page.getByLabel("부서별 저장 보고서 요약")).toContainText(
    "유초등부0명중고등부0명청년부14명장년20명",
  );
});

test("loads the current draft while offline after first load", async ({ page }) => {
  await page.goto("/");
  await signUpAndEnter(page, { email: "offline@example.com" });
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();

  await page.getByLabel("제목", { exact: true }).fill("오프라인 초안");
  await page.getByLabel("기도제목").fill("오프라인에서도 확인");

  await page.context().setOffline(true);
  await page.reload({ waitUntil: "domcontentloaded" });

  await expect(page.getByRole("heading", { name: "사역보고서 v2" })).toBeVisible();
  await expect(page.getByLabel("제목", { exact: true })).toHaveValue(
    "오프라인 초안",
  );
  await expect(page.getByLabel("기도제목")).toHaveValue("오프라인에서도 확인");
});
