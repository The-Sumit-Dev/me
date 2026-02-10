const { jsPDF } = window.jspdf;

// State
let studies = JSON.parse(localStorage.getItem('pixel_study_nothing_v2') || '[]');
let userName = localStorage.getItem('pixel_study_user') || 'Scholar';
// Initialize with basic labels if none exist
let categories = JSON.parse(localStorage.getItem('pixel_categories_v2') || '["Revision", "Homework"]');
let selectedDate = new Date().toISOString().split('T')[0];
let layoutMode = 'block'; 

// Keyboard Shortcuts
window.addEventListener('keydown', (e) => {
    const isTyping = e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA';
    
    if (e.key.toLowerCase() === 'n' && !isTyping) {
        e.preventDefault();
        openModal();
    }

    if (e.key === 'Escape') {
        closeModal();
    }
});

function setLayout(mode) {
    layoutMode = mode;
    document.getElementById('toggle-block').className = `toggle-btn dot-matrix ${mode === 'block' ? 'active' : 'inactive'}`;
    document.getElementById('toggle-line').className = `toggle-btn dot-matrix ${mode === 'line' ? 'active' : 'inactive'}`;
    renderList();
}

function updateClock() {
    const now = new Date();
    document.getElementById('clock').innerText = now.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: true 
    }).toUpperCase();
}
setInterval(updateClock, 1000);
updateClock();

window.onload = () => {
    const userNameInput = document.getElementById('user-name');
    userNameInput.value = userName;
    userNameInput.oninput = (e) => {
        userName = e.target.value;
        localStorage.setItem('pixel_study_user', userName);
    };
    refreshCategoryUI();
    updateUI();
};

function showModalTab(tab) {
    document.getElementById('modal-tab-log').classList.toggle('hidden', tab !== 'log');
    document.getElementById('modal-tab-categories').classList.toggle('hidden', tab !== 'categories');
    
    document.getElementById('tab-btn-log').className = `dot-matrix text-[10px] pb-1 border-b-2 ${tab === 'log' ? 'border-black text-black' : 'border-transparent text-slate-400'}`;
    document.getElementById('tab-btn-categories').className = `dot-matrix text-[10px] pb-1 border-b-2 ${tab === 'categories' ? 'border-black text-black' : 'border-transparent text-slate-400'}`;
    if(window.lucide) lucide.createIcons();
}

function refreshCategoryUI() {
    const select = document.getElementById('in-category-select');
    const list = document.getElementById('category-manager-list');

    // Update dropdown
    if (categories.length === 0) {
        select.innerHTML = `<option value="" disabled selected>Add categories first</option>`;
    } else {
        select.innerHTML = categories.map(cat => `<option value="${cat}">${cat}</option>`).join('');
    }

    // Update management list
    if (categories.length === 0) {
        list.innerHTML = `<p class="text-[10px] opacity-30 italic text-center py-4 uppercase dot-matrix">No labels created</p>`;
    } else {
        list.innerHTML = categories.map((cat, idx) => `
            <div class="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100 group">
                <span class="font-bold text-sm">${cat}</span>
                <button onclick="removeCategory(${idx})" class="text-slate-300 hover:text-red-600 transition-colors">
                    <i data-lucide="x-circle" class="w-4 h-4"></i>
                </button>
            </div>
        `).join('');
    }
    if(window.lucide) lucide.createIcons();
}

function addNewCategory() {
    const input = document.getElementById('new-cat-name');
    const val = input.value.trim();
    if (val && !categories.includes(val)) {
        categories.push(val);
        localStorage.setItem('pixel_categories_v2', JSON.stringify(categories));
        input.value = '';
        refreshCategoryUI();
    }
}

function removeCategory(index) {
    categories.splice(index, 1);
    localStorage.setItem('pixel_categories_v2', JSON.stringify(categories));
    refreshCategoryUI();
}

function updateUI() {
    const dateObj = new Date(selectedDate);
    const currentDayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });

    document.getElementById('full-date-label').innerText = dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    document.getElementById('current-day-label').innerText = currentDayName.toUpperCase();
    document.getElementById('date-context').innerText = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    const hr = new Date().getHours();
    document.getElementById('greeting-text').innerText = hr < 12 ? 'GOOD MORNING' : hr < 17 ? 'GOOD AFTERNOON' : 'GOOD EVENING';

    renderList();
    if(window.lucide) lucide.createIcons();
}

function changeDate(days) {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    selectedDate = d.toISOString().split('T')[0];
    updateUI();
}

function openModal() { 
    const modal = document.getElementById('modal');
    modal.classList.remove('hidden'); 
    showModalTab('log');
    setTimeout(() => document.getElementById('in-subject').focus(), 50);
}

function closeModal() { document.getElementById('modal').classList.add('hidden'); }

