/* ═══════════════════════════════════════════════════════
   viva.js – Complete Static & Interactive Viva Examination Logic
   ═══════════════════════════════════════════════════════ */
"use strict";

const QUESTION_BANK = [
  {
    topic: "SYSTEM DESIGN & ARCHITECTURE",
    difficulty: "medium",
    text: "Explain the high-level architecture of your project.\na) What are the main components and their primary responsibilities?\nb) How do components communicate, and how do you ensure loose coupling between them?",
    modelAnswer: "The system is structured into presentation, service, and persistence layers. Loose coupling is achieved through well-defined REST API contracts, dependency injection, and modular service factories. Services interact via asynchronous queues or standardized JSON protocols without direct database sharing.",
    understood: [
      "Identified clear separation of concerns across architectural layers",
      "Correctly explained modular interface boundaries and REST decoupling",
    ],
    misconceptions: [
      "Could elaborate more on asynchronous event handling and message queues",
    ],
    correctReasoning: "Layered architecture isolates concerns so UI, business logic, and database operations can scale and evolve independently without cascading regressions.",
    detailedExplanation: "1. Presentation Layer: Handles client requests and input validation.\n2. Business Logic Layer: Enforces domain rules, business workflows, and external model interactions.\n3. Data Access Layer: Abstracts database schemas via repositories and transactions.",
    exampleAnalogy: "Think of it like an upscale restaurant: the front-of-house waiters (APIs) take orders, the kitchen chefs (business logic) prepare meals, and the pantry stock (database) provides ingredients without customers entering the kitchen.",
    strengths: [
      "Structured articulation of system layers",
      "Good comprehension of modularity and interfaces",
    ],
    followUp: {
      diff: "HARD",
      text: "How would you handle distributed state or transactions across these decoupled services?",
    },
    evidence: [
      "Section 3.1: 'System Architecture follows a 3-tier decoupled design pattern...'",
      "Section 4.2: 'RESTful API contracts defined with OpenAPI specification.'",
    ],
    keywords: ["architecture", "component", "layer", "api", "service", "loose coupling", "modular", "interface", "separation", "rest"],
  },
  {
    topic: "RAG & VECTOR RETRIEVAL",
    difficulty: "hard",
    text: "Describe how your document indexing and search pipeline functions.\na) What chunking strategy is utilized and what is the window size?\nb) How does FAISS calculate similarity between the query and stored vector embeddings?",
    modelAnswer: "Documents are parsed into semantic chunks of 500-1000 characters with 10% overlap to preserve cross-boundary context. Embeddings are generated using transformer models, and FAISS utilizes inner product / cosine similarity over normalized L2 vectors for sub-millisecond approximate nearest neighbor retrieval.",
    understood: [
      "Correctly described the semantic chunking and embedding transformation steps",
      "Understood that vector similarity operates via cosine/inner-product distance in high-dimensional space",
    ],
    misconceptions: [
      "Remember to mention how index persistence and vector normalization prevent search skewing",
    ],
    correctReasoning: "Dense vector embeddings capture conceptual semantics rather than mere keyword matches, enabling the model to retrieve contextually relevant passages even with varied terminology.",
    detailedExplanation: "1. Tokenization and sliding window chunking with overlap.\n2. Model inference generates dense vector representations (e.g. 384 or 768 dimensions).\n3. FAISS index stores vectors and evaluates cosine similarity against candidate queries.\n4. Top-K closest passages are injected into the prompt context for LLM grounded generation.",
    exampleAnalogy: "Like a library catalog that organizes books by conceptual essence and plot rather than strict alphabetical titles.",
    strengths: [
      "Strong grasp of semantic search mechanics",
      "Accurate description of embedding distances",
    ],
    followUp: {
      diff: "HARD",
      text: "What strategies prevent semantic drift or hallucination if document chunks contain conflicting information?",
    },
    evidence: [
      "Section 2.4: 'Documents are chunked into 512-token segments with 50-token stride...'",
      "Section 5.3: 'FAISS IndexFlatIP used for normalized cosine similarity search.'",
    ],
    keywords: ["chunk", "faiss", "vector", "embedding", "similarity", "cosine", "transformer", "semantic", "rag", "overlap"],
  },
  {
    topic: "DATABASE ARCHITECTURE & TRANSACTIONS",
    difficulty: "easy",
    text: "Discuss your data storage choices.\na) Why was this particular database selected for your requirements?\nb) How do you maintain data integrity and transaction atomicity during concurrent operations?",
    modelAnswer: "SQLite was chosen for its zero-configuration, serverless reliability and fast in-memory execution during evaluation sessions. Integrity is enforced via foreign keys, WAL (Write-Ahead Logging) mode, and ACID transactions.",
    understood: [
      "Clearly explained ACID properties and rationale for relational storage",
      "Identified write-ahead logging (WAL) as a concurrency facilitator",
    ],
    misconceptions: [
      "Consider indexing trade-offs when tables experience heavy write throughput",
    ],
    correctReasoning: "Relational constraints and transaction boundaries guarantee that multi-table state updates succeed or fail atomically without orphaned records.",
    detailedExplanation: "1. Schema design establishes strict foreign key constraints.\n2. WAL mode allows concurrent readers while a single writer commits changes.\n3. Transactions bundle operations into atomic commit blocks.",
    exampleAnalogy: "Like a bank transfer where withdrawing money from Account A and crediting Account B MUST either both complete or neither happens.",
    strengths: [
      "Solid knowledge of ACID principles",
      "Good awareness of storage concurrency",
    ],
    followUp: {
      diff: "MEDIUM",
      text: "At what traffic threshold would you migrate from SQLite to PostgreSQL or a distributed database?",
    },
    evidence: [
      "Section 4.4: 'Database schema normalized to 3NF with WAL mode enabled.'",
    ],
    keywords: ["database", "sqlite", "acid", "transaction", "integrity", "foreign key", "wal", "table", "schema", "concurrent"],
  },
  {
    topic: "API SECURITY & AUTHENTICATION",
    difficulty: "medium",
    text: "How does the application protect against security vulnerabilities?\na) How do you handle input validation and prevent injection attacks?\nb) What safeguards prevent token leakage or unauthorized endpoint access?",
    modelAnswer: "Input sanitization and parameterized queries protect against SQL injection and XSS. Sensitive API keys are stored strictly in environment variables and validated on backend endpoints.",
    understood: [
      "Understood parameterized queries and environment variable management",
      "Acknowledged cross-site scripting (XSS) input filtering",
    ],
    misconceptions: [
      "Add rate-limiting and CORS policies for comprehensive defense-in-depth",
    ],
    correctReasoning: "Treating all user input as untrusted and separating code from data execution prevents code injection vulnerabilities.",
    detailedExplanation: "1. Inputs validated against strict regex schemas.\n2. Prepared statements ensure input parameters are never executed as SQL code.\n3. API secrets kept in .env files out of source control.",
    exampleAnalogy: "Like an airport security checkpoint where luggage is scanned and passengers cannot bring tools into the cockpit.",
    strengths: [
      "Good comprehension of injection prevention",
      "Proper secret isolation practices",
    ],
    followUp: {
      diff: "HARD",
      text: "How would you prevent CSRF attacks when using JWT tokens stored in browser cookies?",
    },
    evidence: [
      "Section 6.1: 'Input validation performed at gateway level; API keys loaded via environment variables.'",
    ],
    keywords: ["security", "injection", "sanitization", "xss", "csrf", "token", "env", "environment", "validation", "parameterized"],
  },
  {
    topic: "SCALABILITY & PERFORMANCE OPTIMIZATION",
    difficulty: "hard",
    text: "Evaluate the scalability bottlenecks of your solution.\na) Where would latency spike under high concurrent traffic?\nb) What caching or load balancing strategies would you introduce to handle 10x traffic?",
    modelAnswer: "Vector indexing and LLM inference calls are the primary bottlenecks. Introducing a Redis caching layer for frequent queries and distributing inference workers behind a round-robin load balancer resolves this.",
    understood: [
      "Identified AI inference calls and vector search as primary latency bottlenecks",
      "Proposed Redis caching and horizontal worker scaling",
    ],
    misconceptions: [
      "Don't overlook connection pool saturation on database tiers under sudden traffic bursts",
    ],
    correctReasoning: "Caching computationally expensive LLM and vector calculations at the edge minimizes costly redundant GPU/CPU passes.",
    detailedExplanation: "1. Query hashing checks Redis cache before invoking vector embedding.\n2. Load balancer distributes incoming HTTP sessions across stateless nodes.\n3. Asynchronous task queues (e.g. Celery/RabbitMQ) handle background processing.",
    exampleAnalogy: "Like a popular coffee shop having pre-brewed coffee ready so they don't grind beans for every single customer.",
    strengths: [
      "Practical insight into caching layers",
      "Realistic assessment of LLM inference latency",
    ],
    followUp: {
      diff: "HARD",
      text: "What cache invalidation strategy would you use when underlying project documents are updated?",
    },
    evidence: [
      "Section 7.2: 'Performance benchmarks indicate 80% response time spent in model inference.'",
    ],
    keywords: ["scalability", "bottleneck", "latency", "cache", "redis", "load balancer", "concurrent", "worker", "queue", "inference"],
  },
  {
    topic: "TESTING & RELIABILITY",
    difficulty: "easy",
    text: "How do you verify the correctness of your system?\na) What unit or integration tests did you implement?\nb) How do you test edge cases like malformed uploads or empty inputs?",
    modelAnswer: "Pytest handles unit testing for chunking, vector indexing, and scoring logic. Edge cases like corrupt PDFs, empty strings, and maximum file sizes are validated via parameterized test fixtures.",
    understood: [
      "Explained automated test suites with unit and integration coverage",
      "Demonstrated awareness of boundary testing and malformed input handling",
    ],
    misconceptions: [
      "Include continuous integration (CI) pipelines for automated regression tests",
    ],
    correctReasoning: "Rigorous test fixtures prevent silent regressions and ensure grace under unexpected runtime payloads.",
    detailedExplanation: "1. Unit tests test individual functions with mocks.\n2. Integration tests verify end-to-end request cycles.\n3. Boundary tests evaluate extreme file sizes and unusual characters.",
    exampleAnalogy: "Like crash-testing cars with crash dummies before putting vehicles on public highways.",
    strengths: [
      "Strong testing methodology",
      "Good edge-case awareness",
    ],
    followUp: {
      diff: "MEDIUM",
      text: "How do you test non-deterministic outputs from the LLM evaluator reliably?",
    },
    evidence: [
      "Section 8.1: 'Test suite covers 85% of codebase using Pytest and mock response fixtures.'",
    ],
    keywords: ["test", "pytest", "unit", "integration", "edge case", "mock", "validation", "coverage", "fixture", "benchmark"],
  },
];

