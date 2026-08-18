import { relations } from "drizzle-orm/_relations";
import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  integer,
  date,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";

export const timestamps = {
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
};

export const employeeRoleEnum = pgEnum("employee_role", ["admin", "smm", "editor"]);
export const channelPlatformEnum = pgEnum("channel_platform", ["yt", "ig"]);
export const attendanceStatusEnum = pgEnum("attendance_status", ["present", "absent"]);

export const employees = pgTable("employees", {
  id: uuid("id").primaryKey().defaultRandom(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name"),
  email: text("email").unique().notNull(),
  password: text("password").notNull(),
  role: employeeRoleEnum("role").notNull(),
  salary: integer("salary"),
  isDeleted: boolean("is_deleted").default(false).notNull(),
  ...timestamps,
}, (t) => [
  index("employees_id_idx").on(t.id),
]);

export const employeeFolders = pgTable("employee_folders", {
  id: uuid("id").primaryKey().defaultRandom(),
  eId: uuid("e_id")
    .notNull()
    .references(() => employees.id, { onDelete: "cascade" }),
  folderId: text("folder_id"),
  folderName: text("folder_name"),
  ...timestamps,
}, (t) => [
  index("employee_folders_id_idx").on(t.id),
  index("employee_folders_e_id_idx").on(t.eId),
]);

export const channels = pgTable("channels", {
  id: uuid("id").primaryKey().defaultRandom(),
  eId: uuid("e_id")
    .notNull()
    .references(() => employees.id, { onDelete: "cascade" }),
  name: text("name"),
  platform: channelPlatformEnum("platform"),
  url: text("url").notNull(),
  isDeleted: boolean("is_deleted").default(false).notNull(),
  ...timestamps,
}, (t) => [
  index("channels_id_idx").on(t.id),
  index("channels_e_id_idx").on(t.eId),
]);

export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  status: boolean("status").default(true).notNull(),
  ...timestamps,
}, (t) => [
  index("projects_id_idx").on(t.id),
]);

export const channelRecords = pgTable("channel_records", {
  id: uuid("id").primaryKey().defaultRandom(),
  eId: uuid("e_id")
    .notNull()
    .references(() => employees.id, { onDelete: "cascade" }),
  cId: uuid("c_id")
    .notNull()
    .references(() => channels.id, { onDelete: "cascade" }),
  pId: uuid("p_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  link: text("link").unique().notNull(),
  ...timestamps,
}, (t) => [
  index("channel_records_id_idx").on(t.id),
  index("channel_records_e_id_idx").on(t.eId),
  index("channel_records_c_id_idx").on(t.cId),
  index("channel_records_p_id_idx").on(t.pId),
]);

export const settings = pgTable("settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  editorDailyUploadLimit: integer("editor_daily_upload_limit"),
  smmChannelLimit: integer("smm_channel_limit"),
  ...timestamps,
}, (t) => [
  index("settings_id_idx").on(t.id),
]);

export const assets = pgTable("assets", {
  id: uuid("id").primaryKey().defaultRandom(),
  eId: uuid("e_id")
    .notNull()
    .references(() => employees.id, { onDelete: "cascade" }),
  model: text("model").notNull(),
  imei1: text("imei1"),
  imei2: text("imei2"),
  ...timestamps,
}, (t) => [
  index("assets_id_idx").on(t.id),
  index("assets_e_id_idx").on(t.eId),
]);

export const assetContacts = pgTable("asset_contacts", {
  id: uuid("id").primaryKey().defaultRandom(),
  aId: uuid("a_id")
    .notNull()
    .references(() => assets.id, { onDelete: "cascade" }),
  contact: text("contact").notNull(),
  ...timestamps,
}, (t) => [
  index("asset_contacts_id_idx").on(t.id),
  index("asset_contacts_a_id_idx").on(t.aId),
]);

export const assetEmails = pgTable("asset_emails", {
  id: uuid("id").primaryKey().defaultRandom(),
  aId: uuid("a_id")
    .notNull()
    .references(() => assets.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  ...timestamps,
}, (t) => [
  index("asset_emails_id_idx").on(t.id),
  index("asset_emails_a_id_idx").on(t.aId),
]);

export const attendance = pgTable("attendance", {
  id: uuid("id").primaryKey().defaultRandom(),
  eId: uuid("e_id")
    .notNull()
    .references(() => employees.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  status: attendanceStatusEnum("status").notNull(),
  edited: boolean("edited").default(false).notNull(),
  reason: text("reason"),
  ...timestamps,
}, (t) => [
  index("attendance_id_idx").on(t.id),
  index("attendance_e_id_idx").on(t.eId),
]);

export const employeesRelations = relations(employees, ({ many }) => ({
  folders: many(employeeFolders),
  channels: many(channels),
  channelRecords: many(channelRecords),
  assets: many(assets),
  attendance: many(attendance),
}));

export const employeeFoldersRelations = relations(employeeFolders, ({ one }) => ({
  employee: one(employees, {
    fields: [employeeFolders.eId],
    references: [employees.id],
  }),
}));

export const channelsRelations = relations(channels, ({ one, many }) => ({
  employee: one(employees, {
    fields: [channels.eId],
    references: [employees.id],
  }),
  records: many(channelRecords),
}));

export const projectsRelations = relations(projects, ({ many }) => ({
  channelRecords: many(channelRecords),
}));

export const channelRecordsRelations = relations(channelRecords, ({ one }) => ({
  employee: one(employees, {
    fields: [channelRecords.eId],
    references: [employees.id],
  }),
  channel: one(channels, {
    fields: [channelRecords.cId],
    references: [channels.id],
  }),
  project: one(projects, {
    fields: [channelRecords.pId],
    references: [projects.id],
  }),
}));

export const assetsRelations = relations(assets, ({ one, many }) => ({
  employee: one(employees, {
    fields: [assets.eId],
    references: [employees.id],
  }),
  contacts: many(assetContacts),
  emails: many(assetEmails),
}));

export const assetContactsRelations = relations(assetContacts, ({ one }) => ({
  asset: one(assets, {
    fields: [assetContacts.aId],
    references: [assets.id],
  }),
}));

export const assetEmailsRelations = relations(assetEmails, ({ one }) => ({
  asset: one(assets, {
    fields: [assetEmails.aId],
    references: [assets.id],
  }),
}));

export const attendanceRelations = relations(attendance, ({ one }) => ({
  employee: one(employees, {
    fields: [attendance.eId],
    references: [employees.id],
  }),
}));

export type Employee = typeof employees.$inferSelect;
export type NewEmployee = typeof employees.$inferInsert;

export type EmployeeFolder = typeof employeeFolders.$inferSelect;
export type NewEmployeeFolder = typeof employeeFolders.$inferInsert;

export type Channel = typeof channels.$inferSelect;
export type NewChannel = typeof channels.$inferInsert;

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;

export type ChannelRecord = typeof channelRecords.$inferSelect;
export type NewChannelRecord = typeof channelRecords.$inferInsert;

export type Setting = typeof settings.$inferSelect;
export type NewSetting = typeof settings.$inferInsert;

export type Asset = typeof assets.$inferSelect;
export type NewAsset = typeof assets.$inferInsert;

export type AssetContact = typeof assetContacts.$inferSelect;
export type NewAssetContact = typeof assetContacts.$inferInsert;

export type AssetEmail = typeof assetEmails.$inferSelect;
export type NewAssetEmail = typeof assetEmails.$inferInsert;

export type Attendance = typeof attendance.$inferSelect;
export type NewAttendance = typeof attendance.$inferInsert;