const User = require('../model/User');
const createError = require('../utils/error');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Chat = require('../model/Chat');

const registerUser = async (req, res, next) => {
    try{
        req.body.password = bcryptjs.hashSync(req.body.password , 8);
        const user = new User(req.body);
        await user.save();
        res.status(200).send(user);
    }
    catch(err){
        next(err);
    }
}

const loginUser = async ( req, res,next)=>{
    try{
        const user = await User.findOne({email:req.body.email});
        if (!user){
            return next(createError(400, "incorrect email or password"));
        }
        
        const isPasswordCorrect = await bcryptjs.compare(req.body.password,user.password);
        if (!isPasswordCorrect){
            return next(createError(400, "incorrect email or password"));
        }

        const token = jwt.sign({id:user._id}, process.env.JWT_SECRET);
        
        const {password,...otherDetails} = user._doc;
        res.cookie("accessToken",token,{httpOnly:true}).status(201).send({...otherDetails});
    }catch(err){
        next(err);
    }
}

const logoutUser = async (req,res,next)=>{
    try{
        res.clearCookie("accessToken").status(200).send({"message" : "success"});
    }
    catch(err){
        next(err);
    }
}

const fetchUserByEmail = async(req , res , next) => {
    try{
        const user = await User.find({"email": req.body.email});
        res.status(200).send(user);
    }
    catch(err){
        next(err);
    }
}

const fetchUser = async(req , res , next) => {
    try{
        const user = await User.findById(req.params.id);
        res.status(200).send(user);
    }
    catch(err){
        next(err);
    }
}

const fetchProfile = async(req , res , next) => {
    try{
        const user = await User.findById(req.user.id);
        res.status(200).send(user);
    }
    catch(err){
        next(err);
    }
}

const updateUser = async(req , res , next) => {
    try{
        if (req.body.password){
            req.body.password = bcryptjs.hashSync(req.body.password , 8);
        }
        const user = await User.findByIdAndUpdate(req.user.id, {$set : req.body} , {new:true});
        res.status(200).send(user);
    }
    catch(err){
        next(err);
    }
}

const deleteUser = async(req , res , next) => {
    try{
        const user = await User.findByIdAndDelete(req.user.id);
        res.clearCookie("accessToken");
        res.status(200).send(user);
    }
    catch(err){
        next(err);
    }
}


module.exports = {registerUser , loginUser , logoutUser , fetchUserByEmail , fetchUser , fetchProfile , updateUser , deleteUser};