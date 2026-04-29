const express = require('express');
const cors = require('cors');
const { nanoid } = require('nanoid');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { createClient } = require('redis');

const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const app = express();
const port = 3000;

const JWT_SECRET = 'secret_key';
const REFRESH_SECRET = 'refresh_secret_key';

const ACCESS_EXPIRES_IN = '15m';
const REFRESH_EXPIRES_IN = '7d';

const USERS_CACHE_TTL = 60; // 1 минута
const PRODUCTS_CACHE_TTL = 600; // 10 минут

let refreshTokens = new Set();

// Redis Client
const redisClient = createClient({
  url: "redis://127.0.0.1:6379"
});

redisClient.on("error", (err) => {
  console.error("Redis error:", err);
});

async function initRedis() {
  await redisClient.connect();
  console.log("Redis connected");
}

app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

let users = [];
let products = [
  {
    id: nanoid(),
    title: 'Игровая консоль XPro',
    category: 'Электроника',
    description: 'Мощная консоль с поддержкой 4K, SSD 1TB и трассировкой лучей.',
    price: 45999.99,
    image: '/images/console.webp'
  },
  {
    id: nanoid(),
    title: 'Беспроводные наушники AirBeat',
    category: 'Аудио',
    description: 'Шумоподавление, автономность до 30 часов, быстрая зарядка.',
    price: 8999,
    image: '/images/headphones.jpg'
  },
  {
    id: nanoid(),
    title: 'Смартфон Nova 14',
    category: 'Смартфоны',
    description: 'AMOLED 120Hz, камера 108MP, батарея 5000mAh.',
    price: 32990,
    image: '/images/phone.webp'
  },
  {
    id: nanoid(),
    title: 'Умные часы FitTime S',
    category: 'Гаджеты',
    description: 'Мониторинг сна и пульса, GPS, влагозащита 5ATM.',
    price: 12990,
    image: '/images/watch.webp'
  }
];

async function hashPassword(password) {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

async function verifyPassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash);
}

function generateAccessToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
      isBlocked: user.isBlocked
    },
    JWT_SECRET,
    { expiresIn: ACCESS_EXPIRES_IN }
  );
}

function generateRefreshToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      username: user.email,
      role: user.role
    },
    REFRESH_SECRET,
    { expiresIn: REFRESH_EXPIRES_IN }
  );
}

function authMiddleware(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = users.find((u) => u.id === payload.sub);

    if (!user) return res.status(401).json({ error: 'User not found' });
    if (user.isBlocked) return res.status(403).json({ error: 'User is blocked' });

    req.user = payload;
    req.userActual = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function roleMiddleware(allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}

// Middleware для чтения из кэша
function cacheMiddleware(keyBuilder, ttl) {
  return async (req, res, next) => {
    try {
      const key = keyBuilder(req);
      const cachedData = await redisClient.get(key);
      if (cachedData) {
        // Мы возвращаем данные в том же формате, который ожидает фронтенд (без обёртки source)
        // Чтобы не ломать фронтенд из 11 практики.
        res.setHeader('X-Cache', 'HIT');
        return res.json(JSON.parse(cachedData));
      }
      req.cacheKey = key;
      req.cacheTTL = ttl;
      next();
    } catch (err) {
      console.error("Cache read error:", err);
      next();
    }
  };
}

// Сохранение в кэш
async function saveToCache(key, data, ttl) {
  try {
    await redisClient.set(key, JSON.stringify(data), { EX: ttl });
  } catch (err) {
    console.error("Cache save error:", err);
  }
}

// Инвалидация кэша пользователей
async function invalidateUsersCache(userId = null) {
  try {
    await redisClient.del("users:all");
    if (userId) {
      await redisClient.del(`users:${userId}`);
    }
  } catch (err) {
    console.error("Users cache invalidate error:", err);
  }
}

// Инвалидация кэша продуктов
async function invalidateProductsCache(productId = null) {
  try {
    await redisClient.del("products:all");
    if (productId) {
      await redisClient.del(`products:${productId}`);
    }
  } catch (err) {
    console.error("Products cache invalidate error:", err);
  }
}

function sanitizeUser(user) {
  const { password, ...safe } = user;
  return safe;
}

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API AUTH + PRODUCTS + USERS (RBAC)',
      version: '2.0.0',
      description: 'Практика №11: RBAC + Redis Cache',
    },
    servers: [{ url: `http://localhost:${port}`, description: 'Локальный сервер' }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }
      }
    }
  },
  apis: ['./app.js'],
};