// ── State ──────────────────────────────────────────────────
let activeSession = null;
let currentIndex = 0;
let questions = [];
let questionHistory = [];
let speechMuted = false;
let isRecording = false;
let recognition = null;
let sessionStats = { answered: 0, totalScore: 0 };

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

function escapeHtml(str) {
  return String(str || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function renderQuestionHTML(text) {
  if (!text) return "";
  const lines = text.split("\n");
  return lines.map(line => {
    if (/^[a-c]\)/i.test(line.trim())) {
      return `<div class="q-subpart"><strong style="color:var(--cyan)">${line.substring(0, 2)}</strong> ${escapeHtml(line.substring(2))}</div>`;
    }
    return `<div>${escapeHtml(line)}</div>`;
  }).join("");
}

// ── Speech Synthesis (TTS) ─────────────────────────────────
function speakText(text) {
  if (speechMuted || !("speechSynthesis" in window)) return;
  const autoVoice = document.getElementById("autoVoiceToggle");
  if (autoVoice && !autoVoice.checked) return;

  window.speechSynthesis.cancel();
  const clean = text.replace(/^[a-c]\)/gim, "").replace(/[*#_`]/g, "");
  const utterance = new SpeechSynthesisUtterance(clean);
  utterance.rate = 1.0;
  utterance.pitch = 1.0;

  const examinerSub = document.getElementById("examinerStatusSub");
  utterance.onstart = () => {
    if (examinerSub) examinerSub.textContent = "AI Examiner is speaking…";
  };
  utterance.onend = () => {
    if (examinerSub) examinerSub.textContent = "Ready · Listening for answer";
  };
  window.speechSynthesis.speak(utterance);
}

// ── Speech Recognition (STT) ───────────────────────────────
function initSpeechRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) return null;

  const sr = new SpeechRecognition();
  sr.continuous = true;
  sr.interimResults = true;
  sr.lang = "en-US";

  const textarea = document.getElementById("answerTextarea");
  const micBtn = document.getElementById("micBtn");
  const recStatus = document.getElementById("recordingStatus");
  const submitBtn = document.getElementById("submitBtn");
  const charCount = document.getElementById("charCount");

  sr.onresult = (e) => {
    let transcript = "";
    for (let i = e.resultIndex; i < e.results.length; i++) {
      transcript += e.results[i][0].transcript;
    }
    if (textarea) {
      textarea.value = (textarea.value + " " + transcript).trim();
      if (charCount) charCount.textContent = `${textarea.value.length} characters`;
      if (submitBtn) submitBtn.disabled = textarea.value.length < 2;
    }
  };

  sr.onstart = () => {
    isRecording = true;
    if (micBtn) micBtn.classList.add("recording");
    if (recStatus) recStatus.textContent = "Listening… Speak your answer clearly.";
  };

  sr.onend = () => {
    isRecording = false;
    if (micBtn) micBtn.classList.remove("recording");
    if (recStatus) recStatus.textContent = "Click microphone to speak your answer (Demo Mode)";
  };

  sr.onerror = () => {
    isRecording = false;
    if (micBtn) micBtn.classList.remove("recording");
    if (recStatus) recStatus.textContent = "Mic error or paused. Click microphone to resume.";
  };

  return sr;
}

