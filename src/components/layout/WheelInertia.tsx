"use client";

import { useEffect } from "react";

const MAX_SPEED = 126;
const IMPULSE_SCALE = 0.062;
const ACCELERATION = 0.12;
const INPUT_DECAY = 0.93;
const STOP_EPSILON = 0.035;

function isEditableElement(element: Element) {
  if (element instanceof HTMLInputElement) return true;
  if (element instanceof HTMLTextAreaElement) return true;
  if (element instanceof HTMLSelectElement) return true;
  return element.getAttribute("contenteditable") === "true";
}

function canScrollNode(node: Element, deltaY: number) {
  const style = window.getComputedStyle(node);
  const overflowY = style.overflowY;
  const scrollable = overflowY === "auto" || overflowY === "scroll";
  if (!scrollable) return false;
  if (node.scrollHeight <= node.clientHeight) return false;
  if (deltaY < 0) return node.scrollTop > 0;
  if (deltaY > 0) return node.scrollTop + node.clientHeight < node.scrollHeight;
  return false;
}

function hasScrollableAncestor(target: EventTarget | null, deltaY: number) {
  let current = target instanceof Element ? target : null;
  while (current && current !== document.body) {
    if (isEditableElement(current)) return true;
    if (canScrollNode(current, deltaY)) return true;
    current = current.parentElement;
  }
  return false;
}

function normalizeDelta(event: WheelEvent) {
  if (event.deltaMode === 1) return event.deltaY * 16;
  if (event.deltaMode === 2) return event.deltaY * window.innerHeight;
  return event.deltaY;
}

export function WheelInertia() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;

    let rafId = 0;
    let velocity = 0;
    let momentum = 0;

    const tick = () => {
      velocity += (momentum - velocity) * ACCELERATION;
      momentum *= INPUT_DECAY;
      if (Math.abs(momentum) < STOP_EPSILON) momentum = 0;

      if (Math.abs(velocity) < STOP_EPSILON && momentum === 0) {
        velocity = 0;
        rafId = 0;
        return;
      }

      const maxY = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      const nextY = Math.min(maxY, Math.max(0, window.scrollY + velocity));
      window.scrollTo({ top: nextY, left: window.scrollX, behavior: "auto" });

      if (nextY <= 0 || nextY >= maxY) {
        velocity = 0;
        momentum = 0;
        rafId = 0;
        return;
      }

      rafId = window.requestAnimationFrame(tick);
    };

    const onWheel = (event: WheelEvent) => {
      if (event.defaultPrevented) return;
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.deltaY === 0) return;
      if (hasScrollableAncestor(event.target, event.deltaY)) return;

      event.preventDefault();
      const normalized = normalizeDelta(event);
      const impulse = Math.max(-MAX_SPEED, Math.min(MAX_SPEED, normalized * IMPULSE_SCALE));
      momentum = Math.max(-MAX_SPEED, Math.min(MAX_SPEED, momentum + impulse));
      if (!rafId) {
        rafId = window.requestAnimationFrame(tick);
      }
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      window.removeEventListener("wheel", onWheel);
      if (rafId) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, []);

  return null;
}
