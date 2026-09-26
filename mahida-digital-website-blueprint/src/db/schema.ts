import { pgTable, serial, varchar, text, boolean, integer, timestamp, pgEnum, jsonb, real, uuid } from 'drizzle-orm/pg-core';

// Enums
export const postTypeEnum = pgEnum('post_type', ['article', 'essay', 'news', 'work', 'story', 'announcement']);
export const postStatusEnum = pgEnum('post_status', ['draft', 'scheduled', 'published', 'archived']);
export const userRoleEnum = pgEnum('user_role', ['user', 'admin']);

// Users
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uuid: uuid('uuid').defaultRandom().unique(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  avatar: text('avatar'),
  bio: text('bio'),
  role: userRoleEnum('role').default('user'),
  emailVerified: boolean('email_verified').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// OTP Codes
export const otpCodes = pgTable('otp_codes', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
  code: varchar('code', { length: 6 }).notNull(),
  type: varchar('type', { length: 50 }), // 'verification', 'password_reset', 'email_change'
  expiresAt: timestamp('expires_at').notNull(),
  used: boolean('used').default(false),
  attempts: integer('attempts').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

// Authors
export const authors = pgTable('authors', {
  id: serial('id').primaryKey(),
  slug: varchar('slug', { length: 255 }).unique().notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  photo: text('photo'),
  bio: text('bio'),
  institution: varchar('institution', { length: 255 }),
  email: varchar('email', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow(),
});

// Categories
export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 100 }).unique().notNull(),
  description: text('description'),
  type: varchar('type', { length: 50 }), // 'post', 'karya', 'maktabah', 'literasi', etc.
  parentId: integer('parent_id'),
  sortOrder: integer('sort_order').default(0),
  color: varchar('color', { length: 7 }),
  createdAt: timestamp('created_at').defaultNow(),
});

// Tags
export const tags = pgTable('tags', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  slug: varchar('slug', { length: 100 }).unique().notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Posts (main content table)
export const posts = pgTable('posts', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 500 }).notNull(),
  slug: varchar('slug', { length: 500 }).unique().notNull(),
  excerpt: text('excerpt'),
  content: text('content'), // HTML content or JSON structure
  contentRaw: text('content_raw'), // Original content for editing
  type: postTypeEnum('type').notNull().default('article'),
  status: postStatusEnum('status').notNull().default('draft'),
  featuredImage: text('featured_image'),
  authorId: integer('author_id').references(() => authors.id),
  createdBy: integer('created_by').references(() => users.id),
  publishedAt: timestamp('published_at'),
  scheduledAt: timestamp('scheduled_at'),
  editorPick: boolean('editor_pick').default(false),
  viewCount: integer('view_count').default(0),
  
  // SEO
  metaTitle: varchar('meta_title', { length: 500 }),
  metaDescription: text('meta_description'),
  ogImage: text('og_image'),
  canonicalUrl: text('canonical_url'),
  indexable: boolean('indexable').default(true),

  // Reading
  readingTime: integer('reading_time'),

  // DOCX support
  docxFile: text('docx_file'),
  allowDocxDownload: boolean('allow_docx_download').default(false),

  // Archive reference
  archiveYear: integer('archive_year'),
  archiveMonth: integer('archive_month'),

  // Event reference
  eventId: integer('event_id'),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Post Categories junction
export const postCategories = pgTable('post_categories', {
  postId: integer('post_id').references(() => posts.id, { onDelete: 'cascade' }),
  categoryId: integer('category_id').references(() => categories.id, { onDelete: 'cascade' }),
});

// Post Tags junction
export const postTags = pgTable('post_tags', {
  postId: integer('post_id').references(() => posts.id, { onDelete: 'cascade' }),
  tagId: integer('tag_id').references(() => tags.id, { onDelete: 'cascade' }),
});

// Related posts
export const relatedPosts = pgTable('related_posts', {
  postId: integer('post_id').references(() => posts.id, { onDelete: 'cascade' }),
  relatedId: integer('related_id').references(() => posts.id, { onDelete: 'cascade' }),
});

// Books/Kitab (Maktabah)
export const books = pgTable('books', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 500 }).notNull(),
  slug: varchar('slug', { length: 500 }).unique().notNull(),
  arabicTitle: text('arabic_title'),
  authorName: varchar('author_name', { length: 255 }),
  translatorName: varchar('translator_name', { length: 255 }),
  categoryId: integer('category_id').references(() => categories.id),
  coverImage: text('cover_image'),
  description: text('description'),
  type: varchar('type', { length: 50 }), // 'kitab', 'book', 'translation'
  postId: integer('post_id').references(() => posts.id), // Link to post if has full content
  
  // Maktabah specific
  discipline: varchar('discipline', { length: 100 }), // Nahwu, Fiqh, Tafsir, etc.
  
  // Koperasi info
  isAvailable: boolean('is_available').default(false),
  price: real('price'),
  purchaseLink: text('purchase_link'),
  
  status: postStatusEnum('status').notNull().default('published'),
  viewCount: integer('view_count').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Videos / YouTube
export const videos = pgTable('videos', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 500 }).notNull(),
  slug: varchar('slug', { length: 500 }).unique().notNull(),
  videoId: varchar('video_id', { length: 20 }).notNull(), // YouTube ID
  platform: varchar('platform', { length: 20 }).default('youtube'),
  description: text('description'),
  thumbnailUrl: text('thumbnail_url'),
  categoryId: integer('category_id').references(() => categories.id),
  postId: integer('post_id').references(() => posts.id),
  featured: boolean('featured').default(false),
  publishedAt: timestamp('published_at'),
  status: postStatusEnum('status').notNull().default('published'),
  viewCount: integer('view_count').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

