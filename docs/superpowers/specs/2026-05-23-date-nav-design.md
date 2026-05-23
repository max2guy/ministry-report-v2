# 보고일 날짜 네비게이션 설계

## 문제
`<input type="date">`는 iOS에서 스피너 휠, Android에서 캘린더로 열려 주일(일요일) 날짜를 빠르게 선택하기 불편하다. 교회 사역 보고서는 항상 주일 날짜를 사용하므로 7일 단위 이동이 실제 사용 패턴과 일치한다.

## 목표
모바일에서 보고일 카드에 ‹ / › 버튼으로 7일씩 이동하고, "이번 주일" 버튼으로 가장 최근 일요일을 즉시 세팅할 수 있게 한다. 데스크탑은 기존 네이티브 input 유지.

---

## UI 구조 (모바일)

```
기본정보
┌─────────────────┐  ┌─────────────────┐
│ 보고일          │  │ 제목            │
│ ‹  2026.05.17  ›│  │ 주일 사역보고서 │
└─────────────────┘  └─────────────────┘
        [이번 주일]
```

- **`‹` 버튼**: reportDate - 7일
- **날짜 표시**: `YYYY. MM. DD.` 포맷 (기존 방식 유지)
- **`›` 버튼**: reportDate + 7일
- **`이번 주일` 버튼**: info-fields-row 바로 아래 전체 너비, 가장 최근 일요일로 세팅

---

## 변경 파일

### `src/features/report/TabbedReportForm.tsx`

보고일 `<label className="info-field-label">` 내부를 교체:

**현재:**
```tsx
<label className="info-field-label">
  보고일
  <input
    type="date"
    value={report.reportDate}
    onChange={(e) => updateReport({ reportDate: e.currentTarget.value })}
  />
</label>
```

**변경 후:**
```tsx
<label className="info-field-label">
  보고일
  {/* 모바일: 날짜 네비게이션 (CSS로 데스크탑 숨김) */}
  <div className="date-nav-row">
    <button type="button" className="date-nav-btn" onClick={handlePrevWeek}>‹</button>
    <span className="date-nav-display">{formatDate(report.reportDate)}</span>
    <button type="button" className="date-nav-btn" onClick={handleNextWeek}>›</button>
  </div>
  {/* 네이티브 input: 데스크탑 전용 (모바일에서 시각적 숨김) */}
  <input
    className="date-native-input"
    type="date"
    value={report.reportDate}
    onChange={(e) => updateReport({ reportDate: e.currentTarget.value })}
  />
</label>
```

`info-fields-row` 바로 아래 `이번 주일` 버튼 추가:
```tsx
<button type="button" className="date-this-sunday-btn" onClick={handleThisSunday}>
  이번 주일
</button>
```

헬퍼 함수 (`TabbedReportForm` 내부):
```typescript
function formatDate(iso: string): string {
  // "2026-05-17" → "2026. 05. 17."
  const [y, m, d] = iso.split("-");
  return `${y}. ${m}. ${d}.`;
}

function localDateString(d: Date): string {
  // toISOString()은 UTC 변환 → KST 자정 부근 날짜 오류. 로컬 날짜로 직접 포맷.
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addDays(iso: string, days: number): string {
  const d = new Date(iso + "T00:00:00"); // 로컬 자정 기준
  d.setDate(d.getDate() + days);
  return localDateString(d);
}

function thisSunday(): string {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay()); // getDay() 0=일요일
  return localDateString(d);
}

function handlePrevWeek() { updateReport({ reportDate: addDays(report.reportDate, -7) }); }
function handleNextWeek() { updateReport({ reportDate: addDays(report.reportDate, +7) }); }
function handleThisSunday() { updateReport({ reportDate: thisSunday() }); }
```

---

### `src/styles.css`

#### 모바일 base 스타일 (미디어쿼리 없음)

```css
/* 날짜 네비게이션 — 모바일 기본 */
.date-nav-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
}

.date-nav-btn {
  background: transparent;
  border: none;
  color: var(--clr-primary);
  font-size: 18px;
  font-weight: 700;
  padding: 0 4px;
  line-height: 1;
  cursor: pointer;
  flex-shrink: 0;
}

.date-nav-display {
  font-size: 13px;
  font-weight: 700;
  color: var(--clr-primary);
  text-align: center;
  flex: 1;
  min-width: 0;
}

/* 모바일: 네이티브 input 숨김 */
.date-native-input {
  display: none;
}

/* 이번 주일 버튼 */
.date-this-sunday-btn {
  width: 100%;
  padding: 8px;
  border: 1px solid var(--clr-border-soft);
  border-radius: 8px;
  background: transparent;
  color: var(--clr-primary);
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  text-align: center;
}
```

#### 데스크탑 미디어쿼리 `@media (min-width: 821px) and (pointer: fine)`

```css
/* 데스크탑: nav 숨김, 네이티브 input 표시 */
.date-nav-row,
.date-this-sunday-btn {
  display: none;
}

.date-native-input {
  display: block; /* 기존 input 스타일 적용 */
}
```

---

## 동작 정리

| 버튼 | 동작 | 예시 |
|---|---|---|
| `‹` | -7일 | 05.17 → 05.10 |
| `›` | +7일 | 05.17 → 05.24 |
| `이번 주일` | 오늘 기준 직전(또는 당일) 일요일 | 오늘이 토요일이면 → 지난 일요일 |

**`thisSunday()` 로직:**
- `new Date()` → `d.setDate(d.getDate() - d.getDay())`
- `getDay() === 0` (일요일) → 오늘 그대로
- `getDay() === 1` (월요일) → -1일 (어제 일요일)
- `getDay() === 6` (토요일) → -6일 (지난 일요일)

---

## 데스크탑 영향 없음

- 데스크탑에서 `.date-nav-row`, `.date-this-sunday-btn` → `display: none`
- `.date-native-input` → `display: block` (기존 스타일 적용됨)
- 데스크탑 편집 폼은 변화 없음

---

## 검증 기준

1. 모바일: `‹` / `›` 탭 시 날짜가 7일씩 변경되고 Firestore에 저장됨
2. 모바일: `이번 주일` 탭 시 가장 최근 일요일로 즉시 세팅됨
3. 데스크탑: 기존 `<input type="date">` 정상 동작
4. 빌드 통과 (TypeScript 에러 없음)

## 버전
v2.7.4 → v2.7.5
