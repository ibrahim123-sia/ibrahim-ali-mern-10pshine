import { chatCompletion, parseJsonContent } from "../configs/groq.js";
import logger from "../configs/logger.js";

const MAX_CONTENT_CHARS = 8000;
const stripHtml = (s = "") =>
    String(s).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

const truncate = (s, n = MAX_CONTENT_CHARS) =>
    s.length > n ? s.slice(0, n) + " […truncated]" : s;

const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, Number(n) || lo));

// Single endpoint with a `what` discriminator keeps the surface small
// and lets the frontend call several suggestions in parallel.
export const suggest = async (req, res) => {
    try {
        const { what, content = "", title = "", categories = [] } = req.body;
        if (!["title", "summary", "category", "tags"].includes(what)) {
            return res.status(400).json({ message: "Unknown suggestion type" });
        }
        const text = truncate(stripHtml(content));
        if (!text && what !== "category") {
            return res.status(400).json({ message: "Content is required to suggest" });
        }

        let result;
        if (what === "title") {
            const raw = await chatCompletion({
                system:
                    "You write very short note titles. Respond with ONLY the title — no quotes, no punctuation at the end, max 8 words.",
                user: `Suggest a title for this note:\n\n${text}`,
                temperature: 0.4,
                maxTokens: 40,
            });
            result = { title: raw.replace(/^["'`]+|["'`]+$/g, "").slice(0, 80) };
        } else if (what === "summary") {
            const raw = await chatCompletion({
                system:
                    "You write concise note summaries. Respond with ONLY the summary, plain text, max 2 sentences, max 200 characters.",
                user: `Summarize this note:\n\n${text}`,
                temperature: 0.3,
                maxTokens: 120,
            });
            result = { summary: raw.slice(0, 240) };
        } else if (what === "tags") {
            const raw = await chatCompletion({
                system:
                    'You generate tags for personal notes. Respond with ONLY a JSON object of the form {"tags": ["tag1","tag2","tag3"]}. Tags must be lowercase, no spaces (use hyphens), 1-3 words. Return 3 to 6 tags.',
                user: `Note title: "${title}"\n\nNote content:\n${text}`,
                temperature: 0.4,
                maxTokens: 200,
                json: true,
            });
            const parsed = parseJsonContent(raw);
            const tags = Array.isArray(parsed?.tags)
                ? parsed.tags
                    .filter((t) => typeof t === "string")
                    .map((t) =>
                        t
                            .trim()
                            .toLowerCase()
                            .replace(/^#+/, "")
                            .replace(/\s+/g, "-")
                            .slice(0, 40)
                    )
                    .filter((t) => t.length > 0)
                : [];
            result = { tags: Array.from(new Set(tags)).slice(0, 6) };
        } else if (what === "category") {
            const list = Array.isArray(categories)
                ? categories
                    .filter((c) => c && typeof c.name === "string")
                    .map((c) => ({ id: String(c._id || c.id || ""), name: c.name }))
                    .slice(0, 30)
                : [];
            const listText =
                list.length > 0
                    ? list.map((c) => `- ${c.name}`).join("\n")
                    : "(no existing categories)";
            const raw = await chatCompletion({
                system:
                    'You assign one category to a personal note. Respond with ONLY a JSON object of the form {"match": "<exact existing category name>"} when the note clearly fits one of the existing categories listed by the user. Otherwise respond with {"suggest": "<a single short title-cased category name like Study, Work, Ideas>"}. Never return both keys.',
                user: `Existing categories:\n${listText}\n\nNote title: "${title}"\n\nNote content:\n${text || "(empty)"}`,
                temperature: 0.2,
                maxTokens: 80,
                json: true,
            });
            const parsed = parseJsonContent(raw) || {};
            const match = typeof parsed.match === "string" ? parsed.match.trim() : "";
            const suggest = typeof parsed.suggest === "string" ? parsed.suggest.trim() : "";
            if (match) {
                const found = list.find(
                    (c) => c.name.toLowerCase() === match.toLowerCase()
                );
                result = found
                    ? { matchId: found.id, matchName: found.name }
                    : { suggestName: match.slice(0, 40) };
            } else if (suggest) {
                result = { suggestName: suggest.slice(0, 40) };
            } else {
                result = { suggestName: "" };
            }
        }

        return res.json(result);
    } catch (error) {
        logger.error(
            { err: error, what: req.body?.what, userId: req.user?._id?.toString() },
            "ai suggest failed"
        );
        return res
            .status(error.status || 500)
            .json({ message: error.message || "AI suggestion failed" });
    }
};

// ---------------- FLASHCARDS ----------------
export const generateFlashcards = async (req, res) => {
    try {
        const { content = "", title = "" } = req.body;
        const count = clamp(req.body.count, 4, 16);
        const text = truncate(stripHtml(content));
        if (!text) {
            return res.status(400).json({ message: "Content is required" });
        }

        const raw = await chatCompletion({
            system:
                "You generate study flashcards from a single note. Respond with ONLY a JSON object of the form " +
                '{"cards": [{"front": "question or term", "back": "concise answer"}]}. ' +
                "Rules:\n" +
                "- front: a single question, term, or concept (max 120 chars)\n" +
                "- back: the answer or definition (max 280 chars)\n" +
                "- Cover distinct ideas; do not duplicate.\n" +
                "- Use plain text only (no markdown, no html).",
            user: `Generate exactly ${count} flashcards from this note.\n\nTitle: "${title}"\n\nContent:\n${text}`,
            temperature: 0.4,
            maxTokens: 1500,
            json: true,
        });
        const parsed = parseJsonContent(raw);
        const cards = Array.isArray(parsed?.cards)
            ? parsed.cards
                .filter((c) => c && typeof c.front === "string" && typeof c.back === "string")
                .map((c) => ({
                    front: c.front.trim().slice(0, 200),
                    back: c.back.trim().slice(0, 400),
                }))
                .filter((c) => c.front.length > 0 && c.back.length > 0)
                .slice(0, count)
            : [];
        if (cards.length === 0) {
            return res.status(422).json({
                message: "The model didn't return usable flashcards. Try again or expand the note.",
            });
        }
        return res.json({ cards });
    } catch (error) {
        logger.error(
            { err: error, userId: req.user?._id?.toString() },
            "ai flashcards failed"
        );
        return res
            .status(error.status || 500)
            .json({ message: error.message || "Flashcard generation failed" });
    }
};

// ---------------- QUIZ ----------------
export const generateQuiz = async (req, res) => {
    try {
        const { content = "", title = "" } = req.body;
        const count = clamp(req.body.count, 3, 12);
        const text = truncate(stripHtml(content));
        if (!text) {
            return res.status(400).json({ message: "Content is required" });
        }

        const raw = await chatCompletion({
            system:
                "You generate multiple-choice study quizzes from a single note. Respond with ONLY a JSON object of the form " +
                '{"questions": [{"question": "...", "options": ["a","b","c","d"], "correctIndex": 0, "explanation": "..."}]}. ' +
                "Rules:\n" +
                "- Exactly 4 options per question\n" +
                "- correctIndex is the 0-based index into options\n" +
                "- Options must be distinct\n" +
                "- explanation (max 200 chars) briefly justifies the correct answer\n" +
                "- Use only information from the note; do not invent facts\n" +
                "- Plain text only (no markdown, no html)",
            user: `Write exactly ${count} multiple-choice questions from this note.\n\nTitle: "${title}"\n\nContent:\n${text}`,
            temperature: 0.4,
            maxTokens: 2200,
            json: true,
        });
        const parsed = parseJsonContent(raw);
        const questions = Array.isArray(parsed?.questions)
            ? parsed.questions
                .filter(
                    (q) =>
                        q &&
                        typeof q.question === "string" &&
                        Array.isArray(q.options) &&
                        q.options.length === 4 &&
                        q.options.every((o) => typeof o === "string") &&
                        Number.isInteger(q.correctIndex) &&
                        q.correctIndex >= 0 &&
                        q.correctIndex < 4
                )
                .map((q) => ({
                    question: q.question.trim().slice(0, 300),
                    options: q.options.map((o) => o.trim().slice(0, 200)),
                    correctIndex: q.correctIndex,
                    explanation:
                        typeof q.explanation === "string"
                            ? q.explanation.trim().slice(0, 300)
                            : "",
                }))
                .filter((q) => q.question.length > 0 && new Set(q.options).size === 4)
                .slice(0, count)
            : [];
        if (questions.length === 0) {
            return res.status(422).json({
                message: "The model didn't return usable quiz questions. Try again or expand the note.",
            });
        }
        return res.json({ questions });
    } catch (error) {
        logger.error(
            { err: error, userId: req.user?._id?.toString() },
            "ai quiz failed"
        );
        return res
            .status(error.status || 500)
            .json({ message: error.message || "Quiz generation failed" });
    }
};
