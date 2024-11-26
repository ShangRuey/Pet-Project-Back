const express = require("express");
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");
const fs = require("fs");
const cors = require("cors");
const cookieParser = require("cookie-parser"); // 引入 cookie-parser 套件

const app = express();
const PORT = 5000;
const SECRET_KEY = "your_secret_key";

app.use(bodyParser.json());

// 設置 CORS 配置
app.use(
  cors({
    origin: "http://localhost:5173", // 指定允許的來源
    credentials: true, // 允許攜帶憑證（cookie）
  })
);

app.use(cookieParser()); // 啟用 cookie-parser 中間件

// Load users and products data
const data = JSON.parse(fs.readFileSync("./data.json", "utf8"));
const users = data.users;
const products = data.products;

// Authenticate user and generate JWT token
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  const user = users.find(
    (u) => u.username === username && u.password === password
  );

  if (user) {
    const token = jwt.sign({ userId: user.id }, SECRET_KEY, {
      expiresIn: "1h",
    });
    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
    }); // 設置 cookie
    res.json({ message: "Login successful" });
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

app.get("/check-auth", authenticateToken, (req, res) => {
  res.sendStatus(200); // 如果經過 authenticateToken 驗證，回應 200
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
