import { 
  pgTable, 
  serial, 
  varchar, 
  text, 
  boolean, 
  timestamp, 
  integer 
} from "drizzle-orm/pg-core";

// -----------------------------
// AUTHORS TABLE
// -----------------------------
export const AuthorTable = pgTable("authors", {
  author_id: serial("author_id").primaryKey(),
  first_name: varchar("first_name", { length: 100 }).notNull(),
  last_name: varchar("last_name", { length: 100 }).notNull(),
  email: varchar("email", { length: 150 }).notNull().unique(),
  contact_phone: text("contact_phone"),
  password: varchar("password", { length: 255 }).notNull(),
  address: varchar("address", { length: 255 }),
  role: varchar("role", { length: 50 }).notNull().default("author"),
  verification_code: varchar("verification_code", { length: 10 }),
  is_verified: boolean("is_verified").notNull().default(false),
  image_url: varchar("image_url", { length: 500 }),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// -----------------------------
// BLOGS TABLE
// -----------------------------
export const BlogTable = pgTable("blogs", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  image_url: varchar("image_url", { length: 500 }), 

  // ✅ Foreign key relationship to authors
  author_id: integer("author_id")
    .notNull()
    .references(() => AuthorTable.author_id, {
      onDelete: "cascade", // delete blogs if author is deleted
      onUpdate: "cascade", // maintain referential integrity
    }),

  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// -----------------------------
// TYPE DEFINITIONS
// -----------------------------
export type TSAuthor = typeof AuthorTable.$inferSelect; // Type for selected author rows
export type TIAuthor = typeof AuthorTable.$inferInsert; // Type for inserting new authors

export type TSBlog = typeof BlogTable.$inferSelect; // Type for selected blogs
export type TIBlog = typeof BlogTable.$inferInsert; // Type for inserting new blogs
