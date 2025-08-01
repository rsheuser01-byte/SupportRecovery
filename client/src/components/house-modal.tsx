import { useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertHouseSchema, type House, type InsertHouse } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

interface HouseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  house?: House;
}

export function HouseModal({ open, onOpenChange, house }: HouseModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEdit = !!house;

  const form = useForm<InsertHouse>({
    resolver: zodResolver(insertHouseSchema),
    defaultValues: {
      name: "",
      address: "",
      isActive: true,
    },
  });

  useEffect(() => {
    if (house) {
      form.reset({
        name: house.name || "",
        address: house.address || "",
        isActive: house.isActive ?? true,
      });
    } else {
      form.reset({
        name: "",
        address: "",
        isActive: true,
      });
    }
  }, [house, form]);

  const createMutation = useMutation({
    mutationFn: (data: InsertHouse) => 
      apiRequest("POST", "/api/houses", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/houses"] });
      toast({ title: "House created successfully" });
      onOpenChange(false);
      form.reset();
    },
    onError: () => {
      toast({ title: "Failed to create house", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: InsertHouse) => 
      apiRequest("PUT", `/api/houses/${house?.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/houses"] });
      toast({ title: "House updated successfully" });
      onOpenChange(false);
    },
    onError: () => {
      toast({ title: "Failed to update house", variant: "destructive" });
    },
  });

  const onSubmit = (data: InsertHouse) => {
    if (isEdit) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit House" : "Add New House"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update the house information" : "Create a new house/facility for patient management"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>House Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Greater Faith, Story Lighthouse" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Full address of the facility"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Active Status</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Enable this house for new patient assignments
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value ?? true}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
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
                {createMutation.isPending || updateMutation.isPending ? "Saving..." : isEdit ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}