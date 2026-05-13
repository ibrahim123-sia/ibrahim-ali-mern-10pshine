import { expect } from "chai";
import User from "../../models/User.js";
import { connectTestDB, disconnectTestDB, clearTestDB } from "../helpers/db.js";

describe("User model", () => {
    before(async () => connectTestDB());
    after(async () => disconnectTestDB());
    afterEach(async () => clearTestDB());

    it("hashes the password on save (does not store plaintext)", async () => {
        const plain = "secret123";
        const user = await User.create({ name: "Alice", email: "a@b.com", password: plain });
        expect(user.password).to.not.equal(plain);
        expect(user.password).to.have.length.greaterThan(20);
    });

    it("matchPassword returns true for the correct password", async () => {
        const user = await User.create({ name: "Bob", email: "b@c.com", password: "topsecret" });
        const ok = await user.matchPassword("topsecret");
        expect(ok).to.equal(true);
    });

    it("matchPassword returns false for an incorrect password", async () => {
        const user = await User.create({ name: "Bob", email: "b2@c.com", password: "topsecret" });
        const ok = await user.matchPassword("wrong");
        expect(ok).to.equal(false);
    });

    it("does not rehash password when other fields are updated", async () => {
        const user = await User.create({ name: "Carol", email: "c@d.com", password: "pw12345" });
        const hashedBefore = user.password;
        user.name = "Carol Updated";
        await user.save();
        expect(user.password).to.equal(hashedBefore);
        // and the original password still matches
        const ok = await user.matchPassword("pw12345");
        expect(ok).to.equal(true);
    });

    it("enforces unique email", async () => {
        await User.create({ name: "X", email: "dup@x.com", password: "pw" });
        try {
            await User.create({ name: "Y", email: "dup@x.com", password: "pw" });
            throw new Error("expected duplicate key error");
        } catch (err) {
            expect(err.code).to.equal(11000);
        }
    });
});
