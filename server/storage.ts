import { 
  type House, type InsertHouse,
  type ServiceCode, type InsertServiceCode,
  type Staff, type InsertStaff,
  type PayoutRate, type InsertPayoutRate,
  type Patient, type InsertPatient,
  type RevenueEntry, type InsertRevenueEntry,
  type Expense, type InsertExpense,
  type Payout,
  type BusinessSettings, type InsertBusinessSettings,
  type CheckTracking, type InsertCheckTracking,
  type User, type UpsertUser,
  type HourlyEmployee, type InsertHourlyEmployee,
  type TimeEntry, type InsertTimeEntry,
  type StaffPayment, type InsertStaffPayment,
  houses, serviceCodes, staff, payoutRates, patients, revenueEntries, expenses, payouts, businessSettings, checkTracking, users, hourlyEmployees, timeEntries, staffPayments
} from "@shared/schema";
import { randomUUID } from "crypto";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq, desc, and, like, inArray } from "drizzle-orm";

export interface IStorage {
  // Houses
  getHouses(): Promise<House[]>;
  getHouse(id: string): Promise<House | undefined>;
  createHouse(house: InsertHouse): Promise<House>;
  updateHouse(id: string, house: Partial<InsertHouse>): Promise<House | undefined>;
  deleteHouse(id: string): Promise<boolean>;

  // Service Codes
  getServiceCodes(): Promise<ServiceCode[]>;
  getServiceCode(id: string): Promise<ServiceCode | undefined>;
  createServiceCode(serviceCode: InsertServiceCode): Promise<ServiceCode>;
  updateServiceCode(id: string, serviceCode: Partial<InsertServiceCode>): Promise<ServiceCode | undefined>;
  deleteServiceCode(id: string): Promise<boolean>;

  // Staff
  getStaff(): Promise<Staff[]>;
  getStaffMember(id: string): Promise<Staff | undefined>;
  createStaff(staff: InsertStaff): Promise<Staff>;
  updateStaff(id: string, staff: Partial<InsertStaff>): Promise<Staff | undefined>;
  deleteStaff(id: string): Promise<boolean>;

  // Payout Rates
  getPayoutRates(): Promise<PayoutRate[]>;
  getPayoutRate(houseId: string, serviceCodeId: string, staffId: string): Promise<PayoutRate | undefined>;
  createPayoutRate(payoutRate: InsertPayoutRate): Promise<PayoutRate>;
  updatePayoutRate(id: string, payoutRate: Partial<InsertPayoutRate>): Promise<PayoutRate | undefined>;

  // Patients
  getPatients(): Promise<Patient[]>;
  getPatient(id: string): Promise<Patient | undefined>;
  searchPatients(query: string): Promise<Patient[]>;
  createPatient(patient: InsertPatient): Promise<Patient>;
  updatePatient(id: string, patient: Partial<InsertPatient>): Promise<Patient | undefined>;

  // Revenue Entries
  getRevenueEntries(): Promise<RevenueEntry[]>;
  getRevenueEntry(id: string): Promise<RevenueEntry | undefined>;
  createRevenueEntry(revenueEntry: InsertRevenueEntry): Promise<RevenueEntry>;
  updateRevenueEntry(id: string, revenueEntry: Partial<InsertRevenueEntry>): Promise<RevenueEntry | undefined>;
  deleteRevenueEntry(id: string): Promise<boolean>;

  // Expenses
  getExpenses(): Promise<Expense[]>;
  getExpense(id: string): Promise<Expense | undefined>;
  createExpense(expense: InsertExpense): Promise<Expense>;
  updateExpense(id: string, expense: Partial<InsertExpense>): Promise<Expense | undefined>;
  deleteExpense(id: string): Promise<boolean>;

  // Payouts
  getPayouts(): Promise<Payout[]>;
  getPayoutsByRevenueEntry(revenueEntryId: string): Promise<Payout[]>;
  createPayout(payout: Omit<Payout, 'id'>): Promise<Payout>;
  deletePayout(id: string): Promise<boolean>;

  // Business Settings
  getBusinessSettings(): Promise<BusinessSettings | undefined>;
  updateBusinessSettings(settings: InsertBusinessSettings): Promise<BusinessSettings>;

  // Check Tracking
  getCheckTrackingEntries(): Promise<CheckTracking[]>;
  getCheckTrackingEntry(id: string): Promise<CheckTracking | undefined>;
  createCheckTrackingEntry(entry: InsertCheckTracking): Promise<CheckTracking>;
  updateCheckTrackingEntry(id: string, entry: Partial<InsertCheckTracking>): Promise<CheckTracking | undefined>;
  deleteCheckTrackingEntry(id: string): Promise<boolean>;

  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUserRole(userId: string, role: string, approvedBy?: string): Promise<User | undefined>;
  approveUser(userId: string, approvedBy: string): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;

  // Hourly Employees
  getHourlyEmployees(): Promise<HourlyEmployee[]>;
  getHourlyEmployee(id: string): Promise<HourlyEmployee | undefined>;
  createHourlyEmployee(employee: InsertHourlyEmployee): Promise<HourlyEmployee>;
  updateHourlyEmployee(id: string, employee: Partial<InsertHourlyEmployee>): Promise<HourlyEmployee | undefined>;
  deleteHourlyEmployee(id: string): Promise<boolean>;

  // Time Entries
  getTimeEntries(): Promise<TimeEntry[]>;
  getTimeEntriesByEmployee(employeeId: string): Promise<TimeEntry[]>;
  getUnpaidTimeEntries(): Promise<TimeEntry[]>;
  getTimeEntry(id: string): Promise<TimeEntry | undefined>;
  createTimeEntry(timeEntry: InsertTimeEntry): Promise<TimeEntry>;
  updateTimeEntry(id: string, timeEntry: Partial<InsertTimeEntry>): Promise<TimeEntry | undefined>;
  deleteTimeEntry(id: string): Promise<boolean>;
  markTimeEntriesAsPaid(timeEntryIds: string[], expenseId: string): Promise<boolean>;

