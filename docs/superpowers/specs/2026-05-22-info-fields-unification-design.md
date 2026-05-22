# 편집 폼 기본정보 섹션 통합 설계

## 문제
모바일 편집 화면에서 "보고일/제목" 입력 영역이 독립 흰 카드로 스타일링되어,
바로 아래 이어지는 "부서별 보고" 섹션(ReportCanvas)과 시각 언어가 달라 폼이 분리되어 보인다.

## 목표
보고일/제목 필드를 부서별 보고 아이템과 동일한 스타일로 통합해 하나의 연속된 폼처럼 보이게 한다.
두 필드는 **한 줄(가로)** 에 나란히 배치 — 각각 독립 카드.

---

## 기준: 부서별 보고 아이템 스타일 (department-list li)

```css
background: var(--clr-bg);
border: 1px solid var(--clr-border-soft);
border-radius: 8px;
padding: 10px 12px;
min-height: 52px;
display: flex;
flex-direction: column;
```
- 레이블: `font-size: 13px; font-weight: 700; color: var(--clr-text)`
- 값: `color: var(--clr-primary); font-weight: 700`

---

## 변경 범위

### `src/styles.css` (모바일 미디어쿼리 내)

#### `.info-fields-row` 수정
현재: 흰 카드 컨테이너 (background, border-radius: 14px, box-shadow, padding)
변경: 카드 컨테이너 제거 → 두 필드를 **가로로 나열**하는 flex row

```css
.info-fields-row {
  display: flex;
  flex-direction: row;
  gap: 8px;
  padding: 0;
  background: transparent;
  border-radius: 0;
  box-shadow: none;
}
```

#### `.info-field-label` 수정
현재: flex column, 별도 스타일
변경: 각 필드가 독립 카드 (department-list li 동일), flex: 1로 가로 균등 분배

```css
.info-field-label {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  font-weight: 700;
  color: var(--clr-text-secondary);
  background: var(--clr-bg);
  border: 1px solid var(--clr-border-soft);
  border-radius: 8px;
  padding: 10px 12px;
  min-height: 52px;
}
```

#### `.info-field-label input` 수정
현재: border, background, 별도 스타일
변경: 컨테이너가 카드이므로 input은 투명하게, primary 색, bold

```css
.info-field-label input {
  border: none;
  background: transparent;
  color: var(--clr-primary);
  font-size: 14px;
  font-weight: 700;
  padding: 0;
  min-width: 0;
  width: 100%;
}
```

#### `.info-fields-heading` 추가 (섹션 헤더)
`.department-section h3` 동일 스타일:
```css
.info-fields-heading {
  color: var(--clr-text-secondary);
  font-size: 13px;
  font-weight: 700;
  margin: 0 0 2px;
}
```

### `src/features/report/TabbedReportForm.tsx`

`info-fields-row` div 바로 위에 섹션 헤더 2줄 추가:

```tsx
{/* 기본정보 섹션 헤더 */}
<h3 className="info-fields-heading">기본정보</h3>
{/* 보고일 / 제목 */}
<div className="info-fields-row">
  <label className="info-field-label">
    보고일
    <input type="date" ... />
  </label>
  <label className="info-field-label">
    제목
    <input type="text" ... />
  </label>
</div>
```

---

## 결과 모습 (모바일)

```
기본정보                         ← 작은 섹션 헤더 (부서별 보고와 동일 스타일)
[보고일        ] [제목          ]  ← 한 줄, 각각 독립 카드 (flex: 1)
[2026. 05. 17.] [주일 사역보고서]

부서별 보고                      ← 기존 section h3
[유초등부                 15명]
[중고등부                  7명]
...
```

---

## 데스크탑 영향 없음
- `.info-fields-row` 데스크탑 스타일은 별도 블록 (line ~2521)에 정의됨 (유지)
- `.info-field-label` 데스크탑 스타일도 별도 블록 (line ~2529)에 정의됨 (유지)
- `info-fields-heading`은 데스크탑에서 `display: none` 추가 (중복 방지)
- 모바일 미디어쿼리 내에서만 override

---

## 버전
v2.7.3 → v2.7.4

---

## 검증 기준
1. 모바일: 보고일/제목 두 필드가 한 줄, 각각 department-list li 동일 카드 스타일
2. 모바일: "기본정보" 헤더가 "부서별 보고" 헤더와 동일 크기/색
3. 데스크탑: 기존 폼 레이아웃 변화 없음
4. 빌드 통과
