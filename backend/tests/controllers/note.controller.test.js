import { expect } from "chai";
import request from "supertest";
import jwt from "jsonwebtoken";
import { buildApp } from "../helpers/app.js";
import { connectTestDB, disconnectTestDB, clearTestDB } from "../helpers/db.js";
import User from "../../models/User.js";
import Note from "../../models/Note.js";

const tokenFor = (userId) => jwt.sign({ id: userId }, process.env.JWT_SECRET);

describe("Note controller (HTTP)", () => {
    let app, alice, bob, aliceToken, bobToken;

    before(async () => {
        await connectTestDB();
        app = buildApp();
    });
    after(async () => disconnectTestDB());

    beforeEach(async () => {
        await clearTestDB();
        alice = await User.create({ name: "Alice", email: "alice@x.com", password: "pw123456" });
        bob = await User.create({ name: "Bob", email: "bob@x.com", password: "pw123456" });
        aliceToken = tokenFor(alice._id);
        bobToken = tokenFor(bob._id);
    });

    describe("protection", () => {
        const endpoints = [
            { method: "post", path: "/api/notes" },
            { method: "get", path: "/api/notes" },
            { method: "get", path: "/api/notes/507f1f77bcf86cd799439011" },
            { method: "put", path: "/api/notes/507f1f77bcf86cd799439011" },
            { method: "delete", path: "/api/notes/507f1f77bcf86cd799439011" },
        ];
        endpoints.forEach(({ method, path }) => {
            it(`${method.toUpperCase()} ${path} rejects unauthenticated requests with 401`, async () => {
                const res = await request(app)[method](path);
                expect(res.status).to.equal(401);
            });
        });
    });

    describe("POST /api/notes", () => {
        it("creates a note associated with the authenticated user", async () => {
            const res = await request(app)
                .post("/api/notes")
                .set("Authorization", `Bearer ${aliceToken}`)
                .send({ title: "First", content: "Hello world" });

            expect(res.status).to.equal(201);
            expect(res.body).to.include({ title: "First", content: "Hello world" });
            expect(res.body.userId).to.equal(String(alice._id));

            const dbNote = await Note.findById(res.body._id);
            expect(String(dbNote.userId)).to.equal(String(alice._id));
        });

        it("returns 400 when required fields are missing", async () => {
            const res = await request(app)
                .post("/api/notes")
                .set("Authorization", `Bearer ${aliceToken}`)
                .send({});
            expect(res.status).to.equal(400);
        });
    });

    describe("GET /api/notes", () => {
        it("returns only the authenticated user's notes", async () => {
            await Note.create({ title: "A1", content: "x", userId: alice._id });
            await Note.create({ title: "A2", content: "x", userId: alice._id });
            await Note.create({ title: "B1", content: "x", userId: bob._id });

            const res = await request(app)
                .get("/api/notes")
                .set("Authorization", `Bearer ${aliceToken}`);

            expect(res.status).to.equal(200);
            expect(res.body).to.have.lengthOf(2);
            expect(res.body.map((n) => n.title).sort()).to.deep.equal(["A1", "A2"]);
        });
    });

    describe("GET /api/notes/:id", () => {
        it("returns a note that belongs to the authenticated user", async () => {
            const n = await Note.create({ title: "T", content: "C", userId: alice._id });
            const res = await request(app)
                .get(`/api/notes/${n._id}`)
                .set("Authorization", `Bearer ${aliceToken}`);
            expect(res.status).to.equal(200);
            expect(res.body).to.include({ title: "T", content: "C" });
        });

        it("returns 404 when the note belongs to another user", async () => {
            const n = await Note.create({ title: "T", content: "C", userId: alice._id });
            const res = await request(app)
                .get(`/api/notes/${n._id}`)
                .set("Authorization", `Bearer ${bobToken}`);
            expect(res.status).to.equal(404);
        });
    });

    describe("PUT /api/notes/:id", () => {
        it("updates a note owned by the user", async () => {
            const n = await Note.create({ title: "T", content: "C", userId: alice._id });
            const res = await request(app)
                .put(`/api/notes/${n._id}`)
                .set("Authorization", `Bearer ${aliceToken}`)
                .send({ title: "T2", content: "C2" });
            expect(res.status).to.equal(200);
            expect(res.body).to.include({ title: "T2", content: "C2" });
        });

        it("returns 404 when trying to update another user's note", async () => {
            const n = await Note.create({ title: "T", content: "C", userId: alice._id });
            const res = await request(app)
                .put(`/api/notes/${n._id}`)
                .set("Authorization", `Bearer ${bobToken}`)
                .send({ title: "hack", content: "hack" });
            expect(res.status).to.equal(404);

            const fresh = await Note.findById(n._id);
            expect(fresh.title).to.equal("T");
        });
    });

    describe("DELETE /api/notes/:id", () => {
        it("deletes a note owned by the user", async () => {
            const n = await Note.create({ title: "T", content: "C", userId: alice._id });
            const res = await request(app)
                .delete(`/api/notes/${n._id}`)
                .set("Authorization", `Bearer ${aliceToken}`);
            expect(res.status).to.equal(200);

            const fresh = await Note.findById(n._id);
            expect(fresh).to.equal(null);
        });

        it("returns 404 when trying to delete another user's note", async () => {
            const n = await Note.create({ title: "T", content: "C", userId: alice._id });
            const res = await request(app)
                .delete(`/api/notes/${n._id}`)
                .set("Authorization", `Bearer ${bobToken}`);
            expect(res.status).to.equal(404);

            const fresh = await Note.findById(n._id);
            expect(fresh).to.not.equal(null);
        });
    });
});
