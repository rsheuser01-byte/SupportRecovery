import { AlertTriangle, RefreshCw, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useInactivityTimer } from "@/hooks/useInactivityTimer";
import { useState } from "react";

interface InactivityWarningProps {
  onLogout?: () => void;
}

export function InactivityWarning({ onLogout }: InactivityWarningProps) {
  const [showDialog, setShowDialog] = useState(false);

  const { isWarning, timeLeftFormatted, extendSession } = useInactivityTimer({
    timeout: 30 * 60 * 1000, // 30 minutes
    warningTime: 2 * 60 * 1000, // 2 minute warning
    onWarning: () => {
      setShowDialog(true);
    },
    onTimeout: () => {
      setShowDialog(false);
      // Force logout by redirecting to login
      window.location.href = '/api/logout';
    },
  });

  const handleExtendSession = () => {
    extendSession();
    setShowDialog(false);
  };

  const handleLogout = () => {
    setShowDialog(false);
    onLogout?.();
    window.location.href = '/api/logout';
  };

  return (
    <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
      <AlertDialogContent className="sm:max-w-[425px]">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-orange-600">
            <AlertTriangle className="h-5 w-5" />
            Session Expiring Soon
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              Your session will expire in <strong className="text-orange-600">{timeLeftFormatted}</strong> due to inactivity.
            </p>
            <p>
              This saves computing costs and protects sensitive healthcare data.
              Click "Stay Logged In" to continue your session.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleLogout}
            className="flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            Logout Now
          </Button>
          <Button
            onClick={handleExtendSession}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
          >
            <RefreshCw className="h-4 w-4" />
            Stay Logged In
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}