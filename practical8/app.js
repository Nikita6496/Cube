const express = require("express");
const app = express();

app.use(express.json());

let products = [
    { id: 1, name: "Кроссовки Nike", price: 12990, category: "Обувь" },
    { id: 2, name: "Кроссовки Adidas", price: 9990, category: "Обувь" },
    { id: 3, name: "Футболка Basic", price: 1500, category: "Одежда" }
];

// 1. Получение всех объектов (с поддержкой фильтрации и сортировки)
app.get("/products", (req, res) => {
    let result = [...products];

    const category = req.query.category;
    if (category) {
        result = result.filter(p => p.category.toLowerCase() === category.toLowerCase());
    }

    const sort = req.query.sort;
    if (sort === "price_asc") {
        result.sort((a, b) => a.price - b.price);
    } else if (sort === "price_desc") {
        result.sort((a, b) => b.price - a.price);
    }

    res.status(200).json(result);
});

// 2 ДОП. ЗАДАНИЕ: Поиск по названию
app.get("/products/search", (req, res) => {
    const searchName = req.query.name;
    
    if (!searchName) {
        return res.status(400).json({ message: "Укажите параметр name" });
    }
    
    const result = products.filter(p => 
        p.name.toLowerCase().includes(searchName.toLowerCase())
    );
    
    res.status(200).json(result);
});

// 3 Получение объекта по идентификатору
app.get("/products/:id", (req, res) => {
    const product = products.find(p => p.id === Number(req.params.id));
    
    if (!product) {
        return res.status(404).json({ message: "Товар не найден" });
    }
    
    res.status(200).json(product);
});

// 4 Добавление нового объекта
app.post("/products", (req, res) => {
    const { name, price, category } = req.body;

    if (!name || !price || !category) {
        return res.status(400).json({ message: "Необходимо заполнить все поля" });
    }

    const newProduct = {
        id: Date.now(),
        name,
        price,
        category
    };

    products.push(newProduct);
    res.status(201).json(newProduct);
});

// 5 Изменение объекта (PUT)
app.put("/products/:id", (req, res) => {
    const product = products.find(p => p.id === Number(req.params.id));
    
    if (!product) {
        return res.status(404).json({ message: "Товар не найден" });
    }

    const { name, price, category } = req.body;
    
    product.name = name || product.name;
    product.price = price || product.price;
    product.category = category || product.category;

    res.status(200).json(product);
});

// 6 Удаление объекта (DELETE)
app.delete("/products/:id", (req, res) => {
    const id = Number(req.params.id);
    const product = products.find(p => p.id === id);

    if (!product) {
        return res.status(404).json({ message: "Товар не найден" });
    }

    products = products.filter(p => p.id !== id);

    res.status(200).json({ message: "Товар успешно удалён" });
});

// Запуск сервера
app.listen(3000, () => {
    console.log("Сервер API запущен на порту 3000");
});