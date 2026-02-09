// --- APP STATE ---
let STATES = []; 
let currentMode = 'learn'; 
let score = 0;
let attempts = 0;
let gameQueue = [];
let targetState = null;
let isGameActive = false;
let solvedStates = new Set();

// --- ZOOM & PAN ENGINE ---
let scale = 1;
let translateX = 0;
let translateY = 0;
let isDragging = false;
let startX, startY;

window.onload = () => {
    lucide.createIcons();
    setupPanZoom();
    autoLoadMap();
};

async function autoLoadMap() {
    try {
        const response = await fetch('india.svg');
        if (!response.ok) throw new Error('File not found');
        const svgText = await response.text();
        parseMap(svgText);
    } catch (err) {
        console.warn('Auto-load failed. Falling back to local data if present.', err);
        // Fallback checks for legacy embedded data logic
        if (typeof window.PcfOslLUkbI_IhV41Ac1m !== 'undefined' || typeof window.paths !== 'undefined') {
            useJSData();
        } else {
            document.getElementById('panelError').classList.remove('hidden');
            document.getElementById('panelLearn').classList.add('hidden');
        }
    }
}

function parseMap(svgString) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgString, "image/svg+xml");
    const svgRoot = doc.querySelector('svg');
    
    if (!svgRoot) return;

    const vb = svgRoot.getAttribute('viewBox') || "0 0 600 700";
    document.getElementById('indiaSvg').setAttribute('viewBox', vb);

    STATES = [];
    const paths = doc.querySelectorAll('path');
    paths.forEach((p, idx) => {
        const id = p.getAttribute('id') || `st_${idx}`;
        let name = p.getAttribute('name') || p.getAttribute('title') || p.id;
        const titleNode = p.querySelector('title');
        if (titleNode) name = titleNode.textContent;

        const d = p.getAttribute('d');
        if (d) {
            STATES.push({ id, name, path: d });
        }
    });

    renderMap();
}

function useJSData() {
    const pathsData = window.PcfOslLUkbI_IhV41Ac1m || window.paths;
    const config = window.map_cfg?.map_data;

    if (!pathsData) return;

    STATES = [];
    Object.keys(pathsData).forEach((key, idx) => {
        const p = pathsData[key];
        const info = config ? config[key] : null;
        if (p.outline?.path) {
            STATES.push({
                id: key,
                name: info ? info.name : key,
                path: p.outline.path
            });
        }
    });

    renderMap();
}

function renderMap() {
    const stage = document.getElementById('mapStage');
    stage.innerHTML = '';

    STATES.forEach(state => {
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("d", state.path);
        path.setAttribute("id", state.id);
        
        path.addEventListener('mouseenter', () => handleHover(state));
        path.addEventListener('mouseleave', handleLeave);
        path.addEventListener('click', (e) => {
            e.stopPropagation();
            handleClick(state);
        });
        
        stage.appendChild(path);
    });

    setMode('learn');
}

function setupPanZoom() {
    const container = document.getElementById('mapContainer');
    
    container.addEventListener('mousedown', (e) => startDrag(e.clientX, e.clientY));
    window.addEventListener('mousemove', (e) => doDrag(e.clientX, e.clientY));
    window.addEventListener('mouseup', stopDrag);

    container.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) startDrag(e.touches[0].clientX, e.touches[0].clientY);
    });
    window.addEventListener('touchmove', (e) => {
        if (e.touches.length === 1) doDrag(e.touches[0].clientX, e.touches[0].clientY);
    });
    window.addEventListener('touchend', stopDrag);

    container.addEventListener('wheel', (e) => {
        e.preventDefault();
        const factor = e.deltaY > 0 ? 0.9 : 1.1;
        adjustZoom(factor);
    }, { passive: false });
}

function startDrag(x, y) {
    isDragging = true;
    startX = x - translateX;
    startY = y - translateY;
}

function doDrag(x, y) {
    if (!isDragging) return;
    translateX = x - startX;
    translateY = y - startY;
    updateTransform();
}

function stopDrag() { isDragging = false; }

