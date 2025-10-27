<?php
/**
 * Database Connection Class
 * Sử dụng PDO với Singleton pattern để quản lý kết nối MySQL
 */
class Database {
    private static $instance = null;
    private $connection;
    
    // Thông tin kết nối - Tự động phát hiện môi trường
    private $host;
    private $dbname;
    private $username;
    private $password;
    private $charset = 'utf8mb4';
    
    /**
     * Private constructor để implement Singleton pattern
     */
    private function __construct() {
        // Load thông tin từ file .env
        $this->loadEnv();
        
        // Tự động phát hiện môi trường
        $this->detectEnvironment();
        
        try {
            $dsn = "mysql:host={$this->host};dbname={$this->dbname};charset={$this->charset}";
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ];
            
            $this->connection = new PDO($dsn, $this->username, $this->password, $options);
        } catch (PDOException $e) {
            die(json_encode([
                'success' => false,
                'message' => 'Kết nối database thất bại: ' . $e->getMessage()
            ]));
        }
    }
    
    /**
     * Load environment variables từ file .env
     */
    private function loadEnv() {
        $envFile = __DIR__ . '/../../.env';
        
        if (!file_exists($envFile)) {
            return; // Nếu không có file .env, sẽ dùng detectEnvironment
        }
        
        $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            // Bỏ qua comment
            if (strpos(trim($line), '#') === 0) {
                continue;
            }
            
            // Parse key=value
            if (strpos($line, '=') !== false) {
                list($key, $value) = explode('=', $line, 2);
                $key = trim($key);
                $value = trim($value);
                
                // Set vào $_ENV
                if (!array_key_exists($key, $_ENV)) {
                    $_ENV[$key] = $value;
                }
            }
        }
    }
    
    /**
     * Tự động phát hiện môi trường và set thông tin database
     */
    private function detectEnvironment() {
        // Kiểm tra xem có phải là localhost không
        $isLocalhost = in_array($_SERVER['HTTP_HOST'] ?? '', ['localhost', '127.0.0.1', 'localhost:8000']);
        
        if ($isLocalhost) {
            // Cấu hình cho localhost - Đọc từ .env
            $this->host = $_ENV['DB_HOST_LOCAL'] ?? 'localhost';
            $this->dbname = $_ENV['DB_NAME_LOCAL'] ?? 'hrm_db';
            $this->username = $_ENV['DB_USER_LOCAL'] ?? 'root';
            $this->password = $_ENV['DB_PASS_LOCAL'] ?? '';
        } else {
            // Cấu hình cho hosting - Đọc từ .env (BẮT BUỘC phải có file .env)
            $this->host = $_ENV['DB_HOST_PROD'] ?? null;
            $this->dbname = $_ENV['DB_NAME_PROD'] ?? null;
            $this->username = $_ENV['DB_USER_PROD'] ?? null;
            $this->password = $_ENV['DB_PASS_PROD'] ?? null;
            
            // Kiểm tra nếu thiếu thông tin
            if (!$this->host || !$this->dbname || !$this->username) {
                die(json_encode([
                    'success' => false,
                    'message' => 'Thiếu thông tin database trong file .env. Vui lòng tạo file .env từ .env.example'
                ]));
            }
        }
        
        // Charset từ .env hoặc mặc định
        $this->charset = $_ENV['DB_CHARSET'] ?? 'utf8mb4';
    }
    
    /**
     * Lấy instance duy nhất của Database (Singleton)
     */
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    /**
     * Lấy PDO connection
     */
    public function getConnection() {
        return $this->connection;
    }
    
    /**
     * Prevent cloning
     */
    private function __clone() {}
    
    /**
     * Prevent unserializing
     */
    public function __wakeup() {
        throw new Exception("Cannot unserialize singleton");
    }
}
