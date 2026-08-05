# 📖 API Endpoints Reference - All 24 Endpoints

---

## 🔐 AUTHENTICATION (6 Endpoints)

### 1. Register User
```
POST /api/auth/register

Body:
{
  "email": "user@example.com",
  "password": "Password123",
  "fullName": "John Doe"
}

Response:
{
  "status": "success",
  "user": { "id": "...", "email": "..." },
  "timestamp": "2026-07-30T10:00:00Z"
}
```

### 2. Login
```
POST /api/auth/login

Body:
{
  "email": "user@example.com",
  "password": "Password123"
}

Response:
{
  "status": "success",
  "user": { "id": "...", "email": "..." },
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}
```

### 3. Get Current User
```
GET /api/auth/me

Header: Authorization: Bearer <TOKEN>

Response:
{
  "status": "success",
  "user": { "id": "...", "email": "...", "fullName": "..." }
}
```

### 4. Update Profile
```
PUT /api/auth/profile

Header: Authorization: Bearer <TOKEN>

Body:
{
  "fullName": "New Name",
  "avatarUrl": "https://..."
}

Response: { "status": "success", "user": {...} }
```

### 5. Get Preferences
```
GET /api/auth/preferences

Header: Authorization: Bearer <TOKEN>

Response:
{
  "status": "success",
  "preferences": {
    "theme": "light",
    "timezone": "UTC",
    "language": "en"
  }
}
```

### 6. Update Preferences
```
PUT /api/auth/preferences

Header: Authorization: Bearer <TOKEN>

Body:
{
  "theme": "dark",
  "timezone": "America/New_York",
  "language": "en"
}

Response: { "status": "success", "preferences": {...} }
```

---

## 👥 ACCOUNT MANAGEMENT (5 Endpoints)

### 7. List All Accounts
```
GET /api/accounts

Header: Authorization: Bearer <TOKEN>

Response:
{
  "status": "success",
  "accounts": [
    {
      "id": "...",
      "platform": "instagram",
      "accountName": "johndoe",
      "followersCount": 5000,
      "status": "connected"
    }
  ],
  "count": 1
}
```

### 8. Add New Account
```
POST /api/accounts

Header: Authorization: Bearer <TOKEN>

Body:
{
  "platform": "instagram",
  "accountName": "johndoe",
  "profileId": "12345678",
  "profileUrl": "https://instagram.com/johndoe",
  "accessToken": "AAAA...",
  "refreshToken": "BBBB..."
}

Response: { "status": "success", "account": {...} }
```

### 9. Get Account Details
```
GET /api/accounts/:accountId

Header: Authorization: Bearer <TOKEN>

Response: { "status": "success", "account": {...} }
```

### 10. Update Account
```
PUT /api/accounts/:accountId

Header: Authorization: Bearer <TOKEN>

Body:
{
  "accountName": "new_name",
  "followersCount": 6000
}

Response: { "status": "success", "account": {...} }
```

### 11. Disconnect Account
```
DELETE /api/accounts/:accountId

Header: Authorization: Bearer <TOKEN>

Response: { "status": "success", "message": "Account disconnected" }
```

---

## 📝 POST MANAGEMENT (7 Endpoints)

### 12. List Posts
```
GET /api/posts?status=draft&limit=20&offset=0

Header: Authorization: Bearer <TOKEN>

Response:
{
  "status": "success",
  "posts": [
    {
      "id": "...",
      "content": "My post",
      "status": "draft",
      "scheduledAt": null,
      "publishedAt": null
    }
  ],
  "pagination": { "total": 50, "limit": 20, "offset": 0 }
}
```

### 13. Create Post
```
POST /api/posts

Header: Authorization: Bearer <TOKEN>

Body:
{
  "content": "Check this out!",
  "mediaUrls": ["https://..."],
  "contentType": "text",
  "aiGenerated": false,
  "platforms": []
}

Response: { "status": "success", "post": {...} }
```