  // Staff Payments
  getStaffPayments(): Promise<StaffPayment[]>;
  getStaffPaymentsByStaff(staffId: string): Promise<StaffPayment[]>;
  getStaffPayment(id: string): Promise<StaffPayment | undefined>;
  createStaffPayment(payment: InsertStaffPayment): Promise<StaffPayment>;
  updateStaffPayment(id: string, payment: Partial<InsertStaffPayment>): Promise<StaffPayment | undefined>;
  deleteStaffPayment(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private houses: Map<string, House> = new Map();
  private serviceCodes: Map<string, ServiceCode> = new Map();
  private staff: Map<string, Staff> = new Map();
  private payoutRates: Map<string, PayoutRate> = new Map();
  private patients: Map<string, Patient> = new Map();
  private revenueEntries: Map<string, RevenueEntry> = new Map();
  private expenses: Map<string, Expense> = new Map();
  private payouts: Map<string, Payout> = new Map();
  private businessSettings: BusinessSettings | null = null;
  private checkTrackingEntries: Map<string, CheckTracking> = new Map();
  private users: Map<string, User> = new Map();
  private hourlyEmployees: Map<string, HourlyEmployee> = new Map();
  private timeEntries: Map<string, TimeEntry> = new Map();

  constructor() {
    this.initializeData();
  }

  private initializeData() {
    // Initialize houses
    const housesData = [
      { id: "house-1", name: "Greater Faith", address: "123 Recovery St, City, State 12345", isActive: true },
      { id: "house-2", name: "Story Lighthouse", address: "456 Hope Ave, City, State 12345", isActive: true },
      { id: "house-3", name: "Youth Program", address: "789 Future Blvd, City, State 12345", isActive: true },
      { id: "house-4", name: "Outpatient", address: "321 Care Center Dr, City, State 12345", isActive: true },
    ];
    housesData.forEach(house => this.houses.set(house.id, house));

    // Initialize service codes
    const serviceCodesData = [
      { id: "service-1", code: "peer support", description: "Peer Support Services", isActive: true },
      { id: "service-2", code: "group", description: "Group Therapy", isActive: true },
      { id: "service-3", code: "T2023", description: "T2023 Sessions", isActive: true },
      { id: "service-4", code: "evening group", description: "Evening Group Sessions", isActive: true },
      { id: "service-5", code: "morning group", description: "Morning Group Sessions", isActive: true },
    ];
    serviceCodesData.forEach(serviceCode => this.serviceCodes.set(serviceCode.id, serviceCode));

    // Initialize staff
    const staffData = [
      { id: "staff-1", name: "Dr. Kelsey", role: "Clinician", isActive: true },
      { id: "staff-2", name: "Bardstown Billing", role: "Billing", isActive: true },
      { id: "staff-3", name: "George", role: "Owner", isActive: true },
      { id: "staff-4", name: "Maria", role: "Staff", isActive: true },
      { id: "staff-5", name: "Shelton", role: "Staff", isActive: true },
    ];
    staffData.forEach(staff => this.staff.set(staff.id, staff));

    // Initialize payout rates based on the uploaded image
    const payoutRatesData = [
      // Greater Faith - peer support
      { id: "rate-1", houseId: "house-1", serviceCodeId: "service-1", staffId: "staff-1", percentage: "15.00" },
      { id: "rate-2", houseId: "house-1", serviceCodeId: "service-1", staffId: "staff-2", percentage: "6.00" },
      { id: "rate-3", houseId: "house-1", serviceCodeId: "service-1", staffId: "staff-3", percentage: "39.50" },
      { id: "rate-4", houseId: "house-1", serviceCodeId: "service-1", staffId: "staff-4", percentage: "39.50" },
      { id: "rate-5", houseId: "house-1", serviceCodeId: "service-1", staffId: "staff-5", percentage: "0.00" },
      
      // Greater Faith - group
      { id: "rate-6", houseId: "house-1", serviceCodeId: "service-2", staffId: "staff-1", percentage: "15.00" },
      { id: "rate-7", houseId: "house-1", serviceCodeId: "service-2", staffId: "staff-2", percentage: "6.00" },
      { id: "rate-8", houseId: "house-1", serviceCodeId: "service-2", staffId: "staff-3", percentage: "39.50" },
      { id: "rate-9", houseId: "house-1", serviceCodeId: "service-2", staffId: "staff-4", percentage: "39.50" },
      { id: "rate-10", houseId: "house-1", serviceCodeId: "service-2", staffId: "staff-5", percentage: "0.00" },

      // Story Lighthouse - peer support
      { id: "rate-11", houseId: "house-2", serviceCodeId: "service-1", staffId: "staff-1", percentage: "15.00" },
      { id: "rate-12", houseId: "house-2", serviceCodeId: "service-1", staffId: "staff-2", percentage: "6.00" },
      { id: "rate-13", houseId: "house-2", serviceCodeId: "service-1", staffId: "staff-3", percentage: "44.00" },
      { id: "rate-14", houseId: "house-2", serviceCodeId: "service-1", staffId: "staff-4", percentage: "0.00" },
      { id: "rate-15", houseId: "house-2", serviceCodeId: "service-1", staffId: "staff-5", percentage: "35.00" },

      // Story Lighthouse - T2023
      { id: "rate-16", houseId: "house-2", serviceCodeId: "service-3", staffId: "staff-1", percentage: "15.00" },
      { id: "rate-17", houseId: "house-2", serviceCodeId: "service-3", staffId: "staff-2", percentage: "6.00" },
      { id: "rate-18", houseId: "house-2", serviceCodeId: "service-3", staffId: "staff-3", percentage: "31.60" },
      { id: "rate-19", houseId: "house-2", serviceCodeId: "service-3", staffId: "staff-4", percentage: "0.00" },
      { id: "rate-20", houseId: "house-2", serviceCodeId: "service-3", staffId: "staff-5", percentage: "47.40" },

      // Youth Program - peer support
      { id: "rate-21", houseId: "house-3", serviceCodeId: "service-1", staffId: "staff-1", percentage: "34.00" },
      { id: "rate-22", houseId: "house-3", serviceCodeId: "service-1", staffId: "staff-2", percentage: "6.00" },
      { id: "rate-23", houseId: "house-3", serviceCodeId: "service-1", staffId: "staff-3", percentage: "60.00" },
      { id: "rate-24", houseId: "house-3", serviceCodeId: "service-1", staffId: "staff-4", percentage: "0.00" },
      { id: "rate-25", houseId: "house-3", serviceCodeId: "service-1", staffId: "staff-5", percentage: "0.00" },

      // Outpatient - peer support
      { id: "rate-26", houseId: "house-4", serviceCodeId: "service-1", staffId: "staff-1", percentage: "15.00" },
      { id: "rate-27", houseId: "house-4", serviceCodeId: "service-1", staffId: "staff-2", percentage: "6.00" },
      { id: "rate-28", houseId: "house-4", serviceCodeId: "service-1", staffId: "staff-3", percentage: "79.00" },
      { id: "rate-29", houseId: "house-4", serviceCodeId: "service-1", staffId: "staff-4", percentage: "0.00" },
      { id: "rate-30", houseId: "house-4", serviceCodeId: "service-1", staffId: "staff-5", percentage: "0.00" },
    ];
    payoutRatesData.forEach(rate => this.payoutRates.set(rate.id, rate));

    // Initialize business settings
    this.businessSettings = {
      id: "business-1",
      name: "Healthcare Management Solutions",
      address: "123 Healthcare Blvd, Medical City, MC 12345",
      phone: "(555) 123-4567",
      email: "info@healthcaremanagement.com"
    };
  }

  // Houses
  async getHouses(): Promise<House[]> {
    return Array.from(this.houses.values()).filter(house => house.isActive);
  }

  async getHouse(id: string): Promise<House | undefined> {
    return this.houses.get(id);
  }

  async createHouse(house: InsertHouse): Promise<House> {
    const id = randomUUID();
    const newHouse: House = { 
      ...house, 
      id,
      address: house.address || null,
      isActive: house.isActive !== undefined ? house.isActive : true
    };
    this.houses.set(id, newHouse);
    return newHouse;
  }

  async updateHouse(id: string, house: Partial<InsertHouse>): Promise<House | undefined> {
    const existing = this.houses.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...house };
    this.houses.set(id, updated);
    return updated;
  }