// ── Initialization ─────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  // Load session from localStorage
  const raw = localStorage.getItem("viva_active_session");
  if (raw) {
    try {
      activeSession = JSON.parse(raw);
    } catch (_) {}
  }

  if (!activeSession) {
    activeSession = {
      project: { title: "AI Viva Examination Simulator (Demo)" },
      difficulty: "medium",
      questionCount: 6,
      voiceMode: true,
    };
  }

  const count = activeSession.questionCount || 6;
  questions = [...QUESTION_BANK].slice(0, count);

  // Bind DOM elements
  const questionText = document.getElementById("questionText");
  const questionTopic = document.getElementById("questionTopic");
  const progressLabel = document.getElementById("progressLabel");
  const examProgressFill = document.getElementById("examProgressFill");
  const difficultyBadge = document.getElementById("difficultyBadge");
  const answerTextarea = document.getElementById("answerTextarea");
  const charCount = document.getElementById("charCount");
  const submitBtn = document.getElementById("submitBtn");
  const skipBtn = document.getElementById("skipBtn");
  const feedbackPanel = document.getElementById("feedbackPanel");
  const answerSection = document.getElementById("answerSection");
  const nextQuestionBtn = document.getElementById("nextQuestionBtn");
  const speakQuestionBtn = document.getElementById("speakQuestionBtn");
  const muteBtn = document.getElementById("muteBtn");
  const micBtn = document.getElementById("micBtn");
  const sessionInfo = document.getElementById("sessionInfo");
  const scoreDisplay = document.getElementById("scoreDisplay");

  // Early exit buttons
  const navEndExamBtn = document.getElementById("navEndExamBtn");
  const endExamEarlyBtn = document.getElementById("endExamEarlyBtn");
  const earlyExitModal = document.getElementById("earlyExitModal");
  const cancelEarlyExitBtn = document.getElementById("cancelEarlyExitBtn");
  const confirmEarlyExitBtn = document.getElementById("confirmEarlyExitBtn");
  const earlyExitModalText = document.getElementById("earlyExitModalText");

  // Display initial session info
  if (sessionInfo) {
    const diffCapitalized = activeSession.difficulty.charAt(0).toUpperCase() + activeSession.difficulty.slice(1);
    sessionInfo.textContent = `${diffCapitalized} · ${questions.length} Q`;
    sessionInfo.className = `badge badge-${activeSession.difficulty}`;
  }

  // Textarea input monitoring
  if (answerTextarea) {
    answerTextarea.addEventListener("input", () => {
      const len = answerTextarea.value.trim().length;
      if (charCount) charCount.textContent = `${len} character${len !== 1 ? "s" : ""}`;
      if (submitBtn) submitBtn.disabled = len < 2;
    });
  }

  // Speech Recognition
  recognition = initSpeechRecognition();
  if (micBtn) {
    micBtn.addEventListener("click", () => {
      if (!recognition) {
        toast("Speech Recognition is not supported in this browser. Please type your answer.", "warn");
        return;
      }
      if (!isRecording) {
        try {
          recognition.start();
        } catch (_) {}
      } else {
        recognition.stop();
      }
    });
  }

  // Voice Controls
  if (speakQuestionBtn) {
    speakQuestionBtn.addEventListener("click", () => {
      if (questions[currentIndex]) {
        speakText(questions[currentIndex].text);
      }
    });
  }

  if (muteBtn) {
    muteBtn.addEventListener("click", () => {
      speechMuted = !speechMuted;
      muteBtn.textContent = speechMuted ? "🔈" : "🔇";
      muteBtn.title = speechMuted ? "Unmute speech" : "Mute speech";
      if (speechMuted && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      } else if (!speechMuted && questions[currentIndex]) {
        speakText(questions[currentIndex].text);
      }
    });
  }

  // Early Exit Modal logic
  function openExitModal() {
    if (earlyExitModalText) {
      const avg = sessionStats.answered ? Math.round(sessionStats.totalScore / sessionStats.answered) : 0;
      earlyExitModalText.innerHTML = `You have completed <strong>${sessionStats.answered} of ${questions.length}</strong> questions so far with an average score of <strong>${avg}/100</strong>.<br/><br/>Ending now will mark the examination complete and generate your official Performance Report based on your completed answers.`;
    }
    if (earlyExitModal) earlyExitModal.classList.remove("hidden");
  }

  function closeExitModal() {
    if (earlyExitModal) earlyExitModal.classList.add("hidden");
  }

  if (navEndExamBtn) navEndExamBtn.addEventListener("click", openExitModal);
  if (endExamEarlyBtn) endExamEarlyBtn.addEventListener("click", openExitModal);
  if (cancelEarlyExitBtn) cancelEarlyExitBtn.addEventListener("click", closeExitModal);

  if (confirmEarlyExitBtn) {
    confirmEarlyExitBtn.addEventListener("click", () => {
      finishExam();
    });
  }

  // Submit Answer
  if (submitBtn) {
    submitBtn.addEventListener("click", () => {
      const ans = answerTextarea ? answerTextarea.value.trim() : "";
      if (!ans) {
        toast("Please enter your answer before submitting.", "warn");
        return;
      }
      evaluateAnswer(ans);
    });
  }

  // Skip Question
  if (skipBtn) {
    skipBtn.addEventListener("click", () => {
      evaluateAnswer("(Question skipped by candidate)");
    });
  }

  // Next Question
  if (nextQuestionBtn) {
    nextQuestionBtn.addEventListener("click", () => {
      currentIndex++;
      if (currentIndex >= questions.length) {
        finishExam();
      } else {
        renderQuestion();
      }
    });
  }

  // Tab switching in feedback panel
  document.querySelectorAll(".feedback-tabs .tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".feedback-tabs .tab-btn").forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
      btn.classList.add("active");
      const tabId = btn.getAttribute("data-tab");
      const target = document.getElementById(`tab-${tabId}`);
      if (target) target.classList.add("active");
    });
  });

  // Render first question
  renderQuestion();
});

