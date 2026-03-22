## Описание проекта

Проект представляет собой fullstack-приложение (Node.js + Express + React + Vite) для:

- аутентификации пользователей по JWT (access/refresh),
- управления товарами,
- управления пользователями (для администратора),
- разграничения прав доступа по ролям (**RBAC**).

---

## Стек технологий

### Backend
- Node.js
- Express
- JWT (`jsonwebtoken`)
- bcrypt
- nanoid
- cors
- Swagger (`swagger-jsdoc`, `swagger-ui-express`)

### Frontend
- React
- Vite
- React Router
- Axios
- CSS

---

## Реализованные роли и права (RBAC)

### 1) Гость (неавторизованный)
- `POST /api/auth/register` — регистрация
- `POST /api/auth/login` — вход
- `POST /api/auth/refresh` — обновление токенов

### 2) Пользователь (`user`)
- `GET /api/auth/me` — профиль текущего пользователя
- `GET /api/products` — список товаров
- `GET /api/products/:id` — товар по id

### 3) Продавец (`seller`)
Права пользователя +
- `POST /api/products` — создание товара
- `PUT /api/products/:id` — редактирование товара

### 4) Администратор (`admin`)
Права продавца +
- `DELETE /api/products/:id` — удаление товара
- `GET /api/users` — список пользователей
- `GET /api/users/:id` — пользователь по id
- `PUT /api/users/:id` — изменение пользователя (включая роль)
- `DELETE /api/users/:id` — блокировка пользователя
---

## Структура проекта

```text
practice 10/
  backend/
    app.js
    package.json
  frontend/
    index.html
    package.json
    vite.config.js
    src/
      api/
        auth.js
        client.js
        products.js
        users.js
      components/
        NavBar.jsx
        ProtectedRoute.jsx
      context/
        AuthContext.jsx
      pages/
        LoginPage.jsx
        RegisterPage.jsx
        ProductsPage.jsx
        ProductDetailPage.jsx
        UsersPage.jsx
      App.jsx
      main.jsx
      styles.css
```

---

## Установка и запуск

## 1. Backend
```bash
cd "practice 10/backend"
npm install
npm run start
```

Сервер стартует на: `http://localhost:3000`  
Swagger UI: `http://localhost:3000/api-docs`

## 2. Frontend
```bash
cd "practice 10/frontend"
npm install
npm run dev
```

Клиент стартует на: `http://localhost:5173`

---

## Тестовые сценарии (рекомендуется для проверки)

1. Зарегистрировать пользователей с ролями:
    - `user`
    - `seller`
    - `admin`
2. Проверить вход под каждой ролью.
3. Проверить ограничения:
    - `user` не может создавать/редактировать/удалять товары.
    - `seller` может создавать и редактировать, но не удалять товары.
    - `admin` может всё по товарам и пользователям.
4. Проверить блокировку пользователя через admin и повторный вход заблокированного пользователя.
5. Проверить авто-refresh токена (при `401`) через axios interceptor.

---

## Соответствие требованиям задания

Реализованы:
- аутентификация и обновление токенов;
- роли и доступ на уровне backend-маршрутов;
- разграничение доступных действий на frontend;
- управление товарами;
- управление пользователями администратором.

