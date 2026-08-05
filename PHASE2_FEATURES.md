# Phase 2: Social Media Integration - Complete Feature Guide

**Status:** 🟡 In Progress (70% Complete)  
**Last Updated:** 2026-07-31  
**Version:** 1.0.0

---

## 📱 Overview

Phase 2 adds complete social media account management and posting capabilities to the platform. Users can connect their social media accounts, create posts, schedule publishing, and track engagement metrics.

### What's New

✅ **Social Account Management**
- Connect/disconnect social media accounts
- Support for 6 platforms (Facebook, Instagram, TikTok, Twitter, LinkedIn, YouTube)
- Secure token storage
- Account status tracking

✅ **Post Creation & Publishing**
- Create posts with media support
- Draft/schedule/publish workflow
- Multi-platform posting
- Post status tracking

✅ **Social Media Dashboard**
- Connected accounts overview
- Draft/scheduled/published post counts
- Platform statistics

---

## 🔗 Social Media Accounts

### Connecting an Account

1. Click **"🔗 Accounts"** in the sidebar or dashboard
2. Click **"+ Add Account"** button
3. Fill in the form:
   - **Platform:** Select from dropdown (Facebook, Instagram, etc.)
   - **Account Name:** Display name for your reference (e.g., "Marketing Account")
   - **Username:** The actual username on that platform (e.g., "@imranpro")
   - **Access Token:** API token from the social platform

4. Click **"✓ Connect Account"**

### Where to Get Tokens

#### Facebook
1. Go to https://developers.facebook.com/
2. Create app (Business type)
3. Get Page Access Token from App Roles → Page
4. Token format: `EAAT...` (long alphanumeric string)

#### Instagram
1. Use Facebook Login (Instagram uses Facebook Graph API)
2. Instagram Access Token comes from Facebook app
3. Same as Facebook process above

#### Twitter/X
1. Go to https://developer.twitter.com/
2. Apply for access (Academic/Business Account)
3. Create App and generate API Key + Secret
4. Generate Bearer Token from Keys and Tokens tab

#### TikTok
1. Go to https://developers.tiktok.com/
2. Register as Developer
3. Create Application
4. Get Client Key and Client Secret
5. Use OAuth flow to get Access Token

#### LinkedIn
1. Go to https://www.linkedin.com/developers/
2. Create app
3. Get Personal Access Token from app credentials
4. Required scopes: w_organization_social, w_member_social

#### YouTube
1. Go to https://console.developers.google.com/
2. Create Project
3. Enable YouTube Data API v3
4. Create OAuth 2.0 Client ID (Web)
5. Get API Key and OAuth tokens

### Managing Accounts

**View Connected Accounts:**
- Dashboard shows all connected accounts as cards
- Each card displays platform icon, account name, and username
- Shows connection date

**Delete Account:**
- Click trash icon (🗑️) on account card
- Account is soft-deleted (archived, not destroyed)
- Posts associated with account remain intact

**Update Token:**
- Click on account (edit mode - coming in Phase 2c)
- Update access token when it expires
- System will warn before token expiration

---

## 📝 Social Media Posts

### Creating a Post

1. Click **"📝 Posts"** in the sidebar
2. Click **"+ Create Post"** button
3. Fill in the form:
   - **Select Account:** Choose which social account to post from
   - **Post Content:** Write your message (up to 1000 characters visible)
   - **Platforms:** Select which platforms to post to
   - **Schedule (Optional):** Pick a date/time to auto-publish

4. Click **"✓ Save Post"** to save as draft

### Post Statuses

- **🟦 Draft** - Saved locally, not scheduled or published yet
- **🟦 Scheduled** - Queued to publish at specified time
- **🟩 Published** - Posted to social platform and live
- **🟥 Failed** - Error publishing (retry available)

### Publishing Options

#### Publish Immediately
1. Create post (leave Schedule empty)
2. Post appears in Draft status
3. Click "Publish Now" button
4. Post published instantly

#### Schedule for Later
1. Create post and fill in Schedule date/time
2. Or: Create draft → Click "Schedule" → Pick time
3. Post moves to Scheduled status
4. Auto-publishes at scheduled time

### Editing Posts

**Before Publishing:**
- Click post to edit content
- Modify platforms or schedule time
- Save changes

