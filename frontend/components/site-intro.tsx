import Image from "next/image";

// Runs in <head> before the first paint, so the intro never flashes in late. It plays on public pages
// at most once per 30 minutes, never for reduced-motion users or crawlers, and any click, scroll, or
// key press skips it. The CSS for html[data-intro] lives in globals.css.
export const introScript = `(() => {
  const root = document.documentElement;
  try {
    if (/^\\/(admin|auth|dashboard|messages|project)(\\/|$)/.test(location.pathname)) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (navigator.webdriver || /bot|crawl|spider|slurp|lighthouse|headless/i.test(navigator.userAgent)) return;
    const now = Date.now();
    const last = Number(localStorage.getItem("techjest-intro")) || 0;
    localStorage.setItem("techjest-intro", String(now));
    if (now - last < 1800000) return;
  } catch {
    return;
  }
  const events = ["pointerdown", "keydown", "wheel", "touchstart"];
  const skip = () => {
    if (root.dataset.intro !== "play") return;
    root.dataset.intro = "skip";
    setTimeout(done, 400);
  };
  const ended = (event) => {
    if (event.animationName === "intro-exit" || event.animationName === "intro-fade") done();
  };
  function done() {
    root.removeAttribute("data-intro");
    events.forEach((type) => removeEventListener(type, skip, true));
    removeEventListener("animationend", ended);
  }
  root.dataset.intro = "play";
  events.forEach((type) => addEventListener(type, skip, { capture: true, passive: true }));
  addEventListener("animationend", ended);
  setTimeout(done, 6000);
})();`;

export function SiteIntro() {
  return (
    <div className="intro" aria-hidden="true">
      <div className="intro-panel">
        <div className="intro-content">
          {/* Same size hint as the hero logo, so both share one download. */}
          <Image
            className="intro-logo"
            src="/images/techjest-brand.png"
            alt=""
            width={1152}
            height={768}
            sizes="(max-width: 800px) 90vw, 540px"
          />
          <span className="intro-rule" />
          <span className="intro-caption">Software development company</span>
        </div>
      </div>
    </div>
  );
}
