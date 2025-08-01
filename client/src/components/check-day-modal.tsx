import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { type CheckDay } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface CheckDayModalProps {
  isOpen: boolean;
  onClose: () => void;
  checkDay?: CheckDay;
}

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  checkDate: z.string().min(1, "Check date is required"),
  notes: z.string().optional(),
  status: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export function CheckDayModal({ isOpen, onClose, checkDay }: CheckDayModalProps) {
  const { toast } = useToast();
  const isEditing = !!checkDay;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: checkDay?.name || "",
      checkDate: checkDay?.checkDate ? new Date(checkDay.checkDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      notes: checkDay?.notes || "",
      status: checkDay?.status || "pending",
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/check-days", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/check-days"] });
      toast({
        title: "Success",
        description: "Check day created successfully",
      });
      form.reset();
      onClose();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create check day",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => 
      apiRequest("PUT", `/api/check-days/${checkDay?.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/check-days"] });
      toast({
        title: "Success",
        description: "Check day updated successfully",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update check day",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    const processedData = {
      ...data,
      checkDate: new Date(data.checkDate),
    };

    if (isEditing) {
      updateMutation.mutate(processedData);
    } else {
      createMutation.mutate(processedData);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Check Day" : "Create Check Day"}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? "Update the check day details."
              : "Create a new check day to track staff payouts."
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
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Check Day Name" />
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
                    <Input 
                      type="date" 
                      {...field}
                    />
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
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field}
                      value={field.value || ""}
                      placeholder="Optional notes about this check day"
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {(createMutation.isPending || updateMutation.isPending) 
                  ? "Saving..." 
                  : isEditing ? "Update" : "Create"
                }
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}