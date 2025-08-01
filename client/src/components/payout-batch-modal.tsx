import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Calendar, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { insertPayoutBatchSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import type { PayoutBatch } from "@shared/schema";
import { z } from "zod";

const formSchema = insertPayoutBatchSchema.extend({
  checkDate: z.string().min(1, "Check date is required"),
});

type FormData = z.infer<typeof formSchema>;

interface PayoutBatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  batch?: PayoutBatch;
}

export function PayoutBatchModal({ isOpen, onClose, batch }: PayoutBatchModalProps) {
  const { toast } = useToast();
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: batch?.name || "",
      checkDate: batch ? new Date(batch.checkDate).toISOString().split('T')[0] : "",
      notes: batch?.notes || "",
      status: batch?.status || "pending",
    },
  });

  const mutation = useMutation({
    mutationFn: (data: FormData) => {
      const submitData = {
        ...data,
        checkDate: new Date(data.checkDate + 'T00:00:00.000Z'),
      };
      
      if (batch) {
        return apiRequest('PUT', `/api/payout-batches/${batch.id}`, submitData);
      } else {
        return apiRequest('POST', '/api/payout-batches', submitData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/payout-batches'] });
      toast({ 
        title: batch ? "Payout batch updated successfully" : "Payout batch created successfully" 
      });
      onClose();
      form.reset();
    },
    onError: () => {
      toast({ 
        title: "Failed to save payout batch", 
        variant: "destructive" 
      });
    },
  });

  const onSubmit = (data: FormData) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {batch ? "Edit Payout Batch" : "Create New Payout Batch"}
          </DialogTitle>
          <DialogDescription>
            {batch 
              ? "Update the payout batch details below." 
              : "Create a new batch to organize payouts when you receive checks."
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Batch Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., Week of Jan 15, 2025 Checks" 
                      {...field} 
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
                  <FormLabel>Check Date</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input 
                        type="date" 
                        {...field} 
                        className="pl-10"
                      />
                      <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value || "pending"}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="processed">Processed</SelectItem>
                    </SelectContent>
                  </Select>
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
                    <Textarea 
                      placeholder="Any additional notes about this batch..."
                      className="resize-none"
                      rows={3}
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending 
                  ? (batch ? "Updating..." : "Creating...") 
                  : (batch ? "Update Batch" : "Create Batch")
                }
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}