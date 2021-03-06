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
      message: `Join room th??nh c??ng`,
    })
  })
  // matching
  socket.on("like-user", async ({token, userId}) => {
    if (!token) {
      socket.emit("like-user-response", {
        status: 0,
        message: "Thi???u token"
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
        message: "Kh??ng t??m th???y ng?????i b???n th??ch"
      })
      return;
    }
    if (user) {
      if (user.matched_list.findIndex(item => item._id.toString() === userId.toString()) !== -1) {
        socket.emit("like-user-response", {
          status: 0,
          message: "???? th??ch ng?????i n??y"
        })
        return;
      }
      await User.findByIdAndUpdate(verified._id, {matched_list: [
        ...user.matched_list,
        verifiedTargetUser
      ]})


      if (targetUser.matched_list.findIndex(item => item._id.toString() === verified._id.toString()) !== -1) {
        await User.findByIdAndUpdate(verified._id, {matching_list: [
          ...user.matching_list,
          verifiedTargetUser
        ]})
        await User.findByIdAndUpdate(userId, {matching_list: [
          ...targetUser.matching_list,
          verifiedUser
        ]}) 
        if (verifiedUser.user_liked_you.findIndex(item => item._id.toString() === verifiedTargetUser._id.toString()) !== -1) {
          const new_user_liked_you = [...verifiedUser.user_liked_you];
          const index = new_user_liked_you.findIndex(item => item._id.toString() === verifiedTargetUser._id.toString())
          new_user_liked_you.splice(index, 1);
          await User.findByIdAndUpdate(verified._id, {user_liked_you: new_user_liked_you})
        }
        const unique = [verified._id.toString(), userId.toString()].sort((a, b) => (a < b ? -1 : 1));
        const roomId = `${unique[0]}-${unique[1]}`;
        socket.join(roomId);

        const matchingList_1 = await Promise.all([...user.matching_list].map(async (item) => {
          const unique = [verified._id.toString(), item._id.toString()].sort((a, b) => (a < b ? -1 : 1));
          const roomId = `${unique[0]}-${unique[1]}`;
          const message = await Chat.findOne({room_id: roomId}, {}, {sort: { 'created_at' : -1 }});
          if (message) {
            return {
              ...item,
              had_message: true,
              message
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
          const message = await Chat.findOne({room_id: roomId}, {}, {sort: { 'created_at' : -1 }});
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
          message: "???? t??m th???y ng?????i ph?? h???p",
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
          message: "???? t??m th???y ng?????i ph?? h???p",
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
        if (targetUser.user_liked_you.findIndex(item => item._id.toString() === verified._id.toString()) === -1) {
          await User.findByIdAndUpdate(userId, {user_liked_you: [
            ...targetUser.user_liked_you,
            verifiedUser
          ]})
        }
      }
      socket.emit("like-user-response", {
        status: 1,
        message: "Th??ch ng?????i n??y th??nh c??ng"
      })
      socket.broadcast.emit("like-user-response", {
        status: 1,
        message: "???? c?? ng?????i th??ch b???n",
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
        message: "Thi???u token"
      })
      return;
    }
    if (!userId) {
      socket.emit("send-message-response", {
        status: 0,
        message: "Thi???u UserId"
      })
      return;
    }
    if (!message.trim()) {
      socket.emit("send-message-response", {
        status: 0,
        message: "Thi???u tin nh???n"
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
      user_id: verifiedUser._id.toString(),
      room_id: roomId,
      is_seen: false
    })
    await data.save();
    const matchingList = await Promise.all([...verifiedTargetUser.matching_list].map(async (item) => {
      if (verified._id.toString() === item._id.toString()) {
        return {
          ...item,
          had_message: true,
          message: data
        }
      } else {
        return item
      }
    }))
    socket.broadcast.to(roomId).emit("send-message-response", {
      status: 1,
      message: "C?? tin nh???n m???i",
      data: data,
      matching_list: matchingList
    })
  })
  // seen 
  socket.on("seen-message", async ({token, userId}) => { 
    if (!token) {
      socket.emit("send-message-response", {
        status: 0,
        message: "Thi???u token"
      })
      return;
    }
    if (!userId) {
      socket.emit("send-message-response", {
        status: 0,
        message: "Thi???u UserId"
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
    const chat = await Chat.updateMany({ room_id: roomId, user_id: userId }, { is_seen: true });

    const returnedMatchingList = await Promise.all([...verifiedUser.matching_list].map(async (item) => {
      const unique = [verifiedUser._id.toString(), item._id.toString()].sort((a, b) => (a < b ? -1 : 1));
      const roomId = `${unique[0]}-${unique[1]}`;
      const message = await Chat.findOne({room_id: roomId}, {}, {sort: { 'created_at' : -1 }});

      if (message) {
        return {
          ...item,
          had_message: true,
          message
        }
      } else {
        return {
          ...item,
          had_message: false,
        }
      }
    }))
    socket.emit("seen-message-response", {
      status: 1,
      message: "Xem tin nh???n th??nh c??ng",
      data: returnedMatchingList
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