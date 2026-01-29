// --- Toast Notification System ---
const addToast = (message, type = 'success') => {
    const container = document.getElementById('toastContainer');
    const el = document.createElement('div');
    const color = type === 'success' ? 'text-emerald-400' : (type === 'error' ? 'text-rose-400' : 'text-blue-400');
    const border = type === 'success' ? 'border-emerald-500/50' : (type === 'error' ? 'border-rose-500/50' : 'border-blue-500/50');
    const icon = type === 'success' ? 'check-circle' : (type === 'error' ? 'alert-circle' : 'info');
    
    el.className = `pointer-events-auto glass-panel border ${border} backdrop-blur-md text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 animate-slide-up`;
    el.innerHTML = `<i data-lucide="${icon}" class="w-4 h-4 ${color}"></i><span class="text-sm font-medium">${message}</span>`;
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
        this.storageKey = 'group_money_manager_v3';
        this.allTransactions = this.loadData();
        this.deleteTransactionId = null;
        this.currentMonth = new Date().getMonth();
        this.currentYear = new Date().getFullYear();
        this.members = ['Sumit', 'Prem', 'Sanjit', 'Keshav', 'Uttam'];
        this.contributionSource = 'Member'; 
        
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
        this.populateMemberSelects();
        this.updateMonthDisplay();
        this.updateAll();
        if(window.lucide) lucide.createIcons();
    }

    setDefaultDates() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('incomeDate').value = today;
        document.getElementById('expenseDate').value = today;
    }

    populateMemberSelects() {
        const incSelect = document.getElementById('incomeMember');
        const expSelect = document.getElementById('expenseMember');
        const options = this.members.map(m => `<option value="${m}">${m}</option>`).join('');
        
        incSelect.innerHTML = options;
        expSelect.innerHTML = options;
    }

    bindEvents() {
        document.getElementById('incomeForm').addEventListener('submit', (e) => { e.preventDefault(); this.addTransaction('income'); });
        document.getElementById('expenseForm').addEventListener('submit', (e) => { e.preventDefault(); this.addTransaction('expense'); });
        document.getElementById('prevMonth').addEventListener('click', () => this.navigateMonth(-1));
        document.getElementById('nextMonth').addEventListener('click', () => this.navigateMonth(1));
        document.getElementById('generateData').addEventListener('click', () => this.generateEnhancedPDF());
    }

    setSource(source) {
        this.contributionSource = source;
        const btnMem = document.getElementById('btnSourceMember');
        const btnRest = document.getElementById('btnSourceRest');
        const memberField = document.getElementById('incomeMemberField');

        if (source === 'Member') {
            btnMem.className = 'flex-1 py-2 rounded-lg transition-all bg-emerald-600 text-white shadow-lg';
            btnRest.className = 'flex-1 py-2 rounded-lg transition-all text-gray-400 hover:text-white';
            memberField.classList.remove('hidden');
        } else {
            btnRest.className = 'flex-1 py-2 rounded-lg transition-all bg-blue-600 text-white shadow-lg';
            btnMem.className = 'flex-1 py-2 rounded-lg transition-all text-gray-400 hover:text-white';
            memberField.classList.add('hidden');
        }
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
        if(tx.length === 0) monthStats.textContent = 'No transactions';
        else {
            const inc = tx.filter(t=>t.type==='income').length;
            const exp = tx.filter(t=>t.type==='expense').length;
            monthStats.textContent = `${inc} Income • ${exp} Expenses`;
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
        const amtId = type === 'income' ? 'incomeAmount' : 'expenseAmount';
        const dateId = type === 'income' ? 'incomeDate' : 'expenseDate';
        const descId = type === 'income' ? 'incomeDescription' : 'expenseDescription';
        const memberId = type === 'income' ? 'incomeMember' : 'expenseMember';

        const amount = parseFloat(document.getElementById(amtId).value);
        const dateInput = document.getElementById(dateId).value;
        const description = document.getElementById(descId).value;
        
        let member = '';
        let source = 'Member';
        
        if (type === 'income') {
            if (this.contributionSource === 'Rest Money') {
                member = 'Rest Fund';
                source = 'Rest Money';
            } else {
                member = document.getElementById(memberId).value;
                source = 'Member';
            }
        } else {
            member = document.getElementById(memberId).value;
            source = 'Expense';
        }

        if(!amount || amount <= 0 || !dateInput) { 
            addToast('Please fill all required fields', 'error'); return; 
        }

        const d = new Date(dateInput + 'T00:00:00');
        const now = new Date(); 
        d.setHours(now.getHours(), now.getMinutes(), now.getSeconds());

        const tx = { 
            id: Date.now().toString(36) + Math.random().toString(36).slice(2), 
            type: type, 
            member: member,
            source: source,
            amount: amount, 
            description: description || (type === 'income' ? (source === 'Rest Money' ? 'Carryover' : 'Contribution') : 'Expense'),
            date: d.toLocaleDateString('en-IN'), 
            timestamp: d.getTime() 
        };

        // PUSH instead of Unshift to append to end, but list rendering handles sorting
        this.allTransactions.push(tx); 
        this.saveData(); 
        this.updateAll();
        
        document.getElementById(formId).reset(); 
        this.setDefaultDates();
        if(type==='income') {
            this.setSource('Member');
        }
        addToast(`${type === 'income' ? 'Income' : 'Expense'} added successfully`);
    }

    updateAll() { 
        this.updateSummary(); 
        this.renderTransactions(); 
        this.updateContributorList(); 
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

        const max = Math.max(totalIncome, totalExpenses) || 1;
        document.getElementById('incomeBar').style.width = `${(totalIncome/max)*100}%`;
        document.getElementById('expenseBar').style.width = `${(totalExpenses/max)*100}%`;
    }

    renderTransactions() {
        const list = document.getElementById('transactionsList');
        const count = document.getElementById('txCount');
        // SORT: OLDEST to NEWEST (a - b)
        const tx = this.getCurrentMonthTransactions().sort((a,b) => a.timestamp - b.timestamp);

        count.textContent = `${tx.length} Items`;
        list.innerHTML = '';

        if(tx.length === 0) {
            list.innerHTML = `<div class="flex flex-col items-center justify-center py-10 text-gray-500 opacity-60"><i data-lucide="inbox" class="w-10 h-10 mb-2 text-gray-600"></i><p class="text-sm">No transactions yet</p></div>`;
            return;
        }

        tx.forEach(t => {
            const isInc = t.type === 'income';
            const colorClass = isInc ? 'text-emerald-400' : 'text-rose-400';
            const bgClass = isInc ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-rose-500/10 border-rose-500/20';
            const iconName = isInc ? 'arrow-down-left' : 'arrow-up-right';
            const sign = isInc ? '+' : '-';
            const isRest = t.source === 'Rest Money';
            const memberColor = isRest ? 'text-blue-400' : 'text-gray-200';

            const div = document.createElement('div');
            div.className = `group flex items-center justify-between p-3 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 transition-all duration-200`;
            div.innerHTML = `
                <div class="flex items-center gap-3 overflow-hidden">
                    <div class="w-10 h-10 rounded-lg flex items-center justify-center text-lg border ${bgClass} shrink-0">
                        <i data-lucide="${iconName}" class="w-5 h-5 ${isInc ? 'text-emerald-400' : 'text-rose-400'}"></i>
                    </div>
                    <div class="min-w-0">
                        <div class="font-bold text-sm ${memberColor} truncate">${t.member}</div>
                        <div class="text-xs text-gray-500 truncate flex items-center gap-1">
                            <span>${t.date}</span>
                            ${t.description ? `<span class="w-1 h-1 rounded-full bg-gray-600"></span> <span>${t.description}</span>` : ''}
                        </div>
                    </div>
                </div>
                <div class="flex items-center gap-3 pl-2">
                    <span class="font-mono font-bold text-sm ${colorClass}">${sign}₹${t.amount.toLocaleString('en-IN')}</span>
                    <button onclick="expenseTracker.showDeleteModal('${t.id}')" class="opacity-0 group-hover:opacity-100 focus:opacity-100 p-2 text-gray-400 hover:text-rose-400 hover:bg-white/5 rounded-lg transition-all">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </div>
            `;
            list.appendChild(div);
        });
    }

    updateContributorList() {
        const tx = this.getCurrentMonthTransactions();
        const incomes = tx.filter(t => t.type === 'income');
        const container = document.getElementById('memberBreakdown');
        
        if(incomes.length === 0) {
            container.innerHTML = '<div class="col-span-2 text-center text-gray-500 py-10 text-sm opacity-60">No contributions yet.</div>';
            return;
        }

        const byMember = {};
        incomes.forEach(t => { byMember[t.member] = (byMember[t.member] || 0) + t.amount; });
        
        const sortedMembers = Object.entries(byMember).sort((a,b) => b[1] - a[1]);

        container.innerHTML = sortedMembers.map(([mem, amt]) => {
            const isRest = mem === 'Rest Fund';
            const iconColor = isRest ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 'bg-purple-500/20 text-purple-400 border-purple-500/30';
            return `
                <div class="flex flex-col p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                    <div class="flex items-center gap-2 mb-2">
                        <div class="w-8 h-8 rounded-lg ${iconColor} border flex items-center justify-center text-xs font-bold">
                            ${mem.charAt(0)}
                        </div>
                        <span class="text-sm font-bold text-gray-300 truncate">${mem}</span>
                    </div>
                    <div class="text-lg font-bold text-white font-mono">₹${amt.toLocaleString('en-IN')}</div>
                </div>
            `;
        }).join('');
    }

    showDeleteModal(id) {
        const t = this.allTransactions.find(x => x.id === id);
        if(!t) return;
        this.deleteTransactionId = id;
        document.getElementById('transactionDetails').innerHTML = `
            <div class="flex justify-between mb-1"><span class="text-gray-500">Member:</span> <span class="text-white">${t.member}</span></div>
            <div class="flex justify-between mb-1"><span class="text-gray-500">Amount:</span> <span class="text-white font-bold">₹${t.amount}</span></div>
            <div class="flex justify-between"><span class="text-gray-500">Date:</span> <span class="text-gray-300">${t.date}</span></div>
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
        addToast('Transaction deleted', 'success');
    }

    async generateEnhancedPDF() {
        const btn = document.getElementById('generateData');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<div class="animate-spin h-4 w-4 border-2 border-white/20 border-t-white rounded-full"></div> Generating...';
        btn.disabled = true;

        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF('p', 'pt', 'a4');
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const margin = 30; 
            const contentWidth = pageWidth - (margin * 2);

            const currentKey = this.getCurrentMonthKey();
            const monthTxns = this.allTransactions.filter(t => {
                const d = new Date(t.timestamp);
                const k = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
                return k === currentKey;
            });
            
            // --- SORT OLDEST TO NEWEST FOR PDF ---
            let allSorted = [...this.allTransactions].sort((a, b) => a.timestamp - b.timestamp);
            let runningBalance = 0;
            const balanceMap = {};
            allSorted.forEach(t => {
                if (t.type === 'income') runningBalance += t.amount;
                else runningBalance -= t.amount;
                balanceMap[t.id] = runningBalance;
            });

            // Final sort for display (Oldest First)
            const pdfRows = monthTxns
                .map(t => ({...t, runningBalance: balanceMap[t.id]}))
                .sort((a, b) => a.timestamp - b.timestamp);

            const colors = {
                headerBg: [17, 24, 39], // Gray 900
                textMain: [31, 41, 55], // Gray 800
                textSec: [107, 114, 128], // Gray 500
                green: [5, 150, 105],   // Green 600
                red: [220, 38, 38],     // Red 600
                line: [229, 231, 235],   // Gray 200
                restMoneyLabel: [79, 70, 229] // Indigo-600
            };

            // --- HEADER ---
            doc.setFillColor(...colors.headerBg);
            doc.rect(0, 0, pageWidth, 70, 'F');
            
            doc.setTextColor(255, 255, 255);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(24);
            doc.text('Group Money Manager', margin, 45);
            
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(209, 213, 219);
            doc.text(`${this.monthNames[this.currentMonth]} ${this.currentYear}`, pageWidth - margin, 42, {align: 'right'});

            let y = 100;

            // --- SUMMARY ---
            const totalInc = monthTxns.filter(t => t.type === 'income').reduce((s,t) => s + t.amount, 0);
            const totalExp = monthTxns.filter(t => t.type === 'expense').reduce((s,t) => s + t.amount, 0);
            const netChange = totalInc - totalExp;

            doc.setDrawColor(...colors.line);
            doc.setFillColor(249, 250, 251);
            doc.roundedRect(margin, y, contentWidth, 50, 4, 4, 'FD');
            
            y += 30;
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            
            doc.setTextColor(...colors.green);
            doc.text(`+ ${totalInc.toLocaleString('en-IN')}`, margin + 20, y);
            doc.setFontSize(8); doc.text('COLLECTED', margin + 20, y + 12);
            
            doc.setFontSize(12);
            doc.setTextColor(...colors.red);
            doc.text(`- ${totalExp.toLocaleString('en-IN')}`, margin + 160, y);
            doc.setFontSize(8); doc.text('EXPENSES', margin + 160, y + 12);
            
            doc.setFontSize(12);
            doc.setTextColor(...colors.textMain);
            doc.text(`${netChange >= 0 ? '+' : ''} ${netChange.toLocaleString('en-IN')}`, margin + 300, y);
            doc.setFontSize(8); doc.text('NET FLOW', margin + 300, y + 12);

            y += 60;

            // --- TABLE HEADER ---
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...colors.textMain);
            
            doc.text('Date', margin, y);
            doc.text('User', margin + 80, y);
            doc.text('Type', margin + 160, y);  // Adjusted for overlap
            doc.text('Description', margin + 240, y); // Adjusted for overlap
            doc.text('Amount', pageWidth - margin, y, {align: 'right'});
            
            y += 8;
            doc.setDrawColor(0,0,0);
            doc.setLineWidth(1);
            doc.line(margin, y, pageWidth - margin, y);
            y += 20;

            // --- ROWS ---
            if (pdfRows.length === 0) {
                doc.setFont('helvetica', 'italic');
                doc.setTextColor(...colors.textSec);
                doc.text("No transactions recorded.", margin, y);
            }

            pdfRows.forEach((t) => {
                if (y > pageHeight - 50) { doc.addPage(); y = 40; }

                const isIncome = t.type === 'income';
                // Row Height doesn't need variable, handled by Y increment

                // -- MAIN ROW: Date | User | Type | Description | Amount --
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(10);
                
                // Date
                doc.setTextColor(...colors.textSec);
                doc.text(t.date, margin, y);

                // User
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(...colors.textMain);
                doc.text(t.member, margin + 80, y);
                
                // Type
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(8);
                doc.setTextColor(isIncome ? colors.green[0] : colors.red[0], isIncome ? colors.green[1] : colors.red[1], isIncome ? colors.green[2] : colors.red[2]);
                doc.text(isIncome ? 'INCOME' : 'EXPENSE', margin + 160, y);

                // Description
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(10);
                doc.setTextColor(...colors.textMain);
                let desc = t.description;
                if(desc.length > 30) desc = desc.substring(0, 27) + '...';
                doc.text(desc, margin + 240, y);

                // Amount (Colored)
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(11);
                doc.setTextColor(isIncome ? colors.green[0] : colors.red[0], isIncome ? colors.green[1] : colors.red[1], isIncome ? colors.green[2] : colors.red[2]);
                const sign = isIncome ? '+' : '-';
                doc.text(`${sign} ${t.amount.toLocaleString('en-IN')}`, pageWidth - margin, y, { align: 'right' });

                // -- BALANCE ROW (Next Line, Left Aligned) --
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(9);
                doc.setTextColor(...colors.restMoneyLabel); 
                // Increased Y offset from +15 to +22 for more breathing room after Date line
                doc.text("Rest Money: ", margin, y + 22);
                doc.setTextColor(31, 41, 55); // Gray 800
                doc.setFont('helvetica', 'bold'); // Make amount bold
                doc.text("Rs. " + t.runningBalance.toLocaleString('en-IN'), margin + 65, y + 22);

                // Divider
                // Increased divider offset to accommodate the lower Rest Money line
                y += 32; 
                doc.setDrawColor(229, 231, 235);
                doc.setLineWidth(0.5);
                doc.line(margin, y, pageWidth - margin, y);
                
                // Space before next row
                y += 20; 
            });

            doc.save(`Statement_${this.monthNames[this.currentMonth]}_${this.currentYear}.pdf`);
            addToast('PDF Generated', 'success');

        } catch (err) {
            console.error(err);
            addToast('PDF Error', 'error');
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
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
        tabInc.className = 'flex-1 py-4 text-sm font-bold text-emerald-400 bg-emerald-500/10 border-b-2 border-emerald-500 transition-all hover:bg-emerald-500/20';
        tabExp.className = 'flex-1 py-4 text-sm font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-all border-b-2 border-transparent';
    } else {
        incForm.classList.add('hidden');
        expForm.classList.remove('hidden');
        tabExp.className = 'flex-1 py-4 text-sm font-bold text-rose-400 bg-rose-500/10 border-b-2 border-rose-500 transition-all';
        tabInc.className = 'flex-1 py-4 text-sm font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-all border-b-2 border-transparent';
    }
}

let expenseTracker;
document.addEventListener('DOMContentLoaded', () => {
    expenseTracker = new ExpenseTracker();
    window.expenseTracker = expenseTracker;
});
