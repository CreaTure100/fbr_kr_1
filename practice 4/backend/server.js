const express = require("express");
const cors = require("cors");
const { nanoid } = require("nanoid");

const app = express();
const port = 3000;

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:3001",
    methods: ["GET", "POST", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Логирование запросов
app.use((req, res, next) => {
  res.on("finish", () => {
    console.log(
      `[${new Date().toISOString()}] [${req.method}] ${res.statusCode} ${req.path}`
    );
    if (["POST", "PUT", "PATCH"].includes(req.method)) {
      console.log("Body:", req.body);
    }
  });
  next();
});

// Демо-данные (10+ товаров)
let products = [
  {
    id: nanoid(6),
    title: "Беспроводная мышь Logitech M185",
    category: "Периферия",
    description: "Компактная мышь с USB-ресивером и длительной автономностью.",
    price: 1290,
    stock: 35,
  },
  {
    id: nanoid(6),
    title: "Клавиатура Redragon Kumara",
    category: "Периферия",
    description: "Механическая клавиатура с подсветкой и защитой от ghosting.",
    price: 3590,
    stock: 18,
  },
  {
    id: nanoid(6),
    title: 'Монитор Samsung 24"',
    category: "Мониторы",
    description: "IPS-матрица, Full HD, частота обновления 75 Гц.",
    price: 12990,
    stock: 12,
  },
  {
    id: nanoid(6),
    title: "Наушники Sony WH-CH520",
    category: "Аудио",
    description: "Bluetooth-наушники с микрофоном и автономностью до 50 часов.",
    price: 5490,
    stock: 22,
  },
  {
    id: nanoid(6),
    title: "Веб-камера Logitech C270",
    category: "Веб-камеры",
    description: "HD 720p, встроенный микрофон, автоэкспозиция.",
    price: 2490,
    stock: 16,
  },
  {
    id: nanoid(6),
    title: "SSD Kingston NV2 1TB",
    category: "Накопители",
    description: "M.2 NVMe SSD, высокая скорость чтения и записи.",
    price: 6990,
    stock: 27,
  },
  {
    id: nanoid(6),
    title: "Ноутбук ASUS VivoBook 15",
    category: "Ноутбуки",
    description: "15.6”, Ryzen 5, 16GB RAM, SSD 512GB.",
    price: 58990,
    stock: 7,
  },
  {
    id: nanoid(6),
    title: "Wi‑Fi роутер TP-Link Archer C6",
    category: "Сеть",
    description: "Двухдиапазонный роутер с поддержкой MU-MIMO.",
    price: 3290,
    stock: 19,
  },
  {
    id: nanoid(6),
    title: "USB‑хаб UGREEN 4 порта",
    category: "Аксессуары",
    description: "USB 3.0 хаб для подключения периферии.",
    price: 1490,
    stock: 44,
  },
  {
    id: nanoid(6),
    title: "Колонки Creative Pebble 2.0",
    category: "Аудио",
    description: "Компактные настольные колонки с питанием от USB.",
    price: 2990,
    stock: 14,
  },
];

// Валидация
function validateProductPayload(body, isPatch = false) {
  const errors = [];

  const hasTitle = body?.title !== undefined;
  const hasCategory = body?.category !== undefined;
  const hasDescription = body?.description !== undefined;
  const hasPrice = body?.price !== undefined;
  const hasStock = body?.stock !== undefined;

  if (isPatch && !hasTitle && !hasCategory && !hasDescription && !hasPrice && !hasStock) {
    errors.push("Nothing to update");
    return errors;
  }

  if (!isPatch || hasTitle) {
    if (typeof body.title !== "string" || !body.title.trim()) {
      errors.push("title must be a non-empty string");
    }
  }

  if (!isPatch || hasCategory) {
    if (typeof body.category !== "string" || !body.category.trim()) {
      errors.push("category must be a non-empty string");
    }
  }

  if (!isPatch || hasDescription) {
    if (typeof body.description !== "string" || !body.description.trim()) {
      errors.push("description must be a non-empty string");
    }
  }

  if (!isPatch || hasPrice) {
    const price = Number(body.price);
    if (!Number.isFinite(price) || price < 0) {
      errors.push("price must be a number >= 0");
    }
  }

  if (!isPatch || hasStock) {
    const stock = Number(body.stock);
    if (!Number.isInteger(stock) || stock < 0) {
      errors.push("stock must be an integer >= 0");
    }
  }

  return errors;
}

function findProductOr404(id, res) {
  const product = products.find((p) => p.id === id);
  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return null;
  }
  return product;
}

// POST /api/products
app.post("/api/products", (req, res) => {
  const errors = validateProductPayload(req.body, false);
  if (errors.length) return res.status(400).json({ errors });

  const newProduct = {
    id: nanoid(6),
    title: req.body.title.trim(),
    category: req.body.category.trim(),
    description: req.body.description.trim(),
    price: Number(req.body.price),
    stock: Number(req.body.stock),
  };

  products.push(newProduct);
  res.status(201).json(newProduct);
});

// GET /api/products
app.get("/api/products", (req, res) => {
  res.json(products);
});

// GET /api/products/:id
app.get("/api/products/:id", (req, res) => {
  const product = findProductOr404(req.params.id, res);
  if (!product) return;
  res.json(product);
});

// PATCH /api/products/:id
app.patch("/api/products/:id", (req, res) => {
  const product = findProductOr404(req.params.id, res);
  if (!product) return;

  const errors = validateProductPayload(req.body, true);
  if (errors.length) return res.status(400).json({ errors });

  const { title, category, description, price, stock } = req.body;

  if (title !== undefined) product.title = title.trim();
  if (category !== undefined) product.category = category.trim();
  if (description !== undefined) product.description = description.trim();
  if (price !== undefined) product.price = Number(price);
  if (stock !== undefined) product.stock = Number(stock);

  res.json(product);
});

// DELETE /api/products/:id
app.delete("/api/products/:id", (req, res) => {
  const exists = products.some((p) => p.id === req.params.id);
  if (!exists) return res.status(404).json({ error: "Product not found" });

  products = products.filter((p) => p.id !== req.params.id);
  res.status(204).send();
});

// 404
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Глобальный обработчик ошибок
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(port, () => {
  console.log(`Backend started: http://localhost:${port}`);
});