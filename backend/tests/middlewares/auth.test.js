import { expect } from "chai";
import sinon from "sinon";
import jwt from "jsonwebtoken";
import { protect } from "../../middlewares/auth.js";
import User from "../../models/User.js";

describe("auth middleware - protect", () => {
    let req, res, next;

    beforeEach(() => {
        req = { headers: {} };
        res = {
            status: sinon.stub().returnsThis(),
            json: sinon.stub().returnsThis(),
        };
        next = sinon.stub();
    });

    afterEach(() => sinon.restore());

    it("rejects with 401 when Authorization header is missing", async () => {
        await protect(req, res, next);
        expect(res.status.calledWith(401)).to.equal(true);
        expect(res.json.firstCall.args[0]).to.have.property("message", "Not authorized, no token");
        expect(next.called).to.equal(false);
    });

    it("rejects with 401 when header does not start with Bearer", async () => {
        req.headers.authorization = "Token abc123";
        await protect(req, res, next);
        expect(res.status.calledWith(401)).to.equal(true);
        expect(next.called).to.equal(false);
    });

    it("rejects with 401 when token is invalid", async () => {
        req.headers.authorization = "Bearer invalid.token.here";
        sinon.stub(jwt, "verify").throws(new Error("jwt malformed"));
        await protect(req, res, next);
        expect(res.status.calledWith(401)).to.equal(true);
        expect(res.json.firstCall.args[0]).to.have.property("message", "Not authorized token failed");
        expect(next.called).to.equal(false);
    });

    it("rejects when user no longer exists", async () => {
        req.headers.authorization = "Bearer valid.token";
        sinon.stub(jwt, "verify").returns({ id: "507f1f77bcf86cd799439011" });
        sinon.stub(User, "findById").resolves(null);
        await protect(req, res, next);
        expect(res.status.calledWith(401)).to.equal(true);
        expect(res.json.firstCall.args[0]).to.deep.include({
            success: false,
            message: "Not authorized, user not found",
        });
        expect(next.called).to.equal(false);
    });

    it("attaches user to req and calls next on valid Bearer token", async () => {
        const fakeUser = { _id: "507f1f77bcf86cd799439011", name: "Alice", email: "a@b.com" };
        req.headers.authorization = "Bearer good.token";
        sinon.stub(jwt, "verify").returns({ id: fakeUser._id });
        sinon.stub(User, "findById").resolves(fakeUser);

        await protect(req, res, next);

        expect(req.user).to.equal(fakeUser);
        expect(next.calledOnce).to.equal(true);
        expect(res.status.called).to.equal(false);
    });

    it("strips Bearer prefix correctly and passes only the token to jwt.verify", async () => {
        const verifyStub = sinon.stub(jwt, "verify").returns({ id: "x" });
        sinon.stub(User, "findById").resolves({ _id: "x" });
        req.headers.authorization = "Bearer the-real-token-payload";

        await protect(req, res, next);

        expect(verifyStub.firstCall.args[0]).to.equal("the-real-token-payload");
    });
});
