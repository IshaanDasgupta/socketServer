const Message = require('../model/Message');

const createMessage = async(req , res , next) =>{
    try{
        const message = new Message(req.body);
        await message.save();
        res.status(200).send(message);
    }
    catch(err){
        next(err);
    }
}

const fetchMessageOfChat = async(req,res,next) => {
    try{
        const messages = await Message.find({chatID: req.params.chatID})
        res.status(200).send(messages);
    }
    catch(err){
        next(err);
    }
}

module.exports = {createMessage , fetchMessageOfChat};