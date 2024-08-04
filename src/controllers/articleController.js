import Article from "../models/Article";
import Comment from "../models/Comment";
import User from "../models/User";

export const home = async (req, res) => {
    const articles = await Article.find({})
        .sort({ createdAt: "desc" })
        .populate("owner");
    return res.render("home", { pageTitle: "Bulltein Board", articles });
};

export const search = async (req, res) => {
    const { keyword } = req.query;
    let articles = [];
    if (keyword) {
        articles = await Article.find({
            title: {
                $regex: new RegExp(`${keyword}$`, "i"),
            },
        }).populate("owner");
    }
    return res.render("search", { pageTitle: "Search", articles });
};

export const getUpload = (req, res) => {
    return res.render("upload", { pageTitle: "Bulltein Board - Upload" });
};

export const postUpload = async (req, res) => {
    const { title, content } = req.body;
    const date = new Date();
    const {
        user: { _id },
    } = req.session;
    let paths = [];
    for (let i = 0; i < req.files.length; i++) {
        paths.push(req.files[i].path);
    }
    try {
        const newArticle = await Article.create({
            title,
            content,
            date: `${date.getFullYear()} / ${date.getMonth()} / ${date.getDate()}`,
            fileURLs: paths,
            owner: _id,
        });
        const user = await User.findById(_id);
        user.articles.push(newArticle._id);
        user.save();
        return res.redirect("/");
    } catch (error) {
        return res.status(400).render("upload", {
            pageTitle: "Bulltein Board - Upload",
            errorMessage: error._message,
        });
    }
};

export const createComment = async (req, res) => {
    const {
        session: { user: { _id } },
        body: { text },
        params: { id },
    } = req;
    const article = await Article.findById(id);
    const user = await User.findById(_id);
    if (!article) {
        return res.sendStatus(404);
    }
    const comment = await Comment.create({
        text,
        owner: user.name,
        article: id,
    });
    article.comments.push(comment);
    article.save();
    return res.status(201).json({ newCommentId: comment._id });
};

export const seeArticle = async (req, res) => {
    const { id } = req.params;
    const article = await Article.findById(id).populate("owner").populate("comments");
    if (!article) {
        return res.render("404", { pageTitle: "Article not found." });
    }
    article.meta.views = article.meta.views + 1;
    await article.save();
    return res.status(200).render("see", { pageTitle: `Bulltein Board - ${article.title}`, article });
};

export const getEditArticle = async (req, res) => {
    const { id } = req.params;
    const {
        user: { _id },
    } = req.session;
    const article = await Article.findById(id);
    if (!article) {
        return res.status(404).render("404", { pageTitle: "Article not found." });
    }
    if (String(article.owner) !== String(_id)) {
        req.flash("error", "Not authorized");
        return res.status(403).redirect("/");
    }
    return res.render("edit", { pageTitle: `Edit: ${article.title}`, article });
};

export const postEditArticle = async (req, res) => {
    const {
        user: { _id },
    } = req.session;
    const { id } = req.params;
    const article = await Article.findById({ _id: id });
    if (!article) {
        return res.status(404).render("404", { pageTitle: "Article not found." });
    }
    if (String(article.owner) !== String(_id)) {
        req.flash("error", "You are not the the owner of the article.");
        return res.status(403).redirect("/");
    }
    const { title, content } = req.body;
    let paths = [];
    for (let i = 0; i < req.files.length; i++) {
        paths.push(req.files[i].path);
    }
    await Article.findByIdAndUpdate(id, {
        title,
        content,
        fileURLs: paths,
    });
    req.flash("success", "Changes saved.");
    return res.redirect(`/articles/${id}`);
};

export const deleteArticle = async (req, res) => {
    const { id } = req.params;
    const {
        user: { _id },
    } = req.session;
    const article = await Article.findById(id);
    const user = await User.findById(_id);
    if (!article) {
        return res.status(404).render("404", { pageTitle: "Article not found." });
    }
    if (String(article.owner) !== String(_id)) {
        return res.status(403).redirect("/");
    }
    await Article.findByIdAndDelete(id);
    user.articles.splice(user.articles.indexOf(id), 1);
    user.save();
    return res.redirect("/");
};