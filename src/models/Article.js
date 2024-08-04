import mongoose from "mongoose";

const articleSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true, maxLength: 20 },
    content: { type: String, required: true, trim: true, maxLength: 100 },
    date: { type: String, required: true, default: Date.now },
    fileURLs: { type: Object },
    meta: {
        views: { type: Number, default: 0, required: true },
    },
    comments: [
        { type: mongoose.Schema.Types.ObjectId, required: true, ref: "Comment" },
    ],
    owner: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "User" },
});

const Article = mongoose.model("Article", articleSchema);

export default Article;