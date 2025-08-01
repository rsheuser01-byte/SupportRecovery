import { 
  type House, type InsertHouse,
  type ServiceCode, type InsertServiceCode,
  type Staff, type InsertStaff,
  type PayoutRate, type InsertPayoutRate,
  type Patient, type InsertPatient,
  type RevenueEntry, type InsertRevenueEntry,
  type Expense, type InsertExpense,
  type Payout
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Houses
  getHouses(): Promise<House[]>;
  getHouse(id: string): Promise<House | undefined>;
  createHouse(house: InsertHouse): Promise<House>;
  updateHouse(id: string, house: Partial<InsertHouse>): Promise<House | undefined>;

  // Service Codes
  getServiceCodes(): Promise<ServiceCode[]>;
  getServiceCode(id: string): Promise<ServiceCode | undefined>;
  createServiceCode(serviceCode: InsertServiceCode): Promise<ServiceCode>;
  updateServiceCode(id: string, serviceCode: Partial<InsertServiceCode>): Promise<ServiceCode | undefined>;

  // Staff
  getStaff(): Promise<Staff[]>;
  getStaffMember(id: string): Promise<Staff | undefined>;
  createStaff(staff: InsertStaff): Promise<Staff>;
  updateStaff(id: string, staff: Partial<InsertStaff>): Promise<Staff | undefined>;

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
      { id: "staff-1", name: "Dr. Kelsey", isActive: true },
      { id: "staff-2", name: "Bardstown Billing", isActive: true },
      { id: "staff-3", name: "George", isActive: true },
      { id: "staff-4", name: "Maria", isActive: true },
      { id: "staff-5", name: "Shelton", isActive: true },
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
}

export const storage = new MemStorage();
