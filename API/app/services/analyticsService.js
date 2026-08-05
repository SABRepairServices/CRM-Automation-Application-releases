import { v4 as uuidv4 } from 'uuid';
import { query } from './database.js';

/**
 * Record daily analytics for an account
 */
export const recordDailyAnalytics = async (accountId, analyticsData) => {
  try {
    const {
      date,
      followersCount,
      likesCount,
      commentsCount,
      sharesCount,
      impressions,
      reach,
      engagementRate,
      metricsJson = {},
    } = analyticsData;

    const result = await query(
      `INSERT INTO analytics_daily (id, account_id, date, followers_count, likes_count, comments_count, shares_count, impressions, reach, engagement_rate, metrics_json, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
       ON CONFLICT (account_id, date) DO UPDATE SET
         followers_count = $4,
         likes_count = $5,
         comments_count = $6,
         shares_count = $7,
         impressions = $8,
         reach = $9,
         engagement_rate = $10,
         metrics_json = $11,
         updated_at = NOW()
       RETURNING *`,
      [
        uuidv4(),
        accountId,
        date || new Date().toISOString().split('T')[0],
        followersCount || 0,
        likesCount || 0,
        commentsCount || 0,
        sharesCount || 0,
        impressions || 0,
        reach || 0,
        engagementRate || 0,
        JSON.stringify(metricsJson),
      ]
    );

    return {
      success: true,
      analytics: result.rows[0],
      message: 'Analytics recorded successfully',
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
    };
  }
};

/**
 * Get analytics for account (date range)
 */
export const getAccountAnalytics = async (accountId, userId, startDate, endDate) => {
  try {
    // Verify ownership
    const accountCheck = await query(
      'SELECT id FROM social_accounts WHERE id = $1 AND user_id = $2',
      [accountId, userId]
    );

    if (accountCheck.rows.length === 0) {
      throw new Error('Account not found');
    }

    const result = await query(
      `SELECT id, account_id, date, followers_count, likes_count, comments_count, shares_count, impressions, reach, engagement_rate, metrics_json, created_at, updated_at
       FROM analytics_daily
       WHERE account_id = $1 AND date BETWEEN $2 AND $3
       ORDER BY date DESC`,
      [accountId, startDate, endDate]
    );

    return {
      success: true,
      analytics: result.rows,
      count: result.rows.length,
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
    };
  }
};

/**
 * Get dashboard metrics for all user accounts
 */
export const getDashboardMetrics = async (userId) => {
  try {
    // Get total followers across all accounts
    const followersResult = await query(
      `SELECT SUM(followers_count) as total_followers
       FROM social_accounts WHERE user_id = $1`,
      [userId]
    );

    // Get total scheduled posts
    const scheduledResult = await query(
      `SELECT COUNT(*) as scheduled_count
       FROM posts WHERE user_id = $1 AND status = 'scheduled'`,
      [userId]
    );

    // Get total published posts
    const publishedResult = await query(
      `SELECT COUNT(*) as published_count
       FROM posts WHERE user_id = $1 AND status = 'published'`,
      [userId]
    );

    // Get average engagement rate (last 30 days)
    const engagementResult = await query(
      `SELECT AVG(engagement_rate) as avg_engagement
       FROM analytics_daily
       WHERE account_id IN (
         SELECT id FROM social_accounts WHERE user_id = $1
       ) AND date >= CURRENT_DATE - INTERVAL '30 days'`,
      [userId]
    );

    // Get accounts summary
    const accountsResult = await query(
      `SELECT COUNT(*) as total_accounts,
              COUNT(CASE WHEN status = 'connected' THEN 1 END) as connected_accounts,
              COUNT(CASE WHEN status = 'disconnected' THEN 1 END) as disconnected_accounts
       FROM social_accounts WHERE user_id = $1`,
      [userId]
    );

    return {
      success: true,
      metrics: {
        totalFollowers: parseInt(followersResult.rows[0]?.total_followers || 0),
        scheduledPosts: parseInt(scheduledResult.rows[0]?.scheduled_count || 0),
        publishedPosts: parseInt(publishedResult.rows[0]?.published_count || 0),
        averageEngagement: parseFloat(engagementResult.rows[0]?.avg_engagement || 0).toFixed(2),
        totalAccounts: parseInt(accountsResult.rows[0]?.total_accounts || 0),
        connectedAccounts: parseInt(accountsResult.rows[0]?.connected_accounts || 0),
        disconnectedAccounts: parseInt(accountsResult.rows[0]?.disconnected_accounts || 0),
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
 * Record engagement metrics for a post
 */
export const recordEngagementMetrics = async (postId, platform, engagementData) => {
  try {
    const {
      likes,
      comments,
      shares,
      saves,
      impressions,
      reach,
      engagementRate,
      sentimentScore,
    } = engagementData;

    const result = await query(
      `INSERT INTO engagement_metrics (id, post_id, platform, likes, comments, shares, saves, impressions, reach, engagement_rate, sentiment_score, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
       ON CONFLICT (post_id, platform) DO UPDATE SET
         likes = $4,
         comments = $5,
         shares = $6,
         saves = $7,
         impressions = $8,
         reach = $9,
         engagement_rate = $10,
         sentiment_score = $11,
         updated_at = NOW()
       RETURNING *`,
      [
        uuidv4(),
        postId,
        platform,
        likes || 0,
        comments || 0,
        shares || 0,
        saves || 0,
        impressions || 0,
        reach || 0,
        engagementRate || 0,
        sentimentScore || null,
      ]
    );

    return {
      success: true,
      metrics: result.rows[0],
      message: 'Engagement metrics recorded',
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
    };
  }
};

/**
 * Get top performing posts
 */
export const getTopPerformingPosts = async (userId, limit = 10) => {
  try {
    const result = await query(
      `SELECT p.id, p.content, p.platform, AVG(em.engagement_rate) as avg_engagement, SUM(em.likes) as total_likes, SUM(em.impressions) as total_impressions
       FROM posts p
       LEFT JOIN engagement_metrics em ON p.id = em.post_id
       WHERE p.user_id = $1 AND p.status = 'published'
       GROUP BY p.id, p.content, p.platform
       ORDER BY avg_engagement DESC NULLS LAST
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
  recordDailyAnalytics,
  getAccountAnalytics,
  getDashboardMetrics,
  recordEngagementMetrics,
  getTopPerformingPosts,
};
