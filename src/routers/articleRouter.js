import express from "express";
import { getUpload, postUpload, seeArticle, getEditArticle, postEditArticle, deleteArticle, createComment } from "../controllers/articleController";
import { protectorMiddleware, imageUpload } from "../middlewares";

const articleRouter = express.Router();

articleRouter.route("/upload").all(protectorMiddleware).get(getUpload).post(imageUpload.array("image"), postUpload);
articleRouter.get("/:id", seeArticle);
articleRouter.route("/:id/edit").all(protectorMiddleware).get(getEditArticle).post(imageUpload.array("image"), postEditArticle);
articleRouter.route("/:id/delete").all(protectorMiddleware).get(deleteArticle);
articleRouter.post("/:id/comment", createComment);

export default articleRouter;