import type { InferSelectModel } from "drizzle-orm";
import {
  doublePrecision,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const USER_ROLES = ["customer", "admin"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const user = pgTable(
  "User",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    naverId: varchar("naverId", { length: 64 }),
    email: varchar("email", { length: 128 }),
    nickname: varchar("nickname", { length: 64 }),
    name: varchar("name", { length: 64 }),
    profileImage: text("profileImage"),
    role: varchar("role", { length: 16, enum: USER_ROLES })
      .notNull()
      .default("customer"),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  },
  (table) => ({
    naverIdIdx: uniqueIndex("User_naverId_idx").on(table.naverId),
  })
);

export type User = InferSelectModel<typeof user>;

export const visit = pgTable(
  "Visit",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    userId: uuid("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    visitedAt: timestamp("visitedAt").notNull().defaultNow(),
    lat: doublePrecision("lat").notNull(),
    lng: doublePrecision("lng").notNull(),
  },
  (table) => ({
    userVisitedIdx: index("Visit_user_visitedAt_idx").on(
      table.userId,
      table.visitedAt
    ),
  })
);

export type Visit = InferSelectModel<typeof visit>;

export const book = pgTable(
  "Book",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    isbn: varchar("isbn", { length: 13 }).notNull(),
    title: text("title").notNull(),
    author: text("author"),
    publisher: varchar("publisher", { length: 200 }),
    publishDate: varchar("publishDate", { length: 8 }),
    coverImageUrl: text("coverImageUrl"),
    description: text("description"),
    kdc: varchar("kdc", { length: 16 }),
    ownerComment: text("ownerComment"),
    addedByUserId: uuid("addedByUserId").references(() => user.id, {
      onDelete: "set null",
    }),
    fetchedAt: timestamp("fetchedAt").notNull().defaultNow(),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
  },
  (table) => ({
    isbnIdx: uniqueIndex("Book_isbn_idx").on(table.isbn),
    titleIdx: index("Book_title_idx").on(table.title),
  })
);

export type Book = InferSelectModel<typeof book>;

export const record = pgTable(
  "Record",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    userId: uuid("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    bookId: uuid("bookId")
      .notNull()
      .references(() => book.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  },
  (table) => ({
    createdAtIdx: index("Record_createdAt_idx").on(table.createdAt),
    userIdx: index("Record_userId_idx").on(table.userId),
    bookIdx: index("Record_bookId_idx").on(table.bookId),
  })
);

export type Record = InferSelectModel<typeof record>;
