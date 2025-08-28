import OpenAI from 'openai';
import { getStorage } from './storage';

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
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface BusinessContext {
  houses: any[];
  serviceCodes: any[];
  staff: any[];
  patients: any[];
  revenueEntries: any[];
  expenses: any[];
  payouts: any[];
  checkTracking: any[];
  hourlyEmployees: any[];
  timeEntries: any[];
  businessSettings: any;
}

export interface AIAction {
  type: 'query' | 'create' | 'update' | 'delete' | 'analysis';
  entity: string;
  action: string;
  data?: any;
  filters?: any;
}

export class GPTService {
  private async getBusinessContext(): Promise<BusinessContext> {
    try {
      const [
        houses, serviceCodes, staff, patients, revenueEntries,
        expenses, payouts, checkTracking, hourlyEmployees, timeEntries, businessSettings
      ] = await Promise.all([
        getStorage().getHouses(),
        getStorage().getServiceCodes(),
        getStorage().getStaff(),
        getStorage().getPatients(),
        getStorage().getRevenueEntries(),
        getStorage().getExpenses(),
        getStorage().getPayouts(),
        getStorage().getCheckTrackingEntries(),
        getStorage().getHourlyEmployees(),
        getStorage().getTimeEntries(),
        getStorage().getBusinessSettings()
      ]);

      return {
        houses, serviceCodes, staff, patients, revenueEntries,
        expenses, payouts, checkTracking, hourlyEmployees, timeEntries, businessSettings
      };
    } catch (error) {
      console.error('Error fetching business context:', error);
      throw new Error('Failed to fetch business data');
    }
  }

  private createSystemPrompt(): string {
    return `You are an intelligent business assistant for a healthcare services company. You have access to comprehensive business data and can perform various actions.

CAPABILITIES:
1. **Data Query**: Access and analyze all business information
2. **Data Creation**: Add new records (revenue, expenses, patients, staff, etc.)
3. **Data Updates**: Modify existing records
4. **Business Analysis**: Provide insights on revenue, expenses, staff performance, etc.
5. **Action Execution**: Perform business operations through the system

AVAILABLE ENTITIES:
- Houses: Healthcare facilities
- Service Codes: Types of services provided
- Staff: Employees and their roles
- Patients: People receiving services
- Revenue Entries: Income from services
- Expenses: Business costs
- Payouts: Staff payments
- Check Tracking: Payment monitoring
- Hourly Employees: Time-based workers
- Time Entries: Work hours tracking

ACTIONS YOU CAN PERFORM:
- Query data with filters and analysis
- Create new records
- Update existing records
- Generate reports and insights
- Calculate totals and trends
- Provide business recommendations

When a user asks you to do something, determine if it's a query, analysis, or action request. For actions, provide clear instructions on what needs to be done. Always be helpful, accurate, and business-focused.`;
  }

  async chat(userMessage: string, conversationHistory: GPTMessage[] = []): Promise<string> {
    try {
      const client = initializeOpenAI();
      if (!client) {
        throw new Error('OpenAI client not initialized. Please check your API key configuration.');
      }

      const businessContext = await this.getBusinessContext();
      const contextSummary = this.createContextSummary(businessContext);
      
      const messages: GPTMessage[] = [
        { role: 'system', content: this.createSystemPrompt() },
        { role: 'system', content: `Current business context: ${contextSummary}` },
        ...conversationHistory,
        { role: 'user', content: userMessage }
      ];

      const completion = await client.chat.completions.create({
        model: 'gpt-4',
        messages: messages as any,
        max_tokens: 1500,
        temperature: 0.7,
      });

      return completion.choices[0]?.message?.content || 'Sorry, I encountered an error processing your request.';
    } catch (error) {
      console.error('GPT chat error:', error);
      return 'I apologize, but I encountered an error. Please try again or contact support.';
    }
  }

