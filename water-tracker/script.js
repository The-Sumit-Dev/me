// --- Configuration & Constants ---
const STORAGE_KEY = 'hydrotrack_pro_v4';
const DEFAULT_GOAL = 2500;

// --- State Management ---
let appState = {
    profile: {
        name: "Brooklyn Simmons",
        gender: "Female",
        avatarSeed: "Brooklyn",
        goal: DEFAULT_GOAL
    },
    data: {
        currentIntake: 0,
        lastActiveDate: new Date().toDateString(),
        records: [], // Today's records
        history: {} // Format: { "DateString": { total: 2000, goal: 2500, records: [...] } }
    }
};

// UI State
let viewState = {
    selectedDateStr: new Date().toDateString(), // The date currently being viewed
    chartInstance: null
};

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    initChart();
    renderDateStrip();
    updateUI();
});

// --- Data Logic ---

function loadData() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
        try {
            const parsed = JSON.parse(raw);
            // Deep merge or specific assign to handle schema updates
            appState = { 
                ...appState, 
                profile: { ...appState.profile, ...parsed.profile },
                data: { ...appState.data, ...parsed.data } 
            };
            
            // Legacy migration: if history values are just numbers, convert to objects
            for (const [date, val] of Object.entries(appState.data.history)) {
                if (typeof val === 'number') {
                    appState.data.history[date] = { 
                        total: val, 
                        goal: appState.profile.goal, 
                        records: [] // No detailed records for legacy data
                    };
                }
            }
        } catch (e) {
            console.error("Save file corrupted, starting fresh.", e);
        }
    }
    checkDateRollover();
}

function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
}

function checkDateRollover() {
    const todayStr = new Date().toDateString();
    
    if (appState.data.lastActiveDate !== todayStr) {
        // Archive the last active day
        if (appState.data.currentIntake > 0 || appState.data.records.length > 0) {
            appState.data.history[appState.data.lastActiveDate] = {
                total: appState.data.currentIntake,
                goal: appState.profile.goal,
                records: [...appState.data.records]
            };
        }

        // Reset for today
        appState.data.currentIntake = 0;
        appState.data.records = [];
        appState.data.lastActiveDate = todayStr;
        
        saveData();
    }
}

function resetAllData() {
    if (confirm("Delete all data? This cannot be undone.")) {
        localStorage.removeItem(STORAGE_KEY);
        location.reload();
    }
}

// --- Profile Logic ---
function saveProfile() {
    const name = document.getElementById('setting-name').value;
    const goal = parseInt(document.getElementById('setting-goal').value);
    const gender = document.getElementById('setting-gender').value;

    if(name) appState.profile.name = name;
    if(goal) appState.profile.goal = goal;
    if(gender) {
        appState.profile.gender = gender;
        appState.profile.avatarSeed = gender === 'Male' ? 'Felix' : 'Brooklyn';
    }

    saveData();
    updateUI();
    switchTab('home');
    
    // Simple toast notification
    const btn = document.querySelector('button[onclick="saveProfile()"]');
    const originalText = btn.innerText;
    btn.innerText = "Saved!";
    btn.classList.add('bg-green-600');
    setTimeout(() => {
        btn.innerText = originalText;
        btn.classList.remove('bg-green-600');
    }, 2000);
}

function updateAvatarPreview() {
    const gender = document.getElementById('setting-gender').value;
    const seed = gender === 'Male' ? 'Felix' : 'Brooklyn';
    document.getElementById('setting-avatar-preview').src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
}

// --- Core Application Logic ---

function getViewData() {
    const todayStr = new Date().toDateString();
    const isToday = viewState.selectedDateStr === todayStr;

    if (isToday) {
        return {
            total: appState.data.currentIntake,
            goal: appState.profile.goal,
            records: appState.data.records,
            isToday: true
        };
    } else {
        const historyData = appState.data.history[viewState.selectedDateStr];
        return {
            total: historyData ? historyData.total : 0,
            goal: historyData ? historyData.goal : appState.profile.goal, // Fallback to current goal if missing
            records: historyData ? historyData.records : [],
            isToday: false
        };
    }
}

function addWater(amount) {
    // Only allowed if viewing Today
    if (viewState.selectedDateStr !== new Date().toDateString()) {
        alert("Please return to 'Today' to add new records.");
        return;
    }

    appState.data.currentIntake += amount;
    
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    appState.data.records.unshift({
        id: Date.now(),
        amount: amount,
        time: timeStr
    });

    saveData();
    updateUI();
}

