import { neon } from "@neondatabase/serverless";
import fs from 'fs';

// Database connections
const prodDbUrl = "postgresql://neondb_owner:npg_8rJyukcS2hTM@ep-falling-night-a5s5yuo2.us-east-2.aws.neon.tech/neondb?sslmode=require"; // Production database
const newDbUrl = "postgresql://neondb_owner:npg_JELe2kia8YnI@ep-fragrant-art-aezubqms-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require"; // New database

const prodDb = neon(prodDbUrl);
const newDb = neon(newDbUrl);

async function migrateProductionData() {
  try {
    console.log('🚀 Starting production-only data migration...');
    
    // Export queries - only from production database
    const exportQueries = [
      { table: 'revenue_entries', query: 'SELECT id, date, check_date, amount, patient_id, house_id, service_code_id, notes, status, created_at, check_number FROM revenue_entries ORDER BY check_date DESC' },
      { table: 'patients', query: 'SELECT id, name, phone, house_id, program, start_date, status FROM patients ORDER BY name' },
      { table: 'check_tracking', query: 'SELECT id, check_number, check_amount, processed_date, notes, created_at FROM check_tracking ORDER BY processed_date DESC' },
      { table: 'users', query: 'SELECT id, email, first_name, last_name, role, is_approved, approved_by, approved_at, created_at FROM users' }
    ];

    const exportedData = {};

    // Export production data only
    for (const { table, query } of exportQueries) {
      try {
        console.log(`📥 Exporting ${table} from production...`);
        const result = await prodDb(query);
        exportedData[table] = result;
        console.log(`✅ Exported ${result.length} records from ${table}`);
      } catch (error) {
        console.error(`❌ Error exporting ${table}:`, error.message);
        exportedData[table] = [];
      }
    }

    console.log('💾 Production data exported successfully');
    
    // Import only production data to new database
    const importOrder = ['users', 'patients', 'revenue_entries', 'check_tracking'];

    for (const table of importOrder) {
      const data = exportedData[table];
      if (!data || data.length === 0) {
        console.log(`⏭️  Skipping ${table} (no production data)`);
        continue;
      }

      console.log(`📤 Importing ${data.length} production records to ${table}...`);
      
      try {
        const columns = Object.keys(data[0]);
        const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
        const columnNames = columns.join(', ');
        
        let insertQuery = `INSERT INTO ${table} (${columnNames}) VALUES (${placeholders})`;
        
        // Handle conflicts
        if (table === 'users') {
          insertQuery += ` ON CONFLICT (id) DO UPDATE SET ${columns.map(col => col !== 'id' ? `${col} = EXCLUDED.${col}` : null).filter(Boolean).join(', ')}`;
        } else {
          insertQuery += ` ON CONFLICT (id) DO NOTHING`;
        }

        for (const row of data) {
          const values = columns.map(col => row[col]);
          await newDb(insertQuery, values);
        }
        
        console.log(`✅ Successfully imported ${data.length} production records to ${table}`);
      } catch (error) {
        console.error(`❌ Error importing production data to ${table}:`, error.message);
      }
    }
    
    console.log('🎉 Production-only data migration completed successfully!');
    
    // Print summary
    console.log('\n📊 Production Migration Summary:');
    Object.entries(exportedData).forEach(([table, data]) => {
      console.log(`  ${table}: ${data.length} records`);
    });
    
  } catch (error) {
    console.error('💥 Production migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrateProductionData();