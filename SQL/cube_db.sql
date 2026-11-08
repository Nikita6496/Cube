CREATE DATABASE IF NOT EXISTS cube_db
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE cube_db;

-- Админы (для будущей админ-панели)
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'manager') NOT NULL DEFAULT 'admin',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Гости (данные из формы «Зарегистрироваться»)
CREATE TABLE clients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(20) NOT NULL UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Залы (статика + флаг «показывать на сайте»)
CREATE TABLE halls (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    capacity INT NOT NULL,
    description TEXT,
    price_per_hour DECIMAL(10,2) NOT NULL DEFAULT 0,
    image_url VARCHAR(255),
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Развлечения (статика + флаг + сколько единиц есть)
CREATE TABLE entertainments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    category VARCHAR(50) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL DEFAULT 0,
    units_available INT NOT NULL DEFAULT 0,
    image_url VARCHAR(255),
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_entertainments_category (category)
);

-- Брони (и залов, и просто визитов)
CREATE TABLE bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id INT NOT NULL,
    hall_id INT NULL,
    booking_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    guests_count INT NOT NULL,
    event_type VARCHAR(100),
    interests TEXT,
    status ENUM('new','confirmed','cancelled','completed') NOT NULL DEFAULT 'new',
    comment TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_bookings_client FOREIGN KEY (client_id) REFERENCES clients(id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_bookings_hall FOREIGN KEY (hall_id) REFERENCES halls(id)
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT chk_guests_count CHECK (guests_count > 0),
    CONSTRAINT chk_time CHECK (end_time > start_time),
    INDEX idx_bookings_date (booking_date)
);

-- Что заказано в брони (развлечения)
CREATE TABLE booking_entertainments (
    booking_id INT NOT NULL,
    entertainment_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    PRIMARY KEY (booking_id, entertainment_id),
    CONSTRAINT fk_be_booking FOREIGN KEY (booking_id) REFERENCES bookings(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_be_ent FOREIGN KEY (entertainment_id) REFERENCES entertainments(id)
        ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Галереи
CREATE TABLE entertainment_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    entertainment_id INT NOT NULL,
    image_url VARCHAR(255) NOT NULL,
    alt_text VARCHAR(255),
    sort_order INT NOT NULL DEFAULT 0,
    is_main TINYINT(1) NOT NULL DEFAULT 0,
    CONSTRAINT fk_ei_ent FOREIGN KEY (entertainment_id) REFERENCES entertainments(id)
        ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE hall_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    hall_id INT NOT NULL,
    image_url VARCHAR(255) NOT NULL,
    alt_text VARCHAR(255),
    sort_order INT NOT NULL DEFAULT 0,
    is_main TINYINT(1) NOT NULL DEFAULT 0,
    CONSTRAINT fk_hi_hall FOREIGN KEY (hall_id) REFERENCES halls(id)
        ON DELETE CASCADE ON UPDATE CASCADE
);