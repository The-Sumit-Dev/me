const canvas = document.getElementById('opticsCanvas');
const ctx = canvas.getContext('2d');
const container = document.getElementById('canvasContainer');
const diagBox = document.getElementById('diagBox');
const diagHandle = document.getElementById('diagHandle');
const diagResize = document.getElementById('diagResize');
const customCursor = document.getElementById('customCursor');

let state = {
    mode: 'lens',
    type: 'converging',
    u: 240,
    f: 120,
    h: 70,
    scale: 1.0,
    elementX: 0,
    dragging: null,
    hovering: null,
    dragOffset: { x: 0, y: 0 },
    initialWidgetSize: { w: 0, h: 0 }
};

// Custom Cursor Logic
window.addEventListener('mousemove', (e) => {
    customCursor.style.left = e.clientX + 'px';
    customCursor.style.top = e.clientY + 'px';
});

container.addEventListener('mouseenter', () => { customCursor.style.display = 'block'; });
container.addEventListener('mouseleave', () => { customCursor.style.display = 'none'; });

// Movable Diagnostic Widget logic
let isDraggingWidget = false;
let isResizingWidget = false;

diagHandle.addEventListener('mousedown', (e) => {
    isDraggingWidget = true;
    state.dragOffset.x = e.clientX - diagBox.offsetLeft;
    state.dragOffset.y = e.clientY - diagBox.offsetTop;
    e.preventDefault();
});

diagResize.addEventListener('mousedown', (e) => {
    isResizingWidget = true;
    state.initialWidgetSize.w = diagBox.offsetWidth;
    state.initialWidgetSize.h = diagBox.offsetHeight;
    state.dragOffset.x = e.clientX;
    state.dragOffset.y = e.clientY;
    e.preventDefault();
    e.stopPropagation();
});

window.addEventListener('mousemove', (e) => {
    if (isDraggingWidget) {
        const x = e.clientX - state.dragOffset.x;
        const y = e.clientY - state.dragOffset.y;
        diagBox.style.left = `${Math.max(0, Math.min(container.clientWidth - diagBox.offsetWidth, x))}px`;
        diagBox.style.top = `${Math.max(0, Math.min(container.clientHeight - diagBox.offsetHeight, y))}px`;
    }

    if (isResizingWidget) {
        const deltaX = e.clientX - state.dragOffset.x;
        const deltaY = e.clientY - state.dragOffset.y;
        diagBox.style.width = `${Math.max(200, state.initialWidgetSize.w + deltaX)}px`;
        diagBox.style.height = `${Math.max(180, state.initialWidgetSize.h + deltaY)}px`;
    }
});

window.addEventListener('mouseup', () => {
    isDraggingWidget = false;
    isResizingWidget = false;
});

// Time display for header
setInterval(() => {
    const d = new Date();
    document.getElementById('liveTime').innerText = d.getHours().toString().padStart(2, '0') + ":" + 
        d.getMinutes().toString().padStart(2, '0') + ":" + 
        d.getSeconds().toString().padStart(2, '0');
}, 1000);

function resize() {
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    if (state.elementX === 0) state.elementX = canvas.width / 2;
    draw();
}

window.addEventListener('resize', resize);

document.getElementById('resetBtn').addEventListener('click', () => {
    state.elementX = canvas.width / 2;
    state.u = 240; state.f = 120; state.h = 70; state.scale = 1.0;
    document.getElementById('inputH').value = 70;
    document.getElementById('inputF').value = 120;
    document.getElementById('inputScale').value = 1.0;
    document.getElementById('sliderValScale').innerText = "1.0";
    draw();
});

// Global functions for HTML onclick attributes
window.setMode = function(m) { state.mode = m; updateUI(); draw(); }
window.setSubMode = function(t) { state.type = t; updateUI(); draw(); }

window.applyPreset = function(p) {
    const f = state.f;
    if(p === 'beyond-c') state.u = 2.5 * f;
    if(p === 'at-c') state.u = 2 * f;
    if(p === 'between-f-c') state.u = 1.5 * f;
    if(p === 'at-f') state.u = f;
    if(p === 'within-f') state.u = 0.6 * f;
    draw();
}

