// --- Toast Notification System ---
const addToast = (message, type = 'success') => {
    const container = document.getElementById('toastContainer');
    const el = document.createElement('div');
    
    // Clean Light Theme Toast
    const bgClass = 'bg-white border-slate-100';
    const textClass = type === 'success' ? 'text-emerald-600' : (type === 'error' ? 'text-rose-600' : 'text-blue-600');
    const iconClass = type === 'success' ? 'bg-emerald-50 text-emerald-600' : (type === 'error' ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600');
    const iconName = type === 'success' ? 'check' : (type === 'error' ? 'alert-circle' : 'info');
    
    el.className = `pointer-events-auto ${bgClass} p-4 rounded-xl shadow-xl shadow-slate-200/50 border flex items-center gap-3 animate-slide-up min-w-[320px]`;
    el.innerHTML = `
        <div class="p-1.5 rounded-full ${iconClass} shrink-0">
            <i data-lucide="${iconName}" class="w-4 h-4"></i>
        </div>
        <span class="text-sm font-semibold text-slate-700">${message}</span>
    `;
    
    container.appendChild(el);
    if(window.lucide) lucide.createIcons();
    
    setTimeout(() => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(-10px)';
        setTimeout(() => el.remove(), 300);
    }, 3000);
};

// --- Logic Class ---
class ExpenseTracker {
    constructor() {
        this.storageKey = 'horizon_finance_v1';
        this.allTransactions = this.loadData();
        this.chart = null;
        this.deleteTransactionId = null;
        this.currentMonth = new Date().getMonth();
        this.currentYear = new Date().getFullYear();
        
        this.categoryIcons = {
            'Room Rent': '🏠', 'Rashan': '🍚', 'Food': '🍔', 'Transport': '🚕', 'Education': '📚',
            'Shopping': '🛍️', 'Entertainment': '🎬', 'Recharge': '📱', 'Others': '🔧', 
            'Pocket Money': '💰', 'Borrow': '🤝', 'Savings': '💎', 'Salary': '💼', 'Gift': '🎁'
        };
        
        this.monthNames = [
            'January','February','March','April','May','June',
            'July','August','September','October','November','December'
        ];
        
        this.init();
    }

