<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
    <title>Goal Sync | Day Mode</title>
    
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/lucide@latest"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Outfit:wght@500;700;800&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">

    <link rel="stylesheet" href="style.css">

    <script>
        tailwind.config = {
            theme: {
                extend: {
                    fontFamily: {
                        sans: ['Inter', 'sans-serif'],
                        display: ['Outfit', 'sans-serif'],
                        mono: ['JetBrains Mono', 'monospace'],
                    },
                    animation: {
                        'slide-up': 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                        'pulse-subtle': 'pulseSubtle 2s infinite',
                        'bounce-slight': 'bounceSlight 2s infinite',
                    },
                    keyframes: {
                        slideUp: {
                            '0%': { transform: 'translateY(15px)', opacity: 0 },
                            '100%': { transform: 'translateY(0)', opacity: 1 }
                        },
                        pulseSubtle: {
                            '0%, 100%': { opacity: 1 },
                            '50%': { opacity: 0.8 },
                        },
                        bounceSlight: {
                            '0%, 100%': { transform: 'translateY(0)' },
                            '50%': { transform: 'translateY(-3px)' }
                        }
                    },
                    colors: {
                        slate: {
                            50: '#f8fafc',
                            100: '#f1f5f9',
                            200: '#e2e8f0',
                            300: '#cbd5e1',
                            400: '#94a3b8',
                            500: '#64748b',
                            600: '#475569',
                            700: '#334155',
                            800: '#1e293b',
                            900: '#0f172a',
                        },
                        primary: {
                            light: '#ede9fe', // violet-100
                            DEFAULT: '#7c3aed', // violet-600
                            dark: '#5b21b6', // violet-800
                        }
                    }
                }
            }
        }
    </script>
