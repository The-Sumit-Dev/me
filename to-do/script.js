// --- script.js ---

// --- State ---
let tasks = JSON.parse(localStorage.getItem('modern-todo-tasks')) || [];
let userName = localStorage.getItem('modern-todo-username') || 'User';
let currentDate = new Date();
let notifPermission = typeof Notification !== 'undefined' ? Notification.permission : 'default';
let expandedTimerId = null;
let currentPriority = 'low';
let isDailyView = true;
let insightType = 'monthly'; 
let dailyViewMode = 'list'; 
let calendarViewDate = new Date(); 

let chartInstance = null;
let currentGraphDate = new Date(); 
let streakViewDate = new Date();

const priorities = ['low', 'medium', 'high'];
const motivationalQuotes = [
    "The only way to do great work is to love what you do.",
    "Believe you can and you're halfway there.",
    "Your limitation it's only your imagination.",
    "Push yourself, because no one else is going to do it for you.",
    "Great things never come from comfort zones.",
    "Success doesn't just find you. You have to go out and get it.",
    "The harder you work for something, the greater you'll feel when you achieve it.",
    "Don't stop when you're tired. Stop when you're done.",
    "Little things make big days.",
    "Dream bigger. Do bigger."
];

// Light Theme Colors for Priority
const PRIORITY_CONFIG = {
    high: { label: 'High', color: 'text-red-600 bg-red-50 border-red-200', iconColor: 'text-red-500' },
    medium: { label: 'Med', color: 'text-amber-600 bg-amber-50 border-amber-200', iconColor: 'text-amber-500' },
    low: { label: 'Low', color: 'text-blue-600 bg-blue-50 border-blue-200', iconColor: 'text-blue-500' }
};

// --- DOM Cache ---
const DOM = {
    dailyView: document.getElementById('dailyView'),
    monthlyView: document.getElementById('monthlyView'),
    dailyHeaderContent: document.getElementById('dailyHeaderContent'),
    pageTitle: document.getElementById('pageTitle'),
    appIcon: document.getElementById('appIcon'),
    reportBtn: document.getElementById('reportBtn'),
    reportContainer: document.getElementById('reportContainer'),
    btnMonthly: document.getElementById('btnMonthly'),
    btnDaily: document.getElementById('btnDaily'),
    dailyViewToggles: document.getElementById('dailyViewToggles'),
    btnListMode: document.getElementById('btnListMode'),
    btnCalendarMode: document.getElementById('btnCalendarMode'),
    dateDisplay: document.getElementById('dateDisplay'),
    dateLabel: document.getElementById('dateLabel'),
    datePicker: document.getElementById('datePicker'),
    todayBtn: document.getElementById('todayBtn'),
    progressBar: document.getElementById('progressBar'),
    progressPercent: document.getElementById('progressPercent'),
    progressText: document.getElementById('progressText'),
    taskList: document.getElementById('taskList'),
    taskInput: document.getElementById('taskInput'),
    priorityBtn: document.getElementById('priorityBtn'),
    priorityLabel: document.getElementById('priorityLabel'),
    timeInput: document.getElementById('timeInput'),
    addBtn: document.getElementById('addBtn'),
    form: document.getElementById('addTaskForm'),
    toastContainer: document.getElementById('toastContainer'),
    notifBtn: document.getElementById('notifBtn'),
    timeGreeting: document.getElementById('timeGreeting'),
    userNameDisplay: document.getElementById('userNameDisplay'),
    userNameInput: document.getElementById('userNameInput'),
    quoteOverlay: document.getElementById('quoteOverlay'),
    quoteText: document.getElementById('quoteText'),
    inputContainer: document.getElementById('inputContainer'),
    streakCount: document.getElementById('streakCount'),
    graphContainer: document.getElementById('graphMainWrapper'),
    streakPopup: document.getElementById('streakPopup'),
    streakPopupContent: document.getElementById('streakPopupContent'),
    weeklyStreakGrid: document.getElementById('weeklyStreakGrid'),
    streakPopupCount: document.getElementById('streakPopupCount'),
    streakDateRange: document.getElementById('streakDateRange'),
    statAvgScore: document.getElementById('statAvgScore'),
    statBestDay: document.getElementById('statBestDay'),
    statMomentum: document.getElementById('statMomentum'),
    graphDateRange: document.getElementById('graphDateRange'),
    pdfModal: document.getElementById('pdfModal'),
    pdfModalContent: document.getElementById('pdfModalContent')
};

const getLocalDateStr = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// --- STREAK LOGIC ---
const isDayComplete = (dateStr) => {
    const dayTasks = tasks.filter(t => t.date.startsWith(dateStr));
    if (dayTasks.length === 0) return 'empty'; 
    return dayTasks.every(t => t.completed) ? 'complete' : 'incomplete';
};

const calculateStreak = () => {
    const uniqueDates = new Set(tasks.map(t => getLocalDateStr(new Date(t.date))));
    if (uniqueDates.size === 0) return 0;

    let streak = 0;
    let checkDate = new Date();
    let checkStr = getLocalDateStr(checkDate);
    let status = isDayComplete(checkStr);

    if (status === 'complete') streak++;
    
    checkDate.setDate(checkDate.getDate() - 1);

    while (true) {
        checkStr = getLocalDateStr(checkDate);
        status = isDayComplete(checkStr);

        if (status === 'complete') streak++;
        else if (status === 'incomplete') break;
        else if (status === 'empty') break; 

        checkDate.setDate(checkDate.getDate() - 1);
        if (streak > 3650) break; 
    }
    return streak;
};

window.openStreakPopup = () => {
    streakViewDate = new Date();
    showStreakPopup();
};

window.changeStreakWeek = (offset) => {
    streakViewDate.setDate(streakViewDate.getDate() + (offset * 7));
    showStreakPopup();
};

const showStreakPopup = () => {
    const streak = calculateStreak();
    DOM.streakPopupCount.textContent = `Current Streak: ${streak} Day${streak !== 1 ? 's' : ''}`;
    DOM.weeklyStreakGrid.innerHTML = '';
    
    const dayOfWeek = streakViewDate.getDay(); 
    const monIndex = (dayOfWeek + 6) % 7;
    const startOfWeek = new Date(streakViewDate);
    startOfWeek.setDate(streakViewDate.getDate() - monIndex); 
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    const rangeStr = `${new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric'}).format(startOfWeek)} - ${new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric'}).format(endOfWeek)}`;
    DOM.streakDateRange.textContent = rangeStr;

    const today = new Date();
    const todayStr = getLocalDateStr(today);

    const getDayStatus = (d) => {
        const dStr = getLocalDateStr(d);
        return isDayComplete(dStr);
    };

    const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

    for (let i = 0; i < 7; i++) {
        const currentDay = new Date(startOfWeek);
        currentDay.setDate(startOfWeek.getDate() + i);
        const currentDayStr = getLocalDateStr(currentDay);
        
        const status = getDayStatus(currentDay);
        const isToday = currentDayStr === todayStr;
        const isFuture = currentDay > today && !isToday;

        const el = document.createElement('div');
        el.className = "flex flex-col items-center gap-2 min-w-[30px]";
        
        let iconHtml = '';
        if (isFuture) {
            iconHtml = `<div class="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 border-dashed"></div>`;
        } else if (status === 'complete') {
            iconHtml = `<div class="w-8 h-8 rounded-full bg-orange-100 border border-orange-200 flex items-center justify-center text-orange-500 shadow-sm"><i data-lucide="flame" class="w-4 h-4 fill-orange-500"></i></div>`;
        } else if (status === 'incomplete') {
             iconHtml = `<div class="w-8 h-8 rounded-full bg-red-50 border border-red-200 flex items-center justify-center text-red-500"><i data-lucide="x" class="w-4 h-4"></i></div>`;
        } else if (isToday) {
            iconHtml = `<div class="w-8 h-8 rounded-full bg-purple-50 border border-purple-200 flex items-center justify-center text-primary animate-pulse"><i data-lucide="circle" class="w-4 h-4"></i></div>`;
        } else {
            iconHtml = `<div class="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-300"><i data-lucide="minus" class="w-4 h-4"></i></div>`;
        }

        el.innerHTML = `
            <span class="text-[10px] font-bold ${isToday ? 'text-primary' : 'text-slate-400'} font-mono">${days[i]}</span>
            ${iconHtml}
        `;
        DOM.weeklyStreakGrid.appendChild(el);
    }

    DOM.streakPopup.classList.remove('opacity-0', 'pointer-events-none');
    DOM.streakPopupContent.classList.remove('scale-95');
    DOM.streakPopupContent.classList.add('scale-100');
    lucide.createIcons();
};

