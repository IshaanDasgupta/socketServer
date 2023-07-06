const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const userRoutes = require('./routes/userRoutes');
const chatRoutes = require('./routes/chatRoutes');
const messageRoutes = require('./routes/messageRoutes');
const cors = require('cors');
const http = require('http');

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


const port = process.env.PORT || 8800;

const server = app.listen(port, ()=>{
    connect();
    console.log(`server running on port : ${port}`);
})



//socket logics

const io = require('socket.io')(server , {
    cors :{
        origin: '*'
    }
});

let activeUsers = [];
const rooms = {};
const socketToRoom = {};
const roomDetails = {};

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
        const roomID = socketToRoom[socket.id];
        let room = rooms[roomID];
        const userDetails = room.find((obj) => obj.socketID === socket.id);
        if (room){
            room = room.filter((obj) => obj.socketID !== socket.id);
            rooms[roomID] = room;
        }
        socket.broadcast.emit("userLeft" , userDetails);
    })

    socket.on('forceDisconnect' , (socketID) => {
        socket.disconnect();
    })

    socket.on('createRoom' , (payload) => {
        const {roomID , roomName , roomTimestamp} = payload;
        roomDetails[roomID] = {};
        roomDetails[roomID].roomName = roomName;
        roomDetails[roomID].roomTimestamp = roomTimestamp;
    })
    
    socket.on('joinRoom' , (payload) => {
        const {roomID , userMongoID } = payload;
        if (rooms[roomID]){
            rooms[roomID].push({socketID : socket.id , mongoID:userMongoID});
        }
        else{
            rooms[roomID] = [{socketID : socket.id , mongoID:userMongoID}];
        }
        socketToRoom[socket.id] = roomID;

        socket.join(roomID);

        const restUsers = rooms[roomID].filter((obj) => obj.socketID !== socket.id);
        if (restUsers){
            socket.emit("restUsersInRoom" , restUsers);
            socket.emit("roomDetails" , {roomName:roomDetails[roomID].roomName , roomName:roomTimestamp[roomID].roomTimestamp});
        }
    })

    socket.on("sendMessageInRoom" , (messageDetails) => {
        socket.to(messageDetails.roomID).emit("messageRecievedInRoom" , messageDetails);
    })

    socket.on("sendingMongoID" , (details) => {
        const {targetSocketID , senderMongoID}= details;
        socket.to(targetSocketID).emit("receivingMongoID" , senderMongoID);
    })
})

