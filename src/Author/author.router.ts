import { Express } from "express";
import {
  getAllAuthors,
  getAuthorById,
  createAuthor,
  updateAuthor,
  deleteAuthor,
  loginAuthor,
  verifyAuthorEmail,
} from "./author.controller";
import { authenticated } from "../middleware/bearAuth";

// Simple rate limiting tracker
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

const rateLimit = (maxRequests: number, windowMs: number) => {
  return (req: any, res: any, next: any) => {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    
    const record = rateLimitMap.get(ip);
    
    if (!record || now > record.resetTime) {
      rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
      return next();
    }
    
    if (record.count >= maxRequests) {
      return res.status(429).json({ error: 'Too many requests. Please try again later.' });
    }
    
    record.count++;
    next();
  };
};

const authRateLimit = rateLimit(5, 15 * 60 * 1000); // 5 requests per 15 minutes

const authorRoutes = (app: Express) => {

  // Public routes with rate limiting
  app.post("/authors/register", authRateLimit, async (req, res, next) => {
    try {
      await createAuthor(req, res);
    } catch (error) {
      next(error);
    }
  });

  app.post("/authors/verify", authRateLimit, async (req, res, next) => {
    try {
      await verifyAuthorEmail(req, res);
    } catch (error) {
      next(error);
    }
  });

  app.post("/authors/login", authRateLimit, async (req, res, next) => {
    try {
      await loginAuthor(req, res);
    } catch (error) {
      next(error);
    }
  });

  // Public - Get all authors (for blog display)
  app.get("/authors", async (req, res, next) => {
    try {
      await getAllAuthors(req, res);
    } catch (error) {
      next(error);
    }
  });

  // Protected routes
  app.get("/authors/:id", authenticated, async (req, res, next) => {
    try {
      await getAuthorById(req, res);
    } catch (error) {
      next(error);
    }
  });

  app.put("/authors/:id", authenticated, async (req, res, next) => {
    try {
      await updateAuthor(req, res);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/authors/:id", authenticated, async (req, res, next) => {
    try {
      await deleteAuthor(req, res);
    } catch (error) {
      next(error);
    }
  });
};

export default authorRoutes;