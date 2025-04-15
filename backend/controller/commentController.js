const Joi = require("joi");
const commentDTO = require("../DTOs/commentDTO");
const Comment = require("../models/comment");
const mongodbIdPattern = /^[0-9a-fA-f]{24}$/;

const commentController = {
  create: async (req, res, next) => {
    const createComentSchema = Joi.object({
      content: Joi.string().required(),
      authorId: Joi.string().regex(mongodbIdPattern).required(),
      blogId: Joi.string().regex(mongodbIdPattern).required(),
    });
    const { error } = createComentSchema.validate(req.body);
    if (error) {
      return next(error);
    }
    const { content, authorId, blogId } = req.body;

    try {
      const newComment = new Comment({
        content,
        authorId,
        blogId,
      });
      await newComment.save();
    } catch (error) {
      return next(error);
    }
    return res.status(200).json({ message: "commenet created" });
  },
  getByid: async (req, res, next) => {
    const getByIdSchema = Joi.object({
      id: Joi.string().regex(mongodbIdPattern).required(),
    });
    const { error } = getByIdSchema.validate(req.params);
    if (error) {
      return next(error);
    }
    const { id } = req.params;
    let comments;
    try {
      comments = await Comment.find({ blogId: id });
    } catch (error) {
      return next(error);
    }
    let commentDto = [];
    for (let i = 0; i < comments.length; i++) {
      const obj = new commentDTO(comments[i]);
      commentDto.push(obj);
    }
    return res.status(200).json({ commentDto });
  },
};

module.exports = commentController;
