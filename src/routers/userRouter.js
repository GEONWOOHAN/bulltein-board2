import express from "express";
import { } from "../controllers/articleController";
import { logout, getEditProfile, postEditProfile, getChangePassword, postChangePassword, getFindPassword, postFindPassword, startGithubLogin, finishGithubLogin, seeProfile } from "../controllers/userController";
import { protectorMiddleware, publicOnlyMiddleware } from "../middlewares";

const userRouter = express.Router();

userRouter.get("/logout", protectorMiddleware, logout);
userRouter.route("/edit-profile").all(protectorMiddleware).get(getEditProfile).post(postEditProfile);
userRouter.route("/change-password").all(protectorMiddleware).get(getChangePassword).post(postChangePassword);
userRouter.route("/find-password").get(getFindPassword).post(postFindPassword);
userRouter.get("/github/start", publicOnlyMiddleware, startGithubLogin);
userRouter.get("/github/finish", publicOnlyMiddleware, finishGithubLogin);
userRouter.get("/:id", seeProfile);

export default userRouter;