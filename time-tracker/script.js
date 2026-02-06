let viewMode = 'week';
let anchorDate = new Date();
const TARGET_HOURS = 6;

const userNameDisplay = document.getElementById('userNameDisplay');
const dateRangeLabel = document.getElementById('dateRangeLabel');
const currentTag = document.getElementById('currentTag');
const studyForm = document.getElementById('studyForm');
const dateInput = document.getElementById('dateInput');
const hourInput = document.getElementById('hourInput');
const minuteInput = document.getElementById('minuteInput');
const totalHoursEl = document.getElementById('totalHours');
const avgHoursEl = document.getElementById('avgHours');
const daysMetEl = document.getElementById('daysMet');
const chartTitle = document.getElementById('chartTitle');
const avgLabel = document.getElementById('avgLabel');
const totalLabel = document.getElementById('totalLabel');
const progressCircle = document.getElementById('progressCircle');
const percentLabel = document.getElementById('percentLabel');
const targetMessage = document.getElementById('targetMessage');
const toast = document.getElementById('toast');
const toastMsg = document.getElementById('toastMessage');

let chart;
let currentDataPoints = [];
let currentLabels = [];

function init() {
    loadUser();
    dateInput.valueAsDate = new Date();
    initChart();
    refreshDashboard();
}

function loadUser() {
    const savedName = localStorage.getItem('studySyncUser') || 'Alex';
    userNameDisplay.textContent = savedName;
}

function changeName() {
    const newName = prompt("Enter your name:", userNameDisplay.textContent);
    if (newName && newName.trim()) {
        localStorage.setItem('studySyncUser', newName.trim());
        userNameDisplay.textContent = newName.trim();
    }
}

function setViewMode(mode) {
    viewMode = mode;
    document.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.classList.remove('active');
        if(btn.id.startsWith(mode)) btn.classList.add('active');
    });
    
    chartTitle.textContent = mode === 'week' ? 'Weekly Activity' : 'Monthly Activity';
    avgLabel.textContent = mode === 'week' ? 'Avg. Study' : 'Monthly Avg';
    totalLabel.textContent = mode === 'week' ? 'Total Focus' : 'Month Focus';

    refreshDashboard();
}

function navigateDate(direction) {
    if (viewMode === 'week') {
        anchorDate.setDate(anchorDate.getDate() + (direction * 7));
    } else {
        anchorDate.setMonth(anchorDate.getMonth() + direction);
    }
    refreshDashboard();
}

function getDailyData(date) {
    const key = `study_${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
    return parseFloat(localStorage.getItem(key)) || 0;
}

function saveDailyData(dateStr, hours) {
    const date = new Date(dateStr);
    const key = `study_${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
    localStorage.setItem(key, hours);
}

function refreshDashboard() {
    let labels = [];
    let dataPoints = [];
    let displayLabel = "";
    let isCurrent = false;
    const today = new Date();

    if (viewMode === 'week') {
        const day = anchorDate.getDay();
        const diff = anchorDate.getDate() - day + (day === 0 ? -6 : 1);
        const startOfWeek = new Date(anchorDate);
        startOfWeek.setDate(diff);
        startOfWeek.setHours(0,0,0,0);

        for (let i = 0; i < 7; i++) {
            const d = new Date(startOfWeek);
            d.setDate(startOfWeek.getDate() + i);
            labels.push(d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }));
            dataPoints.push(getDailyData(d));
        }
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        displayLabel = `${formatDate(startOfWeek)} - ${formatDate(endOfWeek)}`;
        if (today >= startOfWeek && today <= endOfWeek) isCurrent = true;
    } else {
        const year = anchorDate.getFullYear();
        const month = anchorDate.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        for (let i = 1; i <= daysInMonth; i++) {
            const d = new Date(year, month, i);
            labels.push(i);
            dataPoints.push(getDailyData(d));
        }
        displayLabel = anchorDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        if (today.getMonth() === month && today.getFullYear() === year) isCurrent = true;
    }

    currentLabels = labels;
    currentDataPoints = dataPoints;
    dateRangeLabel.textContent = displayLabel;
    isCurrent ? currentTag.classList.remove('hidden') : currentTag.classList.add('hidden');

    updateStats(dataPoints);
    updateChart(labels, dataPoints);
    updateTodayProgress();
}

