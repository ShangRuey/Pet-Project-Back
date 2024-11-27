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
      httpOnly: false, // 確保 Cookie 可以被 JavaScript 訪問
      secure: false, // 在開發環境中設置為 false，生產環境中設置為 true 並使用 HTTPS
      sameSite: "strict",
    });
    res.json({ token, message: "Login successful" });
  } else {
    res.status(401).json({ message: "Invalid username or password" });
  }
});

// 新增一個登出路由來清除 Cookies
app.post("/logout", (req, res) => {
  res.clearCookie("token"); // 清除名為 'token' 的 Cookie
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
  fs.writeFileSync("./data.json", JSON.stringify(data, null, 2)); // 保存到文件

  // 清除 Cookies 以強制登出
  res.clearCookie("token");
  res.json({ message: "Password updated successfully" });
});

app.get("/check-auth", authenticateToken, (req, res) => {
  res.sendStatus(200); // 如果經過 authenticateToken 驗證，回應 200
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
