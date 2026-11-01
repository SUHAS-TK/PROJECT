/* ═══════════════════════════════════════════════════════
   report.js – Performance Report Logic
   Save (PDF, HTML, Copy), Share, and Email functionality
   ═══════════════════════════════════════════════════════ */
"use strict";

let currentReportData = null;

function escapeHtml(str) {
  return String(str || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

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

document.addEventListener("DOMContentLoaded", () => {
  // Load report from localStorage or fallback
  const raw = localStorage.getItem("viva_last_report");
  if (raw) {
    try {
      currentReportData = JSON.parse(raw);
    } catch (_) {}
  }

  if (currentReportData && currentReportData.report) {
    renderReport(currentReportData);
  } else {
    // Fallback default sample report data
    currentReportData = {
      session: {
        project_title: "AI Viva Examination Simulator",
        overall_score: 85,
        grade: "A",
        created_at: new Date().toISOString(),
      },
      report: {
        overall_score: 85,
        grade: "A",
        executive_summary: "Candidate demonstrated a commendable level of understanding across core project areas. System design responses were particularly impressive, showing genuine depth of thought. The RAG pipeline explanation showed real hands-on experience.",
      },
      questions: [
        {
          questionNumber: 1,
          topic: "System Design",
          difficulty: "medium",
          score: 92,
          correctness: "correct",
          questionText: "Explain the advantages of using a microservices architecture over a monolithic architecture for your project.",
          userAnswer: "Microservices allow independent deployment, scalability per service, and technology flexibility. Trade-offs include network latency and operational complexity.",
          modelAnswer: "Microservices decouple services for individual scaling and resilient deployments, communicating over REST/gRPC.",
        },
        {
          questionNumber: 2,
          topic: "RAG Pipeline",
          difficulty: "hard",
          score: 88,
          correctness: "correct",
          questionText: "How does your RAG pipeline retrieve and rank relevant document chunks for question generation?",
          userAnswer: "The system uses sentence-transformers to encode chunks into FAISS vectors. At query time, cosine similarity finds the top-k chunks.",
          modelAnswer: "Normalized inner-product embeddings in FAISS compute top-k nearest neighbors with threshold filtering.",
        },
        {
          questionNumber: 3,
          topic: "Database Design",
          difficulty: "easy",
          score: 75,
          correctness: "partial",
          questionText: "Why did you choose SQLite for this application instead of PostgreSQL or MySQL?",
          userAnswer: "SQLite is file-based and requires no separate server process, making it ideal for single-user applications.",
          modelAnswer: "SQLite provides embedded zero-maintenance transactional persistence with WAL mode for concurrent reads.",
        },
      ],
    };
  }

  // ── Save as PDF ──────────────────────────────────────────
  const printReportBtn = document.getElementById("printReportBtn");
  if (printReportBtn) {
    printReportBtn.addEventListener("click", () => {
      window.print();
    });
  }

  // ── Download HTML ────────────────────────────────────────
  const downloadHtmlBtn = document.getElementById("downloadHtmlBtn");
  if (downloadHtmlBtn) {
    downloadHtmlBtn.addEventListener("click", downloadReportHTML);
  }

  // ── Copy Summary ─────────────────────────────────────────
  const copySummaryBtn = document.getElementById("copySummaryBtn");
  if (copySummaryBtn) {
    copySummaryBtn.addEventListener("click", copyReportSummary);
  }

  // ── Share Report ─────────────────────────────────────────
  const shareReportBtn = document.getElementById("shareReportBtn");
  if (shareReportBtn) {
    shareReportBtn.addEventListener("click", shareReport);
  }

  // ── Send Email ───────────────────────────────────────────
  const sendEmailBtn = document.getElementById("sendEmailBtn");
  const reportEmailInput = document.getElementById("reportEmailInput");
  const emailStatusBanner = document.getElementById("emailStatusBanner");
  const emailMailtoArea = document.getElementById("emailMailtoArea");
  const emailMailtoLink = document.getElementById("emailMailtoLink");
  const sendEmailBtnText = document.getElementById("sendEmailBtnText");

  // Restore remembered email
  const savedEmail = localStorage.getItem("viva_user_email");
  if (savedEmail && reportEmailInput) {
    reportEmailInput.value = savedEmail;
  }

  if (sendEmailBtn && reportEmailInput) {
    sendEmailBtn.addEventListener("click", async () => {
      const email = reportEmailInput.value.trim();
      if (!email || !email.includes("@")) {
        toast("Please enter a valid email address.", "warn");
        return;
      }

      localStorage.setItem("viva_user_email", email);

      if (sendEmailBtnText) sendEmailBtnText.textContent = "⏳ Sending Email via Gmail SMTP…";
      sendEmailBtn.disabled = true;

      const score = currentReportData?.report?.overall_score || 85;
      const grade = currentReportData?.report?.grade || "A";
      const title = currentReportData?.session?.project_title || "AI Viva Examination";
      const summary = currentReportData?.report?.executive_summary || "Good defense.";
      const questions = currentReportData?.questions || [];

      const payload = {
        email: email,
        project_title: title,
        score: score,
        grade: grade,
        summary: summary,
        questions: questions
      };

      try {
        const res = await fetch("/api/send-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json().catch(() => ({}));

        if (res.ok && data.success) {
          if (emailStatusBanner) {
            emailStatusBanner.style.display = "block";
            emailStatusBanner.className = "email-status-banner success";
            emailStatusBanner.innerHTML = `✅ <strong>Real Email Sent!</strong> The performance report was sent to <strong>${escapeHtml(email)}</strong> via Gmail SMTP.<br/><small style="color:var(--text-secondary)">Please check your inbox (and check Spam / Promotions tab just in case).</small>`;
          }
          toast(`Email delivered to ${email}!`, "success");
        } else {
          throw new Error(data.error || "Failed to dispatch email via SMTP server.");
        }
      } catch (err) {
        console.warn("Direct SMTP API failed, offering mailto/web fallback:", err);

        // Fallback for static GitHub Pages or server disconnect
        const subject = encodeURIComponent(`Viva Voce Performance Report – ${title} (${score}/100, ${grade})`);
        const body = encodeURIComponent(
          `VIVA VOCE PERFORMANCE REPORT\n\n` +
          `Project: ${title}\n` +
          `Overall Score: ${score}/100 (Grade ${grade})\n\n` +
          `Executive Summary:\n${summary}\n\n` +
          `Generated by AI Viva Voce Examination Simulator.`
        );

        const gmailWebUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}&su=${subject}&body=${body}`;

        if (emailStatusBanner) {
          emailStatusBanner.style.display = "block";
          emailStatusBanner.className = "email-status-banner warn";
          emailStatusBanner.innerHTML = `⚠️ <strong>Server Note:</strong> ${escapeHtml(err.message)}<br/>You can send it with 1 click directly via Gmail Web or your email client:`;
        }

        if (emailMailtoArea) {
          emailMailtoArea.innerHTML = `
            <div style="display:flex;gap:0.5rem;flex-wrap:wrap;margin-top:0.5rem;">
              <a href="${gmailWebUrl}" class="btn btn-primary btn-sm" target="_blank">🌐 Open & Send via Gmail Web</a>
              <a href="mailto:${encodeURIComponent(email)}?subject=${subject}&body=${body}" class="btn btn-secondary btn-sm" target="_blank">📬 Open in Mail App</a>
            </div>
          `;
          emailMailtoArea.style.display = "block";
        }

        toast("Email draft ready! Click 'Open & Send via Gmail Web'.", "info");
      } finally {
        if (sendEmailBtnText) sendEmailBtnText.textContent = "Send Report";
        sendEmailBtn.disabled = false;
      }
    });
  }
});

// ── Render Report Data ─────────────────────────────────────
function renderReport(data) {
  const report = data.report || {};
  const session = data.session || {};
  const questions = data.questions || [];

  const score = Math.round(report.overall_score || 85);
  const grade = report.grade || "A";

  const bigScore = document.getElementById("bigScore");
  const gradeBadge = document.getElementById("gradeBadge");
  const execSummary = document.getElementById("execSummary");
  const reportTitle = document.getElementById("reportTitle");

  if (bigScore) bigScore.textContent = score;
  if (gradeBadge) gradeBadge.textContent = grade;
  if (execSummary && report.executive_summary) execSummary.textContent = report.executive_summary;
  if (reportTitle && session.project_title) {
    reportTitle.textContent = `${session.project_title} – Performance Report`;
  }

  // Counters
  const correct = questions.filter(q => q.correctness === "correct").length;
  const partial = questions.filter(q => q.correctness === "partial").length;
  const incorrect = questions.filter(q => q.correctness === "incorrect").length;

  const qCount = document.getElementById("reportQuestions");
  const cCount = document.getElementById("reportCorrect");
  const pCount = document.getElementById("reportPartial");
  const iCount = document.getElementById("reportIncorrect");

  if (qCount) qCount.textContent = questions.length;
  if (cCount) cCount.textContent = correct;
  if (pCount) pCount.textContent = partial;
  if (iCount) iCount.textContent = incorrect;

  // Topic performance
  const topicContainer = document.getElementById("topicPerformance");
  if (topicContainer && report.topic_performance && report.topic_performance.length) {
    topicContainer.innerHTML = report.topic_performance.map(t => `
      <div class="topic-row">
        <div class="topic-label">
          <span class="topic-name">${escapeHtml(t.topic)}</span>
          <span class="topic-score">${Math.round(t.score)}/100</span>
        </div>
        <div class="topic-bar">
          <div class="topic-bar-fill ${t.assessment || "strong"}" style="width:${Math.round(t.score)}%"></div>
        </div>
      </div>
    `).join("");
  }

  // Strengths
  const strongAreas = document.getElementById("strongAreas");
  if (strongAreas && report.strengths && report.strengths.length) {
    strongAreas.innerHTML = report.strengths.map(s => `<li>${escapeHtml(s)}</li>`).join("");
  }

  // Areas for improvement
  const weakAreas = document.getElementById("weakAreas");
  if (weakAreas && report.areas_for_improvement && report.areas_for_improvement.length) {
    weakAreas.innerHTML = report.areas_for_improvement.map(w => `<li>${escapeHtml(w)}</li>`).join("");
  }

  // Question-by-question review
  const questionReview = document.getElementById("questionReview");
  if (questionReview && questions.length) {
    questionReview.innerHTML = questions.map(q => `
      <div class="review-item">
        <div class="review-item-header">
          <span class="review-q-num">Q${q.questionNumber}</span>
          <span class="review-q-topic">${escapeHtml(q.topic)}</span>
          <span class="badge badge-${q.difficulty || "medium"}">${escapeHtml(q.difficulty || "medium")}</span>
          <span class="review-q-score" style="color:var(--${q.correctness === "correct" ? "success" : q.correctness === "partial" ? "warn" : "danger"})">
            ${q.score}/100
          </span>
        </div>
        <div class="review-q-text">${escapeHtml(q.questionText).replace(/\n/g, "<br/>")}</div>
        <div class="review-a-text"><strong>Your Answer:</strong> ${escapeHtml(q.userAnswer)}</div>
        <div class="review-m-text" style="margin-top:0.6rem;font-size:0.88rem;color:var(--cyan);line-height:1.6;">
          <strong>Model Reference Answer:</strong> ${escapeHtml(q.modelAnswer)}
        </div>
      </div>
    `).join("");
  }
}

// ── Copy Summary to Clipboard ──────────────────────────────
function copyReportSummary() {
  const score = currentReportData?.report?.overall_score || 85;
  const grade = currentReportData?.report?.grade || "A";
  const title = currentReportData?.session?.project_title || "Viva Project";
  const summary = currentReportData?.report?.executive_summary || "Good defense.";

  const text = `🎓 AI VIVA VOCE PERFORMANCE REPORT
Project: ${title}
Overall Score: ${score}/100
Grade: ${grade}

Executive Summary:
${summary}

Generated by AI Viva Voce Examination Simulator.`;

  navigator.clipboard.writeText(text).then(() => {
    toast("Report summary copied to clipboard!", "success");
  }).catch(() => {
    toast("Failed to copy. Please allow clipboard permissions.", "error");
  });
}

// ── Download HTML Standalone File ──────────────────────────
function downloadReportHTML() {
  const title = currentReportData?.session?.project_title || "Viva Project";
  const score = currentReportData?.report?.overall_score || 85;
  const grade = currentReportData?.report?.grade || "A";
  const summary = currentReportData?.report?.executive_summary || "";

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Viva Report – ${escapeHtml(title)}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; line-height: 1.6; color: #1e293b; }
    h1 { color: #0284c7; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; }
    .badge { display: inline-block; background: #e0f2fe; color: #0369a1; padding: 4px 12px; border-radius: 9999px; font-weight: 700; }
    .score-box { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .score-num { font-size: 2.5rem; font-weight: 800; color: #0f172a; }
    .review-item { border-left: 4px solid #0284c7; background: #f8fafc; padding: 15px; margin-bottom: 15px; border-radius: 4px; }
    .review-q { font-weight: 600; margin-bottom: 6px; }
  </style>
</head>
<body>
  <h1>🎓 Viva Voce Performance Report</h1>
  <p><strong>Project:</strong> ${escapeHtml(title)} · <span class="badge">Grade: ${grade}</span></p>
  <div class="score-box">
    <div class="score-num">${score} / 100</div>
    <p>${escapeHtml(summary)}</p>
  </div>
  <h2>Question Review</h2>
  ${(currentReportData?.questions || []).map(q => `
    <div class="review-item">
      <div class="review-q">Q${q.questionNumber}: ${escapeHtml(q.topic)} (${q.score}/100)</div>
      <p><strong>Question:</strong> ${escapeHtml(q.questionText)}</p>
      <p><strong>Answer:</strong> ${escapeHtml(q.userAnswer)}</p>
      <p style="color:#0284c7"><strong>Model Reference:</strong> ${escapeHtml(q.modelAnswer)}</p>
    </div>
  `).join("")}
  <footer style="margin-top:40px;font-size:0.85rem;color:#64748b;text-align:center;">
    Verified by AI Viva Voce Simulator · ${new Date().toLocaleDateString()}
  </footer>
</body>
</html>`;

  const blob = new Blob([htmlContent], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Viva_Report_${title.replace(/\s+/g, "_")}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toast("Report HTML downloaded!", "success");
}

// ── Share Report Link ──────────────────────────────────────
function shareReport() {
  const title = currentReportData?.session?.project_title || "Viva Project";
  const score = currentReportData?.report?.overall_score || 85;

  if (navigator.share) {
    navigator.share({
      title: `Viva Voce Report – ${title}`,
      text: `I scored ${score}/100 on my ${title} Viva Voce Examination!`,
      url: window.location.href,
    }).then(() => {
      toast("Report shared successfully!", "success");
    }).catch(() => {});
  } else {
    navigator.clipboard.writeText(window.location.href).then(() => {
      toast("Report URL copied to clipboard for sharing!", "success");
    });
  }
}
