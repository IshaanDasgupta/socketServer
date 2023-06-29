const Chat = require('../model/Chat');
const User = require('../model/User');
const createError = require('../utils/error');

const createChat = async (req, res , next) => {
    try{
        const chat = new Chat({
            members : [req.body.user1 , req.body.user2]
        });
        await chat.save();
        res.status(200).send(chat);
    }
    catch(err){
        next(err);
    }
}

const fetchChatForUser = async(req , res , next) => {
    try{
        const chats = await Chat.find({
            members : {$in: [req.params.userID]}
        })
        res.status(200).send(chats);
    }   
    catch(err){
        next(err);
    }
}

const fetchChat = async(req , res , next) => {
    try{
        const chat = await Chat.find({
            members: {$all : [req.params.user1 , req.params.user2]}
        })
        res.status(200).send(chat);
    }
    catch(err){
        next(err);
    }
}

module.exports = {createChat , fetchChatForUser , fetchChat};