  async deleteHouse(id: string): Promise<boolean> {
    return this.houses.delete(id);
  }

  // Service Codes
  async getServiceCodes(): Promise<ServiceCode[]> {
    return Array.from(this.serviceCodes.values()).filter(sc => sc.isActive);
  }

  async getServiceCode(id: string): Promise<ServiceCode | undefined> {
    return this.serviceCodes.get(id);
  }

  async createServiceCode(serviceCode: InsertServiceCode): Promise<ServiceCode> {
    const id = randomUUID();
    const newServiceCode: ServiceCode = { 
      ...serviceCode, 
      id,
      description: serviceCode.description || null,
      isActive: serviceCode.isActive !== undefined ? serviceCode.isActive : true
    };
    this.serviceCodes.set(id, newServiceCode);
    return newServiceCode;
  }

  async updateServiceCode(id: string, serviceCode: Partial<InsertServiceCode>): Promise<ServiceCode | undefined> {
    const existing = this.serviceCodes.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...serviceCode };
    this.serviceCodes.set(id, updated);
    return updated;
  }

  async deleteServiceCode(id: string): Promise<boolean> {
    return this.serviceCodes.delete(id);
  }

  // Staff
  async getStaff(): Promise<Staff[]> {
    return Array.from(this.staff.values()).filter(s => s.isActive);
  }

  async getStaffMember(id: string): Promise<Staff | undefined> {
    return this.staff.get(id);
  }

  async createStaff(staff: InsertStaff): Promise<Staff> {
    const id = randomUUID();
    const newStaff: Staff = { 
      ...staff, 
      id,
      role: staff.role || null,
      isActive: staff.isActive !== undefined ? staff.isActive : true
    };
    this.staff.set(id, newStaff);
    return newStaff;
  }

  async updateStaff(id: string, staff: Partial<InsertStaff>): Promise<Staff | undefined> {
    const existing = this.staff.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...staff };
    this.staff.set(id, updated);
    return updated;
  }

  async deleteStaff(id: string): Promise<boolean> {
    return this.staff.delete(id);
  }

  // Payout Rates
  async getPayoutRates(): Promise<PayoutRate[]> {
    return Array.from(this.payoutRates.values());
  }

  async getPayoutRate(houseId: string, serviceCodeId: string, staffId: string): Promise<PayoutRate | undefined> {
    return Array.from(this.payoutRates.values()).find(
      rate => rate.houseId === houseId && rate.serviceCodeId === serviceCodeId && rate.staffId === staffId
    );
  }

  async createPayoutRate(payoutRate: InsertPayoutRate): Promise<PayoutRate> {
    const id = randomUUID();
    const newPayoutRate: PayoutRate = { ...payoutRate, id };
    this.payoutRates.set(id, newPayoutRate);
    return newPayoutRate;
  }

  async updatePayoutRate(id: string, payoutRate: Partial<InsertPayoutRate>): Promise<PayoutRate | undefined> {
    const existing = this.payoutRates.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...payoutRate };
    this.payoutRates.set(id, updated);
    return updated;
  }

  // Patients
  async getPatients(): Promise<Patient[]> {
    return Array.from(this.patients.values());
  }

  async getPatient(id: string): Promise<Patient | undefined> {
    return this.patients.get(id);
  }

  async searchPatients(query: string): Promise<Patient[]> {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.patients.values()).filter(patient =>
      patient.name.toLowerCase().includes(lowerQuery) ||
      patient.phone?.toLowerCase().includes(lowerQuery)
    );
  }

  async createPatient(patient: InsertPatient): Promise<Patient> {
    const id = randomUUID();
    const newPatient: Patient = { 
      ...patient, 
      id,
      phone: patient.phone || null,
      houseId: patient.houseId || null,
      program: patient.program || null,
      startDate: patient.startDate || null,
      status: patient.status || "active"
    };
    this.patients.set(id, newPatient);
    return newPatient;
  }

  async updatePatient(id: string, patient: Partial<InsertPatient>): Promise<Patient | undefined> {
    const existing = this.patients.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...patient };
    this.patients.set(id, updated);
    return updated;
  }

  // Revenue Entries
  async getRevenueEntries(): Promise<RevenueEntry[]> {
    return Array.from(this.revenueEntries.values()).sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }

  async getRevenueEntry(id: string): Promise<RevenueEntry | undefined> {
    return this.revenueEntries.get(id);
  }

  async createRevenueEntry(revenueEntry: InsertRevenueEntry): Promise<RevenueEntry> {
    const id = randomUUID();
    const newRevenueEntry: RevenueEntry = { 
      ...revenueEntry, 
      id,
      patientId: revenueEntry.patientId || null,
      notes: revenueEntry.notes || null,
      status: revenueEntry.status || "paid",
      createdAt: new Date()
    };
    this.revenueEntries.set(id, newRevenueEntry);
    return newRevenueEntry;
  }

  async updateRevenueEntry(id: string, revenueEntry: Partial<InsertRevenueEntry>): Promise<RevenueEntry | undefined> {
    const existing = this.revenueEntries.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...revenueEntry };
    this.revenueEntries.set(id, updated);
    return updated;
  }

  async deleteRevenueEntry(id: string): Promise<boolean> {
    // First delete all related payouts
    const relatedPayouts = Array.from(this.payouts.values()).filter(payout => payout.revenueEntryId === id);
    relatedPayouts.forEach(payout => this.payouts.delete(payout.id));
    
    // Then delete the revenue entry
    return this.revenueEntries.delete(id);
  }

  // Expenses
  async getExpenses(): Promise<Expense[]> {
    return Array.from(this.expenses.values()).sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }

  async getExpense(id: string): Promise<Expense | undefined> {
    return this.expenses.get(id);
  }

  async createExpense(expense: InsertExpense): Promise<Expense> {
    const id = randomUUID();
    const newExpense: Expense = { 
      ...expense, 
      id,
      description: expense.description || null,
      status: expense.status || "paid",
      createdAt: new Date()
    };
    this.expenses.set(id, newExpense);
    return newExpense;
  }

  async updateExpense(id: string, expense: Partial<InsertExpense>): Promise<Expense | undefined> {
    const existing = this.expenses.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...expense };
    this.expenses.set(id, updated);
    return updated;
  }

  async deleteExpense(id: string): Promise<boolean> {
    return this.expenses.delete(id);
  }

  // Payouts
  async getPayouts(): Promise<Payout[]> {
    return Array.from(this.payouts.values());
  }

  async getPayoutsByRevenueEntry(revenueEntryId: string): Promise<Payout[]> {
    return Array.from(this.payouts.values()).filter(payout => 
      payout.revenueEntryId === revenueEntryId
    );
  }

  async createPayout(payout: Omit<Payout, 'id'>): Promise<Payout> {
    const id = randomUUID();
    const newPayout: Payout = { ...payout, id };
    this.payouts.set(id, newPayout);
    return newPayout;
  }

  async deletePayout(id: string): Promise<boolean> {
    return this.payouts.delete(id);
  }

  // Business Settings
  async getBusinessSettings(): Promise<BusinessSettings | undefined> {
    return this.businessSettings || undefined;
  }

  async updateBusinessSettings(settings: InsertBusinessSettings): Promise<BusinessSettings> {
    const updated: BusinessSettings = {
      id: this.businessSettings?.id || randomUUID(),
      ...settings,
      address: settings.address || null,
      phone: settings.phone || null,
      email: settings.email || null
    };
    this.businessSettings = updated;
    return updated;
  }

  // Check Tracking methods
  async getCheckTrackingEntries(): Promise<CheckTracking[]> {
    return Array.from(this.checkTrackingEntries.values()).sort((a, b) => 
      new Date(b.processedDate).getTime() - new Date(a.processedDate).getTime()
    );
  }

  async getCheckTrackingEntry(id: string): Promise<CheckTracking | undefined> {
    return this.checkTrackingEntries.get(id);
  }

  async createCheckTrackingEntry(entry: InsertCheckTracking): Promise<CheckTracking> {
    const id = randomUUID();
    const newEntry: CheckTracking = {
      ...entry,
      id,
      notes: entry.notes || null,
      createdAt: new Date()
    };
    this.checkTrackingEntries.set(id, newEntry);
    return newEntry;
  }

  async updateCheckTrackingEntry(id: string, entry: Partial<InsertCheckTracking>): Promise<CheckTracking | undefined> {
    const existing = this.checkTrackingEntries.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...entry };
    this.checkTrackingEntries.set(id, updated);
    return updated;
  }

  async deleteCheckTrackingEntry(id: string): Promise<boolean> {
    return this.checkTrackingEntries.delete(id);
  }

  // User operations (required for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const existingUser = this.users.get(userData.id!);
    const user: User = {
      ...existingUser,
      id: userData.id || randomUUID(),
      email: userData.email ?? null,
      firstName: userData.firstName ?? null,
      lastName: userData.lastName ?? null,
      profileImageUrl: userData.profileImageUrl ?? null,
      role: userData.role || existingUser?.role || "pending",
      isApproved: userData.isApproved ?? existingUser?.isApproved ?? false,
      approvedBy: userData.approvedBy || existingUser?.approvedBy || null,
      approvedAt: userData.approvedAt || existingUser?.approvedAt || null,
      createdAt: existingUser?.createdAt || new Date(),
      updatedAt: new Date(),
    };
    this.users.set(user.id, user);
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values()).sort((a, b) => 
      new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
    );
  }

  async updateUserRole(userId: string, role: string, approvedBy?: string): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;
    
    const updatedUser: User = {
      ...user,
      role,
      updatedAt: new Date(),
      ...(approvedBy && {
        approvedBy,
        approvedAt: new Date(),
        isApproved: true,
      }),
    };
    
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  async approveUser(userId: string, approvedBy: string): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;
    
    const updatedUser: User = {
      ...user,
      isApproved: true,
      role: "user",
      approvedBy,
      approvedAt: new Date(),
      updatedAt: new Date(),
    };
    
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: string): Promise<boolean> {
    return this.users.delete(id);
  }

  // Hourly Employees - stub implementations since we use DbStorage
  async getHourlyEmployees(): Promise<HourlyEmployee[]> { return []; }
  async getHourlyEmployee(id: string): Promise<HourlyEmployee | undefined> { return undefined; }
  async createHourlyEmployee(employee: InsertHourlyEmployee): Promise<HourlyEmployee> { throw new Error("Not implemented"); }
  async updateHourlyEmployee(id: string, employee: Partial<InsertHourlyEmployee>): Promise<HourlyEmployee | undefined> { return undefined; }
  async deleteHourlyEmployee(id: string): Promise<boolean> { return false; }

  // Time Entries - stub implementations since we use DbStorage
  async getTimeEntries(): Promise<TimeEntry[]> { return []; }
  async getTimeEntriesByEmployee(employeeId: string): Promise<TimeEntry[]> { return []; }
  async getUnpaidTimeEntries(): Promise<TimeEntry[]> { return []; }
  async getTimeEntry(id: string): Promise<TimeEntry | undefined> { return undefined; }
  async createTimeEntry(timeEntry: InsertTimeEntry): Promise<TimeEntry> { throw new Error("Not implemented"); }
  async updateTimeEntry(id: string, timeEntry: Partial<InsertTimeEntry>): Promise<TimeEntry | undefined> { return undefined; }
  async deleteTimeEntry(id: string): Promise<boolean> { return false; }
  async markTimeEntriesAsPaid(timeEntryIds: string[], expenseId: string): Promise<boolean> { return false; }

  // Staff Payments - stub implementations since we use DbStorage
  async getStaffPayments(): Promise<StaffPayment[]> { return []; }
  async getStaffPaymentsByStaff(staffId: string): Promise<StaffPayment[]> { return []; }
  async getStaffPayment(id: string): Promise<StaffPayment | undefined> { return undefined; }
  async createStaffPayment(payment: InsertStaffPayment): Promise<StaffPayment> { throw new Error("Not implemented"); }
  async updateStaffPayment(id: string, payment: Partial<InsertStaffPayment>): Promise<StaffPayment | undefined> { return undefined; }
  async deleteStaffPayment(id: string): Promise<boolean> { return false; }
}

