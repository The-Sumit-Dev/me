// --- DATA ---
const SYLLABUS = {
    maths: {
        id: "maths",
        title: "Mathematics",
        iconName: "calculator",
        color: "bg-blue-100 text-blue-600",
        barColor: "bg-blue-600",
        chapters: [
            "Number Systems",
            "Polynomials",
            "Coordinate Geometry",
            "Linear Equations in Two Variables",
            "Introduction to Euclid's Geometry",
            "Lines and Angles",
            "Triangles",
            "Quadrilaterals",
            "Circles",
            "Heron's Formula",
            "Surface Areas and Volumes",
            "Statistics"
        ]
    },
    science: {
        id: "science",
        title: "Science",
        iconName: "flask-conical",
        color: "bg-purple-100 text-purple-600",
        barColor: "bg-purple-600",
        chapters: [
            "Matter in Our Surroundings",
            "Is Matter Around Us Pure",
            "Atoms and Molecules",
            "Structure of the Atom",
            "The Fundamental Unit of Life",
            "Tissues",
            "Motion",
            "Force and Laws of Motion",
            "Gravitation",
            "Work and Energy",
            "Sound",
            "Improvement in Food Resources"
        ]
    },
    history: {
        id: "history",
        title: "History",
        iconName: "scroll",
        color: "bg-amber-100 text-amber-600",
        barColor: "bg-amber-600",
        chapters: [
            "The French Revolution",
            "Socialism in Europe and the Russian Revolution",
            "Nazism and the Rise of Hitler",
            "Forest Society and Colonialism",
            "Pastoralists in the Modern World"
        ]
    },
    geography: {
        id: "geography",
        title: "Geography",
        iconName: "globe-2",
        color: "bg-emerald-100 text-emerald-600",
        barColor: "bg-emerald-600",
        chapters: [
            "India - Size and Location",
            "Physical Features of India",
            "Drainage",
            "Climate",
            "Natural Vegetation and Wildlife",
            "Population"
        ]
    },
    civics: {
        id: "civics",
        title: "Pol. Science",
        iconName: "scale",
        color: "bg-rose-100 text-rose-600",
        barColor: "bg-rose-600",
        chapters: [
            "What is Democracy? Why Democracy?",
            "Constitutional Design",
            "Electoral Politics",
            "Working of Institutions",
            "Democratic Rights"
        ]
    },
    economics: {
        id: "economics",
        title: "Economics",
        iconName: "trending-up",
        color: "bg-cyan-100 text-cyan-600",
        barColor: "bg-cyan-600",
        chapters: [
            "The Story of Village Palampur",
            "People as Resource",
            "Poverty as a Challenge",
            "Food Security in India"
        ]
    },
    english: {
        id: "english",
        title: "English",
        iconName: "feather",
        color: "bg-pink-100 text-pink-600",
        barColor: "bg-pink-600",
        chapters: [
            // Beehive - Prose
            "Beehive: The Fun They Had",
            "Beehive: The Sound of Music",
            "Beehive: The Little Girl",
            "Beehive: A Truly Beautiful Mind",
            "Beehive: The Snake and the Mirror",
            "Beehive: My Childhood",
            "Beehive: Reach for the Top",
            "Beehive: Kathmandu",
            "Beehive: If I Were You",
            // Beehive - Poems
            "Poem: The Road Not Taken",
            "Poem: Wind",
            "Poem: Rain on the Roof",
            "Poem: The Lake Isle of Innisfree",
            "Poem: A Legend of the Northland",
            "Poem: No Men Are Foreign",
            "Poem: On Killing a Tree",
            "Poem: A Slumber Did My Spirit Seal",
            // Moments
            "Moments: The Lost Child",
            "Moments: The Adventures of Toto",
            "Moments: Iswaran the Storyteller",
            "Moments: In the Kingdom of Fools",
            "Moments: The Happy Prince",
            "Moments: The Last Leaf",
            "Moments: A House Is Not a Home",
            "Moments: The Beggar"
        ]
    },
    hindi: {
        id: "hindi",
        title: "Hindi (Course A)",
        iconName: "languages",
        color: "bg-orange-100 text-orange-600",
        barColor: "bg-orange-600",
        chapters: [
            // Kshitij - Gadhya (Prose)
            "Kshitij: Do Bailon Ki Katha",
            "Kshitij: Lhasa Ki Aur",
            "Kshitij: Upbhoktavad Ki Sanskriti",
            "Kshitij: Sanwale Sapnon Ki Yaad",
            "Kshitij: Premchand Ke Phate Joote",
            "Kshitij: Mere Bachpan Ke Din",
            // Kshitij - Kavya (Poetry)
            "Kshitij: Sakhiyan & Sabad (Kabir)",
            "Kshitij: Vaakh (Laldhyad)",
            "Kshitij: Savaiye (Raskhan)",
            "Kshitij: Kaidi Aur Kokila",
            "Kshitij: Gram Shree",
            "Kshitij: Megh Aaye",
            "Kshitij: Bachche Kaam Par Ja Rahe Hain",
            // Kritika
            "Kritika: Is Jal Pralay Mein",
            "Kritika: Mere Sang Ki Auratein",
            "Kritika: Reedh Ki Haddi"
        ]
    }
};

