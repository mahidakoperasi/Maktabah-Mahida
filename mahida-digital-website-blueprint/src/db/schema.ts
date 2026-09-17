import {
  pgTable,
  text,
  varchar,
  timestamp,
  boolean,
  integer,
  json,
  serial,
  pgEnum,
  primaryKey,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// Enums
export const postTypeEnum = pgEnum("post_type", [
  "ARTICLE",
  "ESSAY",
  "NEWS",
  "WORK",
  "STORY",
  "ANNOUNCEMENT",
]);

export const postStatusEnum = pgEnum("post_status", [
  "DRAFT",
  "SCHEDULED",
  "PUBLISHED",
  "ARCHIVED",
]);

export const userRoleEnum = pgEnum("user_role", ["USER", "ADMIN"]);

// Tables
export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    password: text("password").notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    bio: text("bio"),
    avatar: text("avatar"),
    role: userRoleEnum("role").default("USER").notNull(),
    isVerified: boolean("is_verified").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("email_idx").on(table.email),
    index("role_idx").on(table.role),
  ]
);

export const otpCodes = pgTable(
  "otp_codes",
  {
    id: serial("id").primaryKey(),
    email: varchar("email", { length: 255 }).notNull(),
    code: varchar("code", { length: 6 }).notNull(),
    codeHash: text("code_hash").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    attempts: integer("attempts").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("email_otp_idx").on(table.email)]
);

export const profiles = pgTable(
  "profiles",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    bio: text("bio"),
    institution: varchar("institution", { length: 255 }),
    avatar: text("avatar"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [index("user_profile_idx").on(table.userId)]
);

export const authors = pgTable(
  "authors",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull().unique(),
    bio: text("bio"),
    avatar: text("avatar"),
    institution: varchar("institution", { length: 255 }),
    email: varchar("email", { length: 255 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [uniqueIndex("author_slug_idx").on(table.slug)]
);

export const categories = pgTable(
  "categories",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull().unique(),
    description: text("description"),
    icon: text("icon"),
    type: varchar("type", { length: 50 }).notNull(), // "karya", "literasi", "maktabah", etc
    order: integer("order").default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("category_slug_idx").on(table.slug),
    index("category_type_idx").on(table.type),
  ]
);

export const tags = pgTable(
  "tags",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull().unique(),
    slug: varchar("slug", { length: 255 }).notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [uniqueIndex("tag_slug_idx").on(table.slug)]
);

export const posts = pgTable(
  "posts",
  {
    id: serial("id").primaryKey(),
    title: varchar("title", { length: 500 }).notNull(),
    slug: varchar("slug", { length: 500 }).notNull().unique(),
    excerpt: text("excerpt"),
    content: text("content"),
    featuredImage: text("featured_image"),
    type: postTypeEnum("type").default("ARTICLE").notNull(),
    status: postStatusEnum("status").default("DRAFT").notNull(),
    authorId: integer("author_id").references(() => authors.id, {
      onDelete: "set null",
    }),
    userId: integer("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    publishedAt: timestamp("published_at"),
    scheduledAt: timestamp("scheduled_at"),
    viewCount: integer("view_count").default(0),
    readingTime: integer("reading_time"), // in seconds
    seoTitle: varchar("seo_title", { length: 255 }),
    seoDescription: varchar("seo_description", { length: 255 }),
    seoKeywords: text("seo_keywords"),
    ogImage: text("og_image"),
    canonical: text("canonical"),
    indexable: boolean("indexable").default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("post_slug_idx").on(table.slug),
    index("post_type_idx").on(table.type),
    index("post_status_idx").on(table.status),
    index("post_author_idx").on(table.authorId),
    index("post_published_idx").on(table.publishedAt),
  ]
);

export const postCategories = pgTable(
  "post_categories",
  {
    postId: integer("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    categoryId: integer("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.postId, table.categoryId] })]
);

export const postTags = pgTable(
  "post_tags",
  {
    postId: integer("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    tagId: integer("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.postId, table.tagId] })]
);