// Social Posts (Facebook, etc.)
export const socialPosts = pgTable('social_posts', {
  id: serial('id').primaryKey(),
  platform: varchar('platform', { length: 50 }).notNull(), // facebook, instagram, twitter
  postUrl: text('post_url').notNull(),
  caption: text('caption'),
  imageUrl: text('image_url'),
  categoryId: integer('category_id').references(() => categories.id),
  publishedAt: timestamp('published_at'),
  featured: boolean('featured').default(false),
  status: postStatusEnum('status').notNull().default('published'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Events / Agenda
export const events = pgTable('events', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 500 }).notNull(),
  slug: varchar('slug', { length: 500 }).unique().notNull(),
  description: text('description'),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date'),
  location: varchar('location', { length: 255 }),
  type: varchar('type', { length: 50 }), // agenda, pengumuman, prestasi
  featuredImage: text('featured_image'),
  categoryId: integer('category_id').references(() => categories.id),
  status: postStatusEnum('status').notNull().default('published'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Galleries
export const galleries = pgTable('galleries', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 500 }).notNull(),
  slug: varchar('slug', { length: 500 }).unique().notNull(),
  description: text('description'),
  type: varchar('type', { length: 50 }).default('album'), // album, photo_story
  coverImage: text('cover_image'),
  eventId: integer('event_id').references(() => events.id),
  status: postStatusEnum('status').notNull().default('published'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Gallery Images
export const galleryImages = pgTable('gallery_images', {
  id: serial('id').primaryKey(),
  galleryId: integer('gallery_id').references(() => galleries.id, { onDelete: 'cascade' }),
  imageUrl: text('image_url').notNull(),
  caption: text('caption'),
  sortOrder: integer('sort_order').default(0),
  focalPointX: real('focal_point_x'),
  focalPointY: real('focal_point_y'),
});

// Products (Koperasi)
export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).unique().notNull(),
  description: text('description'),
  category: varchar('category', { length: 100 }), // kitab, buku, atk, perlengkapan, paket
  price: real('price'),
  originalPrice: real('original_price'),
  image: text('image'),
  inStock: boolean('in_stock').default(true),
  orderInfo: text('order_info'),
  featured: boolean('featured').default(false),
  status: postStatusEnum('status').notNull().default('published'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Media Library
export const media = pgTable('media', {
  id: serial('id').primaryKey(),
  filename: varchar('filename', { length: 500 }).notNull(),
  altText: text('alt_text'),
  caption: text('caption'),
  url: text('url').notNull(),
  thumbnailUrl: text('thumbnail_url'),
  mimeType: varchar('mime_type', { length: 100 }),
  size: integer('size'),
  width: integer('width'),
  height: integer('height'),
  focalPointX: real('focal_point_x'),
  focalPointY: real('focal_point_y'),
  uploadedBy: integer('uploaded_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
});

// Bookmarks
export const bookmarks = pgTable('bookmarks', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  bookmarkType: varchar('bookmark_type', { length: 50 }).notNull(), // post, book, video
  itemId: integer('item_id').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Collections
export const collections = pgTable('collections', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  isDefault: boolean('is_default').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

// Collection Items
export const collectionItems = pgTable('collection_items', {
  id: serial('id').primaryKey(),
  collectionId: integer('collection_id').references(() => collections.id, { onDelete: 'cascade' }).notNull(),
  itemType: varchar('item_type', { length: 50 }).notNull(),
  itemId: integer('item_id').notNull(),
  addedAt: timestamp('added_at').defaultNow(),
});

// Reading History
export const readingHistory = pgTable('reading_history', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  itemType: varchar('item_type', { length: 50 }).notNull(),
  itemId: integer('item_id').notNull(),
  progress: real('progress').default(0), // 0-100 percentage
  lastPosition: text('last_position'),
  readAt: timestamp('read_at').defaultNow(),
});

// Comments
export const comments = pgTable('comments', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  postType: varchar('post_type', { length: 50 }).notNull(),
  postId: integer('post_id').notNull(),
  content: text('content').notNull(),
  parentId: integer('parent_id'),
  status: varchar('status', { length: 20 }).default('approved'), // pending, approved, rejected
  createdAt: timestamp('created_at').defaultNow(),
});

// Revisions
export const revisions = pgTable('revisions', {
  id: serial('id').primaryKey(),
  entityType: varchar('entity_type', { length: 50 }).notNull(), // post, book, page, etc.
  entityId: integer('entity_id').notNull(),
  data: jsonb('data').notNull(),
  revisionNote: text('revision_note'),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
});

// Settings (key-value store for site settings, homepage config, etc.)
export const settings = pgTable('settings', {
  key: varchar('key', { length: 255 }).primaryKey(),
  value: text('value'),
  type: varchar('type', { length: 50 }).default('string'), // string, json, number, boolean
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Analytics Events (simple analytics)
export const analyticsEvents = pgTable('analytics_events', {
  id: serial('id').primaryKey(),
  eventType: varchar('event_type', { length: 50 }).notNull(), // pageview, search, bookmark, etc.
  entityType: varchar('entity_type', { length: 50 }),
  entityId: integer('entity_id'),
  url: text('url'),
  referrer: text('referrer'),
  userAgent: text('user_agent'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Login attempt counters for admin accounts
export const loginRateLimits = pgTable('login_rate_limits', {
  userId: integer('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  attempts: integer('attempts').notNull().default(0),
  windowStart: timestamp('window_start', { withTimezone: true }).notNull().defaultNow(),
});
