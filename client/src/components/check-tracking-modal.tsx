import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { insertCheckTrackingSchema, type InsertCheckTracking, type CheckTracking } from "@shared/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface CheckTrackingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  checkEntry?: CheckTracking;
}

export function CheckTrackingModal({ open, onOpenChange, checkEntry }: CheckTrackingModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<InsertCheckTracking>({
    resolver: zodResolver(insertCheckTrackingSchema),
    defaultValues: {
      serviceProvider: "",
      checkNumber: "",
      checkAmount: "",
      checkDate: "",
      processedDate: "",
      notes: "",
    },
  });

  // Update form when checkEntry changes
  useEffect(() => {
    if (checkEntry) {
      form.reset({
        serviceProvider: checkEntry.serviceProvider,
        checkNumber: checkEntry.checkNumber,
        checkAmount: checkEntry.checkAmount,
        checkDate: checkEntry.checkDate,
        processedDate: checkEntry.processedDate,
        notes: checkEntry.notes || "",
      });
    } else {
      form.reset({
        serviceProvider: "",
        checkNumber: "",
        checkAmount: "",
        checkDate: "",
        processedDate: "",
        notes: "",
      });
    }
  }, [checkEntry, form]);

  const createMutation = useMutation({
    mutationFn: (data: InsertCheckTracking) => apiRequest('POST', '/api/check-tracking', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/check-tracking'] });
      toast({ title: "Check entry created successfully" });
      onOpenChange(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error creating check entry",
        description: error.message || "Please check your input and try again.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: InsertCheckTracking) => apiRequest('PUT', `/api/check-tracking/${checkEntry!.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/check-tracking'] });
      toast({ title: "Check entry updated successfully" });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error updating check entry",
        description: error.message || "Please check your input and try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertCheckTracking) => {
    // Ensure amount is properly formatted as decimal
    const formattedData = {
      ...data,
      checkAmount: parseFloat(data.checkAmount).toFixed(2)
    };
    
    if (checkEntry) {
      updateMutation.mutate(formattedData);
    } else {
      createMutation.mutate(formattedData);
    }
  };

  const formatCurrency = (value: string) => {
    // Remove any non-numeric characters except decimal point
    const numericValue = value.replace(/[^0-9.]/g, '');
    
    // Don't format until user is done typing - just return the cleaned numeric value
    return numericValue;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{checkEntry ? 'Edit Check Entry' : 'Add New Check Entry'}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="serviceProvider"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Service Provider</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter service provider name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="checkNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Check Number</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter check number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="checkAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Check Amount</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter amount (e.g., 25.00)" 
                      {...field}
                      onChange={(e) => {
                        const cleaned = e.target.value.replace(/[^0-9.]/g, '');
                        field.onChange(cleaned);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="checkDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Check Issue Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="processedDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Processed Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Additional notes..." {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending ? 'Saving...' : (checkEntry ? 'Update' : 'Create')}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}