window.closeStreakPopup = () => {
    DOM.streakPopup.classList.add('opacity-0', 'pointer-events-none');
    DOM.streakPopupContent.classList.add('scale-95');
    DOM.streakPopupContent.classList.remove('scale-100');
};

window.openPdfModal = () => {
    DOM.pdfModal.classList.remove('opacity-0', 'pointer-events-none');
    DOM.pdfModalContent.classList.remove('scale-95');
    DOM.pdfModalContent.classList.add('scale-100');
};

window.closePdfModal = () => {
    DOM.pdfModal.classList.add('opacity-0', 'pointer-events-none');
    DOM.pdfModalContent.classList.add('scale-95');
    DOM.pdfModalContent.classList.remove('scale-100');
};

window.generatePDF = (type) => {
    closePdfModal();
    const element = document.createElement('div');
    element.style.width = '780px'; 
    element.style.padding = '40px';
    element.style.fontFamily = "'Inter', sans-serif";
    element.style.backgroundColor = '#ffffff';
    element.style.color = '#1f2937';
    element.style.overflow = 'visible'; // Ensure all content is captured

    const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    let contentHtml = '';
    let reportTitle = '';

    const headerHtml = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; border-bottom: 3px solid #7c3aed; padding-bottom: 20px;">
            <div>
                <h1 style="font-size: 32px; font-weight: 800; color: #111827; margin: 0; letter-spacing: -0.5px;">Goal <span style="color: #7c3aed;">Sync</span></h1>
                <p style="color: #6b7280; margin: 5px 0 0 0; font-size: 14px; font-weight: 500;">Performance Report for <span style="color: #111827; font-weight: 700;">${userName}</span></p>
            </div>
            <div style="text-align: right;">
                <p style="color: #9ca3af; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin: 0;">Generated on</p>
                <p style="color: #111827; font-weight: 600; font-size: 14px; margin: 2px 0 0 0;">${dateStr}</p>
            </div>
        </div>
    `;

    if (type === 'date') {
        reportTitle = 'Single Day Breakdown';
        const dateLabel = formatDate(currentDate);
        const dayTasks = tasks.filter(t => isSameDay(new Date(t.date), currentDate));
        
        const total = dayTasks.length;
        const completed = dayTasks.filter(t => t.completed).length;
        const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

        let tasksHtml = '';
        if (dayTasks.length === 0) {
            tasksHtml = '<div style="padding: 40px; text-align: center; color: #6b7280; background: #f9fafb; border-radius: 12px;">No tasks recorded for this day.</div>';
        } else {
            dayTasks.forEach(task => {
                const pColors = {
                    high: { bg: '#fef2f2', text: '#ef4444', border: '#fecaca' },
                    medium: { bg: '#fffbeb', text: '#f59e0b', border: '#fde68a' },
                    low: { bg: '#eff6ff', text: '#3b82f6', border: '#bfdbfe' }
                };
                const colors = pColors[task.priority || 'low'];
                const statusColor = task.completed ? '#10b981' : '#6b7280';
                
                tasksHtml += `
                    <div style="display: flex; align-items: flex-start; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; margin-bottom: 12px; box-shadow: 0 1px 2px rgba(0,0,0,0.05); page-break-inside: avoid;">
                        <div style="width: 20px; height: 20px; border: 2px solid ${task.completed ? '#10b981' : '#d1d5db'}; background: ${task.completed ? '#10b981' : 'transparent'}; border-radius: 50%; margin-right: 15px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 2px;">
                            ${task.completed ? '<span style="color:white; font-size:12px;">✓</span>' : ''}
                        </div>
                        <div style="flex: 1;">
                            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4px;">
                                <h4 style="margin: 0; font-size: 15px; font-weight: 600; color: ${task.completed ? '#9ca3af' : '#1f2937'}; ${task.completed ? 'text-decoration: line-through;' : ''}; word-break: break-word;">
                                    ${escapeHtml(task.text)}
                                </h4>
                                <span style="font-size: 9px; font-weight: 800; background: ${colors.bg}; color: ${colors.text}; border: 1px solid ${colors.border}; padding: 2px 6px; border-radius: 4px; text-transform: uppercase;">
                                    ${task.priority || 'low'}
                                </span>
                            </div>
                            <div style="display: flex; gap: 15px; font-size: 11px; color: #6b7280;">
                                ${task.dueTime ? `<span>⏰ ${formatTimeDisplay(task.dueTime)}</span>` : ''}
                                <span>Status: <b style="color: ${statusColor}">${task.completed ? 'Completed' : 'Pending'}</b></span>
                            </div>
                        </div>
                    </div>
                `;
            });
        }

        contentHtml = `
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 25px;">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <div style="width: 4px; height: 24px; background: #7c3aed; border-radius: 2px;"></div>
                    <h2 style="font-size: 20px; font-weight: 700; color: #111827; margin: 0;">${dateLabel}</h2>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin-bottom: 30px;">
                <div style="background: #ffffff; border: 1px solid #e5e7eb; padding: 15px; border-radius: 12px; text-align: center;">
                    <p style="font-size: 10px; color: #9ca3af; margin: 0 0 5px 0; font-weight: 700; text-transform: uppercase;">Total</p>
                    <p style="font-size: 22px; font-weight: 800; color: #1f2937; margin: 0;">${total}</p>
                </div>
                <div style="background: #ffffff; border: 1px solid #e5e7eb; padding: 15px; border-radius: 12px; text-align: center;">
                    <p style="font-size: 10px; color: #9ca3af; margin: 0 0 5px 0; font-weight: 700; text-transform: uppercase;">Done</p>
                    <p style="font-size: 22px; font-weight: 800; color: #10b981; margin: 0;">${completed}</p>
                </div>
                <div style="background: #ffffff; border: 1px solid #e5e7eb; padding: 15px; border-radius: 12px; text-align: center;">
                    <p style="font-size: 10px; color: #9ca3af; margin: 0 0 5px 0; font-weight: 700; text-transform: uppercase;">Progress</p>
                    <p style="font-size: 22px; font-weight: 800; color: #7c3aed; margin: 0;">${percent}%</p>
                </div>
            </div>

            <div style="background: #fafafa; border-radius: 16px; padding: 20px; border: 1px solid #f1f5f9;">
                <h3 style="font-size: 14px; font-weight: 700; color: #4b5563; margin: 0 0 15px 0;">Goals List</h3>
                ${tasksHtml}
            </div>
        `;
    }
    else if (type === 'list') {
        reportTitle = 'Daily Breakdown Report';
        let rowsHtml = '';
        const days = getAggregatedDays();
        const sortedKeys = Object.keys(days).sort().reverse();
        
        sortedKeys.forEach(key => {
            const data = days[key];
            const dateObj = data.date;
            const dateLabel = new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).format(dateObj);
            const percent = Math.round((data.completed / data.total) * 100) || 0;
            
            let color = '#ef4444';
            let badgeIcon = '⚠️';
            let grade = 'D';

            if (percent === 100) { color = '#ca8a04'; badgeIcon = '🏆'; grade = 'S'; }
            else if (percent >= 80) { color = '#059669'; badgeIcon = '⭐'; grade = 'A'; }
            else if (percent >= 60) { color = '#2563eb'; badgeIcon = '📈'; grade = 'B'; }
            else if (percent >= 40) { color = '#9333ea'; badgeIcon = '🎯'; grade = 'C'; }

            rowsHtml += `
                <div style="display: flex; align-items: center; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; margin-bottom: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); page-break-inside: avoid;">
                    <div style="width: 60px; text-align: center; margin-right: 20px;">
                        <div style="font-weight: 800; font-size: 24px; color: ${color}; line-height: 1;">${grade}</div>
                        <div style="font-size: 10px; font-weight: 600; color: #9ca3af; margin-top: 4px;">GRADE</div>
                    </div>
                    <div style="flex: 1; border-left: 2px solid #f3f4f6; padding-left: 20px;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                            <h3 style="font-size: 15px; font-weight: 700; color: #1f2937; margin: 0;">${dateLabel}</h3>
                            <div style="font-size: 14px; font-weight: 600; color: ${color}; display: flex; align-items: center; gap: 6px;">
                                <span>${badgeIcon}</span> <span>${percent}%</span>
                            </div>
                        </div>
                        <div style="width: 100%; background: #f3f4f6; height: 8px; border-radius: 99px; overflow: hidden;">
                            <div style="width: ${percent}%; background: ${color}; height: 100%;"></div>
                        </div>
                        <div style="margin-top: 6px; font-size: 11px; color: #6b7280; font-weight: 500;">
                            ${data.completed} out of ${data.total} tasks completed
                        </div>
                    </div>
                </div>
            `;
        });
        
        if(!rowsHtml) rowsHtml = '<div style="padding: 40px; text-align: center; color: #6b7280; background: #f9fafb; border-radius: 12px;">No activity data found.</div>';
        
        contentHtml = `
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 20px;">
                <div style="width: 4px; height: 24px; background: #7c3aed; border-radius: 2px;"></div>
                <h2 style="font-size: 20px; font-weight: 700; color: #111827; margin: 0;">${reportTitle}</h2>
            </div>
            <div style="background: #fafafa; border-radius: 16px; padding: 20px;">
                ${rowsHtml}
            </div>
        `;
    }
    else if (type === 'calendar') {
        reportTitle = 'Visual Calendar View';
        const year = calendarViewDate.getFullYear();
        const month = calendarViewDate.getMonth();
        const monthName = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(calendarViewDate);
        
        let gridHtml = `
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
                <h2 style="font-size: 24px; font-weight: 800; color: #111827; margin: 0;">${monthName}</h2>
                <div style="font-size: 12px; color: #6b7280; background: #f3f4f6; padding: 6px 12px; border-radius: 20px;">Monthly Overview</div>
            </div>
            <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px; margin-bottom: 20px;">`;
        
        ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].forEach(d => {
            gridHtml += `<div style="text-align: center; font-size: 11px; font-weight: 700; color: #9ca3af; padding: 8px; text-transform: uppercase; letter-spacing: 0.5px;">${d}</div>`;
        });

        const daysData = getAggregatedDays();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startDayIdx = firstDay.getDay();

        for(let i=0; i<startDayIdx; i++) { gridHtml += `<div></div>`; }

        for(let day=1; day<=daysInMonth; day++) {
            const currentDayStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
            const data = daysData[currentDayStr];
            let bg = "#f9fafb";
            let border = "#e5e7eb";
            let icon = "";
            
            if(data) {
                const percent = Math.round((data.completed / data.total) * 100) || 0;
                if (percent === 100) { bg = "#eab308"; border = "#ca8a04"; icon = "🏆"; }
                else if (percent >= 80) { bg = "#10b981"; border = "#059669"; icon = "⭐"; }
                else if (percent >= 60) { bg = "#3b82f6"; border = "#2563eb"; icon = "📈"; }
                else if (percent >= 40) { bg = "#a855f7"; border = "#9333ea"; icon = "🎯"; }
                else { bg = "#ef4444"; border = "#dc2626"; icon = "⚠️"; }
            }

            gridHtml += `
                <div style="aspect-ratio: 1; background-color: ${bg}; border: 1px solid ${border}; border-radius: 12px; display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative; height: 80px;">
                    <span style="font-size: 14px; font-weight: 700; color: ${data ? '#fff' : '#374151'}; margin-bottom: 4px;">${day}</span>
                    ${icon ? `<span style="font-size: 18px;">${icon}</span>` : ''}
                </div>
            `;
        }
        gridHtml += `</div>`;
        contentHtml = `${gridHtml}`;
    }
    else if (type === 'graph') {
        reportTitle = 'Weekly Trend Analysis';
        const canvas = document.getElementById('progressChart');
        const chartImg = canvas.toDataURL('image/png', 1.0);
        
        contentHtml = `
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 20px;">
                <div style="width: 4px; height: 24px; background: #ec4899; border-radius: 2px;"></div>
                <h2 style="font-size: 20px; font-weight: 700; color: #111827; margin: 0;">${reportTitle}</h2>
            </div>
            <div style="border: 1px solid #e5e7eb; border-radius: 16px; padding: 24px; background: #fafafa;">
                <p style="text-align:center; font-size: 14px; color: #6b7280; font-weight: 600; margin-bottom: 25px; text-transform: uppercase; letter-spacing: 1px;">
                    Week of ${DOM.graphDateRange.textContent}
                </p>
                <img src="${chartImg}" style="width: 100%; height: auto; border-radius: 8px; border: 1px solid #f3f4f6;" />
            </div>
            <div style="margin-top: 25px; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px;">
                <div style="background: #f3f4f6; padding: 20px; border-radius: 12px; text-align: center;">
                    <div style="font-size: 11px; text-transform: uppercase; color: #6b7280; font-weight: 700; letter-spacing: 0.5px; margin-bottom: 5px;">Average</div>
                    <div style="font-size: 28px; font-weight: 800; color: #111827;">${DOM.statAvgScore.textContent}</div>
                </div>
                <div style="background: #f3f4f6; padding: 20px; border-radius: 12px; text-align: center;">
                     <div style="font-size: 11px; text-transform: uppercase; color: #6b7280; font-weight: 700; letter-spacing: 0.5px; margin-bottom: 5px;">Best Day</div>
                     <div style="font-size: 20px; font-weight: 800; color: #8b5cf6;">${DOM.statBestDay.textContent}</div>
                </div>
                 <div style="background: #f3f4f6; padding: 20px; border-radius: 12px; text-align: center;">
                     <div style="font-size: 11px; text-transform: uppercase; color: #6b7280; font-weight: 700; letter-spacing: 0.5px; margin-bottom: 5px;">Status</div>
                     <div style="font-size: 20px; font-weight: 800; color: #10b981;">Active</div>
                </div>
            </div>
        `;
    }

    element.innerHTML = `
        ${headerHtml}
        ${contentHtml}
        <div style="margin-top: 40px; text-align: center; border-top: 1px solid #f3f4f6; padding-top: 20px; page-break-inside: avoid;">
            <p style="color: #9ca3af; font-size: 12px; font-weight: 500;">Generated by Goal Sync App</p>
        </div>
    `;

    const opt = {
        margin: [15, 15], // Set proper margins
        filename: `goals-report-${type}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] } // Fixed page breaking logic
    };

    addToast('Generating PDF...', 'info');
    html2pdf().set(opt).from(element).save().then(() => {
        addToast('PDF Downloaded!', 'success');
    }).catch(err => {
        console.error(err);
        addToast('Failed to generate PDF.', 'error');
    });
};

window.changeGraphWeek = (offset) => {
    currentGraphDate.setDate(currentGraphDate.getDate() + (offset * 7));
    renderChart();
};

const renderChart = () => {
    const ctx = document.getElementById('progressChart').getContext('2d');
    
    if (chartInstance) {
        chartInstance.destroy();
    }

    const daysData = getAggregatedDays();
    const labels = [];
    const dataPoints = [];
    const rawData = []; 
    
    const currentDay = currentGraphDate.getDay(); 
    const distanceToMonday = currentDay === 0 ? 6 : currentDay - 1;
    
    const startOfWeek = new Date(currentGraphDate);
    startOfWeek.setDate(currentGraphDate.getDate() - distanceToMonday);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    const rangeStr = `${new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric'}).format(startOfWeek)} - ${new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric'}).format(endOfWeek)}`;
    DOM.graphDateRange.textContent = rangeStr;

    for(let i=0; i<7; i++) { 
        const d = new Date(startOfWeek);
        d.setDate(startOfWeek.getDate() + i);
        
        const key = getLocalDateStr(d);
        const dayName = new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(d);
        labels.push(dayName);
        
        const dayStat = daysData[key];
        if(dayStat && dayStat.total > 0) {
            const pct = Math.round((dayStat.completed / dayStat.total) * 100);
            dataPoints.push(pct);
            rawData.push({ completed: dayStat.completed, total: dayStat.total, date: d });
        } else {
            dataPoints.push(0);
            rawData.push({ completed: 0, total: 0, date: d });
        }
    }

    const nonZeroDays = dataPoints.filter(p => p > 0);
    const totalScore = dataPoints.reduce((a, b) => a + b, 0);
    const avg = nonZeroDays.length ? Math.round(totalScore / nonZeroDays.length) : 0;
    DOM.statAvgScore.textContent = `${avg}%`;
    DOM.statAvgScore.className = `font-mono text-xl font-bold ${avg >= 80 ? 'text-green-600' : avg >= 50 ? 'text-blue-600' : 'text-slate-800'}`;

    const maxScore = Math.max(...dataPoints);
    const bestIndex = dataPoints.lastIndexOf(maxScore);
    if (maxScore > 0) {
        const bestDate = rawData[bestIndex].date;
        DOM.statBestDay.textContent = new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(bestDate);
        DOM.statBestDay.className = "font-display text-sm font-bold text-primary";
    } else {
        DOM.statBestDay.textContent = "-";
        DOM.statBestDay.className = "font-display text-sm font-bold text-slate-400";
    }

    const first3 = dataPoints.slice(0,3).reduce((a,b)=>a+b,0)/3;
    const last3 = dataPoints.slice(4).reduce((a,b)=>a+b,0)/3;
    
    let trendIcon = '→';
    let trendColor = 'text-slate-400';
    if(totalScore > 0) {
        if (last3 > first3 + 5) { trendIcon = '↗'; trendColor = 'text-green-500'; }
        else if (last3 < first3 - 5) { trendIcon = '↘'; trendColor = 'text-red-500'; }
    }
    DOM.statMomentum.innerHTML = `<span class="${trendColor} text-lg">${trendIcon}</span>`;

    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, 'rgba(124, 58, 237, 0.4)'); 
    gradient.addColorStop(1, 'rgba(124, 58, 237, 0.0)'); 

    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Completion',
                data: dataPoints,
                borderWidth: 3,
                borderColor: '#7c3aed', 
                backgroundColor: gradient,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#ffffff', 
                pointBorderColor: '#7c3aed', 
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6,
                pointHoverBorderWidth: 2,
                pointHoverBorderColor: '#fff',
                pointHoverBackgroundColor: '#7c3aed'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(30, 41, 59, 0.9)', 
                    titleColor: '#fff',
                    titleFont: { family: "'Outfit', sans-serif", size: 13 },
                    bodyColor: '#e2e8f0',
                    bodyFont: { family: "'Inter', sans-serif", size: 12 },
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderWidth: 1,
                    padding: 12,
                    cornerRadius: 12,
                    displayColors: false,
                    callbacks: {
                        label: function(context) {
                            const val = context.parsed.y;
                            const idx = context.dataIndex;
                            const raw = rawData[idx];
                            return [`Score: ${val}%`, `Completed: ${raw.completed}/${raw.total}`];
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 105, 
                    grid: { color: '#e2e8f0' }, 
                    ticks: { display: false } 
                },
                x: {
                    grid: { display: false },
                    ticks: { 
                        color: '#64748b', 
                        font: { size: 11, family: "'JetBrains Mono', monospace" } 
                    }
                }
            }
        }
    });
};

window.toggleView = () => {
    isDailyView = !isDailyView;
    if (isDailyView) {
        DOM.dailyView.classList.remove('hidden-view');
        DOM.monthlyView.classList.add('hidden-view');
        DOM.inputContainer.classList.remove('hidden-view');
        DOM.pageTitle.innerHTML = `Goal <span class="text-primary">Sync</span>`;
        DOM.reportBtn.innerHTML = '<i data-lucide="bar-chart-2" class="w-4 h-4"></i><span>Insights</span>';
        DOM.appIcon.innerHTML = '<i data-lucide="trophy" class="w-8 h-8"></i>';
        updateUI();
    } else {
        DOM.dailyView.classList.add('hidden-view');
        DOM.monthlyView.classList.remove('hidden-view');
        DOM.inputContainer.classList.add('hidden-view');
        DOM.pageTitle.innerHTML = `Insights`;
        DOM.reportBtn.innerHTML = '<i data-lucide="layout-list" class="w-4 h-4"></i><span>Tasks</span>'; 
        DOM.appIcon.innerHTML = '<i data-lucide="pie-chart" class="w-8 h-8 text-pink-500"></i>';
        updateInsightsUI();
    }
    lucide.createIcons();
};

window.setInsightType = (type) => {
    insightType = type;
    updateInsightsUI();
};

window.setDailyMode = (mode) => {
    dailyViewMode = mode;
    updateInsightsUI();
};

const updateInsightsUI = () => {
    setTimeout(renderChart, 100);

    if(insightType === 'monthly') {
        DOM.btnMonthly.className = "px-4 py-2 rounded-lg text-sm font-medium transition-all bg-slate-100 text-slate-900 shadow-sm border border-slate-200";
        DOM.btnDaily.className = "px-4 py-2 rounded-lg text-sm font-medium transition-all text-slate-500 hover:text-slate-900 hover:bg-slate-50";
        DOM.dailyViewToggles.classList.add('hidden');
        DOM.graphContainer.classList.remove('hidden');
        renderMonthlyReport();
    } else {
        DOM.btnMonthly.className = "px-4 py-2 rounded-lg text-sm font-medium transition-all text-slate-500 hover:text-slate-900 hover:bg-slate-50";
        DOM.btnDaily.className = "px-4 py-2 rounded-lg text-sm font-medium transition-all bg-slate-100 text-slate-900 shadow-sm border border-slate-200";
        DOM.dailyViewToggles.classList.remove('hidden');
        DOM.dailyViewToggles.classList.add('flex');
        
        DOM.graphContainer.classList.add('hidden');
        
        if(dailyViewMode === 'list') {
            DOM.btnListMode.className = "p-2 rounded-lg transition-all bg-slate-100 text-slate-900 shadow-sm border border-slate-200";
            DOM.btnCalendarMode.className = "p-2 rounded-lg transition-all text-slate-500 hover:text-slate-900 hover:bg-slate-50";
            renderDailyReportList();
        } else {
            DOM.btnListMode.className = "p-2 rounded-lg transition-all text-slate-500 hover:text-slate-900 hover:bg-slate-50";
            DOM.btnCalendarMode.className = "p-2 rounded-lg transition-all bg-slate-100 text-slate-900 shadow-sm border border-slate-200";
            renderDailyReportCalendar();
        }
    }
    lucide.createIcons();
};

const renderMonthlyReport = () => {
    DOM.reportContainer.innerHTML = '';
    const months = {};
    tasks.forEach(task => {
        const date = new Date(task.date);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (!months[key]) months[key] = { total: 0, completed: 0, date: date };
        months[key].total++;
        if (task.completed) months[key].completed++;
    });

    const sortedKeys = Object.keys(months).sort().reverse();
    if (sortedKeys.length === 0) return renderEmptyState();

    sortedKeys.forEach(key => {
        const data = months[key];
        const label = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(data.date);
        renderReportCard(label, data.completed, data.total);
    });
};

const renderDailyReportList = () => {
    DOM.reportContainer.innerHTML = '';
    const days = getAggregatedDays();
    const sortedKeys = Object.keys(days).sort().reverse();
    if (sortedKeys.length === 0) return renderEmptyState();
    sortedKeys.forEach(key => {
        const data = days[key];
        const label = new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }).format(data.date);
        renderReportCard(label, data.completed, data.total);
    });
};

window.changeCalendarMonth = (offset) => {
    calendarViewDate.setMonth(calendarViewDate.getMonth() + offset);
    renderDailyReportCalendar();
    lucide.createIcons();
};

const renderDailyReportCalendar = () => {
    DOM.reportContainer.innerHTML = '';
    const year = calendarViewDate.getFullYear();
    const month = calendarViewDate.getMonth();
    
    const header = document.createElement('div');
    header.className = "flex justify-between items-center mb-4 bg-white/60 p-3 rounded-xl border border-slate-200";
    const monthName = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(calendarViewDate);
    header.innerHTML = `
        <button onclick="changeCalendarMonth(-1)" class="p-2 hover:bg-white rounded-lg transition-colors"><i data-lucide="chevron-left" class="w-5 h-5 text-slate-500"></i></button>
        <span class="text-lg font-bold text-slate-800">${monthName}</span>
        <button onclick="changeCalendarMonth(1)" class="p-2 hover:bg-white rounded-lg transition-colors"><i data-lucide="chevron-right" class="w-5 h-5 text-slate-500"></i></button>
    `;
    DOM.reportContainer.appendChild(header);

    const grid = document.createElement('div');
    grid.className = "grid grid-cols-7 gap-2";
    
    ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].forEach(d => {
        const el = document.createElement('div');
        el.className = "text-center text-xs text-slate-400 font-medium py-2 uppercase tracking-wider";
        el.textContent = d;
        grid.appendChild(el);
    });

    const daysData = getAggregatedDays();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayIdx = firstDay.getDay();

    for(let i=0; i<startDayIdx; i++) {
        const el = document.createElement('div');
        grid.appendChild(el);
    }

    for(let day=1; day<=daysInMonth; day++) {
        const currentDayStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
        const data = daysData[currentDayStr];
        
        const cell = document.createElement('div');
        cell.className = "aspect-square rounded-xl border border-slate-100 flex flex-col items-center justify-center relative transition-all hover:bg-slate-50 cursor-default overflow-hidden group";
        
        let bgClass = "bg-white";
        let badge = "";
        
        if(data) {
            const percent = Math.round((data.completed / data.total) * 100) || 0;
            if (percent === 100) { bgClass = "bg-yellow-50 border-yellow-200"; badge = "🏆"; }
            else if (percent >= 80) { bgClass = "bg-green-50 border-green-200"; badge = "⭐"; }
            else if (percent >= 60) { bgClass = "bg-blue-50 border-blue-200"; badge = "📈"; }
            else if (percent >= 40) { bgClass = "bg-purple-50 border-purple-200"; badge = "🎯"; }
            else { bgClass = "bg-red-50 border-red-200"; badge = "⚠️"; }
            
            cell.className += ` ${bgClass}`;
        }

        cell.innerHTML = `
            <span class="text-sm font-medium ${data ? 'text-slate-800 font-bold' : 'text-slate-400'} relative z-10">${day}</span>
            ${badge ? `<span class="absolute top-1 right-1 text-[10px] z-10">${badge}</span>` : ''}
            ${data ? `<div class="absolute bottom-0 left-0 h-1 bg-current opacity-30 text-slate-400" style="width: ${Math.round((data.completed/data.total)*100)}%;"></div>` : ''}
        `;
        grid.appendChild(cell);
    }
    DOM.reportContainer.appendChild(grid);
};

const getAggregatedDays = () => {
    const days = {};
    tasks.forEach(task => {
        const date = new Date(task.date);
        const key = getLocalDateStr(date);
        if (!days[key]) days[key] = { total: 0, completed: 0, date: date };
        days[key].total++;
        if (task.completed) days[key].completed++;
    });
    return days;
};

const renderEmptyState = () => {
    DOM.reportContainer.innerHTML = `
        <div class="flex flex-col items-center justify-center h-64 text-slate-400">
            <div class="bg-slate-100 p-4 rounded-full mb-4"><i data-lucide="bar-chart-2" class="w-8 h-8 text-slate-500"></i></div>
            <p>No activity recorded yet.</p>
            <p class="text-sm">Complete tasks to see your stats!</p>
        </div>`;
};

const renderReportCard = (label, completed, total) => {
    const percent = Math.round((completed / total) * 100) || 0;
    let grade, colorClass, icon;
    if (percent === 100) { grade = 'S'; colorClass = 'from-yellow-400 to-orange-500'; icon = 'trophy'; }
    else if (percent >= 80) { grade = 'A'; colorClass = 'from-green-400 to-emerald-600'; icon = 'star'; }
    else if (percent >= 60) { grade = 'B'; colorClass = 'from-blue-400 to-indigo-600'; icon = 'trending-up'; }
    else if (percent >= 40) { grade = 'C'; colorClass = 'from-purple-400 to-pink-600'; icon = 'target'; }
    else { grade = 'D'; colorClass = 'from-red-400 to-red-600'; icon = 'alert-circle'; }

    const card = document.createElement('div');
    card.className = 'glass-panel rounded-2xl p-5 hover:bg-slate-50 transition-colors animate-slide-up bg-white';
    card.innerHTML = `
        <div class="flex justify-between items-start mb-4">
            <div>
                <h3 class="font-bold text-lg text-slate-800 tracking-wide">${label}</h3>
                <p class="text-xs text-slate-500 mt-1">${completed} / ${total} Goals Completed</p>
            </div>
            <div class="w-10 h-10 rounded-xl bg-gradient-to-br ${colorClass} flex items-center justify-center text-white font-bold text-xl shadow-lg transform -rotate-6">
                ${grade}
            </div>
        </div>
        <div class="relative h-3 bg-slate-100 rounded-full overflow-hidden mb-3">
            <div class="absolute top-0 left-0 h-full bg-gradient-to-r ${colorClass} transition-all duration-1000" style="width: ${percent}%"></div>
        </div>
        <div class="flex justify-between items-center text-xs font-medium">
            <span class="text-slate-500">Score: <span class="text-slate-900 font-bold">${percent}%</span></span>
            <div class="flex items-center gap-1 text-slate-500">
                <i data-lucide="${icon}" class="w-3.5 h-3.5"></i>
                <span>${grade === 'S' ? 'Perfect!' : grade === 'A' ? 'Excellent' : grade === 'B' ? 'Good' : 'Keep Going'}</span>
            </div>
        </div>
    `;
    DOM.reportContainer.appendChild(card);
};

const updateGreeting = () => {
    const hour = new Date().getHours();
    let greeting = "Hello";
    if (hour >= 5 && hour < 12) greeting = "Good Morning";
    else if (hour >= 12 && hour < 18) greeting = "Good Afternoon";
    else greeting = "Good Evening";
    DOM.timeGreeting.textContent = greeting;
    DOM.userNameDisplay.textContent = userName;
};

window.editName = () => {
    DOM.userNameDisplay.classList.add('hidden');
    DOM.userNameInput.classList.remove('hidden');
    DOM.userNameInput.value = userName;
    DOM.userNameInput.focus();
};

window.saveName = () => {
    const newName = DOM.userNameInput.value.trim();
    if (newName) {
        userName = newName;
        localStorage.setItem('modern-todo-username', userName);
    }
    DOM.userNameInput.classList.add('hidden');
    DOM.userNameDisplay.classList.remove('hidden');
    updateGreeting();
};

window.handleNameKey = (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        DOM.userNameInput.blur();
    }
};

const showQuote = () => {
    const randomQuote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];
    DOM.quoteText.textContent = `"${randomQuote}"`;
    DOM.quoteOverlay.classList.remove('opacity-0', 'pointer-events-none');
    document.getElementById('quoteContent').classList.remove('scale-95');
    document.getElementById('quoteContent').classList.add('scale-100');
    lucide.createIcons();
};

window.closeQuote = () => {
    document.getElementById('quoteOverlay').classList.add('opacity-0', 'pointer-events-none');
    document.getElementById('quoteContent').classList.add('scale-95');
    document.getElementById('quoteContent').classList.remove('scale-100');
};

const updatePriorityBtnUI = () => {
    const config = PRIORITY_CONFIG[currentPriority];
    DOM.priorityBtn.className = `glass-input px-3 h-10 rounded-xl flex items-center gap-2 min-w-[80px] justify-center group transition-all border flex-1 sm:flex-none hover:bg-slate-50 ${config.color.replace('bg-', 'border-').replace('text-', 'text-')}`;
    DOM.priorityLabel.textContent = config.label;
    const icon = DOM.priorityBtn.querySelector('svg');
    if(icon) icon.setAttribute('class', `w-4 h-4 ${config.iconColor}`);
};

DOM.priorityBtn.addEventListener('click', () => {
    const currentIndex = priorities.indexOf(currentPriority);
    currentPriority = priorities[(currentIndex + 1) % priorities.length];
    updatePriorityBtnUI();
});

const triggerConfetti = () => {
    const colors = ['#7c3aed', '#3b82f6', '#ec4899', '#f59e0b', '#10b981'];
    for (let i = 0; i < 100; i++) {
        const p = document.createElement('div');
        p.style.cssText = `position:fixed;left:50%;top:50%;width:8px;height:8px;background:${colors[Math.floor(Math.random()*colors.length)]};border-radius:50%;pointer-events:none;z-index:100`;
        document.body.appendChild(p);
        const angle = Math.random() * Math.PI * 2;
        const velocity = Math.random() * 200 + 50;
        const anim = p.animate([
            { transform: 'translate(0,0) scale(1)', opacity: 1 },
            { transform: `translate(${Math.cos(angle)*velocity}px, ${Math.sin(angle)*velocity}px) scale(0)`, opacity: 0 }
        ], { duration: 1000, easing: 'cubic-bezier(0, .9, .57, 1)' });
        anim.onfinish = () => p.remove();
    }
};

const formatDate = (date) => new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(date);
const formatTimeDisplay = (timeStr) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    const h = parseInt(hours, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    return `${h % 12 || 12}:${minutes} ${ampm}`;
};
const isSameDay = (d1, d2) => d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
const getRelativeLabel = (date) => {
    const today = new Date();
    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
    const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
    if (isSameDay(date, today)) return 'Today';
    if (isSameDay(date, yesterday)) return 'Yesterday';
    if (isSameDay(date, tomorrow)) return 'Tomorrow';
    return '';
};
const pad = (n) => n.toString().padStart(2, '0');

const saveTasks = () => localStorage.setItem('modern-todo-tasks', JSON.stringify(tasks));

const updateUI = () => {
    const streak = calculateStreak();
    DOM.streakCount.textContent = streak;

    if (!isDailyView) return;
    
    updateGreeting(); 
    DOM.dateDisplay.textContent = formatDate(currentDate);
    const label = getRelativeLabel(currentDate);
    DOM.dateLabel.textContent = label || "Date";
    DOM.todayBtn.classList.toggle('hidden', label === 'Today');
    
    if (window.innerWidth >= 768) {
            DOM.todayBtn.classList.toggle('hidden', isSameDay(currentDate, new Date()));
            DOM.todayBtn.classList.toggle('md:block', !isSameDay(currentDate, new Date()));
    }
    
    const year = currentDate.getFullYear();
    const month = pad(currentDate.getMonth() + 1);
    const day = pad(currentDate.getDate());
    DOM.datePicker.value = `${year}-${month}-${day}`;
    
    const currentTasks = tasks.filter(t => isSameDay(new Date(t.date), currentDate));
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    currentTasks.sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        const pA = priorityOrder[a.priority || 'low'];
        const pB = priorityOrder[b.priority || 'low'];
        return pB - pA || new Date(a.createdAt) - new Date(b.createdAt);
    });
    
    const total = currentTasks.length;
    const completed = currentTasks.filter(t => t.completed).length;
    const progress = total === 0 ? 0 : Math.round((completed / total) * 100);
    DOM.progressBar.style.width = `${progress}%`;
    DOM.progressPercent.textContent = `${progress}%`;
    DOM.progressText.textContent = `${completed}/${total} goals completed`;

    DOM.taskList.innerHTML = '';
    if (currentTasks.length === 0) {
        DOM.taskList.innerHTML = `
            <div class="h-40 flex flex-col items-center justify-center text-slate-400 animate-slide-up">
                <div class="bg-slate-100 p-4 rounded-full mb-3 shadow-sm"><i data-lucide="sparkles" class="w-8 h-8 text-yellow-500"></i></div>
                <p class="font-medium text-slate-500">No goals set for this day.</p>
            </div>`;
    } else {
        currentTasks.forEach(task => renderTask(task));
    }
    lucide.createIcons();
};

const renderTask = (task) => {
    const pConfig = PRIORITY_CONFIG[task.priority || 'low'];
    const div = document.createElement('div');
    div.className = `group glass-panel p-4 rounded-2xl border-l-4 transition-all duration-300 animate-slide-up bg-white ${task.completed ? 'border-l-green-400 bg-green-50/50 opacity-70' : pConfig.color.replace('text-', 'border-l-').replace('bg-', 'border-')}`;
    
    const mainRow = document.createElement('div');
    mainRow.className = "flex items-center gap-3 relative";
    
    const timeHtml = task.dueTime 
        ? `<div class="flex items-center gap-1 text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200"><i data-lucide="clock" class="w-3 h-3"></i>${formatTimeDisplay(task.dueTime)}</div>` : '';

    let timerDisplayHtml = '';
    let timerActive = false;
    if (task.timerEnd) {
        timerActive = true;
        const remaining = Math.max(0, Math.ceil((task.timerEnd - Date.now()) / 1000));
        const m = Math.floor(remaining / 60);
        const s = remaining % 60;
        timerDisplayHtml = `<span class="text-[10px] font-mono text-primary bg-purple-100 px-2 py-0.5 rounded border border-purple-200 animate-pulse ml-2">${pad(m)}:${pad(s)}</span>`;
    } else if (task.timerPaused) {
            const remaining = Math.ceil(task.timerPaused / 1000);
            const m = Math.floor(remaining / 60);
            const s = remaining % 60;
            timerDisplayHtml = `<span class="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded ml-2">${pad(m)}:${pad(s)} (Paused)</span>`;
    }

    mainRow.innerHTML = `
        <button onclick="toggleTask('${task.id}')" class="check-btn flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${task.completed ? 'bg-green-500 border-green-500 scale-110 shadow-sm' : 'border-slate-300 hover:border-primary bg-white'}">
            ${task.completed ? '<i data-lucide="check" class="w-3.5 h-3.5 text-white" stroke-width="4"></i>' : ''}
        </button>
        
        <div class="flex-1 min-w-0 cursor-pointer" onclick="toggleTimerPanel('${task.id}')">
            <div class="flex items-center gap-2 mb-1 flex-wrap">
                <span class="text-[10px] font-bold px-1.5 py-0.5 rounded border ${pConfig.color}">${pConfig.label}</span>
                ${timeHtml}
                ${timerDisplayHtml}
            </div>
            <div class="text-sm font-medium break-words transition-all duration-300 ${task.completed ? 'text-slate-400 line-through' : 'text-slate-800'} md:text-base">${escapeHtml(task.text)}</div>
        </div>

        <div class="flex items-center gap-1">
            <button onclick="toggleTimerPanel('${task.id}')" class="p-2 text-slate-400 hover:text-primary hover:bg-slate-100 rounded-lg transition-colors" title="Focus Timer">
                <i data-lucide="timer" class="w-4 h-4"></i>
            </button>
            <button onclick="deleteTask('${task.id}')" class="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
        </div>
    `;
    div.appendChild(mainRow);

    if (expandedTimerId === task.id) {
        const timerPanel = document.createElement('div');
        timerPanel.className = "mt-3 pt-3 border-t border-slate-100 animate-slide-up";
        
        const isRunning = !!task.timerEnd;
        const remainingMs = isRunning ? task.timerEnd - Date.now() : (task.timerPaused || (task.defaultTimerDuration || 0));
        const remainingSecs = Math.max(0, Math.ceil(remainingMs / 1000));
        
        if (isRunning || task.timerPaused) {
                const m = Math.floor(remainingSecs / 60);
                const s = remainingSecs % 60;
                
                timerPanel.innerHTML = `
                <div class="flex items-center justify-between bg-slate-50 rounded-lg p-2 border border-slate-200">
                    <div class="text-2xl font-mono font-bold text-slate-800 tracking-wider ml-2">
                        ${pad(m)}:${pad(s)}
                    </div>
                    <div class="flex gap-2">
                        ${isRunning 
                            ? `<button onclick="pauseTimer('${task.id}')" class="p-2 bg-yellow-100 text-yellow-600 rounded-lg hover:bg-yellow-200"><i data-lucide="pause" class="w-4 h-4"></i></button>`
                            : `<button onclick="resumeTimer('${task.id}')" class="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200"><i data-lucide="play" class="w-4 h-4"></i></button>`
                        }
                        <button onclick="stopTimer('${task.id}')" class="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"><i data-lucide="square" class="w-4 h-4"></i></button>
                    </div>
                </div>
                `;
        } else {
            const defMin = Math.floor((task.defaultTimerDuration || 1500000) / 60000); 
            const defSec = Math.floor(((task.defaultTimerDuration || 1500000) % 60000) / 1000);
            
            timerPanel.innerHTML = `
                <div class="flex items-center gap-2">
                    <div class="flex-1 flex items-center bg-white rounded-lg border border-slate-200 p-1 shadow-sm">
                        <input type="number" id="t-min-${task.id}" value="${pad(defMin)}" min="0" max="999" class="bg-transparent w-full text-center focus:outline-none text-sm text-slate-800" placeholder="Min">
                        <span class="text-slate-400 text-xs">:</span>
                        <input type="number" id="t-sec-${task.id}" value="${pad(defSec)}" min="0" max="59" class="bg-transparent w-full text-center focus:outline-none text-sm text-slate-800" placeholder="Sec">
                    </div>
                    <button onclick="startTimer('${task.id}')" class="px-4 py-1.5 bg-primary hover:bg-primary-dark text-white text-sm font-medium rounded-lg shadow-md shadow-primary/20 transition-colors">
                        Start
                    </button>
                </div>
                <div class="flex gap-2 mt-2 justify-center">
                        <button onclick="quickSetTimer('${task.id}', 5)" class="text-[10px] px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors">+5m</button>
                        <button onclick="quickSetTimer('${task.id}', 10)" class="text-[10px] px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors">+10m</button>
                        <button onclick="quickSetTimer('${task.id}', 25)" class="text-[10px] px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors">+25m</button>
                </div>
            `;
        }
        div.appendChild(timerPanel);
    }
    
    DOM.taskList.appendChild(div);
};

const escapeHtml = (unsafe) => unsafe.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");

window.openCalendar = () => { try { DOM.datePicker.showPicker(); } catch (e) { DOM.datePicker.click(); } };
window.changeDate = (d) => { currentDate.setDate(currentDate.getDate() + d); currentDate = new Date(currentDate); updateUI(); };
DOM.datePicker.addEventListener('change', (e) => { if(e.target.value) { const p=e.target.value.split('-'); currentDate = new Date(p[0], p[1]-1, p[2]); updateUI(); } });
window.goToToday = () => { currentDate = new Date(); updateUI(); };

window.toggleTask = (id) => {
    const t = tasks.find(x => x.id === id);
    if(t) { 
        t.completed = !t.completed; 
        if(t.completed) { 
            triggerConfetti(); 
            
            const nowStr = getLocalDateStr(new Date());
            const tasksToday = tasks.filter(task => {
                const d = new Date(task.date);
                return getLocalDateStr(d) === nowStr;
            });
            
            const allDone = tasksToday.length > 0 && tasksToday.every(task => task.completed);
            
            if (allDone && isSameDay(new Date(t.date), new Date())) {
                showStreakPopup();
            } else {
                showQuote();
            }

            sendNotification('Goal Completed! 🎉', `You completed: ${t.text}`);
        } 
        saveTasks(); 
        updateUI(); 
    }
};
window.deleteTask = (id) => { tasks = tasks.filter(t => t.id !== id); saveTasks(); updateUI(); };

window.toggleTimerPanel = (id) => { expandedTimerId = expandedTimerId === id ? null : id; updateUI(); };

window.startTimer = (id) => {
    const min = parseInt(document.getElementById(`t-min-${id}`).value) || 0;
    const sec = parseInt(document.getElementById(`t-sec-${id}`).value) || 0;
    const duration = (min * 60 + sec) * 1000;
    if (duration <= 0) return;

    const task = tasks.find(t => t.id === id);
    task.defaultTimerDuration = duration; 
    task.timerEnd = Date.now() + duration;
    task.timerPaused = null;
    saveTasks();
    updateUI();
};

window.pauseTimer = (id) => {
    const task = tasks.find(t => t.id === id);
    if (task.timerEnd) {
        task.timerPaused = Math.max(0, task.timerEnd - Date.now());
        task.timerEnd = null;
        saveTasks();
        updateUI();
    }
};

window.resumeTimer = (id) => {
    const task = tasks.find(t => t.id === id);
    if (task.timerPaused) {
        task.timerEnd = Date.now() + task.timerPaused;
        task.timerPaused = null;
        saveTasks();
        updateUI();
    }
};

window.stopTimer = (id) => {
    const task = tasks.find(t => t.id === id);
    task.timerEnd = null;
    task.timerPaused = null;
    saveTasks();
    updateUI();
};

window.quickSetTimer = (id, mins) => {
        document.getElementById(`t-min-${id}`).value = pad(mins);
        document.getElementById(`t-sec-${id}`).value = "00";
};

const addTask = (e) => {
    e.preventDefault();
    const text = DOM.taskInput.value.trim();
    if (!text) return;

    tasks.push({
        id: crypto.randomUUID(),
        text: text,
        priority: currentPriority, 
        dueTime: DOM.timeInput.value,
        completed: false,
        notified: false,
        date: currentDate.toISOString(), 
        createdAt: new Date().toISOString()
    });
    DOM.taskInput.value = ''; DOM.timeInput.value = '';
    saveTasks(); updateUI(); addToast('Goal added successfully', 'success');
};

setInterval(() => {
    const now = new Date();
    const nowMs = Date.now();
    let uiNeedsUpdate = false;

    tasks.forEach(t => {
        if (!t.completed && t.dueTime && !t.notified) {
            const d = new Date(t.date);
            if (isSameDay(d, now) && now.toTimeString().slice(0,5) >= t.dueTime) {
                sendNotification("Time's Up! ⏰", `Deadline for "${t.text}" reached!`);
                t.notified = true;
                saveTasks();
            }
        }

        if (t.timerEnd) {
            uiNeedsUpdate = true; 
            if (nowMs >= t.timerEnd) {
                t.timerEnd = null;
                t.timerPaused = null;
                sendNotification("Timer Finished! ⌛️", `Time is up for goal: "${t.text}"`);
                triggerConfetti(); 
                saveTasks();
            }
        }
    });
    
    if (uiNeedsUpdate && isDailyView && document.activeElement.tagName !== 'INPUT') updateUI();
}, 1000);

const addToast = (msg, type = 'info') => {
    const el = document.createElement('div');
    const color = type === 'success' ? 'text-green-600' : 'text-blue-600';
    const bg = type === 'success' ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200';
    const icon = type === 'success' ? 'check-circle' : 'info';
    el.className = `glass-panel border ${bg} backdrop-blur-md px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 animate-slide-up pointer-events-auto`;
    el.innerHTML = `<i data-lucide="${icon}" class="w-4 h-4 ${color}"></i><span class="text-sm font-medium text-slate-800">${msg}</span>`;
    DOM.toastContainer.appendChild(el);
    lucide.createIcons();
    setTimeout(() => {
        el.style.opacity = '0';
        setTimeout(() => el.remove(), 300);
    }, 3000);
};

const sendNotification = (title, body) => {
    addToast(body);
    if (notifPermission === 'granted') new Notification(title, { body, icon: 'https://cdn-icons-png.flaticon.com/512/1486/1486433.png' });
};

DOM.notifBtn.addEventListener('click', async () => {
    if (typeof Notification !== 'undefined') {
        const p = await Notification.requestPermission();
        notifPermission = p;
        updateNotifIcon();
        if (p === 'granted') { 
            addToast('Notifications enabled!', 'success'); 
        } else {
            addToast('Notifications denied.', 'error');
        }
    } else {
        addToast('Not supported in this browser', 'error');
    }
});

const updateNotifIcon = () => {
    if (notifPermission === 'granted') { 
        DOM.notifBtn.classList.replace('text-slate-400', 'text-green-500'); 
        DOM.notifBtn.classList.add('shadow-[0_0_10px_rgba(34,197,94,0.3)]');
    } else {
        DOM.notifBtn.classList.replace('text-green-500', 'text-slate-400');
        DOM.notifBtn.classList.remove('shadow-[0_0_10px_rgba(34,197,94,0.3)]');
    }
}

DOM.form.addEventListener('submit', addTask);
DOM.taskInput.addEventListener('input', (e) => {
    const hasText = e.target.value.trim().length > 0;
    DOM.addBtn.disabled = !hasText;
    if(hasText) DOM.addBtn.classList.remove('opacity-50', 'cursor-not-allowed'); else DOM.addBtn.classList.add('opacity-50', 'cursor-not-allowed');
});

updateNotifIcon();
updateUI();
