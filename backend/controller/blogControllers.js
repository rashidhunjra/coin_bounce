const Blog = require("../models/blog");
const Joi = require("joi");
const fs = require("fs");
const BlogDTO = require("../DTOs/blog");
const BlogDetailsDTO = require("../DTOs/blog-dtoDetails");
const { BACKEND_SERVER_PATH } = require("../config/index");
const Comment = require("../models/comment");
const blog = require("../models/blog");
const { default: mongoose } = require("mongoose");
const mongodbIdPattern = /^[0-9a-fA-f]{24}$/;

const blogController = {
  create: async (req, res, next) => {
    //1. validate request body
    //2. handle phtot storage,naming
    //3.add to db
    //4.response return
    const createBlogSchema = Joi.object({
      title: Joi.string().required(),
      author: Joi.string().regex(mongodbIdPattern).required(),
      content: Joi.string().required(),
      photoPath: Joi.string().required(), //phto from client side -> base64 encoded string->decode->store->save photo`path i  db//
    });

    const { error } = createBlogSchema.validate(req.body);
    if (error) {
      return next(error);
    }
    const { title, author, content, photoPath } = req.body;

    // Ensure storage directory exists
    if (!fs.existsSync("storage")) {
      fs.mkdirSync("storage", { recursive: true });
    }
    //read as buffer
    const buffer = Buffer.from(
      photoPath.replace(/^data:image\/(png|jpg|jpeg);base64,/, ""),
      "base64"
    );
    //allocate random name
    const imagePath = `${Date.now()}-${author}.png`;
    console.log("Saving image to:", `storage/${imagePath}`); // Debugging log
    //save locall
    try {
      fs.writeFileSync(`storage/${imagePath}`, buffer);
    } catch (e) {
      return next(e);
    }
    //save blog in db
    let newBlog; // blog object to be stored in db  // storing photo path in db as well  // photo path is stored in the form of server path  // client side sends photo path in base64 encoded format so we decode it and save it in server storage // and then save photo path in db // in db photo path is stored as server path  //
    try {
      newBlog = new Blog({
        title,
        author,
        content,
        photoPath: `${BACKEND_SERVER_PATH}/storage/${imagePath}`,
      });
      await newBlog.save();
    } catch (e) {
      return next(e);
    }
    const blogDTO = new BlogDTO(newBlog);
    return res.status(201).json({ blogs: blogDTO });
  },
  readAll: async (req, res, next) => {
    try {
      const blogs = await Blog.find({});
      const blogsDTO = [];
      for (let i = 0; i < blogs.length; i++) {
        const dto = new BlogDTO(blogs[i]);
        blogsDTO.push(dto);
      }
      // const blogsDTO = blogs.map(blog => new BlogDTO(blog));
      res.status(201).json({ blogs: blogsDTO });
    } catch (error) {
      return next(error);
    }
  },
  readById: async (req, res, next) => {
    const getByIdSchema = Joi.object({
      id: Joi.string().regex(mongodbIdPattern).required(),
    });

    const { error } = getByIdSchema.validate({ id: req.params.id });
    // const {error}=getByIdSchema.validate(req.params);
    if (error) {
      return next(error);
    }
    const { id } = req.params;
    let blog;
    try {
      blog = await Blog.findById({ _id: id }).populate("author");
      if (!blog) {
        return res.status(404).json({ message: "Blog not found" });
      }
    } catch (error) {
      return next(error);
    }

    const blogDetailsDTO = new BlogDetailsDTO(blog);
    return res.status(200).json({ blog: blogDetailsDTO });
  },

  update: async (req, res, next) => {
    //validate
    const blogUpdateSchema = Joi.object({
      title: Joi.string().required(),
      content: Joi.string().required(),
      author: Joi.string().regex(mongodbIdPattern).required(),
      blogId: Joi.string().regex(mongodbIdPattern).required(),
      photo: Joi.string(),
    });
    const { error } = blogUpdateSchema.validate(req.body);
    if (error) {
      return next(error);
    }
    const { title, content, author, blogId, photo } = req.body;

    let blog;
    try {
      blog = Blog.findOne({ _id: blogId });
    } catch (error) {
      return next(error);
    }
    //delete previous photo
    if (photo) {
      let previousPhoto = blog.photoPath;
      previousPhoto = previousPhoto.split("/").at(-1);
      fs.unlinkSync(`storage/${previousPhoto}`);
      //save new photo

      //read as buffer
      const buffer = Buffer.from(
        photoPath.replace(/^data:image\/(png|jpg|jpeg);base64,/, ""),
        "base64"
      );
      //allocate random name
      const imagePath = `${Date.now()}-${author}.png`;
      console.log("Saving image to:", `storage/${imagePath}`); // Debugging log
      //save locall
      try {
        fs.writeFileSync(`storage/${imagePath}`, buffer);
      } catch (e) {
        return next(e);
      }
      await Blog.updateOne(
        { _id: blogId },
        {
          title,
          content,
          photoPath: `${BACKEND_SERVER_PATH}/storage/${imagePath}`,
        }
      );
    } else {
      await Blog.updateOne({ _id: blogId }, { title, content });
    }
    //response
    return res.status(201).json({ message: "blog update successfully" });
  },
  delete: async (req, res, next) => {
    const deleteBlogSchema = Joi.object({
      id: Joi.string().regex(mongodbIdPattern).required(),
    });

    // Validate request parameters
    const { error } = deleteBlogSchema.validate(req.params);
    if (error) {
      return next(error);
    }

    const { id } = req.params;

    try {
      const deletedBlog = await Blog.findByIdAndDelete(id);

      if (!deletedBlog) {
        return res.status(404).json({ MESSAGE: "Blog not found" });
      }

      // If you need to delete related items, ensure you're targeting the correct field
      await Comment.deleteMany({ blogId: id });

      return res.status(200).json({ MESSAGE: "Blog deleted successfully" });
    } catch (error) {
      return next(error);
    }
  },
};

module.exports = blogController;