document.getElementById('topic-form').onsubmit = (e) => {
    e.preventDefault();
    const category = document.getElementById('in-category-select').value;
    const subject = document.getElementById('in-subject').value.trim();
    
    if (!category) {
        showModalTab('categories');
        return;
    }

    studies.push({
        id: Date.now(),
        subject: subject,
        category: category,
        date: selectedDate,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
    });
    
    localStorage.setItem('pixel_study_nothing_v2', JSON.stringify(studies));
    document.getElementById('topic-form').reset();
    closeModal();
    updateUI();
};

function deleteTopic(id) {
    studies = studies.filter(s => s.id !== id);
    localStorage.setItem('pixel_study_nothing_v2', JSON.stringify(studies));
    updateUI();
}

function renderList() {
    const list = document.getElementById('topics-list');
    const filtered = studies.filter(s => s.date === selectedDate);
    
    if (filtered.length === 0) {
        list.className = "flex flex-col items-center justify-center py-24 text-center w-full col-span-full opacity-30";
        list.innerHTML = `<div class="w-16 h-16 border-2 border-black border-dashed rounded-full flex items-center justify-center mb-6"><i data-lucide="circle-slash"></i></div><p class="dot-matrix text-xs">NO ENTRIES RECORDED</p>`;
    } else {
        if (layoutMode === 'block') {
            list.className = "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6";
            list.innerHTML = filtered.map(item => `
                <div class="widget p-8 group flex flex-col min-h-[200px] hover:border-red-600 transition-colors">
                    <div class="flex items-start justify-between mb-auto">
                        <div class="w-10 h-10 border border-black rounded-full flex items-center justify-center transition-colors group-hover:bg-black group-hover:text-white"><i data-lucide="hash" class="w-4 h-4"></i></div>
                        <span class="dot-matrix text-[9px] text-slate-400">${item.timestamp || ''}</span>
                    </div>
                    <div class="mt-8">
                        <p class="dot-matrix text-[9px] text-red-600 mb-2">${item.category}</p>
                        <h4 class="text-xl font-bold leading-tight">${item.subject}</h4>
                    </div>
                    <div class="flex items-center justify-end mt-4 opacity-0 group-hover:opacity-100 transition-all">
                         <button onclick="deleteTopic(${item.id})" class="text-slate-300 hover:text-red-600"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                    </div>
                </div>
            `).join('');
        } else {
            list.className = "flex flex-col gap-3";
            list.innerHTML = filtered.map(item => `
                <div class="widget p-4 px-6 group flex items-center justify-between hover:border-red-600 transition-colors">
                    <div class="flex items-center gap-6">
                        <div class="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 group-hover:bg-black group-hover:text-white transition-colors"><i data-lucide="check" class="w-4 h-4"></i></div>
                        <div>
                            <h4 class="font-bold text-sm">${item.subject}</h4>
                            <p class="dot-matrix text-[8px] text-red-600">${item.category}</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-6">
                        <span class="dot-matrix text-[8px] text-slate-400">${item.timestamp || ''}</span>
                        <button onclick="deleteTopic(${item.id})" class="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-600 transition-all">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                    </div>
                </div>
            `).join('');
        }
    }
    if(window.lucide) lucide.createIcons();
}

async function downloadReport() {
    const filtered = studies.filter(s => s.date === selectedDate);
    if (!filtered.length) return;

    // 1. Prepare PDF Data
    document.getElementById('pdf-date').innerText = new Date(selectedDate).toLocaleDateString('en-US', { dateStyle: 'full' }).toUpperCase();
    document.getElementById('pdf-user').innerText = `STUDENT: ${userName.toUpperCase()}`;
    document.getElementById('pdf-count').innerText = filtered.length;

    // 2. Render List with Serial Numbers
    document.getElementById('pdf-list-content').innerHTML = filtered.map((item, index) => `
        <div style="border-bottom: 2px solid #000; padding: 25px 0; display: flex; align-items: center; page-break-inside: avoid;">
            <div style="width: 50px; font-size: 14px; font-weight: 800; color: #000;">${String(index + 1).padStart(2, '0')}.</div>
            <div style="flex: 1;">
                <p style="font-size: 10px; color: #ff0000; font-weight: 800; letter-spacing: 2px; margin: 0 0 5px 0;">${item.category.toUpperCase()}</p>
                <p style="font-size: 20px; font-weight: 800; margin: 0; color: #000;">${item.subject}</p>
            </div>
            <div style="font-size: 10px; font-weight: 800; letter-spacing: 1px; color: #000;">COMPLETED</div>
        </div>
    `).join('');

    const captureElement = document.getElementById('pdf-export-template');
    
    // 3. High Quality Capture (Scale 2 for 1-2MB range and sharp text)
    const canvas = await html2canvas(captureElement, { 
        scale: 1, 
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
    });
    
    // PNG provides the best text clarity for black/white designs
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    const imgWidth = 210; 
    const pageHeight = 297; // Standard A4 height
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    // 4. Multi-page slicing logic
    // First page
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // Subsequent pages if content is long
    while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
    }

    pdf.save(`Study_Report_${selectedDate}.pdf`);
}
