import { Button } from "@/components/ui/button";
import { Shield, Database, Users, BarChart3 } from "lucide-react";
import { getLoginUrl } from "@/lib/authUtils";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-6xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <Shield className="h-12 w-12 text-blue-600 mr-3" />
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              Healthcare Management System
            </h1>
          </div>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Secure, HIPAA-compliant healthcare business management platform for tracking revenue, 
            expenses, and staff payouts across multiple healthcare facilities.
          </p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
            <Database className="h-10 w-10 text-blue-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
              Comprehensive Data Management
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Manage houses, service codes, staff, patients, and revenue entries with automated payout calculations.
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
            <Users className="h-10 w-10 text-green-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
              Staff Payout Tracking
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Configurable percentage rates and automated payout calculations based on revenue entries.
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
            <BarChart3 className="h-10 w-10 text-purple-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
              Advanced Reporting
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Daily reports, revenue visualization, and comprehensive expense tracking with filtering.
            </p>
          </div>
        </div>

        {/* Security Notice */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 mb-12">
          <div className="flex items-center mb-4">
            <Shield className="h-6 w-6 text-yellow-600 mr-2" />
            <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200">
              HIPAA Compliance & Security
            </h3>
          </div>
          <p className="text-yellow-700 dark:text-yellow-300">
            This system handles sensitive healthcare information and requires secure authentication 
            to protect patient privacy and ensure HIPAA compliance. All access is logged and monitored.
          </p>
        </div>

        {/* Login Section */}
        <div className="text-center">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 max-w-md mx-auto">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
              Secure Access Required
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Please log in with your authorized account to access the healthcare management system.
            </p>
            <Button 
              onClick={() => window.location.href = getLoginUrl()}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              <Shield className="h-5 w-5 mr-2" />
              Secure Login
            </Button>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
              Authentication provided by Replit's secure OpenID Connect
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}