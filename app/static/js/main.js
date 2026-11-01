/* ═══════════════════════════════════════════════════════
   main.js – Futuristic Dashboard & Upload Logic
   ═══════════════════════════════════════════════════════ */
"use strict";

// ── State ──────────────────────────────────────────────────
let selectedFile = null;
let currentProjectId = null;
let voiceMode = false;
let pollingTimer = null;

// ── Utilities ──────────────────────────────────────────────
function toast(msg, type = "info", duration = 4000) {
  const icons = { success: "✅", error: "❌", info: "ℹ️", warn: "⚠️" };
  const container = document.getElementById("toastContainer");
  if (!container) return;
  const el = document.createElement("div");
  el.className = `fui-toast ${type} show`;
  el.innerHTML = `<span class="toast-icon">${icons[type] || "ℹ️"}</span>
                  <span class="toast-msg">${msg}</span>`;
  container.appendChild(el);
  setTimeout(() => {
    el.classList.remove("show");
    setTimeout(() => el.remove(), 400);
  }, duration);
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function setProcessingStatus(status, msg, progress) {
  const icons = { processing: "⚡", ready: "✅", failed: "❌" };
  const statusIcon = document.getElementById("statusIcon");
  const statusTitle = document.getElementById("statusTitle");
  const statusMsg = document.getElementById("statusMsg");
  const progressFill = document.getElementById("progressFill");

  if (statusIcon) statusIcon.textContent = icons[status] || "⚙️";
  if (statusTitle) statusTitle.textContent = { processing: "Analyzing Project…", ready: "Analysis Ready!", failed: "Analysis Failed" }[status] || status;
  if (statusMsg) statusMsg.textContent = msg;
  if (progressFill) progressFill.style.width = `${progress}%`;
}

function renderTechTags(techs) {
  const techTags = document.getElementById("techTags");
  if (!techTags) return;
  techTags.innerHTML = "";
  (techs || []).slice(0, 14).forEach(t => {
    const tag = document.createElement("span");
    tag.className = "fui-tech-tag";
    tag.textContent = t;
    techTags.appendChild(tag);
  });
}

// ── File Drop & Selection ──────────────────────────────────
const dropZone = document.getElementById("dropZone");
const fileInput = document.getElementById("fileInput");
const clearFileBtn = document.getElementById("clearFileBtn");
const uploadBtn = document.getElementById("uploadBtn");
const uploadForm = document.getElementById("uploadForm");
const textModeBtn = document.getElementById("textModeBtn");
const voiceModeBtn = document.getElementById("voiceModeBtn");
const processingStatus = document.getElementById("processingStatus");
const projectsGrid = document.getElementById("projectsGrid");
const quickProjectSelect = document.getElementById("quickProjectSelect");
const quickLaunchBtn = document.getElementById("quickLaunchBtn");

if (dropZone) {
  ["dragenter", "dragover"].forEach(evt => {
    dropZone.addEventListener(evt, e => {
      e.preventDefault();
      dropZone.classList.add("drag-over");
      dropZone.classList.add("fui-drag-over");
    });
  });

  ["dragleave", "drop"].forEach(evt => {
    dropZone.addEventListener(evt, () => {
      dropZone.classList.remove("drag-over");
      dropZone.classList.remove("fui-drag-over");
    });
  });

  dropZone.addEventListener("drop", e => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  });

  dropZone.addEventListener("click", () => fileInput && fileInput.click());
}

if (fileInput) {
  fileInput.addEventListener("change", () => {
    if (fileInput.files[0]) handleFile(fileInput.files[0]);
  });
}