// ── Render Question ────────────────────────────────────────
function renderQuestion() {
  const q = questions[currentIndex];
  if (!q) return;

  const questionText = document.getElementById("questionText");
  const questionTopic = document.getElementById("questionTopic");
  const progressLabel = document.getElementById("progressLabel");
  const examProgressFill = document.getElementById("examProgressFill");
  const difficultyBadge = document.getElementById("difficultyBadge");
  const answerTextarea = document.getElementById("answerTextarea");
  const charCount = document.getElementById("charCount");
  const submitBtn = document.getElementById("submitBtn");
  const feedbackPanel = document.getElementById("feedbackPanel");
  const answerSection = document.getElementById("answerSection");

  if (questionTopic) questionTopic.textContent = q.topic;
  if (questionText) questionText.innerHTML = renderQuestionHTML(q.text);

  if (difficultyBadge) {
    difficultyBadge.textContent = q.difficulty.charAt(0).toUpperCase() + q.difficulty.slice(1);
    difficultyBadge.className = `badge badge-${q.difficulty}`;
  }

  if (progressLabel) progressLabel.textContent = `Question ${currentIndex + 1} / ${questions.length}`;
  if (examProgressFill) {
    const pct = Math.round((currentIndex / questions.length) * 100);
    examProgressFill.style.width = `${pct}%`;
  }

  // Reset answer area
  if (answerTextarea) answerTextarea.value = "";
  if (charCount) charCount.textContent = "0 characters";
  if (submitBtn) submitBtn.disabled = true;

  if (feedbackPanel) feedbackPanel.style.display = "none";
  if (answerSection) answerSection.style.display = "flex";

  // Auto-speak question
  speakText(q.text);
}

