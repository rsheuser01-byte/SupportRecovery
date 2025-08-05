import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, DollarSign } from "lucide-react";
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
    <Card className="w-full max-w-md shadow-lg border-0 bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/50 backdrop-blur-sm">
      <CardHeader className="pb-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3 text-white">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <CalendarIcon className="h-5 w-5" />
            </div>
            <span className="font-semibold">Revenue Calendar</span>
          </CardTitle>
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={goToToday}
            className="bg-white/20 text-white border-white/30 hover:bg-white/30 backdrop-blur-sm transition-all duration-200"
          >
            Today
          </Button>
        </div>
        <div className="flex items-center justify-between mt-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={goToPreviousMonth}
            className="text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-all duration-200"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h3 className="text-xl font-bold text-white">
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </h3>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={goToNextMonth}
            className="text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-all duration-200"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-2 mb-4">
          {dayNames.map(day => (
            <div key={day} className="p-3 text-center text-sm font-semibold text-slate-600 bg-slate-50 rounded-lg">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-2">
          {days.map((day, index) => (
            <div key={index} className="aspect-square">
              {day ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className={`w-full h-full p-1 text-sm relative rounded-xl font-medium transition-all duration-300 transform hover:scale-105 ${
                    day.isSelected 
                      ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg ring-2 ring-blue-300 ring-offset-2' 
                      : day.hasCheckDate 
                        ? 'bg-gradient-to-br from-emerald-100 to-green-200 text-green-800 border-2 border-green-300 hover:from-emerald-200 hover:to-green-300 shadow-md' 
                        : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'
                  }`}
                  onClick={() => day.hasCheckDate && onDateSelect(day.dateStr)}
                  disabled={!day.hasCheckDate}
                >
                  <span className="relative z-10">{day.day}</span>
                  {day.hasCheckDate && (
                    <div className="absolute -top-1 -right-1 z-20">
                      <div className="w-4 h-4 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                        <DollarSign className="w-2.5 h-2.5 text-white" />
                      </div>
                    </div>
                  )}
                  {day.hasCheckDate && (
                    <div className="absolute inset-0 bg-gradient-to-br from-green-400/20 to-emerald-500/20 rounded-xl"></div>
                  )}
                </Button>
              ) : (
                <div className="w-full h-full"></div>
              )}
            </div>
          ))}
        </div>
        
        <div className="mt-6 p-4 bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl border border-slate-200">
          <div className="flex items-center justify-center gap-3 text-sm font-medium text-slate-700">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center">
                <DollarSign className="w-2.5 h-2.5 text-white" />
              </div>
              <span>Revenue Entry Dates</span>
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-500 text-center">
            Click highlighted dates to view detailed revenue reports
          </p>
        </div>
      </CardContent>
    </Card>
  );
}