</head>
<body class="h-[100dvh] flex flex-col font-sans">

    <div class="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div class="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-200/30 rounded-full blur-[120px]"></div>
        <div class="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-200/30 rounded-full blur-[120px]"></div>
    </div>

    <div class="relative z-10 w-full max-w-4xl mx-auto h-full flex flex-col p-4 md:p-6 gap-4">
        
        <header class="flex flex-col md:flex-row justify-between items-center gap-4 shrink-0 animate-slide-up">
            <div class="flex items-center gap-4 w-full md:w-auto">
                <div class="relative group shrink-0">
                    <div id="appIcon" class="relative bg-white p-3 rounded-2xl border border-slate-200 shadow-sm text-primary">
                        <i data-lucide="trophy" class="w-8 h-8"></i>
                    </div>
                </div>
                <div class="min-w-0 flex-1">
                    <div class="flex items-center gap-2">
                        <h1 id="pageTitle" class="font-display text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight truncate">Goal <span class="text-primary">Sync</span></h1>
                    </div>
                    <div class="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                        <span id="timeGreeting">Hello</span>, 
                        <span id="userNameDisplay" onclick="editName()" class="text-slate-800 font-bold border-b border-transparent hover:border-primary cursor-pointer transition-colors">User</span>
                        <input type="text" id="userNameInput" class="hidden bg-white border border-primary rounded px-2 outline-none w-24 text-slate-900 font-medium shadow-sm" onblur="saveName()" onkeydown="handleNameKey(event)">
                    </div>
                </div>
            </div>

            <div class="flex items-center gap-3 w-full md:w-auto">
                <div id="streakContainer" onclick="openStreakPopup()" class="glass-panel px-4 py-2 rounded-xl flex items-center gap-3 cursor-pointer hover:bg-orange-50 transition-colors border-orange-200 bg-white">
                    <div class="bg-orange-100 p-1.5 rounded-lg">
                        <i data-lucide="flame" class="w-4 h-4 text-orange-500 fill-orange-500 animate-bounce-slight"></i>
                    </div>
                    <div class="flex flex-col leading-none">
                        <span id="streakCount" class="font-display font-bold text-slate-900 text-sm">0</span>
                        <span class="text-[9px] text-orange-600 uppercase tracking-wider font-bold">Streak</span>
                    </div>
                </div>

                <button id="reportBtn" onclick="toggleView()" class="glass-panel hover:bg-slate-50 px-4 py-3 rounded-xl flex items-center gap-2 text-sm font-medium transition-all flex-1 md:flex-none justify-center text-slate-600 hover:text-primary active:scale-95 shadow-sm">
                    <i data-lucide="bar-chart-2" class="w-4 h-4"></i>
                    <span>Insights</span>
                </button>
                <button id="notifBtn" class="glass-panel hover:bg-slate-50 p-3 rounded-xl text-slate-400 hover:text-primary transition-all touch-target flex items-center justify-center active:scale-95 shadow-sm">
                    <i data-lucide="bell" class="w-5 h-5"></i>
                </button>
            </div>
        </header>

        <div id="dailyView" class="flex flex-col gap-4 flex-1 min-h-0 animate-slide-up relative">
            
            <div id="dailyHeaderContent" class="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
                <div class="md:col-span-2 glass-panel rounded-2xl p-2 flex gap-2 items-center bg-white/60">
                    <button onclick="changeDate(-1)" class="p-3 hover:bg-slate-100 rounded-xl text-slate-500 hover:text-slate-900 transition-colors touch-target"><i data-lucide="chevron-left" class="w-5 h-5"></i></button>
                    <div class="flex-1 flex items-center justify-center flex-col relative group cursor-pointer rounded-xl hover:bg-slate-50 transition-colors py-2" onclick="openCalendar()">
                        <span id="dateLabel" class="text-[10px] uppercase tracking-widest text-primary font-bold">Today</span>
                        <span id="dateDisplay" class="font-display font-bold text-lg text-slate-900">--</span>
                        <input type="date" id="datePicker" class="absolute inset-0 opacity-0 cursor-pointer w-full h-full">
                    </div>
                    <button onclick="changeDate(1)" class="p-3 hover:bg-slate-100 rounded-xl text-slate-500 hover:text-slate-900 transition-colors touch-target"><i data-lucide="chevron-right" class="w-5 h-5"></i></button>
                    <button id="todayBtn" onclick="goToToday()" class="hidden md:block px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-primary mr-1 shadow-sm">Today</button>
                </div>

                <div class="glass-panel rounded-2xl p-4 flex flex-col justify-center relative overflow-hidden bg-white">
                    <div class="flex justify-between items-end mb-2 relative z-10">
                        <span class="text-xs text-slate-500 font-bold uppercase tracking-wider">Progress</span>
                        <span id="progressPercent" class="font-mono font-bold text-primary">0%</span>
                    </div>
                    <div class="h-2.5 bg-slate-100 rounded-full overflow-hidden relative z-10 border border-slate-100">
                        <div id="progressBar" class="h-full bg-gradient-to-r from-violet-500 to-blue-500 transition-all duration-700 ease-out w-0 rounded-full"></div>
                    </div>
                    <p id="progressText" class="text-[10px] text-slate-400 mt-1.5 text-right font-medium">0/0 completed</p>
                </div>
            </div>

            <div id="taskList" class="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-1 pb-48">
                </div>
        </div>

        <div id="monthlyView" class="hidden-view flex flex-col gap-6 flex-1 min-h-0 animate-slide-up pb-4">
            <div class="flex flex-wrap justify-between items-center gap-4 shrink-0">
                <div class="glass-panel p-1 rounded-xl flex gap-1 bg-white">
                    <button onclick="setInsightType('monthly')" id="btnMonthly" class="px-4 py-2 rounded-lg text-sm font-medium transition-all bg-slate-100 text-slate-900 shadow-sm border border-slate-200">Monthly</button>
                    <button onclick="setInsightType('daily')" id="btnDaily" class="px-4 py-2 rounded-lg text-sm font-medium transition-all text-slate-500 hover:text-slate-900 hover:bg-slate-50">Daily</button>
                </div>

                <div class="flex items-center gap-2">
                    <div id="dailyViewToggles" class="hidden glass-panel p-1 rounded-xl flex gap-1 bg-white">
                        <button onclick="setDailyMode('list')" id="btnListMode" class="p-2 rounded-lg transition-all bg-slate-100 text-slate-900 shadow-sm border border-slate-200"><i data-lucide="list" class="w-4 h-4"></i></button>
                        <button onclick="setDailyMode('calendar')" id="btnCalendarMode" class="p-2 rounded-lg transition-all text-slate-500 hover:text-slate-900 hover:bg-slate-50"><i data-lucide="calendar" class="w-4 h-4"></i></button>
                    </div>
                    
                    <button onclick="openPdfModal()" class="glass-panel hover:bg-white text-primary px-4 py-2 rounded-xl flex items-center gap-2 text-xs font-bold transition-all h-10 border border-purple-100 shadow-sm">
                        <i data-lucide="file-down" class="w-4 h-4"></i>
                        <span>Export</span>
                    </button>
                </div>
            </div>
            
            <div id="graphMainWrapper" class="glass-panel p-5 rounded-2xl shrink-0 flex flex-col gap-4 bg-white">
                
                <div class="flex justify-between items-center border-b border-slate-100 pb-3">
                    <div class="flex items-center gap-2">
                        <div class="p-2 bg-purple-50 rounded-lg text-primary"><i data-lucide="activity" class="w-4 h-4"></i></div>
                        <h3 class="font-bold text-slate-800 text-sm">Productivity Trend</h3>
                    </div>
                    
                    <div class="flex items-center gap-2 bg-slate-50 rounded-lg p-1 border border-slate-100">
                        <button onclick="changeGraphWeek(-1)" class="p-1 hover:bg-slate-200 rounded-md text-slate-500 transition-colors">
                            <i data-lucide="chevron-left" class="w-4 h-4"></i>
                        </button>
                        <span id="graphDateRange" class="text-[10px] font-mono text-slate-600 px-2 min-w-[140px] text-center font-bold">--</span>
                        <button onclick="changeGraphWeek(1)" class="p-1 hover:bg-slate-200 rounded-md text-slate-500 transition-colors">
                            <i data-lucide="chevron-right" class="w-4 h-4"></i>
                        </button>
                    </div>
                </div>

                <div class="grid grid-cols-3 gap-2 sm:gap-4 mb-2">
                    <div class="bg-slate-50 rounded-xl p-3 flex flex-col items-center justify-center border border-slate-100">
                        <span class="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Avg Score</span>
                        <span id="statAvgScore" class="font-mono text-xl font-bold text-slate-800">0%</span>
                    </div>
                    <div class="bg-slate-50 rounded-xl p-3 flex flex-col items-center justify-center border border-slate-100">
                        <span class="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Best Day</span>
                        <span id="statBestDay" class="font-display text-sm font-bold text-primary">-</span>
                    </div>
                    <div class="bg-slate-50 rounded-xl p-3 flex flex-col items-center justify-center border border-slate-100">
                        <span class="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Momentum</span>
                        <div id="statMomentum" class="flex items-center gap-1 text-sm font-bold text-slate-400">
                            <span>-</span>
                        </div>
                    </div>
                </div>

                <div class="relative h-56 w-full min-h-0">
                    <canvas id="progressChart"></canvas>
                </div>
            </div>

            <div id="reportContainer" class="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-1 pb-4">
                </div>
        </div>

    </div>

    <div id="inputContainer" class="fixed bottom-0 left-0 w-full z-50">
        <div class="absolute inset-0 bg-gradient-to-t from-slate-50 via-slate-50/90 to-transparent pointer-events-none h-[150%] -top-[50%]"></div>
        
        <div class="relative w-full max-w-4xl mx-auto p-4 md:p-6 pb-6 md:pb-8">
            <form id="addTaskForm" class="glass-panel p-2 pl-3 rounded-2xl flex flex-col sm:flex-row gap-2 shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-white bg-white/80 backdrop-blur-xl">
                
                <div class="flex-1 relative">
                    <div class="absolute left-1 top-1/2 -translate-y-1/2 text-primary/70">
                        <i data-lucide="plus-circle" class="w-5 h-5"></i>
                    </div>
                    <input type="text" id="taskInput" placeholder="Add a new goal..." autocomplete="off" class="w-full bg-transparent text-slate-800 placeholder-slate-400 text-base py-3 pl-9 pr-4 focus:outline-none rounded-xl h-12">
                </div>
                
                <div class="flex items-center justify-between sm:justify-end gap-2">
                    
                    <div class="flex items-center gap-2 flex-1 sm:flex-none">
                        <div class="relative group flex-1 sm:flex-none">
                            <input type="time" id="timeInput" class="w-full sm:w-[90px] glass-input text-slate-600 text-sm px-2 h-10 rounded-xl cursor-pointer text-center font-mono hover:bg-slate-50 focus:ring-2 ring-primary/20">
                        </div>

                        <button type="button" id="priorityBtn" class="glass-input px-3 h-10 rounded-xl flex items-center gap-2 min-w-[80px] justify-center group transition-all flex-1 sm:flex-none hover:bg-slate-50">
                            <i data-lucide="flag" class="w-4 h-4 text-blue-500"></i>
                            <span id="priorityLabel" class="text-sm font-medium text-slate-600">Low</span>
                        </button>
                    </div>

                    <button type="submit" id="addBtn" class="bg-primary hover:bg-primary-dark text-white h-10 w-10 flex items-center justify-center rounded-xl shadow-md shadow-primary/30 transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shrink-0">
                        <i data-lucide="arrow-up" class="w-5 h-5"></i>
                    </button>
                </div>
            </form>
        </div>
    </div>

    <div id="quoteOverlay" class="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none opacity-0 transition-opacity duration-500 px-4">
        <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"></div>
        <div id="quoteContent" class="relative bg-white border border-slate-100 p-8 rounded-3xl shadow-2xl w-full max-w-sm text-center transform scale-95 transition-transform duration-300">
            <div class="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-24 bg-yellow-100 rounded-full blur-xl opacity-60"></div>
            <i data-lucide="trophy" class="w-12 h-12 text-yellow-500 mx-auto mb-4 relative z-10 drop-shadow-sm"></i>
            <h2 class="text-2xl font-display font-bold text-slate-800 mb-2">Goal Crushed!</h2>
            <p id="quoteText" class="text-slate-500 italic mb-6 leading-relaxed font-serif">"Success is the sum of small efforts."</p>
            <button onclick="closeQuote()" class="bg-slate-900 text-white hover:bg-slate-800 font-bold py-3 px-8 rounded-xl text-sm w-full shadow-lg shadow-slate-200">Keep Grinding</button>
        </div>
    </div>

    <div id="streakPopup" class="fixed inset-0 z-[80] flex items-center justify-center pointer-events-none opacity-0 transition-opacity duration-300 px-4">
        <div class="absolute inset-0 bg-slate-900/30 backdrop-blur-sm"></div>
        <div id="streakPopupContent" class="relative bg-white border border-orange-100 p-6 rounded-3xl shadow-2xl w-full max-w-md text-center transform scale-95 transition-all duration-500">
            <div class="absolute -top-10 left-1/2 -translate-x-1/2 w-32 h-32 bg-orange-100 rounded-full blur-3xl opacity-50"></div>
            
            <div class="mb-4 inline-flex p-3 rounded-2xl bg-orange-50 border border-orange-100 shadow-sm">
                <i data-lucide="flame" class="w-10 h-10 text-orange-500 fill-orange-500 flame-anim"></i>
            </div>
            
            <h2 class="text-2xl font-display font-bold text-slate-800 mb-1">Weekly Streak Report</h2>
            <p id="streakPopupCount" class="text-orange-500 font-bold tracking-widest uppercase text-sm mb-6">Current Streak: 0 Days</p>

            <div class="flex items-center justify-between mb-4 px-2 bg-slate-50 rounded-xl p-2 border border-slate-100">
                <button onclick="changeStreakWeek(-1)" class="p-2 hover:bg-white rounded-lg text-slate-400 hover:text-slate-800 transition-colors">
                    <i data-lucide="chevron-left" class="w-5 h-5"></i>
                </button>
                <span id="streakDateRange" class="text-sm font-mono font-bold text-slate-600">--</span>
                <button onclick="changeStreakWeek(1)" class="p-2 hover:bg-white rounded-lg text-slate-400 hover:text-slate-800 transition-colors">
                    <i data-lucide="chevron-right" class="w-5 h-5"></i>
                </button>
            </div>

            <div id="weeklyStreakGrid" class="flex justify-between items-center gap-2 mb-8 bg-slate-50 p-4 rounded-2xl border border-slate-100 overflow-x-auto">
                </div>

            <button onclick="closeStreakPopup()" class="bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold py-3 px-8 rounded-xl text-sm w-full shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 transition-all">
                Close
            </button>
        </div>
    </div>
    
    <div id="pdfModal" class="fixed inset-0 z-[90] flex items-center justify-center pointer-events-none opacity-0 transition-opacity duration-300 px-4">
        <div class="absolute inset-0 bg-slate-900/30 backdrop-blur-sm"></div>
        <div id="pdfModalContent" class="relative bg-white border border-slate-200 p-6 rounded-3xl shadow-2xl w-full max-w-md transform scale-95 transition-all duration-500 flex flex-col gap-4">
            
            <div class="flex justify-between items-center mb-2">
                <h3 class="text-xl font-bold text-slate-800 font-display">Download Report</h3>
                <button onclick="closePdfModal()" class="text-slate-400 hover:text-slate-800 bg-slate-100 rounded-full p-1"><i data-lucide="x" class="w-5 h-5"></i></button>
            </div>
            
            <p class="text-slate-500 text-sm mb-2">Select the format for your productivity report:</p>

            <button onclick="generatePDF('date')" class="flex items-center gap-4 bg-slate-50 hover:bg-white p-4 rounded-2xl border border-slate-100 hover:border-violet-200 hover:shadow-md transition-all group text-left">
                <div class="bg-violet-100 p-3 rounded-xl text-violet-500 group-hover:scale-110 transition-transform">
                    <i data-lucide="check-square" class="w-6 h-6"></i>
                </div>
                <div>
                    <h4 class="font-bold text-slate-800">Single Day Breakdown</h4>
                    <p class="text-xs text-slate-500">Detailed list of tasks for the selected date.</p>
                </div>
            </button>

            <button onclick="generatePDF('list')" class="flex items-center gap-4 bg-slate-50 hover:bg-white p-4 rounded-2xl border border-slate-100 hover:border-purple-200 hover:shadow-md transition-all group text-left">
                <div class="bg-purple-100 p-3 rounded-xl text-primary group-hover:scale-110 transition-transform">
                    <i data-lucide="list" class="w-6 h-6"></i>
                </div>
                <div>
                    <h4 class="font-bold text-slate-800">Monthly Daily Report</h4>
                    <p class="text-xs text-slate-500">Detailed breakdown of daily performance.</p>
                </div>
            </button>

            <button onclick="generatePDF('calendar')" class="flex items-center gap-4 bg-slate-50 hover:bg-white p-4 rounded-2xl border border-slate-100 hover:border-blue-200 hover:shadow-md transition-all group text-left">
                <div class="bg-blue-100 p-3 rounded-xl text-blue-500 group-hover:scale-110 transition-transform">
                    <i data-lucide="calendar" class="w-6 h-6"></i>
                </div>
                <div>
                    <h4 class="font-bold text-slate-800">Visual Calendar</h4>
                    <p class="text-xs text-slate-500">Visual grid with performance badges.</p>
                </div>
            </button>

            <button onclick="generatePDF('graph')" class="flex items-center gap-4 bg-slate-50 hover:bg-white p-4 rounded-2xl border border-slate-100 hover:border-pink-200 hover:shadow-md transition-all group text-left">
                <div class="bg-pink-100 p-3 rounded-xl text-pink-500 group-hover:scale-110 transition-transform">
                    <i data-lucide="activity" class="w-6 h-6"></i>
                </div>
                <div>
                    <h4 class="font-bold text-slate-800">Weekly Graph Analysis</h4>
                    <p class="text-xs text-slate-500">Visual charts and trend analysis.</p>
                </div>
            </button>
        </div>
    </div>

    <div id="toastContainer" class="fixed top-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-auto z-[70] flex flex-col gap-3 pointer-events-none items-center sm:items-end"></div>

    <script src="script.js"></script>
</body>
</html>