    loadData() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : [];
        } catch(e) {
            console.error('Load error', e);
            return [];
        }
    }

    saveData() {
        try { localStorage.setItem(this.storageKey, JSON.stringify(this.allTransactions)); }
        catch(e){ console.error('Save error', e); addToast('Unable to save data', 'error'); }
    }

    init() {
        this.bindEvents();
        this.setDefaultDates();
        this.updateMonthDisplay();
        this.updateAll();
        if(window.lucide) lucide.createIcons();
        switchTab('income');
    }

    setDefaultDates() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('incomeDate').value = today;
        document.getElementById('expenseDate').value = today;
    }

    bindEvents() {
        document.getElementById('incomeForm').addEventListener('submit', (e) => { e.preventDefault(); this.addTransaction('income'); });
        document.getElementById('expenseForm').addEventListener('submit', (e) => { e.preventDefault(); this.addTransaction('expense'); });
        document.getElementById('prevMonth').addEventListener('click', () => this.navigateMonth(-1));
        document.getElementById('nextMonth').addEventListener('click', () => this.navigateMonth(1));
        document.getElementById('generateData').addEventListener('click', () => this.generateEnhancedPDF());
    }

    navigateMonth(dir) {
        this.currentMonth += dir;
        if(this.currentMonth > 11){ this.currentMonth = 0; this.currentYear++; }
        else if(this.currentMonth < 0){ this.currentMonth = 11; this.currentYear--; }
        this.updateMonthDisplay(); 
        this.updateAll();
    }

    updateMonthDisplay() {
        const monthDisplay = document.getElementById('currentMonthDisplay');
        const monthStats = document.getElementById('monthStats');
        monthDisplay.textContent = `${this.monthNames[this.currentMonth]} ${this.currentYear}`;

        const tx = this.getCurrentMonthTransactions();
        if(tx.length === 0) monthStats.textContent = 'NO TRANSACTIONS';
        else {
            const count = tx.length;
            monthStats.textContent = `${count} ENTRY${count !== 1 ? 'IES' : ''}`;
        }
    }

    getCurrentMonthKey() { 
        return `${this.currentYear}-${String(this.currentMonth+1).padStart(2,'0')}`; 
    }

    getCurrentMonthTransactions() {
        const key = this.getCurrentMonthKey();
        return this.allTransactions.filter(t => {
            const d = new Date(t.timestamp);
            const k = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
            return k === key;
        });
    }

    addTransaction(type) {
        const formId = type === 'income' ? 'incomeForm' : 'expenseForm';
        const catId = type === 'income' ? 'incomeCategory' : 'expenseCategory';
        const amtId = type === 'income' ? 'incomeAmount' : 'expenseAmount';
        const dateId = type === 'income' ? 'incomeDate' : 'expenseDate';
        const descId = type === 'income' ? 'incomeDescription' : 'expenseDescription';

        const category = document.getElementById(catId).value;
        const amount = parseFloat(document.getElementById(amtId).value);
        const dateInput = document.getElementById(dateId).value;
        const description = document.getElementById(descId).value;

        if(!category || !amount || amount <= 0 || !dateInput) { 
            addToast('Please fill all required fields', 'error'); return; 
        }

        const d = new Date(dateInput + 'T00:00:00');
        const now = new Date(); 
        d.setHours(now.getHours(), now.getMinutes(), now.getSeconds());

        const tx = { 
            id: Date.now().toString(36) + Math.random().toString(36).slice(2), 
            type: type, 
            category: category,
            amount: amount, 
            description: description || '',
            date: d.toLocaleDateString('en-IN'), 
            timestamp: d.getTime() 
        };

        this.allTransactions.unshift(tx);
        this.saveData(); 
        this.updateAll();
        
        document.getElementById(formId).reset(); 
        this.setDefaultDates();
        document.getElementById(catId).selectedIndex = 0;
        
        addToast(`${type === 'income' ? 'Income' : 'Expense'} recorded`);
    }

    updateAll() { 
        this.updateSummary(); 
        this.renderTransactions(); 
        this.updateChart(); 
        if(window.lucide) lucide.createIcons();
    }

    updateSummary() {
        const tx = this.getCurrentMonthTransactions();
        const totalIncome = tx.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0);
        const totalExpenses = tx.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0);
        const balance = totalIncome - totalExpenses;

        document.getElementById('totalIncome').textContent = `₹${totalIncome.toLocaleString('en-IN')}`;
        document.getElementById('totalExpenses').textContent = `₹${totalExpenses.toLocaleString('en-IN')}`;
        document.getElementById('balance').textContent = `₹${balance.toLocaleString('en-IN')}`;

        const statusEl = document.getElementById('balanceStatus');
        
        if(balance > 0){
            statusEl.textContent = 'ON TRACK';
            statusEl.className = 'text-[11px] font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 uppercase tracking-wider';
        } else if(balance === 0){
            statusEl.textContent = 'NEUTRAL';
            statusEl.className = 'text-[11px] font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-500 uppercase tracking-wider';
        } else {
            statusEl.textContent = 'OVERSPENT';
            statusEl.className = 'text-[11px] font-bold px-3 py-1 rounded-full bg-rose-100 text-rose-700 uppercase tracking-wider';
        }

        const max = Math.max(totalIncome, totalExpenses) || 1;
        setTimeout(() => {
            document.getElementById('incomeBar').style.width = `${(totalIncome/max)*100}%`;
            document.getElementById('expenseBar').style.width = `${(totalExpenses/max)*100}%`;
        }, 100);
    }

    renderTransactions() {
        const list = document.getElementById('transactionsList');
        const count = document.getElementById('txCount');
        const tx = this.getCurrentMonthTransactions().sort((a,b) => b.timestamp - a.timestamp);

        count.textContent = `${tx.length}`;
        list.innerHTML = '';

        if(tx.length === 0) {
            list.innerHTML = `
                <div class="text-center text-slate-400 py-20 flex flex-col items-center">
                    <div class="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                        <i data-lucide="clipboard-list" class="w-8 h-8 text-slate-300"></i>
                    </div>
                    <p class="text-sm font-medium">No transactions found.</p>
                </div>
            `;
            return;
        }

        tx.forEach(t => {
            const icon = this.categoryIcons[t.category] || '💠';
            const isInc = t.type === 'income';
            const amountClass = isInc ? 'text-emerald-600' : 'text-slate-900';
            const bgIcon = isInc ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-white text-slate-500 border-slate-200';
            const sign = isInc ? '+' : '-';

            const div = document.createElement('div');
            div.className = `group relative flex items-center justify-between p-4 rounded-xl bg-white border border-slate-100 hover:border-indigo-200 hover:shadow-md transition-all duration-200`;
            
            div.innerHTML = `
                <div class="flex items-center gap-4 relative z-10 overflow-hidden">
                    <div class="w-10 h-10 rounded-xl flex items-center justify-center text-lg border ${bgIcon} shrink-0 shadow-sm">
                        ${icon}
                    </div>
                    <div class="min-w-0">
                        <div class="font-bold text-sm text-slate-800 truncate">${t.category}</div>
                        <div class="text-xs text-slate-500 truncate flex items-center gap-2 mt-0.5 font-medium">
                            <span>${t.date}</span>
                            ${t.description ? `<span class="w-1 h-1 rounded-full bg-slate-300"></span> <span class="text-slate-400">${t.description}</span>` : ''}
                        </div>
                    </div>
                </div>
                <div class="flex items-center gap-4 pl-2 relative z-10">
                    <span class="font-mono font-bold text-sm ${amountClass}">${sign}₹${t.amount.toLocaleString('en-IN')}</span>
                    <button onclick="expenseTracker.showDeleteModal('${t.id}')" class="opacity-0 group-hover:opacity-100 focus:opacity-100 p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </div>
            `;
            list.appendChild(div);
        });
    }

    updateChart() {
        const tx = this.getCurrentMonthTransactions();
        const expenses = tx.filter(t => t.type === 'expense');
        const container = document.getElementById('expenseBreakdown');
        const emptyState = document.getElementById('chartEmptyState');
        
        if(expenses.length === 0) {
            container.innerHTML = '<div class="text-center text-slate-400 py-12 text-sm">Add expenses to see breakdown.</div>';
            emptyState.classList.remove('hidden');
            if(this.chart) { this.chart.destroy(); this.chart = null; }
            return;
        }
        emptyState.classList.add('hidden');

        const byCat = {};
        expenses.forEach(t => { byCat[t.category] = (byCat[t.category] || 0) + t.amount; });
        const sortedCats = Object.entries(byCat).sort((a,b) => b[1] - a[1]);
        const totalExp = Object.values(byCat).reduce((a,b) => a+b, 0);

        const palette = ['#4f46e5', '#ec4899', '#06b6d4', '#f59e0b', '#10b981', '#8b5cf6', '#ef4444', '#3b82f6', '#6366f1', '#64748b'];

        container.innerHTML = sortedCats.map(([cat, amt], i) => {
            const pct = ((amt/totalExp)*100).toFixed(1);
            const color = palette[i % palette.length];
            return `
                <div class="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors group">
                    <div class="flex items-center gap-3 flex-1 min-w-0">
                        <div class="w-3 h-3 rounded-full shrink-0 shadow-sm" style="background-color: ${color}"></div>
                        <div class="flex-1 min-w-0">
                            <div class="flex justify-between items-baseline mb-1">
                                <span class="text-xs font-bold text-slate-700 truncate">${cat}</span>
                                <span class="text-[10px] font-semibold text-slate-400">${pct}%</span>
                            </div>
                            <div class="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                <div class="h-full" style="width: ${pct}%; background-color: ${color}"></div>
                            </div>
                        </div>
                    </div>
                    <div class="text-right pl-3">
                        <div class="text-xs font-bold text-slate-800 font-mono">₹${amt.toLocaleString('en-IN')}</div>
                    </div>
                </div>
            `;
        }).join('');

        const ctx = document.getElementById('expenseChart').getContext('2d');
        
        if(this.chart) this.chart.destroy();
        
        this.chart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: sortedCats.map(x => x[0]),
                datasets: [{
                    data: sortedCats.map(x => x[1]),
                    backgroundColor: palette,
                    borderWidth: 2,
                    borderColor: '#ffffff',
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '70%',
                plugins: { legend: { display: false } }
            }
        });
    }

    showDeleteModal(id) {
        const t = this.allTransactions.find(x => x.id === id);
        if(!t) return;
        this.deleteTransactionId = id;
        document.getElementById('transactionDetails').innerHTML = `
            <div class="flex justify-between items-center"><span class="text-slate-500">Category</span> <span class="text-slate-900 font-bold">${t.category}</span></div>
            <div class="flex justify-between items-center"><span class="text-slate-500">Amount</span> <span class="text-slate-900 font-mono font-bold text-lg">₹${t.amount}</span></div>
            <div class="flex justify-between items-center"><span class="text-slate-500">Date</span> <span class="text-slate-700 font-medium">${t.date}</span></div>
        `;
        document.getElementById('deleteModal').classList.remove('hidden');
    }

    hideDeleteModal() {
        document.getElementById('deleteModal').classList.add('hidden');
        this.deleteTransactionId = null;
    }

    performDelete() {
        if(!this.deleteTransactionId) return;
        this.allTransactions = this.allTransactions.filter(t => t.id !== this.deleteTransactionId);
        this.saveData();
        this.updateAll();
        this.hideDeleteModal();
        addToast('Transaction removed', 'success');
    }

    getAllMonthsSummary() {
        const monthly = {};
        this.allTransactions.forEach(t => {
            const d = new Date(t.timestamp);
            const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
            if(!monthly[key]) {
                monthly[key] = {
                    month: `${this.monthNames[d.getMonth()]} ${d.getFullYear()}`,
                    monthKey: key,
                    income: 0, expenses: 0, balance: 0, 
                    incomeTransactions: [], expenseTransactions: [], categories: {}
                };
            }
            const m = monthly[key];
            if(t.type === 'income') { 
                m.income += t.amount; 
                m.incomeTransactions.push(t); 
            } else { 
                m.expenses += t.amount; 
                m.expenseTransactions.push(t); 
                m.categories[t.category] = (m.categories[t.category] || 0) + t.amount; 
            }
            m.balance = m.income - m.expenses;
        });
        return Object.entries(monthly).sort(([a],[b]) => b.localeCompare(a)).map(([,v]) => v);
    }

    // --- CHART GENERATION (BAR CHART) ---
    async getChartImage(labels, data) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            canvas.width = 600; 
            canvas.height = 400;
            const ctx = canvas.getContext('2d');
            
            // Custom Bar Chart for PDF
            new Chart(ctx, {
                type: 'bar', // Horizontal Bar
                data: {
                    labels: labels,
                    datasets: [{
                        data: data,
                        backgroundColor: '#4f46e5', // Indigo bars
                        borderRadius: 4,
                        barThickness: 20
                    }]
                },
                options: {
                    indexAxis: 'y', // Horizontal Bars
                    animation: false, 
                    responsive: false,
                    plugins: { legend: { display: false } }, 
                    scales: {
                        x: { display: false }, // Hide Grid
                        y: { 
                            ticks: { font: { size: 14, weight: 'bold' }, color: '#334155' },
                            grid: { display: false }
                        }
                    },
                    layout: { padding: 10 }
                }
            });
            setTimeout(() => resolve(canvas.toDataURL('image/png')), 200);
        });
    }

    // ==========================================
    //   REDESIGNED PROFESSIONAL PDF GENERATION
    // ==========================================
    async generateEnhancedPDF() {
        const btn = document.getElementById('generateData');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i data-lucide="loader" class="animate-spin w-4 h-4"></i> Designing Report...';
        btn.disabled = true;
        if(window.lucide) lucide.createIcons();

        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF('p', 'mm', 'a4');
            const pageWidth = 210;
            const margin = 15;
            
            // --- Premium Midnight Blue & Gold Theme ---
            const colors = {
                brand: [15, 23, 42],        // Slate 900 (Midnight)
                brandAccent: [79, 70, 229], // Indigo 600
                gold: [217, 119, 6],        // Amber 600
                textMain: [30, 41, 59],     // Slate 800
                textMuted: [100, 116, 139], // Slate 500
                success: [16, 185, 129],    // Green
                danger: [220, 38, 38],      // Red
                bgLight: [248, 250, 252],   // Slate 50
                white: [255, 255, 255]
            };

            const currentKey = this.getCurrentMonthKey();
            const allMonthsData = this.getAllMonthsSummary();
            const m = allMonthsData.find(x => x.monthKey === currentKey) || {
                income: 0, expenses: 0, balance: 0, categories: {}, incomeTransactions: [], expenseTransactions: []
            };

            // === PAGE 1: EXECUTIVE DASHBOARD ===

            // 1. STUNNING GEOMETRIC HEADER (No Ugly Circles)
            doc.setFillColor(...colors.brand);
            doc.rect(0, 0, pageWidth, 60, 'F'); 
            
            // Geometric Accent (The "Tech Slash")
            // Draw a stylish polygon on the right side
            doc.setFillColor(30, 41, 59); // Lighter Slate Blue
            doc.triangle(140, 0, 210, 0, 210, 60, 'F'); 
            
            // Second Accent Layer (Indigo)
            doc.setFillColor(79, 70, 229); // Brand Indigo
            doc.triangle(190, 0, 210, 0, 210, 20, 'F');

            // Title with Gold Accent
            doc.setTextColor(255, 255, 255);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(28);
            doc.text('FINANCIAL STATEMENT', margin, 30);
            
            // Subtitle
            doc.setFontSize(11);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(226, 232, 240); 
            const reportDate = new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
            doc.text(`Generated on: ${reportDate}`, margin, 38);

            // Month Indicator
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(14);
            doc.setTextColor(255, 255, 255);
            // Right aligned text over the geometric pattern
            doc.text(this.monthNames[this.currentMonth].toUpperCase() + ' ' + this.currentYear, pageWidth - margin, 50, {align: 'right'});

            // Gold Separator Line
            doc.setDrawColor(...colors.gold);
            doc.setLineWidth(0.8);
            doc.line(0, 60, pageWidth, 60);

            let y = 75;

            // 2. The Big Three (Premium Stat Boxes)
            const metrics = [
                { label: 'TOTAL INCOME', val: m.income, col: colors.success },
                { label: 'TOTAL EXPENSE', val: m.expenses, col: colors.danger },
                { label: 'NET BALANCE', val: m.balance, col: colors.brandAccent }
            ];

            const cardW = (pageWidth - (margin * 2) - 10) / 3;
            const cardH = 35;

            metrics.forEach((metric, i) => {
                const x = margin + (i * (cardW + 5));
                
                // Box Shadow
                doc.setFillColor(226, 232, 240);
                doc.rect(x+1, y+1, cardW, cardH, 'F');

                // Main Box Body
                doc.setFillColor(...colors.white);
                doc.rect(x, y, cardW, cardH, 'F');

                // Colored Header Strip
                doc.setFillColor(...metric.col);
                doc.rect(x, y, cardW, 6, 'F');

                // Border
                doc.setDrawColor(226, 232, 240);
                doc.setLineWidth(0.3);
                doc.rect(x, y, cardW, cardH, 'D');

                // Label
                doc.setFontSize(8);
                doc.setTextColor(...colors.textMuted);
                doc.setFont('helvetica', 'bold');
                doc.text(metric.label, x + (cardW/2), y + 14, {align:'center'});

                // Value
                doc.setFontSize(14);
                doc.setTextColor(...colors.textMain);
                doc.text(`Rs. ${metric.val.toLocaleString('en-IN')}`, x + (cardW/2), y + 24, {align:'center'});
            });

            y += 50;

            // 3. Spending Analysis Section
            doc.setFontSize(16);
            doc.setTextColor(...colors.brand);
            doc.setFont('helvetica', 'bold');
            doc.text('Spending Breakdown', margin, y);
            
            // Gold Underline
            doc.setDrawColor(...colors.gold);
            doc.setLineWidth(1);
            doc.line(margin, y + 3, margin + 40, y + 3);
            doc.setDrawColor(226, 232, 240);
            doc.line(margin + 42, y + 3, pageWidth - margin, y + 3);
            
            y += 15;

            const cats = Object.entries(m.categories).sort((a,b) => b[1] - a[1]);

            if (cats.length > 0) {
                // A. Horizontal Bar Chart (Left)
                const chartImg = await this.getChartImage(cats.map(c=>c[0]), cats.map(c=>c[1]));
                // Draw Chart (Adjust size for horizontal bars)
                doc.addImage(chartImg, 'PNG', margin, y, 90, 70);

                // B. Detailed List (Right) - ALL Categories
                const listX = 120;
                let listY = y + 5;

                doc.setFontSize(10);
                doc.setTextColor(...colors.brand);
                doc.text('CATEGORY DETAILS', listX, listY);
                listY += 8;

                // Loop through ALL categories
                cats.forEach(([cat, amt], idx) => {
                    // Prevent overflow on first page
                    if (listY > 260) return; 

                    const pct = ((amt / m.expenses) * 100).toFixed(1);
                    
                    // Bullet Point
                    doc.setFillColor(...colors.brandAccent);
                    doc.circle(listX + 2, listY - 1, 1, 'F');

                    // Category Name
                    doc.setFontSize(9);
                    doc.setTextColor(...colors.textMain);
                    doc.setFont('helvetica', 'bold');
                    doc.text(cat, listX + 6, listY);

                    // Amount
                    doc.setFont('helvetica', 'normal');
                    doc.setTextColor(...colors.textMuted);
                    doc.text(`Rs. ${amt.toLocaleString('en-IN')}`, pageWidth - margin, listY, {align: 'right'});
                    
                    // Dotted Line
                    doc.setDrawColor(226, 232, 240);
                    doc.setLineWidth(0.1);
                    doc.line(listX, listY + 2, pageWidth - margin, listY + 2);

                    listY += 8;
                });

            } else {
                doc.setFontSize(11);
                doc.setTextColor(...colors.textMuted);
                doc.text("No spending data available.", margin, y + 10);
            }

            // Footer P1
            this.drawFooter(doc, 1, 1);

            // === PAGE 2+: LEDGERS ===
            doc.addPage();
            y = 20;

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(16);
            doc.setTextColor(...colors.brand);
            doc.text('Detailed Ledger', margin, y);
            y += 10;

            // 1. Income Table
            if (m.incomeTransactions.length > 0) {
                doc.setFontSize(12);
                doc.setTextColor(...colors.success);
                doc.text('Income Sources', margin, y);
                y += 3;

                doc.autoTable({
                    startY: y,
                    head: [['Date', 'Source', 'Note', 'Amount']],
                    body: m.incomeTransactions.map(t => [
                        t.date, 
                        t.category, 
                        t.description || '-', 
                        `Rs. ${t.amount.toLocaleString('en-IN')}`
                    ]),
                    theme: 'grid',
                    styles: { fontSize: 9, cellPadding: 3, textColor: colors.textMain, font: 'helvetica' },
                    headStyles: { fillColor: colors.success, textColor: [255,255,255], fontStyle: 'bold' },
                    columnStyles: { 3: { halign: 'right', fontStyle: 'bold' } },
                    margin: { left: margin, right: margin }
                });
                y = doc.lastAutoTable.finalY + 15;
            }

            // 2. Expense Table
            if (m.expenseTransactions.length > 0) {
                if (y > 240) { doc.addPage(); y = 20; }

                doc.setFontSize(12);
                doc.setTextColor(...colors.danger);
                doc.setFont('helvetica', 'bold');
                doc.text('Expense Breakdown', margin, y);
                y += 3;

                doc.autoTable({
                    startY: y,
                    head: [['Date', 'Category', 'Note', 'Amount']],
                    body: m.expenseTransactions.map(t => [
                        t.date, 
                        t.category, 
                        t.description || '-', 
                        `Rs. ${t.amount.toLocaleString('en-IN')}`
                    ]),
                    theme: 'grid',
                    styles: { fontSize: 9, cellPadding: 3, textColor: colors.textMain, font: 'helvetica' },
                    headStyles: { fillColor: colors.danger, textColor: [255,255,255], fontStyle: 'bold' },
                    columnStyles: { 3: { halign: 'right', fontStyle: 'bold' } },
                    margin: { left: margin, right: margin }
                });
            }

            // Global Footer
            const pageCount = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                this.drawFooter(doc, i, pageCount);
            }

            doc.save(`Financial_Report_${currentKey}.pdf`);
            addToast('Report Successfully Exported', 'success');

        } catch (err) {
            console.error(err);
            addToast('PDF Generation Error', 'error');
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    }

    drawFooter(doc, pageNum, totalPages) {
        const h = doc.internal.pageSize.getHeight();
        const w = doc.internal.pageSize.getWidth();
        
        doc.setDrawColor(226, 232, 240);
        doc.line(15, h-12, w-15, h-12);

        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.setFont('helvetica', 'normal');
        
        doc.text('Expense Manager Pro', 15, h - 7);
        doc.text(`Page ${pageNum} of ${totalPages}`, w / 2, h - 7, {align: 'center'});
        doc.text('thesumitdev.in', w - 15, h - 7, {align: 'right'});
    }
}

function switchTab(tab) {
    const incForm = document.getElementById('incomeForm');
    const expForm = document.getElementById('expenseForm');
    const tabInc = document.getElementById('tabIncome');
    const tabExp = document.getElementById('tabExpense');

    if(tab === 'income') {
        incForm.classList.remove('hidden');
        expForm.classList.add('hidden');
        tabInc.className = 'py-2.5 rounded-lg text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2 shadow-sm bg-white text-emerald-600 scale-105';
        tabExp.className = 'py-2.5 rounded-lg text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2 text-slate-500 hover:text-slate-700';
    } else {
        incForm.classList.add('hidden');
        expForm.classList.remove('hidden');
        tabInc.className = 'py-2.5 rounded-lg text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2 text-slate-500 hover:text-slate-700';
        tabExp.className = 'py-2.5 rounded-lg text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2 shadow-sm bg-white text-rose-600 scale-105';
    }
}

let expenseTracker;
document.addEventListener('DOMContentLoaded', () => {
    expenseTracker = new ExpenseTracker();
    window.expenseTracker = expenseTracker;
});
