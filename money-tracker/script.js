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
        
        // Initial tab setup
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
        // Animate bars slightly
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
        
        const totalExp = Object.values(byCat).reduce((a,b) => a+b, 0);
        const sortedCats = Object.entries(byCat).sort((a,b) => b[1] - a[1]);

        // High Contrast Bright Palette
        const palette = [
            '#4f46e5', // Indigo
            '#ec4899', // Pink
            '#06b6d4', // Cyan
            '#f59e0b', // Amber
            '#10b981', // Emerald
            '#8b5cf6', // Violet
            '#ef4444', // Red
            '#3b82f6', // Blue
            '#6366f1', 
            '#64748b'  // Slate
        ];

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
        const labels = sortedCats.map(x => x[0]);
        const data = sortedCats.map(x => x[1]);
        
        if(this.chart) this.chart.destroy();
        
        Chart.defaults.color = '#64748b';
        Chart.defaults.borderColor = '#e2e8f0';
        Chart.defaults.font.family = "'Plus Jakarta Sans', sans-serif";
        Chart.defaults.font.weight = "600";

        this.chart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
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
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: '#ffffff',
                        titleColor: '#1e293b',
                        bodyColor: '#475569',
                        padding: 12,
                        cornerRadius: 8,
                        displayColors: true,
                        borderColor: '#e2e8f0',
                        borderWidth: 1,
                        boxPadding: 4,
                        bodyFont: { weight: 'bold' }
                    }
                }
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
            ${t.description ? `<div class="pt-2 mt-2 border-t border-slate-200 text-xs text-slate-500 italic">"${t.description}"</div>` : ''}
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
                    income: 0, expenses: 0, balance: 0, transactionCount: 0,
                    incomeTransactions: [], expenseTransactions: [], categories: {}
                };
            }
            const m = monthly[key];
            m.transactionCount++;
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

    async getChartImage(labels, data) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            canvas.width = 400; 
            canvas.height = 200;
            const ctx = canvas.getContext('2d');
            
            const chart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: labels,
                    datasets: [{
                        data: data,
                        backgroundColor: [
                            '#4f46e5', '#ec4899', '#06b6d4', '#f59e0b', '#10b981', 
                            '#8b5cf6', '#ef4444', '#3b82f6', '#6366f1', '#64748b'
                        ],
                        borderWidth: 0
                    }]
                },
                options: {
                    animation: false, 
                    responsive: false,
                    plugins: {
                        legend: { 
                            display: true, 
                            position: 'right',
                            labels: { font: { size: 14, weight: 'bold' } }
                        } 
                    }
                }
            });
            
            setTimeout(() => {
                const img = chart.toBase64Image();
                chart.destroy();
                resolve(img);
            }, 200);
        });
    }

    // --- ENHANCED PDF GENERATION LOGIC ---
    async generateEnhancedPDF() {
        const btn = document.getElementById('generateData');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i data-lucide="loader" class="animate-spin w-4 h-4"></i> Designing PDF...';
        btn.disabled = true;
        if(window.lucide) lucide.createIcons();
    
        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF('p', 'mm', 'a4'); // A4 size: 210 x 297 mm
            
            // --- Design Constants ---
            const colors = {
                primary: [79, 70, 229],   // Indigo 600
                primaryBg: [238, 242, 255], // Indigo 50
                success: [16, 185, 129],  // Emerald 500
                successBg: [236, 253, 245], // Emerald 50
                danger: [244, 63, 94],    // Rose 500
                dangerBg: [255, 241, 242],  // Rose 50
                text: [30, 41, 59],       // Slate 800
                textLight: [100, 116, 139], // Slate 500
                white: [255, 255, 255],
                border: [226, 232, 240]   // Slate 200
            };
    
            const margin = 15;
            let yPos = 0;
    
            // ==========================================
            // PART 1: NEW BEAUTIFUL FIRST PAGE DESIGN
            // ==========================================
            
            // --- Header Section ---
            doc.setFillColor(...colors.primary);
            doc.rect(0, 0, 210, 50, 'F'); // Header Banner
    
            doc.setTextColor(...colors.white);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(26);
            doc.text('FINANCIAL REPORT', margin, 25);
    
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(12);
            doc.setTextColor(224, 231, 255); // Lighter Indigo
            const dateStr = new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            doc.text(`Generated on: ${dateStr}`, margin, 34);
    
            // Logo/Icon placeholder (Right side)
            doc.setFillColor(255, 255, 255, 0.2);
            doc.circle(185, 25, 12, 'F');
            doc.setFontSize(16);
            doc.text('$', 183, 27); // Simple currency symbol as logo
    
            yPos = 65;
    
            // --- Summary Cards ---
            // Get Data
            const allMonthsData = this.getAllMonthsSummary();
            const currentKey = this.getCurrentMonthKey();
            const mData = allMonthsData.find(m => m.monthKey === currentKey) || { income: 0, expenses: 0, balance: 0, incomeTransactions: [], expenseTransactions: [], categories: {} };
    
            const cardWidth = 55;
            const cardHeight = 30;
            const gap = (210 - (margin * 2) - (cardWidth * 3)) / 2;
    
            // Card 1: Income
            this.drawCard(doc, margin, yPos, cardWidth, cardHeight, colors.successBg, colors.success, 'TOTAL INCOME', mData.income);
            
            // Card 2: Expenses
            this.drawCard(doc, margin + cardWidth + gap, yPos, cardWidth, cardHeight, colors.dangerBg, colors.danger, 'TOTAL EXPENSES', mData.expenses);
            
            // Card 3: Balance
            this.drawCard(doc, margin + (cardWidth + gap) * 2, yPos, cardWidth, cardHeight, colors.primaryBg, colors.primary, 'NET BALANCE', mData.balance);
    
            yPos += cardHeight + 15;
    
            // --- Chart Section ---
            // Prepare Data
            const allCats = {};
            if (mData.categories) {
                Object.entries(mData.categories).forEach(([cat, amt]) => {
                    allCats[cat] = amt;
                });
            }
            const sortedCats = Object.entries(allCats).sort((a,b) => b[1] - a[1]);
            
            if (sortedCats.length > 0) {
                 doc.setFont('helvetica', 'bold');
                 doc.setFontSize(14);
                 doc.setTextColor(...colors.text);
                 doc.text('Spending Breakdown', margin, yPos);
                 yPos += 10;
    
                 // Generate High-Res Chart Image
                 const labels = sortedCats.map(x => x[0]);
                 const data = sortedCats.map(x => x[1]);
                 const chartImg = await this.getChartImage(labels, data); // Existing method returns Base64
                 
                 // Center Chart
                 const imgWidth = 100;
                 const imgHeight = 50; 
                 const xCent = (210 - imgWidth) / 2;
                 doc.addImage(chartImg, 'PNG', xCent, yPos, imgWidth, imgHeight);
                 
                 yPos += imgHeight + 20;
            } else {
                 yPos += 20;
                 doc.setFontSize(10);
                 doc.setTextColor(...colors.textLight);
                 doc.text('(No expense data to visualize)', margin, yPos);
                 yPos += 10;
            }

            // ==========================================
            // PART 2: ORIGINAL TABLE DESIGN (Next Pages)
            // ==========================================
            
            // We use the original filtered data logic
            const monthlyData = allMonthsData.filter(m => m.monthKey === currentKey);

            monthlyData.forEach((m) => {
                // Ensure we have space, otherwise add page
                if(yPos > 250) { doc.addPage(); yPos = 20; }

                doc.setFont('helvetica', 'bold');
                doc.setFontSize(14);
                doc.setTextColor(79, 70, 229);
                doc.text(m.month, margin, yPos);
                
                doc.setFontSize(10);
                doc.setTextColor(100, 116, 139);
                doc.text(`Balance: Rs. ${m.balance.toLocaleString('en-IN')}`, 210 - margin, yPos, {align:'right'});

                yPos += 10;

                // --- ORIGINAL INCOME TABLE STYLE ---
                if (m.incomeTransactions.length > 0) {
                    doc.autoTable({
                        startY: yPos,
                        head: [['Date', 'Income Source', 'Description', 'Amount']], 
                        body: m.incomeTransactions.map(t => [
                            t.date, 
                            t.category, 
                            t.description || '', 
                            `Rs. ${t.amount.toLocaleString('en-IN')}`
                        ]),
                        theme: 'striped', // Original Theme
                        headStyles: { fillColor: [16, 185, 129] }, // Original Emerald Color
                        margin: { left: margin, right: margin }
                    });
                    yPos = doc.lastAutoTable.finalY + 15;
                }

                // --- ORIGINAL EXPENSE TABLE STYLE ---
                if (m.expenseTransactions.length > 0) {
                    doc.autoTable({
                        startY: yPos,
                        head: [['Date', 'Expense', 'Description', 'Amount']], 
                        body: m.expenseTransactions.map(t => [
                            t.date, 
                            t.category, 
                            t.description || '', 
                            `Rs. ${t.amount.toLocaleString('en-IN')}`
                        ]),
                        theme: 'striped', // Original Theme
                        headStyles: { fillColor: [244, 63, 94] }, // Original Rose Color
                        margin: { left: margin, right: margin }
                    });
                    yPos = doc.lastAutoTable.finalY + 30;
                }
            });

            // Save
            doc.save(`Report_${currentKey}.pdf`);
            addToast('Professional Report Downloaded!', 'success');
    
        } catch (err) {
            console.error(err);
            addToast('PDF Generation Failed', 'error');
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
            if(window.lucide) lucide.createIcons();
        }
    }
    
    // Helper for cards
    drawCard(doc, x, y, w, h, bgColor, accentColor, title, value) {
        // Background
        doc.setFillColor(...bgColor);
        doc.setDrawColor(...accentColor);
        doc.setLineWidth(0.5);
        doc.roundedRect(x, y, w, h, 3, 3, 'FD');
    
        // Title
        doc.setFontSize(8);
        doc.setTextColor(...accentColor);
        doc.setFont('helvetica', 'bold');
        doc.text(title, x + 5, y + 8);
    
        // Value
        doc.setFontSize(14);
        doc.setTextColor(30, 41, 59);
        doc.text(`Rs. ${value.toLocaleString('en-IN')}`, x + 5, y + 22);
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
