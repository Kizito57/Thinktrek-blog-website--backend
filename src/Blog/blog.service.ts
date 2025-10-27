// backend/src/modules/blog/blog.service.ts
import db from '../Drizzle/db';
import { eq, desc } from 'drizzle-orm';
import { AuthorTable, BlogTable } from '../Drizzle/schema';

export type BlogRow = typeof BlogTable.$inferSelect;
export type NewBlogInput = typeof BlogTable.$inferInsert;

// Get all blogs with author information
export const getAllBlogsService = async () => {
  return await db
    .select({
      id: BlogTable.id,
      title: BlogTable.title,
      content: BlogTable.content,
      image_url: BlogTable.image_url, // ✅ ADD THIS
      author_id: BlogTable.author_id,
      created_at: BlogTable.created_at,
      updated_at: BlogTable.updated_at,
      author: {
        author_id: AuthorTable.author_id,
        first_name: AuthorTable.first_name,
        last_name: AuthorTable.last_name,
        email: AuthorTable.email,
        image_url: AuthorTable.image_url,
      }
    })
    .from(BlogTable)
    .leftJoin(AuthorTable as any, eq(BlogTable.author_id, AuthorTable.author_id))
    .orderBy(desc(BlogTable.created_at));
};

// Get blog by ID with author information
export const getBlogByIdService = async (id: number) => {
  const rows = await db
    .select({
      id: BlogTable.id,
      title: BlogTable.title,
      content: BlogTable.content,
      image_url: BlogTable.image_url, // ✅ ADD THIS
      author_id: BlogTable.author_id,
      created_at: BlogTable.created_at,
      updated_at: BlogTable.updated_at,
      author: {
        author_id: AuthorTable.author_id,
        first_name: AuthorTable.first_name,
        last_name: AuthorTable.last_name,
        email: AuthorTable.email,
        image_url: AuthorTable.image_url,
      }
    })
    .from(BlogTable)
    .leftJoin(AuthorTable as any, eq(BlogTable.author_id, AuthorTable.author_id))
    .where(eq(BlogTable.id, id));
  return rows[0] ?? null;
};

// ✅ UPDATE THIS - Add image_url parameter
export const createBlogService = async (
  payload: Pick<NewBlogInput, 'title' | 'content' | 'author_id' | 'image_url'>
): Promise<BlogRow> => {
  const [inserted] = await db.insert(BlogTable).values({
    title: payload.title,
    content: payload.content,
    author_id: payload.author_id,
    image_url: payload.image_url || null, // ✅ Handle image_url
  }).returning();
  return inserted;
};

// ✅ UPDATE THIS - Add image_url parameter
export const updateBlogService = async (
  id: number,
  payload: Partial<Pick<BlogRow, 'title' | 'content' | 'image_url'>> // ✅ Add image_url
): Promise<BlogRow | null> => {
  await db
    .update(BlogTable)
    .set({ 
      ...payload, 
      image_url: payload.image_url !== undefined ? (payload.image_url || null) : undefined, // ✅ Handle image_url
      updated_at: new Date() 
    })
    .where(eq(BlogTable.id, id));
  
  const rows = await db.select().from(BlogTable).where(eq(BlogTable.id, id));
  return rows[0] ?? null;
};

export const deleteBlogService = async (id: number): Promise<boolean> => {
  await db.delete(BlogTable).where(eq(BlogTable.id, id));
  return true;
};

// Get blogs by author
export const getBlogsByAuthorService = async (authorId: number) => {
  return await db
    .select({
      id: BlogTable.id,
      title: BlogTable.title,
      content: BlogTable.content,
      image_url: BlogTable.image_url, // ✅ ADD THIS
      author_id: BlogTable.author_id,
      created_at: BlogTable.created_at,
      updated_at: BlogTable.updated_at,
    })
    .from(BlogTable)
    .where(eq(BlogTable.author_id, authorId))
    .orderBy(desc(BlogTable.created_at));
};