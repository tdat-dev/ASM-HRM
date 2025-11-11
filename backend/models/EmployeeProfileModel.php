<?php
require_once __DIR__ . '/BaseModel.php';

class EmployeeProfileModel extends BaseModel
{
    public function getProfile(int $employeeId): array
    {
        $profileSql = "SELECT avatar, bank_name, bank_account_name, bank_account_number, skills
                       FROM employee_profiles
                       WHERE employee_id = :employee_id";

        $stmt = $this->db->prepare($profileSql);
        $stmt->execute(['employee_id' => $employeeId]);
        $profileRow = $stmt->fetch();

        $profile = [
            'avatar' => $profileRow['avatar'] ?? '',
            'skills' => $profileRow['skills'] ?? '',
            'bank' => [
                'bankName' => $profileRow['bank_name'] ?? '',
                'accountName' => $profileRow['bank_account_name'] ?? '',
                'accountNumber' => $profileRow['bank_account_number'] ?? '',
            ],
            'emergencyContacts' => $this->fetchList(
                'employee_emergency_contacts',
                $employeeId,
                ['name', 'relation', 'phone']
            ),
            'dependents' => $this->fetchList(
                'employee_dependents',
                $employeeId,
                ['name', 'relation', 'dob']
            ),
            'education' => $this->fetchList(
                'employee_education',
                $employeeId,
                ['title', 'school', 'year']
            ),
            'promotions' => $this->fetchList(
                'employee_promotions',
                $employeeId,
                ['title', 'promotion_date', 'note'],
                ['promotion_date' => 'date']
            ),
            'customFields' => $this->fetchList(
                'employee_custom_fields',
                $employeeId,
                ['field_key', 'field_value']
            ),
        ];

        // Chuẩn hóa key cho custom fields
        $profile['customFields'] = array_map(function ($item) {
            return [
                'key' => $item['field_key'] ?? '',
                'value' => $item['field_value'] ?? '',
            ];
        }, $profile['customFields']);

        return $profile;
    }

    public function saveProfile(int $employeeId, array $data): void
    {
        $this->db->beginTransaction();

        try {
            $profileSql = "INSERT INTO employee_profiles (employee_id, avatar, bank_name, bank_account_name, bank_account_number, skills)
                           VALUES (:employee_id, :avatar, :bank_name, :bank_account_name, :bank_account_number, :skills)
                           ON DUPLICATE KEY UPDATE
                                avatar = VALUES(avatar),
                                bank_name = VALUES(bank_name),
                                bank_account_name = VALUES(bank_account_name),
                                bank_account_number = VALUES(bank_account_number),
                                skills = VALUES(skills)";

            $stmt = $this->db->prepare($profileSql);
            $stmt->execute([
                'employee_id' => $employeeId,
                'avatar' => $data['avatar'] ?? null,
                'bank_name' => $data['bank']['bankName'] ?? null,
                'bank_account_name' => $data['bank']['accountName'] ?? null,
                'bank_account_number' => $data['bank']['accountNumber'] ?? null,
                'skills' => $data['skills'] ?? null,
            ]);

            $this->replaceList(
                'employee_emergency_contacts',
                $employeeId,
                $data['emergencyContacts'] ?? [],
                ['name', 'relation', 'phone']
            );

            $this->replaceList(
                'employee_dependents',
                $employeeId,
                $data['dependents'] ?? [],
                ['name', 'relation', 'dob']
            );

            $this->replaceList(
                'employee_education',
                $employeeId,
                $data['education'] ?? [],
                ['title', 'school', 'year']
            );

            $this->replaceList(
                'employee_promotions',
                $employeeId,
                $data['promotions'] ?? [],
                ['title', 'date', 'note'],
                ['date' => 'promotion_date']
            );

            $normalizedCustomFields = array_map(function ($item) {
                return [
                    'field_key' => $item['key'] ?? '',
                    'field_value' => $item['value'] ?? '',
                ];
            }, $data['customFields'] ?? []);

            $this->replaceList(
                'employee_custom_fields',
                $employeeId,
                $normalizedCustomFields,
                ['field_key', 'field_value']
            );

            $this->db->commit();
        } catch (Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    private function fetchList(string $table, int $employeeId, array $columns, array $columnMap = []): array
    {
        $cols = implode(', ', $columns);
        $sql = "SELECT $cols FROM {$table} WHERE employee_id = :employee_id ORDER BY id ASC";
        $stmt = $this->db->prepare($sql);
        $stmt->execute(['employee_id' => $employeeId]);
        $rows = $stmt->fetchAll();

        if (!$columnMap) {
            return $rows;
        }

        // Map lại tên cột nếu cần
        return array_map(function ($row) use ($columnMap) {
            foreach ($columnMap as $from => $to) {
                if (isset($row[$from])) {
                    $row[$to] = $row[$from];
                    unset($row[$from]);
                } else {
                    $row[$to] = null;
                }
            }
            return $row;
        }, $rows);
    }

    private function replaceList(string $table, int $employeeId, array $items, array $columns, array $mappedColumns = []): void
    {
        $deleteSql = "DELETE FROM {$table} WHERE employee_id = :employee_id";
        $stmt = $this->db->prepare($deleteSql);
        $stmt->execute(['employee_id' => $employeeId]);

        if (empty($items)) {
            return;
        }

        $columnNames = array_map(function ($column) use ($mappedColumns) {
            return $mappedColumns[$column] ?? $column;
        }, $columns);

        $placeholders = implode(', ', array_map(fn($col) => ":$col", $columnNames));

        $insertSql = "INSERT INTO {$table} (employee_id, " . implode(', ', $columnNames) . ")
                      VALUES (:employee_id, {$placeholders})";

        $stmt = $this->db->prepare($insertSql);

        foreach ($items as $item) {
            $params = ['employee_id' => $employeeId];
            foreach ($columns as $column) {
                $targetColumn = $mappedColumns[$column] ?? $column;
                $value = $item[$column] ?? null;

                if ($targetColumn === 'dob' || $targetColumn === 'promotion_date') {
                    $value = empty($value) ? null : $value;
                }

                $params[$targetColumn] = $value;
            }
            $stmt->execute($params);
        }
    }
}

