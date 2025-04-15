const express = require("express");
const auth = require("../middlewares/auth");
const router = express.Router();
const authControoler = require("../controller/authControllers");
const blogController = require("../controller/blogControllers");
const commentController = require("../controller/commentController");

//Testing

router.get("/test", (req, res) => res.json({ msg: "working!" }));

//user
//login
router.post("/login", authControoler.login);
//register
router.post("/register", authControoler.register);
//logout
router.post("/logout", auth, authControoler.logout);
//refresh
router.get("/refresh", auth, authControoler.refresh);
// blog
// CRUD
// create
router.post("/create", blogController.create);
// read all blogs
router.get("/read/all", auth, blogController.readAll);
//read blog by id
router.get("/read/id/:id", auth, blogController.readById);
//delete
router.delete("/delete/:id", auth, blogController.delete);
//update
router.put("/updateBlog", auth, blogController.update);
//comments
//create comment
router.post("/Comment", auth, commentController.create);
//read comments by blog id
router.get("/comment/:id", auth, commentController.getByid);

module.exports = router;