function updateUI() {
    const isLens = state.mode === 'lens';
    const isConv = state.type === 'converging';

    document.getElementById('btnLens').className = `flex-1 py-3 rounded-xl nothing-font text-sm transition-all ${isLens ? 'bg-black text-white' : 'text-black opacity-40'}`;
    document.getElementById('btnMirror').className = `flex-1 py-3 rounded-xl nothing-font text-sm transition-all ${!isLens ? 'bg-black text-white' : 'text-black opacity-40'}`;
    
    document.getElementById('btnConv').style.borderColor = isConv ? '#000' : '#e0e0e0';
    document.getElementById('btnConv').style.opacity = isConv ? '1' : '0.4';
    document.getElementById('btnDiv').style.borderColor = !isConv ? '#000' : '#e0e0e0';
    document.getElementById('btnDiv').style.opacity = !isConv ? '1' : '0.4';
}

document.getElementById('inputH').oninput = (e) => { 
    state.h = parseInt(e.target.value); 
    document.getElementById('sliderValH').innerText = state.h;
    draw(); 
};

document.getElementById('inputF').oninput = (e) => { 
    state.f = parseInt(e.target.value); 
    document.getElementById('sliderValF').innerText = state.f;
    draw(); 
};

document.getElementById('inputScale').oninput = (e) => {
    state.scale = parseFloat(e.target.value);
    document.getElementById('sliderValScale').innerText = state.scale.toFixed(1);
    draw();
};

canvas.addEventListener('mousedown', handleDown);
window.addEventListener('mousemove', handleMove);
window.addEventListener('mouseup', () => state.dragging = null);

function handleDown(e) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const s = state.scale;
    const objX = state.elementX - (state.u * s);
    
    if (Math.abs(x - (state.elementX + state.f * s)) < 25 || Math.abs(x - (state.elementX - state.f * s)) < 25) state.dragging = 'focus';
    else if (Math.abs(x - objX) < 40) state.dragging = 'object';
    else if (Math.abs(x - state.elementX) < 50) state.dragging = 'element';
}

function handleMove(e) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const s = state.scale;
    if (!state.dragging) return;
    if (state.dragging === 'element') state.elementX = Math.max(100, Math.min(canvas.width - 100, x));
    else if (state.dragging === 'object') state.u = Math.max(5, (state.elementX - x) / s);
    else if (state.dragging === 'focus') {
        state.f = Math.max(20, Math.abs(x - state.elementX) / s);
        document.getElementById('inputF').value = state.f;
        document.getElementById('sliderValF').innerText = state.f.toFixed(0);
    }
    draw();
}

function calculate() {
    const u = -state.u; 
    const f = state.type === 'converging' ? state.f : -state.f;
    let v, m;
    if (state.mode === 'lens') {
        v = 1 / ((1 / f) + (1 / u));
        m = v / u;
    } else {
        v = 1 / ((1 / f) - (1 / u));
        m = -v / u;
    }
    return { v, m, f, u_real: u };
}

