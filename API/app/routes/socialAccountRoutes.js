import express from 'express';
import { authenticate } from '../middleware/auth.js';
import verifyClientAccess from '../middleware/verifyClientAccess.js';
import * as socialAccountService from '../services/socialAccountService.js';
import * as metaService from '../services/metaService.js';

const router = express.Router();

const callbackUrl = (req) => `${req.protocol}://${req.get('host')}/api/social-accounts/connect/facebook/callback`;

/**
 * Lets the frontend show accurate connect-vs-not-configured state instead
 * of a static "Coming soon" — Settings checks this before offering the
 * Facebook/Instagram connect flow.
 */
router.get('/meta-status', authenticate, (req, res) => {
  res.json({ data: { configured: metaService.isConfigured() }, error: null });
});

/**
 * Step 1 of OAuth: frontend calls this (authenticated) to get the Meta
 * consent URL, then does a full browser redirect to it — Meta's OAuth
 * dialog can't be opened via XHR/fetch, it has to be a real navigation.
 * client_id is embedded in `state` since the callback below is a public
 * redirect target with no Authorization header to read it from.
 */
router.get('/connect/facebook', authenticate, verifyClientAccess, async (req, res) => {
  const clientId = req.query.client_id;
  if (!clientId) return res.status(400).json({ data: null, error: 'clientId required' });

  const url = metaService.getOAuthUrl(callbackUrl(req), clientId);
  res.json({ data: { url }, error: null });
});

/**
 * Step 2: Meta redirects the user's browser here after they approve (or
 * deny) access. No auth middleware — this is a public redirect target.
 * On success, connects the user's first Facebook Page (and its linked
 * Instagram Business account, if any) and sends the user back to the
 * Social Accounts page.
 */
router.get('/connect/facebook/callback', async (req, res) => {
  const { code, state: clientId, error: oauthError } = req.query;
  const frontendUrl = process.env.CORS_ORIGIN || 'http://localhost:3000';

  if (oauthError || !code || !clientId) {
    return res.redirect(`${frontendUrl}/social-accounts?connect_error=${encodeURIComponent(oauthError || 'missing_code')}`);
  }

  try {
    const shortLivedToken = await metaService.exchangeCodeForToken(code, callbackUrl(req));
    const longLivedToken = await metaService.getLongLivedToken(shortLivedToken);
    const pages = await metaService.listManagedPages(longLivedToken);

    if (pages.length === 0) {
      return res.redirect(`${frontendUrl}/social-accounts?connect_error=no_pages_found`);
    }

    // Simplification for now: connect the first Page found. If the user
    // manages several, they can disconnect and we can add a picker later.
    const page = pages[0];
    await socialAccountService.createSocialAccount(clientId, {
      platform: 'facebook',
      accountName: page.name,
      profileId: page.id,
      accessToken: page.access_token,
    });

    if (page.instagram_business_account) {
      await socialAccountService.createSocialAccount(clientId, {
        platform: 'instagram',
        accountName: page.instagram_business_account.username || page.name,
        accountUsername: page.instagram_business_account.username,
        profileId: page.instagram_business_account.id,
        profileImageUrl: page.instagram_business_account.profile_picture_url,
        accessToken: page.access_token, // Instagram posting uses the Page token
      });
    }

    res.redirect(`${frontendUrl}/social-accounts?connected=facebook`);
  } catch (err) {
    console.error('[Meta OAuth] callback failed:', err.message);
    res.redirect(`${frontendUrl}/social-accounts?connect_error=${encodeURIComponent(err.message)}`);
  }
});

router.get('/', authenticate, verifyClientAccess, async (req, res) => {
  try {
    const clientId = req.query.client_id;
    if (!clientId) return res.status(400).json({ data: null, error: 'clientId required' });

    const accounts = await socialAccountService.listSocialAccounts(clientId);
    res.json({ data: accounts, error: null });
  } catch (err) {
    res.status(500).json({ data: null, error: err.message });
  }
});

router.get('/:id', authenticate, verifyClientAccess, async (req, res) => {
  try {
    const clientId = req.query.client_id;
    if (!clientId) return res.status(400).json({ data: null, error: 'clientId required' });

    const account = await socialAccountService.getSocialAccount(clientId, req.params.id);
    if (!account) return res.status(404).json({ data: null, error: 'Account not found' });

    res.json({ data: account, error: null });
  } catch (err) {
    res.status(500).json({ data: null, error: err.message });
  }
});

router.post('/', authenticate, verifyClientAccess, async (req, res) => {
  try {
    const clientId = req.query.client_id;
    if (!clientId) return res.status(400).json({ data: null, error: 'clientId required' });

    const account = await socialAccountService.createSocialAccount(clientId, req.body);
    res.status(201).json({ data: account, error: null });
  } catch (err) {
    res.status(500).json({ data: null, error: err.message });
  }
});

router.put('/:id', authenticate, verifyClientAccess, async (req, res) => {
  try {
    const clientId = req.query.client_id;
    if (!clientId) return res.status(400).json({ data: null, error: 'clientId required' });

    const account = await socialAccountService.updateSocialAccount(clientId, req.params.id, req.body);
    res.json({ data: account, error: null });
  } catch (err) {
    res.status(500).json({ data: null, error: err.message });
  }
});

router.delete('/:id', authenticate, verifyClientAccess, async (req, res) => {
  try {
    const clientId = req.query.client_id;
    if (!clientId) return res.status(400).json({ data: null, error: 'clientId required' });

    const account = await socialAccountService.deleteSocialAccount(clientId, req.params.id);
    res.json({ data: account, error: null });
  } catch (err) {
    res.status(500).json({ data: null, error: err.message });
  }
});

router.get('/stats/overview', authenticate, verifyClientAccess, async (req, res) => {
  try {
    const clientId = req.query.client_id;
    if (!clientId) return res.status(400).json({ data: null, error: 'clientId required' });

    const stats = await socialAccountService.getSocialAccountStats(clientId);
    res.json({ data: stats, error: null });
  } catch (err) {
    res.status(500).json({ data: null, error: err.message });
  }
});

export default router;
