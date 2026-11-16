"use client";

import { useEffect, useRef } from "react";
import { ADSENSE_CLIENT } from "@/lib/ads";

declare global {
  interface Window { adsbygoogle?: unknown[] }
}

/**
 * 반응형 애드센스 디스플레이 광고. 게임 화면(section)은 hidden 으로 숨겨져 있다가 나타나므로,
 * 폭이 0인 채로 채우면 애드센스가 실패한다. 처음 화면에 보일 때 한 번만 채운다.
 */
export default function AdUnit({ slot }: { slot: string }) {
  const ref = useRef<HTMLModElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!slot || !el) return;
    let done = false;
    const fill = () => {
      if (done || el.offsetWidth === 0) return;
      done = true;
      io.disconnect();
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch {
        /* 광고 차단기 등으로 실패해도 게임은 계속 */
      }
    };
    const io = new IntersectionObserver((entries) => entries.some((e) => e.isIntersecting) && fill());
    io.observe(el);
    return () => io.disconnect();
  }, [slot]);

  if (!slot) return null;
  return (
    <div className="ad-slot">
      <ins
        ref={ref}
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
