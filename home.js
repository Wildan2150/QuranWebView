// home.js
console.log('home.js loaded');

// DOM Elements
const searchInput = document.getElementById('search-input');
const clearSearchBtn = document.getElementById('clear-search');
const surahModeBtn = document.getElementById('surah-mode-btn');
const juzModeBtn = document.getElementById('juz-mode-btn');
const surahSection = document.getElementById('surah-section');
const juzSection = document.getElementById('juz-section');
const surahContainer = document.getElementById('surah-container');
const juzContainer = document.getElementById('juz-container');

// State
let currentMode = 'surah';
let allSurahs = [];
let allJuzs = [];

// Main Functions
function renderSurahs(surahs) {
  console.log('Rendering surahs:', surahs);
  if (!surahs || !Array.isArray(surahs)) {
    console.error('Invalid surah data');
    surahContainer.innerHTML = '<p class="text-center text-red-600 col-span-full">Failed to load surah list. Please try again.</p>';
    return;
  }

  if (surahs.length === 0) {
    surahContainer.innerHTML = '<p class="text-center text-gray-500 col-span-full">No surahs found matching your search.</p>';
    return;
  }

  surahContainer.innerHTML = '';

  surahs.forEach((surah) => {
    const surahElement = document.createElement("div");
    surahElement.className =
      "bg-white rounded-lg shadow-md p-4 sm:p-3 md:p-3 lg:p-5 hover:shadow-lg transition-shadow cursor-pointer";
    surahElement.onclick = () =>
      (window.location.href = `read.html?page=${surah.page}`);
    surahElement.innerHTML = `
      <div class="flex items-center justify-between gap-3 sm:gap-2 md:gap-2 lg:gap-4">
        <div class="flex items-center flex-1 min-w-0">
          <div class="bg-emerald-100 text-emerald-800 rounded-full w-10 h-10 sm:w-8 sm:h-8 md:w-8 md:h-8 lg:w-10 lg:h-10 flex items-center justify-center flex-shrink-0 mr-2">
            <h4 class="font-bold">${surah.number || "N/A"}</h4>
          </div>
          <div class="flex-1 px-2 sm:px-1 md:px-1 lg:px-3 min-w-0">
            <h4 class="font-bold text-lg text-emerald-700">${
              surah.name || "Unknown"
            }</h4>
            <div class="flex flex-wrap items-center text-sm text-gray-500 mt-1 gap-1 sm:gap-0.5 md:gap-0.5 lg:gap-1">
              <span>${surah.revelation || "N/A"}</span>
              <span> • </span>
              <span>${surah.verses || "N/A"} Ayahs</span>
              <span> • </span>
              <span>Juz: ${
                Array.isArray(surah.juz)
                  ? surah.juz.join(", ")
                  : surah.juz || "N/A"
              }</span>
            </div>
          </div>
        </div>
        <div class="flex justify-end items-center flex-shrink-0 min-w-0 sm:min-w-[20px] md:min-w-[20px] lg:min-w-0">
          <h4 class="arabic-text text-2xl text-gray-800">${
            surah.arabic || "غير متوفر"
          }</h4>
        </div>
      </div>
    `;
    surahContainer.appendChild(surahElement);
  });
}

function renderJuzs(juzs) {
  if (!juzs || !Array.isArray(juzs)) {
    console.error('Invalid juz data');
    juzContainer.innerHTML = '<p class="text-center text-red-600 col-span-full">Failed to load juz list. Please try again.</p>';
    return;
  }

  juzContainer.innerHTML = juzs.length === 0
  ? '<p class="text-center text-gray-500 col-span-full py-6">No juz found matching your search.</p>'
  : juzs
      .map(
        (juz) => `
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
              <span> • </span>
              <span class="truncate">${
                juz.surahs
                  .map((s) => {
                    const surah = surahData.find((sd) => sd.number === s);
                    return surah ? surah.name : "";
                  })
                  .join(", ")
              }</span>
            </div>
          </div>
        </div>
      </div>
    `
      )
      .join("");
}

function filterSurahs(searchTerm) {
  if (!searchTerm || searchTerm.trim() === '') {
    renderSurahs(allSurahs);
    return;
  }

  const term = searchTerm.toLowerCase();
  const filtered = allSurahs.filter(surah => {
    return (
      (surah.name && surah.name.toLowerCase().includes(term)) ||
      (surah.arabic && surah.arabic.includes(term)) ||
      (surah.number && surah.number.toString().includes(term)) ||
      (surah.revelation && surah.revelation.toLowerCase().includes(term)) 
    );
  });

  renderSurahs(filtered);
}

function filterJuzs(searchTerm) {
  if (!searchTerm || searchTerm.trim() === '') {
    renderJuzs(allJuzs);
    return;
  }

  const term = searchTerm.toLowerCase().trim();
  const filtered = allJuzs.filter((juz) => {
    // Match by juz number
    if (juz.number && juz.number.toString().includes(term)) {
      return true;
    }

    // Match by surah name or Arabic name
    if (Array.isArray(juz.surahs)) {
      return juz.surahs.some((surahNumber) => {
        const surah = allSurahs.find((sd) => sd.number === surahNumber);
        return (
          surah &&
          ((surah.name && surah.name.toLowerCase().includes(term)) ||
            (surah.arabic && surah.arabic.includes(term)))
        );
      });
    }

    return false;
  });
  

  renderJuzs(filtered);
}

function toggleMode(mode) {
  currentMode = mode;

  if (mode === 'surah') {
    surahModeBtn.classList.add('active');
    juzModeBtn.classList.remove('active');
    surahSection.classList.remove('hidden');
    juzSection.classList.add('hidden');
    filterSurahs(searchInput.value);
  } else {
    juzModeBtn.classList.add('active');
    surahModeBtn.classList.remove('active');
    juzSection.classList.remove('hidden');
    surahSection.classList.add('hidden');
    filterJuzs(searchInput.value);
  }
}

// Event Listeners
searchInput.addEventListener('input', (e) => {
  const searchTerm = e.target.value.trim();
  if (searchTerm) {
    clearSearchBtn.classList.remove('hidden');
  } else {
    clearSearchBtn.classList.add('hidden');
  }

  if (currentMode === 'surah') {
    filterSurahs(searchTerm);
  } else {
    filterJuzs(searchTerm);
  }
});

clearSearchBtn.addEventListener('click', () => {
  searchInput.value = '';
  clearSearchBtn.classList.add('hidden');
  if (currentMode === 'surah') {
    filterSurahs('');
  } else {
    filterJuzs('');
  }
  searchInput.focus();
});

surahModeBtn.addEventListener('click', () => toggleMode('surah'));
juzModeBtn.addEventListener('click', () => toggleMode('juz'));

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, surahData:', surahData);
  console.log('juzInfo:', juzInfo);
  
  if (typeof surahData === 'undefined') {
    console.error('surahData is not defined');
    surahContainer.innerHTML = '<p class="text-center text-red-600 col-span-full">Surah data not found.</p>';
    return;
  }

  if (typeof juzInfo === 'undefined') {
    console.error('juzInfo is not defined');
    juzContainer.innerHTML = '<p class="text-center text-red-600 col-span-full">Juz data not found.</p>';
    return;
  }

  allSurahs = surahData;
  allJuzs = juzInfo;

  renderSurahs(allSurahs);
  renderJuzs(allJuzs);
});
