import { sql } from "drizzle-orm";
import { pgTable, text, varchar, numeric, timestamp, boolean, decimal, date, jsonb, index } from "drizzle-orm/pg-core";
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
  role: text("role"),
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
  checkDate: timestamp("check_date").notNull(),
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

// Hourly employees table
export const hourlyEmployees = pgTable("hourly_employees", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  hourlyRate: numeric("hourly_rate", { precision: 8, scale: 2 }).notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// Time entries for hourly employees
export const timeEntries = pgTable("time_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id").notNull().references(() => hourlyEmployees.id),
  date: timestamp("date").notNull(),
  hours: numeric("hours", { precision: 5, scale: 2 }).notNull(),
  description: text("description"),
  isPaid: boolean("is_paid").default(false),
  paidAt: timestamp("paid_at"),
  expenseId: varchar("expense_id").references(() => expenses.id), // Links to expense when paid
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const payouts = pgTable("payouts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  revenueEntryId: varchar("revenue_entry_id").notNull().references(() => revenueEntries.id),
  staffId: varchar("staff_id").notNull().references(() => staff.id),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  percentage: numeric("percentage", { precision: 5, scale: 2 }).notNull(),
});

export const businessSettings = pgTable("business_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  address: text("address"),
  phone: text("phone"),
  email: text("email"),
});

// Session storage table for authentication
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for authentication
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").default("pending"), // pending, user, admin
  isApproved: boolean("is_approved").default(false),
  approvedBy: varchar("approved_by"), // References another user ID, will be constrained in migration
  approvedAt: timestamp("approved_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Check Tracking table for George's running tab of check totals
export const checkTracking = pgTable('check_tracking', {
  id: varchar('id', { length: 255 }).primaryKey().default(sql`gen_random_uuid()`),
  serviceProvider: varchar('service_provider', { length: 255 }).notNull(),
  checkNumber: varchar('check_number', { length: 100 }).notNull(),
  checkAmount: decimal('check_amount', { precision: 10, scale: 2 }).notNull(),
  checkDate: date('check_date').notNull(), // Date check was issued
  processedDate: date('processed_date').notNull(), // Date check was processed
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Insert schemas
export const insertHouseSchema = createInsertSchema(houses).omit({ id: true });
export const insertServiceCodeSchema = createInsertSchema(serviceCodes).omit({ id: true });
export const insertStaffSchema = createInsertSchema(staff).omit({ id: true });
export const insertPayoutRateSchema = createInsertSchema(payoutRates).omit({ id: true });
export const insertPatientSchema = createInsertSchema(patients).omit({ id: true });
export const insertRevenueEntrySchema = createInsertSchema(revenueEntries).omit({ id: true, createdAt: true });
export const insertExpenseSchema = createInsertSchema(expenses).omit({ id: true, createdAt: true });
export const insertPayoutSchema = createInsertSchema(payouts).omit({ id: true });
export const insertBusinessSettingsSchema = createInsertSchema(businessSettings).omit({ id: true });
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCheckTrackingSchema = createInsertSchema(checkTracking).omit({
  id: true,
  createdAt: true,
});
export const insertHourlyEmployeeSchema = createInsertSchema(hourlyEmployees).omit({ id: true, createdAt: true });
export const insertTimeEntrySchema = createInsertSchema(timeEntries).omit({ id: true, createdAt: true });

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
export type BusinessSettings = typeof businessSettings.$inferSelect;
export type InsertBusinessSettings = z.infer<typeof insertBusinessSettingsSchema>;
export type User = typeof users.$inferSelect;
export type UpsertUser = typeof users.$inferInsert;
export type CheckTracking = typeof checkTracking.$inferSelect;
export type InsertCheckTracking = z.infer<typeof insertCheckTrackingSchema>;
export type HourlyEmployee = typeof hourlyEmployees.$inferSelect;
export type InsertHourlyEmployee = z.infer<typeof insertHourlyEmployeeSchema>;
export type TimeEntry = typeof timeEntries.$inferSelect;
export type InsertTimeEntry = z.infer<typeof insertTimeEntrySchema>;

// Staff Payment Tracking
export const staffPayments = pgTable('staff_payments', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  staffId: text('staff_id').notNull().references(() => staff.id),
  amount: text('amount').notNull(), // Amount paid to staff member
  paymentDate: date('payment_date').notNull(), // When payment was made
  notes: text('notes'), // Optional notes about the payment
  isPaid: boolean('is_paid').default(false).notNull(), // Payment status
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const insertStaffPaymentSchema = createInsertSchema(staffPayments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertStaffPayment = z.infer<typeof insertStaffPaymentSchema>;
export type StaffPayment = typeof staffPayments.$inferSelect;
