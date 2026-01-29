// --- DOM Elements ---
const codeInput = document.getElementById('code-input');
const codeHighlight = document.getElementById('code-content');
const previewFrame = document.getElementById('preview-frame');
const fullscreenFrame = document.getElementById('fullscreen-frame');
const appBody = document.getElementById('app-body');
const mainLayout = document.getElementById('main-layout');
const fullscreenContainer = document.getElementById('fullscreen-container');

const deployBtn = document.getElementById('deploy-btn');
const resetBtn = document.getElementById('reset-btn');
const shareModal = document.getElementById('share-modal');
const shareUrlInput = document.getElementById('share-url');
const closeModalBtn = document.getElementById('close-modal');
const copyBtn = document.getElementById('copy-btn');
const viewLiveBtn = document.getElementById('view-live-btn');

// Tabs
const tabCode = document.getElementById('tab-code');
const tabPreview = document.getElementById('tab-preview');
const paneEditor = document.getElementById('pane-editor');
const panePreview = document.getElementById('pane-preview');

// --- Default Modern Template ---
const DEFAULT_CODE = `<!DOCTYPE html>
<html>
<head>
    <script src="https://cdn.tailwindcss.com"><\/script>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Outfit', sans-serif; }
        .glass {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
    </style>
</head>
<body class="bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 min-h-screen text-white flex items-center justify-center p-6">

    <div class="glass max-w-md w-full rounded-2xl p-8 shadow-2xl transform hover:scale-105 transition-transform duration-500">
        <div class="flex items-center gap-3 mb-6">
            <div class="w-3 h-3 rounded-full bg-red-400"></div>
            <div class="w-3 h-3 rounded-full bg-yellow-400"></div>
            <div class="w-3 h-3 rounded-full bg-green-400"></div>
        </div>
        
        <h1 class="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent">
            Hello World.
        </h1>
        
        <p class="text-slate-300 mb-8 leading-relaxed">
            This is a live preview. Switch to the Code tab to edit this card and watch it update instantly.
        </p>
        
        <button class="w-full bg-white text-indigo-900 font-bold py-3 rounded-xl hover:bg-opacity-90 transition-opacity">
            Get Started
        </button>
    </div>

</body>
</html>`;

// --- Syntax Highlighting Logic ---
function updateHighlighting(text) {
    let html = text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

    if (html[html.length - 1] === "\n") html += " "; 

    codeHighlight.innerHTML = html;
    Prism.highlightElement(codeHighlight);
}

function syncScroll() {
    codeHighlight.parentElement.scrollTop = codeInput.scrollTop;
    codeHighlight.parentElement.scrollLeft = codeInput.scrollLeft;
}

codeInput.addEventListener('scroll', syncScroll);

// --- Compression (Pako) ---
function compressCode(text) {
    try {
        const textEncoder = new TextEncoder();
        const bytes = textEncoder.encode(text);
        const compressed = pako.deflate(bytes, { level: 9 });
        const binaryString = uint8ToBinaryString(compressed);
        return btoa(binaryString).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    } catch (e) { return null; }
}

function decompressCode(encoded) {
    try {
        const str = encoded.replace(/-/g, '+').replace(/_/g, '/');
        const binaryString = atob(str);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        const decompressed = pako.inflate(bytes);
        return new TextDecoder().decode(decompressed);
    } catch (e) { return null; }
}

function uint8ToBinaryString(u8Arr) {
    const CHUNK_SIZE = 0x8000;
    let index = 0;
    let length = u8Arr.length;
    let result = '';
    while (index < length) {
        let slice = u8Arr.subarray(index, Math.min(index + CHUNK_SIZE, length));
        result += String.fromCharCode.apply(null, slice);
        index += CHUNK_SIZE;
    }
    return result;
}

// --- App Logic ---

function init() {
    const hash = window.location.hash;
    
    if (hash && hash.startsWith('#v2=')) {
        try {
            const compressed = hash.substring(4);
            const decompressed = decompressCode(compressed);
            
            if (decompressed) {
                enterSharedMode(decompressed);
            } else {
                enterEditorMode(DEFAULT_CODE);
            }
        } catch (e) {
            enterEditorMode(DEFAULT_CODE);
        }
    } else {
        enterEditorMode(DEFAULT_CODE);
    }
}

