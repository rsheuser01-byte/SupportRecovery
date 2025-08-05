import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import type { RevenueEntry } from "@shared/schema";

interface InteractiveCalendarProps {
  revenueEntries: RevenueEntry[];
  onDateSelect: (date: string) => void;
  selectedDate?: string;
}

export default function InteractiveCalendar({ 
  revenueEntries, 
  onDateSelect, 
  selectedDate 
}: InteractiveCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Get unique check dates from revenue entries
  const checkDates = useMemo(() => {
    const dates = new Set<string>();
    revenueEntries.forEach(entry => {
      if (entry.checkDate) {
        const dateStr = new Date(entry.checkDate).toISOString().split('T')[0];
        dates.add(dateStr);
      }
    });
    return Array.from(dates);
  }, [revenueEntries]);

  // Get days in current month
  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      days.push({
        day,
        dateStr,
        hasCheckDate: checkDates.includes(dateStr),
        isSelected: selectedDate === dateStr
      });
    }

    return days;
  };

  const days = getDaysInMonth();
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Check Date Calendar
          </CardTitle>
          <Button variant="outline" size="sm" onClick={goToToday}>
            Today
          </Button>
        </div>
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={goToPreviousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h3 className="text-lg font-semibold">
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </h3>
          <Button variant="ghost" size="sm" onClick={goToNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {dayNames.map(day => (
            <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, index) => (
            <div key={index} className="aspect-square">
              {day ? (
                <Button
                  variant={day.isSelected ? "default" : day.hasCheckDate ? "secondary" : "ghost"}
                  size="sm"
                  className={`w-full h-full p-1 text-sm relative ${
                    day.hasCheckDate ? 'font-semibold' : ''
                  } ${
                    day.isSelected ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => day.hasCheckDate && onDateSelect(day.dateStr)}
                  disabled={!day.hasCheckDate}
                >
                  {day.day}
                  {day.hasCheckDate && (
                    <div className="absolute -top-1 -right-1">
                      <Badge variant="destructive" className="w-2 h-2 p-0 rounded-full">
                        <span className="sr-only">Has check date</span>
                      </Badge>
                    </div>
                  )}
                </Button>
              ) : (
                <div></div>
              )}
            </div>
          ))}
        </div>
        
        <div className="mt-4 text-xs text-gray-500 text-center">
          <div className="flex items-center justify-center gap-2">
            <Badge variant="destructive" className="w-2 h-2 p-0 rounded-full"></Badge>
            <span>Dates with check payouts</span>
          </div>
          <p className="mt-1">Click highlighted dates to view staff payouts</p>
        </div>
      </CardContent>
    </Card>
  );
}