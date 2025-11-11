<?php
require_once __DIR__ . '/../models/EmployeeProfileModel.php';

class EmployeeProfileController
{
    private $profileModel;

    public function __construct()
    {
        $this->profileModel = new EmployeeProfileModel();
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

            $normalized = [
                'avatar' => $data['avatar'] ?? null,
                'skills' => isset($data['skills']) ? trim((string) $data['skills']) : '',
                'bank' => [
                    'bankName' => isset($data['bank']['bankName']) ? trim((string) $data['bank']['bankName']) : '',
                    'accountName' => isset($data['bank']['accountName']) ? trim((string) $data['bank']['accountName']) : '',
                    'accountNumber' => isset($data['bank']['accountNumber']) ? trim((string) $data['bank']['accountNumber']) : '',
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

