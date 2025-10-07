/**
 * File Autocomplete Manager Module
 * Gère l'autocomplétion des fichiers
 */

import StateManager from './state-manager.js';

class FileAutocompleteManager {
    constructor() {
        this.stateManager = StateManager;
    }

    toggleFileAutocomplete() {
        console.log('Toggle file autocomplete clicked, current state:', this.stateManager.isFileAutocompleteOpen());

        if (this.stateManager.isFileAutocompleteOpen()) {
            this.closeFileAutocomplete();
        } else {
            this.openFileAutocomplete();
        }
    }

    openFileAutocomplete() {
        console.log('Opening file autocomplete...');

        let fileAutocomplete = this.stateManager.getDomElement('fileAutocomplete');

        // Check if element exists
        if (!fileAutocomplete) {
            console.error('fileAutocomplete element is null!');
            console.log('Trying to find it again...');
            fileAutocomplete = document.getElementById('file-autocomplete');
            this.stateManager.setDomElement('fileAutocomplete', fileAutocomplete);
            console.log('Found element:', fileAutocomplete);

            if (!fileAutocomplete) {
                console.error('fileAutocomplete element still not found in DOM!');
                return;
            }
        }

        // Force visibility for debugging
        this.applyAutocompleteStyles(fileAutocomplete);

        // Initialize autocomplete content
        this.initializeAutocompleteContent();

        // Position the autocomplete
        this.positionFileAutocomplete();

        // Load initial file list
        this.requestProjectFiles();

        // Update state
        this.stateManager.openFileAutocomplete();

        this.logAutocompleteState(fileAutocomplete);
    }

    closeFileAutocomplete() {
        const fileAutocomplete = this.stateManager.getDomElement('fileAutocomplete');
        if (fileAutocomplete) {
            fileAutocomplete.style.display = 'none';
        }
        this.stateManager.closeFileAutocomplete();
    }

    handleFileSearch(query) {
        this.requestFileSearch(query);
    }

    attachFile(filePath) {
        const attachedFiles = this.stateManager.getState('attachedFiles');
        attachedFiles.push(filePath);

        // Add file reference to prompt
        const promptInput = this.stateManager.getDomElement('promptInput');
        const currentPrompt = promptInput.value;
        const fileReference = `@${filePath}`;

        if (currentPrompt.includes(fileReference)) {
            return; // Already attached
        }

        promptInput.value = currentPrompt + (currentPrompt ? '\n' : '') + fileReference;

        // Trigger auto-expand
        const event = new Event('input', { bubbles: true });
        promptInput.dispatchEvent(event);
    }

    displayFileResults(files) {
        const fileResults = this.stateManager.getDomElement('fileResults');
        if (!fileResults) return;

        fileResults.innerHTML = '';

        if (files.length === 0) {
            const noResults = document.createElement('div');
            noResults.className = 'file-result-item';
            noResults.textContent = 'No files found';
            fileResults.appendChild(noResults);
            return;
        }

        files.forEach(file => {
            const item = document.createElement('div');
            item.className = 'file-result-item';
            item.textContent = file;
            item.addEventListener('click', () => {
                this.attachFile(file);
                this.closeFileAutocomplete();
            });
            fileResults.appendChild(item);
        });
    }

    // Private methods
    applyAutocompleteStyles(fileAutocomplete) {
        fileAutocomplete.style.display = 'block';
        fileAutocomplete.style.visibility = 'visible';
        fileAutocomplete.style.opacity = '1';
        fileAutocomplete.style.backgroundColor = 'var(--bg-card)';
        fileAutocomplete.style.border = '1px solid var(--border-primary)';
        fileAutocomplete.style.minHeight = '100px';
    }

    initializeAutocompleteContent() {
        const fileSearch = this.stateManager.getDomElement('fileSearch');
        const fileResults = this.stateManager.getDomElement('fileResults');

        if (fileSearch) {
            fileSearch.value = '';
            fileSearch.focus();
        }

        if (fileResults) {
            fileResults.innerHTML = '<div class="file-result-item">Loading files...</div>';
        }
    }

    positionFileAutocomplete() {
        const fileAutocomplete = this.stateManager.getDomElement('fileAutocomplete');
        const promptInput = this.stateManager.getDomElement('promptInput');

        if (!fileAutocomplete || !promptInput) return;

        const cursorPosition = promptInput.selectionStart;
        const textBeforeCursor = promptInput.value.substring(0, cursorPosition);

        // Check if we're positioning relative to @ character in text
        const lastAtPos = textBeforeCursor.lastIndexOf('@');

        if (lastAtPos !== -1 && lastAtPos === cursorPosition - 1) {
            this.positionAutocompleteAtCharacter(lastAtPos);
        } else {
            this.positionAutocompleteAtButton();
        }

        // Ensure the autocomplete is visible and properly positioned
        fileAutocomplete.style.zIndex = '1000';
        fileAutocomplete.style.display = 'block';
    }

    positionAutocompleteAtCharacter(atPosition) {
        const fileAutocomplete = this.stateManager.getDomElement('fileAutocomplete');
        const commandInputRect = document.querySelector('.command-input-wrapper').getBoundingClientRect();

        // Use fixed positioning relative to viewport for precise placement
        fileAutocomplete.style.position = 'fixed';
        fileAutocomplete.style.top = (commandInputRect.top - 180) + 'px';
        fileAutocomplete.style.left = commandInputRect.left + 'px';
        fileAutocomplete.style.width = commandInputRect.width + 'px';
        fileAutocomplete.style.maxHeight = '180px';
        fileAutocomplete.style.overflowY = 'auto';
        fileAutocomplete.style.zIndex = '1000';
    }

    positionAutocompleteAtButton() {
        const fileAutocomplete = this.stateManager.getDomElement('fileAutocomplete');
        const fileAttachBtn = this.stateManager.getDomElement('fileAttachBtn');

        if (!fileAttachBtn) return;

        const fileAttachBtnRect = fileAttachBtn.getBoundingClientRect();

        // Position the autocomplete so its bottom aligns with the button's bottom
        fileAutocomplete.style.position = 'fixed';
        fileAutocomplete.style.top = (fileAttachBtnRect.bottom - 180) + 'px';
        fileAutocomplete.style.left = fileAttachBtnRect.left + 'px';
        fileAutocomplete.style.width = '300px';
        fileAutocomplete.style.maxHeight = '180px';
        fileAutocomplete.style.overflowY = 'auto';
        fileAutocomplete.style.zIndex = '1000';
    }

    requestProjectFiles() {
        const vscode = this.stateManager.getVSCode();
        vscode.postMessage({
            type: 'getProjectFiles'
        });
    }

    requestFileSearch(query) {
        const vscode = this.stateManager.getVSCode();
        vscode.postMessage({
            type: 'searchFiles',
            query: query
        });
    }

    logAutocompleteState(fileAutocomplete) {
        console.log('File autocomplete opened and positioned');
        console.log('Autocomplete element exists:', !!fileAutocomplete);
        console.log('Autocomplete parent element:', fileAutocomplete.parentElement);
        console.log('Autocomplete computed styles:', {
            display: getComputedStyle(fileAutocomplete).display,
            position: getComputedStyle(fileAutocomplete).position,
            bottom: getComputedStyle(fileAutocomplete).bottom,
            zIndex: getComputedStyle(fileAutocomplete).zIndex,
            width: getComputedStyle(fileAutocomplete).width,
            height: getComputedStyle(fileAutocomplete).height
        });
    }
}

export default new FileAutocompleteManager();