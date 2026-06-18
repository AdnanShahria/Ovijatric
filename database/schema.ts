import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name').notNull(),
  role: text('role').default('admin').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const events = sqliteTable('events', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  titleBn: text('title_bn'),
  descriptionBn: text('description_bn'),
  date: integer('date', { mode: 'timestamp' }).notNull(),
  location: text('location').notNull(),
  fee: text('fee'),
  totalSpots: integer('total_spots'),
  imageUrl: text('image_url'),
  hoverImageUrl: text('hover_image_url'),
  additionalImages: text('additional_images'),
  tags: text('tags'),
  sponsors: text('sponsors'),
  isRegistrationOpen: integer('is_registration_open', { mode: 'boolean' }).default(false).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const registrations = sqliteTable('registrations', {
  id: text('id').primaryKey(),
  eventId: text('event_id').notNull().references(() => events.id),
  name: text('name').notNull(),
  email: text('email').notNull(),
  phone: text('phone').notNull(),
  studentId: text('student_id'),
  status: text('status').default('pending').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const gallery = sqliteTable('gallery', {
  id: text('id').primaryKey(),
  imageUrl: text('image_url').notNull(),
  category: text('category').notNull(),
  caption: text('caption'),
  uploadedAt: integer('uploaded_at', { mode: 'timestamp' }).notNull(),
});

export const team = sqliteTable('team', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  role: text('role').notNull(),
  imageUrl: text('image_url'),
  facebookUrl: text('facebook_url'),
  linkedinUrl: text('linkedin_url'),
  orderIndex: integer('order_index').default(0).notNull(),
});

export const blogPosts = sqliteTable('blog_posts', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  authorId: text('author_id').notNull().references(() => users.id),
  imageUrl: text('image_url'),
  publishedAt: integer('published_at', { mode: 'timestamp' }).notNull(),
});

export const contactMessages = sqliteTable('contact_messages', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  message: text('message').notNull(),
  status: text('status').default('unread').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
});

export const banners = sqliteTable('banners', {
  id: text('id').primaryKey(),
  imageUrl: text('image_url').notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).default(true).notNull(),
  orderIndex: integer('order_index').default(0).notNull(),
  topic: text('topic'),
  startDate: integer('start_date', { mode: 'timestamp' }),
  endDate: integer('end_date', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const mapPins = sqliteTable('map_pins', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  lat: real('lat').notNull(),
  lng: real('lng').notNull(),
  type: text('type').notNull(), // 'event', 'gallery', 'place'
  title: text('title').notNull(),
  details: text('details'),
  imageUrl: text('image_url'),
  dateText: text('date_text'),
  linkedEventId: text('linked_event_id'),
  linkedGalleryIds: text('linked_gallery_ids'), // stored as JSON
  linkedPlaceSlug: text('linked_place_slug'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});