function enterEditorMode(code) {
    appBody.classList.remove('mode-preview-only');
    if (code) {
        codeInput.value = code;
        updateHighlighting(code);
        updateEditorPreview();
    }
}

function enterSharedMode(code) {
    appBody.classList.add('mode-preview-only');
    fullscreenFrame.srcdoc = code;
    // Also populate editor in case they go back
    codeInput.value = code;
    updateHighlighting(code);
}

function updateEditorPreview() {
    previewFrame.srcdoc = codeInput.value;
}

function deploy() {
    const content = codeInput.value.trim();
    if(!content) return showToast("Code is empty!", true);

    const originalBtn = deployBtn.innerHTML;
    deployBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Processing`;

    setTimeout(() => {
        const compressed = compressCode(content);
        if (compressed) {
            const url = `${window.location.origin}${window.location.pathname}#v2=${compressed}`;
            showShareModal(url);
        } else {
            showToast("Error compressing code", true);
        }
        deployBtn.innerHTML = originalBtn;
    }, 300);
}

function showShareModal(url) {
    shareUrlInput.value = url;
    viewLiveBtn.href = url;
    shareModal.classList.remove('hidden');
}

function showToast(msg, isError = false) {
    const toast = document.getElementById('toast');
    const msgEl = document.getElementById('toast-msg');
    msgEl.textContent = msg;
    toast.className = `fixed bottom-6 right-6 border px-4 py-3 rounded-xl shadow-2xl transform transition-all duration-300 flex items-center gap-3 z-[110] translate-y-0 opacity-100 ${isError ? 'bg-red-900 border-red-700 text-red-100' : 'bg-slate-800 border-slate-700 text-white'}`;
    
    setTimeout(() => {
        toast.classList.add('translate-y-20', 'opacity-0');
    }, 3000);
}

// --- Event Listeners ---

deployBtn.addEventListener('click', deploy);

resetBtn.addEventListener('click', () => {
    if(confirm("Reset to default template?")) {
        codeInput.value = DEFAULT_CODE;
        updateHighlighting(DEFAULT_CODE);
        updateEditorPreview();
    }
});

// Modal interactions
closeModalBtn.addEventListener('click', () => shareModal.classList.add('hidden'));
shareModal.addEventListener('click', (e) => {
    if(e.target === shareModal) shareModal.classList.add('hidden');
});

copyBtn.addEventListener('click', () => {
    shareUrlInput.select();
    document.execCommand('copy');
    copyBtn.textContent = "Copied!";
    setTimeout(() => copyBtn.textContent = "Copy", 2000);
});

// Editor Typing
let debounceTimer;
codeInput.addEventListener('input', () => {
    updateHighlighting(codeInput.value);
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(updateEditorPreview, 500);
});

// Tab Handling
codeInput.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
        e.preventDefault();
        const start = codeInput.selectionStart;
        const end = codeInput.selectionEnd;
        const spaces = "    ";
        codeInput.value = codeInput.value.substring(0, start) + spaces + codeInput.value.substring(end);
        codeInput.selectionStart = codeInput.selectionEnd = start + spaces.length;
        updateHighlighting(codeInput.value);
    }
});

// Tabs Switching (Global)
tabCode.addEventListener('click', () => {
    tabCode.classList.add('active');
    tabPreview.classList.remove('active');
    paneEditor.classList.remove('hidden');
    panePreview.classList.add('hidden');
    panePreview.classList.remove('flex'); // Ensure flex is removed
});

tabPreview.addEventListener('click', () => {
    tabPreview.classList.add('active');
    tabCode.classList.remove('active');
    paneEditor.classList.add('hidden');
    panePreview.classList.remove('hidden');
    panePreview.classList.add('flex'); // Add flex back for layout
});

// Init
init();
window.addEventListener('hashchange', init);
