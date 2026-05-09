import type React from "react";
import { useRef, useState } from "react";

export type GroupId = string;

type DragInfo = { group: GroupId; idx: number };

export function useCrossGroupDrag(
  onMove: (fromGroup: GroupId, fromIdx: number, toGroup: GroupId, toIdx: number) => void,
  options?: { onSetTouchAction?: (value: string) => void },
) {
  const [dragInfo, setDragInfo] = useState<DragInfo | null>(null);
  const [overInfo, setOverInfo] = useState<DragInfo | null>(null);

  // refs for touch: avoid stale closures
  const dragRef  = useRef<DragInfo | null>(null);
  const overRef  = useRef<DragInfo | null>(null);
  const touchActive = useRef(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartPos  = useRef<{ x: number; y: number } | null>(null);
  const wasJustDragged = useRef(false);

  // refs to section containers for touch-action management
  const middleContainerRef = useRef<HTMLDivElement | null>(null);
  const highContainerRef   = useRef<HTMLDivElement | null>(null);

  function clearLongPress() {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }

  function setTouchAction(value: string) {
    if (options?.onSetTouchAction) {
      options.onSetTouchAction(value);
    } else {
      if (middleContainerRef.current) middleContainerRef.current.style.touchAction = value;
      if (highContainerRef.current)   highContainerRef.current.style.touchAction   = value;
    }
  }

  /** elementFromPoint로 카드를 찾고, 못 찾으면 가장 가까운 카드를 반환 */
  function findNearestCard(cx: number, cy: number): DragInfo | null {
    const el = document.elementFromPoint(cx, cy);
    const direct = (el as Element)?.closest("[data-drag-group]") as HTMLElement | null;
    if (direct?.dataset.dragGroup && direct?.dataset.dragIdx !== undefined) {
      return { group: direct.dataset.dragGroup as GroupId, idx: parseInt(direct.dataset.dragIdx, 10) };
    }
    // 폴백: 화면의 모든 [data-drag-group] 요소 중 중심점이 가장 가까운 것
    let best: DragInfo | null = null;
    let minDist = 80; // 80px 이내만 인식
    document.querySelectorAll<HTMLElement>("[data-drag-group]").forEach(card => {
      const r = card.getBoundingClientRect();
      const dist = Math.hypot(cx - (r.left + r.width / 2), cy - (r.top + r.height / 2));
      if (dist < minDist) {
        minDist = dist;
        best = { group: card.dataset.dragGroup as GroupId, idx: parseInt(card.dataset.dragIdx ?? "0", 10) };
      }
    });
    return best;
  }

  function commit(from: DragInfo, to: DragInfo) {
    onMove(from.group, from.idx, to.group, to.idx);
    wasJustDragged.current = true;
    setTimeout(() => { wasJustDragged.current = false; }, 150);
  }

  function reset() {
    setDragInfo(null);
    setOverInfo(null);
    dragRef.current  = null;
    overRef.current  = null;
    touchActive.current = false;
    setTouchAction("");
  }

  /** 카드에 붙이는 마우스 DnD props */
  function mouseProps(group: GroupId, localIdx: number) {
    return {
      draggable: true as const,
      "data-drag-group": group,
      "data-drag-idx": String(localIdx),
      onDragStart: (e: React.DragEvent) => {
        e.dataTransfer.effectAllowed = "move";
        const info = { group, idx: localIdx };
        dragRef.current = info;
        setDragInfo(info);
        setOverInfo(null);
      },
      onDragOver: (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = "move";
        const prev = overRef.current;
        if (prev?.group !== group || prev?.idx !== localIdx) {
          const info = { group, idx: localIdx };
          overRef.current = info;
          setOverInfo(info);
        }
      },
      onDrop: (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (dragRef.current) commit(dragRef.current, { group, idx: localIdx });
        reset();
      },
      onDragEnd: () => reset(),
    };
  }

  /** 섹션 컨테이너에 붙이는 props (카드 없는 빈 영역에 드롭 시 맨 뒤로) */
  function sectionProps(group: GroupId, memberCount: number) {
    return {
      onDragOver: (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        // 이미 카드 위에 있으면 덮어쓰지 않음
        if (overRef.current?.group === group) return;
        const info = { group, idx: memberCount };
        overRef.current = info;
        setOverInfo(info);
      },
      onDrop: (e: React.DragEvent) => {
        e.preventDefault();
        const to = overRef.current ?? { group, idx: memberCount };
        if (dragRef.current) commit(dragRef.current, to);
        reset();
      },
    };
  }

  /** 카드에 붙이는 터치 props */
  function touchProps(group: GroupId, localIdx: number) {
    return {
      "data-drag-group": group,
      "data-drag-idx": String(localIdx),
      onTouchStart: (e: React.TouchEvent) => {
        const t = e.touches[0];
        touchStartPos.current = { x: t.clientX, y: t.clientY };
        clearLongPress();
        longPressTimer.current = setTimeout(() => {
          touchActive.current = true;
          const info = { group, idx: localIdx };
          dragRef.current = info;
          setDragInfo(info);
          setTouchAction("none");
          navigator.vibrate?.(50);
        }, 500);
      },
      onTouchMove: (e: React.TouchEvent) => {
        if (!touchActive.current) {
          // 손가락 움직임이 크면 long press 취소
          const t = e.touches[0];
          const s = touchStartPos.current;
          if (s && Math.hypot(t.clientX - s.x, t.clientY - s.y) > 8) clearLongPress();
          return;
        }
        e.preventDefault();
        const t = e.touches[0];
        const found = findNearestCard(t.clientX, t.clientY);
        if (found) {
          const prev = overRef.current;
          if (prev?.group !== found.group || prev?.idx !== found.idx) {
            overRef.current = found;
            setOverInfo(found);
          }
        }
      },
      onTouchEnd: () => {
        clearLongPress();
        if (touchActive.current && dragRef.current && overRef.current) {
          commit(dragRef.current, overRef.current);
        }
        reset();
      },
      onTouchCancel: () => {
        clearLongPress();
        reset();
      },
    };
  }

  function isDragging(group: GroupId, idx: number) {
    return dragInfo?.group === group && dragInfo?.idx === idx;
  }
  function isOver(group: GroupId, idx: number) {
    return overInfo?.group === group && overInfo?.idx === idx;
  }

  return {
    isDragging,
    isOver,
    isDraggingAny: dragInfo !== null,
    wasJustDragged,
    middleContainerRef,
    highContainerRef,
    mouseProps,
    sectionProps,
    touchProps,
  };
}