### 14. Get Post Details
```
GET /api/posts/:postId

Header: Authorization: Bearer <TOKEN>

Response: { "status": "success", "post": {...} }
```

### 15. Update Post
```
PUT /api/posts/:postId

Header: Authorization: Bearer <TOKEN>

Body:
{
  "content": "Updated content",
  "mediaUrls": ["https://..."]
}

Response: { "status": "success", "post": {...} }
```

### 16. Delete Post
```
DELETE /api/posts/:postId

Header: Authorization: Bearer <TOKEN>

Response: { "status": "success", "message": "Post deleted" }
```

### 17. Schedule Post
```
POST /api/posts/:postId/schedule

Header: Authorization: Bearer <TOKEN>

Body:
{
  "scheduledAt": "2026-08-01T15:00:00Z",
  "platforms": ["instagram", "twitter"]
}

Response: { "status": "success", "post": {...} }
```

### 18. Get Scheduled Posts
```
GET /api/posts/scheduled/list?limit=10

Header: Authorization: Bearer <TOKEN>

Response:
{
  "status": "success",
  "posts": [{ "id": "...", "scheduledAt": "...", "status": "scheduled" }]
}
```

---

## 📊 ANALYTICS (4 Endpoints)

### 19. Dashboard Metrics
```
GET /api/analytics/dashboard

Header: Authorization: Bearer <TOKEN>

Response:
{
  "status": "success",
  "metrics": {
    "totalFollowers": 15500,
    "scheduledPosts": 8,
    "publishedPosts": 45,
    "averageEngagement": 4.25,
    "totalAccounts": 3
  }
}
```

### 20. Account Analytics
```
GET /api/analytics/accounts/:accountId?startDate=2026-07-01&endDate=2026-07-31

Header: Authorization: Bearer <TOKEN>

Response:
{
  "status": "success",
  "analytics": [
    {
      "date": "2026-07-30",
      "followersCount": 5500,
      "likesCount": 250,
      "commentsCount": 45,
      "impressions": 15000,
      "engagementRate": 2.15
    }
  ],
  "count": 30
}
```

### 21. Top Performing Posts
```
GET /api/analytics/top-posts?limit=10

Header: Authorization: Bearer <TOKEN>

Response:
{
  "status": "success",
  "posts": [
    {
      "id": "...",
      "content": "...",
      "avgEngagement": 8.5,
      "totalLikes": 500,
      "totalImpressions": 25000
    }
  ]
}
```

### 22. Record Analytics
```
POST /api/analytics/record

Header: Authorization: Bearer <TOKEN>

Body:
{
  "accountId": "...",
  "analyticsData": {
    "date": "2026-07-30",
    "followersCount": 5500,
    "likesCount": 250,
    "impressions": 15000,
    "engagementRate": 2.15
  }
}

Response: { "status": "success", "analytics": {...} }
```

---

## 🔧 SYSTEM (2 Endpoints)

### 23. Health Check
```
GET /api/health

Response:
{
  "status": "OK",
  "timestamp": "2026-07-30T10:00:00Z",
  "uptime": 123.45,
  "environment": "development"
}
```

### 24. Version Info
```
GET /api/version

Response:
{
  "version": "1.0.0",
  "name": "Social Media Automation Platform",
  "timestamp": "2026-07-30T10:00:00Z"
}
```

---

## 🧪 TESTING WITH CURL

```bash
# Health check
curl http://localhost:5000/api/health

# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123456","fullName":"Test"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123456"}'

# Get profile (use token from login)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/auth/me

# List posts
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/posts

# Create post
curl -X POST http://localhost:5000/api/posts \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content":"My first post","platforms":[]}'
```

---

## ✅ SUMMARY

**Total: 24 Endpoints**
- 6 Authentication
- 5 Account Management
- 7 Post Management
- 4 Analytics
- 2 System

**All Fully Working!**

---

**Status:** ✅ Production Ready
