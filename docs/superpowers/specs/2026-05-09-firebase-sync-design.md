# Firebase 동기화 & GitHub 백업 설계

## 목표

보고서 앱에서 저장한 데이터를 어느 기기에서든 로그인만 하면 볼 수 있게 한다.
- **인증**: Firebase Auth (Google 로그인) — 기존 로컬 계정 시스템 완전 교체
- **주 저장소**: Firestore (공유, 실시간 동기화)
- **보조 백업**: GitHub Gist (admin이 PAT 설정 시 보고서 저장마다 업로드)

---

## 1. 인증 아키텍처

### 변경 전 → 후
- **Before**: `internalAuthStore.ts` (IndexedDB 기반 로컬 계정, 기기 간 공유 불가)
- **After**: Firebase Auth Google 로그인 + Firestore 역할 관리

### 흐름
```
사용자 → "Google로 로그인" 클릭
       → Firebase Auth (Google OAuth)
       → Firestore users/{uid} 확인
            ├─ 없으면: reporter 역할로 자동 생성
            └─ 있으면: 저장된 역할 로드
```

### Firestore 사용자 문서
```
users/{uid}
  displayName: string
  email: string
  role: "admin" | "reporter"
  createdAt: string
```

### 역할 정책
- **admin**: 첫 번째 가입자 또는 Firestore 콘솔에서 수동 지정. 명단 관리, GitHub 설정 가능.
- **reporter**: 보고서 조회·저장 가능.
- **오프라인**: Firebase Auth 토큰 로컬 캐싱 → 오프라인에서도 로그인 상태 유지.

### 제거
- `src/auth/internalAuthStore.ts`
- `src/features/auth/PasswordChangePanel.tsx`
- `src/features/admin/AdminRecoveryManager.tsx`
- 계정 생성 탭, 비밀번호 변경 UI

---

## 2. 데이터 아키텍처 (Firestore)

### 컬렉션 구조
```
reports/{reportId}
  schemaVersion: 2
  id: string
  title: string
  reportDate: string          // "YYYY-MM-DD"
  churchName: string
  pastorName: string
  departments: { ... }        // 기존 MinistryReport 구조 그대로
  offerings: { total, memo }
  prayerRequests: string[]
  announcements: string[]
  createdAt: string
  updatedAt: string
  savedBy: string             // Firebase uid (마지막 저장자)

roster/shared                 // 단일 문서 (교회 전체 공유)
  departments: { ... }        // 기존 MemberRoster 구조 그대로
  updatedAt: string

settings/github               // GitHub Gist 설정
  gistId: string
  updatedAt: string
  // PAT는 Firestore에 저장하지 않음 — 각 기기 localStorage에만 보관
```

### 저장·로드 동작
- **저장**: "저장" 버튼 → Firestore 업로드 + IndexedDB 로컬 캐시 동시 저장
- **로드**: 앱 시작 시 Firestore fetch → 로컬 캐시 덮어쓰기
- **오프라인**: Firestore 오프라인 퍼시스턴스 활성화 → 오프라인 변경은 자동 큐잉 → 온라인 복귀 시 자동 업로드
- **초기 동기화**: 실시간 리스너(onSnapshot) 미사용, 앱 시작 시 1회 fetch로 단순하게 시작

### Firestore Security Rules
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 로그인한 사용자만 접근
    match /reports/{reportId} {
      allow read, write: if request.auth != null;
    }
    match /roster/shared {
      allow read, write: if request.auth != null;
    }
    // 사용자 프로필: 본인만 읽기, admin만 쓰기
    match /users/{uid} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == uid ||
                      get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    // GitHub 설정: admin만 읽기/쓰기
    match /settings/github {
      allow read, write: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

---

## 3. GitHub Gist 백업

### 역할
Firestore가 주 저장소. GitHub Gist는 admin이 설정한 경우에만 동작하는 보조 백업.

### Gist 구조 (private, 1개)
```
description: "사역보고서 v2 백업"
files:
  reports.json   ← 전체 보고서 배열
  roster.json    ← 명단 전체
```

### 동작 흐름
```
보고서 저장
  ├─ 1) Firestore 저장 (항상)
  └─ 2) GitHub Gist 업로드 (PAT가 localStorage에 있을 때만)
       └─ 실패해도 에러 무시 (Firestore 저장은 완료됨)
```

### PAT 보안
- PAT는 **localStorage에만** 저장 (Firestore에 올리지 않음)
- 기기마다 admin이 직접 입력
- Gist ID는 Firestore `settings/github`에 저장 → 모든 기기에서 공유

### 복구
기존 "JSON 가져오기" 기능으로 Gist의 `reports.json`을 언제든 import 가능.

---

## 4. UI 변경사항

### 로그인 화면
```
┌──────────────────────────┐
│      사역보고서 v2        │
│                          │
│  [G] Google로 로그인     │
│                          │
│      연천장로교회         │
└──────────────────────────┘
```
기존 이메일/비밀번호/계정 생성 탭 전부 제거.

### 상단바 동기화 상태
```
사역보고서 v2  ☁️  📲  🔄
              ↑
    저장됨 / 동기화 중... / 오프라인
```

### 계정 패널 (사이드바)
```
┌──────────────────────┐
│ 보고자 계정           │
│ 김우중               │
│ max2guy@gmail.com    │
│ [로그아웃]           │
└──────────────────────┘
```
비밀번호 변경 패널 제거.

### GitHub 설정 패널 (admin만 표시)
```
┌────────────────────────────┐
│ GitHub 백업 설정 (관리자)   │
│ PAT: [••••••••] [저장]     │
│ Gist: abc123 ✓ 연결됨      │
│ 마지막 백업: 5월 10일 14:30 │
└────────────────────────────┘
```

---

## 5. 마이그레이션 계획

### 기존 IndexedDB → Firestore 1회 이전
```
첫 Google 로그인
  └─ IndexedDB에 기존 데이터 있음?
       ├─ 있음 → "기존 데이터를 클라우드로 이전할까요?" 다이얼로그
       │          [이전하기] → reports + roster → Firestore → 완료
       └─ 없음 → Firestore fetch → 정상 시작
```

### Firebase 프로젝트 설정 (구현 전 필요)
1. [console.firebase.google.com](https://console.firebase.google.com) 에서 프로젝트 생성
2. Google 로그인 프로바이더 활성화
3. Firestore 데이터베이스 생성 (프로덕션 모드)
4. Security Rules 배포
5. Firebase config (apiKey 등) → GitHub Actions Secret에 추가

### 새 파일
```
src/
  lib/
    firebase.ts                    // Firebase 초기화
  auth/
    firebaseAuthStore.ts           // Firebase Auth 래퍼
  storage/
    firestoreReportStore.ts        // Firestore 보고서 CRUD
    firestoreRosterStore.ts        // Firestore 명단 CRUD
  features/
    auth/
      GoogleSignInButton.tsx       // Google 로그인 버튼
    sync/
      githubGistBackup.ts          // Gist 업로드 로직
      GithubSettingsPanel.tsx      // admin PAT 설정 UI
      useSyncStatus.ts             // 동기화 상태 훅
```

### 제거 파일
```
src/auth/internalAuthStore.ts
src/features/auth/PasswordChangePanel.tsx
src/features/admin/AdminRecoveryManager.tsx
```

---

## 6. Firebase 무료 플랜(Spark) 한도

이 앱 규모(교회 1개, 사용자 ~10명)에서 무료 플랜으로 충분:
- Firestore 읽기 50,000회/일
- Firestore 쓰기 20,000회/일
- Firebase Auth 무제한