function adjustZoom(factor) {
    scale = Math.min(Math.max(scale * factor, 0.5), 10);
    updateTransform();
}

function resetZoom() {
    scale = 1; translateX = 0; translateY = 0;
    updateTransform();
}

function updateTransform() {
    const stage = document.getElementById('mapStage');
    stage.style.transformOrigin = 'center';
    stage.setAttribute('transform', `translate(${translateX}, ${translateY}) scale(${scale})`);
}

function setMode(mode) {
    currentMode = mode;
    document.getElementById('btnLearn').classList.toggle('active', mode === 'learn');
    document.getElementById('btnGame').classList.toggle('active', mode === 'game');
    
    document.getElementById('panelLearn').classList.toggle('hidden', mode === 'game');
    document.getElementById('panelGame').classList.toggle('hidden', mode === 'learn');
    document.getElementById('panelAction').classList.toggle('hidden', mode === 'game' && isGameActive);

    if (mode === 'learn') {
        isGameActive = false;
        resetColors();
    } else if (!isGameActive) {
        document.getElementById('panelAction').classList.remove('hidden');
    }
}

function startGame() {
    if (STATES.length === 0) return;
    isGameActive = true;
    score = 0;
    attempts = 0;
    solvedStates.clear();
    gameQueue = [...STATES].sort(() => 0.5 - Math.random());
    
    setMode('game');
    document.getElementById('panelAction').classList.add('hidden');
    document.getElementById('victoryModal').classList.add('hidden');
    resetColors();
    pickTarget();
}

function pickTarget() {
    if (gameQueue.length === 0) {
        isGameActive = false;
        document.getElementById('finalScore').textContent = score;
        const acc = attempts === 0 ? 100 : Math.round((score / attempts) * 100);
        document.getElementById('finalAcc').textContent = acc + '%';
        document.getElementById('victoryModal').classList.remove('hidden');
        return;
    }
    targetState = gameQueue.pop();
    document.getElementById('targetName').textContent = targetState.name;
    setFeedback("Navigate to Territory", "neutral");
    updateStats();
}

function updateStats() {
    document.getElementById('scoreVal').textContent = score;
    const acc = attempts === 0 ? 100 : Math.round((score / attempts) * 100);
    document.getElementById('accuracyVal').textContent = acc;
}

function skipTarget() {
    if (!isGameActive) return;
    attempts++;
    setFeedback(`Skipped ${targetState.name}`, "warning");
    setTimeout(pickTarget, 400);
}

function handleHover(state) {
    if (currentMode === 'learn') {
        document.getElementById('hoverName').textContent = state.name;
    }
}

function handleLeave() {
    if (currentMode === 'learn') {
        document.getElementById('hoverName').textContent = "...";
    }
}

function handleClick(state) {
    if (currentMode !== 'game' || !isGameActive) return;
    if (solvedStates.has(state.id)) return;

    attempts++;
    const el = document.getElementById(state.id);

    if (state.id === targetState.id) {
        score++;
        solvedStates.add(state.id);
        setFeedback("Correct!", "success");
        el.classList.add('state-correct');
        setTimeout(pickTarget, 700);
    } else {
        setFeedback(`That is ${state.name}`, "error");
        el.classList.add('state-wrong');
        setTimeout(() => {
            if (!solvedStates.has(state.id)) el.classList.remove('state-wrong');
        }, 500);
    }
    updateStats();
}

function setFeedback(msg, type) {
    const box = document.getElementById('feedbackArea');
    box.textContent = msg;
    box.className = "py-4 px-6 rounded-full text-center text-sm font-bold transition-all duration-300 border ";
    if (type === 'success') box.className += "bg-emerald-50 text-emerald-700 border-emerald-100";
    else if (type === 'error') box.className += "bg-rose-50 text-rose-700 border-rose-100";
    else box.className += "bg-white text-slate-400 italic border-slate-100";
}

function resetColors() {
    STATES.forEach(s => {
        const el = document.getElementById(s.id);
        if (el) {
            el.classList.remove('state-correct', 'state-wrong');
            el.style.fill = "";   // Reset fill to allow CSS hover
        }
    });
}
