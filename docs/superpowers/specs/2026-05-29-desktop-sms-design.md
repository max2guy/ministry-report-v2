# 데스크탑 문자 발송 기능 설계

## 목표

맥북(데스크탑) 환경에서도 구역/교구 결석자 문자 발송이 가능하도록 SmsPanel을 개선한다.  
모바일 경험은 변경 없이 유지하고, 데스크탑에서는 클립보드 복사 + Google Messages for Web 연동 흐름을 제공한다.

---

## 배경 & 제약

- 현재 `SmsPanel.tsx`는 `isMobile()` 검사로 데스크탑을 명시적으로 차단 중
- `sms:` URL 스킴은 모바일 OS 전용 — 데스크탑 브라우저에서 동작 안 함
- Google Messages for Web(`messages.google.com`)에는 번호+내용을 URL 파라미터로 자동 입력하는 공개 API 없음
- 따라서 데스크탑 최적 흐름: **클립보드 복사 + Google Messages Web 탭 수동 유지**

---

## 플랫폼별 흐름

### 모바일 (변경 없음)
버튼 클릭 → `sms:` URL → 삼성/기본 메시지앱 열림 (번호+내용 자동 입력) → 전송 → 앱 복귀 → "전송완료" 확인

### 데스크탑 (신규)
버튼 클릭 → 메시지 내용 클립보드 자동 복사 + 복사 완료 토스트 표시  
→ 사용자가 Google Messages Web 탭에서 연락처 검색 후 붙여넣기·전송  
→ 앱 복귀 → "전송완료" 확인

---

## 변경 범위

### `smsUtils.ts`
- `isMobile()` 함수 유지 (모바일 분기에 사용)
- 변경 없음

### `SmsPanel.tsx`

#### 1. `openSms()` 플랫폼 분기
```
모바일: window.location.href = `sms:${phone}?body=...`  (기존)
데스크탑: navigator.clipboard.writeText(msg) → 복사 완료 상태 표시
```

#### 2. 수신자 전화번호 노출 (데스크탑 전용)
- `SmsItem` 컴포넌트에서 데스크탑일 때 전화번호를 UI에 표시
- Google Messages Web에서 연락처 검색·입력 시 참조용

#### 3. Google Messages Web 열기 버튼
- 패널 상단(controls 영역)에 "🌐 Google Messages 열기" 버튼 1개
- `window.open('https://messages.google.com/web/', '_blank')` — 탭 한 번만 열고 재사용
- 데스크탑에서만 표시

#### 4. 순차 전송 큐 (데스크탑)
- 모바일: 기존과 동일 (sms: URL 전환)
- 데스크탑: 클립보드에 하나씩 자동 복사 → 탭 추가 없음
- 확인 bar 문구 변경: "메시지 앱에서 전송 후 돌아와서 확인해주세요" → 전송완료/미전송

#### 5. 복사 완료 피드백
- 각 항목에 "📋 복사됨" 토스트 또는 인라인 상태 표시 (1.5초 후 사라짐)

---

## 클립보드 복사 내용

메시지 본문만 복사 (전화번호는 UI에서 별도 확인):
```
[2026. 05. 24. 주일 결석 현황]
1구역 결석자 2명
홍길동 김철수
```

---

## 데스크탑 감지 기준

`!isMobile()` — 기존 `isMobile()` 함수 재사용  
(`/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)` 의 반전)

---

## 변경 파일 목록

| 파일 | 변경 유형 |
|------|----------|
| `src/features/report/SmsPanel.tsx` | 수정 — 플랫폼 분기, Google Messages 버튼, 전화번호 표시, 복사 피드백 |
| `src/features/report/smsUtils.ts` | 변경 없음 |
| `src/styles.css` | 수정 — 데스크탑 전용 스타일 추가 (.sms-phone-display, .sms-copy-toast 등) |

---

## 테스트 기준

- 모바일 UA에서: 기존 `sms:` 동작 그대로
- 데스크탑 UA에서:
  - "Google Messages 열기" 버튼 표시됨
  - 각 항목에 전화번호 표시됨
  - 버튼 클릭 시 클립보드에 메시지 복사됨
  - 복사 피드백(토스트) 표시됨
  - 순차 전송 큐: 클립보드 자동 복사 + 확인 bar 표시
