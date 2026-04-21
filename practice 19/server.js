const express = require('express');
const { Sequelize, DataTypes } = require('sequelize');

const app = express();
app.use(express.json());

//  PostgreSQL connection
const sequelize = new Sequelize('mydatabase', 'postgres', '1234qwer', {
  host: 'localhost',
  port: 5432,
  dialect: 'postgres',
  logging: false,
});

//  User model
const User = sequelize.define(
  'User',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    first_name: { type: DataTypes.STRING, allowNull: false },
    last_name: { type: DataTypes.STRING, allowNull: false },
    age: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 0 } },
    created_at: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: () => Math.floor(Date.now() / 1000),
    },
    updated_at: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: () => Math.floor(Date.now() / 1000),
    },
  },
  {
    tableName: 'users',
    timestamps: false,
  }
);

//  создание пользователя
app.post('/api/users', async (req, res) => {
  try {
    const { first_name, last_name, age } = req.body;

    const user = await User.create({
      first_name,
      last_name,
      age,
      created_at: Math.floor(Date.now() / 1000),
      updated_at: Math.floor(Date.now() / 1000),
    });

    res.status(201).json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

//  список пользователей
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.findAll({ order: [['id', 'ASC']] });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//  получить одного пользователя
app.get('/api/users/:id', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//  обновить пользователя
app.patch('/api/users/:id', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) return res.status(404).json({ message: 'User not found' });

    const { first_name, last_name, age } = req.body;

    await user.update({
      first_name: first_name ?? user.first_name,
      last_name: last_name ?? user.last_name,
      age: age ?? user.age,
      updated_at: Math.floor(Date.now() / 1000),
    });

    res.json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

//  удалить пользователя
app.delete('/api/users/:id', async (req, res) => {
  try {
    const deleted = await User.destroy({ where: { id: req.params.id } });

    if (!deleted) return res.status(404).json({ message: 'User not found' });

    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start server
async function start() {
  try {
    await sequelize.authenticate();
    console.log('Connected to PostgreSQL');

    await sequelize.sync({ alter: true });
    console.log('Database synced');

    app.listen(3000, () => {
      console.log('Server is running on http://localhost:3000');
    });
  } catch (err) {
    console.error('Startup error:', err);
  }
}

start();