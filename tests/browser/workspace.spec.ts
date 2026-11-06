import { test, expect, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
const id = "11111111-1111-4111-8111-111111111111";
const user = {
  id,
  aud: "authenticated",
  role: "authenticated",
  email: "camille@example.test",
  email_confirmed_at: new Date().toISOString(),
  app_metadata: { provider: "email" },
  user_metadata: { display_name: "Camille" },
  created_at: new Date().toISOString(),
};
test.beforeEach(async ({ page }) => {
  page.on("pageerror", (error) =>
    console.error(`Browser error: ${error.message}`),
  );
});
async function backend(page: Page, { missingGoogle = false } = {}) {
  const tasks: Record<string, unknown>[] = [];
  let credits = 5;
  await page.route("http://127.0.0.1:54321/**", async (route) => {
    const request = route.request(),
      url = new URL(request.url());
    const path = url.pathname;
    const reply = (data: unknown, status = 200) =>
      route.fulfill({
        status,
        contentType: "application/json",
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify(data),
      });
    if (request.method() === "OPTIONS") return reply({});
    if (path === "/auth/v1/token") {
      const token =
        Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString(
          "base64url",
        ) +
        "." +
        Buffer.from(
          JSON.stringify({
            sub: id,
            aud: "authenticated",
            role: "authenticated",
            exp: Math.floor(Date.now() / 1000) + 3600,
          }),
        ).toString("base64url") +
        ".test-signature";
      return reply({
        access_token: token,
        token_type: "bearer",
        refresh_token: "test-refresh",
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        user,
      });
    }
    if (path === "/auth/v1/user") return reply(user);
    if (path === "/auth/v1/logout") return reply({});
    if (path.endsWith("/rpc/get_ai_usage"))
      return reply({
        tier: "free",
        is_premium: false,
        daily_limit: 5,
        used: 5 - credits,
        remaining: credits,
        resets_at: new Date(Date.now() + 86400000).toISOString(),
      });
    if (path.endsWith("/functions/v1/google-api"))
      return missingGoogle
        ? reply(
            { code: "NOT_FOUND", message: "Requested function was not found" },
            404,
          )
        : reply({ configured: false, connected: false });
    if (path.endsWith("/functions/v1/check-subscription"))
      return reply({ subscribed: false, subscription_tier: "free" });
    if (path.endsWith("/functions/v1/ical-proxy"))
      return reply({ error: "Feed host unavailable" }, 503);
    if (/\/functions\/v1\/gemini-chat/.test(path)) {
      credits--;
      return reply({
        response: "Décomposez votre projet en trois étapes concrètes.",
      });
    }
    if (path.endsWith("/tasks")) {
      if (request.method() === "POST") {
        const body = request.postDataJSON();
        tasks.push({
          ...body,
          id: crypto.randomUUID(),
          user_id: id,
          completed: false,
          created_at: new Date().toISOString(),
        });
        return reply(null, 201);
      }
      if (request.method() === "DELETE") {
        const target = url.searchParams.get("id")?.slice(3);
        const index = tasks.findIndex((task) => task.id === target);
        const removed = tasks.splice(index, 1)[0];
        return reply(removed);
      }
      if (request.method() === "PATCH") {
        const target = url.searchParams.get("id")?.slice(3);
        const task = tasks.find((item) => item.id === target);
        Object.assign(task || {}, request.postDataJSON());
        return reply(task);
      }
      return reply(tasks);
    }
    if (path.endsWith("/student_profiles") || path.endsWith("/user_profiles"))
      return reply(null);
    if (request.method() === "HEAD")
      return route.fulfill({
        status: 200,
        headers: { "content-range": "0-0/0" },
      });
    return reply([]);
  });
}
async function login(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Adresse e-mail").fill("camille@example.test");
  await page
    .getByLabel("Mot de passe", { exact: true })
    .fill("test-password-local");
  await page.getByRole("button", { name: "Se connecter", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(
    page.getByRole("heading", { name: "Bonjour Camille." }),
  ).toBeVisible();
}
test("public preview, navigation and responsive layout", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /Un esprit clair/ }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Explorer l’interface" }).click();
  await expect(
    page.getByText("Aperçu du design", { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Bonjour Camille." }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBeTruthy();
  await page.screenshot({
    path: `docs/preview-${info.project.name}.png`,
    fullPage: true,
  });
  await page.getByRole("button", { name: "Activer le thème sombre" }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.screenshot({
    path: `docs/preview-${info.project.name}-dark.png`,
    fullPage: true,
  });
  await page.getByRole("button", { name: "Activer le thème clair" }).click();
  if (info.project.name === "mobile") {
    await page.getByRole("button", { name: "Ouvrir le menu" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page
      .getByRole("dialog")
      .getByRole("link", { name: "Espace étudiant" })
      .click();
  } else {
    await expect(
      page.getByRole("link", { name: "Crédits IA", exact: true }),
    ).toBeInViewport({ ratio: 1 });
    await page
      .getByRole("link", { name: "Espace étudiant", exact: true })
      .click();
  }
  await expect(page).toHaveURL(/\/login$/);
  expect(errors).toEqual([]);
});
test("authenticated task CRUD, student, Google and credits error states", async ({
  page,
}) => {
  await backend(page, { missingGoogle: true });
  await login(page);
  const shortcuts = page.getByRole("navigation", {
    name: "Raccourcis",
    exact: true,
  });
  await expect(
    shortcuts.getByRole("link", { name: "Objectifs" }),
  ).toHaveAttribute("href", "/goals");
  await expect(
    shortcuts.getByRole("link", { name: "Habitudes" }),
  ).toHaveAttribute("href", "/habits");
  await expect(
    shortcuts.getByRole("link", { name: "Assistant IA" }),
  ).toHaveAttribute("href", "/ai-assistant");
  await page.getByRole("link", { name: "Nouvelle tâche", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Titre").fill("Préparer le TD de statistiques");
  await dialog.getByRole("button", { name: /Créer/ }).click();
  await expect(
    page.getByRole("heading", { name: "Préparer le TD de statistiques" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Supprimer", exact: true }).click();
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Supprimer", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Préparer le TD de statistiques" }),
  ).toHaveCount(0);
  await page.goto("/student");
  await expect(
    page.getByRole("heading", { name: "Votre semestre, au clair." }).first(),
  ).toBeVisible();
  const downloaded = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Exporter mes données", exact: true })
    .click();
  const file = await downloaded;
  const exported = JSON.parse(await readFile((await file.path())!, "utf8"));
  expect(exported.format).toBe("deepflow-student-workspace");
  expect(exported.modules).toEqual([]);
  expect(exported.revision_tasks).toEqual([]);
  await page.getByRole("tab", { name: "Connexions", exact: true }).click();
  await page
    .getByLabel("Lien privé iCalendar (facultatif)")
    .fill("https://edt.univ-lyon1.fr/export.ics?private=test");
  await page
    .getByRole("button", { name: "Actualiser l’aperçu depuis le lien" })
    .click();
  await expect(page.getByText(/Impossible de récupérer ce lien/)).toBeVisible();
  await page.goto("/calendar");
  await expect(
    page.getByRole("heading", { name: /calendrier/i }).first(),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Connexion Google indisponible" }),
  ).toBeVisible();
  await expect(
    page.getByText(
      "L’intégration Google n’est pas encore activée sur cette version de Deepflow.",
    ),
  ).toBeVisible();
  await page.goto("/connections");
  await expect(
    page.getByRole("heading", { name: /connexions/i }).first(),
  ).toBeVisible();
  await page.goto("/credits");
  await expect(page.getByRole("heading", { name: /5/ })).toBeVisible();
  await page.goto("/settings");
  await expect(
    page.getByRole("heading", { name: "Paramètres." }),
  ).toBeVisible();
});
test("explicit AI request spends one displayed credit, no automatic calls", async ({
  page,
}) => {
  let calls = 0;
  page.on("request", (request) => {
    if (request.url().includes("/functions/v1/gemini-")) calls++;
  });
  await backend(page);
  await login(page);
  await page.goto("/ai-assistant");
  await expect(
    page.getByRole("link", { name: "5 crédits disponibles" }),
  ).toBeVisible();
  expect(calls).toBe(0);
  await page
    .getByLabel("Votre message à l’assistant")
    .fill("Aide-moi à préparer mon projet");
  await page.getByRole("button", { name: "Envoyer le message" }).click();
  await expect(
    page.getByText("Décomposez votre projet en trois étapes concrètes."),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "4 crédits disponibles" }),
  ).toBeVisible();
  expect(calls).toBe(1);
});