function formatDate(date) {
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
}

function updateStats(data) {
    const total = data.reduce((a, b) => a + b, 0);
    const avg = total / data.length;
    const metCount = data.filter(h => h >= TARGET_HOURS).length;

    totalHoursEl.textContent = total.toFixed(1);
    avgHoursEl.textContent = avg.toFixed(1);
    daysMetEl.textContent = metCount;
}

function updateTodayProgress() {
    const today = new Date();
    const hours = getDailyData(today);
    const percentage = Math.min(100, (hours / TARGET_HOURS) * 100);
    
    const circumference = 534;
    const offset = circumference - (percentage / 100) * circumference;
    
    progressCircle.style.strokeDashoffset = offset;
    percentLabel.textContent = `${Math.round(percentage)}%`;

    if (hours === 0) targetMessage.textContent = "Your potential is waiting for today.";
    else if (hours < TARGET_HOURS) targetMessage.textContent = `${(TARGET_HOURS - hours).toFixed(1)}h remaining to achieve balance.`;
    else targetMessage.textContent = "Daily standard surpassed. Outstanding discipline. 🏆";
}

function initChart() {
    const ctx = document.getElementById('studyChart').getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, 'rgba(99, 102, 241, 0.25)');
    gradient.addColorStop(1, 'rgba(99, 102, 241, 0)');

    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Hours Studied',
                    data: [],
                    borderColor: '#6366f1',
                    borderWidth: 4,
                    pointBackgroundColor: '#fff',
                    pointBorderColor: '#6366f1',
                    pointBorderWidth: 3,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    tension: 0.45,
                    fill: true,
                    backgroundColor: gradient,
                },
                {
                    label: 'Target',
                    data: [],
                    borderColor: 'rgba(79, 70, 229, 0.2)',
                    borderDash: [6, 6],
                    borderWidth: 2,
                    pointRadius: 0,
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { 
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#0f172a',
                    padding: 16,
                    titleFont: { size: 11, weight: 'bold' },
                    bodyFont: { size: 13, weight: '900' },
                    cornerRadius: 12,
                    displayColors: false,
                    callbacks: { label: (ctx) => `${ctx.raw.toFixed(1)} HOURS` }
                }
            },
            scales: {
                y: { 
                    beginAtZero: true, 
                    ticks: { font: { size: 10, weight: '700' }, color: '#94a3b8', padding: 10 },
                    grid: { color: '#f1f5f9', drawBorder: false }
                },
                x: { 
                    ticks: { font: { size: 10, weight: '700' }, color: '#94a3b8', padding: 10 },
                    grid: { display: false } 
                }
            }
        }
    });
}

function updateChart(labels, data) {
    chart.data.labels = labels;
    chart.data.datasets[0].data = data;
    chart.data.datasets[1].data = Array(labels.length).fill(TARGET_HOURS);
    chart.options.scales.y.max = Math.max(8, ...data) + 1;
    chart.update();
}

