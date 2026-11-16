const express = require("express");
const cors = require("cors");
const path = require("path");
const { PrismaClient } = require("@prisma/client");
require("dotenv").config();

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json({ limit: "1mb" }));

function getEntryId(value) {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function getEntryInput(body) {
  if (
    !body ||
    typeof body !== "object" ||
    typeof body.title !== "string" ||
    typeof body.body !== "string"
  ) {
    return { error: "Title and entry text are required." };
  }

  const title = body.title.trim();
  const entryBody = body.body.trim();
  if (!title || !entryBody) {
    return { error: "Title and entry text cannot be empty." };
  }
  if (title.length > 200) {
    return { error: "Title must be 200 characters or fewer." };
  }

  return { data: { title, body: entryBody } };
}

function logDatabaseError(action, error) {
  console.error(`Failed to ${action}:`, error);
}

app.get("/api/entries", async (req, res) => {
  try {
    const entries = await prisma.entry.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json(entries);
  } catch (error) {
    logDatabaseError("fetch entries", error);
    res.status(500).json({
      error: "Failed to fetch entries. Check the database connection.",
    });
  }
});

app.get("/api/entries/:id", async (req, res) => {
  const id = getEntryId(req.params.id);
  if (id === null) return res.status(400).json({ error: "Invalid entry id." });

  try {
    const entry = await prisma.entry.findUnique({ where: { id } });
    if (!entry) return res.status(404).json({ error: "Entry not found." });
    res.json(entry);
  } catch (error) {
    logDatabaseError("fetch entry", error);
    res.status(500).json({ error: "Failed to fetch entry." });
  }
});

app.post("/api/entries", async (req, res) => {
  const input = getEntryInput(req.body);
  if (input.error) return res.status(400).json({ error: input.error });

  try {
    const entry = await prisma.entry.create({ data: input.data });
    res.status(201).json(entry);
  } catch (error) {
    logDatabaseError("create entry", error);
    res.status(500).json({ error: "Failed to create entry." });
  }
});

app.put("/api/entries/:id", async (req, res) => {
  const id = getEntryId(req.params.id);
  if (id === null) return res.status(400).json({ error: "Invalid entry id." });

  const input = getEntryInput(req.body);
  if (input.error) return res.status(400).json({ error: input.error });

  try {
    const entry = await prisma.entry.update({
      where: { id },
      data: input.data,
    });
    res.json(entry);
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Entry not found." });
    }
    logDatabaseError("update entry", error);
    res.status(500).json({ error: "Failed to update entry." });
  }
});

app.delete("/api/entries/:id", async (req, res) => {
  const id = getEntryId(req.params.id);
  if (id === null) return res.status(400).json({ error: "Invalid entry id." });

  try {
    await prisma.entry.delete({ where: { id } });
    res.json({ message: "Entry deleted." });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Entry not found." });
    }
    logDatabaseError("delete entry", error);
    res.status(500).json({ error: "Failed to delete entry." });
  }
});

// app.use("/api", (req, res) => {
//   res.status(404).json({ error: "API endpoint not found." });
// });

// app.use(express.static(path.join(__dirname, "client/dist")));

app.get("/", (req, res) => {
  res.json({ message: "Personal Journal API is running" });
});

app.use((error, req, res, next) => {
  console.error("Request failed:", error);
  const status =
    Number.isInteger(error.status) && error.status >= 400 && error.status < 500
      ? error.status
      : 500;
  res.status(status).json({
    error: status === 400 ? "Invalid JSON request." : "Internal server error.",
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