// Database Storage Implementation
export class DbStorage implements IStorage {
  private db;

  constructor() {
    const sql = neon(process.env.DATABASE_URL!);
    this.db = drizzle(sql);
    this.initializeData().catch(error => {
      console.error("Failed to initialize database data:", error);
    });
  }

  private async initializeData() {
    try {
      // Check if houses exist, if not, initialize default data
      const existingHouses = await this.db.select().from(houses);
      if (existingHouses.length === 0) {
        // Initialize houses
        await this.db.insert(houses).values([
          { id: "house-1", name: "Greater Faith", address: "123 Recovery St, City, State 12345", isActive: true },
          { id: "house-2", name: "Story Lighthouse", address: "456 Hope Ave, City, State 12345", isActive: true },
          { id: "house-3", name: "Youth Program", address: "789 Future Blvd, City, State 12345", isActive: true },
          { id: "house-4", name: "Outpatient", address: "321 Care Center Dr, City, State 12345", isActive: true },
        ]);

        // Initialize service codes
        await this.db.insert(serviceCodes).values([
          { id: "service-1", code: "peer support", description: "Peer Support Services", isActive: true },
          { id: "service-2", code: "group", description: "Group Therapy", isActive: true },
          { id: "service-3", code: "T2023", description: "T2023 Sessions", isActive: true },
          { id: "service-4", code: "evening group", description: "Evening Group Sessions", isActive: true },
          { id: "service-5", code: "morning group", description: "Morning Group Sessions", isActive: true },
        ]);

        // Initialize staff
        await this.db.insert(staff).values([
          { id: "staff-1", name: "Dr. Kelsey", isActive: true },
          { id: "staff-2", name: "Bardstown Billing", isActive: true },
          { id: "staff-3", name: "George", isActive: true },
          { id: "staff-4", name: "Maria", isActive: true },
          { id: "staff-5", name: "Shelton", isActive: true },
        ]);

        // Initialize payout rates
        await this.db.insert(payoutRates).values([
          // Greater Faith rates
          { id: "rate-1", houseId: "house-1", serviceCodeId: "service-1", staffId: "staff-1", percentage: "15.00" },
          { id: "rate-2", houseId: "house-1", serviceCodeId: "service-1", staffId: "staff-2", percentage: "6.00" },
          { id: "rate-3", houseId: "house-1", serviceCodeId: "service-1", staffId: "staff-3", percentage: "39.50" },
          { id: "rate-4", houseId: "house-1", serviceCodeId: "service-1", staffId: "staff-4", percentage: "39.50" },
          { id: "rate-5", houseId: "house-1", serviceCodeId: "service-1", staffId: "staff-5", percentage: "0.00" },
          { id: "rate-6", houseId: "house-1", serviceCodeId: "service-2", staffId: "staff-1", percentage: "15.00" },
          { id: "rate-7", houseId: "house-1", serviceCodeId: "service-2", staffId: "staff-2", percentage: "6.00" },
          { id: "rate-8", houseId: "house-1", serviceCodeId: "service-2", staffId: "staff-3", percentage: "39.50" },
          { id: "rate-9", houseId: "house-1", serviceCodeId: "service-2", staffId: "staff-4", percentage: "39.50" },
          { id: "rate-10", houseId: "house-1", serviceCodeId: "service-2", staffId: "staff-5", percentage: "0.00" },
          
          // Story Lighthouse rates
          { id: "rate-11", houseId: "house-2", serviceCodeId: "service-1", staffId: "staff-1", percentage: "15.00" },
          { id: "rate-12", houseId: "house-2", serviceCodeId: "service-1", staffId: "staff-2", percentage: "6.00" },
          { id: "rate-13", houseId: "house-2", serviceCodeId: "service-1", staffId: "staff-3", percentage: "44.00" },
          { id: "rate-14", houseId: "house-2", serviceCodeId: "service-1", staffId: "staff-4", percentage: "0.00" },
          { id: "rate-15", houseId: "house-2", serviceCodeId: "service-1", staffId: "staff-5", percentage: "35.00" },
          { id: "rate-16", houseId: "house-2", serviceCodeId: "service-3", staffId: "staff-1", percentage: "15.00" },
          { id: "rate-17", houseId: "house-2", serviceCodeId: "service-3", staffId: "staff-2", percentage: "6.00" },
          { id: "rate-18", houseId: "house-2", serviceCodeId: "service-3", staffId: "staff-3", percentage: "31.60" },
          { id: "rate-19", houseId: "house-2", serviceCodeId: "service-3", staffId: "staff-4", percentage: "0.00" },
          { id: "rate-20", houseId: "house-2", serviceCodeId: "service-3", staffId: "staff-5", percentage: "47.40" },
          
          // Youth Program rates
          { id: "rate-21", houseId: "house-3", serviceCodeId: "service-1", staffId: "staff-1", percentage: "34.00" },
          { id: "rate-22", houseId: "house-3", serviceCodeId: "service-1", staffId: "staff-2", percentage: "6.00" },
          { id: "rate-23", houseId: "house-3", serviceCodeId: "service-1", staffId: "staff-3", percentage: "60.00" },
          { id: "rate-24", houseId: "house-3", serviceCodeId: "service-1", staffId: "staff-4", percentage: "0.00" },
          { id: "rate-25", houseId: "house-3", serviceCodeId: "service-1", staffId: "staff-5", percentage: "0.00" },
          
          // Outpatient rates
          { id: "rate-26", houseId: "house-4", serviceCodeId: "service-1", staffId: "staff-1", percentage: "15.00" },
          { id: "rate-27", houseId: "house-4", serviceCodeId: "service-1", staffId: "staff-2", percentage: "6.00" },
          { id: "rate-28", houseId: "house-4", serviceCodeId: "service-1", staffId: "staff-3", percentage: "79.00" },
          { id: "rate-29", houseId: "house-4", serviceCodeId: "service-1", staffId: "staff-4", percentage: "0.00" },
          { id: "rate-30", houseId: "house-4", serviceCodeId: "service-1", staffId: "staff-5", percentage: "0.00" },
        ]);

        // Initialize business settings
        await this.db.insert(businessSettings).values({
          id: "business-1",
          name: "Healthcare Management Solutions",
          address: "123 Healthcare Blvd, Medical City, MC 12345",
          phone: "(555) 123-4567",
          email: "info@healthcaremanagement.com"
        });
      }
    } catch (error) {
      console.error("Error initializing data:", error);
    }
  }

