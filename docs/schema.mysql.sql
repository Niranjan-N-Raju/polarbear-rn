-- MySQL 8.0.16+ / InnoDB. Reference schema for a future MongoDB migration.
-- Run against an EMPTY database selected by the operator. This file does not
-- migrate data, change the application, create database accounts, or drop tables.
-- Database connections belong in the backend, never in the React Native client.
-- Import users/stores first, then employee profiles and dependent records.
-- mongo_id preserves source ObjectIds for migration mapping; SQL foreign keys
-- reference numeric IDs, not public employee codes or MongoDB ObjectIds.
-- Store UTC timestamps; use DATE for business dates and the first day of a month
-- for salary/P&L periods. Custom salary-cycle ranges remain backend calculations.
-- Keep password hashes and existing application-encrypted PII encrypted.
-- Archive users/stores instead of deleting financial or attendance history.

SET NAMES utf8mb4;
SET time_zone = '+00:00';

CREATE TABLE users (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    mongo_id CHAR(24) CHARACTER SET ascii COLLATE ascii_bin NULL,
    email VARCHAR(254) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(150) NOT NULL,
    role ENUM('admin', 'sub_admin', 'franchise_admin', 'employee') NOT NULL DEFAULT 'employee',
    preferred_language ENUM('en', 'kn') NOT NULL DEFAULT 'en',
    phone VARCHAR(32) NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    session_version BIGINT UNSIGNED NOT NULL DEFAULT 0,
    must_change_password BOOLEAN NOT NULL DEFAULT FALSE,
    archived_at DATETIME(3) NULL,
    created_by BIGINT UNSIGNED NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (id),
    UNIQUE KEY uq_users_mongo (mongo_id),
    UNIQUE KEY uq_users_email (email),
    KEY ix_users_role_active (role, is_active),
    KEY ix_users_creator_role (created_by, role),
    CONSTRAINT fk_users_creator FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE RESTRICT,
    CONSTRAINT ck_users_active CHECK (is_active IN (0, 1)),
    CONSTRAINT ck_users_password_change CHECK (must_change_password IN (0, 1))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- File bytes remain in private object storage or a separate file service.
CREATE TABLE files (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    mongo_id CHAR(24) CHARACTER SET ascii COLLATE ascii_bin NULL,
    storage_key VARCHAR(512) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    content_type VARCHAR(150) NOT NULL,
    byte_size BIGINT UNSIGNED NOT NULL,
    uploaded_by BIGINT UNSIGNED NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (id),
    UNIQUE KEY uq_files_mongo (mongo_id),
    CONSTRAINT fk_files_uploader FOREIGN KEY (uploaded_by) REFERENCES users (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE stores (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    mongo_id CHAR(24) CHARACTER SET ascii COLLATE ascii_bin NULL,
    store_code VARCHAR(80) NOT NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT NULL,
    address TEXT NULL,
    phone VARCHAR(32) NULL,
    store_type ENUM('company', 'franchise') NOT NULL DEFAULT 'franchise',
    owner_name VARCHAR(150) NULL,
    owner_phone VARCHAR(32) NULL,
    owner_email VARCHAR(254) NULL,
    logo_file_id BIGINT UNSIGNED NULL,
    salary_cycle_type ENUM('calendar_month', 'custom') NOT NULL DEFAULT 'calendar_month',
    salary_cycle_start_day TINYINT UNSIGNED NOT NULL DEFAULT 1,
    salary_cycle_end_day TINYINT UNSIGNED GENERATED ALWAYS AS (
        CASE WHEN salary_cycle_type = 'calendar_month' THEN 31 ELSE salary_cycle_start_day - 1 END
    ) STORED,
    salary_cycle_configured_at DATETIME(3) NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    archived_at DATETIME(3) NULL,
    created_by BIGINT UNSIGNED NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (id),
    UNIQUE KEY uq_stores_mongo (mongo_id),
    UNIQUE KEY uq_stores_code (store_code),
    KEY ix_stores_type_active (store_type, is_active),
    CONSTRAINT fk_stores_logo FOREIGN KEY (logo_file_id) REFERENCES files (id) ON DELETE RESTRICT,
    CONSTRAINT fk_stores_creator FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE RESTRICT,
    CONSTRAINT ck_stores_cycle CHECK (
        (salary_cycle_type = 'calendar_month' AND salary_cycle_start_day = 1)
        OR (salary_cycle_type = 'custom' AND salary_cycle_start_day BETWEEN 2 AND 28)
    ),
    CONSTRAINT ck_stores_active CHECK (is_active IN (0, 1))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Many-to-many assignments for users and stores. The backend still enforces role,
-- ownership, and the current rule that an employee has one assigned store.
-- Historical attendance/payroll references stores directly, not this mutable link.
CREATE TABLE user_stores (
    user_id BIGINT UNSIGNED NOT NULL,
    store_id BIGINT UNSIGNED NOT NULL,
    assigned_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (user_id, store_id),
    KEY ix_user_stores_store (store_id, user_id),
    CONSTRAINT fk_user_stores_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE RESTRICT,
    CONSTRAINT fk_user_stores_store FOREIGN KEY (store_id) REFERENCES stores (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- One employee profile per employee-role user. employee_number is the separate
-- global auto-increment sequence: EMP0001, EMP0002, etc. See employee_directory.
-- Preserve existing EMP codes by explicitly importing their numeric suffix here.
-- Import older employees first when assigning missing IDs; never reseed downward.
-- Create user + employee profile + store assignment in one backend transaction.
-- Employee creation must allocate and return the public code server-side;
-- clients must never supply or change employee numbers. MongoDB uses the shared
-- employee_counters collection; SQL uses this table's AUTO_INCREMENT instead.
CREATE TABLE employee_profiles (
    employee_number BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id BIGINT UNSIGNED NOT NULL,
    position VARCHAR(100) NULL,
    employment_type ENUM('full_time', 'part_time') NULL,
    salary DECIMAL(14,2) NULL,
    date_of_joining DATE NULL,
    actual_dob DATE NULL,
    dob_in_records DATE NULL,
    emergency_contact_name VARCHAR(150) NULL,
    emergency_contact_phone VARCHAR(32) NULL,
    emergency_contact_relationship VARCHAR(100) NULL,
    aadhar_number_encrypted TEXT NULL,
    pan_number_encrypted TEXT NULL,
    bank_account_number_encrypted TEXT NULL,
    bank_name_encrypted TEXT NULL,
    bank_ifsc_encrypted TEXT NULL,
    bank_branch_encrypted TEXT NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (employee_number),
    UNIQUE KEY uq_employee_profiles_user (user_id),
    CONSTRAINT fk_employee_profiles_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE RESTRICT,
    CONSTRAINT ck_employee_profiles_salary CHECK (salary IS NULL OR salary >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE employee_documents (
    employee_id BIGINT UNSIGNED NOT NULL,
    document_type ENUM('aadhar', 'pan') NOT NULL,
    file_id BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (employee_id, document_type),
    CONSTRAINT fk_employee_documents_employee FOREIGN KEY (employee_id) REFERENCES employee_profiles (employee_number) ON DELETE RESTRICT,
    CONSTRAINT fk_employee_documents_file FOREIGN KEY (file_id) REFERENCES files (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE store_positions (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    store_id BIGINT UNSIGNED NOT NULL,
    name VARCHAR(100) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_store_positions_name (store_id, name),
    CONSTRAINT fk_store_positions_store FOREIGN KEY (store_id) REFERENCES stores (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE store_shifts (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    store_id BIGINT UNSIGNED NOT NULL,
    legacy_shift_id VARCHAR(80) NULL,
    name VARCHAR(40) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_store_shifts_legacy (store_id, legacy_shift_id),
    UNIQUE KEY uq_store_shifts_id_store (id, store_id),
    CONSTRAINT fk_store_shifts_store FOREIGN KEY (store_id) REFERENCES stores (id) ON DELETE RESTRICT,
    CONSTRAINT ck_store_shifts_start CHECK (start_time BETWEEN '00:00:00' AND '23:59:59'),
    CONSTRAINT ck_store_shifts_end CHECK (end_time BETWEEN '00:00:00' AND '23:59:59')
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE attendance (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    mongo_id CHAR(24) CHARACTER SET ascii COLLATE ascii_bin NULL,
    store_id BIGINT UNSIGNED NOT NULL,
    employee_id BIGINT UNSIGNED NOT NULL,
    attendance_date DATE NOT NULL,
    status ENUM('Present', 'Week Off', 'Absent') NOT NULL,
    comment VARCHAR(500) NOT NULL DEFAULT '',
    created_by BIGINT UNSIGNED NOT NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (id),
    UNIQUE KEY uq_attendance_mongo (mongo_id),
    UNIQUE KEY uq_attendance_day (store_id, attendance_date, employee_id),
    KEY ix_attendance_employee_date (employee_id, attendance_date),
    CONSTRAINT fk_attendance_store FOREIGN KEY (store_id) REFERENCES stores (id) ON DELETE RESTRICT,
    CONSTRAINT fk_attendance_employee FOREIGN KEY (employee_id) REFERENCES employee_profiles (employee_number) ON DELETE RESTRICT,
    CONSTRAINT fk_attendance_creator FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Tombstones prevent an explicitly deleted mark from being recreated by a roster.
CREATE TABLE attendance_removals (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    mongo_id CHAR(24) CHARACTER SET ascii COLLATE ascii_bin NULL,
    store_id BIGINT UNSIGNED NOT NULL,
    employee_id BIGINT UNSIGNED NOT NULL,
    attendance_date DATE NOT NULL,
    created_by BIGINT UNSIGNED NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (id),
    UNIQUE KEY uq_attendance_removals_mongo (mongo_id),
    UNIQUE KEY uq_attendance_removals_day (store_id, employee_id, attendance_date),
    CONSTRAINT fk_attendance_removals_store FOREIGN KEY (store_id) REFERENCES stores (id) ON DELETE RESTRICT,
    CONSTRAINT fk_attendance_removals_employee FOREIGN KEY (employee_id) REFERENCES employee_profiles (employee_number) ON DELETE RESTRICT,
    CONSTRAINT fk_attendance_removals_creator FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE weekly_rosters (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    mongo_id CHAR(24) CHARACTER SET ascii COLLATE ascii_bin NULL,
    store_id BIGINT UNSIGNED NOT NULL,
    week_start DATE NOT NULL,
    created_by BIGINT UNSIGNED NOT NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (id),
    UNIQUE KEY uq_weekly_rosters_mongo (mongo_id),
    UNIQUE KEY uq_weekly_rosters_week (store_id, week_start),
    UNIQUE KEY uq_weekly_rosters_scope (id, store_id, week_start),
    CONSTRAINT fk_weekly_rosters_store FOREIGN KEY (store_id) REFERENCES stores (id) ON DELETE RESTRICT,
    CONSTRAINT fk_weekly_rosters_creator FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE RESTRICT,
    CONSTRAINT ck_weekly_rosters_monday CHECK (WEEKDAY(week_start) = 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- The backend must save exactly seven days per roster employee in one transaction.
-- Composite FKs prohibit assigning another store's shift or a mismatched week.
-- Roster leave maps to Absent; off maps to paid Week Off in attendance defaults.
CREATE TABLE weekly_roster_days (
    roster_id BIGINT UNSIGNED NOT NULL,
    store_id BIGINT UNSIGNED NOT NULL,
    week_start DATE NOT NULL,
    employee_id BIGINT UNSIGNED NOT NULL,
    roster_date DATE NOT NULL,
    day_type ENUM('shift', 'off', 'leave') NOT NULL,
    shift_id BIGINT UNSIGNED NULL,
    PRIMARY KEY (roster_id, employee_id, roster_date),
    UNIQUE KEY uq_weekly_roster_days_employee (store_id, employee_id, roster_date),
    CONSTRAINT fk_weekly_roster_days_roster FOREIGN KEY (roster_id, store_id, week_start) REFERENCES weekly_rosters (id, store_id, week_start) ON DELETE RESTRICT,
    CONSTRAINT fk_weekly_roster_days_employee FOREIGN KEY (employee_id) REFERENCES employee_profiles (employee_number) ON DELETE RESTRICT,
    CONSTRAINT fk_weekly_roster_days_shift FOREIGN KEY (shift_id, store_id) REFERENCES store_shifts (id, store_id) ON DELETE RESTRICT,
    CONSTRAINT ck_weekly_roster_days_date CHECK (roster_date BETWEEN week_start AND DATE_ADD(week_start, INTERVAL 6 DAY)),
    CONSTRAINT ck_weekly_roster_days_type CHECK (
        (day_type = 'shift' AND shift_id IS NOT NULL)
        OR (day_type IN ('off', 'leave') AND shift_id IS NULL)
    )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE sales (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    mongo_id CHAR(24) CHARACTER SET ascii COLLATE ascii_bin NULL,
    store_id BIGINT UNSIGNED NOT NULL,
    sale_date DATE NOT NULL,
    total_sale DECIMAL(14,2) NOT NULL,
    swiggy DECIMAL(14,2) NOT NULL DEFAULT 0,
    zomato DECIMAL(14,2) NOT NULL DEFAULT 0,
    upi DECIMAL(14,2) NOT NULL DEFAULT 0,
    upi_charge DECIMAL(14,2) NOT NULL DEFAULT 0,
    created_by BIGINT UNSIGNED NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (id),
    UNIQUE KEY uq_sales_mongo (mongo_id),
    UNIQUE KEY uq_sales_store_date (store_id, sale_date),
    CONSTRAINT fk_sales_store FOREIGN KEY (store_id) REFERENCES stores (id) ON DELETE RESTRICT,
    CONSTRAINT fk_sales_creator FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE RESTRICT,
    CONSTRAINT ck_sales_amounts CHECK (total_sale >= 0 AND swiggy >= 0 AND zomato >= 0 AND upi >= 0 AND upi_charge >= 0),
    CONSTRAINT ck_sales_payment_total CHECK (swiggy + zomato + upi <= total_sale)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE sale_expenses (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    sale_id BIGINT UNSIGNED NOT NULL,
    name VARCHAR(150) NOT NULL,
    amount DECIMAL(14,2) NOT NULL,
    PRIMARY KEY (id),
    KEY ix_sale_expenses_sale (sale_id),
    CONSTRAINT fk_sale_expenses_sale FOREIGN KEY (sale_id) REFERENCES sales (id) ON DELETE RESTRICT,
    CONSTRAINT ck_sale_expenses_amount CHECK (amount >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE incentives (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    mongo_id CHAR(24) CHARACTER SET ascii COLLATE ascii_bin NULL,
    store_id BIGINT UNSIGNED NOT NULL,
    employee_id BIGINT UNSIGNED NOT NULL,
    period DATE NOT NULL,
    type VARCHAR(100) NOT NULL,
    amount DECIMAL(14,2) NOT NULL,
    paid_early BOOLEAN NOT NULL DEFAULT FALSE,
    created_by BIGINT UNSIGNED NOT NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (id),
    UNIQUE KEY uq_incentives_mongo (mongo_id),
    KEY ix_incentives_store_period_employee (store_id, period, employee_id),
    KEY ix_incentives_employee_period (employee_id, period),
    CONSTRAINT fk_incentives_store FOREIGN KEY (store_id) REFERENCES stores (id) ON DELETE RESTRICT,
    CONSTRAINT fk_incentives_employee FOREIGN KEY (employee_id) REFERENCES employee_profiles (employee_number) ON DELETE RESTRICT,
    CONSTRAINT fk_incentives_creator FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE RESTRICT,
    CONSTRAINT ck_incentives_amount CHECK (amount >= 0),
    CONSTRAINT ck_incentives_period CHECK (DAYOFMONTH(period) = 1),
    CONSTRAINT ck_incentives_paid_early CHECK (paid_early IN (0, 1))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE advances (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    mongo_id CHAR(24) CHARACTER SET ascii COLLATE ascii_bin NULL,
    store_id BIGINT UNSIGNED NOT NULL,
    employee_id BIGINT UNSIGNED NOT NULL,
    period DATE NOT NULL,
    type VARCHAR(100) NOT NULL,
    amount DECIMAL(14,2) NOT NULL,
    created_by BIGINT UNSIGNED NOT NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (id),
    UNIQUE KEY uq_advances_mongo (mongo_id),
    KEY ix_advances_store_period_employee (store_id, period, employee_id),
    KEY ix_advances_employee_period (employee_id, period),
    CONSTRAINT fk_advances_store FOREIGN KEY (store_id) REFERENCES stores (id) ON DELETE RESTRICT,
    CONSTRAINT fk_advances_employee FOREIGN KEY (employee_id) REFERENCES employee_profiles (employee_number) ON DELETE RESTRICT,
    CONSTRAINT fk_advances_creator FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE RESTRICT,
    CONSTRAINT ck_advances_amount CHECK (amount >= 0),
    CONSTRAINT ck_advances_period CHECK (DAYOFMONTH(period) = 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE extra_days (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    mongo_id CHAR(24) CHARACTER SET ascii COLLATE ascii_bin NULL,
    store_id BIGINT UNSIGNED NOT NULL,
    employee_id BIGINT UNSIGNED NOT NULL,
    period DATE NOT NULL,
    type VARCHAR(100) NOT NULL,
    days DECIMAL(7,2) NOT NULL,
    created_by BIGINT UNSIGNED NOT NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (id),
    UNIQUE KEY uq_extra_days_mongo (mongo_id),
    KEY ix_extra_days_store_period_employee (store_id, period, employee_id),
    KEY ix_extra_days_employee_period (employee_id, period),
    CONSTRAINT fk_extra_days_store FOREIGN KEY (store_id) REFERENCES stores (id) ON DELETE RESTRICT,
    CONSTRAINT fk_extra_days_employee FOREIGN KEY (employee_id) REFERENCES employee_profiles (employee_number) ON DELETE RESTRICT,
    CONSTRAINT fk_extra_days_creator FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE RESTRICT,
    CONSTRAINT ck_extra_days_amount CHECK (days >= 0),
    CONSTRAINT ck_extra_days_period CHECK (DAYOFMONTH(period) = 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE withdrawals (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    mongo_id CHAR(24) CHARACTER SET ascii COLLATE ascii_bin NULL,
    store_id BIGINT UNSIGNED NOT NULL,
    withdrawal_date DATE NOT NULL,
    amount DECIMAL(14,2) NOT NULL,
    type ENUM('withdrawal', 'repayment') NOT NULL,
    reason VARCHAR(300) NULL,
    created_by BIGINT UNSIGNED NOT NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (id),
    UNIQUE KEY uq_withdrawals_mongo (mongo_id),
    KEY ix_withdrawals_store_date (store_id, withdrawal_date),
    CONSTRAINT fk_withdrawals_store FOREIGN KEY (store_id) REFERENCES stores (id) ON DELETE RESTRICT,
    CONSTRAINT fk_withdrawals_creator FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE RESTRICT,
    CONSTRAINT ck_withdrawals_amount CHECK (amount >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE products (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    mongo_id CHAR(24) CHARACTER SET ascii COLLATE ascii_bin NULL,
    name VARCHAR(100) NOT NULL,
    normalized_name VARCHAR(100) GENERATED ALWAYS AS (LOWER(TRIM(name))) STORED,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (id),
    UNIQUE KEY uq_products_mongo (mongo_id),
    UNIQUE KEY uq_products_normalized_name (normalized_name),
    CONSTRAINT ck_products_name CHECK (CHAR_LENGTH(TRIM(name)) > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE inventory_items (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    mongo_id CHAR(24) CHARACTER SET ascii COLLATE ascii_bin NULL,
    store_id BIGINT UNSIGNED NOT NULL,
    product_id BIGINT UNSIGNED NOT NULL,
    quantity DECIMAL(14,3) NOT NULL DEFAULT 0,
    expiry_date DATE NOT NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (id),
    UNIQUE KEY uq_inventory_items_mongo (mongo_id),
    UNIQUE KEY uq_inventory_items_batch (store_id, product_id, expiry_date),
    UNIQUE KEY uq_inventory_items_scope (id, store_id, product_id),
    KEY ix_inventory_items_expiry (store_id, expiry_date),
    CONSTRAINT fk_inventory_items_store FOREIGN KEY (store_id) REFERENCES stores (id) ON DELETE RESTRICT,
    CONSTRAINT fk_inventory_items_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE RESTRICT,
    CONSTRAINT ck_inventory_items_quantity CHECK (quantity >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Decrement stock and insert a disposal in the same transaction. Retain depleted
-- batches at quantity zero instead of deleting rows referenced by disposal history.
CREATE TABLE inventory_disposals (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    mongo_id CHAR(24) CHARACTER SET ascii COLLATE ascii_bin NULL,
    inventory_item_id BIGINT UNSIGNED NOT NULL,
    store_id BIGINT UNSIGNED NOT NULL,
    product_id BIGINT UNSIGNED NOT NULL,
    product_name VARCHAR(100) NOT NULL,
    expiry_date DATE NOT NULL,
    quantity DECIMAL(14,3) NOT NULL,
    dumped_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (id),
    UNIQUE KEY uq_inventory_disposals_mongo (mongo_id),
    KEY ix_inventory_disposals_store_date (store_id, dumped_at),
    CONSTRAINT fk_inventory_disposals_batch FOREIGN KEY (inventory_item_id, store_id, product_id) REFERENCES inventory_items (id, store_id, product_id) ON DELETE RESTRICT,
    CONSTRAINT ck_inventory_disposals_quantity CHECK (quantity > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE pnl_inputs (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    mongo_id CHAR(24) CHARACTER SET ascii COLLATE ascii_bin NULL,
    store_id BIGINT UNSIGNED NOT NULL,
    period DATE NOT NULL,
    created_by BIGINT UNSIGNED NOT NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (id),
    UNIQUE KEY uq_pnl_inputs_mongo (mongo_id),
    UNIQUE KEY uq_pnl_inputs_store_period (store_id, period),
    CONSTRAINT fk_pnl_inputs_store FOREIGN KEY (store_id) REFERENCES stores (id) ON DELETE RESTRICT,
    CONSTRAINT fk_pnl_inputs_creator FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE RESTRICT,
    CONSTRAINT ck_pnl_inputs_period CHECK (DAYOFMONTH(period) = 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE pnl_input_values (
    pnl_input_id BIGINT UNSIGNED NOT NULL,
    field_name VARCHAR(100) NOT NULL,
    amount DECIMAL(14,2) NOT NULL,
    PRIMARY KEY (pnl_input_id, field_name),
    CONSTRAINT fk_pnl_input_values_input FOREIGN KEY (pnl_input_id) REFERENCES pnl_inputs (id) ON DELETE RESTRICT,
    CONSTRAINT ck_pnl_input_values_amount CHECK (amount >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Public IDs remain EMP0001...EMP9999, EMP10000..., without truncating digits.
-- employee_id is a relational key; employee_code is a display/search identifier.
CREATE VIEW employee_directory AS
SELECT employee.employee_number AS employee_id,
       CONCAT('EMP', LPAD(CAST(employee.employee_number AS CHAR),
           GREATEST(4, CHAR_LENGTH(CAST(employee.employee_number AS CHAR))), '0')) AS employee_code,
       account.id AS user_id,
       account.mongo_id,
       account.name,
       account.email,
       account.phone,
       account.is_active,
       account.archived_at,
       account.created_at,
       employee.position,
       employee.employment_type,
       employee.salary,
       employee.date_of_joining
FROM employee_profiles AS employee
JOIN users AS account ON account.id = employee.user_id;

-- Derive amounts rather than storing cash/expense totals that can drift apart.
-- Saving a sale and its expense rows must be one transaction.
CREATE VIEW sale_financials AS
SELECT sale.id AS sale_id,
       sale.store_id,
       sale.sale_date,
       sale.total_sale,
       sale.swiggy,
       sale.zomato,
       sale.upi,
       sale.upi_charge,
       sale.total_sale - sale.swiggy - sale.zomato - sale.upi AS cash,
       COALESCE(expenses.total_expenses, 0) AS total_expenses,
       sale.total_sale - sale.swiggy - sale.zomato - sale.upi
           - COALESCE(expenses.total_expenses, 0) AS banking_cash
FROM sales AS sale
LEFT JOIN (
    SELECT sale_id, SUM(amount) AS total_expenses
    FROM sale_expenses
    GROUP BY sale_id
) AS expenses ON expenses.sale_id = sale.id;

-- P&L payroll includes incentive_total, including amounts paid early.
-- Remaining salary includes unpaid_incentive_total, not incentive_total.
-- Salary slips show incentive_total and the already-paid deduction separately.
-- Salary advances reduce the remaining payout, not the earned payroll expense.
-- Attendance proration, paid Week Off, joining/archive dates, custom cycle ranges,
-- and extra-day limits still require the backend's business rules.
CREATE VIEW employee_incentive_totals AS
SELECT store_id,
       employee_id,
       period,
       SUM(amount) AS incentive_total,
       SUM(CASE WHEN paid_early = TRUE THEN amount ELSE 0 END) AS paid_early_total,
       SUM(CASE WHEN paid_early = FALSE THEN amount ELSE 0 END) AS unpaid_incentive_total
FROM incentives
GROUP BY store_id, employee_id, period;