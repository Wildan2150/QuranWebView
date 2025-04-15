// home.js
console.log('home.js loaded');

// DOM Elements
const elements = {
  searchInput: document.getElementById('search-input'),
  clearSearchBtn: document.getElementById('clear-search'),
  surahModeBtn: document.getElementById('surah-mode-btn'),
  juzModeBtn: document.getElementById('juz-mode-btn'),
  surahSection: document.getElementById('surah-section'),
  juzSection: document.getElementById('juz-section'),
  surahContainer: document.getElementById('surah-container'),
  juzContainer: document.getElementById('juz-container'),
  lastReadingBtn: document.getElementById('last-reading-btn'),
  lastReadingTooltip: document.getElementById('last-reading-tooltip')
};

// State
const state = {
  currentMode: 'surah',
  allSurahs: [],
  allJuzs: []
};

// Utility Functions
const utils = {
  showElement: (el) => el.classList.remove('hidden'),
  hideElement: (el) => el.classList.add('hidden'),
  toggleActive: (activeEl, inactiveEl) => {
    activeEl.classList.add('active');
    inactiveEl.classList.remove('active');
  },
  renderError: (container, message) => {
    container.innerHTML = `<p class="text-center text-red-600 col-span-full">${message}</p>`;
  },
  renderNoResults: (container) => {
    container.innerHTML = '<p class="text-center text-gray-500 col-span-full py-6">No results found matching your search.</p>';
  }
};

// Render Functions
const render = {
  surah: (surahs) => {
    const { surahContainer } = elements;
    
    if (!surahs || !Array.isArray(surahs)) {
      utils.renderError(surahContainer, 'Failed to load surah list. Please try again.');
      return;
    }

    if (surahs.length === 0) {
      utils.renderNoResults(surahContainer);
      return;
    }

    surahContainer.innerHTML = surahs.map(surah => `
      <div class="bg-white rounded-lg shadow-md p-4 sm:p-3 md:p-3 lg:p-5 hover:shadow-lg transition-shadow cursor-pointer"
           onclick="window.location.href='read.html?page=${surah.page}'">
        <div class="flex items-center justify-between gap-3 sm:gap-2 md:gap-2 lg:gap-4">
          <div class="flex items-center flex-1 min-w-0">
            <div class="bg-emerald-100 text-emerald-800 rounded-full w-10 h-10 sm:w-8 sm:h-8 md:w-8 md:h-8 lg:w-10 lg:h-10 flex items-center justify-center flex-shrink-0 mr-2">
              <h4 class="font-bold">${surah.number || "N/A"}</h4>
            </div>
            <div class="flex-1 px-2 sm:px-1 md:px-1 lg:px-3 min-w-0">
              <h4 class="font-bold text-lg text-emerald-700">${surah.name || "Unknown"}</h4>
              <div class="flex flex-wrap items-center text-sm text-gray-500 mt-1 gap-1 sm:gap-0.5 md:gap-0.5 lg:gap-1">
                <span>${surah.revelation || "N/A"}</span>
                <span> • </span>
                <span>${surah.verses || "N/A"} Ayahs</span>
                <span> • </span>
                <span>Juz: ${Array.isArray(surah.juz) ? surah.juz.join(", ") : surah.juz || "N/A"}</span>
              </div>
            </div>
          </div>
          <div class="flex justify-end items-center flex-shrink-0 min-w-0 sm:min-w-[20px] md:min-w-[20px] lg:min-w-0">
            <h4 class="arabic-text text-2xl text-gray-800">${surah.arabic || "غير متوفر"}</h4>
          </div>
        </div>
      </div>
    `).join('');
  },

  juz: (juzs) => {
    const { juzContainer } = elements;
    const { allSurahs } = state;

    if (!juzs || !Array.isArray(juzs)) {
      utils.renderError(juzContainer, 'Failed to load juz list. Please try again.');
      return;
    }

    if (juzs.length === 0) {
      utils.renderNoResults(juzContainer);
      return;
    }

    juzContainer.innerHTML = juzs.map(juz => `
      <div class="bg-white rounded-lg shadow-md p-4 sm:p-3 md:p-4 lg:p-5 hover:shadow-lg transition-shadow cursor-pointer"
           onclick="window.location.href='read.html?page=${juz.start}'">
        <div class="flex items-center gap-3 sm:gap-2 md:gap-3 lg:gap-4">
          <div class="bg-emerald-100 text-emerald-800 rounded-full w-10 h-10 sm:w-8 sm:h-8 md:w-10 md:h-10 flex items-center justify-center flex-shrink-0 mr-1">
            <h4 class="font-bold text-base sm:text-sm md:text-base">${juz.number}</h4>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex justify-between items-center">
              <h4 class="font-bold text-lg sm:text-base md:text-lg lg:text-xl text-emerald-700 truncate">Juz ${juz.number}</h4>
            </div>
            <div class="flex items-center text-sm sm:text-xs md:text-sm text-gray-500 mt-1 gap-1 sm:gap-0.5 md:gap-1 whitespace-nowrap">
              <span>Page ${juz.start}-${juz.end}</span>
              <span> • </span>
              <span class="truncate">${
                juz.surahs
                  .map(s => allSurahs.find(sd => sd.number === s)?.name || "")
                  .filter(name => name)
                  .join(", ")
              }</span>
            </div>
          </div>
        </div>
      </div>
    `).join('');
  },

  pageCard: (pageNum, container) => {
    const card = document.createElement("div");
    card.className = "bg-white rounded-lg shadow-md p-4 sm:p-3 md:p-3 lg:p-5 hover:shadow-lg transition-shadow cursor-pointer mb-0";
    card.innerHTML = `
      <div class="flex flex-col items-start justify-center text-center ml-4">
        <p class="font-bold text-lg text-emerald-700">Page ${pageNum}</p>
        <p class="text-sm sm:text-xs md:text-sm text-gray-500 mt-1">Go to Page ${pageNum}</p>
      </div>
    `;
    card.onclick = () => (window.location.href = `read.html?page=${pageNum}`);
    container.prepend(card); // Use prepend to add to top
  },
};