const specs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

app.post('/api/auth/register', async (req, res) => {
  const { email, first_name, last_name, password, role } = req.body;

  if (!email || !first_name || !last_name || !password) {
    return res.status(400).json({ error: 'Все поля (email, first_name, last_name, password) обязательны' });
  }

  const existingUser = users.find(user => user.email === email);
  if (existingUser) {
    return res.status(400).json({ error: 'Пользователь с таким email уже существует' });
  }

  const allowedRoles = ['user', 'seller', 'admin'];
  const safeRole = allowedRoles.includes(role) ? role : 'user';

  try {
    const hashedPassword = await hashPassword(password);

    const newUser = {
      id: nanoid(),
      email,
      first_name,
      last_name,
      password: hashedPassword,
      role: safeRole,
      isBlocked: false
    };

    users.push(newUser);
    await invalidateUsersCache(); // инвалидируем список пользователей
    res.status(201).json(sanitizeUser(newUser));
  } catch (error) {
    console.error('Ошибка при регистрации:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email и пароль обязательны' });
  }

  const user = users.find(u => u.email === email);
  if (!user) return res.status(401).json({ error: 'Неверные учетные данные' });
  if (user.isBlocked) return res.status(403).json({ error: 'Пользователь заблокирован' });

  try {
    const isPasswordCorrect = await verifyPassword(password, user.password);
    if (!isPasswordCorrect) return res.status(401).json({ error: 'Неверные учетные данные' });

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    refreshTokens.add(refreshToken);

    res.status(200).json({ accessToken, refreshToken });
  } catch (error) {
    console.error('Ошибка при авторизации:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

app.post('/api/auth/refresh', (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) return res.status(400).json({ error: 'refreshToken is required' });
  if (!refreshTokens.has(refreshToken)) return res.status(401).json({ error: 'Invalid refresh token' });

  try {
    const payload = jwt.verify(refreshToken, REFRESH_SECRET);
    const user = users.find((u) => u.id === payload.sub);

    if (!user) return res.status(401).json({ error: 'User not found' });
    if (user.isBlocked) return res.status(403).json({ error: 'User is blocked' });

    refreshTokens.delete(refreshToken);

    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    refreshTokens.add(newRefreshToken);

    res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
  } catch {
    return res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
});

app.get('/api/auth/me', authMiddleware, roleMiddleware(['user', 'seller', 'admin']), (req, res) => {
  res.json(sanitizeUser(req.userActual));
});

// ===== USERS (admin only) =====
app.get(
  '/api/users',
  authMiddleware,
  roleMiddleware(['admin']),
  cacheMiddleware(() => "users:all", USERS_CACHE_TTL),
  async (req, res) => {
    const data = users.map(sanitizeUser);
    await saveToCache(req.cacheKey, data, req.cacheTTL);
    res.setHeader('X-Cache', 'MISS');
    res.json(data);
  }
);

app.get(
  '/api/users/:id',
  authMiddleware,
  roleMiddleware(['admin']),
  cacheMiddleware((req) => `users:${req.params.id}`, USERS_CACHE_TTL),
  async (req, res) => {
    const user = users.find((u) => u.id === req.params.id);
    if (!user) return res.status(404).json({ error: 'Пользователь не найден' });

    const data = sanitizeUser(user);
    await saveToCache(req.cacheKey, data, req.cacheTTL);
    res.setHeader('X-Cache', 'MISS');
    res.json(data);
  }
);

app.put('/api/users/:id', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  const { first_name, last_name, role, isBlocked, password } = req.body;
  const idx = users.findIndex((u) => u.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Пользователь не найден' });

  if (role && !['user', 'seller', 'admin'].includes(role)) {
    return res.status(400).json({ error: 'Некорректная роль' });
  }

  if (typeof isBlocked === 'boolean') users[idx].isBlocked = isBlocked;
  if (first_name) users[idx].first_name = first_name;
  if (last_name) users[idx].last_name = last_name;
  if (role) users[idx].role = role;
  if (password) users[idx].password = await hashPassword(password);

  const updatedUser = sanitizeUser(users[idx]);
  await invalidateUsersCache(req.params.id);

  res.json(updatedUser);
});

app.delete('/api/users/:id', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  const idx = users.findIndex((u) => u.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Пользователь не найден' });

  users[idx].isBlocked = true;
  await invalidateUsersCache(req.params.id);

  res.json({ message: 'Пользователь заблокирован', user: sanitizeUser(users[idx]) });
});

// ===== PRODUCTS =====
app.post('/api/products', authMiddleware, roleMiddleware(['seller', 'admin']), async (req, res) => {
  const { title, category, description, price, image } = req.body;
  if (!title || !category || !description || price === undefined) {
    return res.status(400).json({ error: 'Все поля (title, category, description, price) обязательны' });
  }
  if (typeof price !== 'number' || price < 0) {
    return res.status(400).json({ error: 'Поле price должно быть положительным числом' });
  }

  const newProduct = {
    id: nanoid(),
    title,
    category,
    description,
    price,
    image: image || '/images/placeholder.webp'
  };

  products.push(newProduct);
  await invalidateProductsCache(); // инвалидируем список товаров

  res.status(201).json(newProduct);
});

app.get(
  '/api/products',
  authMiddleware,
  roleMiddleware(['user', 'seller', 'admin']),
  cacheMiddleware(() => "products:all", PRODUCTS_CACHE_TTL),
  async (req, res) => {
    await saveToCache(req.cacheKey, products, req.cacheTTL);
    res.setHeader('X-Cache', 'MISS');
    res.json(products);
  }
);

app.get(
  '/api/products/:id',
  authMiddleware,
  roleMiddleware(['user', 'seller', 'admin']),
  cacheMiddleware((req) => `products:${req.params.id}`, PRODUCTS_CACHE_TTL),
  async (req, res) => {
    const product = products.find(p => p.id === req.params.id);
    if (!product) return res.status(404).json({ error: 'Товар не найден' });

    await saveToCache(req.cacheKey, product, req.cacheTTL);
    res.setHeader('X-Cache', 'MISS');
    res.json(product);
  }
);

app.put('/api/products/:id', authMiddleware, roleMiddleware(['seller', 'admin']), async (req, res) => {
  const { title, category, description, price, image } = req.body;
  const idx = products.findIndex(p => p.id === req.params.id);

  if (idx === -1) return res.status(404).json({ error: 'Товар не найден' });
  if (!title || !category || !description || price === undefined) {
    return res.status(400).json({ error: 'Все поля обязательны для обновления' });
  }
  if (typeof price !== 'number' || price < 0) {
    return res.status(400).json({ error: 'Поле price должно быть положительным числом' });
  }

  products[idx] = {
    ...products[idx],
    title,
    category,
    description,
    price,
    image: image || products[idx].image || '/images/placeholder.webp'
  };

  await invalidateProductsCache(req.params.id);

  res.json(products[idx]);
});

app.delete('/api/products/:id', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  const idx = products.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Товар не найден' });

  products.splice(idx, 1);
  await invalidateProductsCache(req.params.id);

  res.json({ message: 'Товар удален' });
});

initRedis().then(() => {
  app.listen(port, () => {
    console.log(`Сервер запущен на http://localhost:${port}`);
  });
});
