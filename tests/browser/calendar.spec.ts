import { test, expect, type Page } from "@playwright/test";

const user = {
  id: "11111111-1111-4111-8111-111111111111",
  aud: "authenticated",
  role: "authenticated",
  email: "camille@example.test",
  email_confirmed_at: new Date().toISOString(),
  app_metadata: { provider: "email" },
  user_metadata: { display_name: "Camille" },
  created_at: new Date().toISOString(),
};

async function googleBackend(page: Page) {
  const events = new Map<string, Record<string, unknown>>();
  const legacyRequests: string[] = [];
  const creationKeys: string[] = [];
  let firstCreate = true;
  await page.route("http://127.0.0.1:54321/**", async (route) => {
    const request = route.request(),
      url = new URL(request.url()),
      path = url.pathname;
    const reply = (value: unknown, status = 200) =>
      route.fulfill({
        status,
        contentType: "application/json",
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify(value),
      });
    if (request.method() === "OPTIONS") return reply({});
    if (
      /google_(calendar|tasks)_tokens|google-(calendar|tasks)-(api|oauth)/.test(
        path,
      )
    )
      legacyRequests.push(path);
    if (path === "/auth/v1/token") {
      const token = `${Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url")}.${Buffer.from(JSON.stringify({ sub: user.id, aud: "authenticated", role: "authenticated", exp: Math.floor(Date.now() / 1000) + 3600 })).toString("base64url")}.test-signature`;
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
    if (path.endsWith("/user_roles") || path.endsWith("/user_profiles"))
      return reply(null);
    if (path.endsWith("/functions/v1/google-api")) {
      const input = request.postDataJSON();
      if (input.action === "status")
        return reply({
          configured: true,
          connected: true,
          accountEmail: "camille@google.example",
          canEditCalendar: true,
        });
      if (input.action === "resources")
        return reply({
          calendars: [
            {
              id: "calendar-one",
              summary: "Mon agenda",
              primary: true,
              writable: true,
            },
          ],
          tasklists: [{ id: "list-one", title: "Mes tâches" }],
        });
      if (input.action === "events") {
        expect(input.calendarId).toBe("calendar-one");
        expect(Date.parse(input.timeMax)).toBeGreaterThan(
          Date.parse(input.timeMin),
        );
        return reply({ events: [...events.values()] });
      }
      if (input.action === "event_create") {
        expect(input.calendarId).toBe("calendar-one");
        expect(input.requestId).toMatch(/^[a-f0-9]{32}$/);
        creationKeys.push(input.requestId);
        const id = `df${input.requestId}`;
        const event = {
          ...input.event,
          id,
          etag: '"created"',
          editable: true,
          recurring: false,
          htmlLink: null,
        };
        if (!events.has(id)) events.set(id, event);
        if (firstCreate) {
          firstCreate = false;
          return reply(
            {
              code: "provider_error",
              error:
                "Réponse interrompue. Réessayez sans fermer ce formulaire.",
            },
            502,
          );
        }
        return reply({ event: events.get(id) });
      }
      if (input.action === "event_update") {
        expect(events.has(input.eventId)).toBeTruthy();
        expect(input.etag).toBe('"created"');
        const event = {
          ...events.get(input.eventId),
          ...input.event,
          etag: '"updated"',
        };
        events.set(input.eventId, event);
        return reply({ event });
      }
      if (input.action === "event_delete") {
        expect(input.etag).toBe('"updated"');
        events.delete(input.eventId);
        return reply({ deleted: true });
      }
      return reply({ error: "Unexpected Google action" }, 400);
    }
    if (request.method() === "HEAD")
      return route.fulfill({
        status: 200,
        headers: { "content-range": "0-0/0" },
      });
    return reply([]);
  });
  return { events, legacyRequests, creationKeys };
}

test("connected Calendar retries a creation without duplicates, then edits and confirms deletion", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const state = await googleBackend(page);
  await page.goto("/login");
  await page.getByLabel("Adresse e-mail").fill("camille@example.test");
  await page
    .getByLabel("Mot de passe", { exact: true })
    .fill("test-password-local");
  await page.getByRole("button", { name: "Se connecter", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.goto("/calendar");
  await expect(
    page.getByRole("heading", { name: "Calendrier", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Événement", exact: true }).click();
  const editor = page.getByRole("dialog");
  await expect(
    editor.getByRole("heading", { name: "Nouvel événement" }),
  ).toBeVisible();
  await editor
    .getByLabel("Titre", { exact: true })
    .fill("Révisions en bibliothèque");
  await editor.getByLabel("Toute la journée").check();
  await editor.getByLabel("Lieu (facultatif)").fill("BU Sciences");
  await editor.getByRole("button", { name: "Enregistrer dans Google" }).click();
  await expect(editor.getByRole("alert")).toContainText("Réponse interrompue");
  await expect(editor.getByLabel("Titre", { exact: true })).toHaveValue(
    "Révisions en bibliothèque",
  );
  await editor.getByRole("button", { name: "Enregistrer dans Google" }).click();
  await expect(editor).not.toBeVisible();
  expect(state.creationKeys).toHaveLength(2);
  expect(state.creationKeys[0]).toBe(state.creationKeys[1]);
  expect(state.events.size).toBe(1);
  const item = page
    .getByRole("listitem")
    .filter({ hasText: "Révisions en bibliothèque" });
  await expect(item).toBeVisible();
  await item.getByRole("button", { name: "Modifier", exact: true }).click();
  await editor.getByLabel("Titre", { exact: true }).fill("Révisions terminées");
  await editor.getByRole("button", { name: "Enregistrer dans Google" }).click();
  await expect(editor).not.toBeVisible();
  const updated = page
    .getByRole("listitem")
    .filter({ hasText: "Révisions terminées" });
  await expect(updated).toBeVisible();
  await page.screenshot({
    path: `docs/calendar-${info.project.name}.png`,
    fullPage: true,
  });
  await updated.getByRole("button", { name: "Supprimer", exact: true }).click();
  const confirm = page.getByRole("alertdialog");
  await expect(confirm).toContainText("Révisions terminées");
  await confirm
    .getByRole("button", { name: "Supprimer de Google", exact: true })
    .click();
  await expect(confirm).not.toBeVisible();
  await expect(
    page.getByText("Aucun rendez-vous Google cette semaine."),
  ).toBeVisible();
  expect(state.events.size).toBe(0);
  expect(state.legacyRequests).toEqual([]);
  expect(errors).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBeTruthy();
});
