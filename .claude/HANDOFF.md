# ministry-report-v2 — Codex Handoff (v2.4.41)

## 현재 상태
- 커밋: `907d9d8` — fix(v2.4.41): 전화번호 입력 행 버튼 스타일 통일
- 브랜치: `main`
- 배포: GitHub Pages (main push → Actions 자동 배포)

---

## 이번 세션에서 수정한 내용 (v2.4.36 ~ v2.4.41)

### v2.4.36 — 보고서 구역 이동 버튼
- `src/domain/reportMembers.ts`: `moveZoneMemberToZone(department, fromZoneId, memberId, targetZoneId)` 추가
- `src/features/report/ZonedDepartmentAttendanceEditor.tsx`:
  - 각 구역 헤더에 "이동" 버튼 추가
  - 2단계 피커: ① 목적 구역 선택 → ② 이동할 인원 선택
  - `MoveStep` 타입, `allZones` prop, `onMoveToZone` 콜백 전달 체인 구현
- `src/styles.css`: `.zone-btn-move`, `.zone-move-picker` 등 스타일 추가

### v2.4.37 — SMS 패널 하단 잘림 수정
- `src/styles.css`: 모바일에서 `.sms-panel`이 하단 탭바(56px) 뒤에 가려지던 문제
- `bottom: calc(56px + env(safe-area-inset-bottom, 0px))`, `z-index: 110`으로 수정

### v2.4.38 — 구역장 전화번호 주소록 불러오기
- `src/features/roster/PhoneNumberManager.tsx`:
  - Contact Picker API (`navigator.contacts.select(['tel'])`) 연동
  - 전화번호 자동 포맷 (010-XXXX-XXXX)
  - API 미지원 기기에서 버튼 자동 숨김 (`canPickContact()` feature detection)

### v2.4.39 ~ v2.4.40 — 전화번호 입력 레이아웃 수정
- 입력 필드가 화면 밖으로 넘치는 문제
- `.phone-manager-item`을 `flex-direction: column`으로 변경
- 구역명/이름 → 윗 줄 (`.phone-manager-top-row`), 입력 행 → 아랫 줄 전체 너비

### v2.4.41 — 버튼 스타일 통일
- 전역 `button` 기본 스타일(진한 파란, padding 10px 14px)이 저장 버튼에 오염되던 문제
- `.phone-manager-save-btn`, `.phone-manager-cancel-btn`, `.phone-manager-contact-btn` 명시적 클래스로 통일
- font-size: 13px / padding: 6px 12px / border-radius: 6px 동일 크기

---

## 프로젝트 개요

| 항목 | 내용 |
|------|------|
| 프레임워크 | React 19 + TypeScript + Vite 6 |
| PWA | vite-plugin-pwa (Service Worker, 오프라인 지원) |
| 스타일 | 단일 파일 `src/styles.css`, CSS 변수 기반 테마 |
| 인증 | Firebase Auth (Google 로그인) |
| DB | Firestore (persistentLocalCache + try/catch fallback) |
| 배포 | GitHub Pages (`.github/workflows/deploy.yml`) |

### 빌드 & 개발
```bash
npm run dev         # 개발 서버 http://localhost:5173
npm run build       # tsc --noEmit && vite build → dist/
npm test            # vitest (unit)
npm run smoke       # playwright e2e (빌드 선행 필요)
npm run verify      # npm test && npm run smoke
```

> ⚠️ **SW 주의**: dev 서버에서 Service Worker가 등록되면 캐시 문제 발생.
> `localhost:5173` 고정, vite.config.ts에서 dev 모드 SW 등록 비활성화 상태.

---

## 주요 파일 구조

