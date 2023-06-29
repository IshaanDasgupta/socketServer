const jwt = require('jsonwebtoken');
const createError = require('./error');

const verifyToken = (req,res,next)=>{
    const token = req.cookies.accessToken;
    if (!token){
        return next(createError(400,"You are not authenticated"));
    }

    jwt.verify(token, process.env.JWT_SECRET, (err,user)=>{
        if(err){
            return next(createError(403,"Access token not valid"));
        }
        req.user = user;
        next();
    })
}

module.exports = {verifyToken};