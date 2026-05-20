import express from "express";
import userRouter from "../../routes/userRoute.js";
import noteRouter from "../../routes/noteRoutes.js";
import categoryRouter from "../../routes/categoryRoutes.js";
import aiRouter from "../../routes/aiRoutes.js";
import voiceRouter from "../../routes/voiceRoutes.js";

export const buildApp = () => {
    const app = express();
    app.use(express.json());
    app.use("/api/users", userRouter);
    app.use("/api", noteRouter);
    app.use("/api", categoryRouter);
    app.use("/api", aiRouter);
    app.use("/api", voiceRouter);
    return app;
};
