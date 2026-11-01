/* ═══════════════════════════════════════════════════════
   dashboard.js – Static Dashboard Logic with Storage & Simulation
   ═══════════════════════════════════════════════════════ */
"use strict";

// ── Default Sample Projects ────────────────────────────────
const DEFAULT_PROJECTS = [
  {
    id: "proj_1",
    title: "AI Viva Examination Simulator",
    file_type: "PDF",
    file_size_bytes: 3420000,
    processing_status: "ready",
    chunk_count: 48,
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    technologies: ["Python", "Flask", "FAISS", "Groq Llama-3", "Whisper", "Vector Embeddings", "SQLite"],
  },
  {
    id: "proj_2",
    title: "Smart Library Management System",
    file_type: "DOCX",
    file_size_bytes: 1850000,
    processing_status: "ready",
    chunk_count: 32,
    created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
    technologies: ["Node.js", "Express", "PostgreSQL", "JWT Auth", "Redis", "Docker"],
  },
  {
    id: "proj_3",
    title: "Autonomous Drone Navigation & Obstacle Avoidance",
    file_type: "PDF",
    file_size_bytes: 5120000,
    processing_status: "ready",
    chunk_count: 64,
    created_at: new Date(Date.now() - 3600000 * 72).toISOString(),
    technologies: ["Python", "ROS2", "YOLOv8", "OpenCV", "LiDAR", "C++", "Kalman Filter"],
  },
];

// ── State ──────────────────────────────────────────────────
let selectedFile = null;
let voiceMode = false;
let projects = [];

// ── Toast Utility ──────────────────────────────────────────
function toast(msg, type = "info", duration = 4000) {
  const icons = { success: "✅", error: "❌", info: "ℹ️", warn: "⚠️" };
  const container = document.getElementById("toastContainer");
  if (!container) return;
  const el = document.createElement("div");
  el.className = `toast ${type}`;
  el.innerHTML = `<span class="toast-icon">${icons[type] || "ℹ️"}</span>
                  <span class="toast-msg">${msg}</span>`;
  container.appendChild(el);
  setTimeout(() => el.remove(), duration);
}