**After Publishing:**
- Cannot edit published posts (platform restriction)
- Can delete and re-post with changes
- Engagement metrics preserved in archive

### Deleting Posts

1. Click trash icon (🗑️) on post
2. Post soft-deleted (moved to archive)
3. Can restore from archive (coming in Phase 2c)
4. Engagement metrics preserved

---

## 📊 Analytics & Metrics

### Post Analytics (Coming Phase 2c)

Track engagement per post:
- **Likes** - Post reactions/likes count
- **Comments** - Number of comments received
- **Shares** - Number of times shared
- **Impressions** - Times post was shown
- **Reach** - Unique users who saw post
- **Click Rate** - Percentage of clicks on post

### Account Analytics (Coming Phase 2c)

Overall account performance:
- **Posts Published** - Total posts from account
- **Followers** - Account follower count
- **Engagement Rate** - Average engagement
- **Best Posts** - Top performing posts
- **Trends** - Growth trends over time

### Dashboard Overview

Main dashboard shows:
- Total connected social accounts
- Posts created (draft/scheduled/published)
- Platform breakdown
- Quick stats for each account

---

## 🚀 Quick Start Workflow

### 1. First Time Setup (5 minutes)

```
1. Visit Social Accounts page
2. Click "+ Add Account"
3. Get API token from Facebook (easiest to start)
4. Connect account
✅ Done! Account connected
```

### 2. Create First Post (2 minutes)

```
1. Visit Posts page
2. Click "+ Create Post"
3. Select your connected account
4. Write a test message
5. Select platform (Facebook)
6. Click "✓ Save Post"
✅ Post created as draft
```

### 3. Publish Immediately (1 minute)

```
1. On Posts page, find your draft post
2. Click "Publish Now"
✅ Post published instantly!
```

### 4. Schedule a Post (2 minutes)

```
1. Click "+ Create Post"
2. Fill in content and account
3. Set Schedule time (tomorrow at 10 AM)
4. Click "✓ Save Post"
✅ Post scheduled for tomorrow!
```

---

## 🔐 Security & Privacy

### Token Security
- Tokens stored encrypted in database
- Never displayed in UI after creation
- Tokens expire and refresh automatically
- Expired tokens trigger warning before failure

### Data Privacy
- Multi-client isolation (each client sees only their data)
- Row-level security enabled on production
- No token logs in backend
- HTTPS required for production

### Best Practices
- Use platform-specific tokens (not your personal password)
- Rotate tokens regularly
- Don't share tokens with others
- Delete unused account connections
- Monitor connected app permissions

---

## 🔄 API Reference

### Social Accounts Endpoints

```bash
# List all accounts
GET /api/social-accounts?clientId=abc123

# Create account (connect)
POST /api/social-accounts?clientId=abc123
{
  "platform": "facebook",
  "accountName": "My Business",
  "accountUsername": "@mybusiness",
  "accessToken": "EAAT..."
}

# Get account details
GET /api/social-accounts/{accountId}?clientId=abc123

# Update account
PUT /api/social-accounts/{accountId}?clientId=abc123
{
  "accountName": "Updated Name"
}

# Delete account
DELETE /api/social-accounts/{accountId}?clientId=abc123
```

### Posts Endpoints

```bash
# List posts
GET /api/posts?clientId=abc123&status=draft

# Create post
POST /api/posts?clientId=abc123
{
  "socialAccountId": "acc-123",
  "content": "Hello world!",
  "platforms": ["facebook", "instagram"],
  "scheduledAt": "2026-08-01T10:00:00Z"
}

# Update post
PUT /api/posts/{postId}?clientId=abc123
{
  "content": "Updated content"
}

# Publish post
POST /api/posts/{postId}/publish?clientId=abc123

# Schedule post
POST /api/posts/{postId}/schedule?clientId=abc123
{
  "scheduledAt": "2026-08-01T10:00:00Z"
}

# Delete post
DELETE /api/posts/{postId}?clientId=abc123
```

---

## 🛠️ Troubleshooting

### Account Connection Issues

**"Invalid token" error**
- Token expired or incorrect
- Copy token from platform again
- Ensure no extra spaces
- Verify token permissions in platform

**"Account not found"**
- Select correct platform
- Username may be different from display name
- Use @ prefix for Twitter handles
- Check platform requires authentication

