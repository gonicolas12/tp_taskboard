const API_BASE_URL = window.API_BASE_URL || "http://localhost:3000";

const taskForm = document.getElementById("task-form");
const titleInput = document.getElementById("title");
const descriptionInput = document.getElementById("description");
const taskList = document.getElementById("task-list");
const statusEl = document.getElementById("status");
const refreshBtn = document.getElementById("refresh-btn");

function setStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.style.color = isError ? "#ef4444" : "#94a3b8";
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderTasks(tasks) {
  if (!Array.isArray(tasks) || tasks.length === 0) {
    taskList.innerHTML = `<div class="empty-state">Aucune tâche pour le moment.</div>`;
    return;
  }

  taskList.innerHTML = tasks
    .map((task) => {
      const createdAt = new Date(task.created_at).toLocaleString("fr-FR");
      return `
        <article class="task-item">
          <h3>${escapeHtml(task.title)}</h3>
          <p>${escapeHtml(task.description || "Sans description")}</p>
          <div class="task-meta">
            <span>ID : ${task.id}</span>
            <span>Créée le : ${createdAt}</span>
          </div>
        </article>
      `;
    })
    .join("");
}

async function fetchTasks() {
  try {
    setStatus("Chargement des tâches...");
    const response = await fetch(`${API_BASE_URL}/tasks`);

    if (!response.ok) {
      throw new Error(`Erreur HTTP ${response.status}`);
    }

    const tasks = await response.json();
    renderTasks(tasks);
    setStatus(`${tasks.length} tâche(s) chargée(s).`);
  } catch (error) {
    console.error(error);
    setStatus("Impossible de charger les tâches.", true);
    taskList.innerHTML = `<div class="empty-state">Erreur lors du chargement.</div>`;
  }
}

async function createTask(event) {
  event.preventDefault();

  const title = titleInput.value.trim();
  const description = descriptionInput.value.trim();

  if (!title) {
    setStatus("Le titre est obligatoire.", true);
    return;
  }

  try {
    setStatus("Création de la tâche...");
    const response = await fetch(`${API_BASE_URL}/tasks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ title, description })
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP ${response.status}`);
    }

    taskForm.reset();
    setStatus("Tâche créée avec succès.");
    await fetchTasks();
  } catch (error) {
    console.error(error);
    setStatus("Impossible de créer la tâche.", true);
  }
}

taskForm.addEventListener("submit", createTask);
refreshBtn.addEventListener("click", fetchTasks);

fetchTasks();