import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DragDropContext, Droppable, Draggable, type DropResult } from "react-beautiful-dnd";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  DollarSign, Users, TrendingUp, Receipt, Download, Plus, 
  Search, Edit, Trash2, FileText, BarChart3, PieChart, 
  Settings, Home, UserCheck, Calculator, X, GripVertical
} from "lucide-react";
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

// Dashboard card types and interfaces
interface DashboardCard {
  id: string;
  title: string;
  type: string;
  icon: string;
  color: string;
  visible: boolean;
  order: number;
}

const defaultCards: DashboardCard[] = [
  { id: 'total-revenue', title: 'Total Revenue', type: 'metric', icon: 'DollarSign', color: 'green', visible: true, order: 0 },
  { id: 'total-expenses', title: 'Total Expenses', type: 'metric', icon: 'Receipt', color: 'red', visible: true, order: 1 },
  { id: 'george-revenue', title: 'Your Revenue Share', type: 'metric', icon: 'UserCheck', color: 'purple', visible: true, order: 2 },
  { id: 'net-profit', title: 'Net Profit', type: 'metric', icon: 'BarChart3', color: 'blue', visible: true, order: 3 },
  { id: 'active-patients', title: 'Active Patients', type: 'metric', icon: 'Users', color: 'orange', visible: true, order: 4 },
];

