import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Shield, Mail } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function PendingApproval() {
  const { user } = useAuth();

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-2xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-6">
            <Clock className="h-12 w-12 text-yellow-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Account Pending Approval
            </h1>
          </div>
        </div>

        {/* Main Card */}
        <Card className="shadow-xl">
          <CardHeader className="bg-yellow-50 dark:bg-yellow-900/20 border-b">
            <CardTitle className="flex items-center text-yellow-800 dark:text-yellow-200">
              <Shield className="h-6 w-6 mr-2" />
              Access Request Submitted
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  Welcome to Support Recovery LLC
                </h3>
                <p className="text-blue-800 dark:text-blue-200 text-sm">
                  Healthcare Management System - Addition Treatment, Behavioral & Mental Health Services
                </p>
              </div>

              <div className="space-y-4">
                <p className="text-gray-700 dark:text-gray-300">
                  Thank you for requesting access to our healthcare management system. Your account has been created but requires approval from an administrator before you can access the system.
                </p>

                {user && (
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Account Details:</h4>
                    <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 mr-2" />
                        {(user as any).email || 'No email available'}
                      </div>
                      <div>
                        <strong>Name:</strong> {(user as any).firstName || 'Not provided'} {(user as any).lastName || ''}
                      </div>
                      <div>
                        <strong>Status:</strong> <span className="text-yellow-600 font-medium">Pending Approval</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
                  <h4 className="font-medium text-orange-900 dark:text-orange-100 mb-2">Next Steps:</h4>
                  <ul className="text-sm text-orange-800 dark:text-orange-200 space-y-1 list-disc list-inside">
                    <li>An administrator has been notified of your access request</li>
                    <li>You will receive approval confirmation once reviewed</li>
                    <li>Please contact your supervisor if you need immediate access</li>
                    <li>Return to this page to check your approval status</li>
                  </ul>
                </div>

                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                  <h4 className="font-medium text-red-900 dark:text-red-100 mb-2">Important Notice:</h4>
                  <p className="text-sm text-red-800 dark:text-red-200">
                    This system contains sensitive healthcare information protected by HIPAA. Access is restricted to authorized personnel only. 
                    Unauthorized access attempts are logged and monitored.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-6">
                <Button 
                  onClick={() => window.location.reload()}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Check Approval Status
                </Button>
                <Button 
                  variant="outline"
                  onClick={handleLogout}
                  className="flex-1"
                >
                  Sign Out
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Need immediate assistance? Contact your system administrator.
          </p>
        </div>
      </div>
    </div>
  );
}