// ── Answer Evaluation ──────────────────────────────────────
function evaluateAnswer(userAnswer) {
  const q = questions[currentIndex];
  const isSkipped = userAnswer.includes("skipped");

  let score = 0;
  let correctness = "incorrect";

  if (isSkipped) {
    score = 0;
    correctness = "incorrect";
  } else {
    const lower = userAnswer.toLowerCase();
    let matches = 0;
    q.keywords.forEach(k => {
      if (lower.includes(k.toLowerCase())) matches++;
    });

    const matchRatio = matches / Math.min(q.keywords.length, 5);
    const lengthFactor = Math.min(userAnswer.split(/\s+/).length / 25, 1);
    score = Math.min(100, Math.round((matchRatio * 60) + (lengthFactor * 30) + 10));

    if (score >= 80) correctness = "correct";
    else if (score >= 50) correctness = "partial";
    else correctness = "incorrect";
  }

  sessionStats.answered++;
  sessionStats.totalScore += score;

  const resultItem = {
    questionNumber: currentIndex + 1,
    topic: q.topic,
    difficulty: q.difficulty,
    questionText: q.text,
    userAnswer: userAnswer,
    modelAnswer: q.modelAnswer,
    score: score,
    correctness: correctness,
    understood: q.understood || ["Identified primary technical concepts"],
    misconceptions: q.misconceptions || ["Provide deeper architectural trade-off justifications"],
    correctReasoning: q.correctReasoning || q.modelAnswer,
    detailedExplanation: q.detailedExplanation || q.modelAnswer,
    exampleAnalogy: q.exampleAnalogy || "",
    strengths: q.strengths || ["Articulate technical vocabulary"],
    followUp: q.followUp || { diff: "MEDIUM", text: "How would you benchmark this?" },
    evidence: q.evidence || ["Section 3.0: Core Architecture specification."],
  };

  questionHistory.push(resultItem);
  updateScoreAndHistory();

  // Populate Feedback Panel
  const feedbackPanel = document.getElementById("feedbackPanel");
  const answerSection = document.getElementById("answerSection");
  const feedbackScoreBadge = document.getElementById("feedbackScoreBadge");
  const correctnessBadge = document.getElementById("correctnessBadge");
  const understoodList = document.getElementById("understoodList");
  const misconceptionsList = document.getElementById("misconceptionsList");
  const correctReasoning = document.getElementById("correctReasoning");
  const detailedExplanation = document.getElementById("detailedExplanation");
  const exampleAnalogy = document.getElementById("exampleAnalogy");
  const strengthsList = document.getElementById("strengthsList");
  const modelAnswer = document.getElementById("modelAnswer");
  const followUpQuestion = document.getElementById("followUpQuestion");
  const followUpDiff = document.getElementById("followUpDiff");
  const evidenceList = document.getElementById("evidenceList");

  if (answerSection) answerSection.style.display = "none";
  if (feedbackPanel) feedbackPanel.style.display = "block";

  if (feedbackScoreBadge) feedbackScoreBadge.textContent = `${score}/100`;
  if (correctnessBadge) {
    correctnessBadge.textContent = correctness.toUpperCase();
    correctnessBadge.className = `correctness-badge ${correctness}`;
  }

  if (understoodList) {
    understoodList.innerHTML = resultItem.understood.map(u => `<li>${escapeHtml(u)}</li>`).join("");
  }
  if (misconceptionsList) {
    misconceptionsList.innerHTML = resultItem.misconceptions.map(m => `<li>${escapeHtml(m)}</li>`).join("");
  }
  if (correctReasoning) correctReasoning.textContent = resultItem.correctReasoning;
  if (detailedExplanation) detailedExplanation.innerHTML = resultItem.detailedExplanation.replace(/\n/g, "<br/>");
  if (exampleAnalogy) exampleAnalogy.textContent = resultItem.exampleAnalogy;

  if (strengthsList) {
    strengthsList.innerHTML = resultItem.strengths.map(s => `<li>${escapeHtml(s)}</li>`).join("");
  }
  if (modelAnswer) modelAnswer.textContent = resultItem.modelAnswer;

  if (followUpQuestion && resultItem.followUp) {
    followUpQuestion.textContent = resultItem.followUp.text;
  }
  if (followUpDiff && resultItem.followUp) {
    followUpDiff.textContent = resultItem.followUp.diff;
  }

  if (evidenceList && resultItem.evidence) {
    evidenceList.innerHTML = resultItem.evidence.map(e => `<li>${escapeHtml(e)}</li>`).join("");
  }

  // Voice feedback
  if (!speechMuted && "speechSynthesis" in window) {
    const feedbackMsg = `Score: ${score} out of 100. ${correctness === "correct" ? "Excellent answer!" : correctness === "partial" ? "Good attempt, with room for improvement." : "Let's review the model answer."}`;
    const ut = new SpeechSynthesisUtterance(feedbackMsg);
    window.speechSynthesis.speak(ut);
  }
}

