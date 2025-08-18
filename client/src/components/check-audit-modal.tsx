import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, CheckCircle, DollarSign, FileText, Calendar } from "lucide-react";
import type { CheckTracking, RevenueEntry, House, ServiceCode } from "@shared/schema";

interface CheckAuditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  checkTrackingEntry: CheckTracking;
}

export function CheckAuditModal({ open, onOpenChange, checkTrackingEntry }: CheckAuditModalProps) {
  // Fetch revenue entries that match this check number
  const { data: revenueEntries = [], isLoading: revenueLoading } = useQuery<RevenueEntry[]>({
    queryKey: ['/api/revenue-entries'],
    enabled: open,
  });

  const { data: houses = [] } = useQuery<House[]>({
    queryKey: ['/api/houses'],
    enabled: open,
  });

  const { data: serviceCodes = [] } = useQuery<ServiceCode[]>({
    queryKey: ['/api/service-codes'],
    enabled: open,
  });

  // Filter revenue entries that match this check number
  const matchingRevenueEntries = revenueEntries.filter(
    entry => entry.checkNumber === checkTrackingEntry.checkNumber
  );

  // Calculate totals
  const checkTrackingAmount = parseFloat(checkTrackingEntry.checkAmount);
  const revenueEntriesTotal = matchingRevenueEntries.reduce(
    (sum, entry) => sum + parseFloat(entry.amount), 0
  );
  
  const difference = checkTrackingAmount - revenueEntriesTotal;
  const isBalanced = Math.abs(difference) < 0.01; // Allow for small rounding differences

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Check Audit: {checkTrackingEntry.checkNumber}
          </DialogTitle>
          <DialogDescription>
            Compare check tracking entry with matching revenue entries
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Check Tracking Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Check Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Service Provider</p>
                  <p className="font-medium">{checkTrackingEntry.serviceProvider}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Check Amount</p>
                  <p className="font-medium text-green-600">{formatCurrency(checkTrackingAmount)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Check Date</p>
                  <p className="font-medium">{formatDate(checkTrackingEntry.checkDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Processed Date</p>
                  <p className="font-medium">{formatDate(checkTrackingEntry.processedDate)}</p>
                </div>
              </div>
              {checkTrackingEntry.notes && (
                <div className="mt-3">
                  <p className="text-sm text-gray-600">Notes</p>
                  <p className="text-sm">{checkTrackingEntry.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Audit Results Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {isBalanced ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                )}
                Audit Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Check Amount</p>
                  <p className="font-bold text-lg text-green-600">{formatCurrency(checkTrackingAmount)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Revenue Entries Total</p>
                  <p className="font-bold text-lg text-blue-600">{formatCurrency(revenueEntriesTotal)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Difference</p>
                  <p className={`font-bold text-lg ${difference === 0 ? 'text-green-600' : difference > 0 ? 'text-orange-600' : 'text-red-600'}`}>
                    {formatCurrency(Math.abs(difference))}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <Badge variant={isBalanced ? "default" : "destructive"} className={`text-sm ${isBalanced ? 'bg-green-500 text-white' : ''}`}>
                    {isBalanced ? "Balanced" : "Unbalanced"}
                  </Badge>
                </div>
              </div>
              
              {!isBalanced && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-sm text-yellow-800">
                    {difference > 0 
                      ? `Check amount is ${formatCurrency(difference)} higher than revenue entries. Missing revenue entries?`
                      : `Revenue entries total ${formatCurrency(Math.abs(difference))} more than check amount. Possible duplicate or incorrect entries?`
                    }
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Revenue Entries */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Matching Revenue Entries ({matchingRevenueEntries.length})</span>
                <Badge variant="outline">{formatCurrency(revenueEntriesTotal)}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {revenueLoading ? (
                <div className="text-center py-8">Loading revenue entries...</div>
              ) : matchingRevenueEntries.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No revenue entries found with check number: {checkTrackingEntry.checkNumber}</p>
                  <p className="text-sm mt-2">This could indicate missing revenue entries or incorrect check numbers.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {matchingRevenueEntries.map((entry, index) => {
                    const house = houses.find(h => h.id === entry.houseId);
                    const serviceCode = serviceCodes.find(s => s.id === entry.serviceCodeId);
                    
                    return (
                      <div key={entry.id} className="border rounded-lg p-4 bg-gray-50">
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                          <div>
                            <p className="text-gray-600">Entry #{index + 1}</p>
                            <p className="font-medium">{formatCurrency(parseFloat(entry.amount))}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">House</p>
                            <p className="font-medium">{house?.name || 'Unknown'}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Service Code</p>
                            <p className="font-medium">{serviceCode?.code || 'Unknown'}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Service Date</p>
                            <p className="font-medium">{formatDate(entry.date.toString())}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Check Date</p>
                            <p className="font-medium">{entry.checkDate ? formatDate(entry.checkDate.toString()) : 'N/A'}</p>
                          </div>
                        </div>
                        {entry.notes && (
                          <div className="mt-2 pt-2 border-t border-gray-200">
                            <p className="text-xs text-gray-600">Notes: {entry.notes}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}