  // Houses
  async getHouses(): Promise<House[]> {
    return await this.db.select().from(houses).where(eq(houses.isActive, true));
  }

  async getHouse(id: string): Promise<House | undefined> {
    const result = await this.db.select().from(houses).where(eq(houses.id, id));
    return result[0];
  }

  async createHouse(house: InsertHouse): Promise<House> {
    const result = await this.db.insert(houses).values(house).returning();
    return result[0];
  }

  async updateHouse(id: string, house: Partial<InsertHouse>): Promise<House | undefined> {
    const result = await this.db.update(houses).set(house).where(eq(houses.id, id)).returning();
    return result[0];
  }

  async deleteHouse(id: string): Promise<boolean> {
    const result = await this.db.update(houses).set({ isActive: false }).where(eq(houses.id, id));
    return result.rowCount > 0;
  }

  // Service Codes
  async getServiceCodes(): Promise<ServiceCode[]> {
    return await this.db.select().from(serviceCodes).where(eq(serviceCodes.isActive, true));
  }

  async getServiceCode(id: string): Promise<ServiceCode | undefined> {
    const result = await this.db.select().from(serviceCodes).where(eq(serviceCodes.id, id));
    return result[0];
  }

  async createServiceCode(serviceCode: InsertServiceCode): Promise<ServiceCode> {
    const result = await this.db.insert(serviceCodes).values(serviceCode).returning();
    return result[0];
  }

