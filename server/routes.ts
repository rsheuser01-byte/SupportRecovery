import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, isApproved, isAdmin } from "./replitAuth";
import { 
  insertHouseSchema, insertServiceCodeSchema, insertStaffSchema, 
  insertPayoutRateSchema, insertPatientSchema, insertRevenueEntrySchema, 
  insertExpenseSchema, insertBusinessSettingsSchema, insertCheckTrackingSchema 
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        // Check if this is the first user in the system - make them admin
        const allUsers = await storage.getAllUsers();
        const isFirstUser = allUsers.length === 0;
        
        // Create user
        const userData = {
          id: userId,
          email: req.user.claims.email,
          firstName: req.user.claims.given_name,
          lastName: req.user.claims.family_name,
          profileImageUrl: req.user.claims.picture,
          role: isFirstUser ? "admin" : "pending",
          isApproved: isFirstUser, // First user is auto-approved
        };
        const newUser = await storage.upsertUser(userData);
        res.json(newUser);
      } else {
        res.json(user);
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
  // User management routes
  app.get("/api/users", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post("/api/users/:id/approve", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const adminUserId = (req as any).user.claims.sub;
      const user = await storage.approveUser(req.params.id, adminUserId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to approve user" });
    }
  });

  app.post("/api/users/:id/role", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { role } = req.body;
      if (!['pending', 'user', 'admin'].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }
      
      const adminUserId = (req as any).user.claims.sub;
      const user = await storage.updateUserRole(req.params.id, role, adminUserId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  // Houses - Protected with authentication and approval
  app.get("/api/houses", isAuthenticated, isApproved, async (req, res) => {
    try {
      const houses = await storage.getHouses();
      res.json(houses);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch houses" });
    }
  });

  app.post("/api/houses", isAuthenticated, isApproved, async (req, res) => {
    try {
      const houseData = insertHouseSchema.parse(req.body);
      const house = await storage.createHouse(houseData);
      res.json(house);
    } catch (error) {
      res.status(400).json({ message: "Invalid house data" });
    }
  });

  app.put("/api/houses/:id", isAuthenticated, isApproved, async (req, res) => {
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

  app.delete("/api/houses/:id", isAuthenticated, isApproved, async (req, res) => {
    try {
      const deleted = await storage.deleteHouse(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "House not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete house" });
    }
  });

  // Service Codes
  app.get("/api/service-codes", isAuthenticated, async (req, res) => {
    try {
      const serviceCodes = await storage.getServiceCodes();
      res.json(serviceCodes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch service codes" });
    }
  });

  app.post("/api/service-codes", isAuthenticated, async (req, res) => {
    try {
      const serviceCodeData = insertServiceCodeSchema.parse(req.body);
      const serviceCode = await storage.createServiceCode(serviceCodeData);
      res.json(serviceCode);
    } catch (error) {
      res.status(400).json({ message: "Invalid service code data" });
    }
  });

  app.put("/api/service-codes/:id", isAuthenticated, async (req, res) => {
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

  app.delete("/api/service-codes/:id", isAuthenticated, async (req, res) => {
    try {
      const deleted = await storage.deleteServiceCode(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Service code not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete service code" });
    }
  });

  // Staff
  app.get("/api/staff", isAuthenticated, async (req, res) => {
    try {
      const staff = await storage.getStaff();
      res.json(staff);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch staff" });
    }
  });

  app.post("/api/staff", isAuthenticated, async (req, res) => {
    try {
      const staffData = insertStaffSchema.parse(req.body);
      const staff = await storage.createStaff(staffData);
      res.json(staff);
    } catch (error) {
      res.status(400).json({ message: "Invalid staff data" });
    }
  });

  app.put("/api/staff/:id", isAuthenticated, async (req, res) => {
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

  app.delete("/api/staff/:id", isAuthenticated, async (req, res) => {
    try {
      const deleted = await storage.deleteStaff(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Staff member not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete staff member" });
    }
  });

  // Payout Rates
  app.get("/api/payout-rates", isAuthenticated, async (req, res) => {
    try {
      const payoutRates = await storage.getPayoutRates();
      res.json(payoutRates);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch payout rates" });
    }
  });

  app.post("/api/payout-rates", isAuthenticated, async (req, res) => {
    try {
      const payoutRateData = insertPayoutRateSchema.parse(req.body);
      const payoutRate = await storage.createPayoutRate(payoutRateData);
      res.json(payoutRate);
    } catch (error) {
      res.status(400).json({ message: "Invalid payout rate data" });
    }
  });

  app.put("/api/payout-rates/:id", isAuthenticated, async (req, res) => {
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
  app.get("/api/patients", isAuthenticated, async (req, res) => {
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

  app.post("/api/patients", isAuthenticated, async (req, res) => {
    try {
      // Convert date string to Date object before validation if startDate exists
      const processedData = {
        ...req.body,
        ...(req.body.startDate && { startDate: new Date(req.body.startDate) })
      };
      const patientData = insertPatientSchema.parse(processedData);
      const patient = await storage.createPatient(patientData);
      res.json(patient);
    } catch (error: any) {
      console.error("Patient validation error:", error);
      res.status(400).json({ message: "Invalid patient data", error: error.message });
    }
  });

  app.put("/api/patients/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      // Convert date string to Date object before validation if startDate exists
      const processedData = {
        ...req.body,
        ...(req.body.startDate && { startDate: new Date(req.body.startDate) })
      };
      const patientData = insertPatientSchema.partial().parse(processedData);
      const patient = await storage.updatePatient(id, patientData);
      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }
      res.json(patient);
    } catch (error: any) {
      console.error("Patient update validation error:", error);
      res.status(400).json({ message: "Invalid patient data", error: error.message });
    }
  });

  // Revenue Entries
  app.get("/api/revenue-entries", isAuthenticated, async (req, res) => {
    try {
      const revenueEntries = await storage.getRevenueEntries();
      res.json(revenueEntries);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch revenue entries" });
    }
  });

  app.post("/api/revenue-entries", isAuthenticated, async (req, res) => {
    try {
      // Convert date strings to Date objects before validation with error handling
      const processedData = {
        ...req.body,
        date: req.body.date ? new Date(req.body.date) : undefined,
        checkDate: req.body.checkDate ? new Date(req.body.checkDate) : undefined
      };
      
      // Validate dates are not invalid
      if (processedData.date && isNaN(processedData.date.getTime())) {
        return res.status(400).json({ message: "Invalid date format" });
      }
      if (processedData.checkDate && isNaN(processedData.checkDate.getTime())) {
        return res.status(400).json({ message: "Invalid check date format" });
      }
      const revenueEntryData = insertRevenueEntrySchema.parse(processedData);
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
    } catch (error: any) {
      console.error("Revenue entry validation error:", error);
      res.status(400).json({ message: "Invalid revenue entry data", error: error.message });
    }
  });

  app.put("/api/revenue-entries/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      
      // Convert date strings to Date objects before validation if they exist
      const processedData = { ...req.body };
      
      if (req.body.date) {
        const dateObj = new Date(req.body.date);
        if (isNaN(dateObj.getTime())) {
          return res.status(400).json({ message: "Invalid date format" });
        }
        processedData.date = dateObj;
      }
      
      if (req.body.checkDate) {
        const checkDateObj = new Date(req.body.checkDate);
        if (isNaN(checkDateObj.getTime())) {
          return res.status(400).json({ message: "Invalid check date format" });
        }
        processedData.checkDate = checkDateObj;
      }
      
      const revenueEntryData = insertRevenueEntrySchema.partial().parse(processedData);
      
      const revenueEntry = await storage.updateRevenueEntry(id, revenueEntryData);
      if (!revenueEntry) {
        return res.status(404).json({ message: "Revenue entry not found" });
      }
      
      // Delete existing payouts for this revenue entry
      const existingPayouts = await storage.getPayouts();
      const revenuePayouts = existingPayouts.filter(p => p.revenueEntryId === id);
      for (const payout of revenuePayouts) {
        await storage.deletePayout(payout.id);
      }
      
      // Calculate and create new payouts
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
    } catch (error: any) {
      console.error("Revenue entry update validation error:", error);
      console.error("Error details:", error.issues || error.errors || error);
      res.status(400).json({ message: "Invalid revenue entry data", error: error.message, details: error.issues || error.errors });
    }
  });

  app.delete("/api/revenue-entries/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteRevenueEntry(id);
      if (!deleted) {
        return res.status(404).json({ message: "Revenue entry not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting revenue entry:', error);
      res.status(500).json({ message: "Failed to delete revenue entry", error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Expenses
  app.get("/api/expenses", isAuthenticated, async (req, res) => {
    try {
      const expenses = await storage.getExpenses();
      res.json(expenses);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch expenses" });
    }
  });

  app.post("/api/expenses", isAuthenticated, async (req, res) => {
    try {
      console.log("Received expense data:", req.body);
      // Convert date string to Date object before validation
      const processedData = {
        ...req.body,
        date: new Date(req.body.date)
      };
      console.log("Processed expense data:", processedData);
      const expenseData = insertExpenseSchema.parse(processedData);
      console.log("Parsed expense data:", expenseData);
      const expense = await storage.createExpense(expenseData);
      res.json(expense);
    } catch (error: any) {
      console.error("Expense validation error:", error);
      res.status(400).json({ message: "Invalid expense data", error: error.message });
    }
  });

  app.put("/api/expenses/:id", isAuthenticated, async (req, res) => {
    try {
      // Convert date string to Date object before validation
      const processedData = {
        ...req.body,
        date: new Date(req.body.date)
      };
      const expenseData = insertExpenseSchema.parse(processedData);
      const expense = await storage.updateExpense(req.params.id, expenseData);
      res.json(expense);
    } catch (error: any) {
      console.error("Expense update validation error:", error);
      res.status(400).json({ message: "Invalid expense data", error: error.message });
    }
  });

  app.put("/api/expenses/:id", isAuthenticated, async (req, res) => {
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

  app.delete("/api/expenses/:id", isAuthenticated, async (req, res) => {
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
  app.get("/api/payouts", isAuthenticated, async (req, res) => {
    try {
      const payouts = await storage.getPayouts();
      res.json(payouts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch payouts" });
    }
  });

  // Calculate payout preview
  app.post("/api/calculate-payouts", isAuthenticated, async (req, res) => {
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
  app.get("/api/business-settings", isAuthenticated, async (req, res) => {
    try {
      const settings = await storage.getBusinessSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch business settings" });
    }
  });

  app.put("/api/business-settings", isAuthenticated, async (req, res) => {
    try {
      const settingsData = insertBusinessSettingsSchema.parse(req.body);
      const settings = await storage.updateBusinessSettings(settingsData);
      res.json(settings);
    } catch (error) {
      res.status(400).json({ message: "Invalid business settings data" });
    }
  });

  // Daily Report
  app.get("/api/daily-report/:date", isAuthenticated, async (req, res) => {
    try {
      const { date } = req.params;
      // Parse date safely to avoid timezone issues
      const [year, month, day] = date.split('-').map(Number);
      const targetDateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;

      // Get revenue entries for the processing date (not service date)
      const allRevenueEntries = await storage.getRevenueEntries();
      const revenueEntries = allRevenueEntries.filter(entry => {
        // Filter by checkDate (processing date) instead of service date
        const entryProcessedDate = entry.checkDate;
        const entryProcessedDateStr = entryProcessedDate instanceof Date 
          ? entryProcessedDate.toISOString().split('T')[0] 
          : String(entryProcessedDate).split('T')[0];
        return entryProcessedDateStr === targetDateStr;
      });

      // Get expenses for the date
      const allExpenses = await storage.getExpenses();
      const expenses = allExpenses.filter(expense => {
        // Compare date strings directly to avoid timezone issues
        const expenseDate = expense.date;
        const expenseDateStr = expenseDate instanceof Date 
          ? expenseDate.toISOString().split('T')[0] 
          : String(expenseDate).split('T')[0];
        return expenseDateStr === targetDateStr;
      });

      // Get related data for the report
      const houses = await storage.getHouses();
      const serviceCodes = await storage.getServiceCodes();
      const patients = await storage.getPatients();
      const staff = await storage.getStaff();
      const payoutRates = await storage.getPayoutRates();

      // Calculate totals
      const totalRevenue = revenueEntries.reduce((sum, entry) => sum + parseFloat(entry.amount), 0);
      const totalExpenses = expenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
      const netIncome = totalRevenue - totalExpenses;

      // Calculate payouts for revenue entries
      const payouts = revenueEntries.map(entry => {
        const relevantRates = payoutRates.filter(rate => 
          rate.houseId === entry.houseId && rate.serviceCodeId === entry.serviceCodeId
        );

        return staff.map(staffMember => {
          const rate = relevantRates.find(r => r.staffId === staffMember.id);
          const percentage = rate ? parseFloat(rate.percentage) : 0;
          const payoutAmount = (parseFloat(entry.amount) * percentage / 100);
          
          return {
            revenueEntryId: entry.id,
            staffId: staffMember.id,
            staffName: staffMember.name,
            percentage,
            amount: payoutAmount,
            revenueAmount: parseFloat(entry.amount)
          };
        });
      }).flat();

      // Group payouts by staff member
      const payoutsByStaff = staff.map(staffMember => {
        const staffPayouts = payouts.filter(p => p.staffId === staffMember.id);
        const totalPayout = staffPayouts.reduce((sum, p) => sum + p.amount, 0);
        return {
          staffId: staffMember.id,
          staffName: staffMember.name,
          totalPayout,
          entries: staffPayouts.length
        };
      }).filter(sp => sp.totalPayout > 0);

      res.json({
        date: targetDateStr,
        revenueEntries: revenueEntries.map(entry => ({
          ...entry,
          houseName: houses.find(h => h.id === entry.houseId)?.name,
          serviceCodeName: serviceCodes.find(s => s.id === entry.serviceCodeId)?.code,
          patientName: entry.patientId ? patients.find(p => p.id === entry.patientId)?.name : null
        })),
        expenses: expenses,
        totals: {
          revenue: totalRevenue,
          expenses: totalExpenses,
          netIncome
        },
        payoutsByStaff,
        houses,
        serviceCodes,
        patients,
        staff
      });
    } catch (error) {
      console.error("Daily report error:", error);
      res.status(500).json({ message: "Failed to generate daily report" });
    }
  });

  // Check Tracking Routes
  app.get("/api/check-tracking", isAuthenticated, async (req, res) => {
    try {
      const entries = await storage.getCheckTrackingEntries();
      res.json(entries);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch check tracking entries" });
    }
  });

  app.post("/api/check-tracking", isAuthenticated, async (req, res) => {
    try {
      const entryData = insertCheckTrackingSchema.parse(req.body);
      const entry = await storage.createCheckTrackingEntry(entryData);
      res.json(entry);
    } catch (error: any) {
      console.error("Check tracking validation error:", error);
      res.status(400).json({ message: "Invalid check tracking data", error: error.message });
    }
  });

  app.put("/api/check-tracking/:id", isAuthenticated, async (req, res) => {
    try {
      const entryData = insertCheckTrackingSchema.partial().parse(req.body);
      const entry = await storage.updateCheckTrackingEntry(req.params.id, entryData);
      if (!entry) {
        return res.status(404).json({ message: "Check tracking entry not found" });
      }
      res.json(entry);
    } catch (error: any) {
      console.error("Check tracking update error:", error);
      res.status(400).json({ message: "Invalid check tracking data", error: error.message });
    }
  });

  app.delete("/api/check-tracking/:id", isAuthenticated, async (req, res) => {
    try {
      const deleted = await storage.deleteCheckTrackingEntry(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Check tracking entry not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete check tracking entry" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
