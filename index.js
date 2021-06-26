require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;

const userRoute = require('./routes/user.route');
const chatRoute = require('./routes/chat.route');
const hobbyRoute = require('./routes/hobby.route');

const app = express();
app.use(cors());
const port = process.env.PORT || 8000;
// sockert io
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const User = require('./models/user.model');
const Chat = require('./models/chat.model');
const io = new Server(server, {
  cors: {
    origin: '*',
  }
});

mongoose.connect(
  process.env.MONGO_URL || "mongodb+srv://dvbtrung2302:dvbt230220@tinder.8g8li.mongodb.net/tinder?retryWrites=true&w=majority", 
  {
    useNewUrlParser: true, 
    useUnifiedTopology: true, 
    dbName: 'tinder',
    useFindAndModify: false
  }
);

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME || "dofqucuyy",
    api_key: process.env.CLOUDINARY_API_KEY || "734565226587339",
    api_secret: process.env.CLOUDINARY_API_SECRET || "hcu-UkcU4AQ6LfR_u0UCIDL_Nok",
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/user', userRoute);
app.use('/api/chat', chatRoute);
app.use('/api/hobby', hobbyRoute);

app.get('/', (req, res) => res.send('Hello World!'))

io.on('connection', async (socket) => {
  console.log('a user connected');
  // join
  socket.on("join", async ({token, userIds}) => {
    const verified = jwt.verify(token, process.env.TOKEN_SECRET || "super_cool_secret");
    const rooms = [];
    for (let userId of userIds) {
      const unique = [verified._id.toString(), userId.toString()].sort((a, b) => (a < b ? -1 : 1));
      const roomId = `${unique[0]}-${unique[1]}`;
      rooms.push(roomId);
    }
    socket.join(rooms);
    socket.emit("join-response", {
      status: 1,
      message: `Join room thành công`,
    })
  })
  // matching
  socket.on("like-user", async ({token, userId}) => {
    if (!token) {
      socket.emit("like-user-response", {
        status: 0,
        message: "Thiếu token"
      })
      return;
    }

    const verified = jwt.verify(token, process.env.TOKEN_SECRET || "super_cool_secret");
    const user = await User.findById(verified._id);
    const targetUser = await User.findById(userId);
    const verifiedUser = { ...user._doc };
    const verifiedTargetUser = { ...targetUser._doc };
    delete verifiedUser.password;
    delete verifiedTargetUser.password;
    if (!targetUser) {
      socket.emit("like-user-response", {
        status: 0,
        message: "Không tìm thấy người bạn thích"
      })
      return;
    }
    if (user) {
      if (user.matched_list.findIndex(item => item._id.toString() === userId.toString()) !== -1) {
        socket.emit("like-user-response", {
          status: 0,
          message: "Đã thích người này"
        })
        return;
      }
      await User.findByIdAndUpdate(verified._id, {matched_list: [
        ...user.matched_list,
        verifiedTargetUser
      ]})
      if (!targetUser.user_liked_you.includes(verified._id.toString())) {
        await User.findByIdAndUpdate(userId, {user_liked_you: [
          ...targetUser.user_liked_you,
          verified._id
        ]})
      }

      if (targetUser.matched_list.findIndex(item => item._id.toString() === verified._id.toString()) !== -1) {
        await User.findByIdAndUpdate(verified._id, {matching_list: [
          ...user.matching_list,
          verifiedTargetUser
        ]})
        await User.findByIdAndUpdate(userId, {matching_list: [
          ...targetUser.matching_list,
          verifiedUser
        ]}) 
        const unique = [verified._id.toString(), userId.toString()].sort((a, b) => (a < b ? -1 : 1));
        const roomId = `${unique[0]}-${unique[1]}`;
        socket.join(roomId);

        const matchingList_1 = await Promise.all([...user.matching_list].map(async (item) => {
          const unique = [verified._id.toString(), item._id.toString()].sort((a, b) => (a < b ? -1 : 1));
          const roomId = `${unique[0]}-${unique[1]}`;
          const message = await Chat.findOne({room_id: roomId});
          if (message) {
            return {
              ...item,
              had_message: true
            }
          } else {
            return {
              ...item,
              had_message: false
            }
          }
        }))

        const matchingList_2 = await Promise.all([...targetUser.matching_list].map(async (item) => {
          const unique = [userId.toString(), item._id.toString()].sort((a, b) => (a < b ? -1 : 1));
          const roomId = `${unique[0]}-${unique[1]}`;
          const message = await Chat.findOne({room_id: roomId});
          if (message) {
            return {
              ...item,
              had_message: true
            }
          } else {
            return {
              ...item,
              had_message: false
            }
          }
        }))

        socket.emit("like-user-response", {
          status: 1,
          message: "Đã tìm thấy người phù hợp",
          data: [
            ...matchingList_1,
            {...
              verifiedTargetUser,
              had_message: false
            }
          ]
        })
        socket.broadcast.to(roomId).emit("like-user-response", {
          status: 1,
          message: "Đã tìm thấy người phù hợp",
          data: [
            ...matchingList_2,
            {
              ...verifiedUser,
              had_message: false
            }
          ]
        })
        return;
      } else  {
        const unique = [verified._id.toString(), userId.toString()].sort((a, b) => (a < b ? -1 : 1));
        const roomId = `${unique[0]}-${unique[1]}`;
        socket.join(roomId);
      }
      socket.emit("like-user-response", {
        status: 1,
        message: "Thích người này thành công"
      })
      socket.broadcast.emit("like-user-response", {
        status: 1,
        message: "Đã có người thích bạn",
        user_id: userId,
        data: [
          ...user.user_liked_you,
          verified._id
        ]
      })
    }
  })
  // chat
  socket.on("send-message", async ({token, userId, message}) => {
    if (!token) {
      socket.emit("send-message-response", {
        status: 0,
        message: "Thiếu token"
      })
      return;
    }
    if (!userId) {
      socket.emit("send-message-response", {
        status: 0,
        message: "Thiếu UserId"
      })
      return;
    }
    if (!message.trim()) {
      socket.emit("send-message-response", {
        status: 0,
        message: "Thiếu tin nhắn"
      })
      return;
    }
    const verified = jwt.verify(token, process.env.TOKEN_SECRET || "super_cool_secret");
    const user = await User.findById(verified._id);
    const targetUser = await User.findById(userId);
    const verifiedUser = { ...user._doc };
    const verifiedTargetUser = { ...targetUser._doc };
    delete verifiedUser.password;
    delete verifiedTargetUser.password;
    
    const unique = [verified._id.toString(), userId.toString()].sort((a, b) => (a < b ? -1 : 1));
    const roomId = `${unique[0]}-${unique[1]}`;

    const data = new Chat({
      message,
      created_at: new Date(),
      user_post: verifiedUser,
      room_id: roomId
    })
    await data.save();
    const matchingList = await Promise.all([...verifiedTargetUser.matching_list].map(async (item) => {
      
      if (verified._id.toString() === item._id.toString()) {
        return {
          ...item,
          had_message: true
        }
      } else {
        return item
      }
    }))
    socket.broadcast.to(roomId).emit("send-message-response", {
      status: 1,
      message: "Có tin nhắn mới",
      data: data,
      can_matching_list: matchingList
    })
  })
  // disconnect
  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

server.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
});