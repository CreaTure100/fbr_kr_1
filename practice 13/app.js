const STORAGE_KEY = "practice13_todos";

const form = document.getElementById("todo-form");
const input = document.getElementById("todo-input");
const list = document.getElementById("todo-list");

function getTodos() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
}

function saveTodos(todos) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

function renderTodos() {
  const todos = getTodos();

  if (todos.length === 0) {
    list.innerHTML = "<li>Пока нет задач.</li>";
    return;
  }

  list.innerHTML = todos
    .map((todo, index) => `<li><strong>${index + 1}.</strong> ${escapeHtml(todo)}</li>`)
    .join("");
}

function addTodo(text) {
  const todos = getTodos();
  todos.push(text);
  saveTodos(todos);
  renderTodos();
}

function escapeHtml(str) {
  return str
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const text = input.value.trim();
  if (!text) return;

  addTodo(text);
  input.value = "";
  input.focus();
});

renderTodos();

// Регистрация Service Worker
if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      const reg = await navigator.serviceWorker.register("./sw.js");
      console.log("Service Worker зарегистрирован:", reg.scope);
    } catch (error) {
      console.error("Ошибка регистрации Service Worker:", error);
    }
  });
}