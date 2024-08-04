import User from "../models/User";
import bcrypt from "bcrypt";

export const getLogin = (req, res) => {
    return res.render("login", { pageTitle: "Bulltein Board - Login" });
};

export const postLogin = async (req, res) => {
    const { name, password } = req.body;
    const user = await User.findOne({ name: name, socialOnly: false });
    if (!user) {
        return res.status(400).render("login", {
            pageTitle: "Bulltein Board - Login",
            errorMessage: "An account with this username does not exists.",
        });
    }
    const ok = bcrypt.compare(password, user.password);
    if (!ok) {
        return res.status(400).render("login", {
            pageTitle: "Bulltein Board - Login",
            errorMessage: "Wrong password",
        });
    }
    req.session.loggedin = true;
    req.session.user = user;
    return res.redirect("/");
};

export const getJoin = (req, res) => {
    return res.render("join", { pageTitle: "Bulltein Board - Join" });
};

export const postJoin = async (req, res) => {
    const { email, name, password, password2 } = req.body;
    if (password !== password2) {
        return res.status(400).render("join", {
            pageTitle: "Bulltein Board - Join",
            errorMessage: "Password confirmation does not match.",
        });
    }
    const exists = await User.exists({ $or: [{ email }, { name }] });
    if (exists) {
        return res.status(400).render("join", {
            pageTitle: "Bulltein Board - Join",
            errorMessage: "This username/email is already taken.",
        });
    }
    try {
        await User.create({
            email,
            name,
            password,
        });
        return res.redirect("/login");
    } catch (error) {
        return res.status(400).render("join", {
            pageTitle: "Bulltein Board - Join",
            errorMessage: error._message,
        });
    }
};

export const logout = (req, res) => {
    req.session.user = null;
    req.session.loggedin = false;
    return res.redirect("/");
};

export const getEditProfile = (req, res) => {
    return res.render("edit-profile", { pageTitle: "Bulltein Board - Edit Profile" });
};

export const postEditProfile = async (req, res) => {
    const {
        session: {
            user: { _id },
        },
        body: { email, name },
    } = req;
    const updatedUser = await User.findByIdAndUpdate(
        _id,
        {
            email,
            name,
        },
        { new: true }
    );
    req.flash("info", "User updated");
    req.session.user = updatedUser;
    return res.redirect("/users/edit-profile");
};

export const getChangePassword = (req, res) => {
    return res.render("change-password", { pageTitle: "Bulltein Board - Change Password" });
};

export const postChangePassword = async (req, res) => {
    const {
        session: {
            user: { _id },
        },
        body: { password, newPassword, newPasswordConfirmation },
    } = req;
    const user = await User.findById(_id);
    const ok = bcrypt.compare(password, user.password);
    if (!ok) {
        return res.status(400).render("change-password", {
            pageTitle: "Bulltein Board - Change Password",
            errorMessage: "The current password is incorrect",
        });
    }
    if (newPassword !== newPasswordConfirmation) {
        return res.status(400).render("change-password", {
            pageTitle: "Bulltein Board - Change Password",
            errorMessage: "The password does not match the confirmation",
        });
    }
    user.password = newPassword;
    await user.save();
    req.flash("info", "Password updated");
    return res.render("change-password", {
        pageTitle: `Bulltein Board ${user.name}`
    });
};

export const getFindPassword = (req, res) => {
    if (req.session.user.socialOnly === true) {
        req.flash("error", "Can't change password.");
        return res.redirect("/");
    }
    return res.render("find-password", { pageTitle: "Bulltein Board - Find Password" });
};

export const postFindPassword = async (req, res) => {
    const {
        body: { email, name },
    } = req;
    const user = await User.findOne({ email: email, name: name });
    if (!email || !name) {
        return res.status(400).render("find-password", {
            pageTitle: "Bulltein Board - Find Password",
            errorMessage: "Please enter both your email and name",
        });
    }
    if (!user) {
        return res.status(400).render("find-password", {
            pageTitle: "Bulltein Board - Find Password",
            errorMessage: "User does not exist",
        });
    }
    return res.status(200).render("find-password", {
        pageTitle: "Bulltein Board - Find Password",
        passwordMessage: `Password is ${user.password}`,
    });
};

export const startGithubLogin = (req, res) => {
    const baseUrl = "https://github.com/login/oauth/authorize";
    const config = {
        client_id: process.env.GH_CLIENT,
        allow_signup: false,
        scope: "read:user user:email",
    };
    const params = new URLSearchParams(config).toString();
    const finalUrl = `${baseUrl}?${params}`;
    return res.redirect(finalUrl);
};

export const finishGithubLogin = async (req, res) => {
    const baseUrl = "https://github.com/login/oauth/access_token";
    const config = {
        client_id: process.env.GH_CLIENT,
        client_secret: process.env.GH_SECRET,
        code: req.query.code,
    };
    const params = new URLSearchParams(config).toString();
    const finalUrl = `${baseUrl}?${params}`;
    const tokenRequest = await (
        await fetch(finalUrl, {
            method: "POST",
            headers: {
                Accept: "application/json",
            },
        })
    ).json();
    if ("access_token" in tokenRequest) {
        const { access_token } = tokenRequest;
        const apiUrl = "https://api.github.com";
        const userData = await (
            await fetch(`${apiUrl}/user`, {
                headers: {
                    Authorization: `token ${access_token}`,
                },
            })
        ).json();
        const emailData = await (
            await fetch(`${apiUrl}/user/emails`, {
                headers: {
                    Authorization: `token ${access_token}`,
                },
            })
        ).json();
        const emailObj = emailData.find(
            (email) => email.primary === true && email.verified === true
        );
        if (!emailObj) {
            return res.redirect("/login");
        }
        let user = await User.findOne({ email: emailObj.email });
        if (!user) {
            user = await User.create({
                email: emailObj.email,
                name: userData.name,
                password: "",
                socialOnly: true,
            });
        }
        req.session.loggedin = true;
        req.session.user = user;
        return res.redirect("/");
    } else {
        return res.redirect("/login");
    }
};

export const seeProfile = async (req, res) => {
    const { id } = req.params;
    const user = await User.findById(id).populate({
        path: "articles",
        populate: {
            path: "owner",
            model: "User",
        },
    });
    if (!user) {
        return res.status(404).render("404", { pageTitle: "User not found." });
    }
    return res.render("profile", {
        pageTitle: `Bulltein Board ${user.name}`,
        user,
    });
};