  async updateServiceCode(id: string, serviceCode: Partial<InsertServiceCode>): Promise<ServiceCode | undefined> {
    const result = await this.db.update(serviceCodes).set(serviceCode).where(eq(serviceCodes.id, id)).returning();
    return result[0];
  }

  async deleteServiceCode(id: string): Promise<boolean> {
    const result = await this.db.update(serviceCodes).set({ isActive: false }).where(eq(serviceCodes.id, id));
    return result.rowCount > 0;
  }

  // Staff
  async getStaff(): Promise<Staff[]> {
    return await this.db.select().from(staff).where(eq(staff.isActive, true));
  }

  async getStaffMember(id: string): Promise<Staff | undefined> {
    const result = await this.db.select().from(staff).where(eq(staff.id, id));
    return result[0];
  }

  async createStaff(staffData: InsertStaff): Promise<Staff> {
    const result = await this.db.insert(staff).values(staffData).returning();
    return result[0];
  }

  async updateStaff(id: string, staffData: Partial<InsertStaff>): Promise<Staff | undefined> {
    const result = await this.db.update(staff).set(staffData).where(eq(staff.id, id)).returning();
    return result[0];
  }

  async deleteStaff(id: string): Promise<boolean> {
    const result = await this.db.update(staff).set({ isActive: false }).where(eq(staff.id, id));
    return result.rowCount > 0;
  }

  // Payout Rates
  async getPayoutRates(): Promise<PayoutRate[]> {
    return await this.db.select().from(payoutRates);
  }

  async getPayoutRate(houseId: string, serviceCodeId: string, staffId: string): Promise<PayoutRate | undefined> {
    const result = await this.db.select().from(payoutRates)
      .where(and(
        eq(payoutRates.houseId, houseId),
        eq(payoutRates.serviceCodeId, serviceCodeId),
        eq(payoutRates.staffId, staffId)
      ));
    return result[0];
  }

  async createPayoutRate(payoutRate: InsertPayoutRate): Promise<PayoutRate> {
    const result = await this.db.insert(payoutRates).values(payoutRate).returning();
    return result[0];
  }

  async updatePayoutRate(id: string, payoutRate: Partial<InsertPayoutRate>): Promise<PayoutRate | undefined> {
    const result = await this.db.update(payoutRates).set(payoutRate).where(eq(payoutRates.id, id)).returning();
    return result[0];
  }

  // Patients
  async getPatients(): Promise<Patient[]> {
    return await this.db.select().from(patients).orderBy(desc(patients.startDate));
  }

