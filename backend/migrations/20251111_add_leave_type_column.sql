-- Adds 'type' column to 'leaves' table for classification (e.g., 'annual', 'sick')
-- Safe to run multiple times: checks existence via INFORMATION_SCHEMA

START TRANSACTION;

-- Create column if not exists
SET @col_exists := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'leaves'
    AND COLUMN_NAME = 'type'
);

SET @stmt := IF(@col_exists = 0,
  'ALTER TABLE `leaves` ADD COLUMN `type` VARCHAR(32) NULL DEFAULT ''annual'' AFTER `reason`;',
  'SELECT 1;'
);
PREPARE add_col_stmt FROM @stmt;
EXECUTE add_col_stmt;
DEALLOCATE PREPARE add_col_stmt;

-- Optional: add index to speed up balance queries by type
SET @idx_exists := (
  SELECT COUNT(*)
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'leaves'
    AND INDEX_NAME = 'idx_leaves_type_status_employee'
);

SET @stmt_idx := IF(@idx_exists = 0,
  'CREATE INDEX `idx_leaves_type_status_employee` ON `leaves` (`type`, `status`, `employee_id`);',
  'SELECT 1;'
);
PREPARE add_idx_stmt FROM @stmt_idx;
EXECUTE add_idx_stmt;
DEALLOCATE PREPARE add_idx_stmt;

COMMIT;


