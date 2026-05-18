import logger from "./logger.js";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_MODEL = "llama-3.1-8b-instant";

export const chatCompletion = async ({
    system,
    user,
    model = DEFAULT_MODEL,
    temperature = 0.3,
    maxTokens = 256,
    json = false,
}) => {
    const apiKey = process.env.GROQ_API;
    if (!apiKey) {
        const err = new Error("GROQ_API key is not configured on the server");
        err.status = 503;
        throw err;
    }

    const body = {
        model,
        temperature,
        max_tokens: maxTokens,
        messages: [
            ...(system ? [{ role: "system", content: system }] : []),
            { role: "user", content: user },
        ],
    };
    if (json) body.response_format = { type: "json_object" };

    let res;
    try {
        res = await fetch(GROQ_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify(body),
        });
    } catch (networkErr) {
        logger.error({ err: networkErr }, "groq request failed (network)");
        const err = new Error("Failed to reach the AI service");
        err.status = 502;
        throw err;
    }

    if (!res.ok) {
        const text = await res.text().catch(() => "");
        logger.error({ status: res.status, body: text }, "groq request failed");
        const err = new Error(
            res.status === 401
                ? "AI service rejected the credentials"
                : `AI service error (${res.status})`
        );
        err.status = res.status === 401 ? 503 : 502;
        throw err;
    }

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content?.trim() || "";
    return content;
};

export const parseJsonContent = (raw) => {
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch {
        // Some models wrap JSON in ```json fences — strip and retry
        const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (fenced) {
            try {
                return JSON.parse(fenced[1]);
            } catch {
                return null;
            }
        }
        return null;
    }
};