function formatBytes(bytes) {
  if (!bytes) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function escapeHtml(str) {
  return String(str || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// ── Initialization ─────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  const dropZone = document.getElementById("dropZone");
  const fileInput = document.getElementById("fileInput");
  const uploadForm = document.getElementById("uploadForm");
  const fileName = document.getElementById("fileName");
  const fileSize = document.getElementById("fileSize");
  const clearFileBtn = document.getElementById("clearFileBtn");
  const uploadBtn = document.getElementById("uploadBtn");
  const processingStatus = document.getElementById("processingStatus");
  const statusTitle = document.getElementById("statusTitle");
  const statusMsg = document.getElementById("statusMsg");
  const statusIcon = document.getElementById("statusIcon");
  const progressFill = document.getElementById("progressFill");
  const techTags = document.getElementById("techTags");
  const projectsGrid = document.getElementById("projectsGrid");
  const textModeBtn = document.getElementById("textModeBtn");
  const voiceModeBtn = document.getElementById("voiceModeBtn");
  const apiStatusBadge = document.getElementById("apiStatusBadge");

  if (apiStatusBadge) {
    apiStatusBadge.className = "badge badge-ok";
    apiStatusBadge.textContent = "Static / GitHub Ready";
  }

  // Load projects from localStorage or default
  const stored = localStorage.getItem("viva_simulator_projects");
  if (stored) {
    try {
      projects = JSON.parse(stored);
    } catch (_) {
      projects = [...DEFAULT_PROJECTS];
    }
  } else {
    projects = [...DEFAULT_PROJECTS];
    saveProjects();
  }

  renderProjects();

  function saveProjects() {
    localStorage.setItem("viva_simulator_projects", JSON.stringify(projects));
  }

  // Drag and Drop
  if (dropZone && fileInput) {
    ["dragenter", "dragover"].forEach(evt => {
      dropZone.addEventListener(evt, e => {
        e.preventDefault();
        dropZone.classList.add("drag-over");
      });
    });

    ["dragleave", "drop"].forEach(evt => {
      dropZone.addEventListener(evt, () => dropZone.classList.remove("drag-over"));
    });

    dropZone.addEventListener("drop", e => {
      e.preventDefault();
      const f = e.dataTransfer.files[0];
      if (f) handleFile(f);
    });

    dropZone.addEventListener("click", () => fileInput.click());
    fileInput.addEventListener("change", () => {
      if (fileInput.files[0]) handleFile(fileInput.files[0]);
    });
  }

  if (clearFileBtn) {
    clearFileBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      clearFile();
    });
  }

  function handleFile(file) {
    const allowedExt = ["pdf", "docx", "txt", "md"];
    const ext = file.name.split(".").pop().toLowerCase();
    if (!allowedExt.includes(ext)) {
      toast(`Unsupported file type: .${ext}. Use PDF, DOCX, TXT, or MD.`, "error");
      return;
    }

    selectedFile = file;
    if (fileName) fileName.textContent = file.name;
    if (fileSize) fileSize.textContent = formatBytes(file.size);

    const titleInput = document.getElementById("projectTitle");
    if (titleInput && !titleInput.value) {
      titleInput.value = file.name.replace(/\.[^.]+$/, "").replace(/[_-]/g, " ")
        .replace(/\b\w/g, c => c.toUpperCase());
    }

    if (dropZone) dropZone.style.display = "none";
    if (uploadForm) uploadForm.style.display = "flex";
  }

  function clearFile() {
    selectedFile = null;
    if (fileInput) fileInput.value = "";
    const titleInput = document.getElementById("projectTitle");
    if (titleInput) titleInput.value = "";
    if (dropZone) dropZone.style.display = "block";
    if (uploadForm) uploadForm.style.display = "none";
    if (processingStatus) processingStatus.style.display = "none";
  }

  // Mode toggles
  if (textModeBtn && voiceModeBtn) {
    textModeBtn.addEventListener("click", () => {
      voiceMode = false;
      textModeBtn.classList.add("active");
      voiceModeBtn.classList.remove("active");
    });
    voiceModeBtn.addEventListener("click", () => {
      voiceMode = true;
      voiceModeBtn.classList.add("active");
      textModeBtn.classList.remove("active");
    });
  }

  // Upload simulation & start
  if (uploadBtn) {
    uploadBtn.addEventListener("click", () => {
      const titleInput = document.getElementById("projectTitle");
      const title = (titleInput && titleInput.value.trim()) || (selectedFile ? selectedFile.name : "My Project");
      const difficulty = document.getElementById("difficultySelect")?.value || "medium";
      const questionCount = parseInt(document.getElementById("questionCount")?.value || "10");

      if (uploadForm) uploadForm.style.display = "none";
      if (processingStatus) processingStatus.style.display = "flex";

      let progress = 15;
      statusIcon.textContent = "⚙️";
      statusTitle.textContent = "Processing Document…";
      statusMsg.textContent = "Reading document structure & tokenizing chunks…";
      progressFill.style.width = "15%";

      const detectedTech = ["Architecture", "Algorithms", "Database", "Security", "APIs", "System Testing"];

      setTimeout(() => {
        progress = 45;
        statusMsg.textContent = "Embedding semantic chunks using vector transformer…";
        progressFill.style.width = "45%";
      }, 700);

      setTimeout(() => {
        progress = 75;
        statusMsg.textContent = "Constructing FAISS index and generating viva questions…";
        progressFill.style.width = "75%";
        renderTechTags(detectedTech);
      }, 1400);

      setTimeout(() => {
        progress = 100;
        statusIcon.textContent = "✅";
        statusTitle.textContent = "Ready!";
        statusMsg.textContent = "Indexed successfully. Launching your examination…";
        progressFill.style.width = "100%";

        const newProject = {
          id: "proj_" + Date.now(),
          title: title,
          file_type: selectedFile ? selectedFile.name.split(".").pop().toUpperCase() : "PDF",
          file_size_bytes: selectedFile ? selectedFile.size : 2048000,
          processing_status: "ready",
          chunk_count: Math.floor(Math.random() * 40 + 20),
          created_at: new Date().toISOString(),
          technologies: detectedTech,
        };

        projects.unshift(newProject);
        saveProjects();

        // Save session config
        localStorage.setItem("viva_active_session", JSON.stringify({
          project: newProject,
          difficulty: difficulty,
          questionCount: questionCount,
          voiceMode: voiceMode,
          startedAt: new Date().toISOString(),
        }));

        setTimeout(() => {
          window.location.href = "viva.html";
        }, 1000);
      }, 2100);
    });
  }

  function renderTechTags(techs) {
    if (!techTags) return;
    techTags.innerHTML = "";
    techs.forEach(t => {
      const tag = document.createElement("span");
      tag.className = "tech-tag";
      tag.textContent = t;
      techTags.appendChild(tag);
    });
  }

  function renderProjects() {
    if (!projectsGrid) return;
    if (!projects.length) {
      projectsGrid.innerHTML = '<div class="empty-state">No projects yet. Upload one above to get started.</div>';
      return;
    }
    projectsGrid.innerHTML = "";
    projects.forEach(p => {
      const card = document.createElement("div");
      card.className = "project-card";
      card.innerHTML = `
        <div class="project-card-header">
          <div class="project-card-title">${escapeHtml(p.title)}</div>
          <span class="project-card-type">${escapeHtml(p.file_type || "PDF")}</span>
        </div>
        <div class="project-card-status">
          <span class="status-dot ready"></span>
          <span>${p.chunk_count || 32} chunks indexed</span>
        </div>
        <div class="project-card-meta">${formatBytes(p.file_size_bytes)} · ${formatDate(p.created_at)}</div>
        <div class="project-card-actions">
          <button class="btn btn-primary" onclick="launchProjectViva('${p.id}')">Start Viva</button>
          <button class="btn btn-ghost" onclick="deleteProject('${p.id}')">🗑 Delete</button>
        </div>`;
      projectsGrid.appendChild(card);
    });
  }

  window.launchProjectViva = function(id) {
    const proj = projects.find(p => p.id === id) || projects[0];
    const difficulty = document.getElementById("difficultySelect")?.value || "medium";
    const questionCount = parseInt(document.getElementById("questionCount")?.value || "10");

    localStorage.setItem("viva_active_session", JSON.stringify({
      project: proj,
      difficulty: difficulty,
      questionCount: questionCount,
      voiceMode: voiceMode,
      startedAt: new Date().toISOString(),
    }));

    window.location.href = "viva.html";
  };

  window.deleteProject = function(id) {
    if (!confirm("Remove this project from your list?")) return;
    projects = projects.filter(p => p.id !== id);
    saveProjects();
    renderProjects();
    toast("Project removed.", "info");
  };
});
