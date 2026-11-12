// Runs in <head> before the first paint, so the saved theme is applied without a flash.
// Light is the default; dark is only used after the visitor picks it with the header button.
export const themeScript = `(() => {
  const root = document.documentElement;
  let theme = "light";
  try {
    if (localStorage.getItem("theme") === "dark") theme = "dark";
  } catch {}
  root.dataset.theme = theme;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", theme === "dark" ? "#2e3468" : "#1b1e4a");
})();`;
