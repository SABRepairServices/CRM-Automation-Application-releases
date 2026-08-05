import { query } from './database.js';

export const listSocialAccounts = async (clientId) => {
  const result = await query(
    `SELECT id, platform, account_name, account_username, profile_id, profile_url, profile_image_url,
            followers_count, status, expires_at, created_at, updated_at
     FROM social_accounts
     WHERE client_id = $1 AND is_active = true
     ORDER BY created_at DESC`,
    [clientId]
  );
  return result.rows;
};

export const getSocialAccount = async (clientId, accountId) => {
  const result = await query(
    `SELECT id, platform, account_name, account_username, profile_id, profile_url, profile_image_url,
            followers_count, status, expires_at, created_at, updated_at
     FROM social_accounts
     WHERE id = $1 AND client_id = $2 AND is_active = true`,
    [accountId, clientId]
  );
  return result.rows[0] || null;
};

/**
 * Creates a social account. Used both by the manual "paste a token" path
 * and by the OAuth callback (which passes profileId = the Facebook Page ID
 * or Instagram Business Account ID, and accessToken = the Page token).
 */
export const createSocialAccount = async (clientId, data) => {
  const { platform, accountName, accountUsername, profileId, profileUrl, profileImageUrl, followersCount, accessToken, refreshToken, expiresAt } = data;

  if (!platform || !accountName) {
    throw new Error('platform and accountName are required');
  }

  const result = await query(
    `INSERT INTO social_accounts
       (client_id, platform, account_name, account_username, profile_id, profile_url, profile_image_url, followers_count, status, access_token, refresh_token, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'connected', $9, $10, $11)
     RETURNING id, platform, account_name, account_username, profile_id, profile_url, profile_image_url, followers_count, status, expires_at, created_at, updated_at`,
    [clientId, platform, accountName, accountUsername || null, profileId || null, profileUrl || null, profileImageUrl || null, followersCount || 0, accessToken || null, refreshToken || null, expiresAt || null]
  );
  return result.rows[0];
};

export const updateSocialAccount = async (clientId, accountId, data) => {
  const updates = [];
  const params = [];
  let paramNum = 1;

  const fields = ['account_name', 'account_username', 'profile_url', 'profile_image_url', 'followers_count', 'status', 'access_token', 'refresh_token', 'expires_at'];
  const fieldMap = { account_name: 'accountName', account_username: 'accountUsername', profile_url: 'profileUrl', profile_image_url: 'profileImageUrl', followers_count: 'followersCount', access_token: 'accessToken', refresh_token: 'refreshToken', expires_at: 'expiresAt' };

  fields.forEach((column) => {
    const key = fieldMap[column] || column;
    if (data[key] !== undefined) {
      updates.push(`${column} = $${paramNum++}`);
      params.push(data[key]);
    }
  });

  if (updates.length === 0) return getSocialAccount(clientId, accountId);

  params.push(accountId, clientId);
  const result = await query(
    `UPDATE social_accounts SET ${updates.join(', ')}, updated_at = NOW()
     WHERE id = $${paramNum} AND client_id = $${paramNum + 1}
     RETURNING id, platform, account_name, account_username, profile_id, profile_url, profile_image_url, followers_count, status, expires_at, created_at, updated_at`,
    params
  );
  if (result.rows.length === 0) throw new Error('Account not found');
  return result.rows[0];
};

export const deleteSocialAccount = async (clientId, accountId) => {
  const result = await query(
    `UPDATE social_accounts SET is_active = false, updated_at = NOW() WHERE id = $1 AND client_id = $2 RETURNING id`,
    [accountId, clientId]
  );
  if (result.rows.length === 0) throw new Error('Account not found');
  return result.rows[0];
};

export const getSocialAccountStats = async (clientId) => {
  const result = await query(
    `SELECT
       COUNT(*) as total,
       COUNT(CASE WHEN platform = 'facebook' THEN 1 END) as facebook_count,
       COUNT(CASE WHEN platform = 'instagram' THEN 1 END) as instagram_count,
       COUNT(CASE WHEN platform = 'tiktok' THEN 1 END) as tiktok_count,
       COALESCE(SUM(followers_count), 0) as total_followers
     FROM social_accounts
     WHERE client_id = $1 AND is_active = true`,
    [clientId]
  );
  return result.rows[0];
};

/**
 * Internal-only accessor (includes access_token) — used by the publishing
 * pipeline. Never exposed directly through a route.
 */
export const getSocialAccountWithToken = async (clientId, accountId) => {
  const result = await query(
    `SELECT id, platform, profile_id, access_token FROM social_accounts WHERE id = $1 AND client_id = $2 AND is_active = true`,
    [accountId, clientId]
  );
  return result.rows[0] || null;
};