const availableCards: DashboardCard[] = [
  ...defaultCards,
  { id: 'profit-margin', title: 'Profit Margin', type: 'metric', icon: 'PieChart', color: 'indigo', visible: false, order: 5 },
  { id: 'monthly-growth', title: 'Monthly Growth', type: 'metric', icon: 'TrendingUp', color: 'emerald', visible: false, order: 6 },
  { id: 'avg-revenue-per-patient', title: 'Avg Revenue/Patient', type: 'metric', icon: 'Calculator', color: 'teal', visible: false, order: 7 },
];

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
  
  // Dashboard customization state
  const [dashboardCards, setDashboardCards] = useState<DashboardCard[]>(() => {
    const saved = localStorage.getItem('dashboard-cards');
    return saved ? JSON.parse(saved) : defaultCards;
  });
  const [customizeModalOpen, setCustomizeModalOpen] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Save dashboard configuration to localStorage
  useEffect(() => {
    localStorage.setItem('dashboard-cards', JSON.stringify(dashboardCards));
  }, [dashboardCards]);

  // Handle drag and drop reordering
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const visibleCards = dashboardCards.filter(card => card.visible).sort((a, b) => a.order - b.order);
    const [reorderedCard] = visibleCards.splice(result.source.index, 1);
    visibleCards.splice(result.destination.index, 0, reorderedCard);

    // Update order for all cards
    const updatedCards = dashboardCards.map(card => {
      if (!card.visible) return card;
      const newIndex = visibleCards.findIndex(c => c.id === card.id);
      return { ...card, order: newIndex };
    });

    setDashboardCards(updatedCards);
  };

  // Toggle card visibility
  const toggleCardVisibility = (cardId: string) => {
    setDashboardCards(prev => prev.map(card => 
      card.id === cardId ? { ...card, visible: !card.visible } : card
    ));
  };

  // Remove card from dashboard
  const removeCard = (cardId: string) => {
    setDashboardCards(prev => prev.map(card => 
      card.id === cardId ? { ...card, visible: false } : card
    ));
  };

  // Get visible cards sorted by order
  const visibleCards = dashboardCards.filter(card => card.visible).sort((a, b) => a.order - b.order);

  // Icon mapping
  const iconMap: Record<string, any> = {
    DollarSign,
    Receipt,
    UserCheck,
    BarChart3,
    Users,
    PieChart,
    TrendingUp,
    Calculator,
  };

  // Color mapping
  const colorMap: Record<string, { bg: string, icon: string }> = {
    green: { bg: 'bg-green-100', icon: 'text-green-600' },
    red: { bg: 'bg-red-100', icon: 'text-red-600' },
    purple: { bg: 'bg-purple-100', icon: 'text-purple-600' },
    blue: { bg: 'bg-blue-100', icon: 'text-blue-600' },
    orange: { bg: 'bg-orange-100', icon: 'text-orange-600' },
    indigo: { bg: 'bg-indigo-100', icon: 'text-indigo-600' },
    emerald: { bg: 'bg-emerald-100', icon: 'text-emerald-600' },
    teal: { bg: 'bg-teal-100', icon: 'text-teal-600' },
  };

  // Metric calculation function
  const getMetricValue = (cardId: string) => {
    switch (cardId) {
      case 'total-revenue':
        return { value: formatCurrency(totalRevenue), change: '12% vs last month', trend: 'up' };
      case 'total-expenses':
        return { value: formatCurrency(totalExpenses), change: '3% vs last month', trend: 'up' };
      case 'george-revenue':
        return { value: formatCurrency(georgeRevenue), change: 'George\'s portion from payouts', trend: 'neutral' };
      case 'net-profit':
        return { value: formatCurrency(netProfit), change: 'Your revenue - Total expenses', trend: netProfit >= 0 ? 'up' : 'down' };
      case 'active-patients':
        return { value: activePatients.toString(), change: '2 new this week', trend: 'up' };
      case 'profit-margin':
        const margin = georgeRevenue > 0 ? ((netProfit / georgeRevenue) * 100).toFixed(1) : '0';
        return { value: `${margin}%`, change: 'Profit margin', trend: parseFloat(margin) >= 0 ? 'up' : 'down' };
      case 'monthly-growth':
        return { value: '8.5%', change: 'Revenue growth', trend: 'up' };
      case 'avg-revenue-per-patient':
        const avgRevenue = activePatients > 0 ? totalRevenue / activePatients : 0;
        return { value: formatCurrency(avgRevenue), change: 'Per active patient', trend: 'neutral' };
      default:
        return { value: '$0', change: 'No data', trend: 'neutral' };
    }
  };

  // Render metric card
  const renderMetricCard = (card: DashboardCard, index: number, isDragging = false) => {
    const IconComponent = iconMap[card.icon];
    const colors = colorMap[card.color];
    const metric = getMetricValue(card.id);

    return (
      <Card key={card.id} className={`${isDragging ? 'opacity-75 shadow-lg' : ''}`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-600">{card.title}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removeCard(card.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
              <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
              <p className={`text-xs mt-1 ${
                metric.trend === 'up' ? 'text-green-600' : 
                metric.trend === 'down' ? 'text-red-600' : 'text-gray-500'
              }`}>
                {metric.trend === 'up' && <TrendingUp className="inline mr-1 h-3 w-3" />}
                {metric.change}
              </p>
            </div>
            <div className={`p-3 ${colors.bg} rounded-full`}>
              <IconComponent className={`h-6 w-6 ${colors.icon}`} />
            </div>
          </div>
        </CardContent>
      </Card>
    );
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
    return new Date(date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">HealthCare Dashboard</h1>
          <p className="text-sm text-gray-500">Mental Health Services</p>
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
              {/* Dashboard Header with Customize Button */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Key Metrics</h3>
                <Dialog open={customizeModalOpen} onOpenChange={setCustomizeModalOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Settings className="mr-2 h-4 w-4" />
                      Customize Dashboard
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Customize Dashboard</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <p className="text-sm text-gray-600">Choose which metrics to display on your dashboard:</p>
                      <div className="space-y-3">
                        {availableCards.map((card) => {
                          const isVisible = dashboardCards.find(c => c.id === card.id)?.visible || false;
                          return (
                            <div key={card.id} className="flex items-center space-x-3">
                              <Checkbox
                                id={card.id}
                                checked={isVisible}
                                onCheckedChange={() => toggleCardVisibility(card.id)}
                              />
                              <label
                                htmlFor={card.id}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                {card.title}
                              </label>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Draggable Metrics Cards */}
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="dashboard-cards" direction="horizontal">
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-8"
                    >
                      {visibleCards.map((card, index) => (
                        <Draggable key={card.id} draggableId={card.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className="group relative"
                            >
                              <div
                                {...provided.dragHandleProps}
                                className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
                              >
                                <GripVertical className="h-4 w-4 text-gray-400" />
                              </div>
                              {renderMetricCard(card, index, snapshot.isDragging)}
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Revenue Trend</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <RevenueChart data={revenueEntries} />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Revenue by Program</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                      <div className="text-center text-gray-500">
                        <PieChart className="h-12 w-12 mx-auto mb-2" />
                        <p>Program Distribution Chart</p>
                        <p className="text-sm">Coming Soon</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity & Payout Summary */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Recent Transactions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {revenueEntries.slice(0, 5).map((entry) => {
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
                              <p className="text-sm text-gray-500">{formatDate(entry.date)}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>This Month's Payouts</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {staffPayouts.map(({ staff: staffMember, totalPayout }) => (
                        <div key={staffMember.id} className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">{staffMember.name}</p>
                            <p className="text-sm text-gray-500">Staff Member</p>
                          </div>
                          <p className="font-medium text-gray-900">{formatCurrency(totalPayout)}</p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 pt-4 border-t border-gray-200">
                      <Button 
                        className="w-full"
                        onClick={() => setSelectedTab("payouts")}
                      >
                        View Detailed Payouts
                      </Button>
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
                        <TableHead>Date</TableHead>
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
                <Button>
                  <Download className="mr-2 h-4 w-4" />
                  Export All Reports
                </Button>
              </div>
            </header>

            <div className="p-6">
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
                      <Button variant="outline" className="w-full">Generate Monthly</Button>
                      <Button variant="outline" className="w-full">Generate Quarterly</Button>
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
                      <Button variant="outline" className="w-full">Generate Current</Button>
                      <Button variant="outline" className="w-full">Historical View</Button>
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
                      <Button variant="outline" className="w-full">Generate Report</Button>
                      <Button variant="outline" className="w-full">Compare Programs</Button>
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
                        <Button variant="ghost" size="sm">Download</Button>
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
