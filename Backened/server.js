const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

// In-memory store
const store = new Map();
const historyFile = path.join(__dirname, "history.json");

// Load existing history from file
let history = [];
if (fs.existsSync(historyFile)) {
  const data = fs.readFileSync(historyFile);
  history = JSON.parse(data);
}

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Save history to file
function saveHistory() {
  fs.writeFileSync(historyFile, JSON.stringify(history, null, 2));
}

/**
 * POST /api/shorten
 */
app.post("/api/shorten", (req, res) => {
  const { url, expiresInMinutes, preferredCode } = req.body || {};

  if (!url || typeof url !== "string") {
    return res.status(400).json({ error: "url is required" });
  }
  if (!expiresInMinutes || typeof expiresInMinutes !== "number") {
    return res.status(400).json({ error: "expiresInMinutes must be a number" });
  }

  let code = preferredCode?.trim();
  if (code) {
    if (store.has(code)) {
      return res.status(409).json({ error: "Preferred code already exists" });
    }
  } else {
    code = crypto.randomBytes(4).toString("hex");
  }

  const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

  store.set(code, { url, expiresAt });

  const shortUrl = `${req.protocol}://${req.get("host")}/${code}`;
  const entry = { shortUrl, expiresAt };

  // Save to history permanently
  history.unshift(entry);
  saveHistory();

  res.json(entry);
});

/**
 * GET /:code → redirect
 */
app.get("/:code", (req, res) => {
  const { code } = req.params;
  const entry = store.get(code);

  if (!entry) {
    return res.status(404).send("Short link not found");
  }
  if (new Date() > entry.expiresAt) {
    store.delete(code);
    return res.status(410).send("Link expired");
  }

  res.redirect(entry.url);
});

/**
 * GET /api/history → returns all history
 */
app.get("/api/history", (req, res) => {
  res.json(history);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`URL Shortener backend running on http://localhost:${PORT}`);
});
