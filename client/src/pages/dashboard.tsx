import React, { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { 
  DollarSign, Users, TrendingUp, Receipt, Download, Plus, 
  Search, Edit, Trash2, FileText, BarChart3, PieChart, 
  Settings, Home, UserCheck, Calculator, Calendar, LogOut, Shield, HelpCircle, Menu, X
} from "lucide-react";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import RevenueChart from "../components/revenue-chart";
import RevenueEntryModal from "../components/revenue-entry-modal";
import ExpenseModal from "../components/expense-modal";
import PatientModal from "../components/patient-modal";
import PayoutRatesModal from "../components/payout-rates-modal";
import { ServiceCodeModal } from "../components/service-code-modal";
import { BusinessSettingsModal } from "../components/business-settings-modal";
import { HouseModal } from "../components/house-modal";
import { StaffModal } from "../components/staff-modal";
import InteractiveCalendar from "../components/interactive-calendar";
import type { 
  House, ServiceCode, Staff, Patient, RevenueEntry, Expense, PayoutRate, Payout, CheckTracking 
} from "@shared/schema";
import { CheckTrackingModal } from "@/components/check-tracking-modal";
import { UserManagementModal } from "@/components/user-management-modal";
import { OnboardingWalkthrough } from "@/components/onboarding-walkthrough";
import { useOnboarding } from "@/hooks/useOnboarding";

export default function Dashboard() {
  const [selectedTab, setSelectedTab] = useState("dashboard");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [settingsSubTab, setSettingsSubTab] = useState("service-codes");
  const [revenueModalOpen, setRevenueModalOpen] = useState(false);
  const [editingRevenueEntry, setEditingRevenueEntry] = useState<RevenueEntry | undefined>(undefined);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | undefined>(undefined);
  const [patientModalOpen, setPatientModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | undefined>(undefined);
  const [payoutRatesModalOpen, setPayoutRatesModalOpen] = useState(false);
  const [serviceCodeModalOpen, setServiceCodeModalOpen] = useState(false);
  const [businessSettingsModalOpen, setBusinessSettingsModalOpen] = useState(false);
  const [houseModalOpen, setHouseModalOpen] = useState(false);
  const [staffModalOpen, setStaffModalOpen] = useState(false);
  const [editingServiceCode, setEditingServiceCode] = useState<ServiceCode | undefined>(undefined);
  const [editingHouse, setEditingHouse] = useState<House | undefined>(undefined);
  const [editingStaff, setEditingStaff] = useState<Staff | undefined>(undefined);
  const [checkTrackingModalOpen, setCheckTrackingModalOpen] = useState(false);
  const [editingCheckEntry, setEditingCheckEntry] = useState<CheckTracking | undefined>(undefined);
  const [userManagementModalOpen, setUserManagementModalOpen] = useState(false);
  const [checkTrackingFilter, setCheckTrackingFilter] = useState<'all' | 'this-month' | 'last-month' | 'custom-date'>('all');
  const [checkTrackingCustomDate, setCheckTrackingCustomDate] = useState<string>('');
  const [selectedReportDate, setSelectedReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedCheckDate, setSelectedCheckDate] = useState<string | null>(null);
  const [selectedStaffForCheckDate, setSelectedStaffForCheckDate] = useState<string | null>(null);
  const [calendarSelectedDate, setCalendarSelectedDate] = useState<string | undefined>(undefined);
  const [patientSearchTerm, setPatientSearchTerm] = useState("");
  const [selectedHouseFilter, setSelectedHouseFilter] = useState("all");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("all");
  
  // Revenue entry filters
  const [revenueFilters, setRevenueFilters] = useState({
    dateRange: 'all',
    houseId: 'all',
    serviceCodeId: 'all'
  });

  // Dashboard date filter
  const [dashboardDateFilter, setDashboardDateFilter] = useState('all');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { showOnboarding, hasCompletedOnboarding, completeOnboarding, startOnboarding } = useOnboarding();
  const { user, isAuthenticated, isLoading } = useAuth();

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  // Handle logout
  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  // Delete mutations
  const deleteServiceCodeMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/service-codes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-codes"] });
      toast({ title: "Service code deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete service code", variant: "destructive" });
    },
  });

  const deleteHouseMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/houses/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/houses"] });
      toast({ title: "House deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete house", variant: "destructive" });
    },
  });

  const deleteStaffMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/staff/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff"] });
      toast({ title: "Staff member deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete staff member", variant: "destructive" });
    },
  });

  const deleteCheckTrackingMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/check-tracking/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/check-tracking"] });
      toast({ title: "Check entry deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete check entry", variant: "destructive" });
    },
  });

  // Queries
  const { data: houses = [] } = useQuery<House[]>({
    queryKey: ['/api/houses'],
  });

  const { data: serviceCodes = [] } = useQuery<ServiceCode[]>({
    queryKey: ['/api/service-codes'],
  });

  const { data: staff = [] } = useQuery<Staff[]>({
    queryKey: ['/api/staff'],
  });

  const { data: patients = [] } = useQuery<Patient[]>({
    queryKey: ['/api/patients'],
  });

  const { data: revenueEntries = [] } = useQuery<RevenueEntry[]>({
    queryKey: ['/api/revenue-entries'],
  });

  const { data: expenses = [] } = useQuery<Expense[]>({
    queryKey: ['/api/expenses'],
  });

  const { data: payouts = [] } = useQuery<Payout[]>({
    queryKey: ['/api/payouts'],
  });

  const { data: payoutRates = [] } = useQuery<PayoutRate[]>({
    queryKey: ['/api/payout-rates'],
  });

  const { data: checkTrackingEntries = [] } = useQuery<CheckTracking[]>({
    queryKey: ['/api/check-tracking'],
  });

  // Daily report query
  const { data: dailyReport, isLoading: isDailyReportLoading } = useQuery({
    queryKey: ['/api/daily-report', selectedReportDate],
    queryFn: () => fetch(`/api/daily-report/${selectedReportDate}`).then(res => res.json()),
    enabled: selectedTab === "reports"
  });

  // Mutations
  const deleteRevenueMutation = useMutation({
    mutationFn: (id: string) => apiRequest('DELETE', `/api/revenue-entries/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/revenue-entries'] });
      queryClient.invalidateQueries({ queryKey: ['/api/payouts'] });
      toast({ title: "Revenue entry deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete revenue entry", variant: "destructive" });
    },
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: (id: string) => apiRequest('DELETE', `/api/expenses/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/expenses'] });
      toast({ title: "Expense deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete expense", variant: "destructive" });
    },
  });

  // Get latest check date for "Last Check" filter option
  const getLatestCheckDate = () => {
    const checkDates = revenueEntries
      .filter(entry => entry.checkDate)
      .map(entry => entry.checkDate!)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    
    return checkDates.length > 0 ? checkDates[0] : null;
  };

  // Memoize the latest check date to avoid recalculation
  const latestCheckDate = useMemo(() => getLatestCheckDate(), [revenueEntries]);

  // Filter check tracking entries based on selected filter (memoized for performance)
  const filteredCheckTrackingEntries = useMemo(() => {
    if (checkTrackingFilter === 'all') {
      return checkTrackingEntries;
    }

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed (August = 7)
    
    const filtered = checkTrackingEntries.filter(entry => {
      // Parse date safely to avoid timezone issues
      const [year, month, day] = entry.processedDate.split('-').map(Number);
      const entryYear = year;
      const entryMonth = month - 1; // Convert to 0-indexed (January = 0)
      
      switch (checkTrackingFilter) {
        case 'this-month':
          return entryMonth === currentMonth && entryYear === currentYear;
        case 'last-month':
          let lastMonth = currentMonth - 1;
          let lastMonthYear = currentYear;
          if (lastMonth < 0) {
            lastMonth = 11; // December
            lastMonthYear = currentYear - 1;
          }
          return entryMonth === lastMonth && entryYear === lastMonthYear;
        case 'custom-date':
          return checkTrackingCustomDate && entry.processedDate === checkTrackingCustomDate;
        default:
          return true;
      }
    });
    
    return filtered;
  }, [checkTrackingEntries, checkTrackingFilter, checkTrackingCustomDate]);

  // Calculate current month total for check tracking
  const currentMonthCheckTotal = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed (August = 7)
    
    return checkTrackingEntries
      .filter(entry => {
        try {
          if (!entry.processedDate || typeof entry.processedDate !== 'string') return false;
          const dateParts = entry.processedDate.split('-');
          if (dateParts.length !== 3) return false;
          
          const [year, month, day] = dateParts.map(Number);
          if (isNaN(year) || isNaN(month) || isNaN(day)) return false;
          
          const entryYear = year;
          const entryMonth = month - 1; // Convert to 0-indexed (January = 0)
          return entryMonth === currentMonth && entryYear === currentYear;
        } catch (error) {
          console.warn('Check tracking date filtering error:', error, 'for entry:', entry);
          return false;
        }
      })
      .reduce((sum, entry) => {
        const amount = parseFloat(entry.checkAmount);
        return isNaN(amount) ? sum : sum + amount;
      }, 0);
  }, [checkTrackingEntries]);

  // Filter dashboard data based on date filter (memoized for performance)
  const { filteredRevenueEntries: dashboardRevenue, filteredExpenses: dashboardExpenses } = useMemo(() => {
    if (dashboardDateFilter === 'all') {
      return { filteredRevenueEntries: revenueEntries, filteredExpenses: expenses };
    }

    const now = new Date();

    const filterByDateRange = (date: string | Date) => {
      try {
        // Parse date safely to avoid timezone issues
        const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0];
        
        // Validate date format and extract components
        if (!dateStr || !dateStr.includes('-')) return false;
        const dateParts = dateStr.split('-');
        if (dateParts.length !== 3) return false;
        
        const [year, month, day] = dateParts.map(Number);
        
        // Validate date components
        if (isNaN(year) || isNaN(month) || isNaN(day)) return false;
        if (month < 1 || month > 12) return false;
        if (day < 1 || day > 31) return false;
        
        const entryYear = year;
        const entryMonth = month - 1; // Convert to 0-indexed (January = 0)
        
        switch (dashboardDateFilter) {
          case 'this-month':
            return entryMonth === now.getMonth() && entryYear === now.getFullYear();
          case 'last-month':
            let lastMonth = now.getMonth() - 1;
            let lastMonthYear = now.getFullYear();
            if (lastMonth < 0) {
              lastMonth = 11; // December
              lastMonthYear = now.getFullYear() - 1;
            }
            return entryMonth === lastMonth && entryYear === lastMonthYear;
          case 'this-quarter':
            const currentQuarter = Math.floor(now.getMonth() / 3);
            const entryQuarter = Math.floor(entryMonth / 3);
            return entryQuarter === currentQuarter && entryYear === now.getFullYear();
          case 'last-check':
            if (!latestCheckDate) return false;
            // This case is handled separately in the filter function below
            return false;
          default:
            return true;
        }
      } catch (error) {
        console.warn('Date filtering error:', error, 'for date:', date);
        return false;
      }
    };

    const filteredRevenueEntries = revenueEntries.filter(entry => {
      if (dashboardDateFilter === 'last-check' && latestCheckDate) {
        return entry.checkDate && entry.checkDate === latestCheckDate;
      }
      return filterByDateRange(entry.date);
    });

    const filteredExpenses = expenses.filter(expense => filterByDateRange(expense.date));

    return { filteredRevenueEntries, filteredExpenses };
  }, [revenueEntries, expenses, dashboardDateFilter, latestCheckDate]);

  // Calculate dashboard metrics using filtered data
  const totalRevenue = dashboardRevenue.reduce((sum, entry) => sum + parseFloat(entry.amount), 0);
  const totalExpenses = dashboardExpenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
  
  // Calculate George's portion (business owner's share) for profit calculation using filtered data
  const georgeStaff = staff.find(s => s.name === "George");
  const georgeRevenue = georgeStaff ? 
    payouts
      .filter(p => {
        if (p.staffId !== georgeStaff.id) return false;
        // Filter by the same date logic as dashboard data
        if (dashboardDateFilter === 'all') return true;
        
        const payoutRevenueEntry = revenueEntries.find(re => re.id === p.revenueEntryId);
        if (!payoutRevenueEntry) return false;
        
        return dashboardRevenue.some(dre => dre.id === payoutRevenueEntry.id);
      })
      .reduce((sum, payout) => sum + parseFloat(payout.amount), 0)
    : 0;
  
  const netProfit = georgeRevenue - totalExpenses;
  const activePatients = patients.filter(p => p.status === 'active').length;
  
  // Calculate total payouts for the current dashboard filter period
  const totalPayouts = useMemo(() => {
    return payouts
      .filter(p => {
        if (dashboardDateFilter === 'all') return true;
        
        const payoutRevenueEntry = revenueEntries.find(re => re.id === p.revenueEntryId);
        if (!payoutRevenueEntry) return false;
        
        return dashboardRevenue.some(dre => dre.id === payoutRevenueEntry.id);
      })
      .reduce((sum, payout) => sum + parseFloat(payout.amount), 0);
  }, [payouts, dashboardRevenue, dashboardDateFilter, revenueEntries]);

  // Get recent revenue entries for the recent activity section
  const recentRevenueEntries = useMemo(() => {
    return dashboardRevenue
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5); // Show only the 5 most recent entries
  }, [dashboardRevenue]);

  // Filter revenue entries based on current filters (memoized for performance)
  const filteredRevenueEntries = useMemo(() => {
    if (!revenueEntries) return [];
    
    return revenueEntries.filter(entry => {
      // Date range filter
      if (revenueFilters.dateRange !== 'all') {
        // Parse date safely to avoid timezone issues
        const dateStr = typeof entry.date === 'string' ? entry.date : entry.date.toISOString().split('T')[0];
        const [year, month, day] = dateStr.split('-').map(Number);
        const entryYear = year;
        const entryMonth = month - 1; // Convert to 0-indexed (January = 0)
        const now = new Date();
        
        switch (revenueFilters.dateRange) {
          case 'this-month':
            if (entryMonth !== now.getMonth() || entryYear !== now.getFullYear()) {
              return false;
            }
            break;
          case 'last-month':
            let lastMonth = now.getMonth() - 1;
            let lastMonthYear = now.getFullYear();
            if (lastMonth < 0) {
              lastMonth = 11; // December
              lastMonthYear = now.getFullYear() - 1;
            }
            if (entryMonth !== lastMonth || entryYear !== lastMonthYear) {
              return false;
            }
            break;
          case 'this-quarter':
            const currentQuarter = Math.floor(now.getMonth() / 3);
            const entryQuarter = Math.floor(entryMonth / 3);
            if (entryQuarter !== currentQuarter || entryYear !== now.getFullYear()) {
              return false;
            }
            break;
        }
      }
      
      // House filter
      if (revenueFilters.houseId !== 'all' && entry.houseId !== revenueFilters.houseId) {
        return false;
      }
      
      // Service code filter
      if (revenueFilters.serviceCodeId !== 'all' && entry.serviceCodeId !== revenueFilters.serviceCodeId) {
        return false;
      }
      
      return true;
    });
  }, [revenueEntries, revenueFilters]);

  // Calculate staff payouts for current month
  const staffPayouts = staff.map(staffMember => {
    const staffPayoutEntries = payouts.filter(p => p.staffId === staffMember.id);
    const totalPayout = staffPayoutEntries.reduce((sum, payout) => sum + parseFloat(payout.amount), 0);
    return {
      staff: staffMember,
      totalPayout,
      payouts: staffPayoutEntries
    };
  });

  // Filtered patients based on search term and filters (memoized for performance)
  const filteredPatients = useMemo(() => {
    return patients.filter(patient => {
      const matchesSearch = patientSearchTerm === "" || 
        patient.name.toLowerCase().includes(patientSearchTerm.toLowerCase()) ||
        patient.id.toLowerCase().includes(patientSearchTerm.toLowerCase()) ||
        (patient.phone && patient.phone.toLowerCase().includes(patientSearchTerm.toLowerCase()));
      
      const matchesHouse = selectedHouseFilter === "all" || patient.houseId === selectedHouseFilter;
      const matchesStatus = selectedStatusFilter === "all" || patient.status === selectedStatusFilter;
      
      return matchesSearch && matchesHouse && matchesStatus;
    });
  }, [patients, patientSearchTerm, selectedHouseFilter, selectedStatusFilter]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const formatDate = (date: string | Date) => {
    // Handle timezone offset to prevent day-behind display
    if (typeof date === 'string') {
      if (!date.includes('T')) {
        // If it's a date-only string, treat it as local date
        return new Date(date + 'T12:00:00').toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric' 
        });
      } else if (date.includes('T00:00:00')) {
        // If it's a datetime string at midnight, extract just the date part to avoid timezone shift
        const datePart = date.split('T')[0];
        return new Date(datePart + 'T12:00:00').toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric' 
        });
      }
    }
    // For other datetime formats, use as-is
    const dateObj = new Date(date);
    return dateObj.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Handle calendar date selection
  const handleCalendarDateSelect = (date: string) => {
    setCalendarSelectedDate(date);
    setSelectedTab("reports");
    setSelectedReportDate(date);
    toast({ 
      title: "Date Selected", 
      description: `Viewing daily revenue report for ${formatDate(date)}` 
    });
  };

  // Daily revenue report generation function
  const generateDailyRevenueReport = (date: string) => {
    if (!dailyReport || dailyReport.revenueEntries.length === 0) {
      toast({ title: "No data to export for selected date", variant: "destructive" });
      return;
    }

    const doc = new jsPDF();
    const reportDate = formatDate(date);
    
    // Header
    doc.setFontSize(20);
    doc.text(`Daily Revenue Report`, 20, 30);
    doc.setFontSize(12);
    doc.text(`Date: ${reportDate}`, 20, 40);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 50);
    
    // Summary
    doc.setFontSize(14);
    doc.text('Revenue Summary', 20, 70);
    doc.setFontSize(10);
    doc.text(`Total Revenue: ${formatCurrency(dailyReport.totals.revenue)}`, 20, 80);
    doc.text(`Number of Entries: ${dailyReport.revenueEntries.length}`, 20, 90);
    
    // Revenue entries table
    const revenueTableData = dailyReport.revenueEntries.map((entry: any) => [
      entry.patientName || 'No Patient',
      entry.houseName,
      entry.serviceCodeName,
      formatCurrency(parseFloat(entry.amount)),
      formatDate(entry.checkDate)
    ]);
    
    autoTable(doc, {
      head: [['Patient', 'House', 'Service', 'Amount', 'Check Date']],
      body: revenueTableData,
      startY: 100,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [79, 70, 229] }
    });
    
    // Staff payouts table if available
    if (dailyReport.payoutsByStaff && dailyReport.payoutsByStaff.length > 0) {
      const finalY = (doc as any).lastAutoTable.finalY || 200;
      
      doc.setFontSize(14);
      doc.text('Staff Payouts', 20, finalY + 20);
      
      const payoutTableData = dailyReport.payoutsByStaff.map((payout: any) => [
        payout.staffName,
        payout.entries.toString(),
        formatCurrency(payout.totalPayout)
      ]);
      
      autoTable(doc, {
        head: [['Staff Member', 'Entries', 'Total Payout']],
        body: payoutTableData,
        startY: finalY + 30,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [34, 197, 94] }
      });
    }
    
    doc.save(`daily-revenue-report-${date}.pdf`);
    toast({ title: "Daily revenue report downloaded successfully" });
  };

  // Dashboard export function
  const exportDashboardReport = () => {
    const doc = new jsPDF();
    const currentDate = new Date().toLocaleDateString();
    
    // Determine report title based on filter
    let reportTitle = 'Dashboard Report';
    let filterDescription = '';
    
    switch (dashboardDateFilter) {
      case 'this-month':
        reportTitle = 'This Month Dashboard Report';
        filterDescription = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
        break;
      case 'last-month':
        const lastMonth = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1);
        reportTitle = 'Last Month Dashboard Report';
        filterDescription = lastMonth.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
        break;
      case 'this-quarter':
        const quarter = Math.floor(new Date().getMonth() / 3) + 1;
        reportTitle = `Q${quarter} ${new Date().getFullYear()} Dashboard Report`;
        filterDescription = `Quarter ${quarter}, ${new Date().getFullYear()}`;
        break;
      case 'last-check':
        reportTitle = 'Last Check Dashboard Report';
        filterDescription = latestCheckDate ? formatDate(latestCheckDate) : 'No check date found';
        break;
      default:
        reportTitle = 'Complete Dashboard Report';
        filterDescription = 'All Time';
    }
    
    // Header
    doc.setFontSize(20);
    doc.text(reportTitle, 20, 30);
    doc.setFontSize(12);
    doc.text(`Generated on: ${currentDate}`, 20, 40);
    doc.text(`Period: ${filterDescription}`, 20, 50);
    
    // Summary metrics
    doc.setFontSize(14);
    doc.text('Financial Summary', 20, 70);
    doc.setFontSize(10);
    doc.text(`Total Revenue: ${formatCurrency(totalRevenue)}`, 20, 80);
    doc.text(`Total Expenses: ${formatCurrency(totalExpenses)}`, 20, 90);
    doc.text(`Net Profit (George's Share): ${formatCurrency(netProfit)}`, 20, 100);
    doc.text(`Active Patients: ${activePatients}`, 20, 110);
    
    // Revenue entries table
    if (dashboardRevenue.length > 0) {
      const revenueTableData = dashboardRevenue.map(entry => {
        const house = houses.find(h => h.id === entry.houseId);
        const service = serviceCodes.find(sc => sc.id === entry.serviceCodeId);
        const patient = patients.find(p => p.id === entry.patientId);
        return [
          formatDate(entry.date),
          entry.checkDate ? formatDate(entry.checkDate) : '-',
          patient?.name || 'Unknown',
          house?.name || 'N/A',
          service?.code || 'N/A',
          formatCurrency(parseFloat(entry.amount)),
          entry.status
        ];
      });
      
      autoTable(doc, {
        head: [['Service Date', 'Check Date', 'Patient', 'House', 'Service', 'Amount', 'Status']],
        body: revenueTableData,
        startY: 130,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [79, 70, 229] }
      });
    }
    
    // Expenses table
    if (dashboardExpenses.length > 0) {
      const finalY = dashboardRevenue.length > 0 ? (doc as any).lastAutoTable.finalY + 20 : 130;
      
      doc.setFontSize(14);
      doc.text('Expenses', 20, finalY);
      
      const expenseTableData = dashboardExpenses.map(expense => [
        formatDate(expense.date),
        expense.vendor || 'N/A',
        expense.category || 'N/A',
        expense.description || '-',
        formatCurrency(parseFloat(expense.amount))
      ]);
      
      autoTable(doc, {
        head: [['Date', 'Vendor', 'Category', 'Description', 'Amount']],
        body: expenseTableData,
        startY: finalY + 10,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [220, 38, 127] }
      });
    }
    
    const fileName = `dashboard-report-${dashboardDateFilter}-${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
    toast({ title: "Dashboard report exported successfully" });
  };

  // Report generation functions
  const generateRevenueReport = (period: 'monthly' | 'quarterly') => {
    const doc = new jsPDF();
    const currentDate = new Date().toLocaleDateString();
    const periodTitle = period === 'monthly' ? 'Monthly' : 'Quarterly';
    
    // Header
    doc.setFontSize(20);
    doc.text(`${periodTitle} Revenue Report`, 20, 30);
    doc.setFontSize(12);
    doc.text(`Generated on: ${currentDate}`, 20, 40);
    
    // Summary
    doc.setFontSize(14);
    doc.text('Revenue Summary', 20, 60);
    doc.setFontSize(10);
    doc.text(`Total Revenue: ${formatCurrency(totalRevenue)}`, 20, 70);
    doc.text(`Total Expenses: ${formatCurrency(totalExpenses)}`, 20, 80);
    doc.text(`Net Profit (George's Share): ${formatCurrency(netProfit)}`, 20, 90);
    
    // Revenue entries table
    const revenueTableData = revenueEntries.map(entry => {
      const house = houses.find(h => h.id === entry.houseId);
      const service = serviceCodes.find(sc => sc.id === entry.serviceCodeId);
      const patient = patients.find(p => p.id === entry.patientId);
      return [
        formatDate(entry.date),
        patient?.name || 'Unknown',
        house?.name || 'N/A',
        service?.code || 'N/A',
        formatCurrency(parseFloat(entry.amount)),
        entry.status
      ];
    });
    
    autoTable(doc, {
      head: [['Service Date', 'Patient', 'House', 'Service', 'Amount', 'Status']],
      body: revenueTableData,
      startY: 100,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [66, 139, 202] }
    });
    
    doc.save(`${periodTitle.toLowerCase()}-revenue-report-${new Date().toISOString().split('T')[0]}.pdf`);
    toast({ title: `${periodTitle} revenue report downloaded successfully` });
  };

  const generatePayoutReport = (type: 'current' | 'historical') => {
    const doc = new jsPDF();
    const currentDate = new Date().toLocaleDateString();
    
    // Get the latest check date for current reports
    const latestCheckDate = type === 'current' ? 
      Array.from(new Set(
        revenueEntries
          .map(entry => entry.checkDate ? new Date(entry.checkDate).toISOString().split('T')[0] : null)
          .filter(Boolean)
      )).sort().reverse()[0] : null;
    
    const reportTitle = type === 'current' ? 
      `Current Staff Payout Report - ${latestCheckDate ? formatDate(latestCheckDate) : 'Latest Check Date'}` : 
      'Historical Payout Report';
    
    // Filter payouts based on type
    const filteredPayouts = type === 'current' && latestCheckDate ?
      payouts.filter(payout => {
        const revenueEntry = revenueEntries.find(entry => entry.id === payout.revenueEntryId);
        return revenueEntry?.checkDate && 
               new Date(revenueEntry.checkDate).toISOString().split('T')[0] === latestCheckDate;
      }) : payouts;
    
    // Calculate staff payouts for filtered data
    const filteredStaffPayouts = staff.map(staffMember => {
      const staffPayoutEntries = filteredPayouts.filter(p => p.staffId === staffMember.id);
      const totalPayout = staffPayoutEntries.reduce((sum, payout) => sum + parseFloat(payout.amount), 0);
      return {
        staff: staffMember,
        totalPayout,
        payouts: staffPayoutEntries
      };
    }).filter(sp => sp.totalPayout > 0);
    
    // Header
    doc.setFontSize(20);
    doc.text(reportTitle, 20, 30);
    doc.setFontSize(12);
    doc.text(`Generated on: ${currentDate}`, 20, 40);
    if (type === 'current' && latestCheckDate) {
      doc.text(`Check Date: ${formatDate(latestCheckDate)}`, 20, 50);
    }
    
    // Staff payout summary
    let yPosition = type === 'current' ? 70 : 60;
    doc.setFontSize(14);
    doc.text('Staff Payout Summary', 20, yPosition);
    yPosition += 20;
    
    filteredStaffPayouts.forEach(({ staff: staffMember, totalPayout }) => {
      doc.setFontSize(10);
      doc.text(`${staffMember.name} (${staffMember.role || 'Staff Member'}): ${formatCurrency(totalPayout)}`, 20, yPosition);
      yPosition += 10;
    });
    
    // Detailed payout table
    const payoutTableData = filteredPayouts.map(payout => {
      const staffMember = staff.find(s => s.id === payout.staffId);
      const revenueEntry = revenueEntries.find(re => re.id === payout.revenueEntryId);
      const house = houses.find(h => h.id === revenueEntry?.houseId);
      const service = serviceCodes.find(sc => sc.id === revenueEntry?.serviceCodeId);
      
      return [
        `${staffMember?.name || 'Unknown'} (${staffMember?.role || 'Staff'})`,
        house?.name || 'N/A',
        service?.code || 'N/A',
        revenueEntry ? formatDate(revenueEntry.date) : 'N/A',
        formatCurrency(parseFloat(payout.amount)),
        revenueEntry ? formatCurrency(parseFloat(revenueEntry.amount)) : 'N/A',
        revenueEntry?.checkDate ? formatDate(revenueEntry.checkDate) : 'N/A'
      ];
    });
    
    autoTable(doc, {
      head: [['Staff', 'House', 'Service', 'Service Date', 'Payout', 'Revenue', 'Check Date']],
      body: payoutTableData,
      startY: yPosition + 10,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [92, 184, 92] }
    });
    
    const filename = type === 'current' && latestCheckDate ?
      `current-payout-report-${latestCheckDate}.pdf` :
      `${type}-payout-report-${new Date().toISOString().split('T')[0]}.pdf`;
    
    doc.save(filename);
    
    const message = type === 'current' && latestCheckDate ?
      `Current payout report for ${formatDate(latestCheckDate)} downloaded successfully` :
      `${type} payout report downloaded successfully`;
    
    toast({ title: message });
  };

  const generateProgramAnalytics = (type: 'performance' | 'comparison') => {
    const doc = new jsPDF();
    const currentDate = new Date().toLocaleDateString();
    const reportTitle = type === 'performance' ? 'Program Performance Analytics' : 'Program Comparison Report';
    
    // Header
    doc.setFontSize(20);
    doc.text(reportTitle, 20, 30);
    doc.setFontSize(12);
    doc.text(`Generated on: ${currentDate}`, 20, 40);
    
    // Program analytics
    const uniquePrograms = Array.from(new Set(patients.map(p => p.program))).filter(Boolean);
    const programStats = uniquePrograms.map(program => {
      const programPatients = patients.filter(p => p.program === program);
      const activeCount = programPatients.filter(p => p.status === 'active').length;
      const programRevenue = revenueEntries
        .filter(entry => {
          const patient = patients.find(p => p.id === entry.patientId);
          return patient?.program === program;
        })
        .reduce((sum, entry) => sum + parseFloat(entry.amount), 0);
      
      return [
        program,
        programPatients.length.toString(),
        activeCount.toString(),
        formatCurrency(programRevenue),
        programPatients.length > 0 ? formatCurrency(programRevenue / programPatients.length) : '$0.00'
      ];
    });
    
    autoTable(doc, {
      head: [['Program', 'Total Patients', 'Active Patients', 'Total Revenue', 'Avg Revenue/Patient']],
      body: programStats,
      startY: 60,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [155, 89, 182] }
    });
    
    doc.save(`${type}-program-analytics-${new Date().toISOString().split('T')[0]}.pdf`);
    toast({ title: `Program analytics report downloaded successfully` });
  };

  const generateAllReports = () => {
    // Generate all reports in sequence
    setTimeout(() => generateRevenueReport('monthly'), 100);
    setTimeout(() => generatePayoutReport('current'), 200);
    setTimeout(() => generateProgramAnalytics('performance'), 300);
    
    toast({ title: "All reports generated and downloaded successfully" });
  };

  // Create a reusable navigation component
  const NavigationItems = ({ mobile = false, onItemClick = () => {} }) => (
    <div className="space-y-1">
      <Button
        variant={selectedTab === "dashboard" ? "default" : "ghost"}
        className={`w-full justify-start nav-item hover-lift transition-all duration-300 ${
          selectedTab === "dashboard" 
            ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg hover:shadow-xl" 
            : "hover:bg-white/20 hover:text-gray-800"
        } ${selectedTab === "dashboard" ? "active" : ""}`}
        onClick={() => {
          setSelectedTab("dashboard");
          onItemClick();
        }}
      >
        <BarChart3 className="mr-3 h-4 w-4" />
        Dashboard
      </Button>
      <Button
        variant={selectedTab === "revenue" ? "default" : "ghost"}
        className={`w-full justify-start nav-item hover-lift transition-all duration-300 ${
          selectedTab === "revenue" 
            ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg hover:shadow-xl" 
            : "hover:bg-white/20 hover:text-gray-800"
        } ${selectedTab === "revenue" ? "active" : ""}`}
        onClick={() => {
          setSelectedTab("revenue");
          onItemClick();
        }}
      >
        <DollarSign className="mr-3 h-4 w-4" />
        Revenue Entry
      </Button>
      <Button
        variant={selectedTab === "payouts" ? "default" : "ghost"}
        className={`w-full justify-start nav-item hover-lift transition-all duration-300 ${
          selectedTab === "payouts" 
            ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg hover:shadow-xl" 
            : "hover:bg-white/20 hover:text-gray-800"
        } ${selectedTab === "payouts" ? "active" : ""}`}
        onClick={() => {
          setSelectedTab("payouts");
          onItemClick();
        }}
      >
        <Users className="mr-3 h-4 w-4" />
        Staff Payouts
      </Button>
      <Button
        variant={selectedTab === "expenses" ? "default" : "ghost"}
        className={`w-full justify-start nav-item hover-lift transition-all duration-300 ${
          selectedTab === "expenses" 
            ? "bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg hover:shadow-xl" 
            : "hover:bg-white/20 hover:text-gray-800"
        } ${selectedTab === "expenses" ? "active" : ""}`}
        onClick={() => {
          setSelectedTab("expenses");
          onItemClick();
        }}
      >
        <Receipt className="mr-3 h-4 w-4" />
        Expenses
      </Button>
      <Button
        variant={selectedTab === "patients" ? "default" : "ghost"}
        className={`w-full justify-start nav-item hover-lift transition-all duration-300 ${
          selectedTab === "patients" 
            ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg hover:shadow-xl" 
            : "hover:bg-white/20 hover:text-gray-800"
        } ${selectedTab === "patients" ? "active" : ""}`}
        onClick={() => {
          setSelectedTab("patients");
          onItemClick();
        }}
      >
        <UserCheck className="mr-3 h-4 w-4" />
        Patients
      </Button>
      <Button
        variant={selectedTab === "reports" ? "default" : "ghost"}
        className={`w-full justify-start nav-item hover-lift transition-all duration-300 ${
          selectedTab === "reports" 
            ? "bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg hover:shadow-xl" 
            : "hover:bg-white/20 hover:text-gray-800"
        } ${selectedTab === "reports" ? "active" : ""}`}
        onClick={() => {
          setSelectedTab("reports");
          onItemClick();
        }}
      >
        <FileText className="mr-3 h-4 w-4" />
        Reports
      </Button>
      <Button
        variant={selectedTab === "check-dates" ? "default" : "ghost"}
        className={`w-full justify-start nav-item hover-lift transition-all duration-300 ${
          selectedTab === "check-dates" 
            ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg hover:shadow-xl" 
            : "hover:bg-white/20 hover:text-gray-800"
        } ${selectedTab === "check-dates" ? "active" : ""}`}
        onClick={() => {
          setSelectedTab("check-dates");
          onItemClick();
        }}
      >
        <Calendar className="mr-3 h-4 w-4" />
        Check Tracking
      </Button>
      <Button
        variant={selectedTab === "settings" ? "default" : "ghost"}
        className={`w-full justify-start nav-item hover-lift transition-all duration-300 ${
          selectedTab === "settings" 
            ? "bg-gradient-to-r from-gray-600 to-slate-700 text-white shadow-lg hover:shadow-xl" 
            : "hover:bg-white/20 hover:text-gray-800"
        } ${selectedTab === "settings" ? "active" : ""}`}
        onClick={() => {
          setSelectedTab("settings");
          onItemClick();
        }}
      >
        <Settings className="mr-3 h-4 w-4" />
        Settings
      </Button>
    </div>
  );

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 animate-fade-in">
      {/* Onboarding Walkthrough */}
      {showOnboarding && (
        <OnboardingWalkthrough onComplete={completeOnboarding} />
      )}

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white shadow-sm border-b">
        <div className="flex items-center justify-between p-4">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setIsMobileMenuOpen(true)}
            className="mr-2"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-bold text-gray-900 truncate">Support Recovery LLC</h1>
          <Button
            onClick={handleLogout}
            variant="ghost"
            size="sm"
            className="text-gray-600 hover:text-gray-900"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Mobile Navigation Overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black bg-opacity-50" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="fixed left-0 top-0 h-full w-80 max-w-[85vw] bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="p-4">
              <div className="mb-4">
                <p className="text-sm text-gray-600">Welcome, {(user as any)?.firstName || (user as any)?.email || 'User'}</p>
                <p className="text-xs text-gray-500">Addition Treatment, Behavioral & Mental Health Services</p>
              </div>
              <NavigationItems mobile={true} onItemClick={() => setIsMobileMenuOpen(false)} />
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 glass-sidebar flex-col shadow-xl">
        <div className="p-4 gradient-header relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-lg font-bold text-white">Support Recovery LLC</h1>
              <div className="flex items-center space-x-2">
                {hasCompletedOnboarding && (
                  <Button
                    onClick={startOnboarding}
                    variant="ghost"
                    size="sm"
                    className="p-1 text-white/80 hover:text-white hover:bg-white/10"
                    title="Take Interactive Tour"
                  >
                    <HelpCircle className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  onClick={handleLogout}
                  variant="ghost"
                  size="sm"
                  className="p-1 text-white/80 hover:text-white hover:bg-white/10"
                  title="Logout"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <p className="text-sm text-white/90">Addition Treatment, Behavioral & Mental Health Services</p>
            {user && (
              <p className="text-xs mt-1 text-white/75">
                Welcome, {(user as any).firstName || (user as any).email || 'User'}
              </p>
            )}
          </div>
        </div>
        
        <nav className="flex-1 p-4">
          <NavigationItems />
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto lg:ml-0 pt-16 lg:pt-0">
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="m-0">
            <header className="bg-white border-b-4 border-blue-500 relative overflow-hidden shadow-lg">
              <div className="relative z-10 px-4 lg:px-6 py-4 lg:py-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="animate-slide-up">
                    <h2 className="text-2xl lg:text-3xl font-bold" style={{color: '#000000'}}>Dashboard Overview</h2>
                    <p className="text-sm lg:text-lg" style={{color: '#333333'}}>
                      {dashboardDateFilter === 'last-check' && latestCheckDate 
                        ? `Last Check Date: ${formatDate(latestCheckDate)}` 
                        : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
                      }
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto animate-bounce-subtle">
                    <Select 
                      value={dashboardDateFilter} 
                      onValueChange={setDashboardDateFilter}
                    >
                      <SelectTrigger className="w-full sm:w-48 bg-white border-gray-300" style={{color: '#000000'}}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Time</SelectItem>
                        <SelectItem value="this-month">This Month</SelectItem>
                        <SelectItem value="last-month">Last Month</SelectItem>
                        <SelectItem value="this-quarter">This Quarter</SelectItem>
                        <SelectItem value="last-check">Last Check</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button 
                      className="bg-blue-600 hover:bg-blue-700 text-white hover-lift w-full sm:w-auto"
                      onClick={exportDashboardReport}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Export Report
                    </Button>
                  </div>
                </div>
              </div>
            </header>

            <div className="p-4 lg:p-6 bg-gradient-to-br from-transparent via-slate-50/30 to-transparent">
              {/* Interactive Calendar Section */}
              <div className="mb-6 lg:mb-8 animate-slide-up">
                <div className="flex justify-center">
                  <InteractiveCalendar 
                    revenueEntries={revenueEntries}
                    onDateSelect={handleCalendarDateSelect}
                    selectedDate={calendarSelectedDate}
                  />
                </div>
              </div>

              {/* Key Metrics Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 lg:gap-6 mb-6 lg:mb-8 animate-slide-up">
                <Card className="stat-card hover-lift border-0 shadow-xl">
                  <CardContent className="p-4 lg:p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs lg:text-sm font-medium text-gray-600 mb-2">Total Revenue</p>
                        <p className="text-xl lg:text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">{formatCurrency(totalRevenue)}</p>
                        <p className="text-xs lg:text-sm text-green-600 mt-2 flex items-center">
                          <TrendingUp className="mr-1 h-3 w-3" />
                          12% vs last month
                        </p>
                      </div>
                      <div className="p-3 lg:p-4 gradient-success rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300">
                        <DollarSign className="h-6 lg:h-8 w-6 lg:w-8 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="stat-card hover-lift border-0 shadow-xl">
                  <CardContent className="p-4 lg:p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs lg:text-sm font-medium text-gray-600 mb-2">Total Expenses</p>
                        <p className="text-xl lg:text-3xl font-bold bg-gradient-to-r from-red-500 to-pink-500 bg-clip-text text-transparent">{formatCurrency(totalExpenses)}</p>
                        <p className="text-xs lg:text-sm text-red-600 mt-2 flex items-center">
                          <TrendingUp className="mr-1 h-3 w-3" />
                          3% vs last month
                        </p>
                      </div>
                      <div className="p-3 lg:p-4 gradient-danger rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300">
                        <Receipt className="h-6 lg:h-8 w-6 lg:w-8 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="stat-card hover-lift border-0 shadow-xl">
                  <CardContent className="p-4 lg:p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs lg:text-sm font-medium text-gray-600 mb-2">Net Profit</p>
                        <p className="text-xl lg:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{formatCurrency(totalRevenue - totalExpenses)}</p>
                        <p className="text-xs lg:text-sm text-blue-600 mt-2 flex items-center">
                          <TrendingUp className="mr-1 h-3 w-3" />
                          25% margin
                        </p>
                      </div>
                      <div className="p-3 lg:p-4 gradient-primary rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300">
                        <TrendingUp className="h-6 lg:h-8 w-6 lg:w-8 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="stat-card hover-lift border-0 shadow-xl">
                  <CardContent className="p-4 lg:p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs lg:text-sm font-medium text-gray-600 mb-2">Active Patients</p>
                        <p className="text-xl lg:text-3xl font-bold bg-gradient-to-r from-cyan-500 to-blue-500 bg-clip-text text-transparent">{activePatients}</p>
                        <p className="text-xs lg:text-sm text-cyan-600 mt-2 flex items-center">
                          <TrendingUp className="mr-1 h-3 w-3" />
                          2 new this month
                        </p>
                      </div>
                      <div className="p-3 lg:p-4 gradient-info rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300">
                        <UserCheck className="h-6 lg:h-8 w-6 lg:w-8 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="stat-card hover-lift border-0 shadow-xl">
                  <CardContent className="p-4 lg:p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs lg:text-sm font-medium text-gray-600 mb-2">Total Payouts</p>
                        <p className="text-xl lg:text-3xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">{formatCurrency(totalPayouts)}</p>
                        <p className="text-xs lg:text-sm text-orange-600 mt-2 flex items-center">
                          <TrendingUp className="mr-1 h-3 w-3" />
                          15% to staff
                        </p>
                      </div>
                      <div className="p-3 lg:p-4 gradient-warning rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300">
                        <Users className="h-6 lg:h-8 w-6 lg:w-8 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Revenue Chart */}
              <div className="mb-6 lg:mb-8 animate-slide-up">
                <Card className="border-0 shadow-xl">
                  <CardHeader>
                    <CardTitle className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      Revenue Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 lg:p-6">
                    <div className="h-64 lg:h-80">
                      <RevenueChart 
                        data={revenueEntries} 
                        height={300}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Revenue Entries */}
              <div className="animate-slide-up">
                <Card className="border-0 shadow-xl">
                  <CardHeader>
                    <CardTitle className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                      Recent Revenue Entries
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 lg:p-6">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-xs lg:text-sm">Date</TableHead>
                            <TableHead className="text-xs lg:text-sm">Patient</TableHead>
                            <TableHead className="text-xs lg:text-sm">Service</TableHead>
                            <TableHead className="text-xs lg:text-sm">Staff</TableHead>
                            <TableHead className="text-xs lg:text-sm text-right">Amount</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {recentRevenueEntries.map((entry, index) => {
                            const patient = patients.find(p => p.id === entry.patientId);
                            const serviceCode = serviceCodes.find(s => s.id === entry.serviceCodeId);
                            const staffMember = staff.find(s => s.id === entry.staffId);
                            
                            return (
                              <TableRow key={index} className="hover:bg-gray-50">
                                <TableCell className="text-xs lg:text-sm">{formatDate(entry.date)}</TableCell>
                                <TableCell className="text-xs lg:text-sm font-medium">{patient?.name || 'Unknown'}</TableCell>
                                <TableCell className="text-xs lg:text-sm">
                                  <Badge variant="outline" className="text-xs">
                                    {serviceCode?.code || 'N/A'}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-xs lg:text-sm">{staffMember?.name || 'Unknown'}</TableCell>
                                <TableCell className="text-xs lg:text-sm text-right font-semibold text-green-600">
                                  {formatCurrency(parseFloat(entry.amount))}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Other tabs - temporarily simplified for mobile implementation */}
          <TabsContent value="revenue" className="m-0">
            <div className="p-4 lg:p-6">
              <h2 className="text-xl lg:text-2xl font-bold mb-4">Revenue Entry</h2>
              <p>Revenue entry functionality will be available here.</p>
            </div>
          </TabsContent>
          
          <TabsContent value="payouts" className="m-0">
            <div className="p-4 lg:p-6">
              <h2 className="text-xl lg:text-2xl font-bold mb-4">Staff Payouts</h2>
              <p>Staff payout functionality will be available here.</p>
            </div>
          </TabsContent>
          
          <TabsContent value="expenses" className="m-0">
            <div className="p-4 lg:p-6">
              <h2 className="text-xl lg:text-2xl font-bold mb-4">Expenses</h2>
              <p>Expense management functionality will be available here.</p>
            </div>
          </TabsContent>
          
          <TabsContent value="patients" className="m-0">
            <div className="p-4 lg:p-6">
              <h2 className="text-xl lg:text-2xl font-bold mb-4">Patients</h2>
              <p>Patient management functionality will be available here.</p>
            </div>
          </TabsContent>
          
          <TabsContent value="reports" className="m-0">
            <div className="p-4 lg:p-6">
              <h2 className="text-xl lg:text-2xl font-bold mb-4">Reports</h2>
              <p>Report generation functionality will be available here.</p>
            </div>
          </TabsContent>
          
          <TabsContent value="check-dates" className="m-0">
            <div className="p-4 lg:p-6">
              <h2 className="text-xl lg:text-2xl font-bold mb-4">Check Tracking</h2>
              <p>Check tracking functionality will be available here.</p>
            </div>
          </TabsContent>
          
          <TabsContent value="settings" className="m-0">
            <div className="p-4 lg:p-6">
              <h2 className="text-xl lg:text-2xl font-bold mb-4">Settings</h2>
              <p>Settings functionality will be available here.</p>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
