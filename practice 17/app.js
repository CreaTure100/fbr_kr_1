const contentDiv = document.getElementById('app-content');
const homeBtn = document.getElementById('home-btn');
const aboutBtn = document.getElementById('about-btn');
const enableBtn = document.getElementById('enable-push');
const disableBtn = document.getElementById('disable-push');

const socket = io('http://localhost:3001');

function setActiveButton(activeId) {
  [homeBtn, aboutBtn].forEach((btn) => btn.classList.remove('active'));
  document.getElementById(activeId).classList.add('active');
}

async function loadContent(page) {
  try {
    const response = await fetch(`./content/${page}.html`, { cache: 'no-cache' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    contentDiv.innerHTML = await response.text();
    if (page === 'home') initNotes();
  } catch (err) {
    contentDiv.innerHTML = `<p class="text-error">Ошибка загрузки страницы.</p>`;
    console.error(err);
  }
}

homeBtn.addEventListener('click', () => {
  setActiveButton('home-btn');
  loadContent('home');
});

aboutBtn.addEventListener('click', () => {
  setActiveButton('about-btn');
  loadContent('about');
});

loadContent('home');

function toast(message) {
  const notification = document.createElement('div');
  notification.className = 'toast';
  notification.textContent = message;
  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 3000);
}

function initNotes() {
  const form = document.getElementById('note-form');
  const input = document.getElementById('note-input');

  const reminderForm = document.getElementById('reminder-form');
  const reminderText = document.getElementById('reminder-text');
  const reminderTime = document.getElementById('reminder-time');

  const list = document.getElementById('notes-list');

  function loadNotes() {
    const notes = JSON.parse(localStorage.getItem('notes') || '[]');

    if (!notes.length) {
      list.innerHTML = '<li class="empty-message">Нет заметок. Добавьте первую!</li>';
      return;
    }

    list.innerHTML = notes.map((note, index) => {
      let reminderInfo = '';
      if (note.reminder) {
        const date = new Date(note.reminder);
        reminderInfo = `<br><small>⏰ Напоминание: ${date.toLocaleString()}</small>`;
      }

      return `
        <li class="card-item">
          <div class="card-row">
            <span class="note-text">
              ${note.text}
              ${reminderInfo}
            </span>
            <button class="delete-btn" data-index="${index}" type="button">Удалить</button>
          </div>
        </li>
      `;
    }).join('');
  }

  function addNote(text, reminderTimestamp = null) {
    const notes = JSON.parse(localStorage.getItem('notes') || '[]');
    const newNote = { id: Date.now(), text, reminder: reminderTimestamp };
    notes.push(newNote);
    localStorage.setItem('notes', JSON.stringify(notes));
    loadNotes();

    if (reminderTimestamp) {
      socket.emit('newReminder', {
        id: newNote.id,
        text: newNote.text,
        reminderTime: reminderTimestamp
      });
    } else {
      socket.emit('newTask', { text: newNote.text, timestamp: Date.now() });
    }
  }

  function deleteNote(index) {
    const notes = JSON.parse(localStorage.getItem('notes') || '[]');
    notes.splice(index, 1);
    localStorage.setItem('notes', JSON.stringify(notes));
    loadNotes();
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    addNote(text);
    input.value = '';
  });

  reminderForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = reminderText.value.trim();
    const datetime = reminderTime.value;

    if (!text || !datetime) return;

    const timestamp = new Date(datetime).getTime();
    if (timestamp <= Date.now()) {
      alert('Дата напоминания должна быть в будущем');
      return;
    }

    addNote(text, timestamp);
    reminderText.value = '';
    reminderTime.value = '';
  });

  list.addEventListener('click', (e) => {
    if (e.target.classList.contains('delete-btn')) {
      deleteNote(Number(e.target.dataset.index));
    }
  });

  loadNotes();
}

socket.on('taskAdded', (task) => {
  toast(`Новая заметка: ${task.text}`);
});

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

async function subscribeToPush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

  try {
    const registration = await navigator.serviceWorker.ready;

    const keyRes = await fetch('http://localhost:3001/vapid-public-key');
    const { publicKey } = await keyRes.json();

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey)
    });

    await fetch('http://localhost:3001/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscription)
    });

    console.log('Подписка на push отправлена');
  } catch (err) {
    console.error('Ошибка подписки на push:', err);
  }
}

async function unsubscribeFromPush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();

  if (subscription) {
    await fetch('http://localhost:3001/unsubscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint: subscription.endpoint })
    });

    await subscription.unsubscribe();
    console.log('Отписка выполнена');
  }
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('./sw.js');
      console.log('SW registered');

      if (enableBtn && disableBtn) {
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          enableBtn.style.display = 'none';
          disableBtn.style.display = 'inline-block';
        }

        enableBtn.addEventListener('click', async () => {
          if (Notification.permission === 'denied') {
            alert('Уведомления запрещены. Разрешите их в настройках браузера.');
            return;
          }
          if (Notification.permission === 'default') {
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
              alert('Необходимо разрешить уведомления.');
              return;
            }
          }

          await subscribeToPush();
          enableBtn.style.display = 'none';
          disableBtn.style.display = 'inline-block';
        });

        disableBtn.addEventListener('click', async () => {
          await unsubscribeFromPush();
          disableBtn.style.display = 'none';
          enableBtn.style.display = 'inline-block';
        });
      }
    } catch (err) {
      console.log('SW registration failed:', err);
    }
  });
}