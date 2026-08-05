import pool from '../../config/database.js';
import { postToFacebookPage, postToInstagram } from './metaService.js';
import { getSocialAccountWithToken } from './socialAccountService.js';

export async function listPosts(clientId, filters = {}) {
  let query = 'SELECT * FROM posts WHERE client_id = $1 AND is_active = true';
  const params = [clientId];

  if (filters.accountId) {
    query += ` AND social_account_id = $${params.length + 1}`;
    params.push(filters.accountId);
  }

  if (filters.status) {
    query += ` AND status = $${params.length + 1}`;
    params.push(filters.status);
  }

  query += ' ORDER BY scheduled_at DESC LIMIT 100';

  const result = await pool.query(query, params);
  return result.rows;
}

export async function getPost(clientId, postId) {
  const result = await pool.query(
    'SELECT * FROM posts WHERE id = $1 AND client_id = $2',
    [postId, clientId]
  );
  return result.rows[0];
}

export async function createPost(clientId, { socialAccountId, content, mediaUrls, scheduledAt, platforms }) {
  const result = await pool.query(
    `INSERT INTO posts (client_id, social_account_id, content, media_urls, scheduled_at, platforms, status, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, 'draft', NOW())
     RETURNING *`,
    [clientId, socialAccountId, content, mediaUrls || [], scheduledAt, platforms || []]
  );
  return result.rows[0];
}

export async function updatePost(clientId, postId, updates) {
  const fields = [];
  const params = [];
  let paramIndex = 1;

  if (updates.content !== undefined) {
    fields.push(`content = $${paramIndex++}`);
    params.push(updates.content);
  }
  if (updates.scheduledAt !== undefined) {
    fields.push(`scheduled_at = $${paramIndex++}`);
    params.push(updates.scheduledAt);
  }
  if (updates.status !== undefined) {
    fields.push(`status = $${paramIndex++}`);
    params.push(updates.status);
  }
  if (updates.platforms !== undefined) {
    fields.push(`platforms = $${paramIndex++}`);
    params.push(updates.platforms);
  }

  if (fields.length === 0) return getPost(clientId, postId);

  fields.push(`updated_at = NOW()`);
  params.push(postId);
  params.push(clientId);

  const query = `UPDATE posts SET ${fields.join(', ')} WHERE id = $${paramIndex++} AND client_id = $${paramIndex++} RETURNING *`;
  const result = await pool.query(query, params);
  return result.rows[0];
}

export async function deletePost(clientId, postId) {
  const result = await pool.query(
    'UPDATE posts SET is_active = false, updated_at = NOW() WHERE id = $1 AND client_id = $2 RETURNING *',
    [postId, clientId]
  );
  return result.rows[0];
}

export async function publishPost(clientId, postId) {
  const post = await getPost(clientId, postId);
  if (!post) throw new Error('Post not found');

  if (!post.social_account_id) {
    throw new Error('This post has no social account attached — pick which connected account to publish it from first');
  }

  const account = await getSocialAccountWithToken(clientId, post.social_account_id);
  if (!account) throw new Error('Linked social account not found');
  if (!account.access_token) {
    throw new Error(`${account.platform} account has no access token — reconnect it first`);
  }

  const mediaUrls = Array.isArray(post.media_urls) ? post.media_urls : JSON.parse(post.media_urls || '[]');
  const imageUrl = mediaUrls[0] || null;

  try {
    let published;
    if (account.platform === 'facebook') {
      published = await postToFacebookPage(account.profile_id, account.access_token, post.content, imageUrl);
    } else if (account.platform === 'instagram') {
      published = await postToInstagram(account.profile_id, account.access_token, post.content, imageUrl);
    } else {
      throw new Error(`Publishing to "${account.platform}" isn't wired up yet — only Facebook and Instagram post for real right now`);
    }

    const result = await pool.query(
      `UPDATE posts
       SET status = 'published', published_at = NOW(), updated_at = NOW(),
           platform_post_id = $1, platform_url = $2, error_message = NULL
       WHERE id = $3 AND client_id = $4
       RETURNING *`,
      [published.id || null, published.permalink_url || null, postId, clientId]
    );
    return result.rows[0];
  } catch (err) {
    await pool.query(
      `UPDATE posts SET status = 'failed', error_message = $1, updated_at = NOW() WHERE id = $2 AND client_id = $3`,
      [err.message, postId, clientId]
    );
    throw err;
  }
}

export async function schedulePost(clientId, postId, scheduledAt) {
  const result = await pool.query(
    'UPDATE posts SET status = $1, scheduled_at = $2, updated_at = NOW() WHERE id = $3 AND client_id = $4 RETURNING *',
    ['scheduled', scheduledAt, postId, clientId]
  );
  return result.rows[0];
}

export async function getPostStats(clientId) {
  const result = await pool.query(
    `SELECT
      COUNT(*) as total,
      COUNT(CASE WHEN status = 'draft' THEN 1 END) as drafts,
      COUNT(CASE WHEN status = 'scheduled' THEN 1 END) as scheduled,
      COUNT(CASE WHEN status = 'published' THEN 1 END) as published
     FROM posts
     WHERE client_id = $1 AND is_active = true`,
    [clientId]
  );
  return result.rows[0];
}
