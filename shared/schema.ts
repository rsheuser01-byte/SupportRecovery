import { sql } from "drizzle-orm";
import { pgTable, text, varchar, numeric, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const houses = pgTable("houses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  address: text("address"),
  isActive: boolean("is_active").default(true),
});

export const serviceCodes = pgTable("service_codes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: text("code").notNull().unique(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
});

export const staff = pgTable("staff", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  isActive: boolean("is_active").default(true),
});

export const payoutRates = pgTable("payout_rates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  houseId: varchar("house_id").notNull().references(() => houses.id),
  serviceCodeId: varchar("service_code_id").notNull().references(() => serviceCodes.id),
  staffId: varchar("staff_id").notNull().references(() => staff.id),
  percentage: numeric("percentage", { precision: 5, scale: 2 }).notNull(),
});

export const patients = pgTable("patients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  phone: text("phone"),
  houseId: varchar("house_id").references(() => houses.id),
  program: text("program"),
  startDate: timestamp("start_date"),
  status: text("status").default("active"),
});

export const revenueEntries = pgTable("revenue_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  date: timestamp("date").notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  patientId: varchar("patient_id").references(() => patients.id),
  houseId: varchar("house_id").notNull().references(() => houses.id),
  serviceCodeId: varchar("service_code_id").notNull().references(() => serviceCodes.id),
  notes: text("notes"),
  status: text("status").default("paid"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const expenses = pgTable("expenses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  date: timestamp("date").notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  vendor: text("vendor").notNull(),
  category: text("category").notNull(),
  description: text("description"),
  status: text("status").default("paid"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const payoutBatches = pgTable("payout_batches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  checkDate: timestamp("check_date").notNull(),
  notes: text("notes"),
  status: text("status").default("pending"), // pending, paid, processed
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const payouts = pgTable("payouts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  revenueEntryId: varchar("revenue_entry_id").notNull().references(() => revenueEntries.id),
  staffId: varchar("staff_id").notNull().references(() => staff.id),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  percentage: numeric("percentage", { precision: 5, scale: 2 }).notNull(),
  batchId: varchar("batch_id").references(() => payoutBatches.id),
});

export const businessSettings = pgTable("business_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  address: text("address"),
  phone: text("phone"),
  email: text("email"),
});

// Insert schemas
export const insertHouseSchema = createInsertSchema(houses).omit({ id: true });
export const insertServiceCodeSchema = createInsertSchema(serviceCodes).omit({ id: true });
export const insertStaffSchema = createInsertSchema(staff).omit({ id: true });
export const insertPayoutRateSchema = createInsertSchema(payoutRates).omit({ id: true });
export const insertPatientSchema = createInsertSchema(patients).omit({ id: true });
export const insertRevenueEntrySchema = createInsertSchema(revenueEntries).omit({ id: true, createdAt: true });
export const insertExpenseSchema = createInsertSchema(expenses).omit({ id: true, createdAt: true });
export const insertBusinessSettingsSchema = createInsertSchema(businessSettings).omit({ id: true });
export const insertPayoutBatchSchema = createInsertSchema(payoutBatches).omit({ id: true, createdAt: true });

// Types
export type House = typeof houses.$inferSelect;
export type InsertHouse = z.infer<typeof insertHouseSchema>;
export type ServiceCode = typeof serviceCodes.$inferSelect;
export type InsertServiceCode = z.infer<typeof insertServiceCodeSchema>;
export type Staff = typeof staff.$inferSelect;
export type InsertStaff = z.infer<typeof insertStaffSchema>;
export type PayoutRate = typeof payoutRates.$inferSelect;
export type InsertPayoutRate = z.infer<typeof insertPayoutRateSchema>;
export type Patient = typeof patients.$inferSelect;
export type InsertPatient = z.infer<typeof insertPatientSchema>;
export type RevenueEntry = typeof revenueEntries.$inferSelect;
export type InsertRevenueEntry = z.infer<typeof insertRevenueEntrySchema>;
export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type Payout = typeof payouts.$inferSelect;
export type PayoutBatch = typeof payoutBatches.$inferSelect;
export type InsertPayoutBatch = z.infer<typeof insertPayoutBatchSchema>;
export type BusinessSettings = typeof businessSettings.$inferSelect;
export type InsertBusinessSettings = z.infer<typeof insertBusinessSettingsSchema>;
