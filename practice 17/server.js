const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const webpush = require('web-push');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const vapidKeys = {
  publicKey: 'BOucAx2dDNwnHlh47V0ARa6zQ_PeC7-GztcIn8CmMpZ1qYuML4e_S8r8MiGRs_lxkJumg7CMOZhvI2ZS3V7pX4c',
  privateKey: 'xLVvP1HzapcO04veP9V9IpBPwhxceEccRrQMPbvdKjc'
};

webpush.setVapidDetails(
  'mailto:your-email@example.com',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, './')));

app.get('/vapid-public-key', (req, res) => {
  res.json({ publicKey: vapidKeys.publicKey });
});

let subscriptions = [];
let reminders = new Map();

const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

io.on('connection', (socket) => {
  console.log('Клиент подключён:', socket.id);

  socket.on('newTask', (task) => {
    io.emit('taskAdded', task);

    const payload = JSON.stringify({
      title: 'Новая заметка',
      body: task.text || 'Добавлена новая заметка'
    });

    subscriptions.forEach((sub) => {
      webpush.sendNotification(sub, payload).catch((err) => {
        console.error('Push error:', err?.statusCode || '', err?.message || err);
      });
    });
  });

  socket.on('disconnect', () => {
    console.log('Клиент отключён:', socket.id);
  });

  socket.on('newReminder', (reminder) => {
    const { id, text, reminderTime } = reminder;
    const delay = reminderTime - Date.now();
    if (delay <= 0) return;

    const timeoutId = setTimeout(() => {
      const payload = JSON.stringify({
        title: '⏰ Напоминание',
        body: text,
        reminderId: id
      });

      subscriptions.forEach((sub) => {
        webpush.sendNotification(sub, payload).catch((err) => {
          console.error('Push error:', err?.statusCode || '', err?.message || err);
        });
      });

      const existing = reminders.get(id);
      if (existing) {
        reminders.set(id, { ...existing, timeoutId: null, sent: true });
      }
    }, delay);

    reminders.set(id, { timeoutId, text, reminderTime, sent: false });
  });
});


app.post('/subscribe', (req, res) => {
  const sub = req.body;
  const exists = subscriptions.some((s) => s.endpoint === sub.endpoint);
  if (!exists) subscriptions.push(sub);
  res.status(201).json({ message: 'Подписка сохранена' });
});

app.post('/unsubscribe', (req, res) => {
  const { endpoint } = req.body;
  subscriptions = subscriptions.filter((sub) => sub.endpoint !== endpoint);
  res.status(200).json({ message: 'Подписка удалена' });
});

app.post('/snooze', (req, res) => {
  const reminderId = parseInt(req.query.reminderId, 10);
  const delaySec = parseInt(req.query.delay, 10);

  if (Number.isNaN(reminderId) || !reminders.has(reminderId)) {
    return res.status(404).json({ error: 'Reminder not found' });
  }

  const allowed = [10, 300]; // 10 сек и 5 минут
  const safeDelaySec = allowed.includes(delaySec) ? delaySec : 300;

  const reminder = reminders.get(reminderId);
  if (reminder.timeoutId) clearTimeout(reminder.timeoutId);

  const newDelay = safeDelaySec * 1000;
  const newTimeoutId = setTimeout(() => {
    const payload = JSON.stringify({
      title: safeDelaySec === 10 ? 'Напоминание (отложено на 10 сек)' : 'Напоминание (отложено на 5 минут)',
      body: reminder.text,
      reminderId
    });

    subscriptions.forEach((sub) => {
      webpush.sendNotification(sub, payload).catch((err) => {
        console.error('Push error:', err?.statusCode || '', err?.message || err);
      });
    });

  }, newDelay);

  reminders.set(reminderId, {
    timeoutId: newTimeoutId,
    text: reminder.text,
    reminderTime: Date.now() + newDelay
  });

  res.status(200).json({ message: `Reminder snoozed for ${safeDelaySec} seconds` });
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`Сервер запущен: http://localhost:${PORT}`);
});