# API Endpoints - Complete Reference

**Social Media Automation Platform**  
**Version:** 1.0.0  
**Last Updated:** 2026-07-30

---

## 📋 Table of Contents

1. [Authentication Endpoints](#authentication-endpoints)
2. [Account Management](#account-management)
3. [Post Management](#post-management)
4. [Analytics Endpoints](#analytics-endpoints)
5. [Error Handling](#error-handling)
6. [Authentication](#authentication)
7. [Rate Limiting](#rate-limiting)

---

## Authentication Endpoints

### Register New User

**POST** `/api/auth/register`

Create a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "secure_password_123",
  "fullName": "John Doe"
}
```

**Response (201 Created):**
```json
{
  "status": "success",
  "message": "User created successfully",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "full_name": "John Doe",
    "status": "active",
    "created_at": "2026-07-30T10:00:00Z"
  },
  "timestamp": "2026-07-30T10:00:00Z"
}
```

**Validation:**
- Email must be unique
- Password minimum 6 characters
- Email must be valid format

---

### User Login

**POST** `/api/auth/login`

Authenticate user and receive JWT tokens.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "secure_password_123"
}
```

**Response (200 OK):**
```json
{
  "status": "success",
  "message": "Authentication successful",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "fullName": "John Doe",
    "status": "active"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "timestamp": "2026-07-30T10:00:00Z"
}
```

---

### Get Current User Profile

**GET** `/api/auth/me`

Get the current authenticated user's profile.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Response (200 OK):**
```json
{
  "status": "success",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "full_name": "John Doe",
    "avatar_url": "https://example.com/avatar.jpg",
    "role": "user",
    "status": "active",
    "created_at": "2026-07-30T10:00:00Z",
    "updated_at": "2026-07-30T10:00:00Z",
    "last_login": "2026-07-30T10:05:00Z"
  },
  "timestamp": "2026-07-30T10:00:00Z"
}
```

---

### Update User Profile

**PUT** `/api/auth/profile`

Update current user's profile information.

**Headers:**
```
Authorization: Bearer <accessToken>
Content-Type: application/json
```

**Request Body:**
```json
{
  "fullName": "John Updated",
  "avatarUrl": "https://example.com/new-avatar.jpg"
}
```

**Response (200 OK):**
```json
{
  "status": "success",
  "message": "Profile updated successfully",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "full_name": "John Updated",
    "avatar_url": "https://example.com/new-avatar.jpg",
    "role": "user",
    "status": "active",
    "updated_at": "2026-07-30T10:05:00Z"
  },
  "timestamp": "2026-07-30T10:05:00Z"
}
```

---

### Get User Preferences

**GET** `/api/auth/preferences`

Get user's application preferences.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Response (200 OK):**
```json
{
  "status": "success",
  "preferences": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "theme": "light",
    "timezone": "UTC",
    "language": "en",
    "notifications_enabled": true,
    "email_notifications": true,
    "push_notifications": true,
    "created_at": "2026-07-30T10:00:00Z",
    "updated_at": "2026-07-30T10:00:00Z"
  },
  "timestamp": "2026-07-30T10:00:00Z"
}
```

---

### Update User Preferences

**PUT** `/api/auth/preferences`

Update user's application preferences.

**Headers:**
```
Authorization: Bearer <accessToken>
Content-Type: application/json
```

**Request Body:**
```json
{
  "theme": "dark",
  "timezone": "America/New_York",
  "language": "en",
  "notificationsEnabled": false
}
```

**Response (200 OK):**
```json
{
  "status": "success",
  "message": "Preferences updated successfully",
  "preferences": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "theme": "dark",
    "timezone": "America/New_York",
    "language": "en",
    "notifications_enabled": false,
    "email_notifications": true,
    "push_notifications": true,
    "updated_at": "2026-07-30T10:05:00Z"
  },
  "timestamp": "2026-07-30T10:05:00Z"
}
```

---

## Account Management

### List Social Accounts

**GET** `/api/accounts`

Get all connected social media accounts for the user.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Response (200 OK):**
```json
{
  "status": "success",
  "accounts": [
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "user_id": "550e8400-e29b-41d4-a716-446655440000",
      "platform": "instagram",
      "account_name": "johndoe_official",
      "profile_id": "12345678",
      "profile_url": "https://instagram.com/johndoe_official",
      "profile_image_url": "https://example.com/profile.jpg",
      "followers_count": 5000,
      "status": "connected",
      "created_at": "2026-07-30T10:00:00Z",
      "updated_at": "2026-07-30T10:00:00Z"
    }
  ],
  "count": 1,
  "timestamp": "2026-07-30T10:00:00Z"
}
```

---

### Add Social Account

**POST** `/api/accounts`

Connect a new social media account.

**Headers:**
```
Authorization: Bearer <accessToken>
Content-Type: application/json
```

**Request Body:**
```json
{
  "platform": "instagram",
  "accountName": "johndoe_official",
  "profileId": "12345678",
  "profileUrl": "https://instagram.com/johndoe_official",
  "profileImageUrl": "https://example.com/profile.jpg",
  "followersCount": 5000,
  "accessToken": "AAAA...",
  "refreshToken": "BBBB...",
  "tokenType": "bearer",
  "expiresAt": "2026-08-30T10:00:00Z"
}
```

**Response (201 Created):**
```json
{
  "status": "success",
  "message": "instagram account connected successfully",
  "account": {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "platform": "instagram",
    "account_name": "johndoe_official",
    "status": "connected",
    "created_at": "2026-07-30T10:00:00Z"
  },
  "timestamp": "2026-07-30T10:00:00Z"
}
```

---

### Get Account Details

**GET** `/api/accounts/:accountId`

Get details for a specific social account.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**URL Parameters:**
- `accountId` (required) - UUID of the social account

**Response (200 OK):**
```json
{
  "status": "success",
  "account": {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "platform": "instagram",
    "account_name": "johndoe_official",
    "profile_id": "12345678",
    "profile_url": "https://instagram.com/johndoe_official",
    "profile_image_url": "https://example.com/profile.jpg",
    "followers_count": 5000,
    "status": "connected",
    "created_at": "2026-07-30T10:00:00Z",
    "updated_at": "2026-07-30T10:00:00Z"
  },
  "timestamp": "2026-07-30T10:00:00Z"
}
```

---

### Update Account

**PUT** `/api/accounts/:accountId`

Update social account information.

**Headers:**
```
Authorization: Bearer <accessToken>
Content-Type: application/json
```

**Request Body:**
```json
{
  "accountName": "johndoe_updated",
  "profileImageUrl": "https://example.com/new-profile.jpg",
  "followersCount": 5500,
  "status": "connected"
}
```

**Response (200 OK):**
```json
{
  "status": "success",
  "message": "Account updated successfully",
  "account": {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "account_name": "johndoe_updated",
    "followers_count": 5500,
    "updated_at": "2026-07-30T10:05:00Z"
  },
  "timestamp": "2026-07-30T10:05:00Z"
}
```

---

### Disconnect Account

**DELETE** `/api/accounts/:accountId`

Remove a social media account connection.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Response (200 OK):**
```json
{
  "status": "success",
  "message": "Account disconnected successfully",
  "timestamp": "2026-07-30T10:00:00Z"
}
```

---

## Post Management

### List Posts

**GET** `/api/posts`

Get user's posts with optional filtering.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Query Parameters:**
- `status` (optional) - Filter by status: draft, scheduled, published, failed
- `limit` (optional, default: 20) - Number of posts to return
- `offset` (optional, default: 0) - Number of posts to skip
- `sortBy` (optional, default: created_at) - Sort field

**Response (200 OK):**
```json
{
  "status": "success",
  "posts": [
    {
      "id": "770e8400-e29b-41d4-a716-446655440002",
      "user_id": "550e8400-e29b-41d4-a716-446655440000",
      "content": "Check out this amazing sunset! 🌅",
      "media_urls": ["https://example.com/sunset.jpg"],
      "scheduled_at": "2026-07-31T15:00:00Z",
      "published_at": null,
      "status": "scheduled",
      "content_type": "text",
      "ai_generated": false,
      "created_at": "2026-07-30T10:00:00Z",
      "updated_at": "2026-07-30T10:00:00Z"
    }
  ],
  "pagination": {
    "total": 25,
    "limit": 20,
    "offset": 0
  },
  "timestamp": "2026-07-30T10:00:00Z"
}
```

---

### Create Post

**POST** `/api/posts`

Create a new post.

**Headers:**
```
Authorization: Bearer <accessToken>
Content-Type: application/json
```

**Request Body:**
```json
{
  "content": "Check out this amazing sunset! 🌅",
  "mediaUrls": ["https://example.com/sunset.jpg"],
  "contentType": "text",
  "aiGenerated": false,
  "platforms": [
    { "accountId": "660e8400-e29b-41d4-a716-446655440001", "name": "instagram" },
    { "accountId": "660e8400-e29b-41d4-a716-446655440002", "name": "twitter" }
  ]
}
```

**Response (201 Created):**
```json
{
  "status": "success",
  "message": "Post created successfully",
  "post": {
    "id": "770e8400-e29b-41d4-a716-446655440002",
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "content": "Check out this amazing sunset! 🌅",
    "media_urls": ["https://example.com/sunset.jpg"],
    "status": "draft",
    "content_type": "text",
    "ai_generated": false,
    "created_at": "2026-07-30T10:00:00Z",
    "updated_at": "2026-07-30T10:00:00Z"
  },
  "timestamp": "2026-07-30T10:00:00Z"
}
```

---

### Get Post

**GET** `/api/posts/:postId`

Get details for a specific post.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Response (200 OK):**
```json
{
  "status": "success",
  "post": {
    "id": "770e8400-e29b-41d4-a716-446655440002",
    "content": "Check out this amazing sunset! 🌅",
    "status": "draft",
    "platforms": [
      {
        "id": "880e8400-e29b-41d4-a716-446655440003",
        "post_id": "770e8400-e29b-41d4-a716-446655440002",
        "platform": "instagram",
        "status": "pending",
        "created_at": "2026-07-30T10:00:00Z"
      }
    ]
  },
  "timestamp": "2026-07-30T10:00:00Z"
}
```

---

### Update Post

**PUT** `/api/posts/:postId`

Update an existing post (only for draft/scheduled posts).

**Headers:**
```
Authorization: Bearer <accessToken>
Content-Type: application/json
```

**Request Body:**
```json
{
  "content": "Updated sunset caption 🌅✨",
  "mediaUrls": ["https://example.com/sunset-new.jpg"],
  "status": "draft"
}
```

**Response (200 OK):**
```json
{
  "status": "success",
  "message": "Post updated successfully",
  "post": {
    "id": "770e8400-e29b-41d4-a716-446655440002",
    "content": "Updated sunset caption 🌅✨",
    "updated_at": "2026-07-30T10:05:00Z"
  },
  "timestamp": "2026-07-30T10:05:00Z"
}
```

---

### Delete Post

**DELETE** `/api/posts/:postId`

Delete a post (only for draft/scheduled posts).

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Response (200 OK):**
```json
{
  "status": "success",
  "message": "Post deleted successfully",
  "timestamp": "2026-07-30T10:00:00Z"
}
```

---

### Schedule Post

**POST** `/api/posts/:postId/schedule`

Schedule a post for future publication.

**Headers:**
```
Authorization: Bearer <accessToken>
Content-Type: application/json
```

**Request Body:**
```json
{
  "scheduledAt": "2026-07-31T15:00:00Z",
  "platforms": ["instagram", "twitter"]
}
```

**Response (200 OK):**
```json
{
  "status": "success",
  "message": "Post scheduled successfully",
  "post": {
    "id": "770e8400-e29b-41d4-a716-446655440002",
    "scheduled_at": "2026-07-31T15:00:00Z",
    "status": "scheduled",
    "updated_at": "2026-07-30T10:00:00Z"
  },
  "timestamp": "2026-07-30T10:00:00Z"
}
```

---

### Get Scheduled Posts

**GET** `/api/posts/scheduled/list`

Get all scheduled posts for the user.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Query Parameters:**
- `limit` (optional, default: 10) - Maximum number of posts

**Response (200 OK):**
```json
{
  "status": "success",
  "posts": [
    {
      "id": "770e8400-e29b-41d4-a716-446655440002",
      "content": "Scheduled post content",
      "scheduled_at": "2026-07-31T15:00:00Z",
      "status": "scheduled"
    }
  ],
  "timestamp": "2026-07-30T10:00:00Z"
}
```

---

## Analytics Endpoints

### Get Dashboard Metrics

**GET** `/api/analytics/dashboard`

Get overall analytics metrics.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Response (200 OK):**
```json
{
  "status": "success",
  "metrics": {
    "totalFollowers": 15500,
    "scheduledPosts": 8,
    "publishedPosts": 45,
    "averageEngagement": 4.25,
    "totalAccounts": 3,
    "connectedAccounts": 3,
    "disconnectedAccounts": 0
  },
  "timestamp": "2026-07-30T10:00:00Z"
}
```

---

### Get Account Analytics

**GET** `/api/analytics/accounts/:accountId`

Get analytics for a specific social account.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Query Parameters:**
- `startDate` (required) - Start date (YYYY-MM-DD)
- `endDate` (required) - End date (YYYY-MM-DD)

**Response (200 OK):**
```json
{
  "status": "success",
  "analytics": [
    {
      "id": "990e8400-e29b-41d4-a716-446655440004",
      "account_id": "660e8400-e29b-41d4-a716-446655440001",
      "date": "2026-07-30",
      "followers_count": 5500,
      "likes_count": 250,
      "comments_count": 45,
      "shares_count": 12,
      "impressions": 15000,
      "reach": 12500,
      "engagement_rate": 2.15,
      "metrics_json": {}
    }
  ],
  "count": 1,
  "timestamp": "2026-07-30T10:00:00Z"
}
```

---

### Get Top Performing Posts

**GET** `/api/analytics/top-posts`

Get the user's top performing posts.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Query Parameters:**
- `limit` (optional, default: 10) - Number of posts to return

**Response (200 OK):**
```json
{
  "status": "success",
  "posts": [
    {
      "id": "770e8400-e29b-41d4-a716-446655440002",
      "content": "Top performing post",
      "avg_engagement": 8.5,
      "total_likes": 500,
      "total_impressions": 25000
    }
  ],
  "timestamp": "2026-07-30T10:00:00Z"
}
```

---

## Error Handling

### Error Response Format

All errors follow this format:

```json
{
  "status": "error",
  "message": "Descriptive error message",
  "timestamp": "2026-07-30T10:00:00Z",
  "path": "/api/posts",
  "method": "GET"
}
```

### Common Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid input data |
| 401 | Unauthorized | Missing or invalid token |
| 404 | Not Found | Resource doesn't exist |
| 500 | Server Error | Internal server error |

---

## Authentication

### Token Format

All authenticated requests require the `Authorization` header:

```
Authorization: Bearer <JWT_TOKEN>
```

### Token Expiration

- **Access Token:** 24 hours (configurable via `JWT_EXPIRATION`)
- **Refresh Token:** 7 days (configurable via `REFRESH_TOKEN_EXPIRATION`)

### Refresh Token

When access token expires, use the refresh token to get a new one (endpoint coming soon).

---

## Rate Limiting

Rate limiting is configured per endpoint:

- **Default:** 100 requests per 15 minutes per IP
- **Authentication:** 5 requests per 15 minutes for login/register
- **Post Creation:** 50 requests per hour

Rate limit headers are included in responses:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1234567890
```

---

## Testing Endpoints

### Using cURL

```bash
# Health check
curl http://localhost:5000/api/health

# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","fullName":"Test User"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Get profile (with token)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/auth/me
```

### Using Postman

1. Import this collection in Postman
2. Set the base URL to `http://localhost:5000`
3. After login, copy the `accessToken` to the `Authorization` header
4. Test endpoints

---

**Built with ❤️ by Imran Pro Services**  
**Questions?** Contact: imran.it.support@gmail.com
