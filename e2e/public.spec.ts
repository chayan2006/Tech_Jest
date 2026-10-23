import { expect, test } from "@playwright/test";

test("public pages are served from the cache", async ({ request }) => {
  // (The sitemap is rebuilt on the same schedule but sent with Next's own sitemap headers.)
  for (const path of ["/", "/services", "/about", "/contact", "/portfolio"]) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(200);
    expect(response.headers()["cache-control"], path).toContain("s-maxage=300");
  }
});

test("only the homepage downloads the intro video", async ({ page }) => {
  const videos: string[] = [];
  page.on("request", (request) => {
    if (request.url().endsWith(".mp4")) videos.push(new URL(page.url()).pathname);
  });
  await page.goto("/services");
  await page.goto("/about");
  expect(videos).toEqual([]);
});

test("every sitemap link works", async ({ request }) => {
  const sitemap = await (await request.get("/sitemap.xml")).text();
  const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => new URL(match[1]!).pathname);
  expect(urls.length).toBeGreaterThan(5);
  for (const path of urls) expect((await request.get(path)).status(), path).toBe(200);
});