// ── Sidebar Score & History ────────────────────────────────
function updateScoreAndHistory() {
  const avg = sessionStats.answered ? Math.round(sessionStats.totalScore / sessionStats.answered) : 0;

  const scoreDisplay = document.getElementById("scoreDisplay");
  if (scoreDisplay) scoreDisplay.textContent = `Score: ${avg}/100`;

  const ringScore = document.getElementById("ringScore");
  if (ringScore) ringScore.textContent = avg;

  const scoreRing = document.getElementById("scoreRing");
  if (scoreRing) {
    const radius = 32;
    const circ = 2 * Math.PI * radius;
    const offset = circ - (avg / 100) * circ;
    scoreRing.style.strokeDashoffset = offset;
  }

  const historyList = document.getElementById("historyList");
  if (historyList) {
    historyList.innerHTML = questionHistory.map(h => `
      <div class="history-item">
        <div class="history-item-top">
          <span class="history-q-num">Q${h.questionNumber}</span>
          <span class="history-topic">${escapeHtml(h.topic)}</span>
          <span class="history-score">${h.score}/100</span>
        </div>
        <div class="history-badge ${h.correctness}">${h.correctness}</div>
      </div>
    `).join("");
  }
}

// ── Complete & Navigate to Report ──────────────────────────
function finishExam() {
  if (window.speechSynthesis) window.speechSynthesis.cancel();

  const totalScore = questionHistory.reduce((sum, q) => sum + q.score, 0);
  const count = questionHistory.length || 1;
  const avgScore = Math.round(totalScore / count);

  let grade = "A";
  if (avgScore >= 90) grade = "A+";
  else if (avgScore >= 80) grade = "A";
  else if (avgScore >= 70) grade = "B+";
  else if (avgScore >= 60) grade = "B";
  else if (avgScore >= 50) grade = "C";
  else grade = "D";

  const projectTitle = activeSession?.project?.title || "AI Viva Examination Simulator";

  const reportPayload = {
    session: {
      id: "sess_" + Date.now(),
      project_title: projectTitle,
      overall_score: avgScore,
      grade: grade,
      created_at: new Date().toISOString(),
      total_questions: questions.length,
      answered_questions: questionHistory.length,
    },
    report: {
      overall_score: avgScore,
      grade: grade,
      executive_summary: `Candidate demonstrated ${avgScore >= 75 ? "strong and articulate" : "developing"} command across project architecture and engineering trade-offs. Core concepts were defended with clarity, with key opportunities to expand on distributed fault tolerance and production metrics.`,
      topic_performance: [
        { topic: "System Architecture", score: Math.min(100, avgScore + 4), assessment: avgScore >= 75 ? "strong" : "adequate" },
        { topic: "RAG & Vector Retrieval", score: Math.max(40, avgScore - 3), assessment: "adequate" },
        { topic: "Database Architecture", score: Math.min(100, avgScore + 6), assessment: "strong" },
        { topic: "API Security & Auth", score: Math.min(100, avgScore + 1), assessment: avgScore >= 70 ? "strong" : "adequate" },
        { topic: "Scalability & Performance", score: Math.max(45, avgScore - 7), assessment: avgScore >= 80 ? "strong" : "weak" },
        { topic: "Testing & Code Quality", score: Math.min(100, avgScore + 3), assessment: "strong" },
      ],
      strengths: [
        "Well-structured articulation of layered design and interface boundaries.",
        "Accurate identification of storage transactions and relational constraints.",
        "Demonstrated familiarity with vector embedding search workflows.",
      ],
      areas_for_improvement: [
        "Include quantitative performance metrics (P99 latency, RPS) when defending design choices.",
        "Further elaborate on distributed state management and circuit breaker patterns.",
        "Deepen testing strategies around non-deterministic model outputs.",
      ],
    },
    questions: questionHistory.length ? questionHistory : QUESTION_BANK.slice(0, 3).map((q, i) => ({
      questionNumber: i + 1,
      topic: q.topic,
      difficulty: q.difficulty,
      questionText: q.text,
      userAnswer: "Completed via viva simulator.",
      modelAnswer: q.modelAnswer,
      score: 80,
      correctness: "correct",
    })),
  };

  localStorage.setItem("viva_last_report", JSON.stringify(reportPayload));
  toast("Exam saved! Redirecting to your Performance Report…", "success");

  setTimeout(() => {
    window.location.href = "report.html";
  }, 600);
}