function selectDate(dateStr) {
    viewState.selectedDateStr = dateStr;
    renderDateStrip(); // Re-render to update active styling
    updateUI();
}

function goToToday() {
    selectDate(new Date().toDateString());
}

// --- UI Rendering ---

function updateUI() {
    const data = getViewData();
    const profile = appState.profile;

    // 1. Profile Info (Global)
    const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.avatarSeed}`;
    document.getElementById('profile-img-sidebar').src = avatarUrl;
    document.getElementById('profile-img-mobile').src = avatarUrl;
    document.getElementById('profile-name-sidebar').innerText = profile.name;
    document.getElementById('profile-name-mobile').innerText = profile.name.split(' ')[0];

    // 2. Dashboard State
    document.getElementById('target-label').innerText = `Goal: ${data.goal}ml`;
    
    // Intake Number Animation
    const display = document.getElementById('main-intake-display');
    const currentVal = parseInt(display.innerText);
    if (currentVal !== data.total) animateValue(display, currentVal, data.total, 800);

    // Progress Liquid Animation
    const pct = Math.min((data.total / data.goal) * 100, 100);
    const liquidFill = document.getElementById('liquid-fill');
    if (liquidFill) {
        liquidFill.style.top = `${100 - pct}%`;
    }
    
    // Stats
    document.getElementById('stat-percentage').innerText = Math.round(pct) + '%';
    document.getElementById('stat-remaining').innerText = Math.max(0, data.goal - data.total);
    
    // Streak Calculation (Simple consecutive days)
    document.getElementById('stat-streak').innerText = calculateStreak();

    // 3. Mode Switching (History vs Today)
    const actionBtns = document.getElementById('action-buttons');
    const historyMsg = document.getElementById('history-actions');
    const historyBanner = document.getElementById('history-banner');
    
    if (data.isToday) {
        actionBtns.classList.remove('hidden');
        historyMsg.classList.add('hidden');
        historyBanner.classList.add('hidden');
    } else {
        actionBtns.classList.add('hidden');
        historyMsg.classList.remove('hidden');
        historyBanner.classList.remove('hidden');
    }

    // 4. Render Records
    renderRecordsList(data.records);

    // 5. Populate Settings inputs (if empty)
    if(!document.getElementById('setting-name').value) {
        document.getElementById('setting-name').value = profile.name;
        document.getElementById('setting-goal').value = profile.goal;
        document.getElementById('setting-gender').value = profile.gender;
        updateAvatarPreview();
    }

    // 6. Update Chart if visible
    if(viewState.chartInstance) updateChartData();
}

function renderDateStrip() {
    const container = document.getElementById('date-strip-container');
    container.innerHTML = '';

    const today = new Date();
    // Generate last 6 days + today
    for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        
        const dateStr = d.toDateString();
        const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
        const dayNum = d.getDate();
        
        const isSelected = viewState.selectedDateStr === dateStr;
        const isToday = i === 0;

        // Check if data exists for this day in history
        const hasData = (i === 0 && appState.data.currentIntake > 0) || 
                        (i > 0 && appState.data.history[dateStr] && appState.data.history[dateStr].total > 0);

        const btn = document.createElement('button');
        btn.className = `flex flex-col items-center justify-center min-w-[3.5rem] py-3 rounded-xl transition-all duration-300 ${isSelected ? 'bg-brand-600 text-white shadow-md scale-105' : 'bg-transparent text-slate-400 hover:bg-slate-50'}`;
        btn.onclick = () => selectDate(dateStr);
        
        btn.innerHTML = `
            <span class="text-xs font-medium mb-1 opacity-80">${isToday ? 'Today' : dayName}</span>
            <span class="text-lg font-bold">${dayNum}</span>
            <div class="w-1.5 h-1.5 rounded-full mt-1 ${hasData ? (isSelected ? 'bg-white' : 'bg-brand-400') : 'bg-transparent'}"></div>
        `;
        
        container.appendChild(btn);
    }
}

function renderRecordsList(records) {
    const container = document.getElementById('records-list');
    container.innerHTML = '';

    if (records.length === 0) {
        container.innerHTML = `
            <div class="flex flex-col items-center justify-center h-48 text-slate-300">
                <i class="ph ph-drop-slash text-4xl mb-2"></i>
                <span class="text-sm font-medium">No records found</span>
            </div>
        `;
        document.getElementById('record-count').innerText = "0";
        return;
    }

    document.getElementById('record-count').innerText = records.length;

    records.forEach(rec => {
        const div = document.createElement('div');
        div.className = "flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100/50 hover:bg-white hover:shadow-sm transition-all animate-fade-in";
        div.innerHTML = `
            <div class="flex items-center gap-4">
                <div class="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                    <i class="ph-fill ph-glass-water text-lg"></i>
                </div>
                <div>
                    <p class="font-bold text-slate-700">${rec.amount}ml</p>
                    <p class="text-xs text-slate-400">Water • ${rec.time}</p>
                </div>
            </div>
            <i class="ph-bold ph-check-circle text-brand-500 text-xl"></i>
        `;
        container.appendChild(div);
    });
}

function calculateStreak() {
    let streak = 0;
    const today = new Date();
    
    // Check today
    if (appState.data.currentIntake >= appState.profile.goal) streak++;
    
    // Check past
    for (let i = 1; i < 365; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const dStr = d.toDateString();
        
        const dayData = appState.data.history[dStr];
        if (dayData && dayData.total >= dayData.goal) {
            streak++;
        } else {
            break;
        }
    }
    return streak;
}

// --- Chart Logic ---

function initChart() {
    const ctx = document.getElementById('mainChart').getContext('2d');
    
    // Gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(37, 99, 235, 0.5)');
    gradient.addColorStop(1, 'rgba(37, 99, 235, 0.0)');

    viewState.chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Intake',
                data: [],
                borderColor: '#2563eb',
                backgroundColor: gradient,
                borderWidth: 3,
                pointBackgroundColor: '#ffffff',
                pointBorderColor: '#2563eb',
                pointBorderWidth: 3,
                pointRadius: 6,
                pointHoverRadius: 8,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { 
                    beginAtZero: true, 
                    grid: { borderDash: [5, 5], color: '#f1f5f9' },
                    border: { display: false }
                },
                x: { 
                    grid: { display: false },
                    border: { display: false }
                }
            }
        }
    });
}

function updateChartData() {
    const periodSelector = document.getElementById('chart-period-select');
    const period = periodSelector ? periodSelector.value : 'week';
    
    const labels = [];
    const data = [];
    const today = new Date();

    let daysToLookBack = period === 'week' ? 6 : 29;

    for (let i = daysToLookBack; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const dStr = d.toDateString();
        
        // Format label differently for month view to save space
        if (period === 'month') {
            // Just show day number for month view to avoid clutter
            labels.push(d.getDate());
        } else {
            labels.push(d.toLocaleDateString('en-US', { weekday: 'short' }));
        }
        
        if (i === 0) {
            data.push(appState.data.currentIntake);
        } else {
            data.push(appState.data.history[dStr] ? appState.data.history[dStr].total : 0);
        }
    }

    viewState.chartInstance.data.labels = labels;
    viewState.chartInstance.data.datasets[0].data = data;
    
    // Adjust point radius for month view to look cleaner
    if (period === 'month') {
        viewState.chartInstance.data.datasets[0].pointRadius = 2;
        viewState.chartInstance.data.datasets[0].pointHoverRadius = 4;
    } else {
        viewState.chartInstance.data.datasets[0].pointRadius = 6;
        viewState.chartInstance.data.datasets[0].pointHoverRadius = 8;
    }

    viewState.chartInstance.update();
}

// --- Utilities ---

function switchTab(tabId) {
    document.querySelectorAll('.view-section').forEach(el => el.classList.add('hidden'));
    
    const activeView = document.getElementById(`view-${tabId}`);
    if(activeView) {
        activeView.classList.remove('hidden');
        activeView.classList.remove('animate-slide-up');
        void activeView.offsetWidth; // Trigger Reflow
        activeView.classList.add('animate-slide-up');
    }
    
    // Nav Styling
    const navIds = ['home', 'stats', 'settings'];
    navIds.forEach(id => {
        const deskNav = document.getElementById(`nav-${id}-d`);
        const mobNav = document.getElementById(`nav-${id}-m`);
        
        // Reset Desktop
        deskNav.className = deskNav.className.replace('bg-brand-50 text-brand-600', 'text-slate-500');
        
        // Reset Mobile
        mobNav.className = "flex flex-col items-center gap-1 text-slate-400";
        
        if (id === tabId) {
            deskNav.classList.remove('text-slate-500');
            deskNav.classList.add('bg-brand-50', 'text-brand-600');
            
            mobNav.className = "flex flex-col items-center gap-1 text-brand-600 font-bold";
        }
    });

    if (tabId === 'stats' && viewState.chartInstance) updateChartData();
}

function animateValue(obj, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        obj.innerHTML = Math.floor(progress * (end - start) + start);
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}
