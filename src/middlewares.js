import multer from "multer";

export const localsMiddleware = (req, res, next) => {
    res.locals.loggedin = Boolean(req.session.loggedin);
    res.locals.loggedinUser = req.session.user || {};
    next();
};

export const protectorMiddleware = (req, res, next) => {
    if (req.session.loggedin) {
        return next();
    } else {
        req.flash("error", "Log in first.");
        return res.redirect("/login");
    }
};

export const publicOnlyMiddleware = (req, res, next) => {
    if (!req.session.loggedin) {
        return next();
    } else {
        req.flash("error", "Not authorized");
        return res.redirect("/");
    }
};

export const imageUpload = multer({
    dest: "uploads/images/",
    limits: {
        fileSize: 5000000,
    },
});