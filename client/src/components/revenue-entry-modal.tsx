import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { House, ServiceCode, Patient, RevenueEntry } from "@shared/schema";

const revenueEntrySchema = z.object({
  date: z.string().min(1, "Date is required"),
  checkDate: z.string().min(1, "Check date is required"),
  amount: z.string().min(1, "Amount is required").refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: "Amount must be a positive number",
  }),
  patientId: z.string().optional(),
  houseId: z.string().min(1, "House selection is required"),
  serviceCodeId: z.string().min(1, "Service code is required"),
  notes: z.string().optional(),
});

type RevenueEntryForm = z.infer<typeof revenueEntrySchema>;

interface RevenueEntryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  houses: House[];
  serviceCodes: ServiceCode[];
  patients: Patient[];
  revenueEntry?: RevenueEntry;
}

export default function RevenueEntryModal({ 
  open, 
  onOpenChange, 
  houses, 
  serviceCodes, 
  patients,
  revenueEntry
}: RevenueEntryModalProps) {
  const [payoutPreview, setPayoutPreview] = useState<any[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEdit = !!revenueEntry;

  const form = useForm<RevenueEntryForm>({
    resolver: zodResolver(revenueEntrySchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      checkDate: new Date().toISOString().split('T')[0],
      amount: "",
      patientId: "",
      houseId: "",
      serviceCodeId: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (revenueEntry) {
      form.reset({
        date: new Date(revenueEntry.date).toISOString().split('T')[0],
        checkDate: revenueEntry.checkDate ? new Date(revenueEntry.checkDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        amount: revenueEntry.amount,
        patientId: revenueEntry.patientId || "",
        houseId: revenueEntry.houseId,
        serviceCodeId: revenueEntry.serviceCodeId,
        notes: revenueEntry.notes || "",
      });
    } else {
      form.reset({
        date: new Date().toISOString().split('T')[0],
        checkDate: new Date().toISOString().split('T')[0],
        amount: "",
        patientId: "",
        houseId: "",
        serviceCodeId: "",
        notes: "",
      });
      setPayoutPreview([]);
    }
  }, [revenueEntry, form]);

  const createRevenueMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/revenue-entries', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/revenue-entries'] });
      queryClient.invalidateQueries({ queryKey: ['/api/payouts'] });
      toast({ title: "Revenue entry created successfully" });
      form.reset();
      setPayoutPreview([]);
      onOpenChange(false);
    },
    onError: () => {
      toast({ title: "Failed to create revenue entry", variant: "destructive" });
    },
  });

  const updateRevenueMutation = useMutation({
    mutationFn: (data: any) => apiRequest('PUT', `/api/revenue-entries/${revenueEntry?.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/revenue-entries'] });
      queryClient.invalidateQueries({ queryKey: ['/api/payouts'] });
      toast({ title: "Revenue entry updated successfully" });
      onOpenChange(false);
    },
    onError: () => {
      toast({ title: "Failed to update revenue entry", variant: "destructive" });
    },
  });

  const calculatePayoutsMutation = useMutation({
    mutationFn: (data: { amount: string; houseId: string; serviceCodeId: string }) =>
      apiRequest('POST', '/api/calculate-payouts', data),
    onSuccess: (response) => {
      response.json().then(setPayoutPreview);
    },
  });

  const watchedValues = form.watch(["amount", "houseId", "serviceCodeId", "patientId"]);

  // Auto-select house when patient is selected
  React.useEffect(() => {
    const [amount, houseId, serviceCodeId, patientId] = watchedValues;
    
    // Auto-set house based on selected patient
    if (patientId && patientId !== "none") {
      const selectedPatient = patients.find(p => p.id === patientId);
      if (selectedPatient && selectedPatient.houseId && selectedPatient.houseId !== houseId) {
        form.setValue("houseId", selectedPatient.houseId);
      }
    }
  }, [watchedValues[3], patients, form]); // Only watch patientId changes

  // Calculate payouts when relevant fields change
  React.useEffect(() => {
    const [amount, houseId, serviceCodeId] = watchedValues;
    if (amount && houseId && serviceCodeId && parseFloat(amount) > 0) {
      calculatePayoutsMutation.mutate({ amount, houseId, serviceCodeId });
    } else {
      setPayoutPreview([]);
    }
  }, [watchedValues[0], watchedValues[1], watchedValues[2]]); // Watch amount, houseId, serviceCodeId

  const onSubmit = (data: RevenueEntryForm) => {
    console.log("Form data before processing:", data);
    const submitData = {
      ...data,
      date: new Date(data.date).toISOString(),
      checkDate: new Date(data.checkDate).toISOString(),
      amount: parseFloat(data.amount).toFixed(2),
      patientId: data.patientId === "none" || !data.patientId ? null : data.patientId,
    };
    console.log("Processed submit data:", submitData);
    
    if (isEdit) {
      updateRevenueMutation.mutate(submitData);
    } else {
      createRevenueMutation.mutate(submitData);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Revenue Entry" : "Add New Revenue Entry"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update the revenue entry details below." : "Enter the details for a new revenue entry."}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date">Date</Label>
              <Input 
                id="date"
                type="date" 
                {...form.register("date")}
                className="mt-1"
              />
              {form.formState.errors.date && (
                <p className="text-sm text-red-600 mt-1">{form.formState.errors.date.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="checkDate">Check Date</Label>
              <Input 
                id="checkDate"
                type="date" 
                {...form.register("checkDate")}
                className="mt-1"
              />
              {form.formState.errors.checkDate && (
                <p className="text-sm text-red-600 mt-1">{form.formState.errors.checkDate.message}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="amount">Amount</Label>
            <Input 
              id="amount"
              type="number" 
              placeholder="0.00" 
              step="0.01"
              {...form.register("amount")}
              className="mt-1"
            />
            {form.formState.errors.amount && (
              <p className="text-sm text-red-600 mt-1">{form.formState.errors.amount.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="patientId">Patient (Optional) - House will auto-select</Label>
            <Select onValueChange={(value) => form.setValue("patientId", value)} value={form.watch("patientId") || "none"}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Search or select patient..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No patient selected</SelectItem>
                {patients.map(patient => {
                  const house = houses.find(h => h.id === patient.houseId);
                  return (
                    <SelectItem key={patient.id} value={patient.id}>
                      {patient.name} - {house?.name || 'No House'}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="houseId">House</Label>
              <Select onValueChange={(value) => form.setValue("houseId", value)} value={form.watch("houseId")}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select House" />
                </SelectTrigger>
                <SelectContent>
                  {houses.map(house => (
                    <SelectItem key={house.id} value={house.id}>{house.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.houseId && (
                <p className="text-sm text-red-600 mt-1">{form.formState.errors.houseId.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="serviceCodeId">Service Code</Label>
              <Select onValueChange={(value) => form.setValue("serviceCodeId", value)} value={form.watch("serviceCodeId")}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select Service" />
                </SelectTrigger>
                <SelectContent>
                  {serviceCodes.map(service => (
                    <SelectItem key={service.id} value={service.id}>{service.code}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.serviceCodeId && (
                <p className="text-sm text-red-600 mt-1">{form.formState.errors.serviceCodeId.message}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea 
              id="notes"
              rows={3} 
              placeholder="Additional notes..."
              {...form.register("notes")}
              className="mt-1"
            />
          </div>

          {/* Payout Preview */}
          {payoutPreview.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <h4 className="font-medium text-gray-900 mb-3">Calculated Payouts Preview</h4>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                  {payoutPreview.map((payout) => (
                    <div key={payout.staffId}>
                      <p className="text-gray-600">{payout.staffName}</p>
                      <p className="font-medium">{formatCurrency(parseFloat(payout.amount))}</p>
                      <p className="text-xs text-gray-500">{payout.percentage}%</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createRevenueMutation.isPending || updateRevenueMutation.isPending}>
              {createRevenueMutation.isPending || updateRevenueMutation.isPending ? "Saving..." : isEdit ? "Update Entry" : "Save Entry"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
