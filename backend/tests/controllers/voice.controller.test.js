import { expect } from "chai";
import sinon from "sinon";
import request from "supertest";
import jwt from "jsonwebtoken";
import path from "path";
import fs from "fs";
import { buildApp } from "../helpers/app.js";
import { connectTestDB, disconnectTestDB, clearTestDB } from "../helpers/db.js";
import User from "../../models/User.js";

const tokenFor = (userId) => jwt.sign({ id: userId }, process.env.JWT_SECRET);

const GROQ_TRANSCRIBE_URL = "https://api.groq.com/openai/v1/audio/transcriptions";
const GROQ_CHAT_URL = "https://api.groq.com/openai/v1/chat/completions";

const fakeResponse = ({ ok = true, status = 200, body }) => ({
    ok,
    status,
    text: async () => (typeof body === "string" ? body : JSON.stringify(body)),
    json: async () => (typeof body === "object" ? body : { text: body }),
});

describe("Voice controller (HTTP)", () => {
    let app, alice, aliceToken, originalKey;
    const voiceDir = path.join(process.cwd(), "uploads", "voice");

    before(async () => {
        await connectTestDB();
        app = buildApp();
        originalKey = process.env.GROQ_API;
        process.env.GROQ_API = "test-key";
    });
    after(async () => {
        if (originalKey === undefined) delete process.env.GROQ_API;
        else process.env.GROQ_API = originalKey;
        await disconnectTestDB();
    });

    beforeEach(async () => {
        await clearTestDB();
        alice = await User.create({ name: "A", email: "v@x.com", password: "pw123456" });
        aliceToken = tokenFor(alice._id);
    });

    afterEach(() => {
        sinon.restore();
        // best-effort: remove any audio file the controller saved for this user
        try {
            const files = fs.readdirSync(voiceDir);
            for (const f of files) {
                if (f.startsWith(String(alice._id))) {
                    fs.unlinkSync(path.join(voiceDir, f));
                }
            }
        } catch {
            /* nothing to clean */
        }
    });

    it("rejects unauthenticated requests with 401", async () => {
        const res = await request(app).post("/api/voice/transcribe");
        expect(res.status).to.equal(401);
    });

    it("returns 400 when no audio file is uploaded", async () => {
        const res = await request(app)
            .post("/api/voice/transcribe")
            .set("Authorization", `Bearer ${aliceToken}`);
        // multer with no file still calls next() — controller returns 400
        expect(res.status).to.equal(400);
    });

    it("returns 422 when transcript is empty", async () => {
        sinon.stub(global, "fetch").callsFake(async (url) => {
            if (url === GROQ_TRANSCRIBE_URL) {
                return fakeResponse({ body: { text: "   " } });
            }
            return fakeResponse({ body: { choices: [{ message: { content: "x" } }] } });
        });
        const res = await request(app)
            .post("/api/voice/transcribe")
            .set("Authorization", `Bearer ${aliceToken}`)
            .field("mode", "raw")
            .attach("audio", Buffer.from("fake-audio"), {
                filename: "clip.webm",
                contentType: "audio/webm",
            });
        expect(res.status).to.equal(422);
    });

    it("returns raw transcript when mode=raw (no chatCompletion call)", async () => {
        let chatCalled = false;
        sinon.stub(global, "fetch").callsFake(async (url) => {
            if (url === GROQ_CHAT_URL) chatCalled = true;
            if (url === GROQ_TRANSCRIBE_URL) {
                return fakeResponse({ body: { text: "hello world" } });
            }
            return fakeResponse({ body: { choices: [{ message: { content: "" } }] } });
        });
        const res = await request(app)
            .post("/api/voice/transcribe")
            .set("Authorization", `Bearer ${aliceToken}`)
            .field("mode", "raw")
            .attach("audio", Buffer.from("fake-audio"), {
                filename: "clip.webm",
                contentType: "audio/webm",
            });
        expect(res.status).to.equal(200);
        expect(res.body).to.include({ transcript: "hello world", text: "hello world", mode: "raw" });
        expect(res.body.audioUrl).to.match(/^\/uploads\/voice\//);
        expect(chatCalled).to.equal(false);
    });

    it("cleans up the transcript when mode=cleanup", async () => {
        sinon.stub(global, "fetch").callsFake(async (url) => {
            if (url === GROQ_TRANSCRIBE_URL) {
                return fakeResponse({ body: { text: "raw  text" } });
            }
            return fakeResponse({
                body: { choices: [{ message: { content: "Cleaned text." } }] },
            });
        });
        const res = await request(app)
            .post("/api/voice/transcribe")
            .set("Authorization", `Bearer ${aliceToken}`)
            .field("mode", "cleanup")
            .attach("audio", Buffer.from("fake-audio"), {
                filename: "clip.webm",
                contentType: "audio/webm",
            });
        expect(res.status).to.equal(200);
        expect(res.body).to.include({ text: "Cleaned text.", mode: "cleanup" });
    });

    it("summarizes when mode=summary", async () => {
        sinon.stub(global, "fetch").callsFake(async (url) => {
            if (url === GROQ_TRANSCRIBE_URL) {
                return fakeResponse({ body: { text: "long ramble" } });
            }
            return fakeResponse({
                body: { choices: [{ message: { content: "- bullet" } }] },
            });
        });
        const res = await request(app)
            .post("/api/voice/transcribe")
            .set("Authorization", `Bearer ${aliceToken}`)
            .field("mode", "summary")
            .attach("audio", Buffer.from("fake-audio"), {
                filename: "clip.webm",
                contentType: "audio/webm",
            });
        expect(res.status).to.equal(200);
        expect(res.body).to.include({ mode: "summary", text: "- bullet" });
    });

    it("falls back to cleanup when mode is unknown", async () => {
        sinon.stub(global, "fetch").callsFake(async (url) => {
            if (url === GROQ_TRANSCRIBE_URL) {
                return fakeResponse({ body: { text: "hi" } });
            }
            return fakeResponse({
                body: { choices: [{ message: { content: "Hi." } }] },
            });
        });
        const res = await request(app)
            .post("/api/voice/transcribe")
            .set("Authorization", `Bearer ${aliceToken}`)
            .field("mode", "rainbow")
            .attach("audio", Buffer.from("fake-audio"), {
                filename: "clip.webm",
                contentType: "audio/webm",
            });
        expect(res.status).to.equal(200);
        expect(res.body.mode).to.equal("cleanup");
    });

    it("returns 503 when GROQ_API key is missing", async () => {
        const saved = process.env.GROQ_API;
        delete process.env.GROQ_API;
        try {
            const res = await request(app)
                .post("/api/voice/transcribe")
                .set("Authorization", `Bearer ${aliceToken}`)
                .attach("audio", Buffer.from("fake-audio"), {
                    filename: "clip.webm",
                    contentType: "audio/webm",
                });
            expect(res.status).to.equal(503);
        } finally {
            process.env.GROQ_API = saved;
        }
    });

    it("returns 503 when Groq rejects the credentials (401)", async () => {
        sinon.stub(global, "fetch").resolves(
            fakeResponse({ ok: false, status: 401, body: "unauthorized" })
        );
        const res = await request(app)
            .post("/api/voice/transcribe")
            .set("Authorization", `Bearer ${aliceToken}`)
            .attach("audio", Buffer.from("fake-audio"), {
                filename: "clip.webm",
                contentType: "audio/webm",
            });
        expect(res.status).to.equal(503);
    });

    it("rejects unsupported audio mimetypes with 400 (multer fileFilter)", async () => {
        const res = await request(app)
            .post("/api/voice/transcribe")
            .set("Authorization", `Bearer ${aliceToken}`)
            .attach("audio", Buffer.from("not-audio"), {
                filename: "clip.txt",
                contentType: "text/plain",
            });
        expect(res.status).to.equal(400);
        expect(res.body).to.have.property("message", "Unsupported audio format");
    });
});