```
src/
├── App.tsx                          # 루트: 상태·라우팅·syncReportFromRoster
├── lib/
│   └── firebase.ts                  # Firebase 초기화 (Auth + Firestore)
├── domain/
│   ├── reportTypes.ts               # 전체 타입 정의 (MinistryReport, DepartmentZone 등)
│   ├── reportMembers.ts             # 출석 도메인 로직 (toggle/move/add/delete)
│   └── memberRoster.ts              # 명단 도메인 로직
├── features/
│   ├── auth/
│   │   └── AuthGate.tsx             # 로그인 화면 ("연천장로교회 사역보고서")
│   ├── report/
│   │   ├── TabbedReportForm.tsx     # 보고서 작성 폼 (6개 탭, 스와이프)
│   │   ├── ReportViewer.tsx         # 보고서 뷰어 (스와이프 탭)
│   │   ├── ZonedDepartmentAttendanceEditor.tsx  # 교구 출석 (구역 카드 + 이동 버튼)
│   │   ├── DepartmentAttendanceEditor.tsx        # 유·중·청 출석
│   │   ├── SmsPanel.tsx             # 문자 발송 패널 (fixed bottom)
│   │   ├── smsUtils.ts              # SMS 대상 추출 로직
│   │   ├── ReportCanvas.tsx         # 보고서 요약 캔버스
│   │   └── AdultStatsPanel.tsx      # 교구 통계 패널
│   └── roster/
│       ├── RosterFlatEditor.tsx     # 유·중·청 명단 편집 (접기/펼치기 기본 collapsed)
│       ├── RosterZoneEditor.tsx     # 교구 구역 명단 편집
│       └── PhoneNumberManager.tsx   # 구역장 전화번호 관리 (주소록 연동)
└── styles.css                       # 전체 스타일 (단일 파일, ~3600줄)
```

---

## 핵심 도메인 개념

### 보고서 구조 (MinistryReport)
```ts
MinistryReport {
  id, title, reportDate, pastorName
  departments: {
    elementary: DepartmentReport   // 유초등부 (members[])
    middleHigh: DepartmentReport   // 중고등부 (members[])
    youngAdult: DepartmentReport   // 청년부 (members[])
    adult:      DepartmentReport   // 교구 (zones[])
  }
  prayerRequests: string[]
  announcements: string[]
}
```

### 교구 구조 (교구만 zones 사용)
```ts
DepartmentReport.zones: DepartmentZone[] = [
  { id, name: "1구역", district: 1, members: DepartmentMember[] },
  ...
]
DepartmentMember { id, name, role?: "leader"|"inspector", status: "present"|"absent", phone?: string }
```

### 명단 → 보고서 동기화
- `App.tsx`의 `syncReportFromRoster()` — 명단(Roster)이 변경될 때 보고서의 members/zones 구조를 갱신
- 기존 출석 상태(present/absent)는 보존, 구조만 동기화
- 추가된 인원은 가나다순 정렬(`localeCompare("ko")`)

### 카드 드래그 & 스와이프 구분
- 카드 롱프레스(500ms) 후 드래그: `useSortCards`, `useCrossGroupDrag` 훅
- 탭 스와이프: 수평 80px 이상 + 450ms 미만 + 수직보다 수평이 큰 경우만
- 두 동작이 겹치지 않도록 `touchStartTime` 기반으로 구분

---

## CSS 주요 변수 (styles.css 상단)
```css
--clr-primary        # 메인 파란색
--clr-primary-light  # 연한 파란
--clr-text-secondary # 보조 텍스트
--clr-text-muted     # 뮤트 텍스트
--clr-border         # 테두리
--clr-border-soft    # 연한 테두리
--clr-card-bg        # 카드 배경
--clr-bg             # 앱 배경
```

### 모바일 레이아웃 (max-width: 820px)
- 하단 탭바: `position: fixed; bottom: 0; height: 56px; z-index: 100`
- 앱 전체: `padding-bottom: calc(70px + env(safe-area-inset-bottom))`
- SMS 패널: `position: fixed; bottom: calc(56px + env(safe-area-inset-bottom, 0px)); z-index: 110`
- 헤더 상단 safe area: `top-bar-safe-spacer` div (모바일에서만 표시)

---

## 알려진 이슈 / 후속 작업 후보
- 구역 이동 후 목적지 구역으로 자동 스크롤 (UX 개선)
- 이동된 인원 일시적 하이라이트 (애니메이션)
- 보고서 이미지/PDF 내보내기
- Firebase FCM 푸시 알림
