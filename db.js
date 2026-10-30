require("dotenv").config();
const mysql = require("mysql2");

const connection = mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "cube_db",
    port: parseInt(process.env.DB_PORT || "3306", 10)
});

connection.connect((err) => {
    if (err) {
        console.log("Ошибка подключения:", err.message);
        return;
    }
    console.log("Подключение к MySQL успешно");
});

module.exports = connection;