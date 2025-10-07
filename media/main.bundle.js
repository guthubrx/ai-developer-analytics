var AIAnalytics = (function () {
  'use strict';

  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __esm = (fn, res) => function __init() {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  };
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };

  // media/modules/state-manager.js
  var StateManager, state_manager_default;
  var init_state_manager = __esm({
    "media/modules/state-manager.js"() {
      StateManager = class {
        constructor() {
          this.vscode = acquireVsCodeApi();
          this.initializeState();
        }
        initializeState() {
          this.domElements = {
            promptInput: null,
            sendBtn: null,
            fileAttachBtn: null,
            imageAttachBtn: null,
            fileAutocomplete: null,
            fileSearch: null,
            fileResults: null,
            conversationContent: null,
            conversationContainer: null,
            coachingSection: null,
            coachingContent: null,
            coachCollapseBtn: null,
            sessionTabs: null,
            newSessionBtn: null
          };
          this.state = {
            attachedFiles: [],
            isFileAutocompleteOpen: false,
            conversationHistory: [],
            thinkingAnimationInterval: null,
            thinkingMessageElement: null,
            streamingMessageElement: null,
            isStreaming: false,
            sessions: [],
            currentSessionId: null,
            sessionCounter: 1,
            sessionMetrics: {
              totalCost: 0,
              totalTokens: 0,
              latestLatency: 0,
              cacheHits: 0,
              totalRequests: 0
            },
            settings: {}
          };
        }
        // Getters
        getDomElement(name) {
          return this.domElements[name];
        }
        getState(key) {
          return this.state[key];
        }
        getVSCode() {
          return this.vscode;
        }
        // Setters
        setDomElement(name, element) {
          this.domElements[name] = element;
        }
        setState(key, value) {
          this.state[key] = value;
        }
        // State management methods
        addConversationMessage(message) {
          const currentSession = this.getCurrentSession();
          if (currentSession) {
            currentSession.conversation.push({
              ...message,
              id: Date.now(),
              timestamp: (/* @__PURE__ */ new Date()).toLocaleTimeString()
            });
          }
        }
        getConversationHistory() {
          const currentSession = this.getCurrentSession();
          return currentSession ? currentSession.conversation : [];
        }
        getConversationContext(maxMessages = 10) {
          const history = this.getConversationHistory();
          return history.slice(-maxMessages);
        }
        updateMetrics(metrics) {
          if (metrics.cost !== void 0) {
            this.state.sessionMetrics.totalCost += metrics.cost;
          }
          if (metrics.tokens !== void 0) {
            this.state.sessionMetrics.totalTokens += metrics.tokens;
          }
          if (metrics.latency !== void 0) {
            this.state.sessionMetrics.latestLatency = metrics.latency;
          }
          if (metrics.cacheHit !== void 0) {
            this.state.sessionMetrics.totalRequests++;
            if (metrics.cacheHit) {
              this.state.sessionMetrics.cacheHits++;
            }
          }
        }
        createSession(name = null) {
          const sessionId = "session-" + Date.now();
          const sessionName = name || `Session ${this.state.sessionCounter++}`;
          const session = {
            id: sessionId,
            name: sessionName,
            conversation: [],
            metrics: {
              totalCost: 0,
              totalTokens: 0,
              latestLatency: 0,
              cacheHits: 0,
              totalRequests: 0
            },
            createdAt: /* @__PURE__ */ new Date()
          };
          this.state.sessions.push(session);
          this.state.currentSessionId = sessionId;
          return session;
        }
        getCurrentSession() {
          return this.state.sessions.find((s) => s.id === this.state.currentSessionId);
        }
        switchToSession(sessionId) {
          this.state.currentSessionId = sessionId;
        }
        closeSession(sessionId) {
          const sessionIndex = this.state.sessions.findIndex((s) => s.id === sessionId);
          if (sessionIndex !== -1) {
            this.state.sessions.splice(sessionIndex, 1);
            if (this.state.currentSessionId === sessionId && this.state.sessions.length > 0) {
              this.state.currentSessionId = this.state.sessions[0].id;
            }
          }
        }
        // File autocomplete state
        openFileAutocomplete() {
          this.state.isFileAutocompleteOpen = true;
        }
        closeFileAutocomplete() {
          this.state.isFileAutocompleteOpen = false;
        }
        isFileAutocompleteOpen() {
          return this.state.isFileAutocompleteOpen;
        }
        // Settings management
        updateSettings(settings) {
          this.state.settings = { ...this.state.settings, ...settings };
        }
        getSettings() {
          return this.state.settings;
        }
        // Utility methods
        resetConversation() {
          this.state.conversationHistory = [];
        }
        clearThinkingAnimation() {
          if (this.state.thinkingAnimationInterval) {
            clearInterval(this.state.thinkingAnimationInterval);
            this.state.thinkingAnimationInterval = null;
          }
          this.state.thinkingMessageElement = null;
        }
        clearStreamingState() {
          this.state.streamingMessageElement = null;
          this.state.isStreaming = false;
        }
      };
      state_manager_default = new StateManager();
    }
  });

  // media/modules/file-autocomplete-manager.js
  var FileAutocompleteManager, file_autocomplete_manager_default;
  var init_file_autocomplete_manager = __esm({
    "media/modules/file-autocomplete-manager.js"() {
      init_state_manager();
      FileAutocompleteManager = class {
        constructor() {
          this.stateManager = state_manager_default;
        }
        toggleFileAutocomplete() {
          console.log("Toggle file autocomplete clicked, current state:", this.stateManager.isFileAutocompleteOpen());
          if (this.stateManager.isFileAutocompleteOpen()) {
            this.closeFileAutocomplete();
          } else {
            this.openFileAutocomplete();
          }
        }
        openFileAutocomplete() {
          console.log("Opening file autocomplete...");
          let fileAutocomplete = this.stateManager.getDomElement("fileAutocomplete");
          if (!fileAutocomplete) {
            console.error("fileAutocomplete element is null!");
            console.log("Trying to find it again...");
            fileAutocomplete = document.getElementById("file-autocomplete");
            this.stateManager.setDomElement("fileAutocomplete", fileAutocomplete);
            console.log("Found element:", fileAutocomplete);
            if (!fileAutocomplete) {
              console.error("fileAutocomplete element still not found in DOM!");
              return;
            }
          }
          this.applyAutocompleteStyles(fileAutocomplete);
          this.initializeAutocompleteContent();
          this.positionFileAutocomplete();
          this.requestProjectFiles();
          this.stateManager.openFileAutocomplete();
          this.logAutocompleteState(fileAutocomplete);
        }
        closeFileAutocomplete() {
          const fileAutocomplete = this.stateManager.getDomElement("fileAutocomplete");
          if (fileAutocomplete) {
            fileAutocomplete.style.display = "none";
          }
          this.stateManager.closeFileAutocomplete();
        }
        handleFileSearch(query) {
          this.requestFileSearch(query);
        }
        attachFile(filePath) {
          const attachedFiles = this.stateManager.getState("attachedFiles");
          attachedFiles.push(filePath);
          const promptInput = this.stateManager.getDomElement("promptInput");
          const currentPrompt = promptInput.value;
          const fileReference = `@${filePath}`;
          if (currentPrompt.includes(fileReference)) {
            return;
          }
          promptInput.value = currentPrompt + (currentPrompt ? "\n" : "") + fileReference;
          const event = new Event("input", { bubbles: true });
          promptInput.dispatchEvent(event);
        }
        displayFileResults(files) {
          const fileResults = this.stateManager.getDomElement("fileResults");
          if (!fileResults) return;
          fileResults.innerHTML = "";
          if (files.length === 0) {
            const noResults = document.createElement("div");
            noResults.className = "file-result-item";
            noResults.textContent = "No files found";
            fileResults.appendChild(noResults);
            return;
          }
          files.forEach((file) => {
            const item = document.createElement("div");
            item.className = "file-result-item";
            item.textContent = file;
            item.addEventListener("click", () => {
              this.attachFile(file);
              this.closeFileAutocomplete();
            });
            fileResults.appendChild(item);
          });
        }
        // Private methods
        applyAutocompleteStyles(fileAutocomplete) {
          fileAutocomplete.style.display = "block";
          fileAutocomplete.style.visibility = "visible";
          fileAutocomplete.style.opacity = "1";
          fileAutocomplete.style.backgroundColor = "var(--bg-card)";
          fileAutocomplete.style.border = "1px solid var(--border-primary)";
          fileAutocomplete.style.minHeight = "100px";
        }
        initializeAutocompleteContent() {
          const fileSearch = this.stateManager.getDomElement("fileSearch");
          const fileResults = this.stateManager.getDomElement("fileResults");
          if (fileSearch) {
            fileSearch.value = "";
            fileSearch.focus();
          }
          if (fileResults) {
            fileResults.innerHTML = '<div class="file-result-item">Loading files...</div>';
          }
        }
        positionFileAutocomplete() {
          const fileAutocomplete = this.stateManager.getDomElement("fileAutocomplete");
          const promptInput = this.stateManager.getDomElement("promptInput");
          if (!fileAutocomplete || !promptInput) return;
          const cursorPosition = promptInput.selectionStart;
          const textBeforeCursor = promptInput.value.substring(0, cursorPosition);
          const lastAtPos = textBeforeCursor.lastIndexOf("@");
          if (lastAtPos !== -1 && lastAtPos === cursorPosition - 1) {
            this.positionAutocompleteAtCharacter(lastAtPos);
          } else {
            this.positionAutocompleteAtButton();
          }
          fileAutocomplete.style.zIndex = "1000";
          fileAutocomplete.style.display = "block";
        }
        positionAutocompleteAtCharacter(atPosition) {
          const fileAutocomplete = this.stateManager.getDomElement("fileAutocomplete");
          const commandInputRect = document.querySelector(".command-input-wrapper").getBoundingClientRect();
          fileAutocomplete.style.position = "fixed";
          fileAutocomplete.style.top = commandInputRect.top - 180 + "px";
          fileAutocomplete.style.left = commandInputRect.left + "px";
          fileAutocomplete.style.width = commandInputRect.width + "px";
          fileAutocomplete.style.maxHeight = "180px";
          fileAutocomplete.style.overflowY = "auto";
          fileAutocomplete.style.zIndex = "1000";
        }
        positionAutocompleteAtButton() {
          const fileAutocomplete = this.stateManager.getDomElement("fileAutocomplete");
          const fileAttachBtn = this.stateManager.getDomElement("fileAttachBtn");
          if (!fileAttachBtn) return;
          const fileAttachBtnRect = fileAttachBtn.getBoundingClientRect();
          fileAutocomplete.style.position = "fixed";
          fileAutocomplete.style.top = fileAttachBtnRect.bottom - 180 + "px";
          fileAutocomplete.style.left = fileAttachBtnRect.left + "px";
          fileAutocomplete.style.width = "300px";
          fileAutocomplete.style.maxHeight = "180px";
          fileAutocomplete.style.overflowY = "auto";
          fileAutocomplete.style.zIndex = "1000";
        }
        requestProjectFiles() {
          const vscode = this.stateManager.getVSCode();
          vscode.postMessage({
            type: "getProjectFiles"
          });
        }
        requestFileSearch(query) {
          const vscode = this.stateManager.getVSCode();
          vscode.postMessage({
            type: "searchFiles",
            query
          });
        }
        logAutocompleteState(fileAutocomplete) {
          console.log("File autocomplete opened and positioned");
          console.log("Autocomplete element exists:", !!fileAutocomplete);
          console.log("Autocomplete parent element:", fileAutocomplete.parentElement);
          console.log("Autocomplete computed styles:", {
            display: getComputedStyle(fileAutocomplete).display,
            position: getComputedStyle(fileAutocomplete).position,
            bottom: getComputedStyle(fileAutocomplete).bottom,
            zIndex: getComputedStyle(fileAutocomplete).zIndex,
            width: getComputedStyle(fileAutocomplete).width,
            height: getComputedStyle(fileAutocomplete).height
          });
        }
      };
      file_autocomplete_manager_default = new FileAutocompleteManager();
    }
  });

  // media/modules/message-manager.js
  var MessageManager, message_manager_default;
  var init_message_manager = __esm({
    "media/modules/message-manager.js"() {
      init_state_manager();
      MessageManager = class {
        constructor() {
          this.stateManager = state_manager_default;
        }
        addUserMessage(content, provider = null) {
          this.addMessageToConversation("user", content, provider);
        }
        addAIMessage(content, provider = null, model = null) {
          this.addMessageToConversation("ai", content, provider, model);
        }
        addMessageToConversation(type, content, provider = null, model = null) {
          const conversationContent = this.stateManager.getDomElement("conversationContent");
          if (!conversationContent) return;
          const messageDiv = document.createElement("div");
          messageDiv.className = `message ${type}`;
          const messageId = Date.now();
          const timestamp = (/* @__PURE__ */ new Date()).toLocaleTimeString();
          const formattedContent = type === "ai" ? this.markdownToHtml(content) : this.escapeHtml(content);
          let messageHTML = `
            <div class="message-header">
                <div class="message-avatar">${type === "user" ? "U" : this.getProviderIcon(provider)}</div>
                <div class="message-content">
                    ${type === "ai" && (model || provider) ? `<div class="model-name">${model || this.getModelDisplayName(provider)}</div>` : ""}
                    <div class="message-text">${formattedContent}</div>
                </div>
            </div>
            <div class="message-meta">
                <span class="timestamp">${timestamp}</span>
                ${type === "ai" && (model || provider) ? `<span class="model-display">${model || this.getModelDisplayName(provider)}</span>` : ""}
            </div>
        `;
          messageDiv.innerHTML = messageHTML;
          conversationContent.appendChild(messageDiv);
          this.stateManager.addConversationMessage({
            id: messageId,
            type,
            content,
            provider,
            model,
            timestamp
          });
          this.scrollToBottom();
        }
        showThinkingAnimation(provider) {
          this.stopThinkingAnimation();
          const conversationContent = this.stateManager.getDomElement("conversationContent");
          if (!conversationContent) return;
          const thinkingMessageElement = document.createElement("div");
          thinkingMessageElement.className = "message ai thinking";
          thinkingMessageElement.id = "thinking-message";
          const timestamp = (/* @__PURE__ */ new Date()).toLocaleTimeString();
          thinkingMessageElement.innerHTML = `
            <div class="message-content">
                <span class="thinking-text">Thinking</span>
                <span class="thinking-dots">.</span>
            </div>
            <div class="message-meta">
                <span>${timestamp}</span>
                <span>Thinking...</span>
            </div>
        `;
          conversationContent.appendChild(thinkingMessageElement);
          this.scrollToBottom();
          this.stateManager.setState("thinkingMessageElement", thinkingMessageElement);
          this.startThinkingAnimation();
        }
        startThinkingAnimation() {
          const thinkingMessageElement = this.stateManager.getState("thinkingMessageElement");
          if (!thinkingMessageElement) return;
          const dotsElement = thinkingMessageElement.querySelector(".thinking-dots");
          if (!dotsElement) return;
          let dotCount = 0;
          const interval = setInterval(() => {
            dotCount = (dotCount + 1) % 4;
            dotsElement.textContent = ".".repeat(dotCount);
          }, 500);
          this.stateManager.setState("thinkingAnimationInterval", interval);
        }
        stopThinkingAnimation() {
          this.stateManager.clearThinkingAnimation();
        }
        startStreamingResponse() {
          this.stopThinkingAnimation();
          const conversationContent = this.stateManager.getDomElement("conversationContent");
          if (!conversationContent) return;
          const streamingMessageElement = document.createElement("div");
          streamingMessageElement.className = "message ai streaming";
          streamingMessageElement.id = "streaming-message";
          const timestamp = (/* @__PURE__ */ new Date()).toLocaleTimeString();
          streamingMessageElement.innerHTML = `
            <div class="message-header">
                <div class="message-avatar">${this.getProviderIcon()}</div>
                <div class="message-content">
                    <div class="model-name">AI Assistant</div>
                    <div class="message-text">
                        <span class="streaming-text"></span>
                        <span class="streaming-cursor">\u258C</span>
                    </div>
                </div>
            </div>
            <div class="message-meta">
                <span>${timestamp}</span>
            </div>
        `;
          conversationContent.appendChild(streamingMessageElement);
          this.scrollToBottom();
          this.stateManager.setState("streamingMessageElement", streamingMessageElement);
          this.stateManager.setState("isStreaming", true);
        }
        updateStreamingResponse(content, provider) {
          const streamingMessageElement = this.stateManager.getState("streamingMessageElement");
          const isStreaming = this.stateManager.getState("isStreaming");
          if (!streamingMessageElement || !isStreaming) {
            return;
          }
          const contentElement = streamingMessageElement.querySelector(".streaming-text");
          const modelNameElement = streamingMessageElement.querySelector(".model-name");
          if (contentElement) {
            const formattedContent = this.progressiveMarkdownToHtml(content);
            contentElement.innerHTML = formattedContent;
          }
          if (modelNameElement && provider) {
            modelNameElement.textContent = this.getModelDisplayName(provider);
          }
          this.scrollToBottom();
        }
        stopStreamingResponse() {
          const streamingMessageElement = this.stateManager.getState("streamingMessageElement");
          if (streamingMessageElement) {
            const cursorElement = streamingMessageElement.querySelector(".streaming-cursor");
            if (cursorElement) {
              cursorElement.remove();
            }
          }
          this.stateManager.clearStreamingState();
        }
        scrollToBottom() {
          const conversationContainer = this.stateManager.getDomElement("conversationContainer");
          if (conversationContainer) {
            conversationContainer.scrollTop = conversationContainer.scrollHeight;
          }
        }
        // Session management
        createSessionTab(session) {
          const sessionTabs = this.stateManager.getDomElement("sessionTabs");
          if (!sessionTabs) return;
          const tabElement = document.createElement("div");
          tabElement.className = "session-tab";
          tabElement.dataset.sessionId = session.id;
          const nameSpan = document.createElement("span");
          nameSpan.textContent = session.name;
          const closeBtn = document.createElement("button");
          closeBtn.className = "session-tab-close";
          closeBtn.innerHTML = '<svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><path d="M1 1L11 11M11 1L1 11" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
          closeBtn.title = "Close session";
          closeBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            this.closeSession(session.id);
          });
          tabElement.appendChild(nameSpan);
          tabElement.appendChild(closeBtn);
          tabElement.addEventListener("click", () => {
            this.switchToSession(session.id);
          });
          sessionTabs.appendChild(tabElement);
          const sessions = this.stateManager.getState("sessions");
          if (sessions && sessions.length === 1) {
            tabElement.classList.add("active");
          }
        }
        switchToSession(sessionId) {
          document.querySelectorAll(".session-tab").forEach((tab) => {
            tab.classList.remove("active");
          });
          const activeTab = document.querySelector(`[data-session-id="${sessionId}"]`);
          if (activeTab) {
            activeTab.classList.add("active");
          }
          this.stateManager.switchToSession(sessionId);
          const conversationContent = this.stateManager.getDomElement("conversationContent");
          if (conversationContent) {
            conversationContent.innerHTML = "";
          }
          const sessions = this.stateManager.getState("sessions");
          const session = sessions.find((s) => s.id === sessionId);
          if (session && session.conversation.length > 0) {
            session.conversation.forEach((msg) => {
              this.addMessageToConversation(msg.type, msg.content, msg.provider);
            });
          }
        }
        closeSession(sessionId) {
          const sessions = this.stateManager.getState("sessions");
          if (sessions.length <= 1) {
            this.sendMessageToExtension({
              type: "showInformationMessage",
              message: "Cannot close the last session"
            });
            return;
          }
          this.stateManager.closeSession(sessionId);
          const tab = document.querySelector(`[data-session-id="${sessionId}"]`);
          if (tab) {
            tab.remove();
          }
        }
        // Utility methods
        escapeHtml(text) {
          const div = document.createElement("div");
          div.textContent = text;
          return div.innerHTML;
        }
        markdownToHtml(markdown) {
          if (!markdown) return "";
          let html = markdown.replace(/^### (.*$)/gm, "<h3>$1</h3>").replace(/^## (.*$)/gm, "<h2>$1</h2>").replace(/^# (.*$)/gm, "<h1>$1</h1>").replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/\*(.*?)\*/g, "<em>$1</em>").replace(/```(\w+)?(?:\s+([^\n`]+))?\n([\s\S]*?)```/g, (match, language, filename, code) => {
            const lang = language || "text";
            const raw = code.trim();
            const highlighted = this.highlightCode(lang, raw);
            const file = filename ? filename.trim() : "";
            const isDiff = lang === "diff" || /(^|\n)[+-]/.test(code);
            const added = (code.match(/^\+.+$/gm) || []).length;
            const deleted = (code.match(/^-.+$/gm) || []).length;
            const fileIcon = this.getFileIconSvg(file || lang);
            return `
                    <div class="code-block">
                        <div class="code-header">
                            <div class="code-title">
                                <span class="code-file-icon">${fileIcon}</span>
                                <span class="code-filename">${this.escapeHtml(file) || lang}</span>
                                <span class="code-badges">${isDiff ? `<span class="badge-add">+${added}</span><span class="badge-del">-${deleted}</span>` : ""}</span>
                            </div>
                            <div class="code-actions">
                                <button class="icon-btn" onclick="copyCodeToClipboard(this)" title="Copy code">
                                    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><path d="M10 1H4C3.4 1 3 1.4 3 2v8c0 .6.4 1 1 1h6c.6 0 1-.4 1-1V2c0-.6-.4-1-1-1zM4 2h6v8H4V2z"/><path d="M11 4H5c-.6 0-1 .4-1 1v8c0 .6.4 1 1 1h6c.6 0 1-.4 1-1V5c0-.6-.4-1-1-1z"/></svg>
                                </button>
                                ${isDiff ? `
                                <button class="icon-btn" onclick="postCodeAction(this, 'accept', '${this.escapeHtml(file)}')" title="Accept changes">
                                    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M6 10.2L3.8 8l-1 1L6 12l7-7-1-1z"/></svg>
                                </button>
                                <button class="icon-btn" onclick="postCodeAction(this, 'reject', '${this.escapeHtml(file)}')" title="Reject changes">
                                    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M3 4l9 9m0-9L3 13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
                                </button>` : ""}
                            </div>
                        </div>
                        <pre><code class="language-${lang}">${highlighted}</code></pre>
                    </div>
                `;
          }).replace(/`(.*?)`/g, '<code class="inline-code">$1</code>').replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank">$1</a>').replace(/\n/g, "<br>");
          return html;
        }
        progressiveMarkdownToHtml(markdown) {
          if (!markdown) return "";
          let html = markdown.replace(/^### (.+)$/gm, (match, content) => {
            return content.endsWith(" ") ? match : `<h3>${content}</h3>`;
          }).replace(/^## (.+)$/gm, (match, content) => {
            return content.endsWith(" ") ? match : `<h2>${content}</h2>`;
          }).replace(/^# (.+)$/gm, (match, content) => {
            return content.endsWith(" ") ? match : `<h1>${content}</h1>`;
          }).replace(/\*\*([^*]*?)\*\*/g, "<strong>$1</strong>").replace(/\*([^*]*?)\*/g, "<em>$1</em>").replace(/```(\w+)?(?:\s+([^\n`]+))?\n([\s\S]*?)```/g, (match, language, filename, code) => {
            if (code.includes("\n```") || !code.includes("```")) {
              const lang = language || "text";
              const raw = code.trim();
              const highlighted = this.highlightCode(lang, raw);
              const file = filename ? filename.trim() : "";
              const isDiff = lang === "diff" || /(^|\n)[+-]/.test(code);
              const added = (code.match(/^\+.+$/gm) || []).length;
              const deleted = (code.match(/^-.+$/gm) || []).length;
              const fileIcon = this.getFileIconSvg(file || lang);
              return `
                        <div class="code-block">
                            <div class="code-header">
                                <div class="code-title">
                                    <span class="code-file-icon">${fileIcon}</span>
                                    <span class="code-filename">${this.escapeHtml(file) || lang}</span>
                                    <span class="code-badges">${isDiff ? `<span class="badge-add">+${added}</span><span class="badge-del">-${deleted}</span>` : ""}</span>
                                </div>
                                <div class="code-actions">
                                    <button class="icon-btn" onclick="copyCodeToClipboard(this)" title="Copy code">
                                        <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><path d="M10 1H4C3.4 1 3 1.4 3 2v8c0 .6.4 1 1 1h6c.6 0 1-.4 1-1V2c0-.6-.4-1-1-1zM4 2h6v8H4V2z"/><path d="M11 4H5c-.6 0-1 .4-1 1v8c0 .6.4 1 1 1h6c.6 0 1-.4 1-1V5c0-.6-.4-1-1-1z"/></svg>
                                    </button>
                                    ${isDiff ? `
                                    <button class="icon-btn" onclick="postCodeAction(this, 'accept', '${this.escapeHtml(file)}')" title="Accept changes">
                                        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M6 10.2L3.8 8l-1 1L6 12l7-7-1-1z"/></svg>
                                    </button>
                                    <button class="icon-btn" onclick="postCodeAction(this, 'reject', '${this.escapeHtml(file)}')" title="Reject changes">
                                        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M3 4l9 9m0-9L3 13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
                                    </button>` : ""}
                                </div>
                            </div>
                            <pre><code class="language-${lang}">${highlighted}</code></pre>
                        </div>
                    `;
            }
            return match;
          }).replace(/`([^`]*?)`/g, '<code class="inline-code">$1</code>').replace(/\[(.*?)\]\((.*?)\)/g, (match, text, url) => {
            return url.endsWith(" ") ? match : `<a href="${url}" target="_blank">${text}</a>`;
          }).replace(/\n/g, "<br>");
          return html;
        }
        highlightCode(lang, code) {
          let html = this.escapeHtml(code);
          const stringPattern = /"([^"\\]|\\.)*"|'([^'\\]|\\.)*'|`([^`\\]|\\.)*`/g;
          const numberPattern = /\b\d+(?:\.\d+)?\b/g;
          const booleanPattern = /\b(true|false|null|undefined)\b/g;
          const lineCommentPattern = /(^|\n)\s*(\/\/.*?)(?=\n|$)/g;
          const blockCommentPattern = /\/\*[\s\S]*?\*\//g;
          const functionPattern = /\b([a-zA-Z_][\w]*)\s*(?=\()/g;
          const jsKeywords = [
            "await",
            "break",
            "case",
            "catch",
            "class",
            "const",
            "continue",
            "debugger",
            "default",
            "delete",
            "do",
            "else",
            "enum",
            "export",
            "extends",
            "finally",
            "for",
            "function",
            "if",
            "import",
            "in",
            "instanceof",
            "let",
            "new",
            "return",
            "super",
            "switch",
            "this",
            "throw",
            "try",
            "typeof",
            "var",
            "void",
            "while",
            "with",
            "yield"
          ];
          const keywordPattern = new RegExp("\\b(" + jsKeywords.join("|") + ")\\b", "g");
          if (lang === "json") {
            html = html.replace(/\"([^\"\\]|\\.)*\"(?=\s*:)/g, (m) => `<span class="token property">${m}</span>`);
            html = html.replace(stringPattern, (m) => `<span class="token string">${m}</span>`);
            html = html.replace(numberPattern, (m) => `<span class="token number">${m}</span>`);
            html = html.replace(/\b(true|false|null)\b/g, (m) => `<span class="token boolean">${m}</span>`);
            return html;
          }
          html = html.replace(blockCommentPattern, (m) => `<span class="token comment">${m}</span>`);
          html = html.replace(lineCommentPattern, (m, p1, p2) => `${p1}<span class="token comment">${p2}</span>`);
          html = html.replace(stringPattern, (m) => `<span class="token string">${m}</span>`);
          html = html.replace(numberPattern, (m) => `<span class="token number">${m}</span>`);
          if (lang === "js" || lang === "ts" || lang === "javascript" || lang === "typescript") {
            html = html.replace(keywordPattern, (m) => `<span class="token keyword">${m}</span>`);
            html = html.replace(functionPattern, (m) => `<span class="token function">${m}</span>`);
          } else if (lang === "py" || lang === "python") {
            const pyKeywords = ["def", "class", "return", "if", "elif", "else", "for", "while", "try", "except", "finally", "with", "as", "lambda", "yield", "import", "from", "pass", "break", "continue", "True", "False", "None"];
            const pyPattern = new RegExp("\\b(" + pyKeywords.join("|") + ")\\b", "g");
            html = html.replace(pyPattern, (m) => `<span class="token keyword">${m}</span>`);
            html = html.replace(functionPattern, (m) => `<span class="token function">${m}</span>`);
          }
          html = html.replace(booleanPattern, (m) => `<span class="token boolean">${m}</span>`);
          return html;
        }
        getFileIconSvg(name) {
          const lower = (name || "").toLowerCase();
          const svg = (path) => `<svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">${path}</svg>`;
          if (lower.endsWith(".ts") || lower.endsWith(".tsx")) return svg('<path d="M2 2h7l3 3v9c0 .6-.4 1-1 1H2c-.6 0-1-.4-1-1V3c0-.6.4-1 1-1z"/><text x="5" y="12" font-size="6" fill="currentColor">TS</text>');
          if (lower.endsWith(".js") || lower.endsWith(".jsx")) return svg('<path d="M2 2h7l3 3v9c0 .6-.4 1-1 1H2c-.6 0-1-.4-1-1V3c0-.6.4-1 1-1z"/><text x="5" y="12" font-size="6" fill="currentColor">JS</text>');
          if (lower.endsWith(".json")) return svg('<path d="M2 2h7l3 3v9c0 .6-.4 1-1 1H2c-.6 0-1-.4-1-1V3c0-.6.4-1 1-1z"/><text x="3" y="12" font-size="6" fill="currentColor">JSON</text>');
          if (lower.endsWith(".md")) return svg('<path d="M2 2h7l3 3v9c0 .6-.4 1-1 1H2c-.6 0-1-.4-1-1V3c0-.6.4-1 1-1z"/><text x="4" y="12" font-size="6" fill="currentColor">MD</text>');
          if (lower.endsWith(".py")) return svg('<path d="M2 2h7l3 3v9c0 .6-.4 1-1 1H2c-.6 0-1-.4-1-1V3c0-.6.4-1 1-1z"/><text x="5" y="12" font-size="6" fill="currentColor">PY</text>');
          return svg('<path d="M2 2h7l3 3v9c0 .6-.4 1-1 1H2c-.6 0-1-.4-1-1V3c0-.6.4-1 1-1z"/>');
        }
        getProviderIcon(provider) {
          return this.getProviderLogo(provider);
        }
        getProviderLogo(provider) {
          const logoMap = {
            "openai": "openai-logo.png",
            "anthropic": "anthropic-logo.png",
            "deepseek": "deepseek-logo.png",
            "moonshot": "moonshot-logo.png",
            "ollama": "ollama-logo.png"
          };
          logoMap[provider?.toLowerCase()] || "openai-logo.png";
          const logoKey = provider?.toLowerCase() || "openai";
          const logoUri = window.logoUris?.[logoKey];
          if (logoUri) {
            return `<img src="${logoUri}" alt="${provider || "AI"}" class="provider-logo">`;
          } else {
            console.warn(`[MessageManager] Logo URI not found for ${provider}, using fallback`);
            return `<span class="provider-logo-fallback">${provider?.charAt(0)?.toUpperCase() || "AI"}</span>`;
          }
        }
        getVSCodeResourceUri(path) {
          const vscode = this.stateManager.getVSCode();
          if (vscode && vscode.workspace) {
            vscode.workspace.getConfiguration("aiAnalytics");
            return `./media/logos/${path.split("/").pop()}`;
          }
          return `./media/logos/${path.split("/").pop()}`;
        }
        getModelDisplayName(provider) {
          const modelMap = {
            "openai": "GPT-4o",
            "anthropic": "Claude 3.5",
            "deepseek": "DeepSeek R1",
            "moonshot": "Moonshot",
            "ollama": "Ollama"
          };
          return modelMap[provider?.toLowerCase()] || provider || "AI";
        }
        sendMessageToExtension(message) {
          const vscode = this.stateManager.getVSCode();
          vscode.postMessage(message);
        }
      };
      message_manager_default = new MessageManager();
    }
  });

  // media/modules/model-manager.js
  var ModelManager, model_manager_default;
  var init_model_manager = __esm({
    "media/modules/model-manager.js"() {
      ModelManager = class {
        constructor() {
          this.models = null;
          this.loaded = false;
        }
        async loadModels() {
          if (this.loaded) {
            return this.models;
          }
          try {
            this.models = await this.getDefaultModels();
            this.loaded = true;
            return this.models;
          } catch (error) {
            console.error("Error loading models:", error);
            this.models = await this.getDefaultModels();
            this.loaded = true;
            return this.models;
          }
        }
        async getDefaultModels() {
          return {
            providers: {
              openai: {
                name: "OpenAI",
                models: [
                  { value: "gpt-4o", label: "GPT-4o", description: "Latest multimodal model with vision capabilities" },
                  { value: "gpt-4o-mini", label: "GPT-4o Mini", description: "Efficient and cost-effective GPT-4o variant" },
                  { value: "gpt-4-turbo", label: "GPT-4 Turbo", description: "Enhanced GPT-4 with improved performance" },
                  { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo", description: "Fast and cost-effective model for simple tasks" },
                  { value: "o1-preview", label: "o1 Preview", description: "Experimental reasoning model with enhanced capabilities" },
                  { value: "o1-mini", label: "o1 Mini", description: "Efficient reasoning model for everyday tasks" }
                ]
              },
              anthropic: {
                name: "Anthropic",
                models: [
                  { value: "claude-3-5-sonnet-20241022", label: "Claude 3.5 Sonnet", description: "Latest Claude model with enhanced reasoning" },
                  { value: "claude-3-5-haiku-20241022", label: "Claude 3.5 Haiku", description: "Fast and efficient Claude model" },
                  { value: "claude-3-opus-20240229", label: "Claude 3 Opus", description: "Most capable Claude model for complex reasoning" },
                  { value: "claude-3-sonnet-20240229", label: "Claude 3 Sonnet", description: "Balanced Claude model for general tasks" },
                  { value: "claude-3-haiku-20240307", label: "Claude 3 Haiku", description: "Fastest Claude model for simple tasks" }
                ]
              },
              deepseek: {
                name: "DeepSeek",
                models: [
                  { value: "deepseek-chat", label: "DeepSeek Chat", description: "General purpose chat model" },
                  { value: "deepseek-coder", label: "DeepSeek Coder", description: "Specialized for coding tasks" },
                  { value: "deepseek-reasoner", label: "DeepSeek Reasoner", description: "Enhanced reasoning capabilities" }
                ]
              },
              moonshot: {
                name: "Moonshot AI",
                models: [
                  { value: "moonshot-v1-8k", label: "Moonshot v1 8k", description: "Standard Moonshot model with 8k context" },
                  { value: "moonshot-v1-32k", label: "Moonshot v1 32k", description: "Extended context Moonshot model" },
                  { value: "moonshot-v1-128k", label: "Moonshot v1 128k", description: "Large context Moonshot model" },
                  { value: "moonshot-chat", label: "Moonshot Chat", description: "Optimized for conversational tasks" }
                ]
              },
              ollama: {
                name: "Ollama",
                models: []
                // Sera rempli dynamiquement
              }
            },
            defaultModels: {
              openai: "gpt-4o",
              anthropic: "claude-3-5-sonnet-20241022",
              deepseek: "deepseek-chat",
              moonshot: "moonshot-v1-8k",
              ollama: "llama3.1:8b"
            }
          };
        }
        async getProviderModels(provider) {
          await this.loadModels();
          return this.models.providers[provider]?.models || [];
        }
        async getDefaultModel(provider) {
          await this.loadModels();
          return this.models.defaultModels[provider] || "";
        }
        async getAllProviders() {
          await this.loadModels();
          return Object.keys(this.models.providers);
        }
        async updateOllamaModels(ollamaModels) {
          await this.loadModels();
          if (this.models.providers.ollama) {
            this.models.providers.ollama.models = ollamaModels.map((model) => ({
              value: model.name,
              label: model.name,
              description: `Ollama model: ${model.name}`
            }));
          }
        }
        async detectOllamaModels() {
          try {
            const vscode = window.acquireVsCodeApi?.();
            if (vscode) {
              vscode.postMessage({
                type: "detectOllamaModels"
              });
            }
          } catch (error) {
            console.error("Error detecting Ollama models:", error);
          }
        }
        async handleOllamaModelsDetected(models) {
          await this.updateOllamaModels(models);
          const engineSelect = document.getElementById("engine-select");
          if (engineSelect && engineSelect.value === "ollama") {
            const settingsManager = window.settingsManager;
            if (settingsManager) {
              await settingsManager.updateModelSuggestions("ollama");
            }
          }
        }
      };
      model_manager_default = new ModelManager();
    }
  });

  // media/modules/settings-manager.js
  var SettingsManager, settings_manager_default;
  var init_settings_manager = __esm({
    "media/modules/settings-manager.js"() {
      init_state_manager();
      init_model_manager();
      SettingsManager = class {
        constructor() {
          this.stateManager = state_manager_default;
          this.modelManager = model_manager_default;
        }
        loadSettings() {
          this.sendMessageToExtension({
            type: "getSettings"
          });
        }
        saveMoonshotModel(modelName) {
          if (!modelName) return;
          this.sendMessageToExtension({
            type: "updateSettings",
            settings: { moonshotDefaultModel: modelName }
          });
          window.moonshotDefaultModel = modelName;
        }
        async handleEngineChange(engineValue) {
          const row = document.getElementById("model-selection-row");
          const modelSuggestions = document.getElementById("model-suggestions");
          if (row && modelSuggestions) {
            const showModelSelection = ["moonshot", "openai", "anthropic", "deepseek", "ollama"].includes(engineValue);
            row.style.display = showModelSelection ? "flex" : "none";
            if (showModelSelection) {
              await this.updateModelSuggestions(engineValue);
              const savedModel = this.getSavedModel(engineValue);
              if (savedModel) {
                modelSuggestions.value = savedModel;
              }
              if (engineValue === "ollama") {
                await this.modelManager.detectOllamaModels();
              }
            }
          }
        }
        async updateModelSuggestions(provider) {
          const modelSuggestions = document.getElementById("model-suggestions");
          if (!modelSuggestions) return;
          modelSuggestions.innerHTML = '<option value="">Mod\xE8les</option>';
          const suggestions = await this.getProviderModels(provider);
          suggestions.forEach((model) => {
            const option = document.createElement("option");
            option.value = model.value;
            option.textContent = model.label;
            modelSuggestions.appendChild(option);
          });
          modelSuggestions.onchange = () => {
            if (modelSuggestions.value) {
              this.saveModel(provider, modelSuggestions.value);
            }
          };
        }
        async getProviderModels(provider) {
          try {
            return await this.modelManager.getProviderModels(provider);
          } catch (error) {
            console.error("Error getting provider models:", error);
            return [];
          }
        }
        getSavedModel(provider) {
          const settings = this.stateManager.getState("settings") || {};
          const modelKey = `${provider}DefaultModel`;
          return settings[modelKey] || this.getDefaultModel(provider);
        }
        getDefaultModel(provider) {
          const defaults = {
            moonshot: "moonshot-v1-8k",
            openai: "gpt-4o",
            anthropic: "claude-3-5-sonnet-20241022",
            deepseek: "deepseek-chat",
            ollama: "llama3.1:8b"
          };
          return defaults[provider] || "";
        }
        saveModel(provider, modelName) {
          if (!modelName) return;
          const modelKey = `${provider}DefaultModel`;
          this.sendMessageToExtension({
            type: "updateSettings",
            settings: { [modelKey]: modelName }
          });
          window[`${provider}DefaultModel`] = modelName;
        }
        persistMoonshotModelIfNeeded(selectedProvider) {
          if (selectedProvider === "moonshot") {
            const modelSuggestions = document.getElementById("model-suggestions");
            if (modelSuggestions && modelSuggestions.value) {
              this.saveMoonshotModel(modelSuggestions.value);
            }
          }
        }
        updateSettingsUI(settings) {
          console.log("Updating UI with settings:", settings);
          const baseFontFamily = settings.commandBarFontFamily || "var(--vscode-editor-font-family)";
          const chatFontSize = settings.chatFontSize || settings.commandBarFontSize || 13;
          const aiResponseFontSize = settings.aiResponseFontSize || settings.chatFontSize || settings.commandBarFontSize || 13;
          const codeBlockFontSize = settings.codeBlockFontSize || 12;
          const inlineCodeFontSize = settings.inlineCodeFontSize || 12;
          const inputFontSize = settings.inputFontSize || 14;
          const dropdownFontSize = settings.dropdownFontSize || 11;
          const coachFontSize = settings.coachFontSize || settings.commandBarFontSize || 13;
          const metricsFontSize = settings.metricsFontSize || 9;
          const commandBar = document.querySelector(".ai-command-bar");
          if (commandBar) {
            commandBar.style.fontFamily = baseFontFamily;
          }
          const allTextElements = document.querySelectorAll("*");
          allTextElements.forEach((element) => {
            if (getComputedStyle(element).fontFamily !== "monospace") {
              element.style.fontFamily = baseFontFamily;
            }
          });
          const userMessages = document.querySelectorAll(".message.user .message-content");
          const aiMessages = document.querySelectorAll(".message.ai .message-content");
          userMessages.forEach((content) => {
            content.style.fontSize = chatFontSize + "px";
          });
          aiMessages.forEach((content) => {
            content.style.fontSize = aiResponseFontSize + "px";
          });
          const codeBlocks = document.querySelectorAll(".code-block pre, .code-block code");
          codeBlocks.forEach((code) => {
            code.style.fontSize = codeBlockFontSize + "px";
          });
          const inlineCodes = document.querySelectorAll(".inline-code");
          inlineCodes.forEach((code) => {
            code.style.fontSize = inlineCodeFontSize + "px";
          });
          const textarea = document.getElementById("prompt-input");
          if (textarea) {
            textarea.style.fontSize = inputFontSize + "px";
          }
          const dropdowns = document.querySelectorAll(".compact-select");
          dropdowns.forEach((dropdown) => {
            dropdown.style.fontSize = dropdownFontSize + "px";
          });
          const coachingContent = document.querySelector(".coaching-content");
          if (coachingContent) {
            coachingContent.style.fontSize = coachFontSize + "px";
          }
          const metrics = document.querySelectorAll(".metric-value, .metric-label");
          metrics.forEach((metric) => {
            metric.style.fontSize = metricsFontSize + "px";
          });
          const sessionTabs = document.querySelectorAll(".session-tab");
          sessionTabs.forEach((tab) => {
            tab.style.fontSize = dropdownFontSize + "px";
          });
          if (settings.defaultEngine) {
            const engineSelect = document.getElementById("engine-select");
            if (engineSelect) {
              engineSelect.value = settings.defaultEngine;
            }
          }
          window.moonshotDefaultModel = settings.moonshotDefaultModel || "moonshot-v1-8k";
          if (settings.defaultTaskType) {
            const taskSelect = document.getElementById("task-select");
            if (taskSelect) {
              taskSelect.value = settings.defaultTaskType;
            }
          }
          if (settings.defaultMode) {
            const modeSelect = document.getElementById("mode-select");
            if (modeSelect) {
              modeSelect.value = settings.defaultMode;
            }
          }
          if (settings.accentColor) {
            const accentColor = settings.accentColor;
            document.documentElement.style.setProperty("--accent-color", accentColor);
            const hexToRgb = (hex) => {
              const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
              return result ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16)
              } : null;
            };
            const rgb = hexToRgb(accentColor);
            if (rgb) {
              document.documentElement.style.setProperty("--accent-color-rgb", `${rgb.r}, ${rgb.g}, ${rgb.b}`);
            }
            const sendBtn = document.getElementById("send-btn");
            if (sendBtn) {
              sendBtn.style.backgroundColor = accentColor;
            }
            const activeTabs = document.querySelectorAll(".session-tab.active");
            activeTabs.forEach((tab) => {
              tab.style.borderBottomColor = accentColor;
            });
          }
          const metricsSection = document.querySelector(".metrics-section");
          if (metricsSection) {
            metricsSection.style.display = settings.showMetrics ? "flex" : "none";
          }
          const coachSection = document.getElementById("coaching-section");
          if (coachSection) {
            coachSection.style.display = settings.coachEnabled ? "block" : "none";
            if (settings.coachCollapsedByDefault && !coachSection.classList.contains("collapsed")) {
              coachSection.classList.add("collapsed");
            } else if (!settings.coachCollapsedByDefault && coachSection.classList.contains("collapsed")) {
              coachSection.classList.remove("collapsed");
            }
          }
          const sessionTabsContainer = document.querySelector(".session-tabs-container");
          if (sessionTabsContainer) {
            sessionTabsContainer.style.display = settings.sessionTabsEnabled ? "flex" : "none";
          }
          const textareaWrapper = document.querySelector(".text-input-wrapper");
          if (textareaWrapper && settings.autoExpandTextarea === false) {
            const textarea2 = document.getElementById("prompt-input");
            if (textarea2) {
              textarea2.style.resize = "none";
              textarea2.style.overflow = "hidden";
            }
          }
          window.aiCommandBarSettings = settings;
          this.stateManager.updateSettings(settings);
        }
        formatCoachingAdvice(advice) {
          if (!advice) return "";
          let formatted = advice.replace(/\s*[•⚡🔄📊💡]\s*/g, "\n\u2022 ").replace(/\s+/g, " ").replace(/([^\n])([⚡🔄📊💡])/g, "$1\n$2").replace(/\n\s*\n/g, "\n");
          return this.escapeHtml(formatted).replace(/\n/g, "<br>");
        }
        escapeHtml(text) {
          const div = document.createElement("div");
          div.textContent = text;
          return div.innerHTML;
        }
        sendMessageToExtension(message) {
          const vscode = this.stateManager.getVSCode();
          vscode.postMessage(message);
        }
      };
      settings_manager_default = new SettingsManager();
    }
  });

  // media/modules/event-manager.js
  var EventManager, event_manager_default;
  var init_event_manager = __esm({
    "media/modules/event-manager.js"() {
      init_state_manager();
      init_file_autocomplete_manager();
      init_message_manager();
      init_settings_manager();
      EventManager = class {
        constructor() {
          this.stateManager = state_manager_default;
          this.fileAutocompleteManager = file_autocomplete_manager_default;
          this.messageManager = message_manager_default;
          this.settingsManager = settings_manager_default;
        }
        initializeEventListeners() {
          this.initializeSendButton();
          this.initializeInputEvents();
          this.initializeFileAutocompleteEvents();
          this.initializeSettingsEvents();
          this.initializeSessionEvents();
          this.initializeGlobalEvents();
          this.initializeModelSelectionEvents();
        }
        initializeSendButton() {
          const sendBtn = this.stateManager.getDomElement("sendBtn");
          if (sendBtn) {
            sendBtn.addEventListener("click", () => this.handleSendMessage());
          }
        }
        initializeInputEvents() {
          const promptInput = this.stateManager.getDomElement("promptInput");
          console.log("Initializing input events, promptInput found:", !!promptInput);
          if (!promptInput) {
            console.error("promptInput element not found!");
            return;
          }
          promptInput.addEventListener("keydown", (e) => {
            console.log("Keydown event:", e.key, "shiftKey:", e.shiftKey);
            if (e.key === "Enter" && !e.shiftKey) {
              console.log("Enter key detected (without Shift), sending message...");
              e.preventDefault();
              this.handleSendMessage();
            } else if (e.key === "Enter" && e.shiftKey) {
              console.log("Shift+Enter detected, allowing new line...");
            }
          });
          promptInput.addEventListener("input", (e) => {
            this.handleInputDetection(e);
          });
        }
        initializeFileAutocompleteEvents() {
          const fileAttachBtn = this.stateManager.getDomElement("fileAttachBtn");
          const fileSearch = this.stateManager.getDomElement("fileSearch");
          if (fileAttachBtn) {
            fileAttachBtn.addEventListener("click", () => {
              this.fileAutocompleteManager.toggleFileAutocomplete();
            });
          }
          if (fileSearch) {
            fileSearch.addEventListener("input", (e) => {
              this.fileAutocompleteManager.handleFileSearch(e.target.value);
            });
            fileSearch.addEventListener("keydown", (e) => {
              if (e.key === "Escape") {
                e.preventDefault();
                this.fileAutocompleteManager.closeFileAutocomplete();
              }
            });
          }
          const imageAttachBtn = this.stateManager.getDomElement("imageAttachBtn");
          if (imageAttachBtn) {
            imageAttachBtn.addEventListener("click", this.handleImageAttach.bind(this));
          }
        }
        initializeSettingsEvents() {
          const engineSelect = document.getElementById("engine-select");
          if (engineSelect) {
            engineSelect.addEventListener("change", async () => {
              await this.settingsManager.handleEngineChange(engineSelect.value);
            });
          }
          const coachCollapseBtn = this.stateManager.getDomElement("coachCollapseBtn");
          if (coachCollapseBtn) {
            coachCollapseBtn.addEventListener("click", () => {
              this.toggleCoachCollapse();
            });
          }
          const settingsBtn = document.getElementById("settings-btn");
          if (settingsBtn) {
            settingsBtn.addEventListener("click", () => {
              this.sendMessageToExtension({
                type: "openSettings"
              });
            });
          }
        }
        initializeSessionEvents() {
          const newSessionBtn = this.stateManager.getDomElement("newSessionBtn");
          if (newSessionBtn) {
            newSessionBtn.addEventListener("click", () => {
              this.handleNewSession();
            });
          }
        }
        initializeGlobalEvents() {
          document.addEventListener("keydown", (e) => {
            if (e.key === "Escape" && this.stateManager.isFileAutocompleteOpen()) {
              e.preventDefault();
              this.fileAutocompleteManager.closeFileAutocomplete();
            }
          });
          document.addEventListener("click", (e) => {
            const fileAutocomplete = this.stateManager.getDomElement("fileAutocomplete");
            const fileAttachBtn = this.stateManager.getDomElement("fileAttachBtn");
            const promptInput = this.stateManager.getDomElement("promptInput");
            if (fileAutocomplete && !fileAutocomplete.contains(e.target) && e.target !== fileAttachBtn && e.target !== promptInput) {
              this.fileAutocompleteManager.closeFileAutocomplete();
            }
          });
        }
        // Event handlers
        handleSendMessage() {
          const promptInput = this.stateManager.getDomElement("promptInput");
          const prompt = promptInput.value.trim();
          if (!prompt) return;
          document.getElementById("task-select").value;
          const routingMode = document.getElementById("mode-select").value;
          const selectedProvider = this.getSelectedProvider();
          this.settingsManager.persistMoonshotModelIfNeeded(selectedProvider);
          this.messageManager.addUserMessage(prompt, selectedProvider);
          promptInput.value = "";
          promptInput.style.height = "40px";
          this.messageManager.showThinkingAnimation(selectedProvider);
          const conversationContext = this.stateManager.getConversationContext();
          this.sendMessageToExtension({
            type: "executePrompt",
            prompt,
            routingMode,
            provider: selectedProvider,
            conversationContext
          });
          const coachingSection = this.stateManager.getDomElement("coachingSection");
          if (coachingSection) {
            coachingSection.classList.add("collapsed");
          }
        }
        handleInputDetection(e) {
          const value = e.target.value;
          const lastChar = value.slice(-1);
          console.log("Input detected, last char:", lastChar, "autocomplete open:", this.stateManager.isFileAutocompleteOpen());
          if (lastChar === "@" && !this.stateManager.isFileAutocompleteOpen()) {
            console.log("@ character detected, opening file autocomplete");
            this.fileAutocompleteManager.openFileAutocomplete();
          } else if (lastChar !== "@" && this.stateManager.isFileAutocompleteOpen()) {
            console.log("Non-@ character detected, closing file autocomplete");
            this.fileAutocompleteManager.closeFileAutocomplete();
          }
        }
        handleImageAttach() {
          this.sendMessageToExtension({
            type: "showInformationMessage",
            message: "Image attachment feature coming soon!"
          });
        }
        handleNewSession() {
          const session = this.stateManager.createSession();
          this.messageManager.createSessionTab(session);
          this.messageManager.switchToSession(session.id);
        }
        // Utility methods
        getSelectedProvider() {
          const engineSelect = document.getElementById("engine-select");
          return engineSelect ? engineSelect.value : "deepseek";
        }
        toggleCoachCollapse() {
          const coachingSection = this.stateManager.getDomElement("coachingSection");
          if (coachingSection) {
            coachingSection.classList.toggle("collapsed");
          }
        }
        sendMessageToExtension(message) {
          const vscode = this.stateManager.getVSCode();
          vscode.postMessage(message);
        }
        initializeModelSelectionEvents() {
          const selectModelBtn = document.getElementById("select-model-btn");
          if (selectModelBtn) {
            selectModelBtn.addEventListener("click", () => {
              this.sendMessageToExtension({
                type: "selectModel"
              });
            });
          }
        }
      };
      event_manager_default = new EventManager();
    }
  });

  // media/main.js
  var require_main = __commonJS({
    "media/main.js"() {
      init_state_manager();
      init_event_manager();
      init_message_manager();
      init_settings_manager();
      init_file_autocomplete_manager();
      (function() {
        const stateManager = state_manager_default;
        const eventManager = event_manager_default;
        const messageManager = message_manager_default;
        const settingsManager = settings_manager_default;
        const fileAutocompleteManager = file_autocomplete_manager_default;
        document.addEventListener("DOMContentLoaded", () => {
          initializeDOMElements();
          initializeEventListeners();
          initializeAutoExpandTextarea();
          initializeApplication();
        });
        function initializeDOMElements() {
          console.log("Initializing DOM elements...");
          const elements = {
            promptInput: document.getElementById("prompt-input"),
            sendBtn: document.getElementById("send-btn"),
            fileAttachBtn: document.getElementById("file-attach-btn"),
            imageAttachBtn: document.getElementById("image-attach-btn"),
            fileAutocomplete: document.getElementById("file-autocomplete"),
            fileSearch: document.getElementById("file-search"),
            fileResults: document.getElementById("file-results"),
            conversationContent: document.getElementById("conversation-content"),
            conversationContainer: document.getElementById("conversation-container"),
            coachingSection: document.getElementById("coaching-section"),
            coachingContent: document.getElementById("coaching-content"),
            coachCollapseBtn: document.getElementById("coach-collapse-btn"),
            sessionTabs: document.getElementById("session-tabs"),
            newSessionBtn: document.getElementById("new-session-btn")
          };
          Object.entries(elements).forEach(([name, element]) => {
            stateManager.setDomElement(name, element);
          });
          console.log("DOM elements initialized:");
          console.log("- promptInput:", elements.promptInput);
          console.log("- sendBtn:", elements.sendBtn);
          console.log("- fileAutocomplete:", elements.fileAutocomplete);
          console.log("- fileSearch:", elements.fileSearch);
          console.log("- fileResults:", elements.fileResults);
          console.log("- fileAttachBtn:", elements.fileAttachBtn);
        }
        function initializeEventListeners() {
          eventManager.initializeEventListeners();
        }
        function initializeAutoExpandTextarea() {
          const promptInput = stateManager.getDomElement("promptInput");
          if (!promptInput) return;
          promptInput.addEventListener("input", function() {
            this.style.height = "auto";
            this.style.height = Math.min(this.scrollHeight, 200) + "px";
          });
          promptInput.style.height = "40px";
        }
        function initializeApplication() {
          settingsManager.loadSettings();
          loadMetricsFromStorage();
          createInitialSession();
        }
        function createInitialSession() {
          const sessions = stateManager.getState("sessions");
          if (!sessions || sessions.length === 0) {
            const session = stateManager.createSession();
            messageManager.createSessionTab(session);
            messageManager.switchToSession(session.id);
          }
        }
        function loadMetricsFromStorage() {
          const vscode = stateManager.getVSCode();
          vscode.postMessage({
            type: "loadMetrics"
          });
        }
        window.copyCodeToClipboard = function(button) {
          const codeBlock = button.closest(".code-block");
          const codeElement = codeBlock.querySelector("code");
          const codeText = codeElement.textContent;
          navigator.clipboard.writeText(codeText).then(() => {
            const originalTitle = button.title;
            button.title = "Copied!";
            button.style.color = "#4CAF50";
            setTimeout(() => {
              button.title = originalTitle;
              button.style.color = "";
            }, 2e3);
          }).catch((err) => {
            console.error("Failed to copy code:", err);
          });
        };
        window.postCodeAction = function(button, action, file) {
          const codeBlock = button.closest(".code-block");
          const codeElement = codeBlock.querySelector("code");
          codeBlock.querySelector(".code-filename");
          const languageClass = codeElement && codeElement.className || "";
          const languageMatch = languageClass.match(/language-([\w-]+)/);
          const language = languageMatch ? languageMatch[1] : "text";
          const contentText = codeElement ? codeElement.textContent : "";
          const isDiff = language === "diff" || /^\s*[+-]/m.test(contentText);
          const vscode = stateManager.getVSCode();
          vscode.postMessage({
            type: "codeAction",
            action,
            file,
            content: contentText,
            language,
            isDiff
          });
        };
        window.addEventListener("message", (event) => {
          const message = event.data;
          switch (message.type) {
            case "executionStarted":
              const sendBtn = stateManager.getDomElement("sendBtn");
              if (sendBtn) {
                sendBtn.disabled = true;
              }
              break;
            case "streamingStarted":
              messageManager.stopThinkingAnimation();
              messageManager.startStreamingResponse();
              break;
            case "streamingChunk":
              messageManager.updateStreamingResponse(message.content, message.provider);
              break;
            case "executionCompleted":
              messageManager.stopStreamingResponse();
              const modelName = message.model || message.provider;
              messageManager.addAIMessage(message.response, message.provider, modelName);
              updateMetrics({
                cost: message.cost,
                tokens: message.tokens,
                latency: message.latency,
                model: modelName,
                cacheHit: message.cacheHit
              });
              const sendBtn2 = stateManager.getDomElement("sendBtn");
              if (sendBtn2) {
                sendBtn2.disabled = false;
              }
              break;
            case "executionError":
              messageManager.stopThinkingAnimation();
              messageManager.addAIMessage(`Error: ${message.error}`, "error");
              const sendBtnError = stateManager.getDomElement("sendBtn");
              if (sendBtnError) {
                sendBtnError.disabled = false;
              }
              break;
            case "coachingAdvice":
              const coachingSection = stateManager.getDomElement("coachingSection");
              const coachingContent = stateManager.getDomElement("coachingContent");
              if (coachingSection && coachingContent) {
                coachingSection.classList.remove("collapsed");
                coachingContent.innerHTML = settingsManager.formatCoachingAdvice(message.advice);
              }
              break;
            case "settingsUpdated":
              settingsManager.updateSettingsUI(message.settings);
              break;
            case "projectFiles":
              fileAutocompleteManager.displayFileResults(message.files);
              break;
            case "fileSearchResults":
              fileAutocompleteManager.displayFileResults(message.files);
              break;
            case "metricsLoaded":
              if (message.metrics) {
                const sessionMetrics = stateManager.getState("sessionMetrics");
                const updatedMetrics = { ...sessionMetrics, ...message.metrics };
                stateManager.setState("sessionMetrics", updatedMetrics);
                updateMetricsDisplay(updatedMetrics);
              }
              break;
            case "updateSelectedModel":
              const modelSelect = document.getElementById("model-suggestions");
              if (modelSelect) {
                modelSelect.innerHTML = "";
                const option = document.createElement("option");
                option.value = message.model;
                option.textContent = message.model;
                option.selected = true;
                modelSelect.appendChild(option);
              }
              break;
          }
        });
        function updateMetrics(metrics) {
          stateManager.updateMetrics(metrics);
          const sessionMetrics = stateManager.getState("sessionMetrics");
          updateMetricsDisplay(sessionMetrics);
          saveMetricsToStorage();
        }
        function updateMetricsDisplay(metrics) {
          const costInfo = document.getElementById("cost-info");
          const tokensInfo = document.getElementById("tokens-info");
          const latencyInfo = document.getElementById("latency-info");
          const cacheInfo = document.getElementById("cache-info");
          if (costInfo) costInfo.textContent = `$${metrics.totalCost.toFixed(6)}`;
          if (tokensInfo) tokensInfo.textContent = metrics.totalTokens;
          if (latencyInfo) latencyInfo.textContent = `${(metrics.latestLatency / 1e3).toFixed(2)}s`;
          const cacheHitRate = metrics.totalRequests > 0 ? metrics.cacheHits / metrics.totalRequests * 100 : 0;
          if (cacheInfo) cacheInfo.textContent = `${cacheHitRate.toFixed(0)}%`;
        }
        function saveMetricsToStorage() {
          const vscode = stateManager.getVSCode();
          const sessionMetrics = stateManager.getState("sessionMetrics");
          vscode.postMessage({
            type: "saveMetrics",
            metrics: sessionMetrics
          });
        }
      })();
    }
  });
  var main_bundle = require_main();

  return main_bundle;

})();
