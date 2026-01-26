// DOM Elements
const categoryGrid = document.getElementById('category-grid');
const activeContext = document.getElementById('active-context');
const backToHomeBtn = document.getElementById('back-to-home');
const activeCategoryBadge = document.getElementById('active-category-badge');
const complaintsList = document.getElementById('complaints-list');
const triageSection = document.getElementById('triage-section');
const globalSearch = document.getElementById('global-search');

// State
let currentCategory = null;

// Initialize
function init() {
    renderCategories();
    setupEventListeners();
}

function renderCategories() {
    categoryGrid.innerHTML = categories.map(cat => `
        <div class="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-all cursor-pointer group"
             onclick="selectCategory('${cat.id}')">
            <div class="w-12 h-12 rounded-full bg-${cat.color}-100 text-${cat.color}-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <i data-lucide="${cat.icon}" class="w-6 h-6"></i>
            </div>
            <h3 class="font-bold text-slate-800 text-lg mb-1">${cat.title}</h3>
            <p class="text-xs text-slate-500">${categoryContents[cat.id]?.length || 0} protocolos</p>
        </div>
    `).join('');
    
    // Re-run lucide icons for injected HTML
    if (window.lucide) lucide.createIcons();
}

// Expose to window for onclick (module scope is private by default)
window.selectCategory = function(categoryId) {
    currentCategory = categories.find(c => c.id === categoryId);
    
    // Update UI
    categoryGrid.classList.add('hidden');
    activeContext.classList.remove('hidden');
    
    // Update Badge
    activeCategoryBadge.className = `px-3 py-1 bg-${currentCategory.color}-100 text-${currentCategory.color}-700 rounded-full text-sm font-medium`;
    activeCategoryBadge.textContent = currentCategory.title;
    
    // Render Complaints
    renderComplaints(categoryContents[categoryId]);
}

function renderComplaints(list) {
    complaintsList.innerHTML = list.map(item => `
        <button class="text-left px-4 py-3 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all text-sm font-medium text-slate-700 flex items-center justify-between group"
            onclick="selectComplaint('${item}')">
            ${item}
            <i data-lucide="chevron-right" class="w-4 h-4 text-slate-300 group-hover:text-slate-500"></i>
        </button>
    `).join('');
    
    // Hide Triage Section until selection
    triageSection.classList.add('hidden');
    
    if (window.lucide) lucide.createIcons();
}

window.selectComplaint = function(complaintName) {
    const protocol = getProtocol(complaintName);
    
    // Update Triage Section
    document.getElementById('current-complaint-title').textContent = complaintName;
    
    // Render Lists
    document.getElementById('list-red').innerHTML = protocol.vermelha.map(i => `<li class="flex items-start gap-2"><div class="min-w-[6px] h-[6px] rounded-full bg-red-500 mt-1.5"></div>${i}</li>`).join('');
    document.getElementById('list-yellow').innerHTML = protocol.amarela.map(i => `<li class="flex items-start gap-2"><div class="min-w-[6px] h-[6px] rounded-full bg-yellow-500 mt-1.5"></div>${i}</li>`).join('');
    document.getElementById('list-green').innerHTML = protocol.verde.map(i => `<li class="flex items-start gap-2"><div class="min-w-[6px] h-[6px] rounded-full bg-emerald-500 mt-1.5"></div>${i}</li>`).join('');
    
    // Render Guidelines
    document.getElementById('ai-guidelines').innerHTML = protocol.orientacoes.map(i => `
        <div class="flex items-start gap-2">
            <i data-lucide="check" class="w-4 h-4 text-green-400 mt-0.5"></i>
            <span>${i}</span>
        </div>
    `).join('');
    
    // Show Section
    triageSection.classList.remove('hidden');
    
    // Scroll to section
    triageSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    
    if (window.lucide) lucide.createIcons();
}

function setupEventListeners() {
    backToHomeBtn.addEventListener('click', () => {
        activeContext.classList.add('hidden');
        categoryGrid.classList.remove('hidden');
        triageSection.classList.add('hidden');
    });

    globalSearch.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        if (term.length < 2) {
            // Restore category view if search is cleared
             if (activeContext.classList.contains('hidden')) {
                 // Should reset anything?
             }
             return;
        }

        // Search across all categories
        let results = [];
        Object.entries(categoryContents).forEach(([catId, complaints]) => {
            complaints.forEach(c => {
                if (c.toLowerCase().includes(term)) {
                    results.push(c);
                }
            });
        });

        // If generic search results found, show them in a special "Search Results" view
        // For simplicity, we just simulate entering a "Search" category
        activeContext.classList.remove('hidden');
        categoryGrid.classList.add('hidden');
        activeCategoryBadge.className = 'px-3 py-1 bg-slate-200 text-slate-700 rounded-full text-sm font-medium';
        activeCategoryBadge.textContent = `Resultados para "${term}"`;
        
        renderComplaints(results);
    });
}

// Run
init();