export const docxFiles = pgTable(
  "docx_files",
  {
    id: serial("id").primaryKey(),
    postId: integer("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    originalName: varchar("original_name", { length: 500 }).notNull(),
    fileName: varchar("file_name", { length: 500 }).notNull(),
    fileSize: integer("file_size"),
    mimeType: varchar("mime_type", { length: 100 }),
    isDownloadable: boolean("is_downloadable").default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("docx_post_idx").on(table.postId)]
);

export const media = pgTable(
  "media",
  {
    id: serial("id").primaryKey(),
    url: text("url").notNull(),
    altText: varchar("alt_text", { length: 500 }),
    caption: text("caption"),
    fileName: varchar("file_name", { length: 500 }),
    fileSize: integer("file_size"),
    mimeType: varchar("mime_type", { length: 100 }),
    width: integer("width"),
    height: integer("height"),
    focalPointX: integer("focal_point_x"),
    focalPointY: integer("focal_point_y"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("media_created_idx").on(table.createdAt)]
);

export const videos = pgTable(
  "videos",
  {
    id: serial("id").primaryKey(),
    title: varchar("title", { length: 500 }).notNull(),
    slug: varchar("slug", { length: 500 }).notNull().unique(),
    youtubeId: varchar("youtube_id", { length: 100 }).notNull(),
    description: text("description"),
    caption: text("caption"),
    thumbnail: text("thumbnail"),
    categoryId: integer("category_id").references(() => categories.id, {
      onDelete: "set null",
    }),
    featured: boolean("featured").default(false),
    publishedAt: timestamp("published_at").defaultNow(),
    viewCount: integer("view_count").default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("video_slug_idx").on(table.slug),
    index("video_youtube_idx").on(table.youtubeId),
  ]
);

export const socialPosts = pgTable(
  "social_posts",
  {
    id: serial("id").primaryKey(),
    platform: varchar("platform", { length: 50 }).notNull(), // "facebook", "instagram"
    postUrl: text("post_url").notNull(),
    caption: text("caption"),
    categoryId: integer("category_id").references(() => categories.id, {
      onDelete: "set null",
    }),
    featured: boolean("featured").default(false),
    publishedAt: timestamp("published_at").defaultNow(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [index("social_platform_idx").on(table.platform)]
);

export const events = pgTable(
  "events",
  {
    id: serial("id").primaryKey(),
    title: varchar("title", { length: 500 }).notNull(),
    slug: varchar("slug", { length: 500 }).notNull().unique(),
    description: text("description"),
    startDate: timestamp("start_date").notNull(),
    endDate: timestamp("end_date"),
    location: varchar("location", { length: 500 }),
    featured: boolean("featured").default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("event_slug_idx").on(table.slug),
    index("event_date_idx").on(table.startDate),
  ]
);

export const galleries = pgTable(
  "galleries",
  {
    id: serial("id").primaryKey(),
    title: varchar("title", { length: 500 }).notNull(),
    slug: varchar("slug", { length: 500 }).notNull().unique(),
    description: text("description"),
    type: varchar("type", { length: 50 }).notNull(), // "album" or "photostory"
    eventId: integer("event_id").references(() => events.id, {
      onDelete: "set null",
    }),
    featured: boolean("featured").default(false),
    publishedAt: timestamp("published_at").defaultNow(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("gallery_slug_idx").on(table.slug),
    index("gallery_type_idx").on(table.type),
  ]
);

export const galleryImages = pgTable(
  "gallery_images",
  {
    id: serial("id").primaryKey(),
    galleryId: integer("gallery_id")
      .notNull()
      .references(() => galleries.id, { onDelete: "cascade" }),
    mediaId: integer("media_id")
      .notNull()
      .references(() => media.id),
    caption: text("caption"),
    order: integer("order").default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("gallery_image_idx").on(table.galleryId)]
);

export const products = pgTable(
  "products",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 500 }).notNull(),
    slug: varchar("slug", { length: 500 }).notNull().unique(),
    description: text("description"),
    image: text("image"),
    categoryId: integer("category_id").references(() => categories.id, {
      onDelete: "set null",
    }),
    featured: boolean("featured").default(false),
    active: boolean("active").default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [uniqueIndex("product_slug_idx").on(table.slug)]
);

export const archives = pgTable(
  "archives",
  {
    id: serial("id").primaryKey(),
    title: varchar("title", { length: 500 }).notNull(),
    slug: varchar("slug", { length: 500 }).notNull().unique(),
    description: text("description"),
    year: integer("year"),
    month: integer("month"),
    eventId: integer("event_id").references(() => events.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("archive_slug_idx").on(table.slug),
    index("archive_year_idx").on(table.year),
  ]
);

export const archiveItems = pgTable(
  "archive_items",
  {
    id: serial("id").primaryKey(),
    archiveId: integer("archive_id")
      .notNull()
      .references(() => archives.id, { onDelete: "cascade" }),
    postId: integer("post_id").references(() => posts.id, {
      onDelete: "set null",
    }),
    eventId: integer("event_id").references(() => events.id, {
      onDelete: "set null",
    }),
    mediaId: integer("media_id").references(() => media.id, {
      onDelete: "set null",
    }),
    order: integer("order").default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("archive_items_idx").on(table.archiveId)]
);

export const bookmarks = pgTable(
  "bookmarks",
  {
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    postId: integer("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.postId] }),
    index("bookmark_user_idx").on(table.userId),
  ]
);

export const collections = pgTable(
  "collections",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    isPublic: boolean("is_public").default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [index("collection_user_idx").on(table.userId)]
);

export const collectionItems = pgTable(
  "collection_items",
  {
    id: serial("id").primaryKey(),
    collectionId: integer("collection_id")
      .notNull()
      .references(() => collections.id, { onDelete: "cascade" }),
    postId: integer("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    order: integer("order").default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("collection_items_idx").on(table.collectionId)]
);

export const readingHistory = pgTable(
  "reading_history",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    postId: integer("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    readAt: timestamp("read_at").defaultNow().notNull(),
    scrollPosition: integer("scroll_position").default(0),
    progressPercent: integer("progress_percent").default(0),
    lastReadAt: timestamp("last_read_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("reading_history_user_idx").on(table.userId),
    index("reading_history_post_idx").on(table.postId),
  ]
);

export const comments = pgTable(
  "comments",
  {
    id: serial("id").primaryKey(),
    postId: integer("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    approved: boolean("approved").default(false),
    parentId: integer("parent_id"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("comment_post_idx").on(table.postId),
    index("comment_user_idx").on(table.userId),
  ]
);

export const revisions = pgTable(
  "revisions",
  {
    id: serial("id").primaryKey(),
    postId: integer("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 500 }),
    content: text("content"),
    excerpt: text("excerpt"),
    data: json("data"), // Any additional data
    createdBy: integer("created_by").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("revision_post_idx").on(table.postId)]
);

export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 255 }).notNull().unique(),
  value: text("value"),
  type: varchar("type", { length: 50 }),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const analytics = pgTable(
  "analytics",
  {
    id: serial("id").primaryKey(),
    postId: integer("post_id").references(() => posts.id, {
      onDelete: "set null",
    }),
    userId: integer("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    viewedAt: timestamp("viewed_at").defaultNow().notNull(),
    referrer: text("referrer"),
    userAgent: text("user_agent"),
    ipHash: varchar("ip_hash", { length: 255 }),
  },
  (table) => [
    index("analytics_post_idx").on(table.postId),
    index("analytics_viewed_idx").on(table.viewedAt),
  ]
);

export type User = typeof users.$inferSelect;
export type Post = typeof posts.$inferSelect;
export type Author = typeof authors.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Tag = typeof tags.$inferSelect;
export type Video = typeof videos.$inferSelect;
export type Event = typeof events.$inferSelect;
export type Gallery = typeof galleries.$inferSelect;
export type Product = typeof products.$inferSelect;