async function exportDataToPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'pt', 'a4');
    const userName = userNameDisplay.textContent;
    const range = dateRangeLabel.textContent;
    
    // Helper function to convert decimal hours to "Xh Ym"
    const formatTime = (decimalHours) => {
        const h = Math.floor(decimalHours);
        const m = Math.round((decimalHours - h) * 60);
        return `${h}h ${m}m`;
    };

    const totalStr = formatTime(parseFloat(totalHoursEl.textContent));
    const avgStr = formatTime(parseFloat(avgHoursEl.textContent));
    const goals = daysMetEl.textContent + " DAYS";

    // Header Design
    doc.setFillColor(15, 23, 42); // Dark Slate
    doc.rect(0, 0, 595, 160, 'F');
    
    // Decorative accent line
    doc.setFillColor(99, 102, 241); // Indigo accent
    doc.rect(0, 157, 595, 3, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.text("StudySync", 40, 70);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text("Personal Productivity Report", 40, 90);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(99, 102, 241);
    doc.text("STUDENT PROFILE", 40, 125);
    doc.text("REPORT PERIOD", 240, 125);
    doc.text("GENERATED ON", 440, 125);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.text(userName.toUpperCase(), 40, 140);
    doc.text(range.toUpperCase(), 240, 140);
    doc.text(new Date().toLocaleDateString().toUpperCase(), 440, 140);

    // Stats Cards
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text("Performance Overview", 40, 200);

    // Background for stats
    doc.setFillColor(248, 250, 252); 
    doc.roundedRect(40, 215, 515, 85, 10, 10, 'F');

    // Stats Labels
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text("TOTAL FOCUS TIME", 70, 245);
    doc.text("AVERAGE SESSION", 240, 245);
    doc.text("GOALS COMPLETED", 410, 245);

    // Stats Values
    doc.setFontSize(20);
    doc.setTextColor(79, 70, 229); // Indigo
    doc.text(totalStr, 70, 275);
    doc.text(avgStr, 240, 275);
    doc.setTextColor(16, 185, 129); // Emerald
    doc.text(goals, 410, 275);

    // Activity Table
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text("Daily Activity Logs", 40, 340);

    const tableRows = currentLabels.map((label, index) => {
        const hours = currentDataPoints[index];
        const status = hours >= TARGET_HOURS ? "GOAL MET" : "INCOMPLETE";
        return [label, formatTime(hours), status];
    });

    doc.autoTable({
        startY: 355,
        head: [['DATE', 'TIME LOGGED', 'STATUS']],
        body: tableRows,
        theme: 'striped',
        headStyles: { 
            fillColor: [15, 23, 42], 
            fontSize: 10,
            halign: 'left',
            cellPadding: 12
        },
        alternateRowStyles: {
            fillColor: [250, 251, 254]
        },
        columnStyles: {
            0: { cellWidth: 200 },
            1: { cellWidth: 150 },
            2: { halign: 'right', fontStyle: 'bold' }
        },
        styles: { 
            fontSize: 9, 
            cellPadding: 10, 
            font: 'helvetica',
            lineColor: [241, 245, 249],
            lineWidth: 0.5
        },
        didDrawCell: (data) => {
            if (data.section === 'body' && data.column.index === 2) {
                if (data.cell.raw === "GOAL MET") {
                    doc.setTextColor(16, 185, 129);
                } else {
                    doc.setTextColor(239, 68, 68);
                }
            }
        }
    });

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text("STUDYSYNC PERFORMANCE REPORT - CONFIDENTIAL", 40, 810);
        doc.text(`PAGE ${i} OF ${pageCount}`, 520, 810);
        
        // Final signature line
        doc.setDrawColor(226, 232, 240);
        doc.line(40, 800, 555, 800);
    }

    doc.save(`StudySync_Report_${userName}_${new Date().toISOString().split('T')[0]}.pdf`);
    showToast("PDF REPORT GENERATED");
}

function showToast(message) {
    toastMsg.textContent = message;
    toast.classList.remove('translate-y-32', 'opacity-0');
    toast.classList.add('translate-y-0', 'opacity-100');
    setTimeout(() => {
        toast.classList.add('translate-y-32', 'opacity-0');
        toast.classList.remove('translate-y-0', 'opacity-100');
    }, 3000);
}

studyForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const dateStr = dateInput.value;
    const h = parseInt(hourInput.value) || 0;
    const m = parseInt(minuteInput.value) || 0;
    const totalHours = h + (m / 60);

    if (!dateStr || totalHours < 0 || totalHours > 24) {
        showToast("INVALID TIME ENTRY");
        return;
    }

    saveDailyData(dateStr, totalHours);
    refreshDashboard();
    
    showToast("SESSION LOGGED");

    hourInput.value = '';
    minuteInput.value = '';
});

window.onload = init;
