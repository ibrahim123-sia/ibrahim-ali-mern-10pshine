import { expect } from "chai";
import request from "supertest";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { buildApp } from "../helpers/app.js";
import { connectTestDB, disconnectTestDB, clearTestDB } from "../helpers/db.js";
import User from "../../models/User.js";
import Note from "../../models/Note.js";
import Category from "../../models/Category.js";

const tokenFor = (id) => jwt.sign({ id }, process.env.JWT_SECRET);

describe("Note controller — extra cases (sanitization, reorder)", () => {
    let app, alice, aliceToken, bob, bobToken;

    before(async () => {
        await connectTestDB();
        app = buildApp();
    });
    after(async () => disconnectTestDB());

    beforeEach(async () => {
        await clearTestDB();
        alice = await User.create({ name: "A", email: "ne-a@x.com", password: "pw123456" });
        bob = await User.create({ name: "B", email: "ne-b@x.com", password: "pw123456" });
        aliceToken = tokenFor(alice._id);
        bobToken = tokenFor(bob._id);
    });

    describe("createNote sanitizes optional fields", () => {
        it("trims/lowercases/dedupes tags and ignores invalid ones", async () => {
            const res = await request(app)
                .post("/api/notes")
                .set("Authorization", `Bearer ${aliceToken}`)
                .send({
                    title: "T",
                    content: "C",
                    tags: ["  React  ", "react", "node", "", null, "x".repeat(50)],
                });
            expect(res.status).to.equal(201);
            expect(res.body.tags).to.deep.equal(["react", "node"]);
        });

        it("accepts valid hex noteColor and ignores invalid one", async () => {
            const res = await request(app)
                .post("/api/notes")
                .set("Authorization", `Bearer ${aliceToken}`)
                .send({
                    title: "T",
                    content: "C",
                    noteColor: "#abcdef",
                    textColor: "blueish", // invalid
                });
            expect(res.status).to.equal(201);
            expect(res.body.noteColor).to.equal("#abcdef");
            expect(res.body.textColor).to.equal(""); // default
        });

        it("treats truthy boolean flags as true", async () => {
            const res = await request(app)
                .post("/api/notes")
                .set("Authorization", `Bearer ${aliceToken}`)
                .send({
                    title: "T",
                    content: "C",
                    pinned: 1,
                    favorite: "yes",
                    archived: true,
                });
            expect(res.body).to.include({ pinned: true, favorite: true, archived: true });
        });

        it("ignores fontStyle and moodLabel outside the allowed set", async () => {
            const res = await request(app)
                .post("/api/notes")
                .set("Authorization", `Bearer ${aliceToken}`)
                .send({
                    title: "T",
                    content: "C",
                    fontStyle: "comic",
                    moodLabel: "angry",
                });
            expect(res.status).to.equal(201);
            expect(res.body.fontStyle).to.equal("sans");
            expect(res.body.moodLabel).to.equal("");
        });

        it("caps checklist at 100 items and truncates long text", async () => {
            const longText = "x".repeat(500);
            const items = Array.from({ length: 150 }, (_, i) => ({
                text: i === 0 ? longText : `item ${i}`,
            }));
            const res = await request(app)
                .post("/api/notes")
                .set("Authorization", `Bearer ${aliceToken}`)
                .send({ title: "T", content: "C", checklist: items });
            expect(res.status).to.equal(201);
            expect(res.body.checklist).to.have.lengthOf(100);
            expect(res.body.checklist[0].text.length).to.equal(200);
        });

        it("accepts a category id and stores it", async () => {
            const cat = await Category.create({ userId: alice._id, name: "Work" });
            const res = await request(app)
                .post("/api/notes")
                .set("Authorization", `Bearer ${aliceToken}`)
                .send({ title: "T", content: "C", category: String(cat._id) });
            expect(res.status).to.equal(201);
            expect(res.body.category).to.equal(String(cat._id));
        });

        it("clears category when explicitly set to null", async () => {
            const cat = await Category.create({ userId: alice._id, name: "X" });
            const note = await Note.create({
                title: "T",
                content: "C",
                userId: alice._id,
                category: cat._id,
            });
            const res = await request(app)
                .put(`/api/notes/${note._id}`)
                .set("Authorization", `Bearer ${aliceToken}`)
                .send({ category: null });
            expect(res.status).to.equal(200);
            expect(res.body.category).to.equal(null);
        });
    });

    describe("updateNote", () => {
        it("returns 400 when nothing valid is provided", async () => {
            const n = await Note.create({ title: "T", content: "C", userId: alice._id });
            const res = await request(app)
                .put(`/api/notes/${n._id}`)
                .set("Authorization", `Bearer ${aliceToken}`)
                .send({}); // empty body
            expect(res.status).to.equal(400);
            expect(res.body).to.have.property("message", "Nothing to update");
        });

        it("ignores an invalid category id", async () => {
            const n = await Note.create({ title: "T", content: "C", userId: alice._id });
            const res = await request(app)
                .put(`/api/notes/${n._id}`)
                .set("Authorization", `Bearer ${aliceToken}`)
                .send({ category: "not-an-objectid" });
            expect(res.status).to.equal(400); // nothing to update after sanitizing
        });
    });

    describe("POST /api/notes/reorder", () => {
        it("rejects unauthenticated requests with 401", async () => {
            const res = await request(app).post("/api/notes/reorder").send({ ids: [] });
            expect(res.status).to.equal(401);
        });

        it("returns 400 when ids is missing or empty", async () => {
            const res = await request(app)
                .post("/api/notes/reorder")
                .set("Authorization", `Bearer ${aliceToken}`)
                .send({});
            expect(res.status).to.equal(400);

            const res2 = await request(app)
                .post("/api/notes/reorder")
                .set("Authorization", `Bearer ${aliceToken}`)
                .send({ ids: [] });
            expect(res2.status).to.equal(400);
        });

        it("returns 400 when none of the ids are valid ObjectIds", async () => {
            const res = await request(app)
                .post("/api/notes/reorder")
                .set("Authorization", `Bearer ${aliceToken}`)
                .send({ ids: ["nope", "also-nope"] });
            expect(res.status).to.equal(400);
        });

        it("reorders the user's notes in the order given", async () => {
            const n1 = await Note.create({ title: "1", content: "x", userId: alice._id });
            const n2 = await Note.create({ title: "2", content: "x", userId: alice._id });
            const n3 = await Note.create({ title: "3", content: "x", userId: alice._id });

            const res = await request(app)
                .post("/api/notes/reorder")
                .set("Authorization", `Bearer ${aliceToken}`)
                .send({ ids: [String(n3._id), String(n1._id), String(n2._id)] });

            expect(res.status).to.equal(200);
            expect(res.body).to.include({ matched: 3, modified: 3 });

            const refreshed = await Note.find({ userId: alice._id }).sort({ order: 1 });
            expect(refreshed.map((n) => n.title)).to.deep.equal(["3", "1", "2"]);
        });

        it("never reorders another user's notes", async () => {
            const bobNote = await Note.create({
                title: "bob",
                content: "x",
                userId: bob._id,
                order: 7,
            });
            const res = await request(app)
                .post("/api/notes/reorder")
                .set("Authorization", `Bearer ${aliceToken}`)
                .send({ ids: [String(bobNote._id), String(new mongoose.Types.ObjectId())] });
            expect(res.status).to.equal(200);
            expect(res.body.modified).to.equal(0);
            const after = await Note.findById(bobNote._id);
            expect(after.order).to.equal(7);
        });
    });
});