  private createContextSummary(context: BusinessContext): string {
    const summary = [];
    
    if (context.houses.length > 0) summary.push(`${context.houses.length} houses/facilities`);
    if (context.serviceCodes.length > 0) summary.push(`${context.serviceCodes.length} service types`);
    if (context.staff.length > 0) summary.push(`${context.staff.length} staff members`);
    if (context.patients.length > 0) summary.push(`${context.patients.length} patients`);
    if (context.revenueEntries.length > 0) summary.push(`${context.revenueEntries.length} revenue entries`);
    if (context.expenses.length > 0) summary.push(`${context.expenses.length} expense records`);
    if (context.hourlyEmployees.length > 0) summary.push(`${context.hourlyEmployees.length} hourly employees`);
    if (context.timeEntries.length > 0) summary.push(`${context.timeEntries.length} time entries`);
    
    return summary.join(', ') || 'No data available';
  }

  // Enhanced analysis methods with full data access
  async analyzeRevenueTrends(): Promise<string> {
    try {
      const context = await this.getBusinessContext();
      const revenue = context.revenueEntries;
      const expenses = context.expenses;
      
      if (revenue.length === 0) {
        return "No revenue data available for analysis.";
      }

      // Group revenue by month
      const monthlyRevenue = revenue.reduce((acc, entry) => {
        const month = new Date(entry.date).toISOString().slice(0, 7);
        acc[month] = (acc[month] || 0) + Number(entry.amount);
        return acc;
      }, {} as Record<string, number>);

      // Group expenses by month
      const monthlyExpenses = expenses.reduce((acc, expense) => {
        const month = new Date(expense.date).toISOString().slice(0, 7);
        acc[month] = (acc[month] || 0) + Number(expense.amount);
        return acc;
      }, {} as Record<string, number>);

      const months = Object.keys(monthlyRevenue).sort();
      const totalRevenue = revenue.reduce((sum, entry) => sum + Number(entry.amount), 0);
      const totalExpenses = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
      const netIncome = totalRevenue - totalExpenses;

      let analysis = `📊 **Revenue Trends Analysis**\n\n`;
      analysis += `**Total Revenue**: $${totalRevenue.toFixed(2)}\n`;
      analysis += `**Total Expenses**: $${totalExpenses.toFixed(2)}\n`;
      analysis += `**Net Income**: $${netIncome.toFixed(2)}\n\n`;

      if (months.length > 1) {
        analysis += `**Monthly Breakdown**:\n`;
        months.forEach(month => {
          const rev = monthlyRevenue[month] || 0;
          const exp = monthlyExpenses[month] || 0;
          const net = rev - exp;
          analysis += `${month}: Revenue $${rev.toFixed(2)}, Expenses $${exp.toFixed(2)}, Net $${net.toFixed(2)}\n`;
        });
      }

      // Top performing houses
      const houseRevenue = revenue.reduce((acc, entry) => {
        const house = context.houses.find(h => h.id === entry.houseId);
        const houseName = house?.name || 'Unknown House';
        acc[houseName] = (acc[houseName] || 0) + Number(entry.amount);
        return acc;
      }, {} as Record<string, number>);

      const topHouses = Object.entries(houseRevenue)
        .sort(([,a], [,b]) => Number(b) - Number(a))
        .slice(0, 3);

      if (topHouses.length > 0) {
        analysis += `\n**Top Performing Houses**:\n`;
        topHouses.forEach(([house, amount]) => {
          analysis += `• ${house}: $${Number(amount).toFixed(2)}\n`;
        });
      }

      return analysis;
    } catch (error) {
      console.error('Revenue trends error:', error);
      return 'Failed to analyze revenue trends. Please try again.';
    }
  }

