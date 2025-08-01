import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { House, ServiceCode, Staff, PayoutRate } from "@shared/schema";

interface PayoutRatesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  houses: House[];
  serviceCodes: ServiceCode[];
  staff: Staff[];
  payoutRates: PayoutRate[];
}

interface EditableRate {
  id?: string;
  houseId: string;
  serviceCodeId: string;
  staffId: string;
  percentage: string;
  isNew?: boolean;
}

export default function PayoutRatesModal({ 
  open, 
  onOpenChange, 
  houses, 
  serviceCodes, 
  staff, 
  payoutRates 
}: PayoutRatesModalProps) {
  const [editableRates, setEditableRates] = useState<EditableRate[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Initialize editable rates when modal opens
  React.useEffect(() => {
    if (open) {
      const rates: EditableRate[] = [];
      
      // Create entries for all house/service combinations
      houses.forEach(house => {
        serviceCodes.forEach(service => {
          staff.forEach(staffMember => {
            const existingRate = payoutRates.find(
              rate => rate.houseId === house.id && 
                     rate.serviceCodeId === service.id && 
                     rate.staffId === staffMember.id
            );
            
            rates.push({
              id: existingRate?.id,
              houseId: house.id,
              serviceCodeId: service.id,
              staffId: staffMember.id,
              percentage: existingRate ? parseFloat(existingRate.percentage).toFixed(2) : "0.00",
              isNew: !existingRate
            });
          });
        });
      });
      
      setEditableRates(rates);
      setHasChanges(false);
    }
  }, [open, houses, serviceCodes, staff, payoutRates]);

  const updateRateMutation = useMutation({
    mutationFn: async (rates: EditableRate[]) => {
      const promises = rates.map(rate => {
        if (rate.isNew && parseFloat(rate.percentage) > 0) {
          // Create new rate
          return apiRequest('POST', '/api/payout-rates', {
            houseId: rate.houseId,
            serviceCodeId: rate.serviceCodeId,
            staffId: rate.staffId,
            percentage: rate.percentage
          });
        } else if (!rate.isNew && rate.id) {
          // Update existing rate
          return apiRequest('PUT', `/api/payout-rates/${rate.id}`, {
            percentage: rate.percentage
          });
        }
        return Promise.resolve();
      });
      
      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/payout-rates'] });
      toast({ title: "Payout rates updated successfully" });
      setHasChanges(false);
      onOpenChange(false);
    },
    onError: () => {
      toast({ title: "Failed to update payout rates", variant: "destructive" });
    },
  });

  const handlePercentageChange = (houseId: string, serviceCodeId: string, staffId: string, value: string) => {
    // Validate percentage input
    if (value === "" || (!isNaN(parseFloat(value)) && parseFloat(value) >= 0 && parseFloat(value) <= 100)) {
      setEditableRates(prev => 
        prev.map(rate => 
          rate.houseId === houseId && 
          rate.serviceCodeId === serviceCodeId && 
          rate.staffId === staffId
            ? { ...rate, percentage: value }
            : rate
        )
      );
      setHasChanges(true);
    }
  };

  const handleSave = () => {
    // Validate that percentages don't exceed 100% per house/service combination
    const combinationTotals = new Map<string, number>();
    
    editableRates.forEach(rate => {
      const key = `${rate.houseId}-${rate.serviceCodeId}`;
      const percentage = parseFloat(rate.percentage) || 0;
      combinationTotals.set(key, (combinationTotals.get(key) || 0) + percentage);
    });
    
    const invalidCombinations = Array.from(combinationTotals.entries())
      .filter(([_, total]) => total > 100);
    
    if (invalidCombinations.length > 0) {
      toast({ 
        title: "Invalid payout rates", 
        description: "Total percentages cannot exceed 100% for any house/service combination",
        variant: "destructive" 
      });
      return;
    }
    
    updateRateMutation.mutate(editableRates);
  };

  const handleCancel = () => {
    setHasChanges(false);
    onOpenChange(false);
  };

  // Group rates by house and service for display
  const groupedRates = houses.reduce((acc, house) => {
    acc[house.id] = serviceCodes.reduce((serviceAcc, service) => {
      const serviceRates = editableRates.filter(
        rate => rate.houseId === house.id && rate.serviceCodeId === service.id
      );
      if (serviceRates.length > 0) {
        serviceAcc[service.id] = serviceRates;
      }
      return serviceAcc;
    }, {} as Record<string, EditableRate[]>);
    return acc;
  }, {} as Record<string, Record<string, EditableRate[]>>);

  return (
    <Dialog open={open} onOpenChange={hasChanges ? () => {} : onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Payout Rates</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-sm text-gray-600">
            Configure payout percentages for each staff member based on house and service code combinations.
            Total percentages per house/service should not exceed 100%.
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-medium text-gray-900">House</TableHead>
                  <TableHead className="font-medium text-gray-900">Service Code</TableHead>
                  {staff.map(staffMember => (
                    <TableHead key={staffMember.id} className="text-center font-medium text-gray-900">
                      {staffMember.name} (%)
                    </TableHead>
                  ))}
                  <TableHead className="text-center font-medium text-gray-900">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {houses.map(house =>
                  serviceCodes.map(service => {
                    const serviceRates = groupedRates[house.id]?.[service.id];
                    if (!serviceRates) return null;

                    const total = serviceRates.reduce((sum, rate) => sum + (parseFloat(rate.percentage) || 0), 0);
                    const isOverLimit = total > 100;

                    return (
                      <TableRow key={`${house.id}-${service.id}`} className={isOverLimit ? "bg-red-50" : ""}>
                        <TableCell className="font-medium">{house.name}</TableCell>
                        <TableCell>{service.code}</TableCell>
                        {staff.map(staffMember => {
                          const rate = serviceRates.find(r => r.staffId === staffMember.id);
                          return (
                            <TableCell key={staffMember.id} className="text-center">
                              <Input
                                type="number"
                                value={rate?.percentage || "0.00"}
                                onChange={(e) => handlePercentageChange(
                                  house.id, 
                                  service.id, 
                                  staffMember.id, 
                                  e.target.value
                                )}
                                className="w-20 text-center"
                                min="0"
                                max="100"
                                step="0.01"
                              />
                            </TableCell>
                          );
                        })}
                        <TableCell className={`text-center font-medium ${isOverLimit ? "text-red-600" : "text-gray-900"}`}>
                          {total.toFixed(2)}%
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={updateRateMutation.isPending || !hasChanges}
            >
              {updateRateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
