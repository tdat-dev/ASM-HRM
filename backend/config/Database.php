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
     * Tự động phát hiện môi trường và set thông tin database
     */
    private function detectEnvironment() {
        // Kiểm tra xem có phải là localhost không
        $isLocalhost = in_array($_SERVER['HTTP_HOST'] ?? '', ['localhost', '127.0.0.1', 'localhost:8000']);
        
        if ($isLocalhost) {
            // Cấu hình cho localhost
            $this->host = 'localhost';
            $this->dbname = 'hrm_db';
            $this->username = 'root';
            $this->password = '';
        } else {
            // Cấu hình cho hosting - THAY ĐỔI THÔNG TIN NÀY
            $this->host = 'sql310.infinityfree.com';  // Thay bằng host của bạn
            $this->dbname = 'if0_40226758_hrm';       // Thay bằng tên database của bạn
            $this->username = 'if0_40226758';          // Thay bằng username của bạn
            $this->password = 'YOUR_PASSWORD_HERE';    // Thay bằng password của bạn
        }
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
