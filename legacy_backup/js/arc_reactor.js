/* ═══════════════════════════════════════════════════════════════
   arc_reactor.js – Interactive Arc Reactor & AI Agent Assistant
   ═══════════════════════════════════════════════════════════════ */
"use strict";

(function () {
  let chatHistory = [];
  let voiceOutEnabled = true;
  let isAgentListening = false;
  let agentRecognition = null;

  function initArcReactorDOM() {
    if (document.getElementById("arcReactorWidget")) return;

    // 1. Floating Reactor Core Widget
    const widget = document.createElement("div");
    widget.id = "arcReactorWidget";
    widget.className = "arc-reactor-widget";
    widget.setAttribute("title", "ARC REACTOR // AI Agent Assistant (Click to open)");
    widget.innerHTML = `
      <div class="reactor-core-wrap">
        <div class="reactor-ring outer-ring"></div>
        <div class="reactor-ring segment-ring">
          <span class="seg seg-1"></span>
          <span class="seg seg-2"></span>
          <span class="seg seg-3"></span>
          <span class="seg seg-4"></span>
          <span class="seg seg-5"></span>
          <span class="seg seg-6"></span>
          <span class="seg seg-7"></span>
          <span class="seg seg-8"></span>
        </div>
        <div class="reactor-ring inner-ring"></div>
        <div class="reactor-center">
          <div class="reactor-triangle"></div>
        </div>
        <div class="reactor-energy-pulse"></div>
      </div>
      <div class="reactor-label">AI AGENT</div>
    `;

    // 2. Futuristic HUD Modal
    const modal = document.createElement("div");
    modal.id = "arcAgentModal";
    modal.className = "arc-agent-modal hidden";
    modal.innerHTML = `
      <div class="arc-agent-backdrop" id="arcAgentBackdrop"></div>
      <div class="arc-agent-window">
        <!-- HUD Header -->
        <div class="arc-hud-header">
          <div class="arc-hud-brand">
            <div class="arc-mini-core"></div>
            <div>
              <div class="arc-hud-title">ARC REACTOR // AI AGENT</div>
              <div class="arc-hud-status"><span class="status-dot"></span> NEURAL LINK ACTIVE · ONLINE</div>
            </div>
          </div>
          <div class="arc-hud-controls">
            <button class="arc-tool-btn" id="arcVoiceOutToggle" title="Toggle AI voice response">
              <span id="arcVoiceOutIcon">🔊</span>
              <span class="arc-tool-label">Voice Output</span>
            </button>
            <button class="arc-close-btn" id="arcCloseBtn" title="Close Assistant">✕</button>
          </div>
        </div>

        <!-- Project Context Bar -->
        <div class="arc-context-bar" id="arcContextBar">
          <span class="arc-context-icon">⚡</span>
          <span id="arcContextText">AI Examiner Intelligence Active. Ask me for question guidance, viva tips, or architecture explanations.</span>
        </div>

        <!-- Quick Prompt Chips -->
        <div class="arc-chips-scroll">
          <button class="arc-chip" data-prompt="Explain my project's architecture simply and clearly">🏗️ Explain architecture</button>
          <button class="arc-chip" data-prompt="What tricky questions might the examiner ask in my viva?">🎯 Predict tricky viva questions</button>
          <button class="arc-chip" data-prompt="How do I defend my choice of database and frameworks?">🛡️ Defend technology stack</button>
          <button class="arc-chip" data-prompt="What are the main edge cases or failure points in this project?">⚠️ Edge cases & failure points</button>
          <button class="arc-chip" data-prompt="Give me 3 best strategies if I don't know an answer in the viva.">💡 Unknown question strategy</button>
        </div>

        <!-- Chat History -->
        <div class="arc-chat-history" id="arcChatHistory">
          <div class="arc-msg arc-msg-agent">
            <div class="arc-msg-avatar">⚡</div>
            <div class="arc-msg-bubble">
              <p><strong>Greetings!</strong> I am your <strong>Arc Reactor AI Agent</strong>.</p>
              <p>Ask me anything about your project, tricky technical questions the examiner might ask, design trade-offs, or viva defense strategies. You can type or click the microphone to speak to me.</p>
            </div>
          </div>
        </div>

        <!-- Audio Wave Visualizer -->
        <div class="arc-wave-visualizer" id="arcWaveVisualizer" style="display:none;">
          <span class="wave-bar wb-1"></span>
          <span class="wave-bar wb-2"></span>
          <span class="wave-bar wb-3"></span>
          <span class="wave-bar wb-4"></span>
          <span class="wave-bar wb-5"></span>
          <span class="wave-status" id="arcWaveStatus">Listening…</span>
        </div>

        <!-- Input Area -->
        <div class="arc-input-area">
          <button class="arc-mic-btn" id="arcMicBtn" title="Speak to AI Agent">
            <span>🎤</span>
          </button>
          <textarea id="arcInput" class="arc-textarea" rows="1" placeholder="Ask the AI Agent a question... (e.g. Why did we choose this architecture?)"></textarea>
          <button class="arc-send-btn" id="arcSendBtn" title="Send query">
            <span>Send ➔</span>
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(widget);
    document.body.appendChild(modal);

    setupArcReactorEvents();
  }

  function setupArcReactorEvents() {
    const widget = document.getElementById("arcReactorWidget");
    const modal = document.getElementById("arcAgentModal");
    const backdrop = document.getElementById("arcAgentBackdrop");
    const closeBtn = document.getElementById("arcCloseBtn");
    const sendBtn = document.getElementById("arcSendBtn");
    const input = document.getElementById("arcInput");
    const micBtn = document.getElementById("arcMicBtn");
    const voiceOutToggle = document.getElementById("arcVoiceOutToggle");
    const voiceOutIcon = document.getElementById("arcVoiceOutIcon");

    // Toggle Modal
    function toggleModal(open) {
      if (open) {
        modal.classList.remove("hidden");
        widget.classList.add("reactor-active");
        syncContext();
        if (input) input.focus();
      } else {
        modal.classList.add("hidden");
        widget.classList.remove("reactor-active");
        if (window.speechSynthesis) window.speechSynthesis.cancel();
        if (agentRecognition && isAgentListening) {
          agentRecognition.stop();
        }
      }
    }

    widget.addEventListener("click", () => toggleModal(true));
    closeBtn.addEventListener("click", () => toggleModal(false));
    backdrop.addEventListener("click", () => toggleModal(false));

    // Voice Out Toggle
    if (voiceOutToggle) {
      voiceOutToggle.addEventListener("click", () => {
        voiceOutEnabled = !voiceOutEnabled;
        voiceOutToggle.classList.toggle("active", voiceOutEnabled);
        if (voiceOutIcon) voiceOutIcon.textContent = voiceOutEnabled ? "🔊" : "🔇";
        if (!voiceOutEnabled && window.speechSynthesis) {
          window.speechSynthesis.cancel();
        }
      });
    }

    // Quick Prompt Chips
    document.querySelectorAll(".arc-chip").forEach(chip => {
      chip.addEventListener("click", () => {
        const promptText = chip.getAttribute("data-prompt");
        if (input) {
          input.value = promptText;
          handleSend();
        }
      });
    });

    // Send on Enter
    if (sendBtn && input) {
      sendBtn.addEventListener("click", handleSend);
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          handleSend();
        }
      });

      input.addEventListener("input", () => {
        input.style.height = "auto";
        input.style.height = Math.min(input.scrollHeight, 120) + "px";
      });
    }

    // Speech Recognition for Agent
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition && micBtn) {
      agentRecognition = new SpeechRecognition();
      agentRecognition.continuous = false;
      agentRecognition.interimResults = false;
      agentRecognition.lang = "en-US";

      agentRecognition.onresult = (e) => {
        const text = e.results[0][0].transcript;
        if (input) {
          input.value = text;
          handleSend();
        }
      };

      agentRecognition.onstart = () => {
        isAgentListening = true;
        micBtn.classList.add("recording");
        const wave = document.getElementById("arcWaveVisualizer");
        if (wave) wave.style.display = "flex";
      };

      agentRecognition.onend = () => {
        isAgentListening = false;
        micBtn.classList.remove("recording");
        const wave = document.getElementById("arcWaveVisualizer");
        if (wave) wave.style.display = "none";
      };

      agentRecognition.onerror = () => {
        isAgentListening = false;
        micBtn.classList.remove("recording");
        const wave = document.getElementById("arcWaveVisualizer");
        if (wave) wave.style.display = "none";
      };

      micBtn.addEventListener("click", () => {
        if (!isAgentListening) {
          try {
            agentRecognition.start();
          } catch (_) {}
        } else {
          agentRecognition.stop();
        }
      });
    } else if (micBtn) {
      micBtn.addEventListener("click", () => {
        alert("Speech Recognition is not supported by your browser. Please type your message.");
      });
    }
  }

  function syncContext() {
    const contextText = document.getElementById("arcContextText");
    if (!contextText) return;
    const sessionRaw = localStorage.getItem("viva_active_session");
    if (sessionRaw) {
      try {
        const s = JSON.parse(sessionRaw);
        contextText.textContent = `Synchronized with ${s.project?.title || "Viva Examination"} (${s.difficulty?.toUpperCase()} mode). Ready for technical defense.`;
        return;
      } catch (_) {}
    }
    contextText.textContent = "AI Examiner Intelligence Active. Ask me for question guidance, viva tips, or architecture explanations.";
  }

  function getKnowledgeResponse(query) {
    const lower = query.toLowerCase();

    if (lower.includes("architecture") || lower.includes("structure") || lower.includes("components")) {
      return `**Architecture Defense Strategy:**\n\n• **Layer Separation:** Emphasize that your system isolates UI, business logic, and persistence. Explain that this enables independent deployment, testability with mocks, and zero coupling.\n• **Data Flow:** Trace a single request from the user input through vector indexing / database query to the rendered response.\n• **Key Trade-off:** Acknowledge that while microservices or modular layers add some setup overhead, they prevent monolithic spaghetti code and make feature extensions effortless.`;
    }

    if (lower.includes("tricky") || lower.includes("predict") || lower.includes("questions") || lower.includes("ask")) {
      return `**Top 3 Tricky Questions Examiners Love:**\n\n1. *"Why did you choose this database over alternatives (e.g. SQLite vs PostgreSQL vs MongoDB)?"*\n2. *"What is the time complexity and memory bottleneck when 1,000 users upload files simultaneously?"*\n3. *"How does your system handle corrupted or partially uploaded documents without crashing?"*\n\n💡 *Tip: Answer with quantitative reasoning (latency, memory footprint, ACID compliance).*`;
    }

    if (lower.includes("defend") || lower.includes("technology") || lower.includes("stack") || lower.includes("database")) {
      return `**Defending Your Tech Stack:**\n\n• **Frontend (HTML/CSS/JS):** Lightweight, zero build-step overhead, runs natively across all browsers with zero server lock-in.\n• **Backend & Vector Indexing:** Fast vector similarity search via FAISS / sentence embeddings gives sub-second semantic retrieval compared to traditional SQL LIKE searches.\n• **Database Strategy:** Relational ACID storage guarantees zero data corruption during session evaluation and report generation.`;
    }

    if (lower.includes("edge case") || lower.includes("failure") || lower.includes("crash") || lower.includes("bottleneck")) {
      return `**Key Edge Cases to Highlight:**\n\n1. **Network Dropouts / API Rate Limiting:** Implement exponential backoff retries and graceful fallback toast alerts.\n2. **Large File Uploads:** Stream document chunks and cap maximum file size at 50MB.\n3. **Ambiguous Candidate Answers:** The rubric evaluator gives partial credit based on semantic keyword presence rather than strict binary string matches.`;
    }

    if (lower.includes("don't know") || lower.includes("unknown") || lower.includes("strategy") || lower.includes("not know")) {
      return `**What to Say When You Don't Know the Answer:**\n\n• Never say *"I don't know"* and stop there.\n• Use this formula: *"While I have not directly benchmarked that specific edge case in this iteration, based on fundamental principles of [Concurrency / Vector Distance / Memory Allocation], I would expect X because Y. To verify this in production, I would use Z tool."*\n• Examiners respect analytical reasoning far more than memorized trivia!`;
    }

    return `Here is the expert insight regarding **"${query.substring(0, 35)}..."**:\n\nIn viva examinations, examiners prioritize:\n1. **Understanding of Fundamentals:** Can you explain why your code works from first principles?\n2. **Honesty & Reasoning:** Can you defend your design decisions while acknowledging real-world trade-offs?\n3. **Practical Testing:** Did you test edge cases, errors, and performance under stress?\n\nKeep your answers concise, structured (Problem → Solution → Trade-off), and stay confident!`;
  }

  function handleSend() {
    const input = document.getElementById("arcInput");
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;

    input.value = "";
    input.style.height = "auto";

    appendMessage("user", text);

    const historyContainer = document.getElementById("arcChatHistory");
    const loadingMsg = document.createElement("div");
    loadingMsg.className = "arc-msg arc-msg-agent";
    loadingMsg.innerHTML = `
      <div class="arc-msg-avatar">⚡</div>
      <div class="arc-msg-bubble">
        <span class="arc-dots">Analyzing neural context…</span>
      </div>
    `;
    if (historyContainer) {
      historyContainer.appendChild(loadingMsg);
      historyContainer.scrollTop = historyContainer.scrollHeight;
    }

    setTimeout(() => {
      loadingMsg.remove();
      const reply = getKnowledgeResponse(text);
      appendMessage("agent", reply);

      if (voiceOutEnabled) {
        speakAgentText(reply);
      }
    }, 550);
  }

  function appendMessage(role, text) {
    const historyContainer = document.getElementById("arcChatHistory");
    if (!historyContainer) return;

    const msg = document.createElement("div");
    msg.className = `arc-msg arc-msg-${role}`;

    const formatted = text
      .replace(/\n\n/g, "<br/><br/>")
      .replace(/\n/g, "<br/>")
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/•\s/g, "&bull; ");

    if (role === "agent") {
      msg.innerHTML = `
        <div class="arc-msg-avatar">⚡</div>
        <div class="arc-msg-bubble">${formatted}</div>
      `;
    } else {
      msg.innerHTML = `
        <div class="arc-msg-bubble user-bubble">${text.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>
        <div class="arc-msg-avatar user-avatar">👤</div>
      `;
    }

    historyContainer.appendChild(msg);
    historyContainer.scrollTop = historyContainer.scrollHeight;
    chatHistory.push({ role, content: text });
  }

  function speakAgentText(text) {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const clean = text.replace(/[*#•`_]/g, "").replace(/<[^>]*>/g, "");
    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  }

  // Auto initialize on DOM ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initArcReactorDOM);
  } else {
    initArcReactorDOM();
  }
})();