function draw() {
    const { v, m, f, u_real } = calculate();
    const ox = state.elementX;
    const oy = canvas.height / 2;
    const s = state.scale;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const isVirtual = state.mode === 'lens' ? v < 0 : v > 0;
    document.getElementById('valU').innerText = state.u.toFixed(0);
    document.getElementById('valV').innerText = Math.abs(v).toFixed(0) + (isVirtual ? "v" : "r");
    document.getElementById('valM').innerText = m.toFixed(2) + "X";
    
    const natureEl = document.getElementById('imageNature');
    if (Math.abs(m) > 100) { natureEl.innerText = "AT INFINITY"; natureEl.className = "text-[10px] font-black active-red"; }
    else { 
        natureEl.innerText = (isVirtual ? "Virtual" : "Real") + " / " + (m > 0 ? "Upright" : "Inverted"); 
        natureEl.className = "text-[10px] font-bold opacity-60";
    }

    // Grid Lines
    ctx.strokeStyle = '#00000008';
    ctx.lineWidth = 1;
    for(let i=0; i<canvas.width; i+=40) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke(); }
    for(let j=0; j<canvas.height; j+=40) { ctx.beginPath(); ctx.moveTo(0, j); ctx.lineTo(canvas.width, j); ctx.stroke(); }

    // Principal Axis
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([2, 4]);
    ctx.beginPath(); ctx.moveTo(0, oy); ctx.lineTo(canvas.width, oy); ctx.stroke();
    ctx.setLineDash([]);

    // Optical Element
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.beginPath();
    if (state.mode === 'lens') {
        const curve = state.type === 'converging' ? 20 * s : -20 * s;
        ctx.moveTo(ox, oy - 160 * s);
        ctx.quadraticCurveTo(ox + curve, oy, ox, oy + 160 * s);
        ctx.quadraticCurveTo(ox - curve, oy, ox, oy - 160 * s);
        ctx.fillStyle = 'rgba(0,0,0,0.03)';
        ctx.fill();
    } else {
        const curve = state.type === 'converging' ? 50 * s : -50 * s;
        ctx.moveTo(ox, oy - 160 * s);
        ctx.quadraticCurveTo(ox + curve, oy, ox, oy + 160 * s);
    }
    ctx.stroke();

    // Landmarks
    const pts = [{x: ox + f * s, l: 'F'}, {x: ox - f * s, l: 'F'}, {x: ox + 2*f * s, l: '2F'}, {x: ox - 2*f * s, l: '2F'}];
    pts.forEach(p => {
        ctx.fillStyle = '#ff0000';
        ctx.beginPath(); ctx.arc(p.x, oy, 4, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#000';
        ctx.font = 'bold 9px Inter';
        ctx.textAlign = 'center';
        ctx.fillText(p.l, p.x, oy + 20);
    });

    const objX = ox + u_real * s;
    const objY = oy - state.h * s;
    const imgX = ox + v * s;
    const imgY = oy - (state.h * m * s);

    // Rays
    ctx.lineWidth = 1;
    // Ray 1: Parallel -> Focus
    drawRay(objX, objY, ox, objY, '#000', 0.8);
    lineThrough(ox, objY, ox + f * s, oy, 2000, '#000', 0.4, s);
    // Ray 2: Center
    lineThrough(objX, objY, ox, oy, 2000, '#ff0000', 0.4, s);

    // Object & Image
    drawNothingArrow(objX, oy, objX, objY, "#000", "OBJ");
    if (Math.abs(m) < 100) {
        drawNothingArrow(imgX, oy, imgX, imgY, isVirtual ? "#00000044" : "#ff0000", "IMG", isVirtual);
    }
}

function drawRay(x1, y1, x2, y2, color, alpha) {
    ctx.strokeStyle = color;
    ctx.globalAlpha = alpha;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.globalAlpha = 1.0;
}

function drawNothingArrow(x1, y1, x2, y2, color, label, dashed = false) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    if (dashed) ctx.setLineDash([5, 5]);
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.setLineDash([]);
    
    const angle = Math.atan2(y2 - y1, x2 - x1);
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - 12 * Math.cos(angle - 0.4), y2 - 12 * Math.sin(angle - 0.4));
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - 12 * Math.cos(angle + 0.4), y2 - 12 * Math.sin(angle + 0.4));
    ctx.stroke();

    ctx.fillStyle = color;
    ctx.font = 'bold 10px Inter';
    ctx.textAlign = 'center';
    ctx.fillText(label, x2, y2 + (y2 > y1 ? 25 : -15));
}

function lineThrough(x1, y1, x2, y2, len, color, alpha, s) {
    const angle = Math.atan2(y2 - y1, x2 - x1);
    ctx.strokeStyle = color;
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x1 + Math.cos(angle) * len, y1 + Math.sin(angle) * len);
    ctx.stroke();
    
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x1 - Math.cos(angle) * len, y1 - Math.sin(angle) * len);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1.0;
}

updateUI();
setTimeout(resize, 50);
