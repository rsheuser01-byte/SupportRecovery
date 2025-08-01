import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertServiceCodeSchema, type ServiceCode, type InsertServiceCode } from "@shared/schema";
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

interface ServiceCodeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceCode?: ServiceCode;
}

export function ServiceCodeModal({ open, onOpenChange, serviceCode }: ServiceCodeModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEdit = !!serviceCode;

  const form = useForm<InsertServiceCode>({
    resolver: zodResolver(insertServiceCodeSchema),
    defaultValues: {
      code: serviceCode?.code || "",
      description: serviceCode?.description || "",
      isActive: serviceCode?.isActive ?? true,
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertServiceCode) => 
      apiRequest("POST", "/api/service-codes", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-codes"] });
      toast({ title: "Service code created successfully" });
      onOpenChange(false);
      form.reset();
    },
    onError: () => {
      toast({ title: "Failed to create service code", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: InsertServiceCode) => 
      apiRequest("PUT", `/api/service-codes/${serviceCode?.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-codes"] });
      toast({ title: "Service code updated successfully" });
      onOpenChange(false);
    },
    onError: () => {
      toast({ title: "Failed to update service code", variant: "destructive" });
    },
  });

  const onSubmit = (data: InsertServiceCode) => {
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
          <DialogTitle>{isEdit ? "Edit Service Code" : "Add New Service Code"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update the service code information" : "Create a new service code for revenue tracking"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Service Code</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., peer support, T2023" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Brief description of the service"
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
                      Enable this service code for new revenue entries
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