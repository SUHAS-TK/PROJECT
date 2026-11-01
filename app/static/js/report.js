/* ═══════════════════════════════════════════════════════════════════════════
   report.js – Performance Report Page Logic
   ═══════════════════════════════════════════════════════════════════════════ */
"use strict";

const SESSION_ID = window.SESSION_ID;
let currentReportData = null;
let isRecordingEmail = false;
let emailMediaRecorder = null;
let emailAudioChunks = [];

function toast(msg, type = "info", duration = 4500) {
  const icons = { success: "✅", error: "❌", info: "ℹ️", warn: "⚠️" };
  const container = document.getElementById("toastContainer");
  if (!container) return;
  const el = document.createElement("div");
  el.className = `fui-toast ${type}`;
  el.style.cssText = "display:flex;align-items:center;gap:0.6rem;padding:0.75rem 1.25rem;background:rgba(10,16,32,0.95);border:1px solid rgba(0,245,255,0.25);border-radius:10px;color:#f1f5f9;font-size:0.85rem;box-shadow:0 8px 30px rgba(0,0,0,0.5);margin-bottom:0.5rem;animation:fadeIn 0.3s ease;";
  el.innerHTML = `<span style="font-size:1.1rem;">${icons[type] || "ℹ️"}</span><span>${msg}</span>`;
  container.appendChild(el);
  setTimeout(() => el.remove(), duration);
}

