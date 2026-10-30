const express = require("express");
const db = require("./db");

const app = express();
const PORT = parseInt(process.env.PORT || "3000", 10);

app.use(express.json());
app.use(express.static(__dirname));

function getImagesFor(table, fkColumn, ids) {
    return new Promise((resolve, reject) => {
        if (!ids || ids.length === 0) return resolve({});
        const placeholders = ids.map(() => "?").join(",");
        db.query(
            `SELECT ${fkColumn} AS owner_id, image_url
             FROM ${table}
             WHERE ${fkColumn} IN (${placeholders})
             ORDER BY is_main DESC, sort_order ASC, id ASC`,
            ids,
            (err, rows) => {
                if (err) return reject(err);
                const map = {};
                rows.forEach(r => {
                    if (!map[r.owner_id]) map[r.owner_id] = [];
                    map[r.owner_id].push(r.image_url);
                });
                resolve(map);
            }
        );
    });
}

app.get("/entertainments", (req, res) => {
    db.query(
        "SELECT * FROM entertainments WHERE is_active = 1 ORDER BY id",
        async (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            try {
                const ids = rows.map(r => r.id);
                const imgMap = await getImagesFor("entertainment_images", "entertainment_id", ids);
                const result = rows.map(r => ({
                    ...r,
                    images: imgMap[r.id] && imgMap[r.id].length
                        ? imgMap[r.id]
                        : (r.image_url ? [r.image_url] : [])
                }));
                res.json(result);
            } catch (e) {
                res.status(500).json({ error: e.message });
            }
        }
    );
});

app.get("/entertainments/category/:category", (req, res) => {
    db.query(
        "SELECT * FROM entertainments WHERE category = ? AND is_active = 1 ORDER BY id",
        [req.params.category],
        async (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            try {
                const ids = rows.map(r => r.id);
                const imgMap = await getImagesFor("entertainment_images", "entertainment_id", ids);
                const result = rows.map(r => ({
                    ...r,
                    images: imgMap[r.id] && imgMap[r.id].length
                        ? imgMap[r.id]
                        : (r.image_url ? [r.image_url] : [])
                }));
                res.json(result);
            } catch (e) {
                res.status(500).json({ error: e.message });
            }
        }
    );
});

app.get("/halls", (req, res) => {
    db.query(
        "SELECT * FROM halls WHERE is_active = 1 ORDER BY id",
        async (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            try {
                const ids = rows.map(r => r.id);
                const imgMap = await getImagesFor("hall_images", "hall_id", ids);
                const result = rows.map(r => ({
                    ...r,
                    images: imgMap[r.id] && imgMap[r.id].length
                        ? imgMap[r.id]
                        : (r.image_url ? [r.image_url] : [])
                }));
                res.json(result);
            } catch (e) {
                res.status(500).json({ error: e.message });
            }
        }
    );
});

app.post("/bookings", (req, res) => {
    const b = req.body || {};
    const required = ["name", "phone", "booking_date", "start_time", "end_time", "guests_count"];
    for (const k of required) {
        if (b[k] === undefined || b[k] === null || b[k] === "") {
            return res.status(400).json({ error: `Поле "${k}" обязательно` });
        }
    }

    const guests = parseInt(b.guests_count, 10);
    if (!Number.isFinite(guests) || guests < 1) {
        return res.status(400).json({ error: "guests_count должен быть >= 1" });
    }
    if (String(b.start_time) >= String(b.end_time)) {
        return res.status(400).json({ error: "end_time должно быть позже start_time" });
    }

    db.query(
        "SELECT id FROM clients WHERE phone = ? LIMIT 1",
        [b.phone],
        (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });

            const createBooking = (clientId) => {
                const sql = `
                    INSERT INTO bookings
                    (client_id, hall_id, booking_date, start_time, end_time,
                     guests_count, event_type, interests, comment)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                `;
                db.query(sql, [
                    clientId,
                    b.hall_id || null,
                    b.booking_date,
                    b.start_time,
                    b.end_time,
                    guests,
                    b.event_type || null,
                    b.interests || null,
                    b.comment || null
                ], (err2, result) => {
                    if (err2) return res.status(500).json({ error: err2.message });
                    res.status(201).json({ id: result.insertId, status: "new" });
                });
            };

            if (rows.length > 0) {
                createBooking(rows[0].id);
            } else {
                db.query(
                    "INSERT INTO clients (name, email, phone) VALUES (?, ?, ?)",
                    [b.name, b.email || null, b.phone],
                    (err3, result2) => {
                        if (err3) return res.status(500).json({ error: err3.message });
                        createBooking(result2.insertId);
                    }
                );
            }
        }
    );
});

app.listen(PORT, () => {
    console.log(`Сервер запущен: http://localhost:${PORT}`);
});