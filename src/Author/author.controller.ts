// backend/src/modules/author/author.controller.ts
import bcrypt from 'bcryptjs';
import { Request, Response } from 'express';
import * as authorService from './author.service';
import jwt from 'jsonwebtoken';
import { sendWelcomeEmail, sendVerificationEmail } from '../email/email.service';

// GET all authors
export const getAllAuthors = async (req: Request, res: Response) => {
  try {
    const authors = await authorService.getAllAuthors();
    // Remove passwords from response
    const authorsWithoutPasswords = authors.map(({ password, ...author }) => author);
    res.status(200).json(authorsWithoutPasswords);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// GET author by ID
export const getAuthorById = async (req: Request, res: Response) => {
  try {
    const requestedId = Number(req.params.id);
    const user = (req as any).user;

    // Author can only see their own profile
    if (user.author_id !== requestedId) {
      return res.status(403).json({ error: "Access denied" });
    }

    const author = await authorService.getAuthorById(requestedId);
    if (!author) {
      return res.status(404).json({ error: "Author not found" });
    }

    // Remove password from response
    const { password, ...authorData } = author;
    res.status(200).json(authorData);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// CREATE new author (Registration)
export const createAuthor = async (req: Request, res: Response) => {
  try {
    const { password, ...authorData } = req.body;

    if (!password) {
      return res.status(400).json({ error: "Password is required" });
    }

    // Validate required fields
    if (!authorData.first_name || !authorData.last_name || !authorData.email) {
      return res.status(400).json({ error: "First name, last name, and email are required" });
    }

    // Generate verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Hash password
    const hashedPassword = bcrypt.hashSync(password, 10);
    const newAuthorData = {
      ...authorData,
      password: hashedPassword,
      verification_code: verificationCode,
      is_verified: false
    };

    const newAuthor = await authorService.createAuthor(newAuthorData);
    if (!newAuthor) {
      return res.status(400).json({ error: "Author registration failed" });
    }

    // Send verification email
    const authorName = `${newAuthor.first_name} ${newAuthor.last_name}`;
    sendVerificationEmail(newAuthor.email, authorName, verificationCode)
      .then(() => console.log(`Verification email sent to ${newAuthor.email}`))
      .catch(err => console.error('Verification email send failed:', err.message));

    res.status(201).json({
      message: "Author registered successfully. Please check your email for verification code.",
      author: {
        author_id: newAuthor.author_id,
        first_name: newAuthor.first_name,
        last_name: newAuthor.last_name,
        email: newAuthor.email,
        is_verified: newAuthor.is_verified
      }
    });
  } catch (error: any) {
    if (error.message.includes('Email already exists')) {
      return res.status(400).json({ error: "Email already registered" });
    }
    res.status(500).json({ error: error.message });
  }
};

// Verify author email with code
export const verifyAuthorEmail = async (req: Request, res: Response) => {
  try {
    const { email, verificationCode } = req.body;

    if (!email || !verificationCode) {
      return res.status(400).json({ error: "Email and verification code are required" });
    }

    const author = await authorService.getAuthorByEmail(email);
    if (!author) {
      return res.status(404).json({ error: "Author not found" });
    }

    if (author.is_verified) {
      return res.status(400).json({ error: "Email already verified" });
    }

    if (author.verification_code !== verificationCode) {
      return res.status(400).json({ error: "Invalid verification code" });
    }

    // Update author as verified
    const updated = await authorService.updateAuthor(author.author_id, {
      is_verified: true,
      verification_code: null
    });

    if (updated) {
      // Send welcome email after verification
      const authorName = `${author.first_name} ${author.last_name}`;
      sendWelcomeEmail(author.email, authorName)
        .then(() => console.log(`Welcome email sent to ${author.email}`))
        .catch(err => console.error('Welcome email send failed:', err.message));
    }

    res.status(200).json({
      message: "Email verified successfully. You can now login.",
      author: {
        author_id: updated?.author_id,
        first_name: updated?.first_name,
        last_name: updated?.last_name,
        email: updated?.email,
        is_verified: updated?.is_verified
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Author login
export const loginAuthor = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Check if author exists
    const author = await authorService.getAuthorByEmail(email);
    if (!author) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Check if email is verified
    if (!author.is_verified) {
      return res.status(401).json({ error: "Please verify your email before logging in" });
    }

    // Verify password
    const passwordMatch = bcrypt.compareSync(password, author.password as string);
    if (!passwordMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Create JWT token
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error("JWT_SECRET not configured");
    }

    const payload = {
      sub: author.author_id,
      author_id: author.author_id,
      first_name: author.first_name,
      last_name: author.last_name,
      email: author.email,
      exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 7) // 7 days
    };

    const token = jwt.sign(payload, secret);

    res.status(200).json({
      message: "Login successful",
      token,
      author: {
        author_id: author.author_id,
        first_name: author.first_name,
        last_name: author.last_name,
        email: author.email,
        image_url: author.image_url,
        is_verified: author.is_verified
      }
    });

  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// UPDATE author (own profile only)
export const updateAuthor = async (req: Request, res: Response) => {
  try {
    const authorId = Number(req.params.id);
    const user = (req as any).user;
    const updateData = { ...req.body };

    // Author can only update their own profile
    if (user.author_id !== authorId) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Hash password if being updated
    if (updateData.password) {
      updateData.password = bcrypt.hashSync(updateData.password, 10);
    }

    // Don't allow updating verification status
    delete updateData.is_verified;
    delete updateData.verification_code;

    const updated = await authorService.updateAuthor(authorId, updateData);
    if (!updated) {
      return res.status(404).json({ error: "Author not found" });
    }

    // Remove password from response
    const { password, ...authorData } = updated;
    res.status(200).json({
      message: "Profile updated successfully",
      author: authorData
    });
  } catch (error: any) {
    if (error.message.includes('Email already exists')) {
      return res.status(400).json({ error: "Email already in use" });
    }
    res.status(500).json({ error: error.message });
  }
};

// DELETE author (own account only)
export const deleteAuthor = async (req: Request, res: Response) => {
  try {
    const authorId = Number(req.params.id);
    const user = (req as any).user;

    // Author can only delete their own account
    if (user.author_id !== authorId) {
      return res.status(403).json({ error: "Access denied" });
    }

    const deleted = await authorService.deleteAuthor(authorId);

    if (!deleted) {
      return res.status(404).json({ error: "Author not found" });
    }

    res.status(200).json({ message: "Account deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};