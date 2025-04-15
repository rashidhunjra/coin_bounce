const Joi = require("joi");
const User = require("../models/user");
const bcrypt = require("bcrypt");
const UserDTO = require("../DTOs/user");
const JWTService = require("../services/JWTservices");
const RefreshToken = require("../models/token");
const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,25}/;

const authController = {
  // RegisterrefreshToken
  async register(req, res, next) {
    // validate the user input
    const userRegisterSchema = Joi.object({
      username: Joi.string().min(5).max(30).required(),
      name: Joi.string().max(30).required(),
      email: Joi.string().email().required(),
      password: Joi.string().pattern(passwordPattern).required(),
      confirmPassword: Joi.ref("password"),
    });
    const { error } = userRegisterSchema.validate(req.body);
    if (error) {
      return next(error);
    }
    // if mail or username already registered
    const { username, name, email, password } = req.body;
    try {
      const emailInUse = await User.exists({ email });
      const usernameInUse = await User.exists({ username });

      if (emailInUse) {
        const error = {
          status: 409,
          message: "Email already resjistered, use another email",
        };
        return next(error);
      }

      if (usernameInUse) {
        const error = {
          status: 409,
          message: "Username already exists, choose another username",
        };
        return next(error);
      }
    } catch (error) {
      return next(error);
    }
    // password hashing
    const hashedPassword = await bcrypt.hash(password, 10);
    // store user data in db
    let accessToken;
    let refreshToken;

    let user;

    try {
      const userToRegister = new User({
        username: username,
        name,
        email,
        password: hashedPassword,
      });
      user = await userToRegister.save();
      // token Generation
      accessToken = JWTService.signAccessToken({ _id: user._id }, "30m");
      refreshToken = JWTService.signRefreshToken({ _id: user._id }, "60m");
    } catch (error) {
      return next(error);
    }

    // store refresh token in db
    await JWTService.storeRefreshToken(refreshToken, user._id);
    // send tokens in cookie
    res.cookie("accessToken", accessToken, {
      maxAge: 1000 * 60 * 60 * 24,
      httpOnly: true,
    });

    res.cookie("refreshToken", refreshToken, {
      maxAge: 1000 * 60 * 60 * 24,
      httpOnly: true,
    });

    const userDto = new UserDTO(user);

    // response send
    return res.status(201).json({ user: userDto, auth: true });
  },

  // Login
  async login(req, res, next) {
    // validate the user input
    // if validation error then return error message
    const userLoginSchema = Joi.object({
      username: Joi.string().min(5).max(30).required(),
      password: Joi.string().pattern(passwordPattern),
    });
    const { error } = userLoginSchema.validate(req.body);
    if (error) {
      return next(error);
    }

    const { username, password } = req.body;
    // const username = req.body.username
    // const password = res.body.password
    let user;
    //match username and  password
    try {
      // username match
      user = await User.findOne({ username: username });

      if (!user) {
        const error = {
          status: 401,
          message: "Invalid username",
        };
        return next(error);
      }
      // password match
      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        const error = {
          status: 401,
          message: "Invalid password",
        };
        return next(error);
      }
    } catch (error) {
      return next(error);
    }

    const accessToken = JWTService.signAccessToken({ _id: user._id }, "30m");
    const refreshToken = JWTService.signRefreshToken({ _id: user._id }, "60m");

    //update refresh token  in database
    try {
      await RefreshToken.updateOne(
        { _id: user._id },
        { token: refreshToken },
        { upsert: true }
      );
    } catch (error) {
      return next(error);
    }

    res.cookie("accessToken", accessToken, {
      maxAge: 1000 * 60 * 60 * 24,
      httpOnly: true,
    });

    res.cookie("refreshToken", refreshToken, {
      maxAge: 1000 * 60 * 60 * 24,
      httpOnly: true,
    });
    const userDto = new UserDTO(user);

    //response
    return res.status(200).json({ user: userDto, auth: true });
  },

  // Logout
  async logout(req, res, next) {
    const { refreshToken } = req.cookies;

    try {
      await RefreshToken.deleteOne({ token: refreshToken });
    } catch (error) {
      return next(error);
    }

    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    res.status(200).json({ user: null, auth: false });
  },

  refresh: async (req, res, next) => {
    //1.get refreshtoken from cookie
    const orignalRefreshToken = req.cookies.refreshToken;
    //2.verify refresh token
    let id;
    try {
      id = JWTService.verifyRefreshToken(orignalRefreshToken)._id;
    } catch (error) {
      if (error) {
        const error = {
          status: 401,
          message: "unauthorized",
        };
        return next(error);
      }
    }
    try {
      const match = RefreshToken.findOne({
        _id: id,
        token: orignalRefreshToken,
      });
      if (!match) {
        const error = {
          status: 401,
          message: "unauthorized",
        };
        return next(error);
      }
    } catch (error) {
      return next(error);
    }
    //3. generate new token
    try {
      const accessToken = JWTService.signAccessToken({ _id: id }, "30m");
      const refreshToken = JWTService.signRefreshToken({ _id: id }, "60m");
      await RefreshToken.updateOne({ _id: id });
      res.cookie("accessToken", accessToken, {
        maxAge: 1000 * 60 * 60 * 24,
        httpOnly: true,
      });
      res.cookie("refreshToken", refreshToken, {
        maxAge: 1000 * 60 * 60 * 24,
        httpOnly: true,
      });
    } catch (error) {
      return next(error);
    }

    //4.update database ,return respons
    const user = await User.findOne({ _id: id });
    const userDTO = new UserDTO(user);
    res.status(200).json({ user: userDTO, auth: true });
  },
};

module.exports = authController;
