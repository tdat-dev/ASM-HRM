<?php
require_once __DIR__ . '/../models/EmployeeProfileModel.php';

class EmployeeProfileController
{
    private $profileModel;

    public function __construct(?EmployeeProfileModel $profileModel = null)
    {
        // Allow DI for testability; default to real model if none provided
        $this->profileModel = $profileModel ?? new EmployeeProfileModel();
    }

    /**
     * Batch get profiles by employee IDs
     * Body: { ids: number[] }
     */
    public function batchGet(array $data)
    {
        try {
            $ids = $data['ids'] ?? [];
            if (!is_array($ids) || empty($ids)) {
                throw new Exception('Danh sách ID không hợp lệ');
            }
            $ids = array_values(array_filter(array_map('intval', $ids), fn($v) => $v > 0));
            if (empty($ids)) {
                throw new Exception('Danh sách ID trống');
            }

            $profiles = [];
            foreach ($ids as $id) {
                $profile = $this->profileModel->getProfile($id);
                $profile['employee_id'] = $id;
                $profiles[] = $profile;
            }

            return [
                'success' => true,
                'data' => $profiles,
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage(),
            ];
        }
    }
    public function getByEmployeeId(int $employeeId)
    {
        try {
            if ($employeeId <= 0) {
                throw new Exception('ID nhân viên không hợp lệ');
            }

            $profile = $this->profileModel->getProfile($employeeId);

            return [
                'success' => true,
                'data' => $profile,
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage(),
            ];
        }
    }

    public function update(int $employeeId, array $data)
    {
        try {
            if ($employeeId <= 0) {
                throw new Exception('ID nhân viên không hợp lệ');
            }

            // Basic normalization; HTML escaping should be applied on output.
            // Optionally strip tags to mitigate stored XSS at source.
            $strip = function (?string $v): string {
                return trim((string)($v ?? ''));
            };

            $normalized = [
                'avatar' => $data['avatar'] ?? null,
                'skills' => $strip($data['skills'] ?? ''),
                'bank' => [
                    'bankName' => $strip($data['bank']['bankName'] ?? ''),
                    'accountName' => $strip($data['bank']['accountName'] ?? ''),
                    'accountNumber' => $strip($data['bank']['accountNumber'] ?? ''),
                ],
                'emergencyContacts' => $this->sanitizeList($data['emergencyContacts'] ?? [], ['name']),
                'dependents' => $this->sanitizeList($data['dependents'] ?? [], ['name']),
                'education' => $this->sanitizeList($data['education'] ?? []),
                'promotions' => $this->sanitizeList($data['promotions'] ?? []),
                'customFields' => $this->sanitizeList($data['customFields'] ?? []),
            ];

            $this->profileModel->saveProfile($employeeId, $normalized);

            return [
                'success' => true,
                'message' => 'Cập nhật hồ sơ thành công',
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage(),
            ];
        }
    }

    private function sanitizeList(array $items, array $requiredFields = []): array
    {
        $clean = [];
        foreach ($items as $item) {
            if (!is_array($item)) {
                continue;
            }

            $valid = true;
            foreach ($requiredFields as $field) {
                if (empty(trim($item[$field] ?? ''))) {
                    $valid = false;
                    break;
                }
            }

            if ($valid) {
                $clean[] = array_map(
                    fn($value) => is_string($value) ? trim($value) : $value,
                    $item
                );
            }
        }

        return $clean;
    }
}

