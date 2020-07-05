require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');
const authRoutes = require('./routes/auth.js');
const Room = require('./models/rooms.js');


const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

mongoose.connection.once('open',() => {
  console.log("Database connected...");
});

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname,'public')));
app.use("/auth",authRoutes);
app.use((err,req,res,next)=>{
  if (err) {
    res.status(500).json({});
  }
});

io.of("/chat").on("connection",(socket)=>{

  socket.on("join",(ob)=>{

    Room.findOne({socket_Room:ob.id,password:ob.password}).exec((err,room)=>{
      if (err) console.log(err);
      if (room) {
        socket.join(ob.id, () => {
          socket.username = ob.username;
          socket.roomID = ob.id;
          io.of("/chat").in(socket.rooms[socket.roomID]).emit("newUser",ob.username);
        });
      }
    });


  });

  socket.on("msg",(ob)=>{
    io.of("/chat").in(socket.rooms[socket.roomID]).emit("updateLog",{updateLog:ob.txt,sender:ob.sender,date:new Date().getTime()});
  });

  socket.on("disconnect",() => {

    Room.findOne({socket_Room:socket.roomID}).exec((err,room)=>{
      if (err) console.log(err);
      if (room) {
        room.users.splice(room.users.indexOf(socket.username),1);
        room.save();
        io.of("/chat").in(socket.roomID).emit("userLeft",socket.username);
      }
    });

  });

  socket.on("sendToNewUser",(ob) => {

    io.of("/chat").in(socket.rooms[socket.roomID]).emit("addUser",ob.username);

  });


});




app.get("*",(req,res)=>{
  res.sendFile(path.join(__dirname,'public/index.html'));
});

server.listen(process.env.PORT,() => console.log('Listening on port 5000') );
