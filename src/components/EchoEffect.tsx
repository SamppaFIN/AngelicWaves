import { useEffect, useRef } from "react";

interface EchoEffectProps {
  text?: string;
  repetitions?: number;
  decay?: number; // 0..1 smaller is faster fade
}

export function EchoEffect({ text = "AngelicVoices", repetitions = 6, decay = 0.15 }: EchoEffectProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.innerHTML = "";

    for (let i = 0; i < repetitions; i++) {
      const span = document.createElement("span");
      span.textContent = text;
      const opacity = Math.max(0, 1 - i * decay);
      const blur = i * 1.5;
      const y = i * 2.5;
      span.setAttribute(
        "style",
        `display:block;transform:translateY(${y}px);opacity:${opacity};filter:blur(${blur}px);`,
      );
      el.appendChild(span);
    }
  }, [text, repetitions, decay]);

  return (
    <div
      ref={containerRef}
      className="select-none pointer-events-none text-4xl font-semibold tracking-wide text-primary/90"
      aria-hidden="true"
    />
  );
}


