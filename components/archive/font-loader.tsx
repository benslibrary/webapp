"use client";

import { useEffect } from "react";

const PRETENDARD_URL =
  "https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.css";

export function ArchiveFontLoader() {
  useEffect(() => {
    const id = "archive-pretendard";
    if (document.getElementById(id)) {
      return;
    }
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = PRETENDARD_URL;
    link.crossOrigin = "anonymous";
    document.head.appendChild(link);
  }, []);
  return null;
}
