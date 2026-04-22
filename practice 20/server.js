const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const MONGO_URL = 'mongodb://YourMongoAdmin:1234@127.0.0.1:27017/practice20_db?authSource=admin';

mongoose.connect(MONGO_URL)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

const userSchema = new mongoose.Schema({
  id: { type: Number, unique: true, required: true },
  first_name: { type: String, required: true },
  last_name: { type: String, required: true },
  age: { type: Number, required: true, min: 0 },
  created_at: { type: Number, required: true },
  updated_at: { type: Number, required: true }
});

const User = mongoose.model('User', userSchema);

const nowUnix = () => Math.floor(Date.now() / 1000);


app.post('/api/users', async (req, res) => {
  try {
    const { id, first_name, last_name, age } = req.body;

    if (id === undefined || !first_name || !last_name || age === undefined) {
      return res.status(400).json({ message: 'Fields id, first_name, last_name, age are required' });
    }

    const user = new User({
      id: Number(id),
      first_name: String(first_name),
      last_name: String(last_name),
      age: Number(age),
      created_at: nowUnix(),
      updated_at: nowUnix()
    });

    await user.save();
    return res.status(201).json(user);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
});

app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find().sort({ id: 1 });
    return res.json(users);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});


app.get('/api/users/:id', async (req, res) => {
  try {
    const user = await User.findOne({ id: Number(req.params.id) });
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json(user);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});


app.patch('/api/users/:id', async (req, res) => {
  try {
    const updates = { ...req.body, updated_at: nowUnix() };

    if ('created_at' in updates) delete updates.created_at;

    if ('id' in updates) delete updates.id;

    const user = await User.findOneAndUpdate(
      { id: Number(req.params.id) },
      updates,
      { new: true, runValidators: true }
    );

    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json(user);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
});


app.delete('/api/users/:id', async (req, res) => {
  try {
    const user = await User.findOneAndDelete({ id: Number(req.params.id) });
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json({ message: 'User deleted', user });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running: http://localhost:${PORT}`);
});