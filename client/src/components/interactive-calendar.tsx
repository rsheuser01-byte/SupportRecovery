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
    <Card className="w-full max-w-sm shadow-2xl border-0 bg-gradient-to-br from-blue-600 via-blue-500 to-teal-400 rounded-2xl overflow-hidden">
      <CardHeader className="pb-3 px-6 pt-6">
        <div className="flex items-center justify-between mb-2">
          <CardTitle className="flex items-center gap-2 text-white text-lg font-bold">
            <CalendarIcon className="h-5 w-5" />
            Revenue Calendar
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={goToToday}
            className="bg-white/10 text-white hover:bg-white/20 rounded-lg text-xs px-3 py-1"
          >
            Today
          </Button>
        </div>
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={goToPreviousMonth}
            className="text-white hover:bg-white/10 rounded-lg p-1"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h3 className="text-lg font-bold text-white tracking-wide">
            {monthNames[currentMonth.getMonth()].toUpperCase()} {currentMonth.getFullYear()}
          </h3>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={goToNextMonth}
            className="text-white hover:bg-white/10 rounded-lg p-1"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {dayNames.map(day => (
            <div key={day} className="py-2 text-center text-xs font-bold text-white/90 uppercase tracking-wider">
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
                  variant="ghost"
                  size="sm"
                  className={`w-full h-full p-0 text-sm font-semibold rounded-lg transition-all duration-200 relative ${
                    day.isSelected 
                      ? 'bg-white text-blue-600 shadow-lg transform scale-105' 
                      : day.hasCheckDate 
                        ? 'bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm border border-white/30' 
                        : 'text-white/60 hover:bg-white/10 hover:text-white/80'
                  }`}
                  onClick={() => day.hasCheckDate && onDateSelect(day.dateStr)}
                  disabled={!day.hasCheckDate}
                >
                  <span className="relative z-10">{day.day}</span>
                  {day.hasCheckDate && (
                    <div className="absolute -top-0.5 -right-0.5 z-20">
                      <div className="w-3 h-3 bg-yellow-400 rounded-full flex items-center justify-center shadow-sm">
                        <div className="w-1.5 h-1.5 bg-yellow-600 rounded-full"></div>
                      </div>
                    </div>
                  )}
                </Button>
              ) : (
                <div className="w-full h-full"></div>
              )}
            </div>
          ))}
        </div>
        
        <div className="mt-4 p-3 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
          <div className="flex items-center justify-center gap-2 text-xs font-medium text-white">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-yellow-400 rounded-full flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-yellow-600 rounded-full"></div>
              </div>
              <span>Revenue Dates</span>
            </div>
          </div>
          <p className="mt-1 text-xs text-white/80 text-center">
            Click highlighted dates for daily reports
          </p>
        </div>
      </CardContent>
    </Card>
  );
}