const express = require("express");
const app = express();

const games = [
    {
        id: 1,
        title: "Minecraft",
        genre: "Sandbox"
    },
    {
        id: 2,
        title: "Counter-Strike 2",
        genre: "Shooter"
    },
    {
        id: 3,
        title: "The Witcher 3",
        genre: "RPG"
    }
];

app.get("/", (req, res) => {
    res.send("Добро пожаловать в каталог игр");
});

app.get("/about", (req, res) => {
    res.send("API каталога игр");
});

app.get("/games", (req, res) => {
    res.json(games);
});

app.get("/news", (req, res) => {
    res.json([
        { id: 1, title: "Выход Minecraft 2", date: "2026-10-01" },
        { id: 2, title: "Обновление Counter-Strike 2", date: "2026-09-25" }
    ]);
});

app.get("/rating", (req, res) => {
    res.json([
        { id: 1, title: "The Witcher 3", rating: 9.8 },
        { id: 2, title: "Minecraft", rating: 9.5 },
        { id: 3, title: "Counter-Strike 2", rating: 8.7 }
    ]);
});

app.get("/genres", (req, res) => {
    res.json([
        { id: 1, name: "Sandbox" },
        { id: 2, name: "Shooter" },
        { id: 3, name: "RPG" }
    ]);
});

app.listen(3000, () => {
    console.log("Сервер запущен на порту 3000");
});