const express = require("express");
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");
const fs = require("fs");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const http = require("http");
const { Server } = require("socket.io");
const schedule = require("node-schedule"); // 引入 node-schedule 模組

const app = express();
const PORT = 5000;
const SECRET_KEY = "your_secret_key";

app.use(bodyParser.json());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(cookieParser());

const data = JSON.parse(fs.readFileSync("./data.json", "utf8"));
const users = data.users;

// Authenticate user and generate JWT token
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  const user = users.find(
    (u) => u.username === username && u.password === password
  );

  if (user) {
    const token = jwt.sign({ userId: user.id }, SECRET_KEY);
    res.cookie("token", token, {
      httpOnly: false,
      secure: false,
      sameSite: "strict",
    });
    res.json({ token, message: "Login successful" });
  } else {
    res.status(401).json({ message: "Invalid username or password" });
  }
});

// 新增一個登出路由來清除 Cookies
app.post("/logout", (req, res) => {
  res.clearCookie("token");
  res.json({ message: "Logout successful" });
});

// Protect route with JWT
const authenticateToken = (req, res, next) => {
  const token = req.cookies.token;

  if (!token) return res.status(401).json({ message: "Token required" });

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.status(403).json({ message: "Invalid token" });

    req.user = user;
    next();
  });
};

// 更新密碼
app.post("/update-password", (req, res) => {
  const { username, phone, newPassword } = req.body;
  const userIndex = users.findIndex(
    (u) => u.username === username && u.phone === phone
  );

  if (userIndex === -1) {
    return res
      .status(404)
      .json({ message: "User not found or phone number does not match" });
  }

  users[userIndex].password = newPassword;
  fs.writeFileSync("./data.json", JSON.stringify(data, null, 2));
  res.clearCookie("token");
  res.json({ message: "Password updated successfully" });
});

// Register new user
app.post("/register", (req, res) => {
  const { username, password, fullname, email, phone, address } = req.body;

  // 檢查是否已有相同的用戶名
  const existingUser = users.find((u) => u.username === username);
  if (existingUser) {
    return res.status(400).json({ message: "Username already exists" });
  }

  // 新增用戶資料
  const newUser = {
    id: users.length + 1,
    username,
    password,
    fullname,
    email,
    phone,
    address,
  };
  users.push(newUser);
  fs.writeFileSync("./data.json", JSON.stringify(data, null, 2));
  res.status(201).json({ message: "User registered successfully" });
});

// 取得會員資料
app.get("/member-data", authenticateToken, (req, res) => {
  const userId = req.user.userId;
  const user = users.find((u) => u.id === userId);

  if (user) {
    res.json({
      username: user.username,
      fullname: user.fullname,
      email: user.email,
      phone: user.phone,
      address: user.address,
    });
  } else {
    res.status(404).json({ message: "User not found" });
  }
});

// 更新用戶資料
app.put("/update-member", authenticateToken, (req, res) => {
  const userId = req.user.userId;
  const { email, phone, address, fullname } = req.body;
  const userIndex = users.findIndex((u) => u.id === userId);

  if (userIndex === -1) {
    return res.status(404).json({ message: "User not found" });
  }

  users[userIndex].email = email;
  users[userIndex].phone = phone;
  users[userIndex].address = address;
  users[userIndex].fullname = fullname;
  fs.writeFileSync("./data.json", JSON.stringify(data, null, 2));

  res.json({ message: "Member updated successfully" });
});

app.get("/check-auth", authenticateToken, (req, res) => {
  res.sendStatus(200);
});

// 初始化聊天訊息文件
const chatDataFile = "./chatData.json";
if (!fs.existsSync(chatDataFile)) {
  fs.writeFileSync(chatDataFile, JSON.stringify({ messages: [] }, null, 2));
}

// 定期清除14天前的訊息
const clearOldMessages = () => {
  const now = new Date();
  const data = JSON.parse(fs.readFileSync(chatDataFile, "utf8"));
  data.messages = data.messages.filter(
    (message) =>
      new Date(message.timestamp) >= new Date(now - 14 * 24 * 60 * 60 * 1000)
  );
  fs.writeFileSync(chatDataFile, JSON.stringify(data, null, 2));
};

// 設置一個每天凌晨運行的定時任務
schedule.scheduleJob("0 0 * * *", clearOldMessages);

// 加載歷史訊息
app.get("/messages", (req, res) => {
  const data = JSON.parse(fs.readFileSync(chatDataFile, "utf8"));
  res.json(data.messages);
});

// WebSocket 部分
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  socket.on("message", (message) => {
    const data = JSON.parse(fs.readFileSync(chatDataFile, "utf8"));
    data.messages.push(message);
    fs.writeFileSync(chatDataFile, JSON.stringify(data, null, 2));

    io.emit("message", message);
  });
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
