import { expect } from "chai";
import sinon from "sinon";
import request from "supertest";
import jwt from "jsonwebtoken";
import path from "path";
import fs from "fs";
import { buildApp } from "../helpers/app.js";
import { connectTestDB, disconnectTestDB, clearTestDB } from "../helpers/db.js";
import User from "../../models/User.js";

const tokenFor = (id) => jwt.sign({ id }, process.env.JWT_SECRET);

const GROQ_TRANSCRIBE_URL = "https://api.groq.com/openai/v1/audio/transcriptions";
const fakeTranscribeOk = () => ({
    ok: true,
    status: 200,
    text: async () => "",
    json: async () => ({ text: "hello" }),
});

describe("upload middleware (multer)", () => {
    let app, alice, aliceToken;
    const avatarDir = path.join(process.cwd(), "uploads", "avatars");
    const voiceDir = path.join(process.cwd(), "uploads", "voice");

    before(async () => {
        await connectTestDB();
        app = buildApp();
    });
    after(async () => disconnectTestDB());

    beforeEach(async () => {
        await clearTestDB();
        alice = await User.create({
            name: "A",
            email: "u@x.com",
            password: "pw123456",
        });
        aliceToken = tokenFor(alice._id);
    });

    afterEach(() => {
        sinon.restore();
        for (const dir of [avatarDir, voiceDir]) {
            try {
                for (const f of fs.readdirSync(dir)) {
                    if (f.startsWith(String(alice._id))) {
                        fs.unlinkSync(path.join(dir, f));
                    }
                }
            } catch {
                /* nothing to clean */
            }
        }
    });

    describe("avatar uploads", () => {
        it("accepts a PNG image and stores it under the user's id", async () => {
            const res = await request(app)
                .post("/api/users/avatar")
                .set("Authorization", `Bearer ${aliceToken}`)
                .attach("avatar", Buffer.from("fake-png"), {
                    filename: "pic.png",
                    contentType: "image/png",
                });
            expect(res.status).to.equal(200);
            expect(res.body.profileImage).to.match(
                new RegExp(`^/uploads/avatars/${alice._id}-\\d+\\.png$`)
            );
        });

        it("accepts a WEBP image", async () => {
            const res = await request(app)
                .post("/api/users/avatar")
                .set("Authorization", `Bearer ${aliceToken}`)
                .attach("avatar", Buffer.from("fake-webp"), {
                    filename: "pic.webp",
                    contentType: "image/webp",
                });
            expect(res.status).to.equal(200);
            expect(res.body.profileImage).to.match(/\.webp$/);
        });

        it("rejects non-image mimetypes with 400", async () => {
            const res = await request(app)
                .post("/api/users/avatar")
                .set("Authorization", `Bearer ${aliceToken}`)
                .attach("avatar", Buffer.from("noop"), {
                    filename: "pic.txt",
                    contentType: "text/plain",
                });
            expect(res.status).to.equal(400);
            expect(res.body.message).to.match(/Only JPEG/);
        });

        it("returns 400 when no file is attached", async () => {
            const res = await request(app)
                .post("/api/users/avatar")
                .set("Authorization", `Bearer ${aliceToken}`);
            expect(res.status).to.equal(400);
        });
    });

    describe("voice uploads", () => {
        // The whole transcribe flow is tested in voice.controller.test.js.
        // Here we only verify multer's filename-from-mimetype branch.
        const accepted = [
            { mt: "audio/webm", ext: ".webm" },
            { mt: "audio/ogg", ext: ".ogg" },
            { mt: "audio/mpeg", ext: ".mp3" },
            { mt: "audio/wav", ext: ".wav" },
            { mt: "audio/mp4", ext: ".mp4" },
        ];

        accepted.forEach(({ mt, ext }) => {
            it(`accepts ${mt} and chooses ${ext} as the extension when none is given`, async () => {
                // Stub fetch so transcribe succeeds (mode=raw → no chat call)
                // and the saved file is left on disk for inspection.
                process.env.GROQ_API = "test-key";
                sinon.stub(global, "fetch").resolves(fakeTranscribeOk());

                await request(app)
                    .post("/api/voice/transcribe")
                    .set("Authorization", `Bearer ${aliceToken}`)
                    .field("mode", "raw")
                    .attach("audio", Buffer.from("blob"), {
                        filename: "clip", // no extension
                        contentType: mt,
                    });

                const files = fs.readdirSync(voiceDir).filter((f) =>
                    f.startsWith(String(alice._id))
                );
                expect(files.some((f) => f.endsWith(ext))).to.equal(true);
            });
        });
    });
});
