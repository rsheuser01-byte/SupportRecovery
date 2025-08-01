import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { House } from "@shared/schema";

const patientSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().optional(),
  houseId: z.string().optional(),
  program: z.string().optional(),
  startDate: z.string().optional(),
  status: z.string().default("active"),
});

type PatientForm = z.infer<typeof patientSchema>;

interface PatientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  houses: House[];
}

export default function PatientModal({ open, onOpenChange, houses }: PatientModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<PatientForm>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      name: "",
      phone: "",
      houseId: "",
      program: "",
      startDate: new Date().toISOString().split('T')[0],
      status: "active",
    },
  });

  const createPatientMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/patients', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/patients'] });
      toast({ title: "Patient created successfully" });
      form.reset();
      onOpenChange(false);
    },
    onError: () => {
      toast({ title: "Failed to create patient", variant: "destructive" });
    },
  });

  const onSubmit = (data: PatientForm) => {
    const submitData = {
      ...data,
      startDate: data.startDate ? new Date(data.startDate).toISOString() : undefined,
      houseId: data.houseId === "none" ? undefined : data.houseId || undefined,
    };
    
    createPatientMutation.mutate(submitData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Patient</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input 
              id="name"
              placeholder="Patient name"
              {...form.register("name")}
              className="mt-1"
            />
            {form.formState.errors.name && (
              <p className="text-sm text-red-600 mt-1">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="phone">Phone (Optional)</Label>
            <Input 
              id="phone"
              placeholder="(555) 123-4567"
              {...form.register("phone")}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="houseId">House (Optional)</Label>
            <Select onValueChange={(value) => form.setValue("houseId", value)}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select House" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No house assigned</SelectItem>
                {houses.map(house => (
                  <SelectItem key={house.id} value={house.id}>{house.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="program">Program (Optional)</Label>
            <Input 
              id="program"
              placeholder="e.g., Addiction Recovery, Mental Health"
              {...form.register("program")}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="startDate">Start Date (Optional)</Label>
            <Input 
              id="startDate"
              type="date" 
              {...form.register("startDate")}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <Select onValueChange={(value) => form.setValue("status", value)} defaultValue="active">
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="graduated">Graduated</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createPatientMutation.isPending}>
              {createPatientMutation.isPending ? "Saving..." : "Save Patient"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
