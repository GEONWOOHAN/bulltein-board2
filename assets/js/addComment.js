const articleContainer = document.getElementById("articleContainer");
const form = document.getElementById("commentForm");

const deleteComment = (event) => {
    const li = event.target.parentElement;
    li.remove();
};

const addComment = (text, id) => {
    const articleComments = document.querySelector("#article_comments ul");
    const newComment = document.createElement("li");
    newComment.dataset.id = id;
    newComment.className = "article_comment";
    const icon = document.createElement("i");
    icon.className = "fas fa-comment";
    const span = document.createElement("span");
    span.innerText = ` ${text}`;
    const deleteButton = document.createElement("button");
    deleteButton.innerText = "X"
    newComment.appendChild(icon);
    newComment.appendChild(span);
    newComment.appendChild(deleteButton);
    articleComments.prepend(newComment);
    deleteButton.addEventListener("click", deleteComment);
};

const handleSubmit = async (event) => {
    event.preventDefault();
    const textarea = form.querySelector("textarea");
    const text = textarea.value;
    const articleId = articleContainer.dataset.id;
    if (text === "") {
        return;
    }
    const response = await fetch(`/articles/${articleId}/comment`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
    });
    if (response.status === 201) {
        textarea.value = "";
        const { newCommentId } = await response.json();
        addComment(text, newCommentId);
    }
};

if (form) {
    form.addEventListener("submit", handleSubmit);
}