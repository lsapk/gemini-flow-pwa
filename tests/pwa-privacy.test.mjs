import test from "node:test";
import assert from "node:assert/strict";
import { readFile, access } from "node:fs/promises";
import vm from "node:vm";
async function worker() {
  const handlers = new Map(),
    cached = [],
    removed = [];
  const context = {
    URL,
    Request,
    Response,
    Promise,
    self: {
      location: { origin: "https://deepflow.example" },
      clients: { claim: async () => {} },
      addEventListener: (name, handler) => handlers.set(name, handler),
    },
    caches: {
      keys: async () => ["deepflow-data-v4", "unrelated-application"],
      delete: async (key) => removed.push(key),
      match: async (path) =>
        path === "/offline.html"
          ? new Response("Offline public screen")
          : undefined,
      open: async () => ({
        addAll: async (paths) => cached.push(...paths),
        put: async (request) => cached.push(request.url),
      }),
    },
    fetch: async () => {
      throw new Error("Offline");
    },
  };
  vm.runInNewContext(
    await readFile(new URL("../public/sw.js", import.meta.url), "utf8"),
    context,
  );
  return { handlers, cached, removed };
}
test("service worker never intercepts auth/API/callback/credentialed requests", async () => {
  const { handlers, cached } = await worker();
  for (const [path, headers] of [
    ["/auth/v1/token", {}],
    ["/functions/v1/google-api", {}],
    ["/assets/file.js?access_token=private", {}],
    ["/assets/file.js", { authorization: "Bearer private" }],
  ]) {
    let intercepted = false;
    handlers.get("fetch")({
      request: new Request(`https://deepflow.example${path}`, { headers }),
      respondWith: () => {
        intercepted = true;
      },
    });
    assert.equal(intercepted, false);
  }
  assert.deepEqual(cached, []);
});
test("cache activation removes old private Deepflow caches and preserves other applications", async () => {
  const { handlers, removed } = await worker();
  let done;
  handlers.get("activate")({
    waitUntil: (promise) => {
      done = promise;
    },
  });
  await done;
  assert.deepEqual(removed, ["deepflow-data-v4"]);
});
test("PWA installation assets are real files", async () => {
  const { handlers, cached } = await worker();
  let done;
  handlers.get("install")({
    waitUntil: (promise) => {
      done = promise;
    },
  });
  await done;
  for (const path of cached)
    await access(new URL(`../public${path}`, import.meta.url));
  const manifest = JSON.parse(
    await readFile(new URL("../public/manifest.json", import.meta.url), "utf8"),
  );
  for (const icon of manifest.icons)
    await access(new URL(`../public/${icon.src}`, import.meta.url));
});
