const express = require("express");
const path = require("path");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("./db");

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "cube_super_secret_key_2026";

app.use(express.json());
app.use(express.static(__dirname));

// ==========================================
// MIDDLEWARE: Проверка JWT и Ролей
// ==========================================
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ message: "Токен отсутствует" });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: "Невалидный токен" });
        req.user = user;
        next();
    });
}

// Проверка, что пользователь имеет нужную роль (например, 'admin')
function authorizeRole(role) {
    return (req, res, next) => {
        if (req.user && req.user.role === role) {
            next();
        } else {
            res.status(403).json({ message: "Недостаточно прав для этого действия" });
        }
    };
}

// ==========================================
// ОТДАЧА СТРАНИЦ
// ==========================================
app.get("/admin", (req, res) => {
    res.sendFile(path.join(__dirname, "admin.html"));
});

// ==========================================
// ВИТРИНА
// ==========================================
app.get("/entertainments", (req, res) => {
    db.query("SELECT * FROM entertainments WHERE is_active = 1 ORDER BY id", (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

app.get("/halls", (req, res) => {
    db.query("SELECT * FROM halls WHERE is_active = 1 ORDER BY id", (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

app.post("/bookings", (req, res) => {
    const b = req.body || {};
    const required = ["name", "phone", "booking_date", "start_time", "end_time", "guests_count"];
    for (const k of required) {
        if (!b[k]) return res.status(400).json({ error: `Поле "${k}" обязательно` });
    }
    db.query("SELECT id FROM clients WHERE phone = ? LIMIT 1", [b.phone], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        const createBooking = (clientId) => {
            const sql = `INSERT INTO bookings (client_id, hall_id, booking_date, start_time, end_time, guests_count, event_type, interests, comment) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
            db.query(sql, [clientId, b.hall_id || null, b.booking_date, b.start_time, b.end_time, parseInt(b.guests_count), b.event_type, b.interests, b.comment || null], (err2, result) => {
                if (err2) return res.status(500).json({ error: err2.message });
                res.status(201).json({ id: result.insertId, status: "new" });
            });
        };
        if (rows.length > 0) createBooking(rows[0].id);
        else db.query("INSERT INTO clients (name, email, phone) VALUES (?, ?, ?)", [b.name, b.email || null, b.phone], (err3, r2) => {
            if (err3) return res.status(500).json({ error: err3.message });
            createBooking(r2.insertId);
        });
    });
});

// ==========================================
// АУТЕНТИФИКАЦИЯ (Практика №10)
// ==========================================
app.post("/api/login", (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Заполните email и пароль" });

    db.query("SELECT * FROM users WHERE email = ?", [email], async (err, results) => {
        if (err) return res.status(500).json({ message: "Ошибка сервера" });
        if (results.length === 0) return res.status(404).json({ message: "Пользователь не найден" });

        const user = results[0];
        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(400).json({ message: "Неверный пароль" });

        // Обязательно передаем role в токен!
        const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: "8h" });
        res.json({ message: "Авторизация успешна", token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    });
});

// Регистрация нового пользователя — ТОЛЬКО ДЛЯ ADMIN
app.post("/api/register", authenticateToken, authorizeRole('admin'), async (req, res) => {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: "Заполните все поля" });

    const userRole = role === 'admin' ? 'admin' : 'manager'; // По умолчанию менеджер

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        db.query("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)", [name, email, hashedPassword, userRole], (err, result) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ message: "Email уже зарегистрирован" });
                return res.status(500).json({ message: "Ошибка сервера" });
            }
            res.status(201).json({ message: "Пользователь зарегистрирован" });
        });
    } catch (error) {
        res.status(500).json({ message: "Ошибка сервера" });
    }
});

// Получение списка пользователей — ТОЛЬКО ДЛЯ ADMIN
app.get("/api/users", authenticateToken, authorizeRole('admin'), (req, res) => {
    db.query("SELECT id, name, email, role, created_at FROM users", (err, results) => {
        if (err) return res.status(500).json({ message: "Ошибка сервера" });
        res.json(results);
    });
});

app.get("/api/users/:id", authenticateToken, authorizeRole('admin'), (req, res) => {
    db.query("SELECT id, name, email, role FROM users WHERE id = ?", [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ message: "Ошибка сервера" });
        if (results.length === 0) return res.status(404).json({ message: "Пользователь не найден" });
        res.json(results[0]);
    });
});

// Удаление пользователя — ТОЛЬКО ДЛЯ ADMIN
app.delete("/api/users/:id", authenticateToken, authorizeRole('admin'), (req, res) => {
    if (parseInt(req.params.id) === req.user.id) {
        return res.status(400).json({ message: "Нельзя удалить самого себя" });
    }
    db.query("DELETE FROM users WHERE id = ?", [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ message: "Ошибка сервера" });
        if (result.affectedRows === 0) return res.status(404).json({ message: "Пользователь не найден" });
        res.json({ message: "Пользователь удален" });
    });
});

// ==========================================
// АДМИН-ПАНЕЛЬ (Доступно и админам, и менеджерам)
// ==========================================
app.get("/api/admin/bookings", authenticateToken, (req, res) => {
    const sql = `
        SELECT b.*, c.name AS client_name, c.phone AS client_phone, h.name AS hall_name 
        FROM bookings b
        JOIN clients c ON c.id = b.client_id
        LEFT JOIN halls h ON h.id = b.hall_id
        ORDER BY b.booking_date DESC, b.start_time DESC
    `;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ message: "Ошибка сервера" });
        res.json(results);
    });
});

app.get("/api/admin/halls", authenticateToken, (req, res) => {
    db.query("SELECT * FROM halls ORDER BY id", (err, results) => {
        if (err) return res.status(500).json({ message: "Ошибка сервера" });
        res.json(results);
    });
});

app.post("/api/admin/halls", authenticateToken, (req, res) => {
    const { name, capacity, description, price_per_hour, image_url } = req.body;
    if (!name || !capacity) return res.status(400).json({ message: "Название и вместимость обязательны" });
    
    db.query(
        "INSERT INTO halls (name, capacity, description, price_per_hour, image_url) VALUES (?, ?, ?, ?, ?)",
        [name, capacity, description || "", price_per_hour || 0, image_url || "images/hall-1.jpg"],
        (err, result) => {
            if (err) return res.status(500).json({ message: "Ошибка сервера" });
            res.status(201).json({ message: "Зал добавлен", id: result.insertId });
        }
    );
});

app.delete("/api/admin/halls/:id", authenticateToken, (req, res) => {
    db.query("DELETE FROM halls WHERE id = ?", [req.params.id], (err, result) => {
        if (err) {
            // Если ошибка внешнего ключа (на зал есть брони)
            if (err.code === 'ER_ROW_IS_REFERENCED_2') {
                return res.status(400).json({ message: "Нельзя удалить зал, так как на него есть активные брони" });
            }
            return res.status(500).json({ message: "Ошибка сервера" });
        }
        if (result.affectedRows === 0) return res.status(404).json({ message: "Зал не найден" });
        res.json({ message: "Зал удален" });
    });
});

// ДОБАВЛЕН недостающий GET-маршрут для развлечений
app.get("/api/admin/entertainments", authenticateToken, (req, res) => {
    db.query("SELECT * FROM entertainments ORDER BY id", (err, results) => {
        if (err) return res.status(500).json({ message: "Ошибка сервера" });
        res.json(results);
    });
});

app.post("/api/admin/entertainments", authenticateToken, (req, res) => {
    const { name, slug, category, description, price, image_url } = req.body;
    db.query(
        "INSERT INTO entertainments (name, slug, category, description, price, image_url) VALUES (?, ?, ?, ?, ?, ?)",
        [name, slug, category, description || "", price || 0, image_url || "images/hero-bg.jpg"],
        (err, result) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ message: "Развлечение с таким slug уже существует" });
                return res.status(500).json({ message: "Ошибка сервера" });
            }
            res.status(201).json({ message: "Развлечение добавлено" });
        }
    );
});

app.delete("/api/admin/entertainments/:id", authenticateToken, (req, res) => {
    db.query("DELETE FROM entertainments WHERE id = ?", [req.params.id], (err, result) => {
        if (err) {
            if (err.code === 'ER_ROW_IS_REFERENCED_2') {
                return res.status(400).json({ message: "Нельзя удалить, так как есть брони на это развлечение" });
            }
            return res.status(500).json({ message: "Ошибка сервера" });
        }
        if (result.affectedRows === 0) return res.status(404).json({ message: "Развлечение не найдено" });
        res.json({ message: "Развлечение удалено" });
    });
});

app.listen(PORT, () => {
    console.log(`Сервер запущен: http://localhost:${PORT}`);
});