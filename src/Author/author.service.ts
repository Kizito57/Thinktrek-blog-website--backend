// backend/src/modules/author/author.service.ts
import db from '../Drizzle/db';

import { eq } from 'drizzle-orm';
import { TSAuthor, TIAuthor, AuthorTable } from '../Drizzle/schema';

// Get all authors
export const getAllAuthors = async (): Promise<TSAuthor[]> => {
  return await db.select().from(AuthorTable);
};

// Get author by ID
export const getAuthorById = async (id: number): Promise<TSAuthor | undefined> => {
  const result = await db.select().from(AuthorTable).where(eq(AuthorTable.author_id, id));
  return result[0];
};

// Get author by email (for login)
export const getAuthorByEmail = async (email: string): Promise<TSAuthor | undefined> => {
  const result = await db.select().from(AuthorTable).where(eq(AuthorTable.email, email));
  return result[0];
};

// Create new author
export const createAuthor = async (data: TIAuthor): Promise<TSAuthor | undefined> => {
  try {
    const result = await db.insert(AuthorTable).values(data).returning();
    return result[0];
  } catch (error: any) {
    if (error.code === '23505') {
      throw new Error('Email already exists');
    }
    throw error;
  }
};

// Update author
export const updateAuthor = async (id: number, data: Partial<TIAuthor>): Promise<TSAuthor | undefined> => {
  try {
    const result = await db.update(AuthorTable)
      .set({ ...data, updated_at: new Date() })
      .where(eq(AuthorTable.author_id, id))
      .returning();
    return result[0];
  } catch (error: any) {
    if (error.code === '23505') {
      throw new Error('Email already exists');
    }
    throw error;
  }
};

// Delete author
export const deleteAuthor = async (id: number): Promise<boolean> => {
  const result = await db.delete(AuthorTable)
    .where(eq(AuthorTable.author_id, id))
    .returning();
  return result.length > 0;
};