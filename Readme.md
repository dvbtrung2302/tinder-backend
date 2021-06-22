# Backend Pets Tinder
```bash
url: https://pets-tinder.herokuapp.com
```
## Signup
```bash
POST: /api/user/signup
BODY: {
  "username": "abcxyz",
  "password": "123456",
  "full_name": "abcxyz",
  "confirmPassword": "123456"
}
```
## Login
```bash
POST: /api/user/login
BODY: {
  "username": "abcxyz",
  "password": "123456",
}
```
## Get profile
```bash
GET: /api/user
HEADER: {
  Authorization: "Bearer ${token}"
}
```
## Update Profile
```bash
PUT: /api/user/update
HEADER: {
  Authorization: "Bearer ${token}"
}
BODY: {
  "email": "baotrung23022000@gmail.com",
  "phone": "0906366223",
  "area": 10,
  "gender": 0 | 1,
  "bio": "Hút thuốc khi buồn",
  "address": "ở đâu còn lâu mới nói",
  "hobbies": ["id"]
}
```
## Upload Avatar
```bash
POST: /api/user/upload-avatar
HEADER: {
  Authorization: "Bearer ${token}"
}
BODY - FormData: {
  avatar: File
}
```

## Upload Photos
```bash
POST: /api/user/upload-photos
HEADER: {
  Authorization: "Bearer ${token}"
}
BODY - FormData: {
  photos: Array[Files]
}
```
## Delete Photo
```bash
POST: /api/user/delete-photo
HEADER: {
  Authorization: "Bearer ${token}"
}
BODY: {
  "photo": "abcxyz"
}
```

## Swipe Matching
```bash
SOCKET: socket.emit("like-user", {
  token: "abcxyz",
  userId: "abcxyz"
})
```

## Swipe Matching Response
```bash
SOCKET: socket.on("like-user-response", (data) => {})
```

## Get All Messages
```bash
GET: /api/chat?userId=abcxyz
HEADER: {
  Authorization: "Bearer ${token}"
}
```

## Join
```bash
SOCKET: socket.emit("join", {
  token: "abcxyz",
  userId: "abcxyz",
})
```
## Chat
```bash
SOCKET: socket.emit("send-message", {
  token: "abcxyz",
  userId: "abcxyz",
  message: "abcxyz
})
```

## Swipe Matching Response
```bash
SOCKET: socket.on("send-message-response", (data) => {})
```
## Get All Hobbies
```bash
GET: /api/hobby
HEADER: {
  Authorization: "Bearer ${token}"
}
```