function escapeHtml(str) {
  return String(str || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function gradeFromScore(score) {
  if (score >= 90) return "A+";
  if (score >= 80) return "A";
  if (score >= 70) return "B";
  if (score >= 60) return "C";
  if (score >= 50) return "D";
  return "F";
}

function makeList(container, items, emptyMsg) {
  if (!container) return;
  if (!items || !items.length) {
    container.innerHTML = `<li style="color:var(--text-muted,#64748b);font-size:0.875rem;">${emptyMsg}</li>`;
    return;
  }
  container.innerHTML = items.map(i => `<li style="margin-bottom:0.4rem;line-height:1.6;">${escapeHtml(i)}</li>`).join("");
}

// ── Animate Score Ring ────────────────────────────────────────────────────────
function animateRing(score) {
  if (window.animateHeroRing) {
    window.animateHeroRing(score);
    return;
  }
  const ring = document.getElementById("heroScoreRing");
  if (!ring) return;
  const circumference = 408;
  const offset = circumference - (Math.max(0, Math.min(100, score)) / 100) * circumference;
  setTimeout(() => { ring.style.strokeDashoffset = offset; }, 150);
}

// ── Render Topic Performance & Radar Chart ────────────────────────────────────
function renderTopicsAndChart(report, questions) {
  let topics = report.topic_performance || [];

  // If backend didn't return structured topics, build dynamically from questions
  if (!topics.length && questions.length) {
    const topicMap = {};
    questions.forEach(q => {
      const top = q.topic || "Project Architecture";
      if (!topicMap[top]) topicMap[top] = [];
      topicMap[top].push(q.score || 0);
    });
    topics = Object.entries(topicMap).map(([top, scores]) => {
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      return {
        topic: top,
        score: Math.round(avg),
        assessment: avg >= 75 ? "strong" : avg >= 50 ? "adequate" : "weak"
      };
    });
  }

  // Render Topic Progress Bars
  if (window.renderTopicBars && topics.length) {
    window.renderTopicBars(topics);
  } else {
    const topicContainer = document.getElementById("topicPerformance");
    if (topicContainer) {
      if (topics.length) {
        topicContainer.innerHTML = topics.map(t => {
          const sc = Math.round(t.score || 0);
          const assessment = t.assessment || (sc >= 75 ? "strong" : sc >= 50 ? "adequate" : "weak");
          const barColor = assessment === "strong" ? "linear-gradient(90deg,#10b981,#34d399)" : assessment === "adequate" ? "linear-gradient(90deg,#f59e0b,#fbbf24)" : "linear-gradient(90deg,#ef4444,#f87171)";
          return `<div class="fui-topic-bar topic-${assessment}">
            <div class="fui-topic-bar-header">
              <span class="fui-topic-name">${escapeHtml(t.topic)}</span>
              <span class="fui-topic-score">${sc}/100</span>
            </div>
            <div class="fui-topic-bar-track">
              <div class="fui-topic-bar-fill" style="width:${sc}%;background:${barColor};"></div>
            </div>
          </div>`;
        }).join("");
      } else {
        topicContainer.innerHTML = "<p style='color:var(--text-muted,#64748b);font-size:0.875rem;'>No topic breakdown recorded for this session.</p>";
      }
    }
  }

  // Render Radar Chart
  if (topics.length) {
    if (window.initRadarChart) {
      window.initRadarChart(topics.map(t => t.topic), topics.map(t => t.score || 0));
    } else {
      const canvas = document.getElementById("radarChart");
      if (canvas && typeof Chart !== "undefined") {
        const ctx = canvas.getContext("2d");
        new Chart(ctx, {
          type: "radar",
          data: {
            labels: topics.map(t => t.topic),
            datasets: [{
              label: "Topic Mastery",
              data: topics.map(t => t.score || 0),
              backgroundColor: "rgba(0, 245, 255, 0.15)",
              borderColor: "rgba(0, 245, 255, 0.75)",
              pointBackgroundColor: "rgba(0, 245, 255, 1)",
              pointBorderColor: "#ffffff",
              pointRadius: 4,
              borderWidth: 2,
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              r: {
                min: 0,
                max: 100,
                ticks: { stepSize: 25, color: "#64748b", backdropColor: "transparent", font: { size: 9 } },
                grid: { color: "rgba(255,255,255,0.06)" },
                pointLabels: { color: "#94a3b8", font: { size: 11, family: "Inter" } },
                angleLines: { color: "rgba(255,255,255,0.06)" }
              }
            }
          }
        });
      }
    }
  }
}

// ── Main Report Loader & Renderer ─────────────────────────────────────────────
async function loadReport() {
  try {
    const res = await fetch(`/api/sessions/${SESSION_ID}/report`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to load report data.");

    currentReportData = data;
    if (data.session && data.session.project_id) {
      window.CURRENT_PROJECT_ID = data.session.project_id;
    }
    renderReport(data);
  } catch (err) {
    toast(err.message, "error");
    const scoreEl = document.getElementById("bigScore");
    if (scoreEl) scoreEl.textContent = "!";
    const sumEl = document.getElementById("execSummary");
    if (sumEl) sumEl.textContent = "Error loading report: " + err.message;
  }
}

function renderReport(data) {
  const report = data.report || {};
  const session = data.session || {};
  const questions = data.questions || [];

  // Hero Score & Grade
  const rawScore = (typeof report.overall_score === "number") ? report.overall_score : (session.overall_score || 0);
  const score = Math.round(rawScore);
  const grade = report.grade || gradeFromScore(score);

  const bigScore = document.getElementById("bigScore");
  if (bigScore) bigScore.textContent = score;

  const gradeBadge = document.getElementById("gradeBadge");
  if (gradeBadge) gradeBadge.textContent = grade;

  const reportTitle = document.getElementById("reportTitle");
  if (reportTitle) reportTitle.textContent = "Performance Report";

  const execSummary = document.getElementById("execSummary");
  if (execSummary) execSummary.textContent = report.executive_summary || "Viva examination evaluated successfully.";

  // Animate hero score ring
  animateRing(score);

  // Statistics counters
  const correct = questions.filter(q => q.correctness === "correct").length;
  const partial = questions.filter(q => q.correctness === "partial").length;
  const incorrect = questions.filter(q => q.correctness === "incorrect").length;

  const qCountEl = document.getElementById("reportQuestions");
  if (qCountEl) qCountEl.textContent = questions.length;
  const corEl = document.getElementById("reportCorrect");
  if (corEl) corEl.textContent = correct;
  const parEl = document.getElementById("reportPartial");
  if (parEl) parEl.textContent = partial;
  const incEl = document.getElementById("reportIncorrect");
  if (incEl) incEl.textContent = incorrect;

  // Topics & Radar Chart
  renderTopicsAndChart(report, questions);

  // Diagnostic Lists
  makeList(document.getElementById("strongAreas"), report.strong_areas, "No specific strengths identified for this session.");
  makeList(document.getElementById("weakAreas"), report.weak_areas, "No major conceptual gaps identified.");
  makeList(document.getElementById("misconceptions"), report.repeated_misconceptions, "No recurring misconceptions detected.");
  makeList(document.getElementById("revisionTopics"), report.revision_topics, "Review core architecture and implementation trade-offs.");

  // Pre-fill Mail App link
  const mailtoBtn = document.getElementById("mailtoBtn");
  if (mailtoBtn) {
    const subject = encodeURIComponent(`Viva Voce Report: ${score}/100 [Grade ${grade}]`);
    const body = encodeURIComponent(`AI Viva Voce Performance Report\nOverall Score: ${score}/100 (${grade})\n\nExecutive Summary:\n${report.executive_summary || ""}\n\nExaminer Comments:\n${report.examiner_comments || "Satisfactory progress."}`);
    mailtoBtn.href = `mailto:?subject=${subject}&body=${body}`;
  }

  // Practice Questions
  const practiceQs = report.practice_questions || [];
  if (window.renderPracticeQuestions && practiceQs.length) {
    window.renderPracticeQuestions(practiceQs);
  } else {
    const pq = document.getElementById("practiceQuestions");
    if (pq) {
      if (practiceQs.length) {
        pq.innerHTML = practiceQs.map(q => {
          const text = typeof q === "string" ? q : (q.question || "");
          const diff = typeof q === "object" ? (q.difficulty || "medium") : "medium";
          const diffColor = diff === "hard" ? "#f87171" : diff === "easy" ? "#10b981" : "#f59e0b";
          return `<div style="padding:0.75rem 1rem;background:rgba(0,0,0,0.25);border-left:3px solid ${diffColor};border-radius:0 8px 8px 0;margin-bottom:0.6rem;font-size:0.875rem;line-height:1.6;">
            <span style="font-size:0.65rem;font-weight:700;color:${diffColor};text-transform:uppercase;letter-spacing:0.08em;margin-right:0.5rem;">[${diff.toUpperCase()}]</span>
            <span style="color:#e2e8f0;">${escapeHtml(text)}</span>
          </div>`;
        }).join("");
      } else {
        pq.innerHTML = "<p style='color:var(--text-muted,#64748b);font-size:0.875rem;'>No practice questions generated.</p>";
      }
    }
  }

  // Examiner comments
  const exComm = document.getElementById("examinerComment");
  if (exComm) exComm.textContent = report.examiner_comments || "Keep expanding your implementation and system design depth.";

  // Question-by-Question Detailed Review
  const reviewContainer = document.getElementById("questionReview");
  if (reviewContainer) {
    if (questions.length) {
      reviewContainer.innerHTML = questions.map((q, i) => {
        const sc = q.score || 0;
        const scoreColor = sc >= 75 ? "#10b981" : sc >= 50 ? "#f59e0b" : "#ef4444";
        const fb = q.feedback || {};
        return `<div class="review-item" style="padding:1rem 1.25rem;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:12px;margin-bottom:0.75rem;">
          <div class="review-item-header" style="display:flex;align-items:center;gap:0.75rem;margin-bottom:0.5rem;flex-wrap:wrap;">
            <span class="review-q-num" style="font-family:var(--font-mono);font-weight:700;color:var(--neon-cyan,#00f5ff);font-size:0.85rem;">Q${i + 1}</span>
            <span class="review-q-topic" style="font-size:0.8rem;color:#94a3b8;">${escapeHtml(q.topic || "")}</span>
            <span class="badge badge-${q.difficulty || 'medium'}" style="font-size:0.7rem;padding:0.2rem 0.5rem;border-radius:4px;text-transform:uppercase;">${q.difficulty || 'medium'}</span>
            <span class="review-q-score" style="margin-left:auto;font-weight:700;color:${scoreColor};font-size:0.9rem;">${sc}/100</span>
          </div>
          <div class="review-q-text" style="font-size:0.9rem;color:#f1f5f9;margin-bottom:0.5rem;line-height:1.6;">${escapeHtml(q.question_text)}</div>
          ${q.student_answer ? `<div class="review-a-text" style="padding:0.6rem 0.85rem;background:rgba(0,0,0,0.3);border-radius:8px;font-size:0.85rem;color:#cbd5e1;margin-bottom:0.4rem;line-height:1.5;"><strong style="color:var(--neon-cyan,#00f5ff);">Your answer:</strong> ${escapeHtml(q.student_answer.slice(0, 350))}${q.student_answer.length > 350 ? "…" : ""}</div>` : ""}
          ${fb.correct_reasoning ? `<div class="review-a-text" style="padding:0.6rem 0.85rem;background:rgba(168,85,247,0.06);border-left:3px solid #a855f7;border-radius:0 8px 8px 0;font-size:0.85rem;color:#e2e8f0;line-height:1.5;"><strong style="color:#d8b4fe;">Examiner reasoning:</strong> ${escapeHtml(fb.correct_reasoning.slice(0, 300))}…</div>` : ""}
        </div>`;
      }).join("");
    } else {
      reviewContainer.innerHTML = "<p style='color:var(--text-muted,#64748b);font-size:0.875rem;'>No questions to review in this session.</p>";
    }
  }
}

// ── Save Options: Print / PDF, Download HTML, Copy Summary ───────────────────
const printBtn = document.getElementById("printReportBtn");
if (printBtn) {
  printBtn.addEventListener("click", () => {
    window.print();
  });
}

const downloadHtmlBtn = document.getElementById("downloadHtmlBtn");
if (downloadHtmlBtn) {
  downloadHtmlBtn.addEventListener("click", () => {
    if (!currentReportData) {
      toast("Report data not loaded yet.", "warn");
      return;
    }
    const report = currentReportData.report || {};
    const score = report.overall_score || 0;
    const grade = report.grade || gradeFromScore(score);

    const standaloneHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Viva Voce Performance Report - ${score}/100</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0a0d14; color: #e2e8f0; padding: 2rem; max-width: 840px; margin: 0 auto; line-height: 1.6; }
    .card { background: #111622; border: 1px solid rgba(0,245,255,0.2); border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem; }
    .score-badge { font-size: 3rem; font-weight: 800; color: #00f5ff; }
    .grade { display: inline-block; padding: 4px 14px; border-radius: 20px; background: rgba(0,245,255,0.15); color: #00f5ff; font-weight: 700; margin-left: 1rem; }
    h2, h3 { color: #f1f5f9; }
    ul { padding-left: 1.5rem; }
  </style>
</head>
<body>
  <div class="card">
    <h2>🎓 Viva Voce Official Performance Report</h2>
    <div style="display:flex;align-items:center;margin:1rem 0;">
      <div class="score-badge">${score}/100</div>
      <div class="grade">Grade: ${grade}</div>
    </div>
    <p><strong>Summary:</strong> ${escapeHtml(report.executive_summary || "")}</p>
    <p><strong>Examiner Comments:</strong> ${escapeHtml(report.examiner_comments || "")}</p>
  </div>
</body>
</html>`;

    const blob = new Blob([standaloneHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Viva_Report_Session_${SESSION_ID}.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast("HTML Report downloaded successfully!", "success");
  });
}

const copySummaryBtn = document.getElementById("copySummaryBtn");
if (copySummaryBtn) {
  copySummaryBtn.addEventListener("click", () => {
    if (!currentReportData) {
      toast("Report data not loaded yet.", "warn");
      return;
    }
    const report = currentReportData.report || {};
    const score = report.overall_score || 0;
    const grade = report.grade || gradeFromScore(score);

    const textSummary = `🎓 VIVA VOCE PERFORMANCE REPORT
Overall Score: ${score}/100 (Grade: ${grade})

Executive Summary:
${report.executive_summary || "Completed"}

Strengths:
${(report.strong_areas || []).map(s => "• " + s).join("\n") || "• None noted"}

Improvement Areas:
${(report.weak_areas || []).map(w => "• " + w).join("\n") || "• None noted"}

Examiner Comments:
${report.examiner_comments || "Good effort."}
`;

    navigator.clipboard.writeText(textSummary).then(() => {
      toast("Performance summary copied to clipboard!", "success");
    }).catch(() => {
      toast("Could not access clipboard.", "error");
    });
  });
}

// ── Voice Dictation for Email ────────────────────────────────────────────────
const speakEmailBtn = document.getElementById("speakEmailBtn");
const reportEmailInput = document.getElementById("reportEmailInput");
const mailtoBtn = document.getElementById("mailtoBtn");

if (reportEmailInput && mailtoBtn) {
  reportEmailInput.addEventListener("input", () => {
    const email = reportEmailInput.value.trim();
    const currentHref = mailtoBtn.getAttribute("href") || "mailto:";
    const urlParts = currentHref.split("?");
    const query = urlParts[1] ? `?${urlParts[1]}` : "";
    mailtoBtn.href = `mailto:${encodeURIComponent(email)}${query}`;
  });
}

if (speakEmailBtn) {
  speakEmailBtn.addEventListener("click", toggleEmailVoiceRecording);
}

async function toggleEmailVoiceRecording() {
  if (isRecordingEmail) {
    if (emailMediaRecorder && emailMediaRecorder.state !== "inactive") {
      emailMediaRecorder.stop();
    }
    isRecordingEmail = false;
    speakEmailBtn.classList.remove("listening");
    speakEmailBtn.innerHTML = "<span>⏳ Transcribing…</span>";
    return;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    emailAudioChunks = [];
    emailMediaRecorder = new MediaRecorder(stream);

    emailMediaRecorder.ondataavailable = e => {
      if (e.data.size > 0) emailAudioChunks.push(e.data);
    };

    emailMediaRecorder.onstop = () => {
      stream.getTracks().forEach(t => t.stop());
      transcribeEmailAudio();
    };

    emailMediaRecorder.start(250);
    isRecordingEmail = true;
    speakEmailBtn.classList.add("listening");
    speakEmailBtn.innerHTML = "<span>🔴 Say email…</span>";
    toast("Speak your email aloud (e.g. 'alex at example dot com')", "info", 5000);
  } catch (err) {
    toast("Microphone access denied: " + err.message, "error");
  }
}

async function transcribeEmailAudio() {
  if (!emailAudioChunks.length) {
    if (speakEmailBtn) speakEmailBtn.innerHTML = "<span>🎙️ Speak</span>";
    return;
  }

  const blob = new Blob(emailAudioChunks, { type: "audio/webm" });
  const formData = new FormData();
  formData.append("audio", blob, "email_dictation.webm");

  try {
    const res = await fetch("/api/speech/transcribe", { method: "POST", body: formData });
    const data = await res.json();
    if (speakEmailBtn) speakEmailBtn.innerHTML = "<span>🎙️ Speak</span>";

    if (data.transcript && data.transcript.trim()) {
      let raw = data.transcript.toLowerCase();
      raw = raw.replace(/\s+at\s+the\s+rate\s+/g, "@")
               .replace(/\s+at\s+/g, "@")
               .replace(/\s+dot\s+/g, ".")
               .replace(/\s+underscore\s+/g, "_")
               .replace(/\s+/g, "");

      if (reportEmailInput) {
        reportEmailInput.value = raw;
        reportEmailInput.dispatchEvent(new Event("input"));
        reportEmailInput.focus();
      }
      toast(`Transcribed: ${raw}`, "success");
    } else {
      toast("No audible speech detected. Please type manually.", "warn");
    }
  } catch (err) {
    if (speakEmailBtn) speakEmailBtn.innerHTML = "<span>🎙️ Speak</span>";
    toast("Transcription failed: " + err.message, "error");
  }
}

// ── Email Report Dispatch ─────────────────────────────────────────────────────
const sendEmailBtn = document.getElementById("sendEmailBtn");
const emailStatusBanner = document.getElementById("emailStatusBanner");
const emailActionsPreview = document.getElementById("emailActionsPreview");
const emailHelperBox = document.getElementById("emailHelperBox");
const viewEmailPreviewBtn = document.getElementById("viewEmailPreviewBtn");
const downloadEmailFileBtn = document.getElementById("downloadEmailFileBtn");
const emailPreviewModal = document.getElementById("emailPreviewModal");
const emailPreviewIframe = document.getElementById("emailPreviewIframe");
const closeEmailPreviewBtn = document.getElementById("closeEmailPreviewBtn");

if (sendEmailBtn) {
  sendEmailBtn.addEventListener("click", async () => {
    const rawEmailInput = (reportEmailInput ? reportEmailInput.value : "").trim().toLowerCase();
    if (!rawEmailInput) {
      toast("Please enter an email address first.", "warn");
      if (reportEmailInput) reportEmailInput.focus();
      return;
    }

    const emailList = rawEmailInput.split(/[,;]+/).map(e => e.trim()).filter(Boolean);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = emailList.filter(e => !emailRegex.test(e));

    if (!emailList.length || invalidEmails.length > 0) {
      toast("Please check your email address format.", "error");
      if (reportEmailInput) reportEmailInput.focus();
      return;
    }

    const email = emailList.join(", ");
    const sendBtnText = document.getElementById("sendEmailBtnText");
    const sendSpinner = document.getElementById("sendEmailSpinner");
    if (sendBtnText) sendBtnText.style.display = "none";
    if (sendSpinner) sendSpinner.style.display = "inline";
    sendEmailBtn.disabled = true;

    if (emailStatusBanner) emailStatusBanner.style.display = "none";

    try {
      const res = await fetch(`/api/sessions/${SESSION_ID}/email-report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Email delivery failed.");

      if (emailStatusBanner) {
        emailStatusBanner.className = "email-status-banner success";
        emailStatusBanner.textContent = `✅ ${data.message}`;
        emailStatusBanner.style.display = "block";
      }

      if (emailActionsPreview) {
        emailActionsPreview.style.display = "flex";
        if (downloadEmailFileBtn) {
          downloadEmailFileBtn.href = data.download_url || `/api/sessions/${SESSION_ID}/email-download`;
        }
      }

      if (data.preview_mode && emailHelperBox) {
        emailHelperBox.style.display = "block";
        emailHelperBox.innerHTML = `<strong>Note:</strong> Report prepared in Preview Mode. You can click <em>Preview Email</em> to inspect the formatted message or <em>Download</em> to save it.`;
      }

      toast(`Report prepared for ${email}!`, "success");
    } catch (err) {
      if (emailStatusBanner) {
        emailStatusBanner.className = "email-status-banner error";
        emailStatusBanner.textContent = `❌ ${err.message}`;
        emailStatusBanner.style.display = "block";
      }
      toast(err.message, "error");
    } finally {
      if (sendBtnText) sendBtnText.style.display = "inline";
      if (sendSpinner) sendSpinner.style.display = "none";
      sendEmailBtn.disabled = false;
    }
  });
}

// ── Email Preview Modal Controls ─────────────────────────────────────────────
if (viewEmailPreviewBtn) {
  viewEmailPreviewBtn.addEventListener("click", () => {
    if (emailPreviewIframe) {
      emailPreviewIframe.src = `/api/sessions/${SESSION_ID}/email-preview`;
    }
    if (emailPreviewModal) {
      emailPreviewModal.classList.add("open");
    }
  });
}

if (closeEmailPreviewBtn) {
  closeEmailPreviewBtn.addEventListener("click", () => {
    if (emailPreviewModal) {
      emailPreviewModal.classList.remove("open");
    }
  });
}

if (emailPreviewModal) {
  emailPreviewModal.addEventListener("click", (e) => {
    if (e.target === emailPreviewModal) {
      emailPreviewModal.classList.remove("open");
    }
  });
}

// ── Auto-start loading report on page ready ──────────────────────────────────
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", loadReport);
} else {
  loadReport();
}
