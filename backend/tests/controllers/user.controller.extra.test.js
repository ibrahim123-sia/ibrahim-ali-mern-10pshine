import { expect } from "chai";
import request from "supertest";
import jwt from "jsonwebtoken";
import { buildApp } from "../helpers/app.js";
import { connectTestDB, disconnectTestDB, clearTestDB } from "../helpers/db.js";
import User from "../../models/User.js";

const tokenFor = (id) => jwt.sign({ id }, process.env.JWT_SECRET);

describe("User controller — profile, password, avatar", () => {
    let app, alice, aliceToken;

    before(async () => {
        await connectTestDB();
        app = buildApp();
    });
    after(async () => disconnectTestDB());

    beforeEach(async () => {
        await clearTestDB();
        alice = await User.create({
            name: "Alice",
            email: "ue@x.com",
            password: "pw123456",
        });
        aliceToken = tokenFor(alice._id);
    });

    describe("PUT /api/users/profile", () => {
        it("rejects unauthenticated requests with 401", async () => {
            const res = await request(app).put("/api/users/profile").send({ name: "Bob" });
            expect(res.status).to.equal(401);
        });

        it("updates name (trimmed) and returns sanitized user", async () => {
            const res = await request(app)
                .put("/api/users/profile")
                .set("Authorization", `Bearer ${aliceToken}`)
                .send({ name: "  Alice Updated  " });
            expect(res.status).to.equal(200);
            expect(res.body).to.include({ name: "Alice Updated", email: "ue@x.com" });
            expect(res.body).to.not.have.property("password");
        });

        it("updates theme to 'dark'", async () => {
            const res = await request(app)
                .put("/api/users/profile")
                .set("Authorization", `Bearer ${aliceToken}`)
                .send({ theme: "dark" });
            expect(res.status).to.equal(200);
            expect(res.body.theme).to.equal("dark");
        });

        it("returns 400 when name is empty after trimming", async () => {
            const res = await request(app)
                .put("/api/users/profile")
                .set("Authorization", `Bearer ${aliceToken}`)
                .send({ name: "   " });
            expect(res.status).to.equal(400);
            expect(res.body).to.have.property("message", "Name cannot be empty");
        });

        it("returns 400 for an invalid theme", async () => {
            const res = await request(app)
                .put("/api/users/profile")
                .set("Authorization", `Bearer ${aliceToken}`)
                .send({ theme: "neon" });
            expect(res.status).to.equal(400);
            expect(res.body).to.have.property("message", "Theme must be 'light' or 'dark'");
        });

        it("returns 400 when nothing is supplied", async () => {
            const res = await request(app)
                .put("/api/users/profile")
                .set("Authorization", `Bearer ${aliceToken}`)
                .send({});
            expect(res.status).to.equal(400);
            expect(res.body).to.have.property("message", "Nothing to update");
        });
    });

    describe("PUT /api/users/password", () => {
        it("rejects unauthenticated requests with 401", async () => {
            const res = await request(app).put("/api/users/password").send({});
            expect(res.status).to.equal(401);
        });

        it("returns 400 when either field is missing", async () => {
            const res = await request(app)
                .put("/api/users/password")
                .set("Authorization", `Bearer ${aliceToken}`)
                .send({ currentPassword: "pw123456" });
            expect(res.status).to.equal(400);
        });

        it("returns 400 when the new password is too short", async () => {
            const res = await request(app)
                .put("/api/users/password")
                .set("Authorization", `Bearer ${aliceToken}`)
                .send({ currentPassword: "pw123456", newPassword: "short" });
            expect(res.status).to.equal(400);
            expect(res.body.message).to.match(/at least 6/);
        });

        it("returns 400 when the new password matches the current one", async () => {
            const res = await request(app)
                .put("/api/users/password")
                .set("Authorization", `Bearer ${aliceToken}`)
                .send({ currentPassword: "pw123456", newPassword: "pw123456" });
            expect(res.status).to.equal(400);
            expect(res.body.message).to.match(/different/);
        });

        it("returns 401 when the current password is wrong", async () => {
            const res = await request(app)
                .put("/api/users/password")
                .set("Authorization", `Bearer ${aliceToken}`)
                .send({ currentPassword: "wrong", newPassword: "newpw123" });
            expect(res.status).to.equal(401);
        });

        it("changes the password and the new one then logs in", async () => {
            const change = await request(app)
                .put("/api/users/password")
                .set("Authorization", `Bearer ${aliceToken}`)
                .send({ currentPassword: "pw123456", newPassword: "newpw123" });
            expect(change.status).to.equal(200);
            expect(change.body.success).to.equal(true);

            const login = await request(app)
                .post("/api/users/login")
                .send({ email: "ue@x.com", password: "newpw123" });
            expect(login.body).to.have.property("success", true);
        });
    });

    describe("POST /api/users/avatar (no file)", () => {
        it("rejects unauthenticated requests with 401", async () => {
            const res = await request(app).post("/api/users/avatar");
            expect(res.status).to.equal(401);
        });
    });
});
