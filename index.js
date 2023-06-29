const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const userRoutes = require('./routes/userRoutes');
const chatRoutes = require('./routes/chatRoutes');
const messageRoutes = require('./routes/messageRoutes');
const cors = require('cors');

const io = require('socket.io')(8000 , {
    cors :{
        origin: '*'
    }
})

const app = express();
dotenv.config();


const connect = async ()=>{
    try{
        mongoose.connect(process.env.MONGODB_URL);
        console.log("Connected to MongoDB database");
    }
    catch(err){
        throw err;
    }
}

//middleware

app.use(express.json());
app.use(cookieParser());
app.use(cors());

app.use('/api/user' , userRoutes);
app.use('/api/chat' , chatRoutes);
app.use('/api/message' , messageRoutes);

app.use((err,req,res,next)=>{
    const errStatus = err.status || 500;
    const errMessage = err.message || "something went worng!"
    return res.status(errStatus).json({
        sucess:false,
        status:errStatus,
        message:errMessage,
        stack:err.stack
    })
})


//socket logics
let activeUsers = [];

io.on('connection' , (socket) => {    
    socket.on('addUser' , (userId) => {
        if (!(activeUsers.some((user) => user.userId == userId))){
            activeUsers.push({
                userId: userId,
                socketId : socket.id
            })
        }
        io.emit('newActiveUser' , activeUsers)

    })

    socket.on('removeUser' , (userId) => {
        activeUsers = activeUsers.filter((user) => user.userId !== userId);

        io.emit('newActiveUser' , activeUsers);
    })

    socket.on('sendMessage' , (message) => {
        const {reciverID} = message;
        const user = activeUsers.find((user) => user.userId == reciverID);
        if (user){
            io.to(user.socketId).emit('recieveMessage' ,  {chatID : message.chatID , senderID: message.senderID , text : message.text});
        }
    })

    socket.on('disconnect' , () => {
        activeUsers = activeUsers.filter((user) => user.socketId !== socket.id);
    })
    
    socket.on('joinRoom' , (details) => {
        console.log(details);
        const {userId , roomId} = details;
        socket.join(roomId);
        socket.to(roomId).emit('userAddedToRoom' , userId);
    })
})

const port = process.env.PORT || 8800;

app.listen(port, ()=>{
    connect();
    console.log("server running on port 8800");
})