// --- APP LOGIC ---
const app = {
    state: {
        activeTab: 'overview',
        progress: {}
    },

    init() {
        // Load from local storage
        const saved = localStorage.getItem('cbse9_tracker_data');
        if (saved) {
            this.state.progress = JSON.parse(saved);
        }
        this.render();
    },

    save() {
        localStorage.setItem('cbse9_tracker_data', JSON.stringify(this.state.progress));
        this.render();
    },

    setTab(tab) {
        this.state.activeTab = tab;
        this.render();
    },

    toggleChapter(subjectId, idx) {
        const key = `${subjectId}-${idx}`;
        if (this.state.progress[key]) {
            delete this.state.progress[key];
        } else {
            this.state.progress[key] = true;
        }
        this.save();
    },

    resetProgress() {
        if(confirm("Are you sure you want to clear all your progress?")) {
            this.state.progress = {};
            this.save();
        }
    },

    // --- HELPERS ---
    getSubjectStats(subjectId) {
        const subject = SYLLABUS[subjectId];
        const total = subject.chapters.length;
        let completed = 0;
        subject.chapters.forEach((_, idx) => {
            if (this.state.progress[`${subjectId}-${idx}`]) completed++;
        });
        return { 
            total, 
            completed, 
            percentage: total === 0 ? 0 : Math.round((completed / total) * 100) 
        };
    },

    getOverallStats() {
        let totalChapters = 0;
        let totalCompleted = 0;
        Object.keys(SYLLABUS).forEach(key => {
            const stats = this.getSubjectStats(key);
            totalChapters += stats.total;
            totalCompleted += stats.completed;
        });
        return {
            total: totalChapters,
            completed: totalCompleted,
            percentage: totalChapters === 0 ? 0 : Math.round((totalCompleted / totalChapters) * 100)
        };
    },

    // --- RENDERING ---
    renderTabs() {
        const container = document.getElementById('tabs-container');
        let html = '';

        // Overview Tab
        const isOverview = this.state.activeTab === 'overview';
        html += `
            <button onclick="app.setTab('overview')" 
                class="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${isOverview ? 'bg-gray-900 text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}">
                <i data-lucide="layout-dashboard" class="w-4 h-4"></i> Overview
            </button>
        `;

        // Subject Tabs
        Object.values(SYLLABUS).forEach(sub => {
            const isActive = this.state.activeTab === sub.id;
            const iconColor = sub.color.split(' ')[1]; // Extract text color class
            html += `
                <button onclick="app.setTab('${sub.id}')" 
                    class="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${isActive ? `${sub.barColor} text-white shadow-md` : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}">
                    ${!isActive ? `<span class="${iconColor}"><i data-lucide="${sub.iconName}" class="w-4 h-4"></i></span>` : ''}
                    ${sub.title}
                </button>
            `;
        });

        container.innerHTML = html;
    },

    renderOverview() {
        const stats = this.getOverallStats();
        let html = `
            <div class="animate-fade-in space-y-8">
                <div class="bg-indigo-600 rounded-3xl p-8 text-white shadow-xl shadow-indigo-200">
                    <div class="flex flex-col md:flex-row items-center justify-between gap-8">
                        <div class="space-y-2 text-center md:text-left">
                            <h2 class="text-3xl font-bold">Keep it up!</h2>
                            <p class="text-indigo-100 text-lg">You have completed <strong class="text-white">${stats.completed}</strong> out of <strong class="text-white">${stats.total}</strong> total chapters.</p>
                        </div>
                        <div class="relative w-32 h-32 flex-shrink-0">
                            <svg class="w-full h-full -rotate-90" viewBox="0 0 36 36">
                                <path class="text-indigo-800" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" stroke-width="3" />
                                <path class="text-white transition-all duration-1000 ease-out" stroke-dasharray="${stats.percentage}, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
                            </svg>
                            <div class="absolute top-0 left-0 w-full h-full flex items-center justify-center flex-col">
                                <span class="text-2xl font-bold">${stats.percentage}%</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    ${Object.values(SYLLABUS).map(sub => {
                        const subStats = this.getSubjectStats(sub.id);
                        return `
                            <div onclick="app.setTab('${sub.id}')" class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow active:scale-[0.98] duration-200">
                                <div class="flex justify-between items-start mb-4">
                                    <div class="p-3 rounded-xl ${sub.color}">
                                        <i data-lucide="${sub.iconName}" class="w-6 h-6"></i>
                                    </div>
                                    <span class="text-2xl font-bold text-gray-800">${subStats.percentage}%</span>
                                </div>
                                <h3 class="text-lg font-bold text-gray-800 mb-1">${sub.title}</h3>
                                <p class="text-sm text-gray-500 mb-3">${subStats.completed} of ${subStats.total} Chapters</p>
                                <div class="w-full bg-gray-200 rounded-full h-3 overflow-hidden mt-2">
                                    <div class="h-full transition-all duration-500 ease-out ${sub.barColor}" style="width: ${subStats.percentage}%"></div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>

                <div class="bg-white p-6 rounded-2xl border border-gray-100 text-center">
                    <div class="flex justify-center mb-2 text-gray-400">
                        <i data-lucide="trending-up" class="w-8 h-8"></i>
                    </div>
                    <p class="text-gray-500">Tip: Regular revision is the secret to scoring high marks in Class 9.</p>
                </div>
            </div>
        `;
        return html;
    },

    renderSubject(subjectId) {
        const sub = SYLLABUS[subjectId];
        const stats = this.getSubjectStats(subjectId);
        
        let chaptersHtml = sub.chapters.map((chapter, idx) => {
            const isCompleted = !!this.state.progress[`${subjectId}-${idx}`];
            return `
                <div onclick="app.toggleChapter('${subjectId}', ${idx})" 
                    class="p-4 flex items-center gap-4 cursor-pointer transition-colors hover:bg-gray-50 ${isCompleted ? 'bg-gray-50/50' : ''}">
                    <button class="flex-shrink-0 transition-transform active:scale-90 ${isCompleted ? 'text-green-500' : 'text-gray-300'}">
                        <i data-lucide="${isCompleted ? 'check-circle-2' : 'circle'}" class="w-6 h-6 ${isCompleted ? 'fill-green-100' : ''}"></i>
                    </button>
                    <div class="flex-grow">
                        <span class="text-base font-medium transition-all ${isCompleted ? 'text-gray-400 line-through decoration-gray-300' : 'text-gray-800'}">
                            ${chapter}
                        </span>
                    </div>
                    ${isCompleted ? '<span class="text-xs font-semibold text-green-600 bg-green-100 px-2 py-1 rounded-full">Done</span>' : ''}
                </div>
            `;
        }).join('');

        return `
            <div class="animate-fade-in">
                <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div class="p-6 border-b border-gray-100 bg-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h2 class="text-2xl font-bold text-gray-800 flex items-center gap-3">
                                <span class="p-2 rounded-lg ${sub.color} bg-opacity-20">
                                    <i data-lucide="${sub.iconName}" class="w-6 h-6"></i>
                                </span>
                                ${sub.title} Syllabus
                            </h2>
                            <p class="text-gray-500 mt-1">Progress: ${stats.completed}/${stats.total} Chapters Completed</p>
                        </div>
                        <div class="w-full md:w-1/3">
                            <div class="flex justify-between text-sm font-medium mb-1">
                                <span>Completion</span>
                                <span>${stats.percentage}%</span>
                            </div>
                            <div class="w-full bg-gray-200 rounded-full h-3 overflow-hidden mt-2">
                                <div class="h-full transition-all duration-500 ease-out ${sub.barColor}" style="width: ${stats.percentage}%"></div>
                            </div>
                        </div>
                    </div>
                    <div class="divide-y divide-gray-100">
                        ${chaptersHtml}
                    </div>
                </div>
            </div>
        `;
    },

    render() {
        this.renderTabs();
        const content = document.getElementById('app-content');
        
        if (this.state.activeTab === 'overview') {
            content.innerHTML = this.renderOverview();
        } else {
            content.innerHTML = this.renderSubject(this.state.activeTab);
        }

        // Re-initialize icons for newly added DOM elements
        lucide.createIcons();
    }
};

// Start the app
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});

// Expose app to window for inline onclick handlers in HTML strings
window.app = app;
