import bcrypt from 'bcryptjs';
import { Request, Response } from 'express';
import * as authorService from './author.service';
import jwt from 'jsonwebtoken';
import { sendWelcomeEmail, sendVerificationEmail } from '../email/email.service';

// GET all authors (public - for blog display only)
export const getAllAuthors = async (req: Request, res: Response) => {
  try {
    const authors = await authorService.getAllAuthors();
    // Only return safe public data
    const safeAuthors = authors.map(({ author_id, first_name, last_name, image_url }) => ({
      author_id,
      first_name,
      last_name,
      image_url
    }));
    res.status(200).json(safeAuthors);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch authors' });
  }
};

// GET author by ID (protected)
export const getAuthorById = async (req: Request, res: Response) => {
  try {
    const requestedId = Number(req.params.id);
    const user = (req as any).user;

    if (user.author_id !== requestedId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const author = await authorService.getAuthorById(requestedId);
    if (!author) {
      return res.status(404).json({ error: 'Author not found' });
    }

    const { password, verification_code, ...authorData } = author;
    res.status(200).json(authorData);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch author' });
  }
};

// CREATE new author (Registration)
export const createAuthor = async (req: Request, res: Response) => {
  try {
    const { password, ...authorData } = req.body;

    // Validate required fields
    if (!password || !authorData.first_name || !authorData.last_name || !authorData.email) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(authorData.email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Validate password strength (min 6 chars)
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Generate secure 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Hash password with high salt rounds for security
    const hashedPassword = await bcrypt.hash(password, 12);
    
    const newAuthorData = {
      ...authorData,
      password: hashedPassword,
      verification_code: verificationCode,
      is_verified: false
    };

    const newAuthor = await authorService.createAuthor(newAuthorData);
    if (!newAuthor) {
      return res.status(400).json({ error: 'Registration failed' });
    }

    // Send verification email (don't block response)
    const authorName = `${newAuthor.first_name} ${newAuthor.last_name}`;
    sendVerificationEmail(newAuthor.email, authorName, verificationCode).catch(() => {
      // Silent fail - email is not critical to registration flow
    });

    res.status(201).json({
      message: 'Registration successful. Check your email for verification code.',
      author: {
        author_id: newAuthor.author_id,
        email: newAuthor.email
      }
    });
  } catch (error: any) {
    if (error.message.includes('Email already exists')) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    res.status(500).json({ error: 'Registration failed' });
  }
};

// Verify author email with code
export const verifyAuthorEmail = async (req: Request, res: Response) => {
  try {
    const { email, verificationCode } = req.body;

    if (!email || !verificationCode) {
      return res.status(400).json({ error: 'Email and verification code required' });
    }

    const author = await authorService.getAuthorByEmail(email);
    if (!author) {
      return res.status(404).json({ error: 'Account not found' });
    }

    if (author.is_verified) {
      return res.status(400).json({ error: 'Email already verified' });
    }

    if (author.verification_code !== verificationCode) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    // Update author as verified
    const updated = await authorService.updateAuthor(author.author_id, {
      is_verified: true,
      verification_code: null
    });

    if (updated) {
      const authorName = `${author.first_name} ${author.last_name}`;
      sendWelcomeEmail(author.email, authorName).catch(() => {
        // Silent fail - email is not critical
      });
    }

    res.status(200).json({
      message: 'Email verified successfully. You can now login.'
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Verification failed' });
  }
};

// Author login
export const loginAuthor = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Check if author exists
    const author = await authorService.getAuthorByEmail(email);
    if (!author) {
      // Use generic message to prevent user enumeration
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if email is verified
    if (!author.is_verified) {
      return res.status(401).json({ error: 'Please verify your email before logging in' });
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, author.password as string);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Create JWT token
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({ error: 'Server configuration error' });
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
      message: 'Login successful',
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
    res.status(500).json({ error: 'Login failed' });
  }
};

// UPDATE author (own profile only)
export const updateAuthor = async (req: Request, res: Response) => {
  try {
    const authorId = Number(req.params.id);
    const user = (req as any).user;
    const updateData = { ...req.body };

    if (user.author_id !== authorId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Hash password if being updated
    if (updateData.password) {
      if (updateData.password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
      }
      updateData.password = await bcrypt.hash(updateData.password, 12);
    }

    // Prevent updating sensitive fields
    delete updateData.is_verified;
    delete updateData.verification_code;

    const updated = await authorService.updateAuthor(authorId, updateData);
    if (!updated) {
      return res.status(404).json({ error: 'Author not found' });
    }

    const { password, verification_code, ...authorData } = updated;
    res.status(200).json({
      message: 'Profile updated successfully',
      author: authorData
    });
  } catch (error: any) {
    if (error.message.includes('Email already exists')) {
      return res.status(400).json({ error: 'Email already in use' });
    }
    res.status(500).json({ error: 'Update failed' });
  }
};

// DELETE author (own account only)
export const deleteAuthor = async (req: Request, res: Response) => {
  try {
    const authorId = Number(req.params.id);
    const user = (req as any).user;

    if (user.author_id !== authorId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const deleted = await authorService.deleteAuthor(authorId);
    if (!deleted) {
      return res.status(404).json({ error: 'Author not found' });
    }

    res.status(200).json({ message: 'Account deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: 'Deletion failed' });
  }
};