### Post Publishing Issues

**"Cannot connect to platform"**
- Check internet connection
- Verify API token is valid
- Platform may be down (check status page)
- Try again in a few moments

**"Post published but not visible"**
- May be in moderation queue
- Check scheduled time was set correctly
- Post content may violate platform rules
- Spam filter might have caught it

**Schedule not working**
- Time must be in future (not past)
- Use UTC timezone or select explicitly
- Check browser timezone setting
- Ensure client system time is correct

### Account Disconnection

**"Account disconnected unexpectedly"**
- Token may have expired
- Platform may have revoked access
- Browser storage cleared
- Reconnect account with new token

---

## 📈 Roadmap (Phase 2 Continuation)

### Phase 2b (Next)
- ✅ Core social accounts API
- ✅ Post creation & management
- ✅ Basic scheduling
- 🔜 OAuth login flows for each platform

### Phase 2c (Following)
- Analytics integration with social platforms
- Real-time engagement sync
- Post analytics dashboard
- Advanced scheduling (recurrence, templates)
- Bulk operations (upload CSV for scheduling)
- AI caption generation

### Phase 3
- Mobile app for posting
- Team collaboration & approval workflows
- Advanced analytics & insights
- Hashtag recommendations
- Competitor tracking
- Sentiment analysis

---

## 💡 Tips & Best Practices

### Optimal Posting Times

**Facebook**
- Weekdays: 1-3 PM, 7-9 PM
- Best day: Wednesday-Friday
- Avoid: Sunday evenings

**Instagram**
- Weekdays: 11 AM, 6-9 PM
- Best day: Tuesday-Thursday
- Reels perform best: 6-9 PM

**TikTok**
- Mornings: 6-10 AM
- Evenings: 6-11 PM
- Peak: Friday nights

**Twitter**
- Weekdays: 8-10 AM, 5-7 PM
- Best day: Tuesday-Thursday
- Retweets peak: 4-6 PM

### Content Strategy

1. **Plan ahead** - Schedule posts 1-2 weeks in advance
2. **Use visuals** - Posts with images get 2.3x more engagement
3. **Call to action** - Ask for shares, comments, or clicks
4. **Hashtags** - Use 5-15 relevant hashtags per platform
5. **Consistency** - Post at least 3-5 times per week
6. **Test timing** - Use analytics to find YOUR best times

### Multi-Platform Tips

1. Tailor content to each platform (don't copy-paste)
2. Instagram: Use vertical images (9:16 ratio)
3. Facebook: Mix of text, image, video
4. TikTok: Vertical video 9:16, 15-60 seconds
5. Twitter: Short text, max 280 characters
6. LinkedIn: Professional, industry-focused content

---

## 📞 Support & Resources

### Documentation
- See [DATABASE_SETUP.md](DATABASE_SETUP.md) for database configuration
- See [API_ENDPOINTS.md](Docs/API_ENDPOINTS.md) for complete API reference
- See [ARCHITECTURE.md](ARCHITECTURE.md) for system design

### Platform Resources
- **Facebook:** https://developers.facebook.com/docs/
- **Instagram:** https://developers.instagram.com/
- **Twitter:** https://developer.twitter.com/en/docs
- **TikTok:** https://developers.tiktok.com/doc/
- **LinkedIn:** https://docs.microsoft.com/en-us/linkedin/
- **YouTube:** https://developers.google.com/youtube

### Getting Help
- Email: imran.it.support@gmail.com
- Check troubleshooting section above
- Review API error messages for details
- Check social platform status pages

---

## ✅ Checklist for First Post

- [ ] Create Supabase account and get database URL
- [ ] Run migrations (004_phase2_enhancements.sql)
- [ ] Start backend server (npm run dev in API/)
- [ ] Start frontend (npm run dev in Web/)
- [ ] Log in or create account
- [ ] Go to Social Accounts page
- [ ] Get API token from social platform
- [ ] Connect first social account
- [ ] Go to Posts page
- [ ] Create first post
- [ ] Publish immediately or schedule
- [ ] Check post appears on social platform
- [ ] 🎉 Celebrate your first automated post!

---

**Built with ❤️ by Claude for Imran Pro Services**

Next Steps: Implement OAuth flows, analytics integration, and AI caption generation.
