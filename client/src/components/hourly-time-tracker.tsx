import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Clock, DollarSign, Calendar, User, Settings, CheckCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { HourlyEmployeeModal } from "./hourly-employee-modal";
import { TimeEntryModal } from "./time-entry-modal";
import type { HourlyEmployee, TimeEntry } from "@shared/schema";

export function HourlyTimeTracker() {
  const [employeeModalOpen, setEmployeeModalOpen] = useState(false);
  const [timeEntryModalOpen, setTimeEntryModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<HourlyEmployee | undefined>();
  const [editingTimeEntry, setEditingTimeEntry] = useState<TimeEntry | undefined>();
  const [selectedTimeEntries, setSelectedTimeEntries] = useState<string[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch hourly employees
  const { data: hourlyEmployees = [] } = useQuery({
    queryKey: ["/api/hourly-employees"],
    queryFn: async () => {
      const response = await fetch("/api/hourly-employees");
      if (!response.ok) {
        throw new Error("Failed to fetch hourly employees");
      }
      return response.json();
    },
  });

  // Fetch unpaid time entries
  const { data: unpaidTimeEntries = [] } = useQuery({
    queryKey: ["/api/time-entries", { unpaidOnly: true }],
    queryFn: async () => {
      const response = await fetch("/api/time-entries?unpaidOnly=true");
      if (!response.ok) {
        throw new Error("Failed to fetch unpaid time entries");
      }
      return response.json();
    },
  });

  // Pay time entries mutation
  const payTimeEntriesMutation = useMutation({
    mutationFn: async (paymentData: any) => {
      const response = await fetch("/api/time-entries/pay", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(paymentData),
      });
      
      if (!response.ok) {
        throw new Error("Failed to process payment");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/time-entries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      setSelectedTimeEntries([]);
      toast({
        title: "Payment processed successfully",
        description: "Time entries have been marked as paid and an expense has been created.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error processing payment",
        description: error.message || "Failed to process payment",
        variant: "destructive",
      });
    },
  });

  const formatCurrency = (amount: number | string) => {
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(num);
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Calculate totals for selected time entries
  const selectedEntries = unpaidTimeEntries.filter((entry: TimeEntry) => 
    selectedTimeEntries.includes(entry.id)
  );
  
  const totalHours = selectedEntries.reduce((sum: number, entry: TimeEntry) => {
    return sum + parseFloat(entry.hours);
  }, 0);

  const totalAmount = selectedEntries.reduce((sum: number, entry: TimeEntry) => {
    const employee = hourlyEmployees.find((emp: HourlyEmployee) => emp.id === entry.employeeId);
    if (employee) {
      return sum + (parseFloat(entry.hours) * parseFloat(employee.hourlyRate));
    }
    return sum;
  }, 0);

  const handleSelectTimeEntry = (timeEntryId: string, checked: boolean) => {
    if (checked) {
      setSelectedTimeEntries([...selectedTimeEntries, timeEntryId]);
    } else {
      setSelectedTimeEntries(selectedTimeEntries.filter(id => id !== timeEntryId));
    }
  };

  const handleSelectAllTimeEntries = (checked: boolean) => {
    if (checked) {
      setSelectedTimeEntries(unpaidTimeEntries.map((entry: TimeEntry) => entry.id));
    } else {
      setSelectedTimeEntries([]);
    }
  };

  const handlePaySelectedEntries = () => {
    if (selectedTimeEntries.length === 0) {
      toast({
        title: "No entries selected",
        description: "Please select time entries to pay",
        variant: "destructive",
      });
      return;
    }

    // Group by employee for payment
    const entriesByEmployee = selectedEntries.reduce((acc: any, entry: TimeEntry) => {
      const employee = hourlyEmployees.find((emp: HourlyEmployee) => emp.id === entry.employeeId);
      if (employee) {
        if (!acc[employee.id]) {
          acc[employee.id] = {
            employee,
            entries: [],
            totalHours: 0,
            totalAmount: 0,
          };
        }
        acc[employee.id].entries.push(entry);
        acc[employee.id].totalHours += parseFloat(entry.hours);
        acc[employee.id].totalAmount += parseFloat(entry.hours) * parseFloat(employee.hourlyRate);
      }
      return acc;
    }, {});

    // Process payment for the first employee (you could modify this to handle multiple employees)
    const employeePayments = Object.values(entriesByEmployee);
    if (employeePayments.length > 0) {
      const payment = employeePayments[0] as any;
      
      payTimeEntriesMutation.mutate({
        timeEntryIds: selectedTimeEntries,
        totalAmount: totalAmount,
        employeeName: payment.employee.name,
        description: `Payment for ${totalHours.toFixed(2)} hours of work`,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Hourly Employees Management */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Hourly Employees</CardTitle>
          <Button onClick={() => {
            setEditingEmployee(undefined);
            setEmployeeModalOpen(true);
          }}>
            <Plus className="mr-2 h-4 w-4" />
            Add Employee
          </Button>
        </CardHeader>
        <CardContent>
          {hourlyEmployees.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <User className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No hourly employees added yet</p>
              <Button 
                className="mt-2" 
                variant="outline" 
                onClick={() => setEmployeeModalOpen(true)}
              >
                Add First Employee
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {hourlyEmployees.map((employee: HourlyEmployee) => (
                <div key={employee.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{employee.name}</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingEmployee(employee);
                        setEmployeeModalOpen(true);
                      }}
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-lg font-semibold text-green-600">
                    {formatCurrency(parseFloat(employee.hourlyRate))}/hr
                  </p>
                  <Badge variant="secondary" className="mt-2">
                    {employee.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Time Entry Form */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Time Tracking</CardTitle>
          <Button onClick={() => {
            setEditingTimeEntry(undefined);
            setTimeEntryModalOpen(true);
          }} disabled={hourlyEmployees.length === 0}>
            <Clock className="mr-2 h-4 w-4" />
            Add Time Entry
          </Button>
        </CardHeader>
        <CardContent>
          {hourlyEmployees.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>Add hourly employees first to track time entries</p>
            </div>
          ) : unpaidTimeEntries.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No unpaid time entries</p>
              <Button 
                className="mt-2" 
                variant="outline" 
                onClick={() => setTimeEntryModalOpen(true)}
              >
                Add First Time Entry
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Payment Summary */}
              {selectedTimeEntries.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">
                        {selectedTimeEntries.length} entries selected
                      </p>
                      <p className="text-sm text-gray-600">
                        Total: {totalHours.toFixed(2)} hours = {formatCurrency(totalAmount)}
                      </p>
                    </div>
                    <Button 
                      onClick={handlePaySelectedEntries}
                      disabled={payTimeEntriesMutation.isPending}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      {payTimeEntriesMutation.isPending ? "Processing..." : "Pay Selected"}
                    </Button>
                  </div>
                </div>
              )}

              {/* Time Entries Table */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedTimeEntries.length === unpaidTimeEntries.length}
                        onCheckedChange={handleSelectAllTimeEntries}
                      />
                    </TableHead>
                    <TableHead>Employee</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Hours</TableHead>
                    <TableHead>Rate</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {unpaidTimeEntries.map((entry: TimeEntry) => {
                    const employee = hourlyEmployees.find((emp: HourlyEmployee) => emp.id === entry.employeeId);
                    const amount = employee ? parseFloat(entry.hours) * parseFloat(employee.hourlyRate) : 0;
                    
                    return (
                      <TableRow key={entry.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedTimeEntries.includes(entry.id)}
                            onCheckedChange={(checked) => handleSelectTimeEntry(entry.id, checked as boolean)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          {employee?.name || "Unknown"}
                        </TableCell>
                        <TableCell>{formatDate(entry.date)}</TableCell>
                        <TableCell>{parseFloat(entry.hours).toFixed(2)}</TableCell>
                        <TableCell>{employee ? formatCurrency(parseFloat(employee.hourlyRate)) : "-"}</TableCell>
                        <TableCell className="font-medium text-green-600">
                          {formatCurrency(amount)}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {entry.description || "-"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <HourlyEmployeeModal
        isOpen={employeeModalOpen}
        onClose={() => {
          setEmployeeModalOpen(false);
          setEditingEmployee(undefined);
        }}
        employee={editingEmployee}
      />
      
      <TimeEntryModal
        isOpen={timeEntryModalOpen}
        onClose={() => {
          setTimeEntryModalOpen(false);
          setEditingTimeEntry(undefined);
        }}
        timeEntry={editingTimeEntry}
      />
    </div>
  );
}