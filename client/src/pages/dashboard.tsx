import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  DollarSign, Users, TrendingUp, Receipt, Download, Plus, 
  Search, Edit, Trash2, FileText, BarChart3, PieChart, 
  Settings, Home, UserCheck, Calculator
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
import type { 
  House, ServiceCode, Staff, Patient, RevenueEntry, Expense, PayoutRate, Payout 
} from "@shared/schema";

export default function Dashboard() {
  const [selectedTab, setSelectedTab] = useState("dashboard");
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
  const [selectedReportDate, setSelectedReportDate] = useState(new Date().toISOString().split('T')[0]);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  // Calculate dashboard metrics
  const totalRevenue = revenueEntries.reduce((sum, entry) => sum + parseFloat(entry.amount), 0);
  const totalExpenses = expenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
  
  // Calculate George's portion (business owner's share) for profit calculation
  const georgeStaff = staff.find(s => s.name === "George");
  const georgeRevenue = georgeStaff ? 
    payouts
      .filter(p => p.staffId === georgeStaff.id)
      .reduce((sum, payout) => sum + parseFloat(payout.amount), 0)
    : 0;
  
  const netProfit = georgeRevenue - totalExpenses;
  const activePatients = patients.filter(p => p.status === 'active').length;

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
    const revenueTableData = dailyReport.revenueEntries.map(entry => [
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
      
      const payoutTableData = dailyReport.payoutsByStaff.map(payout => [
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
    const reportTitle = type === 'current' ? 'Current Staff Payout Report' : 'Historical Payout Report';
    
    // Header
    doc.setFontSize(20);
    doc.text(reportTitle, 20, 30);
    doc.setFontSize(12);
    doc.text(`Generated on: ${currentDate}`, 20, 40);
    
    // Staff payout summary
    let yPosition = 60;
    doc.setFontSize(14);
    doc.text('Staff Payout Summary', 20, yPosition);
    yPosition += 20;
    
    staffPayouts.forEach(({ staff: staffMember, totalPayout }) => {
      doc.setFontSize(10);
      doc.text(`${staffMember.name}: ${formatCurrency(totalPayout)}`, 20, yPosition);
      yPosition += 10;
    });
    
    // Detailed payout table
    const payoutTableData = payouts.map(payout => {
      const staffMember = staff.find(s => s.id === payout.staffId);
      const revenueEntry = revenueEntries.find(re => re.id === payout.revenueEntryId);
      const house = houses.find(h => h.id === revenueEntry?.houseId);
      const service = serviceCodes.find(sc => sc.id === revenueEntry?.serviceCodeId);
      
      return [
        staffMember?.name || 'Unknown',
        house?.name || 'N/A',
        service?.code || 'N/A',
        revenueEntry ? formatDate(revenueEntry.date) : 'N/A',
        formatCurrency(parseFloat(payout.amount)),
        revenueEntry ? formatCurrency(parseFloat(revenueEntry.amount)) : 'N/A'
      ];
    });
    
    autoTable(doc, {
      head: [['Staff', 'House', 'Service', 'Date', 'Payout', 'Revenue']],
      body: payoutTableData,
      startY: yPosition + 10,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [92, 184, 92] }
    });
    
    doc.save(`${type}-payout-report-${new Date().toISOString().split('T')[0]}.pdf`);
    toast({ title: `${type} payout report downloaded successfully` });
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

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">Support Recovery LLC</h1>
          <p className="text-sm text-gray-500">Addition Treatment, Behavioral & Mental Health Services</p>
        </div>
        
        <nav className="flex-1 p-4">
          <div className="space-y-2">
            <Button
              variant={selectedTab === "dashboard" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setSelectedTab("dashboard")}
            >
              <BarChart3 className="mr-3 h-4 w-4" />
              Dashboard
            </Button>
            <Button
              variant={selectedTab === "revenue" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setSelectedTab("revenue")}
            >
              <DollarSign className="mr-3 h-4 w-4" />
              Revenue Entry
            </Button>
            <Button
              variant={selectedTab === "payouts" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setSelectedTab("payouts")}
            >
              <Users className="mr-3 h-4 w-4" />
              Staff Payouts
            </Button>
            <Button
              variant={selectedTab === "expenses" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setSelectedTab("expenses")}
            >
              <Receipt className="mr-3 h-4 w-4" />
              Expenses
            </Button>
            <Button
              variant={selectedTab === "patients" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setSelectedTab("patients")}
            >
              <UserCheck className="mr-3 h-4 w-4" />
              Patients
            </Button>
            <Button
              variant={selectedTab === "reports" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setSelectedTab("reports")}
            >
              <FileText className="mr-3 h-4 w-4" />
              Reports
            </Button>
            <Button
              variant={selectedTab === "settings" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setSelectedTab("settings")}
            >
              <Settings className="mr-3 h-4 w-4" />
              Settings
            </Button>
          </div>
        </nav>
      </aside>
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="m-0">
            <header className="bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
                  <p className="text-gray-600">{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}</p>
                </div>
                <div className="flex items-center space-x-3">
                  <Select defaultValue="this-month">
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="this-month">This Month</SelectItem>
                      <SelectItem value="last-month">Last Month</SelectItem>
                      <SelectItem value="this-quarter">This Quarter</SelectItem>
                      <SelectItem value="this-year">This Year</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button>
                    <Download className="mr-2 h-4 w-4" />
                    Export Report
                  </Button>
                </div>
              </div>
            </header>

            <div className="p-6">
              {/* Key Metrics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-8">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                        <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalRevenue)}</p>
                        <p className="text-sm text-green-600 mt-1">
                          <TrendingUp className="inline mr-1 h-3 w-3" />
                          12% vs last month
                        </p>
                      </div>
                      <div className="p-3 bg-green-100 rounded-full">
                        <DollarSign className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Expenses</p>
                        <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalExpenses)}</p>
                        <p className="text-sm text-red-600 mt-1">
                          <TrendingUp className="inline mr-1 h-3 w-3" />
                          3% vs last month
                        </p>
                      </div>
                      <div className="p-3 bg-red-100 rounded-full">
                        <Receipt className="h-6 w-6 text-red-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Your Revenue Share</p>
                        <p className="text-2xl font-bold text-gray-900">{formatCurrency(georgeRevenue)}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          George's portion from payouts
                        </p>
                      </div>
                      <div className="p-3 bg-purple-100 rounded-full">
                        <UserCheck className="h-6 w-6 text-purple-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Net Profit</p>
                        <p className="text-2xl font-bold text-gray-900">{formatCurrency(netProfit)}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Your revenue - Total expenses
                        </p>
                      </div>
                      <div className="p-3 bg-blue-100 rounded-full">
                        <BarChart3 className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Active Patients</p>
                        <p className="text-2xl font-bold text-gray-900">{activePatients}</p>
                        <p className="text-sm text-green-600 mt-1">
                          <TrendingUp className="inline mr-1 h-3 w-3" />
                          8 new this month
                        </p>
                      </div>
                      <div className="p-3 bg-purple-100 rounded-full">
                        <Users className="h-6 w-6 text-purple-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Payouts Row */}
              <div className="grid grid-cols-1 gap-6 mb-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Staff Payouts by Check Date</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {staffPayouts.map(({ staff: staffMember, totalPayout, payouts: staffPayoutEntries }) => (
                        <div key={staffMember.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center">
                              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                                <Users className="h-5 w-5 text-blue-600" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-900">{staffMember.name}</h4>
                                <p className="text-sm text-gray-500">Staff Member</p>
                              </div>
                            </div>
                            <span className="text-lg font-bold text-gray-900">{formatCurrency(totalPayout)}</span>
                          </div>
                          
                          <div className="space-y-3">
                            <div className="text-sm">
                              <div className="flex justify-between items-center mb-2">
                                <span className="font-medium text-gray-700">Check Date Breakdown:</span>
                              </div>
                              {Array.from(new Set(
                                staffPayoutEntries.map(payout => {
                                  const revenueEntry = revenueEntries.find(entry => entry.id === payout.revenueEntryId);
                                  return revenueEntry?.checkDate ? new Date(revenueEntry.checkDate).toISOString().split('T')[0] : null;
                                }).filter(Boolean)
                              )).sort().map(checkDate => {
                                const checkDatePayouts = staffPayoutEntries.filter(payout => {
                                  const revenueEntry = revenueEntries.find(entry => entry.id === payout.revenueEntryId);
                                  return revenueEntry?.checkDate && new Date(revenueEntry.checkDate).toISOString().split('T')[0] === checkDate;
                                });
                                const checkDateTotal = checkDatePayouts.reduce((sum, payout) => sum + parseFloat(payout.amount), 0);
                                
                                if (checkDateTotal === 0) return null;
                                
                                return (
                                  <div key={checkDate} className="flex justify-between py-1">
                                    <span className="text-gray-600">{formatDate(checkDate!)}:</span>
                                    <span className="font-medium">{formatCurrency(checkDateTotal)}</span>
                                  </div>
                                );
                              })}
                            </div>
                            
                            {staffPayoutEntries.length > 0 && (
                              <div className="pt-3 border-t border-gray-200">
                                <p className="text-xs text-gray-500">{staffPayoutEntries.length} payout entries</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      
                      {staffPayouts.length === 0 && (
                        <div className="col-span-full text-center py-12 text-gray-500">
                          <Users className="h-16 w-16 mx-auto mb-4 opacity-50" />
                          <p className="text-lg font-medium">No payouts calculated yet</p>
                          <p className="text-sm">Add revenue entries to generate staff payouts</p>
                        </div>
                      )}
                    </div>

                    <div className="mt-6 pt-4 border-t border-gray-200">
                      <Button 
                        className="w-full"
                        onClick={() => setSelectedTab("payouts")}
                      >
                        View Complete Payout Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity */}
              <div className="grid grid-cols-1 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Transactions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {revenueEntries.slice(0, 8).map((entry) => {
                        const house = houses.find(h => h.id === entry.houseId);
                        const serviceCode = serviceCodes.find(sc => sc.id === entry.serviceCodeId);
                        const patient = patients.find(p => p.id === entry.patientId);
                        
                        return (
                          <div key={entry.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                                <Plus className="h-4 w-4 text-green-600" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">
                                  {serviceCode?.description} - {house?.name}
                                </p>
                                <p className="text-sm text-gray-500">
                                  Patient: {patient?.name || 'Unknown'}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-gray-900">{formatCurrency(parseFloat(entry.amount))}</p>
                              <p className="text-sm text-gray-500">
                                Service: {formatDate(entry.date)}
                                {entry.checkDate && (
                                  <span className="ml-2">• Check: {formatDate(entry.checkDate)}</span>
                                )}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                      {revenueEntries.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          <Plus className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p>No revenue entries yet</p>
                          <p className="text-sm">Add your first revenue entry to get started</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Revenue Tab */}
          <TabsContent value="revenue" className="m-0">
            <header className="bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Revenue Entry</h2>
                  <p className="text-gray-600">Add new service entries and track revenue</p>
                </div>
                <Button onClick={() => {
                  setEditingRevenueEntry(undefined);
                  setRevenueModalOpen(true);
                }}>
                  <Plus className="mr-2 h-4 w-4" />
                  New Entry
                </Button>
              </div>
            </header>

            <div className="p-6">
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Filter Revenue Entries</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Date Range" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="this-month">This Month</SelectItem>
                        <SelectItem value="last-month">Last Month</SelectItem>
                        <SelectItem value="this-quarter">This Quarter</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="All Houses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Houses</SelectItem>
                        {houses.map(house => (
                          <SelectItem key={house.id} value={house.id}>{house.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="All Services" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Services</SelectItem>
                        {serviceCodes.map(service => (
                          <SelectItem key={service.id} value={service.id}>{service.code}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Button variant="secondary">
                      <Search className="mr-2 h-4 w-4" />
                      Filter
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Revenue Entries</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Service Date</TableHead>
                        <TableHead>Check Date</TableHead>
                        <TableHead>Patient</TableHead>
                        <TableHead>House</TableHead>
                        <TableHead>Service</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {revenueEntries.map((entry) => {
                        const house = houses.find(h => h.id === entry.houseId);
                        const serviceCode = serviceCodes.find(sc => sc.id === entry.serviceCodeId);
                        const patient = patients.find(p => p.id === entry.patientId);
                        
                        return (
                          <TableRow key={entry.id}>
                            <TableCell>{formatDate(entry.date)}</TableCell>
                            <TableCell>{entry.checkDate ? formatDate(entry.checkDate) : '-'}</TableCell>
                            <TableCell>{patient?.name || 'Unknown'}</TableCell>
                            <TableCell>{house?.name}</TableCell>
                            <TableCell>{serviceCode?.code}</TableCell>
                            <TableCell className="font-medium">{formatCurrency(parseFloat(entry.amount))}</TableCell>
                            <TableCell>
                              <Badge variant={entry.status === 'paid' ? 'default' : 'secondary'}>
                                {entry.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => {
                                    setEditingRevenueEntry(entry);
                                    setRevenueModalOpen(true);
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => deleteRevenueMutation.mutate(entry.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Payouts Tab */}
          <TabsContent value="payouts" className="m-0">
            <header className="bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Staff Payouts</h2>
                  <p className="text-gray-600">Manage payout calculations and distributions</p>
                </div>
                <div className="flex space-x-3">
                  <Button variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Export Payouts
                  </Button>
                  <Button onClick={() => setPayoutRatesModalOpen(true)}>
                    <Calculator className="mr-2 h-4 w-4" />
                    Manage Rates
                  </Button>
                </div>
              </div>
            </header>

            <div className="p-6">
              <Card className="mb-6">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Payout Rate Configuration</CardTitle>
                  <Button variant="outline" size="sm" onClick={() => setPayoutRatesModalOpen(true)}>
                    <Edit className="mr-1 h-4 w-4" />
                    Edit Rates
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>House</TableHead>
                          <TableHead>Service Code</TableHead>
                          <TableHead className="text-center">Dr. Kelsey</TableHead>
                          <TableHead className="text-center">Bardstown</TableHead>
                          <TableHead className="text-center">George</TableHead>
                          <TableHead className="text-center">Maria</TableHead>
                          <TableHead className="text-center">Shelton</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {houses.map(house =>
                          serviceCodes.map(service => {
                            const houseRates = payoutRates.filter(
                              rate => rate.houseId === house.id && rate.serviceCodeId === service.id
                            );
                            
                            if (houseRates.length === 0) return null;
                            
                            return (
                              <TableRow key={`${house.id}-${service.id}`}>
                                <TableCell className="font-medium">{house.name}</TableCell>
                                <TableCell>{service.code}</TableCell>
                                {staff.map(staffMember => {
                                  const rate = houseRates.find(r => r.staffId === staffMember.id);
                                  return (
                                    <TableCell key={staffMember.id} className="text-center">
                                      {rate ? `${parseFloat(rate.percentage).toFixed(2)}%` : '0.00%'}
                                    </TableCell>
                                  );
                                })}
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long' })} Payout Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {staffPayouts.map(({ staff: staffMember, totalPayout, payouts: staffPayoutEntries }) => (
                      <div key={staffMember.id} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-gray-900">{staffMember.name}</h4>
                          <span className="text-lg font-bold text-gray-900">{formatCurrency(totalPayout)}</span>
                        </div>
                        <div className="space-y-2 text-sm">
                          {houses.map(house => {
                            const housePayouts = staffPayoutEntries.filter(payout => {
                              const revenueEntry = revenueEntries.find(entry => entry.id === payout.revenueEntryId);
                              return revenueEntry?.houseId === house.id;
                            });
                            const houseTotal = housePayouts.reduce((sum, payout) => sum + parseFloat(payout.amount), 0);
                            
                            if (houseTotal === 0) return null;
                            
                            return (
                              <div key={house.id} className="flex justify-between">
                                <span className="text-gray-600">{house.name}:</span>
                                <span className="font-medium">{formatCurrency(houseTotal)}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Expenses Tab */}
          <TabsContent value="expenses" className="m-0">
            <header className="bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Expense Tracking</h2>
                  <p className="text-gray-600">Manage business expenses and operational costs</p>
                </div>
                <Button onClick={() => {
                  setEditingExpense(undefined);
                  setExpenseModalOpen(true);
                }}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Expense
                </Button>
              </div>
            </header>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="p-3 bg-red-100 rounded-full mr-4">
                        <Receipt className="h-6 w-6 text-red-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">This Month</p>
                        <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalExpenses)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="p-3 bg-orange-100 rounded-full mr-4">
                        <Home className="h-6 w-6 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Facility Costs</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {formatCurrency(expenses.filter(e => e.category === 'Facility').reduce((sum, e) => sum + parseFloat(e.amount), 0))}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="p-3 bg-blue-100 rounded-full mr-4">
                        <Users className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Staffing</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {formatCurrency(expenses.filter(e => e.category === 'Staffing').reduce((sum, e) => sum + parseFloat(e.amount), 0))}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="p-3 bg-green-100 rounded-full mr-4">
                        <PieChart className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Other</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {formatCurrency(expenses.filter(e => !['Facility', 'Staffing'].includes(e.category)).reduce((sum, e) => sum + parseFloat(e.amount), 0))}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Expense Entries</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Vendor</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {expenses.map((expense) => (
                        <TableRow key={expense.id}>
                          <TableCell>{formatDate(expense.date)}</TableCell>
                          <TableCell>{expense.vendor}</TableCell>
                          <TableCell>{expense.category}</TableCell>
                          <TableCell>{expense.description}</TableCell>
                          <TableCell className="font-medium">{formatCurrency(parseFloat(expense.amount))}</TableCell>
                          <TableCell>
                            <Badge variant={expense.status === 'paid' ? 'default' : 'secondary'}>
                              {expense.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => {
                                  setEditingExpense(expense);
                                  setExpenseModalOpen(true);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => deleteExpenseMutation.mutate(expense.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Patients Tab */}
          <TabsContent value="patients" className="m-0">
            <header className="bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Patient Management</h2>
                  <p className="text-gray-600">Manage patient profiles and program assignments</p>
                </div>
                <Button onClick={() => {
                  setEditingPatient(undefined);
                  setPatientModalOpen(true);
                }}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Patient
                </Button>
              </div>
            </header>

            <div className="p-6">
              <Card className="mb-6">
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input placeholder="Search by name, ID, or phone..." className="pl-10" />
                      </div>
                    </div>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="All Houses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Houses</SelectItem>
                        {houses.map(house => (
                          <SelectItem key={house.id} value={house.id}>{house.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="All Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="graduated">Graduated</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Patient Directory</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Patient</TableHead>
                        <TableHead>House</TableHead>
                        <TableHead>Program</TableHead>
                        <TableHead>Start Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {patients.map((patient) => {
                        const house = houses.find(h => h.id === patient.houseId);
                        
                        return (
                          <TableRow key={patient.id}>
                            <TableCell>
                              <div className="flex items-center">
                                <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center mr-3">
                                  <UserCheck className="h-5 w-5 text-gray-600" />
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900">{patient.name}</p>
                                  <p className="text-sm text-gray-500">{patient.phone}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{house?.name}</TableCell>
                            <TableCell>{patient.program}</TableCell>
                            <TableCell>{patient.startDate ? formatDate(patient.startDate) : 'N/A'}</TableCell>
                            <TableCell>
                              <Badge variant={patient.status === 'active' ? 'default' : 'secondary'}>
                                {patient.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => {
                                    setEditingPatient(patient);
                                    setPatientModalOpen(true);
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => {
                                    setEditingPatient(patient);
                                    setPatientModalOpen(true);
                                  }}
                                >
                                  View
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="m-0">
            <header className="bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Reports & Analytics</h2>
                  <p className="text-gray-600">Generate comprehensive reports and analyze trends</p>
                </div>
                <Button onClick={generateAllReports}>
                  <Download className="mr-2 h-4 w-4" />
                  Export All Reports
                </Button>
              </div>
            </header>

            <div className="p-6">
              {/* Daily Revenue Report Section */}
              <Card className="mb-6">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Daily Revenue Report</CardTitle>
                    <p className="text-sm text-gray-600">View revenue entries for a specific date</p>
                  </div>
                  {dailyReport && dailyReport.revenueEntries.length > 0 && (
                    <Button onClick={() => generateDailyRevenueReport(selectedReportDate)}>
                      <Download className="mr-2 h-4 w-4" />
                      Download PDF
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="flex items-center space-x-2">
                      <label htmlFor="report-date" className="text-sm font-medium text-gray-700">Select Date:</label>
                      <Input
                        id="report-date"
                        type="date"
                        value={selectedReportDate}
                        onChange={(e) => setSelectedReportDate(e.target.value)}
                        className="w-40"
                      />
                    </div>
                    {isDailyReportLoading && (
                      <div className="text-sm text-gray-500">Loading report...</div>
                    )}
                  </div>

                  {dailyReport && (
                    <div className="space-y-6">
                      {/* Revenue Summary Card */}
                      <Card>
                        <CardContent className="p-6">
                          <div className="flex items-center">
                            <DollarSign className="h-12 w-12 text-green-600 mr-4" />
                            <div>
                              <p className="text-sm font-medium text-gray-600">Total Revenue for {formatDate(selectedReportDate)}</p>
                              <p className="text-3xl font-bold text-gray-900">{formatCurrency(dailyReport.totals.revenue)}</p>
                              <p className="text-sm text-gray-600 mt-1">{dailyReport.revenueEntries.length} revenue entries</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Revenue Entries */}
                      {dailyReport.revenueEntries.length > 0 ? (
                        <Card>
                          <CardHeader>
                            <CardTitle>Revenue Entries ({dailyReport.revenueEntries.length})</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Patient</TableHead>
                                  <TableHead>House</TableHead>
                                  <TableHead>Service</TableHead>
                                  <TableHead>Amount</TableHead>
                                  <TableHead>Check Date</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {dailyReport.revenueEntries.map((entry) => (
                                  <TableRow key={entry.id}>
                                    <TableCell>{entry.patientName || 'No Patient'}</TableCell>
                                    <TableCell>{entry.houseName}</TableCell>
                                    <TableCell>{entry.serviceCodeName}</TableCell>
                                    <TableCell>{formatCurrency(parseFloat(entry.amount))}</TableCell>
                                    <TableCell>{formatDate(entry.checkDate)}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </CardContent>
                        </Card>
                      ) : (
                        <Card>
                          <CardContent className="p-8 text-center">
                            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No revenue entries for {formatDate(selectedReportDate)}</h3>
                            <p className="text-gray-600">No revenue entries were recorded for this date.</p>
                          </CardContent>
                        </Card>
                      )}

                      {/* Staff Payouts for the Revenue Entries */}
                      {dailyReport.payoutsByStaff && dailyReport.payoutsByStaff.length > 0 && (
                        <Card>
                          <CardHeader>
                            <CardTitle>Staff Payouts for Date</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Staff Member</TableHead>
                                  <TableHead>Revenue Entries</TableHead>
                                  <TableHead>Total Payout</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {dailyReport.payoutsByStaff.map((staffPayout) => (
                                  <TableRow key={staffPayout.staffId}>
                                    <TableCell>{staffPayout.staffName}</TableCell>
                                    <TableCell>{staffPayout.entries}</TableCell>
                                    <TableCell>{formatCurrency(staffPayout.totalPayout)}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Standard Report Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center mb-4">
                      <div className="p-3 bg-blue-100 rounded-lg mr-4">
                        <BarChart3 className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Revenue Report</h3>
                        <p className="text-sm text-gray-600">Monthly revenue breakdown</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <Button variant="outline" className="w-full" onClick={() => generateRevenueReport('monthly')}>Generate Monthly</Button>
                      <Button variant="outline" className="w-full" onClick={() => generateRevenueReport('quarterly')}>Generate Quarterly</Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center mb-4">
                      <div className="p-3 bg-green-100 rounded-lg mr-4">
                        <Users className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Staff Payout Report</h3>
                        <p className="text-sm text-gray-600">Detailed payout calculations</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <Button variant="outline" className="w-full" onClick={() => generatePayoutReport('current')}>Generate Current</Button>
                      <Button variant="outline" className="w-full" onClick={() => generatePayoutReport('historical')}>Historical View</Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center mb-4">
                      <div className="p-3 bg-purple-100 rounded-lg mr-4">
                        <PieChart className="h-6 w-6 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Program Analytics</h3>
                        <p className="text-sm text-gray-600">Program performance metrics</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <Button variant="outline" className="w-full" onClick={() => generateProgramAnalytics('performance')}>Generate Report</Button>
                      <Button variant="outline" className="w-full" onClick={() => generateProgramAnalytics('comparison')}>Compare Programs</Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Reports</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center">
                        <div className="p-2 bg-blue-100 rounded mr-3">
                          <FileText className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Revenue Report - Current Month</p>
                          <p className="text-sm text-gray-500">Generated today</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge variant="outline">PDF</Badge>
                        <Button variant="ghost" size="sm" onClick={() => generateRevenueReport('monthly')}>Download</Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="m-0">
            <header className="bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
                  <p className="text-gray-600">Configure system settings and manage data</p>
                </div>
              </div>
            </header>

            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                  <Card>
                    <CardHeader>
                      <CardTitle>Settings Menu</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <Button 
                          variant={settingsSubTab === "houses" ? "default" : "ghost"} 
                          className="w-full justify-start"
                          onClick={() => setSettingsSubTab("houses")}
                        >
                          <Home className="mr-3 h-4 w-4" />
                          Manage Houses
                        </Button>
                        <Button 
                          variant={settingsSubTab === "staff" ? "default" : "ghost"} 
                          className="w-full justify-start"
                          onClick={() => setSettingsSubTab("staff")}
                        >
                          <Users className="mr-3 h-4 w-4" />
                          Manage Staff
                        </Button>
                        <Button 
                          variant={settingsSubTab === "service-codes" ? "default" : "ghost"} 
                          className="w-full justify-start" 
                          onClick={() => setSettingsSubTab("service-codes")}
                        >
                          <Settings className="mr-3 h-4 w-4" />
                          Service Codes
                        </Button>
                        <Button variant="ghost" className="w-full justify-start" onClick={() => setPayoutRatesModalOpen(true)}>
                          <Calculator className="mr-3 h-4 w-4" />
                          Payout Rates
                        </Button>
                        <Button variant="ghost" className="w-full justify-start" onClick={() => setBusinessSettingsModalOpen(true)}>
                          <Settings className="mr-3 h-4 w-4" />
                          Business Settings
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="lg:col-span-2">
                  {settingsSubTab === "service-codes" && (
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Manage Service Codes</CardTitle>
                        <Button onClick={() => { setEditingServiceCode(undefined); setServiceCodeModalOpen(true); }}>
                          <Plus className="mr-2 h-4 w-4" />
                          Add Service Code
                        </Button>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {serviceCodes.map((serviceCode) => (
                            <div key={serviceCode.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                              <div>
                                <h4 className="font-medium text-gray-900">{serviceCode.code}</h4>
                                <p className="text-sm text-gray-500">{serviceCode.description || 'No description'}</p>
                                <p className="text-sm text-gray-500">
                                  Status: {serviceCode.isActive ? 'Active' : 'Inactive'}
                                </p>
                              </div>
                              <div className="flex items-center space-x-3">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => { setEditingServiceCode(serviceCode); setServiceCodeModalOpen(true); }}
                                >
                                  <Edit className="mr-1 h-3 w-3" />
                                  Edit
                                </Button>
                                <Button 
                                  variant="destructive" 
                                  size="sm" 
                                  onClick={() => {
                                    if (confirm(`Are you sure you want to delete service code "${serviceCode.code}"?`)) {
                                      deleteServiceCodeMutation.mutate(serviceCode.id);
                                    }
                                  }}
                                  disabled={deleteServiceCodeMutation.isPending}
                                >
                                  <Trash2 className="mr-1 h-3 w-3" />
                                  Delete
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {settingsSubTab === "houses" && (
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Manage Houses</CardTitle>
                        <Button onClick={() => { setEditingHouse(undefined); setHouseModalOpen(true); }}>
                          <Plus className="mr-2 h-4 w-4" />
                          Add House
                        </Button>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {houses.map((house) => (
                            <div key={house.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                              <div>
                                <h4 className="font-medium text-gray-900">{house.name}</h4>
                                <p className="text-sm text-gray-500">{house.address || 'No address'}</p>
                                <p className="text-sm text-gray-500">
                                  Active Patients: {patients.filter(p => p.houseId === house.id && p.status === 'active').length}
                                </p>
                                <p className="text-sm text-gray-500">
                                  Status: {house.isActive ? 'Active' : 'Inactive'}
                                </p>
                              </div>
                              <div className="flex items-center space-x-3">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => { setEditingHouse(house); setHouseModalOpen(true); }}
                                >
                                  <Edit className="mr-1 h-3 w-3" />
                                  Edit
                                </Button>
                                <Button 
                                  variant="destructive" 
                                  size="sm" 
                                  onClick={() => {
                                    if (confirm(`Are you sure you want to delete house "${house.name}"?`)) {
                                      deleteHouseMutation.mutate(house.id);
                                    }
                                  }}
                                  disabled={deleteHouseMutation.isPending}
                                >
                                  <Trash2 className="mr-1 h-3 w-3" />
                                  Delete
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {settingsSubTab === "staff" && (
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Manage Staff</CardTitle>
                        <Button onClick={() => { setEditingStaff(undefined); setStaffModalOpen(true); }}>
                          <Plus className="mr-2 h-4 w-4" />
                          Add Staff Member
                        </Button>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {staff.map((staffMember) => (
                            <div key={staffMember.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                              <div>
                                <h4 className="font-medium text-gray-900">{staffMember.name}</h4>
                                <p className="text-sm text-gray-500">
                                  Status: {staffMember.isActive ? 'Active' : 'Inactive'}
                                </p>
                                <p className="text-sm text-gray-500">
                                  Payout Rates: {payoutRates.filter(r => r.staffId === staffMember.id).length} configured
                                </p>
                              </div>
                              <div className="flex items-center space-x-3">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => { setEditingStaff(staffMember); setStaffModalOpen(true); }}
                                >
                                  <Edit className="mr-1 h-3 w-3" />
                                  Edit
                                </Button>
                                <Button 
                                  variant="destructive" 
                                  size="sm" 
                                  onClick={() => {
                                    if (confirm(`Are you sure you want to delete staff member "${staffMember.name}"?`)) {
                                      deleteStaffMutation.mutate(staffMember.id);
                                    }
                                  }}
                                  disabled={deleteStaffMutation.isPending}
                                >
                                  <Trash2 className="mr-1 h-3 w-3" />
                                  Delete
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
      {/* Modals */}
      <RevenueEntryModal 
        open={revenueModalOpen} 
        onOpenChange={(open) => {
          setRevenueModalOpen(open);
          if (!open) setEditingRevenueEntry(undefined);
        }}
        houses={houses}
        serviceCodes={serviceCodes}
        patients={patients}
        revenueEntry={editingRevenueEntry}
      />
      <ExpenseModal 
        open={expenseModalOpen} 
        onOpenChange={(open) => {
          setExpenseModalOpen(open);
          if (!open) setEditingExpense(undefined);
        }}
        expense={editingExpense}
      />
      <PatientModal 
        open={patientModalOpen} 
        onOpenChange={(open) => {
          setPatientModalOpen(open);
          if (!open) setEditingPatient(undefined);
        }}
        houses={houses}
        patient={editingPatient}
      />
      <PayoutRatesModal
        open={payoutRatesModalOpen}
        onOpenChange={setPayoutRatesModalOpen}
        houses={houses}
        serviceCodes={serviceCodes}
        staff={staff}
        payoutRates={payoutRates}
      />
      <ServiceCodeModal
        open={serviceCodeModalOpen}
        onOpenChange={(open) => {
          setServiceCodeModalOpen(open);
          if (!open) setEditingServiceCode(undefined);
        }}
        serviceCode={editingServiceCode}
      />
      <BusinessSettingsModal
        open={businessSettingsModalOpen}
        onOpenChange={setBusinessSettingsModalOpen}
      />
      <HouseModal
        open={houseModalOpen}
        onOpenChange={(open) => {
          setHouseModalOpen(open);
          if (!open) setEditingHouse(undefined);
        }}
        house={editingHouse}
      />
      <StaffModal
        open={staffModalOpen}
        onOpenChange={(open) => {
          setStaffModalOpen(open);
          if (!open) setEditingStaff(undefined);
        }}
        staff={editingStaff}
      />
    </div>
  );
}
