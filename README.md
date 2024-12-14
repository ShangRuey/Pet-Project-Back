# Pet-Project-back

## 基本信息
- 服務端點: `http://localhost:5000`
- API 版本: `1.0`

## 驗證

我們使用 JWT Token 來驗證 API 請求。部分路由需要 Header 中包含你的 Token。

## 路由
- [登入](#登入)
- [註冊](#註冊)
- [取得會員資料](#取得會員資料)
- [更新會員資料](#更新會員資料)
- [更新密碼](#更新密碼)
- [取得產品資料](#取得產品資料)
- [取得購物車資料](#取得購物車資料)
- [更新購物車項目](#更新購物車項目)
- [結帳](#結帳)
- [取得地圖標記](#取得地圖標記)
- [新增地圖標記](#新增地圖標記)
- [添加地標留言](#添加地標留言)
- [刪除地圖地標](#刪除地圖地標)
- [載入聊天室歷史訊息](#載入聊天室歷史訊息)
- [認養請求](#認養請求)
- [檢查JWT](#checkJWT)
- [登出](#登出)



### 登入
- **URL**: `/login`
- **method**: `POST`
- **request-body**:
  ```json
  {
    "username": "你的用戶名",
    "password": "你的密碼"
  }
  ```
- **成功**:
  ```json
  {
  "token": "your_jwt_token",
  "message": "Login successful"
  }
  ```
- **失敗**:
  ```json
  {
  "message": "Invalid username or password"
  }
  ```

### 註冊
- **URL**: `/register`
- **method**: `POST`
- **request-body**:
  ```json
  {
  "username": "新用戶名",
  "password": "密碼",
  "fullname": "全名",
  "email": "郵箱",
  "phone": "電話號碼",
  "address": "地址"
  }
  ```
- **成功**:
  ```json
  {
  "message": "User registered successfully"
  }
  ```
- **失敗**:
  ```json
  {
  "message": "Username already exists"
  }
  ```

### 登出
- **URL**: `/logout`
- **method**: `POST`
- **成功**:
  ```json
  {
  "message": "User registered successfully"
  }
  ```

### 取得會員資料
- **URL**: `/member-data`
- **method**: `GET`
- **Header**
  ```
  Authorization: Bearer your_jwt_token
  ```
- **成功**:
  ```json
  {
  "id": "用戶id",
  "username": "用戶名",
  "fullname": "全名",
  "email": "郵箱",
  "phone": "電話號碼",
  "address": "地址"
  }
  ```
- **失敗**:
  ```json
  {
  "message": "User not found"
  }
  ```

### 更新會員資料
- **URL**: `/update-member`
- **method**: `PUT`
- **Header**
  ```
  Authorization: Bearer your_jwt_token
  ```
- **request-body**:
  ```json
  {
  "email": "新郵箱",
  "phone": "新電話號碼",
  "address": "新地址",
  "fullname": "新全名"
  }
  ```
- **成功**:
  ```json
  {
  "message": "Member updated successfully"
  }
  ```
- **失敗**:
  ```json
  {
  "message": "User not found"
  }
  ```

### 更新密碼
- **URL**: `/update-password`
- **method**: `POST`
- **request-body**:
  ```json
  {
  "username": "用戶名",
  "phone": "電話號碼",
  "newPassword": "新密碼"
  }
  ```
- **成功**:
  ```json
  {
  "message": "Password updated successfully"
  }
  ```
- **失敗**:
  ```json
  {
  "message": "User not found or phone number does not match"
  }
  ```

### 取得產品資料
- **URL**: `/products`
- **method**: `GET`
- **成功**:
  ```json
  [
  {
    "id": 1,
    "name": "產品名稱",
    "price": 100,
    "stock": 50
  }
  ]
  ```

### 取得購物車資料
- **URL**: `/cart`
- **method**: `GET`
- **Header**
  ```
  Authorization: Bearer your_jwt_token
  ```
- **成功**:
  ```json
  [
  {
    "productId": 1,
    "name": "產品名稱",
    "price": 100,
    "amount": 2
  }
  ]
  ```

### 更新購物車項目
- **URL**: `/cart`
- **method**: `POST`
- **Header**
  ```
  Authorization: Bearer your_jwt_token
  ```
- **request-body**:
  ```json
  {
  "items": [
    {
      "productId": 1,
      "name": "產品名稱",
      "price": 100,
      "amount": 2
    }
  ]
  }
  ```
- **成功**:
  ```json
  {
  "message": "購物車更新成功"
  }
  ```

### 結帳
- **URL**: `/checkout`
- **method**: `POST`
- **Header**
  ```
  Authorization: Bearer your_jwt_token
  ```
- **request-body**:
  ```json
  {
  "cartItems": [
    {
      "id": 1,
      "name": "產品名稱",
      "price": 100,
      "amount": 2
    }
  ]
  }
  ```
- **成功**:
  ```json
  {
  "message": "結帳成功"
  }
  ```
- **失敗**:
  ```json
  {
  "message": "庫存不足: 產品名稱"
  }
  ```

### 取得地圖標記
- **URL**: `/markers`
- **method**: `GET`
- **成功**:
  ```json
  [
  {
    "id": "markers.id",
    "title": "標題",
    "position": {
      "lat": 25.0330,
      "lng": 121.5654
    },
    "comments": []
  }
  ]
  ```

### 新增地圖標記
- **URL**: `/markers`
- **method**: `POST`
- **request-body**:
  ```json
  {
  "title": "標題",
  "position": {
    "lat": 25.0330,
    "lng": 121.5654
  }
  }
  ```
- **成功**:
  ```json
  {
  "id": 1,
  "title": "標題",
  "position": {
    "lat": 25.0330,
    "lng": 121.5654
  },
  "comments": []
  }
  ```

### 添加地標留言
- **URL**: `/markers/:id/comments`
- **method**: `POST`
- **Header**
  ```
  Authorization: Bearer your_jwt_token
  ```
- **request-body**:
  ```json
  {
  "comment": "留言內容"
  }
  ```
- **成功**:
  ```json
  {
  "id": 1,
  "title": "標題",
  "position": {
    "lat": 25.0330,
    "lng": 121.5654
  },
  "comments": ["全名: 留言內容"]
  }
  ```
- **失敗**:
  ```json
  {
  "message": "Marker not found"
  }
  ```

### 刪除地圖地標
- **URL**: `/markers/:id`
- **method**: `DELETE`
- **成功**:
  ```json
  {
  "message": "Marker deleted successfully"
  }
  ```
- **失敗**:
  ```json
  {
  "message": "Marker not found"
  }
  ```

### 載入聊天室歷史訊息
- **URL**: `/messages`
- **方法**: `GET`
- **成功響應**:
  ```json
  {
    "messages": [
      {
        "username": "用戶名",
        "message": "訊息內容",
        "timestamp": "2023-01-01T00:00:00.000Z"
      }
    ]
  }

### 認養請求
- **URL**: `/adopt`
- **method**: `POST`
- **Header**
  ```
  Authorization: Bearer your_jwt_token
  ```
- **request-body**:
  ```json
  {
  "userId": 1,
  "animalId": 1
  }
  ```
- **成功**:
  ```json
  {
  "success": true,
  "message": "Adoption request submitted successfully"
  }
  ```
- **失敗**:
  ```json
  {
  "message": "User not found"
  }
  ```
<a name="checkJWT"></a>
### 檢查JWT token 是否有效
- **URL**: `/check-auth`
- **method**: `GET`
- **Header**
  ```
  Authorization: Bearer your_jwt_token
  ```
- **成功**:
  ```json
  {
  "message": "Token is valid"
  }
  ```

  
