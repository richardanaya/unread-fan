import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "../../leisure/node_modules/express/index.js";

process.env.OPEN_JEV_MODEL = process.env.OPEN_JEV_MODEL || "kev-4b";
process.on("unhandledRejection", (err) => {
  console.error("unhandled", err && err.message ? err.message : err);
});
process.on("uncaughtException", (err) => {
  console.error("uncaught", err && err.message ? err.message : err);
});
const { mapUtterance, openJevModel } = await import("../../leisure/server/jev.js");

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "200kb" }));
app.use(express.static(ROOT));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, model: openJevModel(), mapper: "open-jev" });
});

app.post("/api/map", async (req, res) => {
  const sentence = String(req.body?.sentence || "").trim();
  const actions = Array.isArray(req.body?.actions) ? req.body.actions : [];
  if (!sentence) {
    res.status(400).json({ error: "sentence required" });
    return;
  }
  if (actions.length === 0 || actions.length > 40) {
    res.status(400).json({ error: "actions must be 1–40 {id, match} entries" });
    return;
  }
  const clean = [];
  for (const action of actions) {
    const id = String(action?.id || "").trim();
    const match = String(action?.match || "").trim();
    if (!/^[a-z][a-z0-9_]{0,40}$/.test(id)) continue;
    if (!match) continue;
    clean.push({ id, match: match.slice(0, 400) });
  }
  if (!clean.length) {
    res.status(400).json({ error: "no valid action entries" });
    return;
  }
  try {
    const mapped = await mapUtterance({
      sentence: sentence.slice(0, 400),
      paragraph: String(req.body?.paragraph || "").slice(0, 2000),
      previous: String(req.body?.previous || "").slice(0, 400),
      actions: clean,
    });
    res.json(mapped);
  } catch (err) {
    res.status(err.status || 502).json({ error: err.message || "Jev failed" });
  }
});

const port = Number(process.env.PORT || 8765);
app.listen(port, () => {
  console.log(`Heian case on http://localhost:${port}`);
});