if (clearFileBtn) {
  clearFileBtn.addEventListener("click", e => {
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
  const maxBytes = 50 * 1024 * 1024;
  if (file.size > maxBytes) {
    toast("File too large. Maximum size is 50MB.", "error");
    return;
  }
  selectedFile = file;

  const fileNameEl = document.getElementById("fileName");
  const fileSizeEl = document.getElementById("fileSize");
  if (fileNameEl) fileNameEl.textContent = file.name;
  if (fileSizeEl) fileSizeEl.textContent = formatBytes(file.size);

  const titleInput = document.getElementById("projectTitle");
  if (titleInput && !titleInput.value) {
    titleInput.value = file.name
      .replace(/\.[^.]+$/, "")
      .replace(/[_-]/g, " ")
      .replace(/\b\w/g, c => c.toUpperCase());
  }

  const fileInfo = document.getElementById("filePreview");
  if (fileInfo) fileInfo.style.display = "flex";
  if (uploadForm) uploadForm.style.display = "block";
  if (uploadBtn) uploadBtn.disabled = false;
}

function clearFile() {
  selectedFile = null;
  if (fileInput) fileInput.value = "";
  const fileInfo = document.getElementById("filePreview");
  if (fileInfo) fileInfo.style.display = "none";
  if (uploadForm) uploadForm.style.display = "none";
  if (uploadBtn) uploadBtn.disabled = true;
  if (processingStatus) processingStatus.style.display = "none";
  clearInterval(pollingTimer);
}

// ── Mode Toggle ────────────────────────────────────────────
function setMode(voice) {
  voiceMode = voice;
  if (voiceModeBtn) voiceModeBtn.classList.toggle("active", voice);
  if (textModeBtn) textModeBtn.classList.toggle("active", !voice);
}

if (textModeBtn) textModeBtn.addEventListener("click", () => setMode(false));
if (voiceModeBtn) voiceModeBtn.addEventListener("click", () => setMode(true));

// ── Upload Project ─────────────────────────────────────────
if (uploadBtn) {
  uploadBtn.addEventListener("click", async () => {
    if (!selectedFile) {
      toast("Please select a project document first.", "warn");
      return;
    }

    const titleInput = document.getElementById("projectTitle");
    const title = titleInput ? titleInput.value.trim() : "";
    if (!title) {
      toast("Please enter a project title.", "warn");
      if (titleInput) titleInput.focus();
      return;
    }

    const difficulty = document.getElementById("difficultySelect")?.value || "medium";
    const totalQ = document.getElementById("questionCount")?.value || "10";

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("title", title);
    formData.append("difficulty", difficulty);
    formData.append("total_questions", totalQ);
    formData.append("voice_mode", voiceMode ? "true" : "false");

    uploadBtn.disabled = true;
    const btnText = uploadBtn.querySelector(".btn-text");
    const btnSpinner = uploadBtn.querySelector(".btn-spinner");
    if (btnText) btnText.style.display = "none";
    if (btnSpinner) btnSpinner.style.display = "inline";

    if (processingStatus) processingStatus.style.display = "block";
    setProcessingStatus("processing", "Uploading document and initializing RAG pipeline…", 15);

    try {
      const res = await fetch("/api/projects/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed.");

      currentProjectId = data.project_id || data.project?.id;
      setProcessingStatus("processing", "Extracting concepts, building vector index & knowledge profile…", 40);
      pollStatus(currentProjectId, difficulty, totalQ);
    } catch (err) {
      setProcessingStatus("failed", err.message, 0);
      toast(err.message, "error");
      uploadBtn.disabled = false;
      if (btnText) btnText.style.display = "inline";
      if (btnSpinner) btnSpinner.style.display = "none";
    }
  });
}

function pollStatus(projectId, difficulty, totalQ) {
  let attempts = 0;
  clearInterval(pollingTimer);
  pollingTimer = setInterval(async () => {
    attempts++;
    try {
      const res = await fetch(`/api/projects/${projectId}/status`);
      const data = await res.json();

      if (data.status === "ready") {
        clearInterval(pollingTimer);
        setProcessingStatus("ready", `Analyzed ${data.knowledge_summary?.key_concepts?.length || 0} key concepts & tech stack ready!`, 100);
        renderTechTags(data.technologies || data.knowledge_summary?.technologies || []);

        const launchBtn = document.getElementById("launchVivaBtn");
        if (launchBtn) {
          launchBtn.style.display = "inline-flex";
          launchBtn.onclick = () => startSession(projectId, difficulty, totalQ);
        }
        toast("Project analyzed successfully! Launch your viva.", "success");
        loadProjects();
      } else if (data.status === "failed") {
        clearInterval(pollingTimer);
        setProcessingStatus("failed", data.error || "Analysis failed.", 0);
        toast("Analysis failed: " + (data.error || "Unknown error"), "error");
        if (uploadBtn) {
          uploadBtn.disabled = false;
          const btnText = uploadBtn.querySelector(".btn-text");
          const btnSpinner = uploadBtn.querySelector(".btn-spinner");
          if (btnText) btnText.style.display = "inline";
          if (btnSpinner) btnSpinner.style.display = "none";
        }
      } else {
        const prog = Math.min(35 + attempts * 10, 90);
        setProcessingStatus("processing", "Synthesizing viva evaluation rubrics & embeddings…", prog);
      }
    } catch (err) {
      if (attempts > 30) {
        clearInterval(pollingTimer);
        setProcessingStatus("failed", "Processing timed out.", 0);
      }
    }
  }, 2000);
}

// ── Start Viva Session ─────────────────────────────────────
async function startSession(projectId, difficulty = "medium", totalQuestions = 10) {
  try {
    const res = await fetch("/api/sessions/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        project_id: projectId,
        difficulty,
        total_questions: parseInt(totalQuestions),
        voice_mode: voiceMode,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to start viva session.");
    const sessId = data.session_id || data.session?.id;
    if (!sessId) throw new Error("No session ID returned.");
    window.location.href = `/viva/${sessId}`;
  } catch (err) {
    toast(err.message, "error");
  }
}

// ── Load & Render Projects ─────────────────────────────────
async function loadProjects() {
  if (!projectsGrid) return;
  try {
    const res = await fetch("/api/projects");
    const data = await res.json();
    const projects = data.projects || [];

    // Update stats
    const statProjects = document.getElementById("statProjects");
    if (statProjects) statProjects.textContent = projects.length;

    try {
      const sRes = await fetch("/api/sessions/stats");
      if (sRes.ok) {
        const sData = await sRes.json();
        const statSess = document.getElementById("statSessions");
        if (statSess) statSess.textContent = sData.total_sessions || sData.completed_sessions || 0;
        const statAvg = document.getElementById("statAvgScore");
        if (statAvg) statAvg.textContent = sData.avg_score ? `${Math.round(sData.avg_score)}%` : "N/A";
      }
    } catch (_) {}

    renderProjects(projects);
    populateQuickLaunch(projects);
  } catch (err) {
    projectsGrid.innerHTML = `<div style="grid-column:1/-1;text-align:center;color:#ef4444;padding:2rem;">Failed to load projects: ${err.message}</div>`;
  }
}

function populateQuickLaunch(projects) {
  if (!quickProjectSelect) return;
  const readyProjects = projects.filter(p => p.status === "ready");
  quickProjectSelect.innerHTML = '<option value="">-- Choose Project --</option>' +
    readyProjects.map(p => `<option value="${p.id}">${p.title}</option>`).join("");
}

if (quickLaunchBtn && quickProjectSelect) {
  quickLaunchBtn.addEventListener("click", () => {
    const pId = quickProjectSelect.value;
    if (!pId) {
      toast("Please select a project first.", "warn");
      return;
    }
    const diff = document.getElementById("quickDifficulty")?.value || "medium";
    const qCount = document.getElementById("quickQuestions")?.value || "10";
    startSession(parseInt(pId), diff, qCount);
  });
}

function renderProjects(projects) {
  if (!projectsGrid) return;
  if (!projects.length) {
    projectsGrid.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;color:#64748b;padding:3rem 1rem;background:rgba(255,255,255,0.02);border:1px dashed rgba(255,255,255,0.08);border-radius:12px;">
        <div style="font-size:2rem;margin-bottom:0.5rem;">📂</div>
        <div style="font-weight:600;color:#94a3b8;">No projects uploaded yet</div>
        <div style="font-size:0.8rem;margin-top:0.25rem;">Upload your project document above to get started</div>
      </div>`;
    return;
  }

  projectsGrid.innerHTML = projects.map(p => {
    const isReady = p.status === "ready";
    const statusClass = isReady ? "status-ready" : p.status === "failed" ? "status-failed" : "status-processing";
    const statusText = isReady ? "● Ready" : p.status === "failed" ? "● Failed" : "● Processing";
    const techTags = (p.technologies || []).slice(0, 5)
      .map(t => `<span class="fui-tech-tag">${t}</span>`).join("");

    return `
      <div class="fui-project-card">
        <div class="fui-project-top">
          <div class="fui-project-icon">📄</div>
          <span class="fui-project-badge ${statusClass}">${statusText}</span>
        </div>
        <div class="fui-project-title">${p.title}</div>
        <div class="fui-project-meta">Created ${p.created_at ? new Date(p.created_at).toLocaleDateString() : ""}</div>
        ${techTags ? `<div class="fui-project-tags">${techTags}</div>` : ""}
        <div class="fui-project-actions">
          ${isReady ? `
            <button class="fui-btn-primary" style="flex:1;padding:0.45rem 0.8rem;font-size:0.8rem;" onclick="startSession(${p.id})">
              Start Viva
            </button>
          ` : ""}
          <button class="fui-btn-outline" style="padding:0.45rem 0.75rem;font-size:0.78rem;border-color:rgba(239,68,68,0.3);color:#f87171;" onclick="deleteProject(${p.id}, event)">
            Delete
          </button>
        </div>
      </div>`;
  }).join("");
}

window.startSession = startSession;

window.deleteProject = async function(projectId, e) {
  if (e) e.stopPropagation();
  if (!confirm("Are you sure you want to delete this project and its FAISS index?")) return;
  try {
    const res = await fetch(`/api/projects/${projectId}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Delete failed.");
    toast("Project deleted.", "success");
    loadProjects();
  } catch (err) {
    toast(err.message, "error");
  }
};

// ── Check API Status ───────────────────────────────────────
async function checkApiStatus() {
  const badge = document.getElementById("apiStatusBadge");
  if (!badge) return;
  try {
    const res = await fetch("/api/projects");
    if (res.ok) {
      badge.textContent = "API Online";
      badge.className = "fui-status-badge online";
    } else {
      badge.textContent = "API Degradation";
      badge.className = "fui-status-badge error";
    }
  } catch {
    badge.textContent = "API Offline";
    badge.className = "fui-status-badge error";
  }
}

// ── FAB Mentor Chat ────────────────────────────────────────
(function initFabMentor() {
  const fab = document.getElementById("mentorFab");
  const panel = document.getElementById("mentorPanel");
  const closeBtn = document.getElementById("mentorClose");
  const sendBtn = document.getElementById("mentorSendBtn");
  const input = document.getElementById("mentorInput");
  const messages = document.getElementById("mentorMessages");

  if (!fab || !panel) return;
  let chatHistory = [];

  function toggle() { panel.classList.toggle("open"); }
  fab.addEventListener("click", toggle);
  if (closeBtn) closeBtn.addEventListener("click", toggle);

  function addMsg(content, role) {
    const div = document.createElement("div");
    div.className = `mentor-msg ${role}`;
    const inner = document.createElement("div");
    inner.className = "msg-content";
    inner.innerHTML = content.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/\n/g, "<br>");
    div.appendChild(inner);
    if (messages) {
      messages.appendChild(div);
      messages.scrollTop = messages.scrollHeight;
    }
  }

  async function send() {
    if (!input) return;
    const msg = input.value.trim();
    if (!msg) return;
    input.value = "";
    addMsg(msg, "user");
    chatHistory.push({ role: "user", content: msg });

    try {
      const r = await fetch("/api/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, history: chatHistory.slice(-6) })
      });
      const data = await r.json();
      if (r.ok) {
        addMsg(data.response || "I'm here!", "bot");
        chatHistory.push({ role: "assistant", content: data.response });
      } else {
        addMsg("⚠️ AI busy.", "bot");
      }
    } catch {
      addMsg("💡 Upload your project to get AI-powered viva help!", "bot");
    }
  }

  if (sendBtn) sendBtn.addEventListener("click", send);
  if (input) input.addEventListener("keydown", e => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  });
})();

// ── Initialize ─────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  loadProjects();
  checkApiStatus();
});
