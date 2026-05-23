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

export const user = pgTable(
  "User",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    naverId: varchar("naverId", { length: 64 }),
    email: varchar("email", { length: 128 }),
    nickname: varchar("nickname", { length: 64 }),
    profileImage: text("profileImage"),
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

export const POST_KINDS = ["필사", "후기", "메모"] as const;
export type PostKind = (typeof POST_KINDS)[number];

export const post = pgTable(
  "Post",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    userId: uuid("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    kind: varchar("kind", { length: 16, enum: POST_KINDS }).notNull(),
    content: text("content").notNull(),
    bookTitle: varchar("bookTitle", { length: 200 }),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
  },
  (table) => ({
    createdAtIdx: index("Post_createdAt_idx").on(table.createdAt),
  })
);

export type Post = InferSelectModel<typeof post>;
