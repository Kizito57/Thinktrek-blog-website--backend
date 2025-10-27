// backend/src/modules/blog/blog.controller.ts
import { Request, Response } from "express";
import * as blogService from "./blog.service";

export const getAllBlogs = async (req: Request, res: Response) => {
  try {
    const blogs = await blogService.getAllBlogsService();
    res.json(blogs);
  } catch (err) {
    console.error("getAllBlogs error:", err);
    res.status(500).json({ message: "Failed to fetch blogs" });
  }
};

export const getBlogById = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid ID" });
    }
    const blog = await blogService.getBlogByIdService(id);
    if (!blog) return res.status(404).json({ message: "Blog not found" });
    res.json(blog);
  } catch (err) {
    console.error("getBlogById error:", err);
    res.status(500).json({ message: "Failed to fetch blog" });
  }
};

export const getBlogsByAuthor = async (req: Request, res: Response) => {
  try {
    const authorId = Number(req.params.authorId);
    if (isNaN(authorId)) {
      return res.status(400).json({ message: "Invalid author ID" });
    }
    const blogs = await blogService.getBlogsByAuthorService(authorId);
    res.json(blogs);
  } catch (err) {
    console.error("getBlogsByAuthor error:", err);
    res.status(500).json({ message: "Failed to fetch author blogs" });
  }
};

// ✅ UPDATE THIS - Extract image_url from request body
export const createBlog = async (req: Request, res: Response) => {
  try {
    const { title, content, image_url } = req.body; // ✅ Add image_url
    const user = (req as any).user;

    console.log('📝 Creating blog:', { title, content, image_url, author_id: user.author_id }); // ✅ Debug log

    if (!title || !content) {
      return res.status(400).json({ message: "Title and content are required" });
    }

    const author_id = user.author_id;
        
    if (!author_id) {
      return res.status(400).json({ message: "Author ID not found" });
    }

    const newBlog = await blogService.createBlogService({ 
      title, 
      content, 
      author_id,
      image_url // ✅ Pass image_url
    });

    console.log('✅ Blog created:', newBlog); // ✅ Debug log

    res.status(201).json(newBlog);
  } catch (err) {
    console.error("createBlog error:", err);
    res.status(500).json({ message: "Failed to create blog" });
  }
};

// ✅ UPDATE THIS - Extract image_url from request body
export const updateBlog = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid ID" });
    }

    const { title, content, image_url } = req.body; // ✅ Add image_url
    const user = (req as any).user;

    console.log('✏️ Updating blog:', { id, title, content, image_url, author_id: user.author_id }); // ✅ Debug log

    // Check if blog exists
    const existingBlog = await blogService.getBlogByIdService(id);
    if (!existingBlog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    // Only the author can update their blog
    if (existingBlog.author_id !== user.author_id) {
      return res.status(403).json({ message: "Access denied. You can only edit your own blogs." });
    }

    const updated = await blogService.updateBlogService(id, { 
      title, 
      content,
      image_url // ✅ Pass image_url
    });

    console.log('✅ Blog updated:', updated); // ✅ Debug log

    res.json(updated);
  } catch (err) {
    console.error("updateBlog error:", err);
    res.status(500).json({ message: "Failed to update blog" });
  }
};

export const deleteBlog = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid ID" });
    }

    const user = (req as any).user;

    // Check if blog exists
    const existingBlog = await blogService.getBlogByIdService(id);
    if (!existingBlog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    // Only the author can delete their blog
    if (existingBlog.author_id !== user.author_id) {
      return res.status(403).json({ message: "Access denied. You can only delete your own blogs." });
    }

    await blogService.deleteBlogService(id);
    
    console.log('✅ Blog deleted:', id); // ✅ Debug log

    res.json({ message: "Blog deleted successfully" });
  } catch (err) {
    console.error("deleteBlog error:", err);
    res.status(500).json({ message: "Failed to delete blog" });
  }
};