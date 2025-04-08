document.addEventListener('DOMContentLoaded', function() {
    // State Management
    let currentPage = 1;
    const totalPages = 604;
    let singlePageMode = window.innerWidth < 768;
    let fullscreenActive = false;
    const preloadCache = new Map();

    // DOM Elements
    const pageLeft = document.getElementById('page-left');
    const pageRight = document.getElementById('page-right');
    const pageRightContainer = document.getElementById('page-right-container');
    const pageNumberInput = document.getElementById('page-number');
    const currentSurahDisplay = document.getElementById('current-surah');
    const currentJuzDisplay = document.getElementById('current-juz');
    const juzPageRange = document.getElementById('juz-page-range');
    const juzProgressFill = document.getElementById('juz-progress-fill');
    const currentJuzDisplayTop = document.getElementById('current-juz-display');
    const quranContainer = document.getElementById('quran-container');
    const drawerOverlay = document.getElementById('drawer-overlay');
    const pageLeftLoader = document.getElementById('page-left-loader');
    const pageRightLoader = document.getElementById('page-right-loader');
    // Drawer elements
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const closeDrawerBtn = document.getElementById('close-drawer-btn');
    const appDrawer = document.getElementById('app-drawer');

    // Enhanced dropdown toggle function
    function toggleDropdown(dropdownId, btnId) {
      const dropdown = document.getElementById(dropdownId);
      const btn = document.getElementById(btnId);
      
      dropdown.classList.toggle('open');
      const icon = btn.querySelector('i');
      if (icon) {
        icon.classList.toggle('fa-chevron-down');
        icon.classList.toggle('fa-chevron-up');
      }
      
      // Close other dropdowns when opening a new one
      if (dropdown.classList.contains('open')) {
        document.querySelectorAll('.dropdown-content').forEach(dd => {
          if (dd.id !== dropdownId && dd.classList.contains('open')) {
            dd.classList.remove('open');
            const otherBtn = document.querySelector(`[aria-controls="${dd.id}"]`);
            if (otherBtn) {
              const otherIcon = otherBtn.querySelector('i');
              if (otherIcon) {
                otherIcon.classList.remove('fa-chevron-up');
                otherIcon.classList.add('fa-chevron-down');
              }
            }
          }
        });
      }
    }
    // Navigation Functions
    async function updatePages() {
      // Fade out current pages
      pageLeft.classList.add('opacity-0');
      if (!singlePageMode) pageRight.classList.add('opacity-0');
      await new Promise(r => setTimeout(r, 100));
    
      // Show loaders
      pageLeftLoader.classList.remove('hidden');
      if (!singlePageMode) pageRightLoader.classList.remove('hidden');
    
      // Update page sources and visibility FIRST
      pageNumberInput.value = singlePageMode ? currentPage : `${currentPage}-${currentPage + 1}`;
      document.getElementById('drawer-page-number').value = singlePageMode ? currentPage : `${currentPage}-${currentPage + 1}`;
    
      if (singlePageMode) {
        pageRightContainer.style.display = 'none';
      } else {
        pageRightContainer.style.display = 'block';
      }
    
      // Create load promises before setting src
      const leftLoadPromise = new Promise((resolve) => {
        pageLeft.onload = pageLeft.onerror = resolve;
      });
      pageLeft.src = `https://media.qurankemenag.net/khat2/QK_${String(currentPage).padStart(3, '0')}.webp`;
    
      let rightLoadPromise;
      if (!singlePageMode) {
        rightLoadPromise = new Promise((resolve) => {
          pageRight.onload = pageRight.onerror = resolve;
        });
        pageRight.src = `https://media.qurankemenag.net/khat2/QK_${String(currentPage + 1).padStart(3, '0')}.webp`;
      }
    
      // Wait for images to load
      const loadPromises = [leftLoadPromise];
      if (!singlePageMode) loadPromises.push(rightLoadPromise);
      await Promise.all(loadPromises);
    
      // Hide loaders and fade in images
      pageLeftLoader.classList.add('hidden');
      if (!singlePageMode) pageRightLoader.classList.add('hidden');
      pageLeft.classList.remove('opacity-0');
      if (!singlePageMode) pageRight.classList.remove('opacity-0');
    
    

      // Update current Surah and Juz display
      updateSurahJuzDisplay();
      preloadPages();
      updateButtonStyles();
      
      // Close drawer if open
      closeDrawer();
    }
    function updateSurahJuzDisplay() {
      // Find current Surah
      const currentSurah = surahData.findLast ? 
        surahData.findLast(s => s.page <= currentPage) : 
        [...surahData].reverse().find(s => s.page <= currentPage);
      
      if (currentSurah) {
        currentSurahDisplay.textContent = `${currentSurah.number}. ${currentSurah.name}`;
        document.getElementById('drawer-current-surah').textContent = `${currentSurah.number}. ${currentSurah.name}`;
      }

      // Find current Juz
      const currentJuz = juzInfo.find(j => currentPage >= j.start && currentPage <= j.end);
      if (currentJuz) {
        currentJuzDisplay.textContent = `Juz ${currentJuz.number}`;
        document.getElementById('drawer-current-juz').textContent = `Juz ${currentJuz.number}`;
        currentJuzDisplayTop.textContent = `Juz ${currentJuz.number}`;
        juzPageRange.textContent = `Page ${currentJuz.start}-${currentJuz.end}`;
        
        // Calculate progress percentage
        const progress = ((currentPage - currentJuz.start) / (currentJuz.end - currentJuz.start)) * 100;
        juzProgressFill.style.width = `${Math.max(2, Math.min(100, progress))}%`;
      }
    }

    function preloadPages() {
      const pagesToPreload = singlePageMode
        ? [currentPage - 1, currentPage + 1]
        : [currentPage - 2, currentPage - 1, currentPage + 2, currentPage + 3];

      pagesToPreload.forEach(page => {
        if (page > 0 && page <= totalPages && !preloadCache.has(page)) {
          const img = new Image();
          img.src = `https://media.qurankemenag.net/khat2/QK_${String(page).padStart(3, '0')}.webp`;
          preloadCache.set(page, img);
        }
      });
    }

    // Drawer functions
    function openDrawer() {
      appDrawer.classList.add('open');
      drawerOverlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    }

    function closeDrawer() {
      appDrawer.classList.remove('open');
      drawerOverlay.classList.remove('active');
      document.body.style.overflow = '';
    }

    // Fullscreen handling
    async function toggleFullscreen() {
      try {
        if (!fullscreenActive) {
          // Try standard API first
          if (document.documentElement.requestFullscreen) {
            await document.documentElement.requestFullscreen();
          } 
          // Fallback for Safari
          else if (document.documentElement.webkitRequestFullscreen) {
            await document.documentElement.webkitRequestFullscreen();
          }
          // Fallback for IE/Edge
          else if (document.documentElement.msRequestFullscreen) {
            await document.documentElement.msRequestFullscreen();
          }
          fullscreenActive = true;
        } else {
          // Exit fullscreen
          if (document.exitFullscreen) {
            await document.exitFullscreen();
          } else if (document.webkitExitFullscreen) {
            await document.webkitExitFullscreen();
          } else if (document.msExitFullscreen) {
            await document.msExitFullscreen();
          }
          fullscreenActive = false;
        }
      } catch (err) {
        console.error("Fullscreen error:", err);
      }
      updateButtonStyles();
    }

    // Listen for fullscreen changes
    ['fullscreenchange', 'webkitfullscreenchange', 'msfullscreenchange'].forEach(event => {
      document.addEventListener(event, () => {
        fullscreenActive = !!(
          document.fullscreenElement || 
          document.webkitFullscreenElement || 
          document.msFullscreenElement
        );
        updateButtonStyles();
      });
    });

    function updateButtonStyles() {
      // Update view mode buttons
      document.getElementById('single-page-button').classList.toggle('bg-emerald-700', singlePageMode);
      document.getElementById('single-page-button').classList.toggle('bg-emerald-600', !singlePageMode);
      document.getElementById('two-page-button').classList.toggle('bg-emerald-700', !singlePageMode);
      document.getElementById('two-page-button').classList.toggle('bg-emerald-600', singlePageMode);
      document.getElementById('drawer-single-page-button').classList.toggle('bg-emerald-700', singlePageMode);
      document.getElementById('drawer-single-page-button').classList.toggle('bg-emerald-600', !singlePageMode);
      document.getElementById('drawer-two-page-button').classList.toggle('bg-emerald-700', !singlePageMode);
      document.getElementById('drawer-two-page-button').classList.toggle('bg-emerald-600', singlePageMode);
      
      // Update fullscreen button
      const fullscreenButton = document.getElementById('fullscreen-button');
      const drawerFullscreenButton = document.getElementById('drawer-fullscreen-button');
      
      if (fullscreenButton) {
        fullscreenButton.classList.toggle('bg-emerald-700', fullscreenActive);
        fullscreenButton.classList.toggle('bg-emerald-600', !fullscreenActive);
      }
      
      if (drawerFullscreenButton) {
        drawerFullscreenButton.classList.toggle('bg-emerald-700', fullscreenActive);
        drawerFullscreenButton.classList.toggle('bg-emerald-600', !fullscreenActive);
      }
      
      // Update fullscreen icon
      const icon = document.querySelector('#fullscreen-button i');
      if (icon) {
        icon.className = fullscreenActive ? 'fas fa-compress' : 'fas fa-expand';
      }
      const drawerIcon = document.querySelector('#drawer-fullscreen-button i');
      if (drawerIcon) {
        drawerIcon.className = fullscreenActive ? 'fas fa-compress' : 'fas fa-expand';
      }
      
      // Disable two-page mode on mobile
      const twoPageButton = document.getElementById('two-page-button');
      const drawerTwoPageButton = document.getElementById('drawer-two-page-button');
      
      if (twoPageButton) {
        twoPageButton.disabled = window.innerWidth < 768;
        twoPageButton.classList.toggle('opacity-50', window.innerWidth < 768);
        twoPageButton.classList.toggle('cursor-not-allowed', window.innerWidth < 768);
      }
      
      if (drawerTwoPageButton) {
        drawerTwoPageButton.disabled = window.innerWidth < 768;
        drawerTwoPageButton.classList.toggle('opacity-50', window.innerWidth < 768);
        drawerTwoPageButton.classList.toggle('cursor-not-allowed', window.innerWidth < 768);
      }
    }

    // Surah Navigation
    function initSurahSelector(prefix = '') {
      const elements = {
        btn: document.getElementById(`${prefix}surah-dropdown-btn`),
        dropdown: document.getElementById(`${prefix}surah-dropdown`),
        search: document.getElementById(`${prefix}surah-search`),
        list: document.getElementById(`${prefix}surah-list`),
        current: document.getElementById(`${prefix}current-surah`)
      };

      if (!elements.btn || !elements.dropdown) return;

      function populateSurahList(filter = '') {
        if (!elements.list) return;
        elements.list.innerHTML = '';
        const filtered = surahData.filter(s => 
          s.name.toLowerCase().includes(filter.toLowerCase()) || 
          s.number.toString().includes(filter)
        );

        filtered.forEach(surah => {
          const item = document.createElement('div');
          item.className = 'p-3 hover:bg-emerald-50 cursor-pointer flex justify-between items-center transition-colors';
          item.innerHTML = `
            <div class="flex-1 min-w-0">
              <span class="font-medium text-emerald-700 truncate">${surah.number}. ${surah.name}</span>
              <div class="flex items-center mt-1 text-xs text-gray-500">
                <span class="mr-2">Page ${surah.page}</span>
                <span class="px-1.5 py-0.5 bg-gray-100 rounded-full text-xs">${surah.revelation}</span>
              </div>
            </div>
            <span class="text-xs bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full whitespace-nowrap ml-2">
              Juz ${Array.isArray(surah.juz) ? surah.juz.join(',') : surah.juz}
            </span>
          `;
          item.addEventListener('click', () => {
            navigateToSurah(surah.number);
            elements.dropdown.classList.remove('open');
            const icon = elements.btn.querySelector('i');
            if (icon) {
              icon.classList.remove('fa-chevron-up');
              icon.classList.add('fa-chevron-down');
            }
          });
          elements.list.appendChild(item);
        });
      }

      elements.search?.addEventListener('input', (e) => {
        populateSurahList(e.target.value);
      });

      elements.btn.addEventListener('click', () => {
        toggleDropdown(elements.dropdown.id, elements.btn.id);
        if (elements.dropdown.classList.contains('open')) {
          populateSurahList();
          elements.search?.focus();
        }
      });

      // Close dropdown when clicking outside
      document.addEventListener('click', (e) => {
        if (!elements.dropdown.contains(e.target) && e.target !== elements.btn) {
          elements.dropdown.classList.remove('open');
          const icon = elements.btn.querySelector('i');
          if (icon) {
            icon.classList.remove('fa-chevron-up');
            icon.classList.add('fa-chevron-down');
          }
        }
      });

      // Add ARIA attributes for accessibility
      elements.btn.setAttribute('aria-expanded', 'false');
      elements.btn.setAttribute('aria-controls', elements.dropdown.id);
      elements.btn.addEventListener('click', () => {
        const expanded = elements.btn.getAttribute('aria-expanded') === 'true';
        elements.btn.setAttribute('aria-expanded', !expanded);
      });

      populateSurahList();
    }

    function navigateToSurah(surahNumber) {
      const surah = surahData.find(s => s.number === surahNumber);
      if (surah) {
        currentPage = surah.page;
        if (!singlePageMode && currentPage % 2 === 0) currentPage--;
        updatePages();
      }
    }

    // Juz Navigation
    function initJuzSelector(prefix = '') {
      const elements = {
        btn: document.getElementById(`${prefix}juz-dropdown-btn`),
        dropdown: document.getElementById(`${prefix}juz-dropdown`),
        list: document.getElementById(`${prefix}juz-list`),
        current: document.getElementById(`${prefix}current-juz`)
      };

      if (!elements.btn || !elements.dropdown || !elements.list) return;

      elements.list.innerHTML = '';
      juzInfo.forEach(juz => {
        const item = document.createElement('div');
        item.className = 'p-3 hover:bg-emerald-50 cursor-pointer transition-colors';
        item.innerHTML = `
          <div class="flex items-center justify-between w-full">
            <div class="py-0.5 font-bold text-emerald-600">Juz ${juz.number}</div>
            <span class="text-xs text-gray-500 bg-gray-100 rounded-full px-2 py-0.5 whitespace-nowrap">
              Pages ${juz.start}-${juz.end}
            </span>
          </div>
          <div class="text-xs text-gray-500 mt-1 truncate">
            ${juz.surahs.map(s => {
              const surah = surahData.find(sd => sd.number === s);
              return surah ? surah.name : '';
            }).join(', ')}
          </div>
        `;
        item.addEventListener('click', () => {
          currentPage = juz.start;
          if (!singlePageMode && currentPage % 2 === 0) currentPage--;
          updatePages();
          elements.dropdown.classList.remove('open');
          const icon = elements.btn.querySelector('i');
          if (icon) {
            icon.classList.remove('fa-chevron-up');
            icon.classList.add('fa-chevron-down');
          }
        });
        elements.list.appendChild(item);
      });

      elements.btn.addEventListener('click', () => {
        toggleDropdown(elements.dropdown.id, elements.btn.id);
      });

      // Close dropdown when clicking outside
      document.addEventListener('click', (e) => {
        if (!elements.dropdown.contains(e.target) && e.target !== elements.btn) {
          elements.dropdown.classList.remove('open');
          const icon = elements.btn.querySelector('i');
          if (icon) {
            icon.classList.remove('fa-chevron-up');
            icon.classList.add('fa-chevron-down');
          }
        }
      });

      // Add ARIA attributes for accessibility
      elements.btn.setAttribute('aria-expanded', 'false');
      elements.btn.setAttribute('aria-controls', elements.dropdown.id);
      elements.btn.addEventListener('click', () => {
        const expanded = elements.btn.getAttribute('aria-expanded') === 'true';
        elements.btn.setAttribute('aria-expanded', !expanded);
      });
    }

    // Event Listeners
    function initEventListeners() {
      // Drawer functionality
      if (hamburgerBtn) hamburgerBtn.addEventListener('click', openDrawer);
      if (closeDrawerBtn) closeDrawerBtn.addEventListener('click', closeDrawer);
      if (drawerOverlay) drawerOverlay.addEventListener('click', closeDrawer);

      // Page navigation
      const prevBtn = document.getElementById('prev-btn');
      const nextBtn = document.getElementById('next-btn');
      
      if (prevBtn) {
        prevBtn.addEventListener('click', () => {
          if (currentPage > 1) {
            currentPage -= singlePageMode ? 1 : 2;
            updatePages();
          }
        });
      }
      
      if (nextBtn) {
        nextBtn.addEventListener('click', () => {
          if (currentPage < (singlePageMode ? totalPages : totalPages - 1)) {
            currentPage += singlePageMode ? 1 : 2;
            updatePages();
          }
        });
      }

      // Touch gestures for mobile
      let touchStartX = 0;
      let touchEndX = 0;
      
      if (quranContainer) {
        quranContainer.addEventListener('touchstart', (e) => {
          touchStartX = e.changedTouches[0].screenX;
        }, {passive: true});
        
        quranContainer.addEventListener('touchend', (e) => {
          touchEndX = e.changedTouches[0].screenX;
          handleSwipe();
        }, {passive: true});
      }
      
      function handleSwipe() {
        const threshold = 50;
        if (touchStartX - touchEndX > threshold) {
          // Swipe left - next page
          if (currentPage < (singlePageMode ? totalPages : totalPages - 1)) {
            currentPage += singlePageMode ? 1 : 2;
            updatePages();
          }
        } else if (touchEndX - touchStartX > threshold) {
          // Swipe right - previous page
          if (currentPage > 1) {
            currentPage -= singlePageMode ? 1 : 2;
            updatePages();
          }
        }
      }

      // Keyboard navigation
      document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') {
          if (currentPage > 1) {
            currentPage -= singlePageMode ? 1 : 2;
            updatePages();
          }
        } else if (e.key === 'ArrowRight') {
          if (currentPage < (singlePageMode ? totalPages : totalPages - 1)) {
              currentPage += singlePageMode ? 1 : 2;
            updatePages();
          }
        }
      });

      // Page number input
      if (pageNumberInput) {
        pageNumberInput.addEventListener('change', () => {
          let inputValue = pageNumberInput.value;
          let newPage;
          
          if (inputValue.includes('-')) {
            // Handle range input (for two-page mode)
            newPage = parseInt(inputValue.split('-')[0]);
          } else {
            newPage = parseInt(inputValue);
          }
          
          if (!isNaN(newPage)) {
            if (newPage < 1) newPage = 1;
            if (newPage > totalPages) newPage = totalPages;
            if (!singlePageMode && newPage % 2 === 0) newPage--;
            currentPage = newPage;
            updatePages();
          } else {
            pageNumberInput.value = singlePageMode ? currentPage : `${currentPage}-${currentPage + 1}`;
          }
        });
      }

      const drawerPageNumber = document.getElementById('drawer-page-number');
      const drawerPageGo = document.getElementById('drawer-page-go');

      function handlePageChange() {
        let inputValue = drawerPageNumber.value;
        let newPage;
        
        if (inputValue.includes('-')) {
          newPage = parseInt(inputValue.split('-')[0]);
        } else {
          newPage = parseInt(inputValue);
        }
        
        if (!isNaN(newPage)) {
          if (newPage < 1) newPage = 1;
          if (newPage > totalPages) newPage = totalPages;
          if (!singlePageMode && newPage % 2 === 0) newPage--;
          currentPage = newPage;
          updatePages();
        }
      }

      if (drawerPageNumber) {
        drawerPageNumber.addEventListener('change', handlePageChange);
        // Also add keypress event for Enter key
        drawerPageNumber.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') {
            handlePageChange();
          }
        });
      }

      if (drawerPageGo) {
        drawerPageGo.addEventListener('click', handlePageChange);
      }

      // View mode toggles
      const singlePageButton = document.getElementById('single-page-button');
      const twoPageButton = document.getElementById('two-page-button');
      const drawerSinglePageButton = document.getElementById('drawer-single-page-button');
      const drawerTwoPageButton = document.getElementById('drawer-two-page-button');
      
      if (singlePageButton) {
        singlePageButton.addEventListener('click', () => {
          if (!singlePageMode) {
            singlePageMode = true;
            if (currentPage % 2 === 0) currentPage--;
            updatePages();
            updateButtonStyles();
          }
        });
      }
      
      if (twoPageButton) {
        twoPageButton.addEventListener('click', () => {
          if (singlePageMode && window.innerWidth >= 768) {
            singlePageMode = false;
            if (currentPage % 2 === 0) currentPage--;
            updatePages();
            updateButtonStyles();
          }
        });
      }
      
      if (drawerSinglePageButton) {
        drawerSinglePageButton.addEventListener('click', () => {
          if (!singlePageMode) {
            singlePageMode = true;
            if (currentPage % 2 === 0) currentPage--;
            updatePages();
            updateButtonStyles();
            closeDrawer();
          }
        });
      }
      
      if (drawerTwoPageButton) {
        drawerTwoPageButton.addEventListener('click', () => {
          if (singlePageMode && window.innerWidth >= 768) {
            singlePageMode = false;
            if (currentPage % 2 === 0) currentPage--;
            updatePages();
            updateButtonStyles();
            closeDrawer();
          }
        });
      }

      // Fullscreen toggle
      const fullscreenButton = document.getElementById('fullscreen-button');
      const drawerFullscreenButton = document.getElementById('drawer-fullscreen-button');
      
      if (fullscreenButton) {
        fullscreenButton.addEventListener('click', toggleFullscreen);
      }
      
      if (drawerFullscreenButton) {
        drawerFullscreenButton.addEventListener('click', () => {
          toggleFullscreen();
          closeDrawer();
        });
      }

      // Responsive behavior
      window.addEventListener('resize', () => {
        if (window.innerWidth < 768 && !singlePageMode) {
          singlePageMode = true;
          if (currentPage % 2 === 0) currentPage--;
          updatePages();
        }
        updateButtonStyles();
      });
    }

    // Initialize the app
    function init() {
      initSurahSelector();
      initSurahSelector('drawer-');
      initJuzSelector();
      initJuzSelector('drawer-');
      initEventListeners();
      updatePages();
      
      // Set initial view mode based on screen size
      singlePageMode = window.innerWidth < 768;
      updateButtonStyles();
      
      // Close dropdowns when clicking outside
      document.addEventListener('click', (e) => {
        if (!e.target.closest('.dropdown-content') && !e.target.closest('[aria-controls]')) {
          document.querySelectorAll('.dropdown-content').forEach(dd => {
            dd.classList.remove('open');
            const btn = document.querySelector(`[aria-controls="${dd.id}"]`);
            if (btn) {
              const icon = btn.querySelector('i');
              if (icon) {
                icon.classList.remove('fa-chevron-up');
                icon.classList.add('fa-chevron-down');
              }
            }
          });
        }
      });
    }

    init();
});