// Filter Functions
const filter = {
  surahs: (searchTerm) => {
    const { surahContainer } = elements;
    surahContainer.innerHTML = ''; // Clear container first
    
    if (!searchTerm) {
      return render.surah(state.allSurahs);
    }
    
    const term = searchTerm.toLowerCase();
    const numberMatch = term.match(/^\d+$/);
    const pageMatch = term.match(/^page\s+(\d+)$/);
    const pageNum = numberMatch ? parseInt(numberMatch[0]) : pageMatch ? parseInt(pageMatch[1]) : null;
    
    // Show page card if it's a valid page number (1-604)
    if (pageNum >= 1 && pageNum <= 604) {
      render.pageCard(pageNum, surahContainer);
    }
    
    
    // Filter surahs by search term
    const filtered = state.allSurahs.filter(surah => 
      (surah.name?.toLowerCase().includes(term)) ||
      (surah.arabic?.includes(term)) ||
      (surah.number?.toString().includes(term)) ||
      (surah.revelation?.toLowerCase().includes(term))
    );
    
    // Render filtered surahs
    if (filtered.length > 0) {
      const fragment = document.createDocumentFragment();
      filtered.forEach(surah => {
        const div = document.createElement('div');
        div.className = "bg-white rounded-lg shadow-md p-4 sm:p-3 md:p-3 lg:p-5 hover:shadow-lg transition-shadow cursor-pointer";
        div.innerHTML = `
          <div class="flex items-center justify-between gap-3 sm:gap-2 md:gap-2 lg:gap-4">
            <div class="flex items-center flex-1 min-w-0">
              <div class="bg-emerald-100 text-emerald-800 rounded-full w-10 h-10 sm:w-8 sm:h-8 md:w-8 md:h-8 lg:w-10 lg:h-10 flex items-center justify-center flex-shrink-0 mr-2">
                <h4 class="font-bold">${surah.number || "N/A"}</h4>
              </div>
              <div class="flex-1 px-2 sm:px-1 md:px-1 lg:px-3 min-w-0">
                <h4 class="font-bold text-lg text-emerald-700">${surah.name || "Unknown"}</h4>
                <div class="flex flex-wrap items-center text-sm text-gray-500 mt-1 gap-1 sm:gap-0.5 md:gap-0.5 lg:gap-1">
                  <span>${surah.revelation || "N/A"}</span>
                  <span> • </span>
                  <span>${surah.verses || "N/A"} Ayahs</span>
                  <span> • </span>
                  <span>Juz: ${Array.isArray(surah.juz) ? surah.juz.join(", ") : surah.juz || "N/A"}</span>
                </div>
              </div>
            </div>
            <div class="flex justify-end items-center flex-shrink-0 min-w-0 sm:min-w-[20px] md:min-w-[20px] lg:min-w-0">
              <h4 class="arabic-text text-2xl text-gray-800">${surah.arabic || "غير متوفر"}</h4>
            </div>
          </div>
        `;
        div.onclick = () => (window.location.href = `read.html?page=${surah.page}`);
        fragment.appendChild(div);
      });
      surahContainer.appendChild(fragment);
    } else if (!pageNum) {
      utils.renderNoResults(surahContainer);
    }
  },

  juzs: (searchTerm) => {
    const { juzContainer } = elements;
    juzContainer.innerHTML = ''; // Clear container first
    
    if (!searchTerm) {
      return render.juz(state.allJuzs);
    }
    
    const term = searchTerm.toLowerCase().trim();
    const numberMatch = term.match(/^\d+$/);
    const pageMatch = term.match(/^page\s+(\d+)$/);
    const pageNum = numberMatch ? parseInt(numberMatch[0]) : pageMatch ? parseInt(pageMatch[1]) : null;
    
    // Show page card if it's a valid page number (1-604)
    if (pageNum >= 1 && pageNum <= 604) {
      render.pageCard(pageNum, juzContainer);
    }
    
    // Filter juzs by search term
    const filtered = state.allJuzs.filter(juz => 
      juz.number?.toString().includes(term) ||
      juz.surahs?.some(surahNumber => {
        const surah = state.allSurahs.find(sd => sd.number === surahNumber);
        return surah?.name?.toLowerCase().includes(term) || surah?.arabic?.includes(term);
      })
    );
    
    // Render filtered juzs
    if (filtered.length > 0) {
      const fragment = document.createDocumentFragment();
      filtered.forEach(juz => {
        const div = document.createElement('div');
        div.className = "bg-white rounded-lg shadow-md p-4 sm:p-3 md:p-4 lg:p-5 hover:shadow-lg transition-shadow cursor-pointer";
        div.innerHTML = `
          <div class="flex items-center gap-3 sm:gap-2 md:gap-3 lg:gap-4">
            <div class="bg-emerald-100 text-emerald-800 rounded-full w-10 h-10 sm:w-8 sm:h-8 md:w-10 md:h-10 flex items-center justify-center flex-shrink-0 mr-1">
              <h4 class="font-bold text-base sm:text-sm md:text-base">${juz.number}</h4>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex justify-between items-center">
                <h4 class="font-bold text-lg sm:text-base md:text-lg lg:text-xl text-emerald-700 truncate">Juz ${juz.number}</h4>
              </div>
              <div class="flex items-center text-sm sm:text-xs md:text-sm text-gray-500 mt-1 gap-1 sm:gap-0.5 md:gap-1 whitespace-nowrap">
                <span>Page ${juz.start}-${juz.end}</span>
                <span> • </span>
                <span class="truncate">${
                  juz.surahs
                    .map(s => state.allSurahs.find(sd => sd.number === s)?.name || "")
                    .filter(name => name)
                    .join(", ")
                }</span>
              </div>
            </div>
          </div>
        `;
        div.onclick = () => (window.location.href = `read.html?page=${juz.start}`);
        fragment.appendChild(div);
      });
      juzContainer.appendChild(fragment);
    } else if (!pageNum) {
      utils.renderNoResults(juzContainer);
    }
  }
};


