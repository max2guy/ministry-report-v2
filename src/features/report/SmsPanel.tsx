import { useState } from "react";
import type { DepartmentZone } from "../../domain/reportTypes";
import { buildSmsTargets, isMobile, type SmsTarget } from "./smsUtils";

type Props = {
  zones: DepartmentZone[];
  reportDate: string;
  onClose: () => void;
};

export function SmsPanel({ zones, reportDate, onClose }: Props) {
  const allTargets = buildSmsTargets(zones, reportDate);
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());
  const [queueIdx, setQueueIdx] = useState<number | null>(null);
  const [awaitingConfirm, setAwaitingConfirm] = useState(false);

  const pending = allTargets.filter(t => t.phone && !sentIds.has(t.id));
  const currentTarget: SmsTarget | null =
    queueIdx !== null ? (pending[queueIdx] ?? null) : null;

  function openSms(target: SmsTarget) {
    if (!isMobile()) {
      alert("이 기능은 모바일에서만 사용할 수 있습니다.");
      return;
    }
    window.location.href = `sms:${target.phone}?body=${encodeURIComponent(target.msg)}`;
  }

  function startQueue() {
    if (!pending.length) return;
    setQueueIdx(0);
    setAwaitingConfirm(false);
    openSms(pending[0]);
    setAwaitingConfirm(true);
  }

  function markSent(id: string) {
    const next = new Set(sentIds);
    next.add(id);
    setSentIds(next);
    advanceQueue(next);
  }

  function markUnsent() {
    advanceQueue(sentIds);
  }

  function advanceQueue(currentSentIds: Set<string>) {
    setAwaitingConfirm(false);
    const remaining = allTargets.filter(t => t.phone && !currentSentIds.has(t.id));
    const nextIdx = (queueIdx ?? 0) + 1;
    if (nextIdx >= remaining.length) {
      setQueueIdx(null);
      return;
    }
    setQueueIdx(nextIdx);
    setTimeout(() => {
      const next = remaining[nextIdx];
      if (next) { openSms(next); setAwaitingConfirm(true); }
    }, 200);
  }

  function stopQueue() {
    setQueueIdx(null);
    setAwaitingConfirm(false);
  }

  const isQueueActive = queueIdx !== null;
  const zoneTargets = allTargets.filter(t => t.id.startsWith("z"));
  const distTargets = allTargets.filter(t => t.id.startsWith("d"));
  const missingPhone = allTargets.filter(t => !t.phone);

  return (
    <div className="sms-panel" role="dialog" aria-label="문자 발송">
      <div className="sms-panel-header">
        <span>📱 문자 발송</span>
        <button type="button" className="sms-panel-close" onClick={onClose}>✕</button>
      </div>

      <div className="sms-panel-controls">
        <button
          type="button"
          className="btn-sms-all"
          disabled={isQueueActive || !pending.length}
          onClick={startQueue}
        >
          📤 전체 순차 전송
        </button>
        {isQueueActive && (
          <button type="button" className="btn-sms-stop" onClick={stopQueue}>⏹</button>
        )}
        <span className="sms-progress">
          {isQueueActive ? `${(queueIdx ?? 0) + 1}/${pending.length}` : ""}
        </span>
      </div>

      {missingPhone.length > 0 && (
        <p className="sms-missing-warning">
          ⚠️ 번호 미등록: {missingPhone.map(t => t.label).join(", ")}
        </p>
      )}

      <p className="sms-summary">
        전송완료 {sentIds.size}/{allTargets.length}
      </p>

      {awaitingConfirm && currentTarget && (
        <div className="sms-confirm-bar">
          문자앱 전송 후 돌아와서 확인해주세요.
          <button type="button" className="btn-sms-confirm" onClick={() => markSent(currentTarget.id)}>
            ✅ 전송완료
          </button>
          <button type="button" className="btn-sms-skip" onClick={markUnsent}>
            ↩️ 미전송
          </button>
        </div>
      )}

      {zoneTargets.length > 0 && (
        <>
          <div className="sms-section-label">── 구역장 개별 전송 ──</div>
          {zoneTargets.map(t => (
            <SmsItem
              key={t.id}
              target={t}
              sent={sentIds.has(t.id)}
              isCurrent={isQueueActive && awaitingConfirm && currentTarget?.id === t.id}
              onOpen={() => openSms(t)}
              onMarkSent={() => markSent(t.id)}
            />
          ))}
        </>
      )}

      {distTargets.length > 0 && (
        <>
          <div className="sms-section-label">── 교구장 전체 결석자 전송 ──</div>
          {distTargets.map(t => (
            <SmsItem
              key={t.id}
              target={t}
              sent={sentIds.has(t.id)}
              isCurrent={isQueueActive && awaitingConfirm && currentTarget?.id === t.id}
              onOpen={() => openSms(t)}
              onMarkSent={() => markSent(t.id)}
            />
          ))}
        </>
      )}

      {allTargets.length === 0 && (
        <p className="sms-empty">결석자가 없습니다.</p>
      )}
    </div>
  );
}

function SmsItem({
  target,
  sent,
  isCurrent,
  onOpen,
  onMarkSent,
}: {
  target: SmsTarget;
  sent: boolean;
  isCurrent: boolean;
  onOpen: () => void;
  onMarkSent: () => void;
}) {
  return (
    <div className={`sms-item${sent ? " sent" : ""}${isCurrent ? " current" : ""}${!target.phone ? " no-phone" : ""}`}>
      <div className="sms-item-header">
        <span className="sms-item-label">{target.label}</span>
        <span className="sms-item-leader">{target.leaderName}</span>
      </div>
      <pre className="sms-item-msg">{target.msg}</pre>
      <div className="sms-item-actions">
        {sent ? (
          <span className="sms-sent-badge">✓ 전송완료</span>
        ) : target.phone ? (
          <>
            <button type="button" className="btn-sms-open" onClick={onOpen}>📨 문자앱 열기</button>
            <button type="button" className="btn-sms-confirm-manual" onClick={onMarkSent}>✅ 수동완료</button>
          </>
        ) : (
          <span className="sms-no-phone">⚙️ 명단관리에서 번호 입력 필요</span>
        )}
      </div>
    </div>
  );
}
