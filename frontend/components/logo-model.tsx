"use client";

import Image from "next/image";
import { useRef } from "react";

export function LogoModel() {
  const frame = useRef<HTMLDivElement>(null);

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const element = frame.current;
    if (!element || event.pointerType === "touch") return;
    const bounds = element.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    element.style.setProperty("--tilt-x", `${y * -10}deg`);
    element.style.setProperty("--tilt-y", `${x * 10}deg`);
    element.style.setProperty("--shine-x", `${(x + 0.5) * 100}%`);
    element.style.setProperty("--shine-y", `${(y + 0.5) * 100}%`);
  }

  function resetPointer() {
    const element = frame.current;
    if (!element) return;
    element.style.setProperty("--tilt-x", "0deg");
    element.style.setProperty("--tilt-y", "0deg");
    element.style.setProperty("--shine-x", "50%");
    element.style.setProperty("--shine-y", "50%");
  }

  return (
    <div
      className="logo-model"
      ref={frame}
      onPointerMove={handlePointerMove}
      onPointerLeave={resetPointer}
      aria-label="Interactive TechJest logo"
      role="img"
    >
      <div className="logo-model-shadow" />
      <div className="logo-model-face">
        <span className="logo-model-shine" />
        <Image
          src="/images/techjest-brand.png"
          alt=""
          width={1152}
          height={768}
          sizes="(max-width: 800px) 90vw, 540px"
        />
      </div>
    </div>
  );
}
