import { expect } from "chai";
import sinon from "sinon";
import request from "supertest";
import jwt from "jsonwebtoken";
import { buildApp } from "../helpers/app.js";
import { connectTestDB, disconnectTestDB, clearTestDB } from "../helpers/db.js";
import User from "../../models/User.js";

const tokenFor = (userId) => jwt.sign({ id: userId }, process.env.JWT_SECRET);

// Build a Response-like object for fetch stubs. Pass content for chat-completion
// shaped replies. If `ok` is false, errors are surfaced like Groq returns them.
const mockGroqResponse = ({ ok = true, status = 200, content = "" } = {}) => ({
    ok,
    status,
    text: async () => "stub error body",
    json: async () => ({
        choices: [{ message: { content } }],
    }),
});

describe("AI controller (HTTP)", () => {
    let app, alice, aliceToken, originalKey;

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
        alice = await User.create({ name: "A", email: "a@x.com", password: "pw123456" });
        aliceToken = tokenFor(alice._id);
    });

    afterEach(() => sinon.restore());

    describe("protection", () => {
        const endpoints = [
            "/api/ai/suggest",
            "/api/ai/flashcards",
            "/api/ai/quiz",
        ];
        endpoints.forEach((path) => {
            it(`POST ${path} rejects unauthenticated requests with 401`, async () => {
                const res = await request(app).post(path);
                expect(res.status).to.equal(401);
            });
        });
    });

    describe("POST /api/ai/suggest", () => {
        it("returns 400 for an unknown 'what' type", async () => {
            const res = await request(app)
                .post("/api/ai/suggest")
                .set("Authorization", `Bearer ${aliceToken}`)
                .send({ what: "rainbow", content: "hi" });
            expect(res.status).to.equal(400);
            expect(res.body).to.have.property("message", "Unknown suggestion type");
        });

        it("returns 400 when content is missing for non-category types", async () => {
            const res = await request(app)
                .post("/api/ai/suggest")
                .set("Authorization", `Bearer ${aliceToken}`)
                .send({ what: "title" });
            expect(res.status).to.equal(400);
        });

        it("suggests a title — strips quotes and HTML from input", async () => {
            sinon.stub(global, "fetch").resolves(
                mockGroqResponse({ content: '"My great title"' })
            );
            const res = await request(app)
                .post("/api/ai/suggest")
                .set("Authorization", `Bearer ${aliceToken}`)
                .send({ what: "title", content: "<p>hello <b>world</b></p>" });
            expect(res.status).to.equal(200);
            expect(res.body).to.have.property("title", "My great title");
        });

        it("suggests a summary trimmed to 240 chars", async () => {
            const big = "x".repeat(500);
            sinon.stub(global, "fetch").resolves(mockGroqResponse({ content: big }));
            const res = await request(app)
                .post("/api/ai/suggest")
                .set("Authorization", `Bearer ${aliceToken}`)
                .send({ what: "summary", content: "hello" });
            expect(res.status).to.equal(200);
            expect(res.body.summary.length).to.be.at.most(240);
        });

        it("suggests tags (lowercase, hyphenated, deduped, max 6)", async () => {
            sinon.stub(global, "fetch").resolves(
                mockGroqResponse({
                    content: JSON.stringify({
                        tags: ["React", "react", "Node JS", "#tag-three", "FOUR", "five", "six", "seven"],
                    }),
                })
            );
            const res = await request(app)
                .post("/api/ai/suggest")
                .set("Authorization", `Bearer ${aliceToken}`)
                .send({ what: "tags", content: "hello", title: "t" });
            expect(res.status).to.equal(200);
            expect(res.body.tags).to.have.lengthOf(6);
            expect(res.body.tags).to.include("react");
            expect(res.body.tags).to.include("node-js");
            expect(res.body.tags).to.include("tag-three");
            // all unique and lowercase
            res.body.tags.forEach((t) => expect(t).to.equal(t.toLowerCase()));
        });

        it("matches an existing category when model returns one", async () => {
            sinon.stub(global, "fetch").resolves(
                mockGroqResponse({ content: JSON.stringify({ match: "study" }) })
            );
            const res = await request(app)
                .post("/api/ai/suggest")
                .set("Authorization", `Bearer ${aliceToken}`)
                .send({
                    what: "category",
                    content: "x",
                    title: "t",
                    categories: [{ _id: "abc", name: "Study" }, { _id: "def", name: "Work" }],
                });
            expect(res.status).to.equal(200);
            expect(res.body).to.deep.equal({ matchId: "abc", matchName: "Study" });
        });

        it("suggests a new category when the model returns 'suggest'", async () => {
            sinon.stub(global, "fetch").resolves(
                mockGroqResponse({ content: JSON.stringify({ suggest: "Hobbies" }) })
            );
            const res = await request(app)
                .post("/api/ai/suggest")
                .set("Authorization", `Bearer ${aliceToken}`)
                .send({ what: "category", content: "x", categories: [] });
            expect(res.status).to.equal(200);
            expect(res.body).to.have.property("suggestName", "Hobbies");
        });

        it("returns 503 when GROQ_API key is missing", async () => {
            const saved = process.env.GROQ_API;
            delete process.env.GROQ_API;
            try {
                const res = await request(app)
                    .post("/api/ai/suggest")
                    .set("Authorization", `Bearer ${aliceToken}`)
                    .send({ what: "title", content: "hi" });
                expect(res.status).to.equal(503);
            } finally {
                process.env.GROQ_API = saved;
            }
        });

        it("propagates upstream error status (502)", async () => {
            sinon.stub(global, "fetch").resolves(
                mockGroqResponse({ ok: false, status: 500 })
            );
            const res = await request(app)
                .post("/api/ai/suggest")
                .set("Authorization", `Bearer ${aliceToken}`)
                .send({ what: "title", content: "hi" });
            expect(res.status).to.equal(502);
        });
    });

    describe("POST /api/ai/flashcards", () => {
        it("returns 400 when content is missing", async () => {
            const res = await request(app)
                .post("/api/ai/flashcards")
                .set("Authorization", `Bearer ${aliceToken}`)
                .send({});
            expect(res.status).to.equal(400);
        });

        it("returns valid flashcards (clamped count, trimmed)", async () => {
            sinon.stub(global, "fetch").resolves(
                mockGroqResponse({
                    content: JSON.stringify({
                        cards: [
                            { front: "Q1", back: "A1" },
                            { front: "Q2", back: "A2" },
                            { front: "  Q3  ", back: "A3" },
                            { front: 42, back: "bad" }, // filtered out
                            { front: "Q5", back: "" }, // filtered out (empty)
                        ],
                    }),
                })
            );
            const res = await request(app)
                .post("/api/ai/flashcards")
                .set("Authorization", `Bearer ${aliceToken}`)
                .send({ content: "topic", count: 100 }); // clamped to 16

            expect(res.status).to.equal(200);
            expect(res.body.cards).to.be.an("array");
            expect(res.body.cards.length).to.equal(3);
            expect(res.body.cards[2]).to.deep.equal({ front: "Q3", back: "A3" });
        });

        it("returns 422 when the model returns no usable cards", async () => {
            sinon.stub(global, "fetch").resolves(
                mockGroqResponse({ content: JSON.stringify({ cards: [] }) })
            );
            const res = await request(app)
                .post("/api/ai/flashcards")
                .set("Authorization", `Bearer ${aliceToken}`)
                .send({ content: "topic" });
            expect(res.status).to.equal(422);
        });
    });

    describe("POST /api/ai/quiz", () => {
        it("returns 400 when content is missing", async () => {
            const res = await request(app)
                .post("/api/ai/quiz")
                .set("Authorization", `Bearer ${aliceToken}`)
                .send({});
            expect(res.status).to.equal(400);
        });

        it("returns valid quiz questions and drops malformed ones", async () => {
            sinon.stub(global, "fetch").resolves(
                mockGroqResponse({
                    content: JSON.stringify({
                        questions: [
                            {
                                question: "What is 2+2?",
                                options: ["1", "2", "3", "4"],
                                correctIndex: 3,
                                explanation: "math",
                            },
                            { question: "bad", options: ["a", "b"], correctIndex: 0 }, // <4 options
                            {
                                question: "duplicate-options",
                                options: ["a", "a", "b", "b"], // not distinct
                                correctIndex: 0,
                            },
                        ],
                    }),
                })
            );
            const res = await request(app)
                .post("/api/ai/quiz")
                .set("Authorization", `Bearer ${aliceToken}`)
                .send({ content: "x", count: 0 }); // count clamped up to 3
            expect(res.status).to.equal(200);
            expect(res.body.questions).to.have.lengthOf(1);
            expect(res.body.questions[0].correctIndex).to.equal(3);
        });

        it("returns 422 when the model returns nothing usable", async () => {
            sinon.stub(global, "fetch").resolves(
                mockGroqResponse({ content: JSON.stringify({ questions: [] }) })
            );
            const res = await request(app)
                .post("/api/ai/quiz")
                .set("Authorization", `Bearer ${aliceToken}`)
                .send({ content: "x" });
            expect(res.status).to.equal(422);
        });
    });
});
