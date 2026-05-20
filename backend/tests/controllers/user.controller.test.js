import { expect } from "chai";
import request from "supertest";
import jwt from "jsonwebtoken";
import { buildApp } from "../helpers/app.js";
import { connectTestDB, disconnectTestDB, clearTestDB } from "../helpers/db.js";
import User from "../../models/User.js";

describe("User controller (HTTP)", () => {
    let app;

    before(async () => {
        await connectTestDB();
        app = buildApp();
    });
    after(async () => disconnectTestDB());
    afterEach(async () => clearTestDB());

    describe("POST /api/users/register", () => {
        it("creates a new user and returns _id, name, email (no password)", async () => {
            const res = await request(app)
                .post("/api/users/register")
                .send({ name: "Alice", email: "alice@x.com", password: "pw123456" });

            expect(res.status).to.equal(201);
            expect(res.body).to.have.property("_id");
            expect(res.body).to.have.property("email", "alice@x.com");
            expect(res.body).to.not.have.property("password");

            const persisted = await User.findOne({ email: "alice@x.com" });
            expect(persisted).to.exist;
            expect(persisted.password).to.not.equal("pw123456");
        });

        it("rejects duplicate email with 400", async () => {
            await User.create({ name: "X", email: "dup@x.com", password: "pw123456" });
            const res = await request(app)
                .post("/api/users/register")
                .send({ name: "Y", email: "dup@x.com", password: "pw123456" });
            expect(res.status).to.equal(400);
            expect(res.body).to.have.property("message", "User already exists");
        });
    });

    describe("POST /api/users/login", () => {
        beforeEach(async () => {
            await User.create({ name: "Alice", email: "alice@x.com", password: "pw123456" });
        });

        it("returns a token on valid credentials", async () => {
            const res = await request(app)
                .post("/api/users/login")
                .send({ email: "alice@x.com", password: "pw123456" });
            expect(res.body).to.have.property("success", true);
            expect(res.body).to.have.property("token");

            const decoded = jwt.verify(res.body.token, process.env.JWT_SECRET);
            expect(decoded).to.have.property("id");
        });

        it("returns success:false on wrong password", async () => {
            const res = await request(app)
                .post("/api/users/login")
                .send({ email: "alice@x.com", password: "wrong" });
            expect(res.body).to.have.property("success", false);
            expect(res.body).to.not.have.property("token");
        });

        it("returns success:false on unknown email", async () => {
            const res = await request(app)
                .post("/api/users/login")
                .send({ email: "nobody@x.com", password: "whatever" });
            expect(res.body).to.have.property("success", false);
        });

        it("does NOT require a Bearer token to log in", async () => {
            const res = await request(app)
                .post("/api/users/login")
                .send({ email: "alice@x.com", password: "pw123456" });
            expect(res.status).to.not.equal(401);
        });
    });

    describe("POST /api/users/logout (protected)", () => {
        it("rejects unauthenticated requests with 401", async () => {
            const res = await request(app).post("/api/users/logout");
            expect(res.status).to.equal(401);
        });

        it("succeeds with a valid Bearer token", async () => {
            const user = await User.create({ name: "L", email: "l@x.com", password: "pw123456" });
            const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
            const res = await request(app)
                .post("/api/users/logout")
                .set("Authorization", `Bearer ${token}`);
            expect(res.status).to.equal(200);
            expect(res.body).to.have.property("success", true);
        });
    });

    describe("GET /api/users/profile (protected)", () => {
        it("rejects unauthenticated requests with 401", async () => {
            const res = await request(app).get("/api/users/profile");
            expect(res.status).to.equal(401);
        });

        it("returns the authenticated user", async () => {
            const user = await User.create({ name: "P", email: "p@x.com", password: "pw123456" });
            const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
            const res = await request(app)
                .get("/api/users/profile")
                .set("Authorization", `Bearer ${token}`);
            expect(res.status).to.equal(200);
            expect(res.body).to.have.property("email", "p@x.com");
        });
    });
});
