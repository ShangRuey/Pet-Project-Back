const express = require("express");
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");
const fs = require("fs");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const http = require("http");
const { Server } = require("socket.io");
const schedule = require("node-schedule");

const app = express();
const PORT = process.env.PORT || 5000;
const SECRET_KEY = process.env.SECRET_KEY || "your_secret_key";

app.use("/images", express.static("public/images"));
app.use(bodyParser.json());
app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);
app.use(cookieParser());

const data = JSON.parse(fs.readFileSync("./data.json", "utf8"));
const users = data.users;
const carts = data.carts;
const adoptionRequests = data.adoptionRequests || [];
const orders = data.orders || [];

// New data for markers
let markers = [];

// Authenticate user and generate JWT token
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  const user = users.find(
    (u) => u.username === username && u.password === password
  );

  if (user) {
    const token = jwt.sign({ userId: user.id }, SECRET_KEY, {
      expiresIn: "30d",
    });
    res.cookie("token", token, {
      httpOnly: true,
      secure: false, // 在開發時設為 false，生產環境中設為 true
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

// 回傳所有產品
app.get("/products", (req, res) => {
  res.json(data.products);
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
      id: user.id,
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

// 獲取標記資料
app.get("/markers", (req, res) => {
  res.json(markers);
});

// New marker route
app.post("/markers", (req, res) => {
  const { title, position } = req.body;
  const newMarker = {
    id: markers.length + 1,
    title,
    position,
    comments: [],
  };
  markers.push(newMarker);
  data.markers = markers;
  fs.writeFileSync("./data.json", JSON.stringify(data, null, 2));
  res.json(newMarker);
});

// 添加留言
app.post("/markers/:id/comments", authenticateToken, (req, res) => {
  const markerId = parseInt(req.params.id);
  const { comment } = req.body;
  const userId = req.user.userId;
  const user = users.find((u) => u.id === userId);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const marker = markers.find((m) => m.id === markerId);
  if (marker) {
    const commentWithUser = `${user.fullname}: ${comment}`;
    marker.comments.push(commentWithUser);
    data.markers = markers;
    fs.writeFileSync("./data.json", JSON.stringify(data, null, 2));
    res.json(marker);
  } else {
    res.status(404).send("Marker not found");
  }
});

// 刪除標記
app.delete("/markers/:id", (req, res) => {
  const markerId = parseInt(req.params.id);
  const markerIndex = markers.findIndex((m) => m.id === markerId);

  if (markerIndex !== -1) {
    markers.splice(markerIndex, 1);
    data.markers = markers;
    fs.writeFileSync("./data.json", JSON.stringify(data, null, 2));
    res.json({ message: "Marker deleted successfully" });
  } else {
    res.status(404).send("Marker not found");
  }
});

// 獲取用戶購物車資料
app.get("/cart", authenticateToken, (req, res) => {
  const userId = req.user.userId;
  const userCart = carts.find((cart) => cart.userId === userId);

  if (userCart) {
    res.json(userCart.items);
  } else {
    res.json([]);
  }
});

// 新增或更新購物車項目
app.post("/cart", authenticateToken, (req, res) => {
  const userId = req.user.userId;
  const { items } = req.body;
  const userCartIndex = carts.findIndex((cart) => cart.userId === userId);

  if (userCartIndex > -1) {
    carts[userCartIndex].items = items;
  } else {
    carts.push({ userId, items });
  }

  fs.writeFileSync("./data.json", JSON.stringify(data, null, 2));
  res.json({ message: "購物車更新成功" });
});

// 結帳處理
app.post("/checkout", authenticateToken, (req, res) => {
  const { cartItems } = req.body;
  const products = data.products;

  // 檢查庫存是否充足
  for (let item of cartItems) {
    const product = products.find((p) => p.id === item.id);
    if (!product || product.stock < item.amount) {
      return res.status(400).json({ message: `庫存不足: ${item.name}` });
    }
  }

  // 更新庫存
  for (let item of cartItems) {
    const product = products.find((p) => p.id === item.id);
    product.stock -= item.amount;
  }

  // 紀錄訂單
  const userId = req.user.userId;
  const user = users.find((u) => u.id === userId);
  const orderItems = cartItems.map((item) => ({
    productId: item.id,
    name: item.name,
    price: item.price,
    amount: item.amount,
  }));
  const totalPrice = orderItems.reduce(
    (sum, item) => sum + item.price * item.amount,
    0
  );
  const newOrder = {
    orderId: orders.length + 1,
    userId: user.id,
    items: orderItems,
    totalPrice,
    orderDate: new Date().toISOString(),
    status: "completed",
    shippingDetails: {
      address: user.address,
      phone: user.phone,
      email: user.email,
    },
  };
  orders.push(newOrder);

  // 清空購物車
  const userCartIndex = carts.findIndex((cart) => cart.userId === userId);
  if (userCartIndex > -1) {
    carts[userCartIndex].items = [];
  }

  // 保存更新後的資料
  fs.writeFileSync("./data.json", JSON.stringify(data, null, 2));

  res.json({ message: "結帳成功" });
});

// 確認 JWT token 是否有效的路由
app.get("/check-auth", authenticateToken, (req, res) => {
  res.sendStatus(200); // 如果 token 有效，返回 200 狀態碼
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

// 設定處理認養請求的路由
app.post("/adopt", authenticateToken, (req, res) => {
  const { userId, animalId } = req.body;
  const user = users.find((u) => u.id === userId);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  // 確保用戶尚未申請認養過該動物
  const existingRequest = adoptionRequests.find(
    (request) => request.userId === userId && request.animalId === animalId
  );
  if (existingRequest) {
    return res
      .status(400)
      .json({ message: "You have already applied to adopt this animal" });
  }

  // 新增認養請求
  const newRequest = {
    userId,
    animalId,
    timestamp: new Date().toISOString(),
  };
  adoptionRequests.push(newRequest);
  fs.writeFileSync("./data.json", JSON.stringify(data, null, 2));

  res.json({
    success: true,
    message: "Adoption request submitted successfully",
  });
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
