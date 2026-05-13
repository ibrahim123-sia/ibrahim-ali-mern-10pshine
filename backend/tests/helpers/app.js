import express from "express";
import userRouter from "../../routes/userRoute.js";
import noteRouter from "../../routes/noteRoutes.js";

export const buildApp = () => {
    const app = express();
    app.use(express.json());
    app.use("/api/users", userRouter);
    app.use("/api", noteRouter);
    return app;
};
