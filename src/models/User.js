import bcrypt from "bcrypt";
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    password: { type: String },
    socialOnly: { type: Boolean, default: false },
    comments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Comment" }],
    articles: [{ type: mongoose.Schema.Types.ObjectId, ref: "Article" }],
});

const User = mongoose.model("User", userSchema);

userSchema.pre("save", function () {
    if (this.isModified("password")) {
        this.password = bcrypt.hash(this.password, 5);
    }
});

export default User;