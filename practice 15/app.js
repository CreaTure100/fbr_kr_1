const contentDiv = document.getElementById('app-content');
const homeBtn = document.getElementById('home-btn');
const aboutBtn = document.getElementById('about-btn');

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
    contentDiv.innerHTML = `<p class="is-center text-error">Ошибка загрузки страницы.</p>`;
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

function initNotes() {
  const form = document.getElementById('note-form');
  const input = document.getElementById('note-input');
  const list = document.getElementById('notes-list');

  function loadNotes() {
    const notes = JSON.parse(localStorage.getItem('notes') || '[]');
    if (!notes.length) {
      list.innerHTML = '<li class="empty-message">Нет заметок. Добавьте первую!</li>';
      return;
    }

    list.innerHTML = notes.map((note, index) => `
      <li class="card" style="margin-bottom: .5rem; padding: .5rem;">
        <div style="display:flex;justify-content:space-between;gap:10px;align-items:center;">
          <span class="note-text">${note}</span>
          <button class="delete-btn" data-index="${index}" type="button">Удалить</button>
        </div>
      </li>
    `).join('');
  }

  function addNote(text) {
    const notes = JSON.parse(localStorage.getItem('notes') || '[]');
    notes.push(text);
    localStorage.setItem('notes', JSON.stringify(notes));
    loadNotes();
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
    if (text) {
      addNote(text);
      input.value = '';
    }
  });

  list.addEventListener('click', (e) => {
    if (e.target.classList.contains('delete-btn')) {
      deleteNote(Number(e.target.dataset.index));
    }
  });

  loadNotes();
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('./sw.js');
      console.log('SW зарегистрирован:', reg.scope);
    } catch (err) {
      console.error('Ошибка регистрации SW:', err);
    }
  });
}