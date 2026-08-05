const GRAPH_API_VERSION = 'v21.0';
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

const isConfigured = () => Boolean(process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET && process.env.FACEBOOK_APP_ID !== 'your_meta_app_id');

/**
 * Builds the Meta OAuth consent URL. The user is redirected here to grant
 * this app permission to post to their Facebook Page (and, via the Page's
 * linked Instagram Business account, to Instagram too — Meta has no
 * separate consumer Instagram posting API).
 */
const getOAuthUrl = (redirectUri, state) => {
  const params = new URLSearchParams({
    client_id: process.env.FACEBOOK_APP_ID || '',
    redirect_uri: redirectUri,
    state,
    scope: 'pages_show_list,pages_read_engagement,pages_manage_posts,instagram_basic,instagram_content_publish',
    response_type: 'code',
  });
  return `https://www.facebook.com/${GRAPH_API_VERSION}/dialog/oauth?${params}`;
};

/** Exchanges the OAuth code for a short-lived user access token. */
const exchangeCodeForToken = async (code, redirectUri) => {
  const params = new URLSearchParams({
    client_id: process.env.FACEBOOK_APP_ID || '',
    client_secret: process.env.FACEBOOK_APP_SECRET || '',
    redirect_uri: redirectUri,
    code,
  });
  const response = await fetch(`${GRAPH_BASE}/oauth/access_token?${params}`);
  const result = await response.json();
  if (!response.ok) throw new Error(result.error?.message || 'Failed to exchange OAuth code');
  return result.access_token;
};

/** Upgrades a short-lived user token to a long-lived one (~60 days). */
const getLongLivedToken = async (shortLivedToken) => {
  const params = new URLSearchParams({
    grant_type: 'fb_exchange_token',
    client_id: process.env.FACEBOOK_APP_ID || '',
    client_secret: process.env.FACEBOOK_APP_SECRET || '',
    fb_exchange_token: shortLivedToken,
  });
  const response = await fetch(`${GRAPH_BASE}/oauth/access_token?${params}`);
  const result = await response.json();
  if (!response.ok) throw new Error(result.error?.message || 'Failed to extend token');
  return result.access_token;
};

/**
 * Lists the Facebook Pages the authenticated user manages, each with its
 * own Page access token (never expires as long as the user token is valid)
 * and, if present, the linked Instagram Business account.
 */
const listManagedPages = async (userAccessToken) => {
  const response = await fetch(
    `${GRAPH_BASE}/me/accounts?fields=id,name,access_token,instagram_business_account{id,username,profile_picture_url}&access_token=${userAccessToken}`
  );
  const result = await response.json();
  if (!response.ok) throw new Error(result.error?.message || 'Failed to list Facebook Pages');
  return result.data || [];
};

/**
 * Posts to a Facebook Page's feed. Text-only if no imageUrl, otherwise
 * posts as a photo with the text as the caption.
 */
const postToFacebookPage = async (pageId, pageAccessToken, message, imageUrl = null) => {
  if (!isConfigured()) {
    console.log(`[Meta:DRY-RUN] -> Facebook Page ${pageId}: "${message}"${imageUrl ? ` [image: ${imageUrl}]` : ''}`);
    return { dryRun: true, id: `dryrun_fb_${Date.now()}` };
  }

  const endpoint = imageUrl ? `${GRAPH_BASE}/${pageId}/photos` : `${GRAPH_BASE}/${pageId}/feed`;
  const body = imageUrl
    ? { url: imageUrl, caption: message, access_token: pageAccessToken }
    : { message, access_token: pageAccessToken };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error?.message || 'Facebook post failed');
  return result;
};

/**
 * Posts to Instagram via the two-step Graph API flow: create a media
 * container, then publish it. Instagram requires an image — there's no
 * text-only post type.
 */
const postToInstagram = async (igUserId, accessToken, caption, imageUrl) => {
  if (!imageUrl) throw new Error('Instagram posts require an image (no text-only post type on the platform)');

  if (!isConfigured()) {
    console.log(`[Meta:DRY-RUN] -> Instagram ${igUserId}: "${caption}" [image: ${imageUrl}]`);
    return { dryRun: true, id: `dryrun_ig_${Date.now()}` };
  }

  const containerResponse = await fetch(`${GRAPH_BASE}/${igUserId}/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image_url: imageUrl, caption, access_token: accessToken }),
  });
  const container = await containerResponse.json();
  if (!containerResponse.ok) throw new Error(container.error?.message || 'Instagram media container failed');

  const publishResponse = await fetch(`${GRAPH_BASE}/${igUserId}/media_publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ creation_id: container.id, access_token: accessToken }),
  });
  const published = await publishResponse.json();
  if (!publishResponse.ok) throw new Error(published.error?.message || 'Instagram publish failed');
  return published;
};

export { isConfigured, getOAuthUrl, exchangeCodeForToken, getLongLivedToken, listManagedPages, postToFacebookPage, postToInstagram };