  async getPatient(id: string): Promise<Patient | undefined> {
    const result = await this.db.select().from(patients).where(eq(patients.id, id));
    return result[0];
  }

  async searchPatients(query: string): Promise<Patient[]> {
    return await this.db.select().from(patients)
      .where(like(patients.name, `%${query}%`))
      .orderBy(desc(patients.startDate));
  }

  async createPatient(patient: InsertPatient): Promise<Patient> {
    const result = await this.db.insert(patients).values(patient).returning();
    return result[0];
  }

  async updatePatient(id: string, patient: Partial<InsertPatient>): Promise<Patient | undefined> {
    const result = await this.db.update(patients).set(patient).where(eq(patients.id, id)).returning();
    return result[0];
  }

  // Revenue Entries
  async getRevenueEntries(): Promise<RevenueEntry[]> {
    return await this.db.select().from(revenueEntries).orderBy(desc(revenueEntries.date));
  }

  async getRevenueEntry(id: string): Promise<RevenueEntry | undefined> {
    const result = await this.db.select().from(revenueEntries).where(eq(revenueEntries.id, id));
    return result[0];
  }

  async createRevenueEntry(revenueEntry: InsertRevenueEntry): Promise<RevenueEntry> {
    const result = await this.db.insert(revenueEntries).values(revenueEntry).returning();
    return result[0];
  }

  async updateRevenueEntry(id: string, revenueEntry: Partial<InsertRevenueEntry>): Promise<RevenueEntry | undefined> {
    const result = await this.db.update(revenueEntries).set(revenueEntry).where(eq(revenueEntries.id, id)).returning();
    return result[0];
  }

  async deleteRevenueEntry(id: string): Promise<boolean> {
    try {
      // First delete all related payouts
      await this.db.delete(payouts).where(eq(payouts.revenueEntryId, id));
      
      // Then delete the revenue entry
      const result = await this.db.delete(revenueEntries).where(eq(revenueEntries.id, id));
      return result.rowCount > 0;
    } catch (error) {
      console.error('Error deleting revenue entry:', error);
      throw error;
    }
  }

  // Expenses
  async getExpenses(): Promise<Expense[]> {
    return await this.db.select().from(expenses).orderBy(desc(expenses.date));
  }

  async getExpense(id: string): Promise<Expense | undefined> {
    const result = await this.db.select().from(expenses).where(eq(expenses.id, id));
    return result[0];
  }

  async createExpense(expense: InsertExpense): Promise<Expense> {
    const result = await this.db.insert(expenses).values(expense).returning();
    return result[0];
  }

  async updateExpense(id: string, expense: Partial<InsertExpense>): Promise<Expense | undefined> {
    const result = await this.db.update(expenses).set(expense).where(eq(expenses.id, id)).returning();
    return result[0];
  }

  async deleteExpense(id: string): Promise<boolean> {
    try {
      // Check if this expense is linked to time entries
      const linkedTimeEntries = await this.db
        .select()
        .from(timeEntries)
        .where(eq(timeEntries.expenseId, id));
      
      if (linkedTimeEntries.length > 0) {
        // If deleting an expense that was created from time entries,
        // we need to unmark the time entries as paid
        await this.db
          .update(timeEntries)
          .set({ 
            isPaid: false, 
            paidAt: null,
            expenseId: null 
          })
          .where(eq(timeEntries.expenseId, id));
      }
      
      // Now delete the expense
      const result = await this.db.delete(expenses).where(eq(expenses.id, id));
      return result.rowCount > 0;
    } catch (error) {
      console.error('Error deleting expense:', error);
      throw error;
    }
  }

  // Payouts
  async getPayouts(): Promise<Payout[]> {
    return await this.db.select().from(payouts);
  }

  async getPayoutsByRevenueEntry(revenueEntryId: string): Promise<Payout[]> {
    return await this.db.select().from(payouts).where(eq(payouts.revenueEntryId, revenueEntryId));
  }

  async createPayout(payout: Omit<Payout, 'id'>): Promise<Payout> {
    const result = await this.db.insert(payouts).values(payout).returning();
    return result[0];
  }

  async deletePayout(id: string): Promise<boolean> {
    const result = await this.db.delete(payouts).where(eq(payouts.id, id));
    return result.rowCount > 0;
  }

  // Business Settings
  async getBusinessSettings(): Promise<BusinessSettings | undefined> {
    const result = await this.db.select().from(businessSettings);
    return result[0];
  }

  async updateBusinessSettings(settings: InsertBusinessSettings): Promise<BusinessSettings> {
    const existing = await this.getBusinessSettings();
    if (existing) {
      const result = await this.db.update(businessSettings).set(settings).where(eq(businessSettings.id, existing.id)).returning();
      return result[0];
    } else {
      const result = await this.db.insert(businessSettings).values(settings).returning();
      return result[0];
    }
  }

  // Check Tracking methods
  async getCheckTrackingEntries(): Promise<CheckTracking[]> {
    return await this.db.select().from(checkTracking).orderBy(desc(checkTracking.processedDate));
  }

  async getCheckTrackingEntry(id: string): Promise<CheckTracking | undefined> {
    const result = await this.db.select().from(checkTracking).where(eq(checkTracking.id, id));
    return result[0];
  }

  async createCheckTrackingEntry(entry: InsertCheckTracking): Promise<CheckTracking> {
    const result = await this.db.insert(checkTracking).values(entry).returning();
    return result[0];
  }

  async updateCheckTrackingEntry(id: string, entry: Partial<InsertCheckTracking>): Promise<CheckTracking | undefined> {
    const result = await this.db.update(checkTracking).set(entry).where(eq(checkTracking.id, id)).returning();
    return result[0];
  }

  async deleteCheckTrackingEntry(id: string): Promise<boolean> {
    const result = await this.db.delete(checkTracking).where(eq(checkTracking.id, id));
    return result.rowCount > 0;
  }

