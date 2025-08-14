import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { TimeEntry, InsertTimeEntry, HourlyEmployee } from "@shared/schema";

interface TimeEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  timeEntry?: TimeEntry;
}

export function TimeEntryModal({ isOpen, onClose, timeEntry }: TimeEntryModalProps) {
  const [employeeId, setEmployeeId] = useState(timeEntry?.employeeId || "");
  const formatDateForInput = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [date, setDate] = useState(
    timeEntry?.date ? formatDateForInput(new Date(timeEntry.date)) : 
    formatDateForInput(new Date())
  );
  const [hours, setHours] = useState(timeEntry?.hours?.toString() || "");
  const [description, setDescription] = useState(timeEntry?.description || "");
  
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

  const mutation = useMutation({
    mutationFn: async (data: InsertTimeEntry) => {
      const url = timeEntry ? `/api/time-entries/${timeEntry.id}` : "/api/time-entries";
      const method = timeEntry ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to ${timeEntry ? 'update' : 'create'} time entry`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/time-entries"] });
      toast({
        title: timeEntry ? "Time entry updated successfully" : "Time entry created successfully",
      });
      onClose();
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save time entry",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setEmployeeId("");
    setDate(formatDateForInput(new Date()));
    setHours("");
    setDescription("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!employeeId || !date || !hours) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const hoursNum = parseFloat(hours);
    if (hoursNum <= 0 || hoursNum > 24) {
      toast({
        title: "Error",
        description: "Hours must be between 0.01 and 24",
        variant: "destructive",
      });
      return;
    }

    // Create date at noon in local timezone to avoid timezone issues
    const [year, month, day] = date.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day, 12, 0, 0);

    mutation.mutate({
      employeeId,
      date: dateObj,
      hours: hoursNum.toString(),
      description: description.trim() || undefined,
    });
  };

  const handleClose = () => {
    onClose();
    if (!timeEntry) {
      resetForm();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {timeEntry ? "Edit Time Entry" : "Add New Time Entry"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="employee">Employee *</Label>
            <Select value={employeeId} onValueChange={setEmployeeId} required>
              <SelectTrigger>
                <SelectValue placeholder="Select employee" />
              </SelectTrigger>
              <SelectContent>
                {hourlyEmployees.map((employee: HourlyEmployee) => (
                  <SelectItem key={employee.id} value={employee.id}>
                    {employee.name} (${employee.hourlyRate}/hr)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="date">Date *</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="hours">Hours Worked *</Label>
            <Input
              id="hours"
              type="number"
              step="0.01"
              min="0.01"
              max="24"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              placeholder="8.00"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of work performed"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving..." : timeEntry ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}