import { expect } from "chai";
import request from "supertest";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { buildApp } from "../helpers/app.js";
import { connectTestDB, disconnectTestDB, clearTestDB } from "../helpers/db.js";
import User from "../../models/User.js";
import Category from "../../models/Category.js";
import Note from "../../models/Note.js";

const tokenFor = (userId) => jwt.sign({ id: userId }, process.env.JWT_SECRET);

describe("Category controller (HTTP)", () => {
    let app, alice, bob, aliceToken, bobToken;

    before(async () => {
        await connectTestDB();
        app = buildApp();
    });
    after(async () => disconnectTestDB());

    beforeEach(async () => {
        await clearTestDB();
        alice = await User.create({ name: "Alice", email: "a@x.com", password: "pw123456" });
        bob = await User.create({ name: "Bob", email: "b@x.com", password: "pw123456" });
        aliceToken = tokenFor(alice._id);
        bobToken = tokenFor(bob._id);
    });

    describe("protection", () => {
        const endpoints = [
            { method: "get", path: "/api/categories" },
            { method: "post", path: "/api/categories" },
            { method: "put", path: "/api/categories/507f1f77bcf86cd799439011" },
            { method: "delete", path: "/api/categories/507f1f77bcf86cd799439011" },
        ];
        endpoints.forEach(({ method, path }) => {
            it(`${method.toUpperCase()} ${path} rejects unauthenticated requests with 401`, async () => {
                const res = await request(app)[method](path);
                expect(res.status).to.equal(401);
            });
        });
    });

    describe("GET /api/categories", () => {
        it("returns only the authenticated user's categories, sorted by name", async () => {
            await Category.create({ userId: alice._id, name: "Work" });
            await Category.create({ userId: alice._id, name: "Ideas" });
            await Category.create({ userId: bob._id, name: "Bob's" });

            const res = await request(app)
                .get("/api/categories")
                .set("Authorization", `Bearer ${aliceToken}`);

            expect(res.status).to.equal(200);
            expect(res.body).to.have.lengthOf(2);
            expect(res.body.map((c) => c.name)).to.deep.equal(["Ideas", "Work"]);
        });
    });

    describe("POST /api/categories", () => {
        it("creates a category with trimmed name and color/icon", async () => {
            const res = await request(app)
                .post("/api/categories")
                .set("Authorization", `Bearer ${aliceToken}`)
                .send({ name: "  Study  ", color: "#abcdef", icon: "book" });

            expect(res.status).to.equal(201);
            expect(res.body).to.include({ name: "Study", color: "#abcdef", icon: "book" });
            expect(res.body.userId).to.equal(String(alice._id));
        });

        it("uses default color when color is not a valid hex", async () => {
            const res = await request(app)
                .post("/api/categories")
                .set("Authorization", `Bearer ${aliceToken}`)
                .send({ name: "Things", color: "blue" });

            expect(res.status).to.equal(201);
            expect(res.body.color).to.equal("#f59e0b");
        });

        it("returns 400 when name is missing or blank", async () => {
            const res = await request(app)
                .post("/api/categories")
                .set("Authorization", `Bearer ${aliceToken}`)
                .send({ name: "   " });
            expect(res.status).to.equal(400);
            expect(res.body).to.have.property("message", "Name is required");
        });

        it("returns 409 on duplicate category name for the same user", async () => {
            await Category.create({ userId: alice._id, name: "Dup" });
            const res = await request(app)
                .post("/api/categories")
                .set("Authorization", `Bearer ${aliceToken}`)
                .send({ name: "Dup" });
            expect(res.status).to.equal(409);
        });

        it("allows two users to have the same category name", async () => {
            await Category.create({ userId: alice._id, name: "Shared" });
            const res = await request(app)
                .post("/api/categories")
                .set("Authorization", `Bearer ${bobToken}`)
                .send({ name: "Shared" });
            expect(res.status).to.equal(201);
        });
    });

    describe("PUT /api/categories/:id", () => {
        it("updates name, color, and icon", async () => {
            const cat = await Category.create({ userId: alice._id, name: "Old" });
            const res = await request(app)
                .put(`/api/categories/${cat._id}`)
                .set("Authorization", `Bearer ${aliceToken}`)
                .send({ name: "  New  ", color: "#123abc", icon: "star" });
            expect(res.status).to.equal(200);
            expect(res.body).to.include({ name: "New", color: "#123abc", icon: "star" });
        });

        it("returns 400 when name is provided but empty", async () => {
            const cat = await Category.create({ userId: alice._id, name: "X" });
            const res = await request(app)
                .put(`/api/categories/${cat._id}`)
                .set("Authorization", `Bearer ${aliceToken}`)
                .send({ name: "   " });
            expect(res.status).to.equal(400);
            expect(res.body).to.have.property("message", "Name cannot be empty");
        });

        it("returns 400 when nothing is provided to update", async () => {
            const cat = await Category.create({ userId: alice._id, name: "X" });
            const res = await request(app)
                .put(`/api/categories/${cat._id}`)
                .set("Authorization", `Bearer ${aliceToken}`)
                .send({});
            expect(res.status).to.equal(400);
            expect(res.body).to.have.property("message", "Nothing to update");
        });

        it("returns 404 when the category belongs to another user", async () => {
            const cat = await Category.create({ userId: alice._id, name: "A" });
            const res = await request(app)
                .put(`/api/categories/${cat._id}`)
                .set("Authorization", `Bearer ${bobToken}`)
                .send({ name: "hijack" });
            expect(res.status).to.equal(404);
        });

        it("returns 409 when the new name collides with an existing one", async () => {
            await Category.create({ userId: alice._id, name: "First" });
            const cat = await Category.create({ userId: alice._id, name: "Second" });
            const res = await request(app)
                .put(`/api/categories/${cat._id}`)
                .set("Authorization", `Bearer ${aliceToken}`)
                .send({ name: "First" });
            expect(res.status).to.equal(409);
        });
    });

    describe("DELETE /api/categories/:id", () => {
        it("deletes a category and clears it from the user's notes", async () => {
            const cat = await Category.create({ userId: alice._id, name: "Temp" });
            const note = await Note.create({
                title: "N",
                content: "C",
                userId: alice._id,
                category: cat._id,
            });

            const res = await request(app)
                .delete(`/api/categories/${cat._id}`)
                .set("Authorization", `Bearer ${aliceToken}`);

            expect(res.status).to.equal(200);
            expect(res.body).to.have.property("message", "Category deleted");

            const refreshed = await Note.findById(note._id);
            expect(refreshed.category).to.equal(null);

            const stillThere = await Category.findById(cat._id);
            expect(stillThere).to.equal(null);
        });

        it("returns 404 when trying to delete another user's category", async () => {
            const cat = await Category.create({ userId: alice._id, name: "Mine" });
            const res = await request(app)
                .delete(`/api/categories/${cat._id}`)
                .set("Authorization", `Bearer ${bobToken}`);
            expect(res.status).to.equal(404);
        });

        it("returns 404 for an unknown id (well-formed)", async () => {
            const unknownId = new mongoose.Types.ObjectId();
            const res = await request(app)
                .delete(`/api/categories/${unknownId}`)
                .set("Authorization", `Bearer ${aliceToken}`);
            expect(res.status).to.equal(404);
        });
    });
});
