# 데스크탑 레이아웃 재구성 설계

**날짜:** 2026-05-15  
**버전 기준:** v2.5.2  
**대상:** 데스크탑(`pointer: fine` + 너비 821px 이상) 전용

---

## 1. 문제

현재 데스크탑 레이아웃은 상단 헤더 + 좌측 200px 사이드바(액션 버튼 + 보고서 목록) + 우측 편집폼 구조다.  
- 사이드바에 네비게이션, 액션, 히스토리가 혼재해 공간이 좁고 역할이 불명확하다.  
- 보고서 통계가 편집폼 탭 안에 묻혀 있어 한눈에 보기 어렵다.  
- 상단 헤더가 공간을 낭비한다.

## 2. 목표

3단 CSS Grid 레이아웃으로 재구성한다.  
- 좌측: 앱 네비게이션 전담 사이드바  
- 중앙: 보고서 편집폼 (메인 작업 영역)  
- 하단: 보고서 목록 + 통계 상시 표시

## 3. 레이아웃 구조

```
┌──────────┬──────────────────────────────┐
│          │                              │
│ SIDEBAR  │   CENTER — 보고서 편집폼      │
│  220px   │   (세로 스크롤)               │
│          │                              │
│          ├───────────────┬──────────────┤
│          │  보고서 목록   │    통계       │
│          │    (50%)      │    (50%)     │
└──────────┴───────────────┴──────────────┘
           └──── 하단 패널 220px ──────────┘
```

### CSS Grid 정의

```css
.desktop-layout {
  display: grid;
  grid-template:
    "sidebar center" 1fr
    "sidebar bottom" 220px
    / 220px 1fr;
  height: 100vh;
  overflow: hidden;
}
```

## 4. 좌측 사이드바 (`DesktopSidebar` 신규 컴포넌트)

**파일:** `src/features/nav/DesktopSidebar.tsx`

### 구성 (위→아래)

```
┌──────────┐
│ 사역보고서 │  앱 타이틀 + 버전
│  v2.5.x  │
├──────────┤
│  [김]    │  계정 아바타 + 표시 이름
│ 로그아웃  │
├──────────┤
│ 📄 보고서  │  mode = "edit"
│ 👁 뷰어   │  mode = "view"
│ 👥 명단   │  mode = "roster"
│ ⚙️ 설정   │  설정 패널 (테마 등)
├──────────┤
│ 새 보고서  │  액션 버튼 (편집 모드일 때만 표시)
│   저장    │
│  내보내기  │
└──────────┘
```

### Props

```tsx
type DesktopSidebarProps = {
  appVersion: string;
  currentAccount: Account | null;
  mode: DesktopMode;                    // "edit" | "view" | "roster"
  onModeChange: (mode: DesktopMode) => void;
  onSignOut: () => void;
  onNewReport: () => void;
  onSave: () => void;
  canSave: boolean;
  onExport: () => void;
  saveStatus: string;
};
```

### 기타

- 현재 헤더의 강제새로고침 버튼, PWA 설치/설치됨 뱃지 → 사이드바 하단 or 설정 탭으로 이동
- `ThemeSelector` → 설정(⚙️) 메뉴 클릭 시 사이드바 내에 인라인 표시
- 액션 버튼(새 보고서/저장/내보내기)은 `mode === "edit"` 일 때만 렌더링

## 5. 중앙 패널 (CENTER)

- 기존 `TabbedReportForm` 그대로 유지
- `ReportEditor` 컴포넌트에서 사이드바 관련 JSX 제거, 편집폼만 렌더링
- 세로 스크롤 가능 (`overflow-y: auto`)
- 상단 패딩 24px

## 6. 하단 패널 (BOTTOM, 220px 고정)

**파일:** `src/features/report/DesktopBottomPanel.tsx` (신규)

```
┌───────────────────────┬───────────────────────┐
│     보고서 목록         │        통계            │
│  ReportHistoryPanel   │  AttendanceSummaryStats│
│  (불러오기/삭제/복제)    │  (연간 출석 요약)       │
└───────────────────────┴───────────────────────┘
```

- 좌우 각 50%, `overflow-y: auto`
- 상단 구분선으로 중앙 패널과 시각적 분리
- `ReportHistoryPanel`은 현재 사이드바에서 이 패널로 이동
- `AttendanceSummaryStats`는 현재 TabbedReportForm 기본정보 탭에서 이 패널로 이동

## 7. 상단 헤더 처리

- 데스크탑에서는 헤더 **제거**
- 모바일(`.mobile-only`)에서는 기존 헤더 유지
- 현재 헤더 내 요소 이동:
  | 요소 | 이동 위치 |
  |------|---------|
  | 앱 타이틀/버전 | 사이드바 상단 |
  | 세그먼트 컨트롤 | 사이드바 네비 |
  | 아바타 | 사이드바 계정 영역 |
  | 강제새로고침 | 사이드바 하단 |
  | PWA 설치 뱃지 | 사이드바 하단 |
  | ThemeSelector | 사이드바 설정 섹션 |

## 8. 변경 파일

| 파일 | 변경 유형 | 내용 |
|------|---------|------|
| `src/features/nav/DesktopSidebar.tsx` | 신규 | 좌측 네비 사이드바 컴포넌트 |
| `src/features/report/DesktopBottomPanel.tsx` | 신규 | 하단 패널 (목록 + 통계) |
| `src/features/report/ReportEditor.tsx` | 수정 | 사이드바 JSX 제거, 편집폼만 남김 |
| `src/App.tsx` | 수정 | 데스크탑 헤더 제거, `.desktop-layout` Grid 래퍼 적용 |
| `src/styles.css` | 수정 | `.desktop-layout` Grid CSS, 사이드바/하단 패널 스타일 |

## 9. 제외 범위

- 모바일 UI 변경 없음
- 뷰어(ReportViewer) 내부 레이아웃 변경 없음
- 명단관리(MemberRosterTab) 내부 변경 없음
- Firestore, 인증 로직 변경 없음
