# 아이패드 모바일 레이아웃 설계

**날짜:** 2026-05-15  
**버전 기준:** v2.5.0  
**방식:** CSS `pointer: coarse` 미디어쿼리 추가 (JS 변경 없음)

---

## 1. 문제

현재 `@media (max-width: 820px)` 단일 브레이크포인트를 사용한다.  
아이패드 가로(1024px+) 및 iPad Pro 세로(834px)는 820px 초과로 데스크탑 레이아웃이 표시된다.

## 2. 해결 방향

`pointer: coarse` 미디어 특성을 기존 너비 조건에 OR 결합한다.  
터치 기기(아이패드, 아이폰)는 `pointer: coarse`를 반환하므로 화면 너비와 무관하게 모바일 UI가 적용된다.

## 3. 동작 기준

| 기기 | pointer 값 | 결과 |
|------|-----------|------|
| 아이폰 | coarse | 모바일 UI |
| 아이패드 (모든 방향) | coarse | 모바일 UI |
| 데스크탑 마우스 | fine | 데스크탑 UI |
| 터치+마우스 겸용 노트북 | fine (우선) | 데스크탑 UI |

## 4. 변경 범위

**파일:** `src/styles.css`  
**변경 방식:** `@media (max-width: 820px)` → `@media (max-width: 820px), (pointer: coarse)` (9곳)

**유지:**
- `@media (max-width: 500px)` — 소형 폰 세부 조정, 그대로 유지
- `@media (max-width: 380px)` — 초소형 폰 세부 조정, 그대로 유지
- `App.tsx` — 변경 없음 (`.mobile-only` / `.desktop-only` 클래스 그대로 사용)

## 5. 제외 범위

- JS 터치 감지 로직 없음
- 아이패드 전용 별도 레이아웃 없음 (모바일과 동일)
- 데스크탑 레이아웃 구조 변경 없음
