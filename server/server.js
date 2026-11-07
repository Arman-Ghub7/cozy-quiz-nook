import express from "express";
import multer from "multer";
import dotenv from "dotenv";
import mammoth from "mammoth";
import pdfParse from "pdf-parse";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { GoogleGenAI } from "@google/genai";
dotenv.config();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express(),
  upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 1500000 },
  });
app.use(express.json({ limit: "2mb" }));
app.use(express.static(path.join(__dirname, "../public")));
const MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
app.get("/api/health", (_q, r) =>
  r.json({ ok: true, configured: !!process.env.GEMINI_API_KEY, model: MODEL }),
);
app.post("/api/extract", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "Choose a file." });
    let n = req.file.originalname.toLowerCase(),
      text = "";
    if (n.endsWith(".txt") || n.endsWith(".md"))
      text = req.file.buffer.toString("utf8");
    else if (n.endsWith(".pdf")) text = (await pdfParse(req.file.buffer)).text;
    else if (n.endsWith(".docx"))
      text = (await mammoth.extractRawText({ buffer: req.file.buffer })).value;
    else return res.status(400).json({ error: "Use TXT, MD, PDF or DOCX." });
    text = text.replace(/\\s+/g, " ").trim();
    if (!text)
      return res
        .status(400)
        .json({ error: "No readable text found. Scanned PDFs need OCR." });
    res.json({ text: text.slice(0, 22000) });
  } catch (e) {
    res.status(500).json({ error: "Could not extract text from this file." });
  }
});
app.post("/api/quiz", async (req, res) => {
  try {
    const key = process.env.GEMINI_API_KEY;
    if (!key)
      return res
        .status(503)
        .json({
          error:
            "Add GEMINI_API_KEY to your .env file, then restart the server.",
        });
    const topic = String(req.body.topic || "General Knowledge").slice(0, 160),
      count = Math.min(50, Math.max(1, parseInt(req.body.count) || 10)),
      difficulty = ["Easy", "Medium", "Hard", "Balanced"].includes(
        req.body.difficulty,
      )
        ? req.body.difficulty
        : "Balanced",
      source = String(req.body.sourceText || "").slice(0, 22000);
    const prompt = `Create exactly ${count} original multiple-choice quiz questions about "${topic}". Difficulty: ${difficulty}. ${source ? `Use this supplied study text as the primary source and do not add unsupported details:\\n${source}` : "Use established, verifiable knowledge and cover a variety of subtopics."} Each question must have four plausible distinct options and exactly one correct answer. Provide an answer-neutral hint and a concise explanation. Avoid duplicate facts. Return ONLY JSON in this exact shape: {"questions":[{"question":"...","options":["...","...","...","..."],"answerIndex":0,"hint":"...","explanation":"..."}]}. No markdown fences.`;
    const ai = new GoogleGenAI({
  apiKey: key,
});

const interaction = await ai.interactions.create({
  model: MODEL,
  input: prompt,
  generation_config: {
    temperature: 0.7,
  },
});

const raw = interaction.output_text || "";
const parsed = JSON.parse(raw);
const qs = parsed.questions;
    for (const [i, q] of qs.entries()) {
      if (
        typeof q.question !== "string" ||
        !Array.isArray(q.options) ||
        q.options.length !== 4 ||
        !Number.isInteger(q.answerIndex) ||
        q.answerIndex < 0 ||
        q.answerIndex > 3
      )
        throw Error(`Question ${i + 1} had an invalid format. Try again.`);
    }
    res.json({
      questions: qs.map((q) => ({
        question: q.question,
        options: q.options.map(String),
        answerIndex: q.answerIndex,
        hint: String(
          q.hint ||
            "Think about the central concept and eliminate choices that do not fit.",
        ),
        explanation: String(q.explanation || "Review the topic and try again."),
      })),
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message || "Question generation failed." });
  }
});
const port = Number(process.env.PORT || 3000);

app.get("/api/models", async (req, res) => {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(process.env.GEMINI_API_KEY)}`
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    res.json({
      models: (data.models || [])
        .filter(m => m.supportedGenerationMethods?.includes("generateContent"))
        .map(m => ({
          name: m.name,
          methods: m.supportedGenerationMethods
        }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, "0.0.0.0", () =>
  console.log(`Cozy Quiz Nook running on port ${port}`),
);
