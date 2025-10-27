// backend/src/modules/blog/blog.router.ts
import { Express } from "express";
import * as blogController from "./blog.controller";
import { authenticated } from "../middleware/bearAuth";

const blogRoutes = (app: Express) => {
  // Public routes
  app.get("/blogs", async (req, res, next) => {
    try {
      await blogController.getAllBlogs(req, res);
    } catch (error) {
      next(error);
    }
  });

  app.get("/blogs/:id", async (req, res, next) => {
    try {
      await blogController.getBlogById(req, res);
    } catch (error) {
      next(error);
    }
  });

  app.get("/blogs/author/:authorId", async (req, res, next) => {
    try {
      await blogController.getBlogsByAuthor(req, res);
    } catch (error) {
      next(error);
    }
  });

  // Protected routes (authenticated authors only)
  app.post("/blogs", authenticated, async (req, res, next) => {
    try {
      await blogController.createBlog(req, res);
    } catch (error) {
      next(error);
    }
  });

  app.put("/blogs/:id", authenticated, async (req, res, next) => {
    try {
      await blogController.updateBlog(req, res);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/blogs/:id", authenticated, async (req, res, next) => {
    try {
      await blogController.deleteBlog(req, res);
    } catch (error) {
      next(error);
    }
  });
};

export default blogRoutes;