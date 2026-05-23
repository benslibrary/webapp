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
