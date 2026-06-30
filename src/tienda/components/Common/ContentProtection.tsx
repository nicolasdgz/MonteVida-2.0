"use client";
import { useEffect } from "react";

export default function ContentProtection() {
  useEffect(() => {
    const preventContextMenu = (e: MouseEvent) => e.preventDefault();
    const preventDragStart = (e: DragEvent) => e.preventDefault();
    const preventSelectStart = (e: Event) => e.preventDefault();

    document.addEventListener("contextmenu", preventContextMenu);
    document.addEventListener("dragstart", preventDragStart);
    document.addEventListener("selectstart", preventSelectStart);

    return () => {
      document.removeEventListener("contextmenu", preventContextMenu);
      document.removeEventListener("dragstart", preventDragStart);
      document.removeEventListener("selectstart", preventSelectStart);
    };
  }, []);

  return null;
}
