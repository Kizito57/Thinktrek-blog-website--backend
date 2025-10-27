// backend/src/modules/middleware/authMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface AuthRequest extends Request {
  user?: {
    sub: number;
    author_id: number;
    first_name: string;
    last_name: string;
    email: string;
    exp: number;
  };
}

// Simple authentication middleware
export const authenticated = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      error: 'Access token required',
      message: 'Please login to access this resource'
    });
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error('JWT_SECRET not configured');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    const decoded = jwt.verify(token, secret) as any;
    req.user = decoded;
    next();
  } catch (error: any) {
    console.error('Token verification failed:', error.message);

    let message = 'Please login again';
    if (error.name === 'TokenExpiredError') {
      message = 'Session expired, please login again';
    } else if (error.name === 'JsonWebTokenError') {
      message = 'Invalid token, please login again';
    }

    return res.status(401).json({
      error: 'Authentication failed',
      message
    });
  }
};