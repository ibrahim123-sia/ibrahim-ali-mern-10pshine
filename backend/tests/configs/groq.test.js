import { expect } from "chai";
import sinon from "sinon";
import { chatCompletion, parseJsonContent } from "../../configs/groq.js";

describe("configs/groq", () => {
    let originalKey;
    before(() => {
        originalKey = process.env.GROQ_API;
    });
    after(() => {
        if (originalKey === undefined) delete process.env.GROQ_API;
        else process.env.GROQ_API = originalKey;
    });

    afterEach(() => sinon.restore());

    describe("chatCompletion", () => {
        it("throws 503 when GROQ_API is not set", async () => {
            delete process.env.GROQ_API;
            try {
                await chatCompletion({ user: "hi" });
                throw new Error("expected throw");
            } catch (err) {
                expect(err.status).to.equal(503);
                expect(err.message).to.match(/GROQ_API/);
            }
        });

        it("throws 502 when fetch itself fails (network)", async () => {
            process.env.GROQ_API = "k";
            sinon.stub(global, "fetch").rejects(new Error("ECONNREFUSED"));
            try {
                await chatCompletion({ user: "hi" });
                throw new Error("expected throw");
            } catch (err) {
                expect(err.status).to.equal(502);
                expect(err.message).to.match(/Failed to reach/);
            }
        });

        it("throws 503 when upstream returns 401", async () => {
            process.env.GROQ_API = "k";
            sinon.stub(global, "fetch").resolves({
                ok: false,
                status: 401,
                text: async () => "unauthorized",
            });
            try {
                await chatCompletion({ user: "hi" });
                throw new Error("expected throw");
            } catch (err) {
                expect(err.status).to.equal(503);
            }
        });

        it("throws 502 on other non-2xx statuses", async () => {
            process.env.GROQ_API = "k";
            sinon.stub(global, "fetch").resolves({
                ok: false,
                status: 500,
                text: async () => "boom",
            });
            try {
                await chatCompletion({ user: "hi" });
                throw new Error("expected throw");
            } catch (err) {
                expect(err.status).to.equal(502);
            }
        });

        it("returns the trimmed message content when successful", async () => {
            process.env.GROQ_API = "k";
            sinon.stub(global, "fetch").resolves({
                ok: true,
                status: 200,
                json: async () => ({
                    choices: [{ message: { content: "  hello world  " } }],
                }),
            });
            const out = await chatCompletion({ user: "hi" });
            expect(out).to.equal("hello world");
        });

        it("sends response_format json_object when json: true", async () => {
            process.env.GROQ_API = "k";
            const stub = sinon.stub(global, "fetch").resolves({
                ok: true,
                status: 200,
                json: async () => ({ choices: [{ message: { content: "{}" } }] }),
            });
            await chatCompletion({ user: "u", json: true });
            const body = JSON.parse(stub.firstCall.args[1].body);
            expect(body.response_format).to.deep.equal({ type: "json_object" });
        });
    });

    describe("parseJsonContent", () => {
        it("returns null on empty input", () => {
            expect(parseJsonContent("")).to.equal(null);
            expect(parseJsonContent(null)).to.equal(null);
        });

        it("parses straightforward JSON", () => {
            expect(parseJsonContent('{"a":1}')).to.deep.equal({ a: 1 });
        });

        it("strips ```json fences and parses the inner JSON", () => {
            const raw = '```json\n{"a":2}\n```';
            expect(parseJsonContent(raw)).to.deep.equal({ a: 2 });
        });

        it("returns null when neither plain nor fenced JSON parses", () => {
            expect(parseJsonContent("not json at all")).to.equal(null);
            expect(parseJsonContent("```{ broken json")).to.equal(null);
        });
    });
});
