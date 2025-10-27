// backend/src/modules/author/author.router.ts
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

const authorRoutes = (app: Express) => {

  // Public routes
  app.post("/authors/register", async (req, res, next) => {
    try {
      await createAuthor(req, res);
    } catch (error) {
      next(error);
    }
  });

  app.post("/authors/verify", async (req, res, next) => {
    try {
      await verifyAuthorEmail(req, res);
    } catch (error) {
      next(error);
    }
  });

  app.post("/authors/login", async (req, res, next) => {
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

  // Protected routes (authentication required)
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