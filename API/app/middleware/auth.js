import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '24h';

/**
 * Authentication middleware
 * Verifies JWT token from Authorization header
 */
export const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        status: 'error',
        message: 'Missing or invalid authorization header',
        timestamp: new Date().toISOString(),
      });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET);

    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        status: 'error',
        message: 'Token expired',
        timestamp: new Date().toISOString(),
      });
    }

    return res.status(401).json({
      status: 'error',
      message: 'Invalid token',
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * Generate JWT token
 */
export const generateToken = (userId, email) => {
  return jwt.sign(
    { userId, email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRATION }
  );
};

/**
 * Generate refresh token (longer expiration)
 */
export const generateRefreshToken = (userId, email) => {
  return jwt.sign(
    { userId, email, type: 'refresh' },
    JWT_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRATION || '7d' }
  );
};

/**
 * Verify refresh token
 */
export const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};
