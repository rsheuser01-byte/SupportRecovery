import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertHouseSchema, insertServiceCodeSchema, insertStaffSchema, 
  insertPayoutRateSchema, insertPatientSchema, insertRevenueEntrySchema, 
  insertExpenseSchema, insertBusinessSettingsSchema 
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Houses
  app.get("/api/houses", async (req, res) => {
    try {
      const houses = await storage.getHouses();
      res.json(houses);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch houses" });
    }
  });

  app.post("/api/houses", async (req, res) => {
    try {
      const houseData = insertHouseSchema.parse(req.body);
      const house = await storage.createHouse(houseData);
      res.json(house);
    } catch (error) {
      res.status(400).json({ message: "Invalid house data" });
    }
  });

  app.put("/api/houses/:id", async (req, res) => {
    try {
      const houseData = insertHouseSchema.partial().parse(req.body);
      const house = await storage.updateHouse(req.params.id, houseData);
      if (!house) {
        return res.status(404).json({ message: "House not found" });
      }
      res.json(house);
    } catch (error) {
      res.status(400).json({ message: "Invalid house data" });
    }
  });

  // Service Codes
  app.get("/api/service-codes", async (req, res) => {
    try {
      const serviceCodes = await storage.getServiceCodes();
      res.json(serviceCodes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch service codes" });
    }
  });

  app.post("/api/service-codes", async (req, res) => {
    try {
      const serviceCodeData = insertServiceCodeSchema.parse(req.body);
      const serviceCode = await storage.createServiceCode(serviceCodeData);
      res.json(serviceCode);
    } catch (error) {
      res.status(400).json({ message: "Invalid service code data" });
    }
  });

  app.put("/api/service-codes/:id", async (req, res) => {
    try {
      const serviceCodeData = insertServiceCodeSchema.partial().parse(req.body);
      const serviceCode = await storage.updateServiceCode(req.params.id, serviceCodeData);
      if (!serviceCode) {
        return res.status(404).json({ message: "Service code not found" });
      }
      res.json(serviceCode);
    } catch (error) {
      res.status(400).json({ message: "Invalid service code data" });
    }
  });

  // Staff
  app.get("/api/staff", async (req, res) => {
    try {
      const staff = await storage.getStaff();
      res.json(staff);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch staff" });
    }
  });

  app.post("/api/staff", async (req, res) => {
    try {
      const staffData = insertStaffSchema.parse(req.body);
      const staff = await storage.createStaff(staffData);
      res.json(staff);
    } catch (error) {
      res.status(400).json({ message: "Invalid staff data" });
    }
  });

  app.put("/api/staff/:id", async (req, res) => {
    try {
      const staffData = insertStaffSchema.partial().parse(req.body);
      const staff = await storage.updateStaff(req.params.id, staffData);
      if (!staff) {
        return res.status(404).json({ message: "Staff member not found" });
      }
      res.json(staff);
    } catch (error) {
      res.status(400).json({ message: "Invalid staff data" });
    }
  });

  // Payout Rates
  app.get("/api/payout-rates", async (req, res) => {
    try {
      const payoutRates = await storage.getPayoutRates();
      res.json(payoutRates);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch payout rates" });
    }
  });

  app.post("/api/payout-rates", async (req, res) => {
    try {
      const payoutRateData = insertPayoutRateSchema.parse(req.body);
      const payoutRate = await storage.createPayoutRate(payoutRateData);
      res.json(payoutRate);
    } catch (error) {
      res.status(400).json({ message: "Invalid payout rate data" });
    }
  });

  app.put("/api/payout-rates/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const payoutRateData = insertPayoutRateSchema.partial().parse(req.body);
      const payoutRate = await storage.updatePayoutRate(id, payoutRateData);
      if (!payoutRate) {
        return res.status(404).json({ message: "Payout rate not found" });
      }
      res.json(payoutRate);
    } catch (error) {
      res.status(400).json({ message: "Invalid payout rate data" });
    }
  });

  // Patients
  app.get("/api/patients", async (req, res) => {
    try {
      const { search } = req.query;
      let patients;
      if (search && typeof search === 'string') {
        patients = await storage.searchPatients(search);
      } else {
        patients = await storage.getPatients();
      }
      res.json(patients);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch patients" });
    }
  });

  app.post("/api/patients", async (req, res) => {
    try {
      const patientData = insertPatientSchema.parse(req.body);
      const patient = await storage.createPatient(patientData);
      res.json(patient);
    } catch (error) {
      res.status(400).json({ message: "Invalid patient data" });
    }
  });

  app.put("/api/patients/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const patientData = insertPatientSchema.partial().parse(req.body);
      const patient = await storage.updatePatient(id, patientData);
      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }
      res.json(patient);
    } catch (error) {
      res.status(400).json({ message: "Invalid patient data" });
    }
  });

  // Revenue Entries
  app.get("/api/revenue-entries", async (req, res) => {
    try {
      const revenueEntries = await storage.getRevenueEntries();
      res.json(revenueEntries);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch revenue entries" });
    }
  });

  app.post("/api/revenue-entries", async (req, res) => {
    try {
      const revenueEntryData = insertRevenueEntrySchema.parse(req.body);
      const revenueEntry = await storage.createRevenueEntry(revenueEntryData);
      
      // Calculate and create payouts
      const payoutRates = await storage.getPayoutRates();
      const relevantRates = payoutRates.filter(rate => 
        rate.houseId === revenueEntry.houseId && rate.serviceCodeId === revenueEntry.serviceCodeId
      );

      for (const rate of relevantRates) {
        const amount = (parseFloat(revenueEntry.amount) * parseFloat(rate.percentage) / 100).toFixed(2);
        await storage.createPayout({
          revenueEntryId: revenueEntry.id,
          staffId: rate.staffId,
          amount,
          percentage: rate.percentage
        });
      }

      res.json(revenueEntry);
    } catch (error) {
      res.status(400).json({ message: "Invalid revenue entry data" });
    }
  });

  app.put("/api/revenue-entries/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const revenueEntryData = insertRevenueEntrySchema.partial().parse(req.body);
      const revenueEntry = await storage.updateRevenueEntry(id, revenueEntryData);
      if (!revenueEntry) {
        return res.status(404).json({ message: "Revenue entry not found" });
      }
      res.json(revenueEntry);
    } catch (error) {
      res.status(400).json({ message: "Invalid revenue entry data" });
    }
  });

  app.delete("/api/revenue-entries/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteRevenueEntry(id);
      if (!deleted) {
        return res.status(404).json({ message: "Revenue entry not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete revenue entry" });
    }
  });

  // Expenses
  app.get("/api/expenses", async (req, res) => {
    try {
      const expenses = await storage.getExpenses();
      res.json(expenses);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch expenses" });
    }
  });

  app.post("/api/expenses", async (req, res) => {
    try {
      const expenseData = insertExpenseSchema.parse(req.body);
      const expense = await storage.createExpense(expenseData);
      res.json(expense);
    } catch (error) {
      res.status(400).json({ message: "Invalid expense data" });
    }
  });

  app.put("/api/expenses/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const expenseData = insertExpenseSchema.partial().parse(req.body);
      const expense = await storage.updateExpense(id, expenseData);
      if (!expense) {
        return res.status(404).json({ message: "Expense not found" });
      }
      res.json(expense);
    } catch (error) {
      res.status(400).json({ message: "Invalid expense data" });
    }
  });

  app.delete("/api/expenses/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteExpense(id);
      if (!deleted) {
        return res.status(404).json({ message: "Expense not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete expense" });
    }
  });

  // Payouts
  app.get("/api/payouts", async (req, res) => {
    try {
      const payouts = await storage.getPayouts();
      res.json(payouts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch payouts" });
    }
  });

  // Calculate payout preview
  app.post("/api/calculate-payouts", async (req, res) => {
    try {
      const { amount, houseId, serviceCodeId } = req.body;
      const payoutRates = await storage.getPayoutRates();
      const relevantRates = payoutRates.filter(rate => 
        rate.houseId === houseId && rate.serviceCodeId === serviceCodeId
      );

      const staff = await storage.getStaff();
      const payoutPreview = staff.map(staffMember => {
        const rate = relevantRates.find(r => r.staffId === staffMember.id);
        const percentage = rate ? parseFloat(rate.percentage) : 0;
        const payoutAmount = (parseFloat(amount) * percentage / 100).toFixed(2);
        
        return {
          staffId: staffMember.id,
          staffName: staffMember.name,
          percentage,
          amount: payoutAmount
        };
      });

      res.json(payoutPreview);
    } catch (error) {
      res.status(400).json({ message: "Invalid calculation data" });
    }
  });

  // Business Settings
  app.get("/api/business-settings", async (req, res) => {
    try {
      const settings = await storage.getBusinessSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch business settings" });
    }
  });

  app.put("/api/business-settings", async (req, res) => {
    try {
      const settingsData = insertBusinessSettingsSchema.parse(req.body);
      const settings = await storage.updateBusinessSettings(settingsData);
      res.json(settings);
    } catch (error) {
      res.status(400).json({ message: "Invalid business settings data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
