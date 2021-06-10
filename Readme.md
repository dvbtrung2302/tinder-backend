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
  "address": "ở đâu còn lâu mới nói"
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