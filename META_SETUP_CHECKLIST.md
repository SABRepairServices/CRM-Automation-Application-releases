# Meta Business Setup Checklist

Follow in order. Steps 1-3 only need doing once — everything else (WhatsApp bot, Facebook/Instagram posting) reuses the same Meta Business account and App.

## 1. Create a Meta Business account
- Go to https://business.facebook.com
- Click **Create Account**
- Enter your business name (e.g. "Imran Pro Services" / "Shams Al Barakat"), your name, and work email
- Verify the email Meta sends you

## 2. Create a Meta App
- Go to https://developers.facebook.com/apps
- Click **Create App**
- App type: choose **Business**
- Name it (e.g. "IPS CRM Bot"), link it to the Business account from step 1
- Once created, you'll land on the App Dashboard — keep this tab open, you'll come back to it repeatedly

## 3. Get your App ID and App Secret
- On the App Dashboard, left sidebar → **App settings → Basic**
- Copy the **App ID** (visible directly)
- Click **Show** next to **App Secret** (may ask for your Facebook password)
- **Send me both of these** — I'll add them to `.env` as `FACEBOOK_APP_ID` and `FACEBOOK_APP_SECRET`. This alone unlocks real Facebook/Instagram posting (once you also do step 7, Facebook Login).

---

## 4. Add the WhatsApp product (needs the second SIM)
- On the App Dashboard, left sidebar → **Add Product** → find **WhatsApp** → **Set up**
- You'll see a **Getting Started** page with a test number Meta gives you for free — you can test with that first if you want, no SIM needed yet
- When ready to use your own number: go to **WhatsApp → API Setup**, or **WhatsApp → Configuration**
- Click **Add phone number**
- Enter your business name and category
- Enter the second SIM's phone number
- Choose verification method: **SMS** or **Voice call**
- Meta sends a code to that SIM — enter it to verify
- Once verified, you'll see a **Phone Number ID** on this page — **send that to me**

## 5. Get a permanent WhatsApp access token
- The token shown on the "Getting Started" page is **temporary (24 hours)** — fine for quick testing, not for real use
- For a permanent one: go to **Business Settings** (gear icon, top right of business.facebook.com) → **Users → System Users**
- Click **Add**, name it (e.g. "IPS Bot"), role: **Admin**
- Click **Add Assets** → assign it your WhatsApp App with **Full Control**
- Click **Generate New Token** → select your App → check the `whatsapp_business_messaging` and `whatsapp_business_management` permissions → **Generate Token**
- Copy that token immediately (shown once) — **send it to me** as `WHATSAPP_TOKEN`

## 6. Set the webhook (I'll guide you through this live once the app is hosted somewhere with a public URL — can't be localhost). Skip for now, come back to it when we get there.

---

## 7. Add Facebook Login for Business (for real Facebook/Instagram posting)
- Same App Dashboard → **Add Product** → find **Facebook Login for Business** → **Set up**
- Left sidebar → **Facebook Login for Business → Settings**
- Under **Valid OAuth Redirect URIs**, add (once the API is hosted publicly):
  `https://<your-domain>/api/social-accounts/connect/facebook/callback`
- Save changes

## 8. Business verification (may be required before going live)
- Business Settings → **Security Center** → **Start Verification**
- You'll need: a business document (trade license, or similar UAE business registration) and a way to verify your business phone/domain
- This is the step that can take a few days to ~2 weeks

## 9. App Review (only needed once you go past test mode)
- While your App is in **Development mode**, it only works for people you've explicitly added as testers/admins in Business Settings — fine for you to test everything yourself
- To let it work for real for anyone messaging your WhatsApp number or before certain permissions activate, submit for **App Review** (Meta checks each requested permission — `whatsapp_business_messaging`, `pages_manage_posts`, `instagram_content_publish`, etc.)
- I can't do this step either — it's Meta reviewing your specific app/business, done from your dashboard

---

## What to send me, whenever you have it (don't wait to have everything — send as you go)
- [ ] App ID + App Secret (step 3)
- [ ] WhatsApp Phone Number ID (step 4)
- [ ] Permanent WhatsApp access token (step 5)

I'll wire each one into the app the moment you have it — no need to finish the whole checklist first.