  // User operations (required for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    try {
      const [user] = await this.db.select().from(users).where(eq(users.id, id));
      return user;
    } catch (error) {
      console.error("Error getting user:", error);
      return undefined;
    }
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    try {
      const result = await this.db
        .insert(users)
        .values(userData)
        .onConflictDoUpdate({
          target: users.id,
          set: {
            ...userData,
            updatedAt: new Date(),
          },
        })
        .returning();
      return result[0];
    } catch (error) {
      console.error("Error upserting user:", error);
      throw error;
    }
  }

  async getAllUsers(): Promise<User[]> {
    try {
      return await this.db.select().from(users).orderBy(desc(users.createdAt));
    } catch (error) {
      console.error("Error getting all users:", error);
      return [];
    }
  }

  async updateUserRole(userId: string, role: string, approvedBy?: string): Promise<User | undefined> {
    try {
      const updateData: any = { role, updatedAt: new Date() };
      if (approvedBy) {
        updateData.approvedBy = approvedBy;
        updateData.approvedAt = new Date();
        updateData.isApproved = true;
      }
      
      const result = await this.db
        .update(users)
        .set(updateData)
        .where(eq(users.id, userId))
        .returning();
      return result[0];
    } catch (error) {
      console.error("Error updating user role:", error);
      return undefined;
    }
  }

  async approveUser(userId: string, approvedBy: string): Promise<User | undefined> {
    try {
      const result = await this.db
        .update(users)
        .set({
          isApproved: true,
          role: "user",
          approvedBy,
          approvedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId))
        .returning();
      return result[0];
    } catch (error) {
      console.error("Error approving user:", error);
      return undefined;
    }
  }

  async deleteUser(id: string): Promise<boolean> {
    try {
      // Note: In a production environment, you might want to soft delete
      // or prevent deletion of users who have created data
      const result = await this.db.delete(users).where(eq(users.id, id));
      return result.rowCount > 0;
    } catch (error) {
      console.error("Error deleting user:", error);
      return false;
    }
  }

  // Hourly Employees
  async getHourlyEmployees(): Promise<HourlyEmployee[]> {
    return await this.db.select().from(hourlyEmployees).where(eq(hourlyEmployees.isActive, true));
  }

  async getHourlyEmployee(id: string): Promise<HourlyEmployee | undefined> {
    const result = await this.db.select().from(hourlyEmployees).where(eq(hourlyEmployees.id, id));
    return result[0];
  }

  async createHourlyEmployee(employee: InsertHourlyEmployee): Promise<HourlyEmployee> {
    const result = await this.db.insert(hourlyEmployees).values(employee).returning();
    return result[0];
  }

  async updateHourlyEmployee(id: string, employee: Partial<InsertHourlyEmployee>): Promise<HourlyEmployee | undefined> {
    const result = await this.db.update(hourlyEmployees).set(employee).where(eq(hourlyEmployees.id, id)).returning();
    return result[0];
  }

  async deleteHourlyEmployee(id: string): Promise<boolean> {
    const result = await this.db.update(hourlyEmployees).set({ isActive: false }).where(eq(hourlyEmployees.id, id));
    return result.rowCount > 0;
  }

  // Time Entries
  async getTimeEntries(): Promise<TimeEntry[]> {
    return await this.db.select().from(timeEntries).orderBy(desc(timeEntries.date));
  }

  async getTimeEntriesByEmployee(employeeId: string): Promise<TimeEntry[]> {
    return await this.db.select().from(timeEntries).where(eq(timeEntries.employeeId, employeeId)).orderBy(desc(timeEntries.date));
  }

  async getUnpaidTimeEntries(): Promise<TimeEntry[]> {
    return await this.db.select().from(timeEntries).where(eq(timeEntries.isPaid, false)).orderBy(desc(timeEntries.date));
  }

  async getTimeEntry(id: string): Promise<TimeEntry | undefined> {
    const result = await this.db.select().from(timeEntries).where(eq(timeEntries.id, id));
    return result[0];
  }

  async createTimeEntry(timeEntry: InsertTimeEntry): Promise<TimeEntry> {
    const result = await this.db.insert(timeEntries).values(timeEntry).returning();
    return result[0];
  }

  async updateTimeEntry(id: string, timeEntry: Partial<InsertTimeEntry>): Promise<TimeEntry | undefined> {
    const result = await this.db.update(timeEntries).set(timeEntry).where(eq(timeEntries.id, id)).returning();
    return result[0];
  }

  async deleteTimeEntry(id: string): Promise<boolean> {
    const result = await this.db.delete(timeEntries).where(eq(timeEntries.id, id));
    return result.rowCount > 0;
  }

  async markTimeEntriesAsPaid(timeEntryIds: string[], expenseId: string): Promise<boolean> {
    try {
      const result = await this.db
        .update(timeEntries)
        .set({ 
          isPaid: true, 
          paidAt: new Date(),
          expenseId: expenseId 
        })
        .where(inArray(timeEntries.id, timeEntryIds));
      return result.rowCount > 0;
    } catch (error) {
      console.error('Error marking time entries as paid:', error);
      throw error;
    }
  }

  // Staff Payments
  async getStaffPayments(): Promise<StaffPayment[]> {
    return await this.db.select().from(staffPayments).orderBy(desc(staffPayments.paymentDate));
  }

  async getStaffPaymentsByStaff(staffId: string): Promise<StaffPayment[]> {
    return await this.db.select().from(staffPayments).where(eq(staffPayments.staffId, staffId)).orderBy(desc(staffPayments.paymentDate));
  }

  async getStaffPayment(id: string): Promise<StaffPayment | undefined> {
    const result = await this.db.select().from(staffPayments).where(eq(staffPayments.id, id));
    return result[0];
  }

  async createStaffPayment(payment: InsertStaffPayment): Promise<StaffPayment> {
    const result = await this.db.insert(staffPayments).values(payment).returning();
    return result[0];
  }

  async updateStaffPayment(id: string, payment: Partial<InsertStaffPayment>): Promise<StaffPayment | undefined> {
    const result = await this.db.update(staffPayments).set(payment).where(eq(staffPayments.id, id)).returning();
    return result[0];
  }

  async deleteStaffPayment(id: string): Promise<boolean> {
    const result = await this.db.delete(staffPayments).where(eq(staffPayments.id, id));
    return result.rowCount > 0;
  }
}

// Use database storage instead of memory storage
export const storage = new DbStorage();
