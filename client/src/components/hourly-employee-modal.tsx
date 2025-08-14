import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { HourlyEmployee, InsertHourlyEmployee } from "@shared/schema";

interface HourlyEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee?: HourlyEmployee;
}

export function HourlyEmployeeModal({ isOpen, onClose, employee }: HourlyEmployeeModalProps) {
  const [name, setName] = useState(employee?.name || "");
  const [hourlyRate, setHourlyRate] = useState(employee?.hourlyRate || "");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: InsertHourlyEmployee) => {
      const url = employee ? `/api/hourly-employees/${employee.id}` : "/api/hourly-employees";
      const method = employee ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to ${employee ? 'update' : 'create'} employee`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hourly-employees"] });
      toast({
        title: employee ? "Employee updated successfully" : "Employee created successfully",
      });
      onClose();
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save employee",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setName("");
    setHourlyRate("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !hourlyRate) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    mutation.mutate({
      name: name.trim(),
      hourlyRate: hourlyRate.toString(),
    });
  };

  const handleClose = () => {
    onClose();
    if (!employee) {
      resetForm();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {employee ? "Edit Hourly Employee" : "Add New Hourly Employee"}
          </DialogTitle>
          <DialogDescription>
            {employee ? "Update the employee's information below." : "Add a new hourly employee to track time and payments."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Employee Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter employee name"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="hourlyRate">Hourly Rate ($) *</Label>
            <Input
              id="hourlyRate"
              type="number"
              step="0.01"
              min="0"
              value={hourlyRate}
              onChange={(e) => setHourlyRate(e.target.value)}
              placeholder="0.00"
              required
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving..." : employee ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}