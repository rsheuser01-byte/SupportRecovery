-- Export script to extract all data from current database
-- Run this against your current database to export data

-- Export houses
\copy (SELECT id, name, address, is_active FROM houses ORDER BY name) TO 'houses.csv' WITH CSV HEADER;

-- Export service codes
\copy (SELECT id, code, description, is_active FROM service_codes ORDER BY code) TO 'service_codes.csv' WITH CSV HEADER;

-- Export staff
\copy (SELECT id, name, role, is_active FROM staff ORDER BY name) TO 'staff.csv' WITH CSV HEADER;

-- Export patients
\copy (SELECT id, name, phone, house_id, program, start_date, status FROM patients ORDER BY name) TO 'patients.csv' WITH CSV HEADER;

-- Export payout rates
\copy (SELECT id, house_id, service_code_id, staff_id, percentage FROM payout_rates ORDER BY house_id, service_code_id, staff_id) TO 'payout_rates.csv' WITH CSV HEADER;

-- Export revenue entries
\copy (SELECT id, date, check_date, amount, patient_id, house_id, service_code_id, notes, status, created_at, check_number FROM revenue_entries ORDER BY check_date DESC) TO 'revenue_entries.csv' WITH CSV HEADER;

-- Export expenses
\copy (SELECT id, date, amount, vendor, category, description, status, created_at FROM expenses ORDER BY date DESC) TO 'expenses.csv' WITH CSV HEADER;

-- Export payouts
\copy (SELECT id, revenue_entry_id, staff_id, amount FROM payouts ORDER BY revenue_entry_id) TO 'payouts.csv' WITH CSV HEADER;

-- Export check tracking
\copy (SELECT id, check_number, amount, processed_date, notes, created_at FROM check_tracking ORDER BY processed_date DESC) TO 'check_tracking.csv' WITH CSV HEADER;

-- Export business settings
\copy (SELECT id, name, address, phone, email FROM business_settings) TO 'business_settings.csv' WITH CSV HEADER;

-- Export users (careful with sensitive data)
\copy (SELECT id, email, first_name, last_name, role, is_approved, approved_by, approved_at, created_at FROM users) TO 'users.csv' WITH CSV HEADER;

-- Export hourly employees
\copy (SELECT id, name, hourly_rate, is_active FROM hourly_employees ORDER BY name) TO 'hourly_employees.csv' WITH CSV HEADER;

-- Export time entries
\copy (SELECT id, employee_id, date, hours, description, is_paid, paid_expense_id FROM time_entries ORDER BY date DESC) TO 'time_entries.csv' WITH CSV HEADER;

-- Export staff payments
\copy (SELECT id, staff_id, amount, date, description FROM staff_payments ORDER BY date DESC) TO 'staff_payments.csv' WITH CSV HEADER;