const JWTservice=require('../services/JWTservices');
const User=require('../models/user');
const UserDto=require('../DTOs/user');


const auth = async (req, res, next) => {
    try {
        const { refreshToken, accessToken } = req.cookies;

        if (!refreshToken || !accessToken) {
            const error = {
                status: 401,
                message: 'Unauthorized'
            }
            return next(error);
        }
        let _id;
        try {
            _id = JWTservice.verifyAccessToken(accessToken)._id;
        }
        catch (error) {
            return next(error);
        }

        let user;
        try {
            user = await User.findOne({ _id: _id });
        } catch (error) {
            return next(error);
        }

        const userDto = new UserDto(user);

        req.user = userDto;

        next();
    } catch (error) {
        return next(error);
    }

}

module.exports = auth;