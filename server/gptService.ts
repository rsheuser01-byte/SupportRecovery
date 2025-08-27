import OpenAI from 'openai';
import { storage } from './storage';

// Initialize OpenAI client
let openai: OpenAI | null = null;

function initializeOpenAI() {
  if (!openai && process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openai;
}

export interface GPTMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface BusinessContext {
  houses: any[];
  staff: any[];
  patients: any[];
  revenueEntries: any[];
  expenses: any[];
  serviceCodes: any[];
  payoutRates: any[];
  timeEntries: any[];
  staffPayments: any[];
  checkTracking: any[];
}

export class GPTService {
  private async getBusinessContext(): Promise<BusinessContext> {
    try {
      const [
        houses,
        staff,
        patients,
        revenueEntries,
        expenses,
        serviceCodes,
        payoutRates,
        timeEntries,
        staffPayments,
        checkTracking
      ] = await Promise.all([
        storage.getHouses(),
        storage.getStaff(),
        storage.getPatients(),
        storage.getRevenueEntries(),
        storage.getExpenses(),
        storage.getServiceCodes(),
        storage.getPayouts(),
        storage.getTimeEntries(),
        storage.getStaffPayments(),
        storage.getCheckTrackingEntries()
      ]);

      return {
        houses,
        staff,
        patients,
        revenueEntries,
        expenses,
        serviceCodes,
        payoutRates,
        timeEntries,
        staffPayments,
        checkTracking
      };
    } catch (error) {
      console.error('Error fetching business context:', error);
      throw new Error('Failed to fetch business data for AI analysis');
    }
  }

  private createSystemPrompt(): string {
    return `You are an AI business assistant for a healthcare support services company. You help with:

BUSINESS ANALYSIS:
- Revenue and expense analysis
- Staff performance insights
- Patient data analysis
- Financial reporting
- Business recommendations

DATA OPERATIONS:
- Data validation and cleaning
- Report generation
- Trend analysis
- Performance metrics

AVAILABLE DATA STRUCTURES:
- Houses: Healthcare facilities with addresses and contact info
- Staff: Employees with roles, contact info, and performance data
- Patients: Client information and service history
- Revenue Entries: Income from services with dates, amounts, and details
- Expenses: Business costs with categories and vendors
- Service Codes: Billing codes for different services
- Payout Rates: Commission percentages for staff
- Time Entries: Hourly employee work records
- Staff Payments: Payment records for staff
- Check Tracking: Payment processing and tracking

RESPONSE FORMAT:
- Provide clear, actionable insights
- Use specific data examples when relevant
- Suggest improvements and optimizations
- Format financial data clearly
- Be professional but conversational

IMPORTANT: Always respect data privacy and provide insights that help improve business operations.`;
  }

  async chat(userMessage: string, conversationHistory: GPTMessage[] = []): Promise<string> {
    try {
      const client = initializeOpenAI();
      if (!client) {
        throw new Error('OpenAI client not initialized. Please check your API key configuration.');
      }

      // Get current business context
      const businessContext = await this.getBusinessContext();
      
      // Create context summary for the AI
      const contextSummary = this.createContextSummary(businessContext);
      
      // Build conversation with system prompt and context
      const messages: GPTMessage[] = [
        { role: 'system', content: this.createSystemPrompt() },
        { role: 'system', content: `Current business context: ${contextSummary}` },
        ...conversationHistory,
        { role: 'user', content: userMessage }
      ];

      const completion = await client.chat.completions.create({
        model: 'gpt-4',
        messages: messages as any,
        max_tokens: 1000,
        temperature: 0.7,
      });

      return completion.choices[0]?.message?.content || 'Sorry, I encountered an error processing your request.';
    } catch (error) {
      console.error('GPT service error:', error);
      return 'I apologize, but I encountered an error while processing your request. Please try again or contact support if the issue persists.';
    }
  }

  private createContextSummary(context: BusinessContext): string {
    const summary = {
      totalHouses: context.houses.length,
      totalStaff: context.staff.length,
      totalPatients: context.patients.length,
      totalRevenue: context.revenueEntries.reduce((sum, entry) => sum + parseFloat(entry.amount), 0),
      totalExpenses: context.expenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0),
      totalServiceCodes: context.serviceCodes.length,
      recentRevenueEntries: context.revenueEntries.length,
      recentExpenses: context.expenses.length,
      pendingTimeEntries: context.timeEntries.filter(entry => !entry.paidAt).length
    };

    return `Business Overview: ${summary.totalHouses} houses, ${summary.totalStaff} staff, ${summary.totalPatients} patients. 
    Financial: $${summary.totalRevenue.toFixed(2)} revenue, $${summary.totalExpenses.toFixed(2)} expenses, 
    ${summary.totalServiceCodes} service codes, ${summary.pendingTimeEntries} unpaid time entries.`;
  }

  // Specialized analysis methods
  async analyzeRevenueTrends(): Promise<string> {
    try {
      const revenueEntries = await storage.getRevenueEntries();
      const houses = await storage.getHouses();
      
      // Group by month and house
      const monthlyData = revenueEntries.reduce((acc, entry) => {
        const date = new Date(entry.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const house = houses.find(h => h.id === entry.houseId);
        
        if (!acc[monthKey]) {
          acc[monthKey] = { total: 0, byHouse: {} };
        }
        
        acc[monthKey].total += parseFloat(entry.amount);
        
        if (!acc[monthKey].byHouse[house?.name || 'Unknown']) {
          acc[monthKey].byHouse[house?.name || 'Unknown'] = 0;
        }
        acc[monthKey].byHouse[house?.name || 'Unknown'] += parseFloat(entry.amount);
        
        return acc;
      }, {} as any);

      const analysis = Object.entries(monthlyData)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, data]: [string, any]) => {
          const houseBreakdown = Object.entries(data.byHouse)
            .map(([house, amount]: [string, number]) => `${house}: $${amount.toFixed(2)}`)
            .join(', ');
          return `${month}: $${data.total.toFixed(2)} (${houseBreakdown})`;
        })
        .join('\n');

      return `Revenue Trend Analysis:\n${analysis}`;
    } catch (error) {
      console.error('Revenue analysis error:', error);
      return 'Unable to analyze revenue trends at this time.';
    }
  }

  async generateBusinessReport(): Promise<string> {
    try {
      const [
        houses,
        staff,
        patients,
        revenueEntries,
        expenses,
        timeEntries
      ] = await Promise.all([
        storage.getHouses(),
        storage.getStaff(),
        storage.getPatients(),
        storage.getRevenueEntries(),
        storage.getExpenses(),
        storage.getTimeEntries()
      ]);

      const totalRevenue = revenueEntries.reduce((sum, entry) => sum + parseFloat(entry.amount), 0);
      const totalExpenses = expenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
      const netIncome = totalRevenue - totalExpenses;
      const unpaidTimeEntries = timeEntries.filter(entry => !entry.paidAt).length;

      const report = `
📊 BUSINESS REPORT

🏢 OPERATIONS:
• Houses: ${houses.length}
• Staff: ${staff.length}
• Patients: ${patients.length}

💰 FINANCIAL SUMMARY:
• Total Revenue: $${totalRevenue.toFixed(2)}
• Total Expenses: $${totalExpenses.toFixed(2)}
• Net Income: $${netIncome.toFixed(2)}
• Profit Margin: ${((netIncome / totalRevenue) * 100).toFixed(1)}%

⏰ PENDING ITEMS:
• Unpaid Time Entries: ${unpaidTimeEntries}

📈 RECOMMENDATIONS:
${this.generateRecommendations(totalRevenue, totalExpenses, unpaidTimeEntries, houses.length, staff.length)}
      `.trim();

      return report;
    } catch (error) {
      console.error('Report generation error:', error);
      return 'Unable to generate business report at this time.';
    }
  }

  private generateRecommendations(revenue: number, expenses: number, unpaidEntries: number, houses: number, staff: number): string {
    const recommendations = [];
    
    if (expenses > revenue * 0.8) {
      recommendations.push('• Consider cost reduction strategies - expenses are high relative to revenue');
    }
    
    if (unpaidEntries > 10) {
      recommendations.push('• Process pending time entries to maintain cash flow');
    }
    
    if (staff > houses * 2) {
      recommendations.push('• Review staff allocation - consider if current staffing levels are optimal');
    }
    
    if (revenue < 10000) {
      recommendations.push('• Focus on revenue growth through new client acquisition and service expansion');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('• Business appears to be operating efficiently');
      recommendations.push('• Continue current strategies and monitor performance');
    }
    
    return recommendations.join('\n');
  }

  async getStaffInsights(): Promise<string> {
    try {
      const staff = await storage.getStaff();
      const timeEntries = await storage.getTimeEntries();
      const payoutRates = await storage.getPayouts();
      
      const staffInsights = staff.map(member => {
        const memberTimeEntries = timeEntries.filter(entry => entry.employeeId === member.id);
        const totalHours = memberTimeEntries.reduce((sum, entry) => {
          const start = new Date(entry.startTime);
          const end = new Date(entry.endTime);
          return sum + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        }, 0);
        
        const unpaidHours = memberTimeEntries
          .filter(entry => !entry.paidAt)
          .reduce((sum, entry) => {
            const start = new Date(entry.startTime);
            const end = new Date(entry.endTime);
            return sum + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
          }, 0);
        
        return {
          name: member.name,
          totalHours: totalHours.toFixed(1),
          unpaidHours: unpaidHours.toFixed(1),
          timeEntries: memberTimeEntries.length
        };
      });
      
      const insights = staffInsights.map(insight => 
        `• ${insight.name}: ${insight.totalHours}h total, ${insight.unpaidHours}h unpaid, ${insight.timeEntries} entries`
      ).join('\n');
      
      return `Staff Performance Insights:\n${insights}`;
    } catch (error) {
      console.error('Staff insights error:', error);
      return 'Unable to generate staff insights at this time.';
    }
  }
}

export const gptService = new GPTService();
