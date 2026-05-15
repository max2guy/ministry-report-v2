# 모바일 보고서 삭제 기능 설계

**날짜:** 2026-05-15  
**버전 기준:** v2.5.1  
**권한:** 최고관리자(`max2guy@gmail.com`) 전용

---

## 1. 문제

모바일 환경에서 저장된 보고서를 삭제할 수 없다.  
데스크탑 `ReportHistoryPanel`에만 삭제 기능이 존재하며, 최고관리자가 모바일(iPad/iPhone)에서도 보고서를 관리할 수 있어야 한다.

## 2. 해결 방향

`MobileReportList`에 편집 모드 토글을 추가한다.  
편집 모드에서 각 보고서 카드에 삭제 버튼이 노출된다.

## 3. 동작 기준

| 상황 | 동작 |
|------|------|
| 최고관리자, 편집 모드 OFF | 목록 상단에 "편집" 버튼 표시 |
| 최고관리자, 편집 모드 ON | 버튼이 "완료"로 바뀜, 각 카드 좌측에 삭제 버튼 노출 |
| 삭제 버튼 탭 | `window.confirm("YYYY년 MM월 DD일 보고서를 삭제할까요?")` |
| 확인 | `onDelete(report)` 호출 → Firestore 삭제 + 상태 업데이트 |
| 취소 | 아무것도 하지 않음 |
| 최고관리자 외 계정 | "편집" 버튼 미표시, 삭제 UI 미노출 |

## 4. 변경 범위

**파일:** `src/features/report/MobileReportList.tsx`
- `canDelete: boolean` prop 추가
- `onDelete: (report: MinistryReport) => void` prop 추가
- `isEditing` 로컬 state 추가
- `canDelete && reports.length > 0` 일 때 "편집/완료" 버튼 렌더링
- 편집 모드 시 각 카드에 삭제 버튼 렌더링

**파일:** `src/App.tsx`
- `MobileReportList`에 `canDelete={isSuperAdmin(currentAccount)}` 전달
- `onDelete={handleDeleteReport}` 전달 (기존 핸들러 재사용)

## 5. 제외 범위

- 새로운 삭제 API 없음 (기존 `handleDeleteReport` 재사용)
- 스와이프 제스처 없음
- 일괄 삭제 없음
- 최고관리자 외 역할에 대한 삭제 권한 없음
