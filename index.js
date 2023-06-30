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
        console.log("dcing " , socket.id);
        console.log("before dc room " ,rooms[roomID]);
        let room = rooms[roomID];
        if (room){
            console.log("room before filter " , room);
            room = room.filter((id) => id !== socket.id);
            console.log("room after filter " , room);
            rooms[roomID] = room;
        }
        console.log("after dc room " ,rooms[roomID]);
        console.log("--------------------------------------------");
    })
    
    socket.on('joinRoom' , (roomId) => {
        console.log(socket.id , "  joined room  :" , roomId);
        console.log("room before joining " , rooms[roomId]);
        if (rooms[roomId]){
            rooms[roomId].push(socket.id);
        }
        else{
            rooms[roomId] = [socket.id];
        }
        console.log("room after joining " , rooms[roomId]);
        socketToRoom[socket.id] = roomId;
        const restUsers = rooms[roomId].filter((id) => id !== socket.id);
        console.log("rest users ", restUsers);
        console.log("--------------------------------------------");
        if (restUsers){
            socket.emit("allUsers" , restUsers);
            socket.to(restUsers).emit("userJoined" , socket.id);        
        }
    })

    socket.on('offer' ,  payload => {
        io.to(payload.target).emit('userJoined' , payload);
    })

    socket.on('answer' , payload => {
        io.to(payload.target).emit('answer' , payload);
    })

    socket.on("ice-candidate" , incoming => {
        io.to(incoming.target).emit('ice-candidate' , incoming.candidate);
    })
})