// Mode Management
const mode = {
  toggle: (newMode) => {
    state.currentMode = newMode;
    
    if (newMode === 'surah') {
      utils.toggleActive(elements.surahModeBtn, elements.juzModeBtn);
      utils.showElement(elements.surahSection);
      utils.hideElement(elements.juzSection);
      filter.surahs(elements.searchInput.value.trim());
    } else {
      utils.toggleActive(elements.juzModeBtn, elements.surahModeBtn);
      utils.showElement(elements.juzSection);
      utils.hideElement(elements.surahSection);
      filter.juzs(elements.searchInput.value.trim());
    }
  }
};

// Last Reading Functions
const lastReading = {
  init: () => {
    const lastPage = localStorage.getItem('lastPage');
    const { lastReadingBtn, lastReadingTooltip } = elements;
    
    if (lastPage && !isNaN(lastPage)) {
      lastReadingBtn.disabled = false;
      lastReadingBtn.classList.remove('cursor-not-allowed');
      lastReadingTooltip.textContent = `Page: ${lastPage}`;
    } else {
      lastReadingBtn.disabled = true;
      lastReadingBtn.classList.add('cursor-not-allowed');
      lastReadingTooltip.textContent = 'No recent reading';
    }
  },
  
  handleClick: () => {
    const lastPage = localStorage.getItem('lastPage');
    if (lastPage) window.location.href = `read.html?page=${lastPage}`;
  }
};

// Event Handlers
const handlers = {
  searchInput: (e) => {
    const searchTerm = e.target.value.trim();
    elements.clearSearchBtn.classList.toggle('hidden', !searchTerm);
    
    state.currentMode === 'surah' 
      ? filter.surahs(searchTerm) 
      : filter.juzs(searchTerm);
  },
  
  clearSearch: () => {
    elements.searchInput.value = '';
    elements.clearSearchBtn.classList.add('hidden');
    elements.searchInput.focus();
    state.currentMode === 'surah' 
      ? filter.surahs('') 
      : filter.juzs('');
  }
};

// Initialize App
const init = () => {
  console.log('DOM loaded, surahData:', surahData);
  console.log('juzInfo:', juzInfo);
  
  if (typeof surahData === 'undefined') {
    console.error('surahData is not defined');
    utils.renderError(elements.surahContainer, 'Surah data not found.');
    return;
  }

  if (typeof juzInfo === 'undefined') {
    console.error('juzInfo is not defined');
    utils.renderError(elements.juzContainer, 'Juz data not found.');
    return;
  }

  state.allSurahs = surahData;
  state.allJuzs = juzInfo;

  render.surah(state.allSurahs);
  render.juz(state.allJuzs);
  lastReading.init();
  
  // Event Listeners
  elements.searchInput.addEventListener('input', handlers.searchInput);
  elements.clearSearchBtn.addEventListener('click', handlers.clearSearch);
  elements.surahModeBtn.addEventListener('click', () => mode.toggle('surah'));
  elements.juzModeBtn.addEventListener('click', () => mode.toggle('juz'));
  elements.lastReadingBtn.addEventListener('click', lastReading.handleClick);
};

// Start the app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);