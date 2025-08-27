import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import fs from 'fs';

// Database connections
const currentDbUrl = process.env.CURRENT_DATABASE_URL; // Your current database
const newDbUrl = process.env.DATABASE_URL; // Your new Neon database

if (!currentDbUrl || !newDbUrl) {
  console.error('Please set CURRENT_DATABASE_URL and DATABASE_URL environment variables');
  process.exit(1);
}

const currentDb = neon(currentDbUrl);
const newDb = neon(newDbUrl);

async function exportData() {
  console.log('🔄 Exporting data from current database...');
  
  const exportQueries = [
    { table: 'houses', query: 'SELECT id, name, address, is_active FROM houses ORDER BY name' },
    { table: 'service_codes', query: 'SELECT id, code, description, is_active FROM service_codes ORDER BY code' },
    { table: 'staff', query: 'SELECT id, name, role, is_active FROM staff ORDER BY name' },
    { table: 'patients', query: 'SELECT id, name, phone, house_id, program, start_date, status FROM patients ORDER BY name' },
    { table: 'payout_rates', query: 'SELECT id, house_id, service_code_id, staff_id, percentage FROM payout_rates ORDER BY house_id' },
    { table: 'revenue_entries', query: 'SELECT id, date, check_date, amount, patient_id, house_id, service_code_id, notes, status, created_at, check_number FROM revenue_entries ORDER BY check_date DESC' },
    { table: 'expenses', query: 'SELECT id, date, amount, vendor, category, description, status, created_at FROM expenses ORDER BY date DESC' },
    { table: 'payouts', query: 'SELECT id, revenue_entry_id, staff_id, amount FROM payouts ORDER BY revenue_entry_id' },
    { table: 'check_tracking', query: 'SELECT id, check_number, amount, processed_date, notes, created_at FROM check_tracking ORDER BY processed_date DESC' },
    { table: 'business_settings', query: 'SELECT id, name, address, phone, email FROM business_settings' },
    { table: 'users', query: 'SELECT id, email, first_name, last_name, role, is_approved, approved_by, approved_at, created_at FROM users' },
    { table: 'hourly_employees', query: 'SELECT id, name, hourly_rate, is_active FROM hourly_employees ORDER BY name' },
    { table: 'time_entries', query: 'SELECT id, employee_id, date, hours, description, is_paid, paid_expense_id FROM time_entries ORDER BY date DESC' },
    { table: 'staff_payments', query: 'SELECT id, staff_id, amount, date, description FROM staff_payments ORDER BY date DESC' }
  ];

  const exportedData = {};

  for (const { table, query } of exportQueries) {
    try {
      console.log(`📥 Exporting ${table}...`);
      const result = await currentDb(query);
      exportedData[table] = result;
      console.log(`✅ Exported ${result.length} records from ${table}`);
    } catch (error) {
      console.error(`❌ Error exporting ${table}:`, error.message);
      exportedData[table] = [];
    }
  }

  // Save to JSON file for backup
  fs.writeFileSync('data-export.json', JSON.stringify(exportedData, null, 2));
  console.log('💾 Data exported to data-export.json');
  
  return exportedData;
}

async function importData(exportedData) {
  console.log('🔄 Importing data to new database...');

  // Define import order to respect foreign key constraints
  const importOrder = [
    'users',
    'houses', 
    'service_codes', 
    'staff', 
    'patients',
    'payout_rates',
    'revenue_entries',
    'expenses',
    'payouts',
    'check_tracking',
    'business_settings',
    'hourly_employees',
    'time_entries',
    'staff_payments'
  ];

  for (const table of importOrder) {
    const data = exportedData[table];
    if (!data || data.length === 0) {
      console.log(`⏭️  Skipping ${table} (no data)`);
      continue;
    }

    console.log(`📤 Importing ${data.length} records to ${table}...`);
    
    try {
      // Build insert query based on table structure
      const columns = Object.keys(data[0]);
      const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
      const columnNames = columns.join(', ');
      
      let insertQuery = `INSERT INTO ${table} (${columnNames}) VALUES (${placeholders})`;
      
      // Handle conflicts - update if exists
      if (table === 'users' || table === 'houses' || table === 'service_codes' || table === 'staff') {
        insertQuery += ` ON CONFLICT (id) DO UPDATE SET ${columns.map(col => col !== 'id' ? `${col} = EXCLUDED.${col}` : null).filter(Boolean).join(', ')}`;
      } else {
        insertQuery += ` ON CONFLICT (id) DO NOTHING`;
      }

      for (const row of data) {
        const values = columns.map(col => row[col]);
        await newDb(insertQuery, values);
      }
      
      console.log(`✅ Successfully imported ${data.length} records to ${table}`);
    } catch (error) {
      console.error(`❌ Error importing to ${table}:`, error.message);
    }
  }
}

async function migrateData() {
  try {
    console.log('🚀 Starting data migration...');
    
    // Export from current database
    const exportedData = await exportData();
    
    // Import to new database
    await importData(exportedData);
    
    console.log('🎉 Data migration completed successfully!');
    
    // Print summary
    console.log('\n📊 Migration Summary:');
    Object.entries(exportedData).forEach(([table, data]) => {
      console.log(`  ${table}: ${data.length} records`);
    });
    
  } catch (error) {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrateData();