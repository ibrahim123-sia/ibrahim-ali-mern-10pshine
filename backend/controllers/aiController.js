import { chatCompletion, parseJsonContent } from "../configs/groq.js";
import logger from "../configs/logger.js";

const MAX_CONTENT_CHARS = 8000;
const stripHtml = (s = "") =>
    String(s).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

const truncate = (s, n = MAX_CONTENT_CHARS) =>
    s.length > n ? s.slice(0, n) + " […truncated]" : s;

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
