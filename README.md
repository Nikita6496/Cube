# Антикафе "КУБ"

Сайт антикафе с бэкендом на Node.js + Express + MySQL.

## Требования
- Node.js 18+
- MySQL (или OpenServer)

## Установка

1. Клонировать репозиторий:
   ```
   git clone https://github.com/USERNAME/Cube.git
   cd Cube
   ```

2. Установить зависимости:
   ```
   npm install
   ```

3. Создать БД:
   - Открыть phpMyAdmin / MySQL
   - Выполнить SQL из `cube_db.sql`
   - Заполнить таблицы

4. Настроить подключение:
   - Скопировать `.env.example` → `.env`
   - Указать свои `DB_USER`, `DB_PASSWORD`, `DB_PORT`

5. Запустить:
   ```
   node app.js
   ```

6. Открыть: http://localhost:3000

## Демо (GitHub Pages)
https://USERNAME.github.io/Cube/ — ваша статичная версия без БД.
https://nikita6496.github.io/Cube / — текущая статичная версия без БД.