  async generateBusinessReport(): Promise<string> {
    try {
      const context = await this.getBusinessContext();
      
      const totalRevenue = context.revenueEntries.reduce((sum, entry) => sum + Number(entry.amount), 0);
      const totalExpenses = context.expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
      const netIncome = totalRevenue - totalExpenses;
      const unpaidEntries = context.revenueEntries.filter(entry => entry.status !== 'paid').length;
      const activePatients = context.patients.filter(patient => patient.status === 'active').length;
      const activeStaff = context.staff.filter(member => member.isActive).length;

      let report = `📋 **Comprehensive Business Report**\n\n`;
      report += `**Financial Summary**:\n`;
      report += `• Total Revenue: $${totalRevenue.toFixed(2)}\n`;
      report += `• Total Expenses: $${totalExpenses.toFixed(2)}\n`;
      report += `• Net Income: $${netIncome.toFixed(2)}\n`;
      report += `• Unpaid Entries: ${unpaidEntries}\n\n`;

      report += `**Operations Summary**:\n`;
      report += `• Active Houses: ${context.houses.filter(h => h.isActive).length}\n`;
      report += `• Active Patients: ${activePatients}\n`;
      report += `• Active Staff: ${activeStaff}\n`;
      report += `• Service Types: ${context.serviceCodes.filter(s => s.isActive).length}\n`;
      report += `• Hourly Employees: ${context.hourlyEmployees.filter(e => e.isActive).length}\n\n`;

      // Recent activity
      const recentRevenue = context.revenueEntries
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5);

      if (recentRevenue.length > 0) {
        report += `**Recent Revenue Activity**:\n`;
        recentRevenue.forEach(entry => {
          const house = context.houses.find(h => h.id === entry.houseId)?.name || 'Unknown';
          const date = new Date(entry.date).toLocaleDateString();
          report += `• ${date}: $${Number(entry.amount).toFixed(2)} at ${house}\n`;
        });
      }

      // Recommendations
      const recommendations = this.generateRecommendations(
        totalRevenue, totalExpenses, unpaidEntries, 
        context.houses.length, context.staff.length
      );
      report += `\n**Recommendations**:\n${recommendations}`;

      return report;
    } catch (error) {
      console.error('Business report error:', error);
      return 'Failed to generate business report. Please try again.';
    }
  }

  private generateRecommendations(revenue: number, expenses: number, unpaidEntries: number, houses: number, staff: number): string {
    const recommendations = [];
    
    if (unpaidEntries > 0) {
      recommendations.push(`• Follow up on ${unpaidEntries} unpaid entries to improve cash flow`);
    }
    
    if (expenses > revenue * 0.8) {
      recommendations.push('• Review expenses - they represent over 80% of revenue');
    }
    
    if (houses > 0 && staff > 0) {
      const staffPerHouse = staff / houses;
      if (staffPerHouse < 2) {
        recommendations.push('• Consider increasing staff coverage per facility');
      }
    }
    
    if (revenue > 0) {
      const profitMargin = ((revenue - expenses) / revenue) * 100;
      if (profitMargin < 20) {
        recommendations.push('• Focus on improving profit margins through cost control or pricing');
      }
    }
    
    if (recommendations.length === 0) {
      recommendations.push('• Business appears to be running well - maintain current practices');
    }
    
    return recommendations.join('\n');
  }

  async getStaffInsights(): Promise<string> {
    try {
      const context = await this.getBusinessContext();
      
      let insights = `👥 **Staff Performance Insights**\n\n`;
      
      // Staff overview
      const activeStaff = context.staff.filter(member => member.isActive);
      insights += `**Active Staff**: ${activeStaff.length}\n`;
      
      // Role distribution
      const roleCounts = activeStaff.reduce((acc, member) => {
        acc[member.role || 'Unspecified'] = (acc[member.role || 'Unspecified'] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      if (Object.keys(roleCounts).length > 0) {
        insights += `**Role Distribution**:\n`;
        Object.entries(roleCounts).forEach(([role, count]) => {
          insights += `• ${role}: ${count} staff members\n`;
        });
      }
      
      // Hourly employee insights
      if (context.hourlyEmployees.length > 0) {
        const avgHourlyRate = context.hourlyEmployees
          .filter(e => e.isActive)
          .reduce((sum, emp) => sum + Number(emp.hourlyRate), 0) / 
          context.hourlyEmployees.filter(e => e.isActive).length;
        
        insights += `\n**Hourly Employees**:\n`;
        insights += `• Average Hourly Rate: $${avgHourlyRate.toFixed(2)}\n`;
        insights += `• Total Active: ${context.hourlyEmployees.filter(e => e.isActive).length}\n`;
      }
      
      // Time tracking insights
      if (context.timeEntries.length > 0) {
        const totalHours = context.timeEntries.reduce((sum, entry) => sum + Number(entry.hours), 0);
        const unpaidHours = context.timeEntries
          .filter(entry => !entry.isPaid)
          .reduce((sum, entry) => sum + Number(entry.hours), 0);
        
        insights += `\n**Time Tracking**:\n`;
        insights += `• Total Hours Tracked: ${totalHours.toFixed(2)}\n`;
        insights += `• Unpaid Hours: ${unpaidHours.toFixed(2)}\n`;
        insights += `• Payment Rate: ${((totalHours - unpaidHours) / totalHours * 100).toFixed(1)}%\n`;
      }
      
      return insights;
    } catch (error) {
      console.error('Staff insights error:', error);
      return 'Failed to generate staff insights. Please try again.';
    }
  }

  // New method for comprehensive data queries
  async queryBusinessData(query: string): Promise<string> {
    try {
      const context = await this.getBusinessContext();
      
      // This would be enhanced with more sophisticated query parsing
      // For now, we'll use the existing analysis methods
      if (query.toLowerCase().includes('revenue') || query.toLowerCase().includes('income')) {
        return await this.analyzeRevenueTrends();
      } else if (query.toLowerCase().includes('staff') || query.toLowerCase().includes('employee')) {
        return await this.getStaffInsights();
      } else if (query.toLowerCase().includes('report') || query.toLowerCase().includes('summary')) {
        return await this.generateBusinessReport();
      } else {
        return await this.chat(query);
      }
    } catch (error) {
      console.error('Data query error:', error);
      return 'Failed to query business data. Please try again.';
    }
  }

  // New method for intelligent action understanding
  async understandAndExecuteAction(userInput: string): Promise<string> {
    try {
      const client = initializeOpenAI();
      if (!client) {
        throw new Error('OpenAI client not initialized. Please check your API key configuration.');
      }

      const businessContext = await this.getBusinessContext();
      const contextSummary = this.createContextSummary(businessContext);
      
      const actionPrompt = `You are an AI business assistant that can understand user requests and provide specific guidance for business operations.

AVAILABLE ACTIONS:
1. **Create Revenue Entry**: Add new income records
2. **Create Expense**: Add new expense records  
3. **Create Patient**: Add new patient records
4. **Create Staff**: Add new staff members
5. **Create House**: Add new facilities
6. **Create Service Code**: Add new service types
7. **Data Analysis**: Provide business insights and reports

USER REQUEST: "${userInput}"

BUSINESS CONTEXT: ${contextSummary}
AVAILABLE HOUSES (use the ID, not the name):
${businessContext.houses.map(h => `- ${h.name} (ID: ${h.id})`).join('\n')}

AVAILABLE SERVICE CODES (use the ID, not the code):
${businessContext.serviceCodes.map(s => `- ${s.code} - ${s.description} (ID: ${s.id})`).join('\n')}

CRITICAL: Return ONLY the JSON response. Do NOT include any explanatory text, comments, or other content before or after the JSON. The response must be pure JSON that can be parsed directly.

For revenue entries, you need: date, checkDate, amount, houseId (must be the actual database ID, not the name), serviceCodeId (must be the actual database ID, not the code)
INSTRUCTIONS:
- Analyze the user's request
- Determine what action they want to perform
- If they want to CREATE something, provide a clear template with required fields
- If they want ANALYSIS, provide insights based on available data
- If they want to VIEW data, explain what's available
- Be specific about what information is needed
- Use the business context to provide relevant examples

RESPONSE FORMAT:
- Be conversational and helpful
- Provide clear next steps
- Include examples when helpful
- Format financial data clearly
- Use bullet points for clarity`;

      const messages = [
        { role: 'system', content: actionPrompt },
        { role: 'user', content: userInput }
      ];

      const completion = await client.chat.completions.create({
        model: 'gpt-4',
        messages: messages as any,
        max_tokens: 1000,
        temperature: 0.7,
      });

      return completion.choices[0]?.message?.content || 'I apologize, but I need more information to help you.';
    } catch (error) {
      console.error('Action understanding error:', error);
      return 'I encountered an error while processing your request. Please try again.';
    }
  }

  // New method to actually execute actions
  async executeAction(userInput: string, conversationHistory: GPTMessage[] = []): Promise<string> {
    try {
      const client = initializeOpenAI();
      if (!client) {
        throw new Error('OpenAI client not initialized. Please check your API key configuration.');
      }

      const businessContext = await this.getBusinessContext();
      const contextSummary = this.createContextSummary(businessContext);
      
      const actionPrompt = `You are an AI business assistant that can understand user requests and EXECUTE business operations.

AVAILABLE ACTIONS:
1. **Create Revenue Entry**: Add new income records
2. **Create Expense**: Add new expense records  
3. **Create Patient**: Add new patient records
4. **Create Staff**: Add new staff members
5. **Create House**: Add new facilities
6. **Create Service Code**: Add new service types

USER REQUEST: "${userInput}"

BUSINESS CONTEXT: ${contextSummary}

CONVERSATION HISTORY: ${conversationHistory.map(m => `${m.role}: ${m.content}`).join('\n')}

AVAILABLE HOUSES (use the ID, not the name):
${businessContext.houses.map(h => `- ${h.name} (ID: ${h.id})`).join('\n')}

AVAILABLE SERVICE CODES (use the ID, not the code):
${businessContext.serviceCodes.map(s => `- ${s.code} - ${s.description} (ID: ${s.id})`).join('\n')}

CRITICAL INSTRUCTIONS:
- You MUST return ONLY a JSON response
- NO explanatory text, NO comments, NO other content
- The response must start with { and end with }
- If you have ALL required information, return the JSON action
- If you DON'T have enough information, return JSON asking for missing details

REQUIRED FIELDS:
- Revenue entries: date, checkDate, amount, houseId (use actual ID), serviceCodeId (use actual ID)
- Expenses: date, amount, vendor, category
- Patients: name
- Staff: name

EXAMPLE RESPONSES:

✅ CORRECT - Create expense (when you have all info):
{
  "action": "create_expense",
  "data": {
    "date": "today",
    "amount": 50,
    "vendor": "Office Supplies",
    "category": "Supplies"
  },
  "message": "Expense created successfully"
}

✅ CORRECT - Ask for missing info:
{
  "action": "ask_for_info",
  "missing_fields": ["vendor", "category"],
  "message": "I need the vendor name and category to create this expense"
}

❌ WRONG - Never do this:
I will create an expense for you. Here's what I need...

REMEMBER: Your response must be PURE JSON starting with { and ending with }. No text before or after.`;

      const messages = [
        { role: 'system', content: 'You are a JSON-only response system. You must ALWAYS return valid JSON. Never include explanatory text.' },
        { role: 'user', content: actionPrompt }
      ];

      const completion = await client.chat.completions.create({
        model: 'gpt-4',
        messages: messages as any,
        max_tokens: 1000,
        temperature: 0.1, // Very low temperature for consistent action parsing
      });

      const response = completion.choices[0]?.message?.content || 'I apologize, but I need more information to help you.';
      
      console.log('=== AI RESPONSE DEBUG ===');
      console.log('AI Response:', response);
      console.log('Response type:', typeof response);
      console.log('Response length:', response.length);
      console.log('Response starts with JSON?', response.trim().startsWith('{'));
      console.log('Response ends with }?', response.trim().endsWith('}'));
      console.log('=== END DEBUG ===');
      
      // Try to parse the response as JSON to see if it's an action
      try {
        const actionData = JSON.parse(response);
        if (actionData.action && actionData.data) {
          console.log('Executing action:', actionData.action, 'with data:', actionData.data);
          // Execute the action
          return await this.performAction(actionData.action, actionData.data);
        }
      } catch (parseError) {
        console.log('Response is not JSON, trying to extract JSON from text');
        console.log('Parse error:', parseError);
        
        // Try to extract JSON from the response if it contains extra text
        try {
          // Look for JSON-like content between curly braces
          const jsonMatch = response.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const jsonString = jsonMatch[0];
            console.log('Extracted JSON string:', jsonString);
            const actionData = JSON.parse(jsonString);
            if (actionData.action && actionData.data) {
              console.log('Extracted and executing action:', actionData.action, 'with data:', actionData.data);
              // Execute the action
              return await this.performAction(actionData.action, actionData.data);
            }
          } else {
            console.log('No JSON pattern found in response');
          }
        } catch (extractError) {
          console.log('Could not extract JSON from response:', extractError);
        }
        
        // Not JSON, return as regular response
        return response;
      }

      return response;
    } catch (error) {
      console.error('Action execution error:', error);
      return 'I encountered an error while processing your request. Please try again.';
    }
  }

    // Enhanced chat method that can handle actions
    async enhancedChat(userMessage: string, conversationHistory: GPTMessage[] = []): Promise<string> {
      try {
        // Check if this is an action request
        const actionKeywords = ['add', 'create', 'new', 'enter', 'record', 'input', 'make'];
        const isActionRequest = actionKeywords.some(keyword => 
          userMessage.toLowerCase().includes(keyword)
        );
  
        if (isActionRequest) {
          return await this.executeAction(userMessage, conversationHistory);
        }
  
        // Regular chat for analysis and questions
        return await this.chat(userMessage, conversationHistory);
      } catch (error) {
        console.error('Enhanced chat error:', error);
        return 'I apologize, but I encountered an error. Please try again.';
      }
    }
  
  // New method to perform the actual database operations
  private async performAction(actionType: string, data: any): Promise<string> {
    try {
      console.log('performAction called with:', { actionType, data });
      
      // Helper function to convert date strings to Date objects
      const convertDate = (dateValue: any): Date => {
        if (dateValue === 'today') {
          return new Date();
        }
        if (typeof dateValue === 'string') {
          const parsed = new Date(dateValue);
          if (!isNaN(parsed.getTime())) {
            return parsed;
          }
        }
        if (dateValue instanceof Date) {
          return dateValue;
        }
        // Default to today if date is invalid
        return new Date();
      };

      switch (actionType) {
        case 'create_revenue':
          console.log('Creating revenue entry with data:', data);
          const revenueData = {
            ...data,
            date: convertDate(data.date),
            checkDate: convertDate(data.checkDate || data.date)
          };
          console.log('Processed revenue data:', revenueData);
          await getStorage().createRevenueEntry(revenueData);
          return `Successfully created revenue entry for $${data.amount} on ${revenueData.date.toLocaleDateString()} (House: ${data.houseId}, Service: ${data.serviceCodeId})`;
        
        case 'create_expense':
          console.log('Creating expense with data:', data);
          const expenseData = {
            ...data,
            date: convertDate(data.date)
          };
          console.log('Processed expense data:', expenseData);
          try {
            const createdExpense = await getStorage().createExpense(expenseData);
            console.log('Expense created successfully:', createdExpense);
            return `Successfully created expense entry for $${data.amount} on ${expenseData.date.toLocaleDateString()} (Vendor: ${data.vendor}, Category: ${data.category})`;
          } catch (error) {
            console.error('Error creating expense:', error);
            throw error;
          }
        
        case 'create_patient':
          console.log('Creating patient with data:', data);
          const patientData = {
            ...data,
            startDate: data.startDate ? convertDate(data.startDate) : null
          };
          console.log('Processed patient data:', patientData);
          await getStorage().createPatient(patientData);
          return `Successfully created patient: ${data.name}`;
        
        case 'create_staff':
          console.log('Creating staff with data:', data);
          await getStorage().createStaff(data);
          return `Successfully created staff member: ${data.name}`;
        
        case 'create_house':
          console.log('Creating house with data:', data);
          await getStorage().createHouse(data);
          return `Successfully created house: ${data.name}`;
        
        case 'create_service_code':
          console.log('Creating service code with data:', data);
          await getStorage().createServiceCode(data);
          return `Successfully created service code: ${data.code}`;
        
        default:
          return `Action type "${actionType}" not recognized.`;
      }
    } catch (error) {
      console.error('Action execution failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return `Failed to perform action "${actionType}". Error: ${errorMessage}`;
    }
  }
}
  
  export const gptService = new GPTService();
