import type React from "react";
import { useRef, useState } from "react";

export function useSortCards(onReorder: (from: number, to: number) => void) {
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);
  const dragIdxRef = useRef<number | null>(null);
  const overIdxRef = useRef<number | null>(null);
  const isDragActiveRef = useRef(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);
  const wasJustDraggedRef = useRef(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  function clearLongPress() {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }

  function reset() {
    setDragIdx(null);
    setOverIdx(null);
    dragIdxRef.current = null;
    overIdxRef.current = null;
    isDragActiveRef.current = false;
    if (containerRef.current) containerRef.current.style.touchAction = "";
  }

  function commit(from: number | null, to: number | null) {
    if (from !== null && to !== null && from !== to) {
      onReorder(from, to);
      wasJustDraggedRef.current = true;
      setTimeout(() => { wasJustDraggedRef.current = false; }, 150);
    }
    reset();
  }

  function mouseProps(i: number) {
    return {
      draggable: true as const,
      "data-drag-idx": String(i),
      onDragStart: (e: React.DragEvent) => {
        e.dataTransfer.effectAllowed = "move";
        dragIdxRef.current = i;
        setDragIdx(i);
      },
      onDragOver: (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        if (overIdxRef.current !== i) {
          overIdxRef.current = i;
          setOverIdx(i);
        }
      },
      onDrop: (e: React.DragEvent) => {
        e.preventDefault();
        commit(dragIdxRef.current, i);
      },
      onDragEnd: () => reset(),
    };
  }

  function touchProps(i: number) {
    return {
      "data-drag-idx": String(i),
      onTouchStart: (e: React.TouchEvent) => {
        touchStartPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        clearLongPress();
        longPressTimer.current = setTimeout(() => {
          isDragActiveRef.current = true;
          dragIdxRef.current = i;
          setDragIdx(i);
          if (containerRef.current) containerRef.current.style.touchAction = "none";
          navigator.vibrate?.(50);
        }, 500);
      },
      onTouchMove: (e: React.TouchEvent) => {
        if (!isDragActiveRef.current) {
          const touch = e.touches[0];
          const start = touchStartPos.current;
          if (start) {
            const dx = touch.clientX - start.x;
            const dy = touch.clientY - start.y;
            if (Math.sqrt(dx * dx + dy * dy) > 8) clearLongPress();
          }
          return;
        }
        const touch = e.touches[0];
        const el = document.elementFromPoint(touch.clientX, touch.clientY);
        // elementFromPoint 우선, gap 위면 nearest-card 폴백
        let found = el?.closest("[data-drag-idx]:not([data-drag-group])") as HTMLElement | null;
        if (!found) {
          let minDist = 80;
          document.querySelectorAll<HTMLElement>("[data-drag-idx]:not([data-drag-group])").forEach(c => {
            const r = c.getBoundingClientRect();
            const dist = Math.hypot(touch.clientX - (r.left + r.width / 2), touch.clientY - (r.top + r.height / 2));
            if (dist < minDist) { minDist = dist; found = c; }
          });
        }
        if (found) {
          const idx = parseInt(found.getAttribute("data-drag-idx") ?? "-1");
          if (idx >= 0 && idx !== overIdxRef.current) {
            overIdxRef.current = idx;
            setOverIdx(idx);
          }
        }
      },
      onTouchEnd: () => {
        clearLongPress();
        if (isDragActiveRef.current) {
          commit(dragIdxRef.current, overIdxRef.current);
        } else {
          reset();
        }
      },
      onTouchCancel: () => {
        clearLongPress();
        reset();
      },
    };
  }

  return {
    dragIdx,
    overIdx,
    isDragging: dragIdx !== null,
    wasJustDragged: wasJustDraggedRef,
    containerRef,
    mouseProps,
    touchProps,
  };
}
