const express = require("express");
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");
const fs = require("fs");
const cors = require("cors");
const cookieParser = require("cookie-parser");

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
  const { username, password, fullName, email, phone, address } = req.body;

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
    name: fullName,
    email,
    phone,
    address,
  };
  users.push(newUser);
  fs.writeFileSync("./data.json", JSON.stringify(data, null, 2));

  res.status(201).json({ message: "User registered successfully" });
});

app.get("/check-auth", authenticateToken, (req, res) => {
  res.sendStatus(200);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
