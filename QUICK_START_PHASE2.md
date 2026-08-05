# Quick Start - Phase 2 Social Media Integration (5 Minutes)

**For:** Getting your first social media post created and scheduled  
**Time:** ~5 minutes  
**Difficulty:** Easy  

---

## Prerequisites

✅ Backend running on http://localhost:5000  
✅ Frontend running on http://localhost:3000  
✅ Database connected (Supabase or local PostgreSQL)  
✅ Client created in dashboard  

**Not ready yet?** See [SETUP.md](SETUP.md) for full installation.

---

## 5-Minute Quick Start

### Step 1: Get Your API Token (2 minutes)

**Using Facebook (Easiest for testing):**

1. Go to https://developers.facebook.com/
2. Click **"My Apps"** → **"Create App"**
3. Choose **"Business"** type
4. Fill in app details and create
5. Go to **"Tools"** → **"Graph API Explorer"**
6. Select your page in dropdown
7. Copy the long token from the text box (starts with "EAAT")

**Using Instagram:**
- Same process as Facebook (Instagram uses Facebook Graph API)

**Other platforms:**
- See [PHASE2_FEATURES.md](PHASE2_FEATURES.md) for platform-specific instructions

### Step 2: Connect Account (1 minute)

1. Go to http://localhost:3000
2. Click **"🔗 Accounts"** button on dashboard
3. Click **"+ Add Account"** button
4. Fill in:
   - **Platform:** Facebook
   - **Account Name:** My First Account
   - **Username:** your_fb_username
   - **Access Token:** (paste the token from Step 1)
5. Click **"✓ Connect Account"**
6. ✅ Account connected!

### Step 3: Create Your First Post (2 minutes)

1. Click **"📝 Posts"** button on dashboard
2. Click **"+ Create Post"** button
3. Fill in:
   - **Select Account:** Your connected Facebook account
   - **Post Content:** "Hello! This is my first automated post! 🎉"
   - **Platforms:** Check "facebook"
   - **Schedule:** Leave empty (publish immediately)
4. Click **"✓ Save Post"**
5. Post appears in list as "Draft"
6. Click **"Publish Now"** button
7. ✅ Post published!

### Step 4: Verify Post (verify manually)

1. Go to your Facebook page
2. Refresh the page (Ctrl+R)
3. See your new post at the top!

---

## Next Steps

### Schedule Posts Instead of Immediate Publishing

1. Create post (same as Step 3)
2. In the **Schedule** field, pick a future time
3. Click **"✓ Save Post"**
4. Post appears as "Scheduled"
5. Auto-publishes at scheduled time!

### Connect More Accounts

1. Go to Accounts page
2. Click "+ Add Account" again
3. Choose Instagram, TikTok, Twitter, etc.
4. Get token from each platform
5. When posting, select multiple accounts to cross-post!

### Upload Media (Coming Phase 2c)

1. Currently posts can include links to images
2. Full media upload coming next phase
3. For now: Use image URLs in post content

---

## Troubleshooting

### Account Connection Fails

**Error: "Invalid token"**
- Copy token again from platform
- Ensure no spaces at beginning/end
- Token must be valid and not expired

**Error: "Cannot connect"**
- Verify backend is running: `curl http://localhost:5000/api/health`
- Check internet connection
- Try again in a few moments

### Post Won't Publish

**"Cannot connect to platform"**
- Check token is valid
- Platform may be down (check Facebook status)
- Network might be blocking API calls

**Post stuck in "Draft" status**
- Try refreshing page
- Check browser console for errors (F12)
- Restart backend server

### Post Published but Can't See It

1. Refresh your Facebook page
2. Check if in moderation queue (check Notifications)
3. Ensure you logged in to correct Facebook account
4. Post may be pending review

---

## Key Features

✅ **Multi-Account Support** - Connect all your social profiles  
✅ **Multi-Platform Posting** - Post to FB, Instagram, Twitter, etc. at once  
✅ **Scheduling** - Auto-publish at optimal times  
✅ **Draft Management** - Save posts as drafts before publishing  
✅ **Client Isolation** - Each business client sees only their posts  
✅ **Status Tracking** - See at a glance: draft/scheduled/published  

---

## Command Line Testing (Optional)

If you want to test the API directly:

```bash
# Get your client ID (from browser localStorage)
# Go to dashboard, open DevTools (F12), console, type:
localStorage.getItem('selectedClientId')

# Test API connection
curl http://localhost:5000/api/health

# List your connected accounts
curl http://localhost:5000/api/social-accounts?clientId=YOUR_CLIENT_ID \
  -H "Authorization: Bearer YOUR_TOKEN"

# Create a post via API
curl -X POST http://localhost:5000/api/posts?clientId=YOUR_CLIENT_ID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "socialAccountId": "account-id",
    "content": "API test post",
    "platforms": ["facebook"]
  }'
```

---

## Video Overview (Coming)

Walkthrough videos coming soon showing:
- How to get Facebook API tokens
- Connecting first social account
- Creating and scheduling posts
- Cross-posting to multiple platforms
- Best practices for scheduling

---

## Full Documentation

- 📖 [PHASE2_FEATURES.md](PHASE2_FEATURES.md) - Complete feature guide
- 🔧 [API_ENDPOINTS.md](Docs/API_ENDPOINTS.md) - Full API reference
- 🗄️ [DATABASE_SETUP.md](DATABASE_SETUP.md) - Database configuration
- 🏗️ [ARCHITECTURE.md](ARCHITECTURE.md) - System architecture

---

## Common Next Questions

**Q: Can I schedule posts without connecting accounts?**  
A: No, you must connect an account first. Each post must belong to a connected account.

**Q: Can I edit posts after publishing?**  
A: No, but you can create a new post and delete the old one. Platform limitation.

**Q: How do I know if a post succeeded?**  
A: Status changes from "Draft" → "Scheduled" → "Published". Check your social account!

**Q: Can I delete scheduled posts?**  
A: Yes, click the trash icon before the scheduled time. Post won't publish.

**Q: What if I want to post to all platforms at once?**  
A: Check multiple platforms in the Post form. Post goes to all selected!

**Q: Can multiple users post from same account?**  
A: Yes! Each client can have multiple team members post from shared accounts.

---

## Support

**Something not working?**
1. Check backend running: `npm run dev` in API/
2. Check frontend running: `npm run dev` in Web/
3. Check database connected
4. Review error message in browser console (F12)
5. Email: imran.it.support@gmail.com

**Ready for more?**
- See [PHASE2_FEATURES.md](PHASE2_FEATURES.md) for advanced features
- Set up analytics in Phase 2c
- Integrate AI caption generation in Phase 3

---

**You're all set! 🚀 Start creating posts now!**

Time elapsed: ~5 minutes  
Posts created: 1  
Next step: Connect more accounts & schedule posts!
