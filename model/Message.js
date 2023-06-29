const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
{
    chatID:{
        type:String
    },
    senderID:{
        type:String
    },
    text:{
        type:String
    }
},
{
    timestamps:true
})

module.exports = mongoose.model("Message" , messageSchema);