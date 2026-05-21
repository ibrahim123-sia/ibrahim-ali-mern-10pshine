import { expect } from "chai";
import mongoose from "mongoose";
import Note from "../../models/Note.js";
import User from "../../models/User.js";
import { connectTestDB, disconnectTestDB, clearTestDB } from "../helpers/db.js";

describe("Note model", () => {
    let alice;
    before(async () => connectTestDB());
    after(async () => disconnectTestDB());
    beforeEach(async () => {
        await clearTestDB();
        alice = await User.create({ name: "A", email: "n@x.com", password: "pw123456" });
    });

    it("requires title, content, and userId", async () => {
        try {
            await Note.create({});
            throw new Error("expected validation error");
        } catch (err) {
            expect(err.name).to.equal("ValidationError");
            expect(err.errors).to.have.keys("title", "content", "userId");
        }
    });

    it("applies sensible defaults", async () => {
        const note = await Note.create({
            title: "t",
            content: "c",
            userId: alice._id,
        });
        expect(note.tags).to.deep.equal([]);
        expect(note.checklist).to.deep.equal([]);
        expect(note.pinned).to.equal(false);
        expect(note.favorite).to.equal(false);
        expect(note.archived).to.equal(false);
        expect(note.deletedAt).to.equal(null);
        expect(note.category).to.equal(null);
        expect(note.fontStyle).to.equal("sans");
        expect(note.moodLabel).to.equal("");
        expect(note.order).to.equal(0);
        expect(note.noteColor).to.equal("");
        expect(note.textColor).to.equal("");
        expect(note.voiceNote).to.equal("");
        expect(note.createdAt).to.be.instanceOf(Date);
        expect(note.updatedAt).to.be.instanceOf(Date);
    });

    it("rejects fontStyle outside the enum", async () => {
        try {
            await Note.create({
                title: "t",
                content: "c",
                userId: alice._id,
                fontStyle: "comic",
            });
            throw new Error("expected enum validation");
        } catch (err) {
            expect(err.name).to.equal("ValidationError");
        }
    });

    it("rejects moodLabel outside the enum", async () => {
        try {
            await Note.create({
                title: "t",
                content: "c",
                userId: alice._id,
                moodLabel: "angry",
            });
            throw new Error("expected enum validation");
        } catch (err) {
            expect(err.name).to.equal("ValidationError");
        }
    });

    it("persists checklist subdocuments without _id", async () => {
        const note = await Note.create({
            title: "t",
            content: "c",
            userId: alice._id,
            checklist: [{ text: "buy milk" }, { text: "feed cat", done: true }],
        });
        expect(note.checklist).to.have.lengthOf(2);
        expect(note.checklist[0]).to.include({ text: "buy milk", done: false });
        expect(note.checklist[1]).to.include({ text: "feed cat", done: true });
        // checklist items have _id: false
        expect(note.checklist[0]._id).to.equal(undefined);
    });

    it("accepts a category ObjectId reference", async () => {
        const catId = new mongoose.Types.ObjectId();
        const note = await Note.create({
            title: "t",
            content: "c",
            userId: alice._id,
            category: catId,
        });
        expect(String(note.category)).to.equal(String(catId));
    });
});
