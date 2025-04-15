const mongoose = require("mongoose");
const { Schema } = mongoose;
const commentSchema = new Schema(
  {
    content: { type: String, required: true },
    blogId: { type: mongoose.SchemaTypes.ObjectId, ref: "Blog" }, //forign key//References the Blog model (blogId)
    authorId: { type: mongoose.SchemaTypes.ObjectId, ref: "User" }, //forign key//References the User model (userId)
  },
  { timestamps: true }
);

module.exports = mongoose.model("comment", commentSchema, "comments");
