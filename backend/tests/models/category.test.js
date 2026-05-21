import { expect } from "chai";
import Category from "../../models/Category.js";
import User from "../../models/User.js";
import { connectTestDB, disconnectTestDB, clearTestDB } from "../helpers/db.js";

describe("Category model", () => {
    let alice, bob;
    before(async () => connectTestDB());
    after(async () => disconnectTestDB());
    beforeEach(async () => {
        await clearTestDB();
        alice = await User.create({ name: "A", email: "ca@x.com", password: "pw123456" });
        bob = await User.create({ name: "B", email: "cb@x.com", password: "pw123456" });
    });

    it("requires userId and name", async () => {
        try {
            await Category.create({});
            throw new Error("expected validation error");
        } catch (err) {
            expect(err.name).to.equal("ValidationError");
            expect(err.errors).to.have.keys("userId", "name");
        }
    });

    it("trims name and applies default color when not provided", async () => {
        const cat = await Category.create({ userId: alice._id, name: "  Work  " });
        expect(cat.name).to.equal("Work");
        expect(cat.color).to.equal("#f59e0b");
        expect(cat.icon).to.equal("");
    });

    it("rejects names longer than 40 chars", async () => {
        try {
            await Category.create({ userId: alice._id, name: "x".repeat(50) });
            throw new Error("expected validation error");
        } catch (err) {
            expect(err.name).to.equal("ValidationError");
        }
    });

    it("enforces unique (userId, name) — same name twice for one user fails", async () => {
        await Category.create({ userId: alice._id, name: "Dup" });
        try {
            // wait until index is built before the duplicate insert
            await Category.syncIndexes();
            await Category.create({ userId: alice._id, name: "Dup" });
            throw new Error("expected duplicate key error");
        } catch (err) {
            expect(err.code).to.equal(11000);
        }
    });

    it("allows the same name for different users", async () => {
        await Category.syncIndexes();
        await Category.create({ userId: alice._id, name: "Shared" });
        const other = await Category.create({ userId: bob._id, name: "Shared" });
        expect(other.name).to.equal("Shared");
    });
});
