import { v4 as uuidv4 } from 'uuid';
import { query } from './database.js';

/**
 * Create new post
 */
export const createPost = async (userId, postData) => {
  try {
    const {
      content,
      mediaUrls = [],
      scheduledAt = null,
      contentType = 'text',
      aiGenerated = false,
      platforms = [],
    } = postData;

    if (!content) {
      throw new Error('Content is required');
    }

    const postId = uuidv4();

    // Create post
    const postResult = await query(
      `INSERT INTO posts (id, user_id, content, media_urls, scheduled_at, status, content_type, ai_generated, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
       RETURNING *`,
      [postId, userId, content, mediaUrls, scheduledAt, 'draft', contentType, aiGenerated]
    );

    // Associate with platforms
    if (platforms.length > 0) {
      for (const platform of platforms) {
        await query(
          `INSERT INTO post_platforms (id, post_id, account_id, platform, status, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
          [uuidv4(), postId, platform.accountId || '', platform.name, 'pending']
        );
      }
    }

    return {
      success: true,
      post: postResult.rows[0],
      message: 'Post created successfully',
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
    };
  }
};

/**
 * Get user's posts
 */
export const getUserPosts = async (userId, filters = {}) => {
  try {
    const { status = null, limit = 20, offset = 0, sortBy = 'created_at' } = filters;

    let whereClause = 'WHERE user_id = $1';
    const params = [userId];

    if (status) {
      whereClause += ` AND status = $${params.length + 1}`;
      params.push(status);
    }

    const countResult = await query(
      `SELECT COUNT(*) FROM posts ${whereClause}`,
      params
    );

    const result = await query(
      `SELECT id, user_id, content, media_urls, scheduled_at, published_at, status, content_type, ai_generated, created_at, updated_at
       FROM posts ${whereClause}
       ORDER BY ${sortBy} DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    return {
      success: true,
      posts: result.rows,
      total: parseInt(countResult.rows[0].count),
      limit,
      offset,
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
    };
  }
};

/**
 * Get single post
 */
export const getPost = async (postId, userId) => {
  try {
    const result = await query(
      `SELECT id, user_id, content, media_urls, scheduled_at, published_at, status, content_type, ai_generated, created_at, updated_at
       FROM posts WHERE id = $1 AND user_id = $2`,
      [postId, userId]
    );

    if (result.rows.length === 0) {
      throw new Error('Post not found');
    }

    // Get platform associations
    const platformResult = await query(
      `SELECT id, post_id, account_id, platform, platform_post_id, platform_url, status, published_at, error_message, created_at
       FROM post_platforms WHERE post_id = $1`,
      [postId]
    );

    return {
      success: true,
      post: {
        ...result.rows[0],
        platforms: platformResult.rows,
      },
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
    };
  }
};

/**
 * Update post
 */
export const updatePost = async (postId, userId, updates) => {
  try {
    const { content, mediaUrls, scheduledAt, status } = updates;

    // Check if post can be modified
    const postCheck = await query(
      'SELECT status FROM posts WHERE id = $1 AND user_id = $2',
      [postId, userId]
    );

    if (postCheck.rows.length === 0) {
      throw new Error('Post not found');
    }

    if (postCheck.rows[0].status === 'published') {
      throw new Error('Cannot modify published posts');
    }

    const result = await query(
      `UPDATE posts
       SET content = COALESCE($1, content),
           media_urls = COALESCE($2, media_urls),
           scheduled_at = COALESCE($3, scheduled_at),
           status = COALESCE($4, status),
           updated_at = NOW()
       WHERE id = $5 AND user_id = $6
       RETURNING *`,
      [content || null, mediaUrls || null, scheduledAt || null, status || null, postId, userId]
    );

    return {
      success: true,
      post: result.rows[0],
      message: 'Post updated successfully',
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
    };
  }
};

/**
 * Schedule post
 */
export const schedulePost = async (postId, userId, scheduledAt, platforms) => {
  try {
    // Update post status
    const postResult = await query(
      `UPDATE posts
       SET scheduled_at = $1, status = 'scheduled', updated_at = NOW()
       WHERE id = $2 AND user_id = $3
       RETURNING *`,
      [scheduledAt, postId, userId]
    );

    if (postResult.rows.length === 0) {
      throw new Error('Post not found');
    }

    // Update platforms
    for (const platform of platforms) {
      await query(
        `UPDATE post_platforms
         SET status = 'scheduled', updated_at = NOW()
         WHERE post_id = $1 AND platform = $2`,
        [postId, platform]
      );
    }

    return {
      success: true,
      post: postResult.rows[0],
      message: 'Post scheduled successfully',
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
    };
  }
};

/**
 * Delete post
 */
export const deletePost = async (postId, userId) => {
  try {
    // Check if post is published
    const postCheck = await query(
      'SELECT status FROM posts WHERE id = $1 AND user_id = $2',
      [postId, userId]
    );

    if (postCheck.rows.length === 0) {
      throw new Error('Post not found');
    }

    if (postCheck.rows[0].status === 'published') {
      throw new Error('Cannot delete published posts');
    }

    // Delete platforms first
    await query('DELETE FROM post_platforms WHERE post_id = $1', [postId]);

    // Delete post
    await query('DELETE FROM posts WHERE id = $1 AND user_id = $2', [postId, userId]);

    return {
      success: true,
      message: 'Post deleted successfully',
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
    };
  }
};

/**
 * Get scheduled posts
 */
export const getScheduledPosts = async (userId, limit = 10) => {
  try {
    const result = await query(
      `SELECT id, user_id, content, media_urls, scheduled_at, status, content_type, created_at
       FROM posts
       WHERE user_id = $1 AND status = 'scheduled' AND scheduled_at > NOW()
       ORDER BY scheduled_at ASC
       LIMIT $2`,
      [userId, limit]
    );

    return {
      success: true,
      posts: result.rows,
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
    };
  }
};

export default {
  createPost,
  getUserPosts,
  getPost,
  updatePost,
  schedulePost,
  deletePost,
  getScheduledPosts,
};
