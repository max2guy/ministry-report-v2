# 보고서 목록 카드 분리 설계

## 문제
`.mobile-report-card-list`가 하나의 흰 카드 컨테이너 안에 모든 항목을 담고 `border-bottom`으로만 구분해, 항목 간 시각적 구분이 어렵다.

## 목표
각 보고서 항목을 독립 카드로 분리해 항목 구분을 명확히 한다.

---

## 변경 범위: `src/styles.css`만 수정 (JSX 변경 없음)

### `.mobile-report-card-list`
**현재:**
```css
.mobile-report-card-list {
  display: flex;
  flex-direction: column;
  background: var(--clr-card-bg);
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.07);
  overflow: hidden;
}
```
**변경 후:**
```css
.mobile-report-card-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
```
- 배경·그림자·border-radius 제거
- `gap: 10px`으로 항목 간 여백 확보

### `.mobile-report-card`
**현재:** `border-bottom: 1px solid var(--clr-border-soft)` 포함, 배경 transparent
**변경 후:**
```css
.mobile-report-card {
  background: var(--clr-card-bg);
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.07);
  border-bottom: none;
}
```
- 각 카드가 독립 흰 카드 스타일 획득
- `border-bottom` 제거 (컨테이너 구분선 불필요)

### `.mobile-report-card:last-child`
**제거** — 독립 카드 구조에서 불필요

### `.mobile-report-card-row` (편집 모드)
편집 모드에서 `.mobile-report-card-row`가 카드를 감싸므로, row 단위로 카드 스타일 적용:
```css
.mobile-report-card-row {
  background: var(--clr-card-bg);
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.07);
  overflow: hidden;
}
```
- `.mobile-report-card`의 shadow/radius는 row가 없을 때만 적용되도록 조정

---

## 결과 모습
```
[카드 1] 2026년 5월 17일 (일)           수정
         유초등부 15 · 중고등부 7 · ...

[카드 2] 2026년 5월 10일 (일)           수정
         유초등부 20 · 중고등부 9 · ...

[카드 3] 2026년 5월 3일 (일)            수정
         유초등부 19 · 중고등부 8 · ...
```

---

## 검증 기준
1. 각 항목이 독립 카드로 시각적으로 구분됨
2. 편집 모드(삭제 버튼 표시)에서 카드 스타일 유지
3. 빌드 통과
4. 모바일/데스크탑 레이아웃 깨짐 없음

---

## 버전
v2.7.2 → v2.7.3
