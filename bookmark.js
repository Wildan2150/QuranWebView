// Bookmark functionality
const Bookmark = {
    // Initialize bookmark state
    init: function() {
      const bookmarkIconLeft = document.getElementById('bookmark-icon-left');
      const bookmarkIconRight = document.getElementById('bookmark-icon-right');
      const lastPage = localStorage.getItem('lastPage');
      const { currentPage, singlePageMode } = window.getPageState ? window.getPageState() : { currentPage: 1, singlePageMode: false };
  
      // Reset icons
      [bookmarkIconLeft, bookmarkIconRight].forEach(icon => {
        icon.classList.add('hidden');
      });
  
      if (lastPage) {
        const lastPageNum = parseInt(lastPage);
        if (singlePageMode && lastPageNum === currentPage) {
          bookmarkIconLeft.classList.remove('hidden');
        } else if (!singlePageMode) {
          if (lastPageNum === currentPage) {
            bookmarkIconLeft.classList.remove('hidden');
          } else if (lastPageNum === currentPage + 1) {
            bookmarkIconRight.classList.remove('hidden');
          }
        }
      }
    },
  
    // Setup event listeners for containers
    setupListeners: function() {
      const { singlePageMode } = window.getPageState ? window.getPageState() : { singlePageMode: false };
      const leftContainer = document.getElementById('page-left').parentElement;
      const rightContainer = document.getElementById('page-right-container');
  
      // Common setup function for containers
      const setupContainer = (container, pageNumFn) => {
        // Double click/tap to bookmark
        container.addEventListener('dblclick', (e) => {
          e.stopPropagation();
          Bookmark.markPage(pageNumFn());
        });
        
        container.addEventListener('touchend', this.handleDoubleTap(() => {
          Bookmark.markPage(pageNumFn());
        }));
  
        // Triple click/tap to clear bookmark
        container.addEventListener('click', this.handleTripleClick((e) => {
          e.stopPropagation();
          Bookmark.clear(container);
        }));
        
        container.addEventListener('touchend', this.handleTripleTap(() => {
          Bookmark.clear(container);
        }));
      };
  
      // Setup left container (always used)
      setupContainer(leftContainer, () => {
        const { currentPage } = window.getPageState();
        return currentPage;
      });
  
      // Setup right container only in two-page mode
      if (!singlePageMode) {
        setupContainer(rightContainer, () => {
          const { currentPage } = window.getPageState();
          return currentPage + 1;
        });
      }
    },
  
    // Show temporary message
    showMessage: function(container, text = 'Saved to Last Reading') {
      // Remove existing message if any
      const existing = container.querySelector('.bookmark-message');
      if (existing) existing.remove();
  
      // Create and show new message
      const message = document.createElement('div');
      message.className = 'bookmark-message absolute left-1/2 transform -translate-x-1/2 top-1/2 -translate-y-1/2 bg-emerald-600 text-white text-md whitespace-nowrap font-medium px-4 py-2 rounded-lg shadow-xl z-20 pointer-events-none transition-opacity duration-300 opacity-100';
      message.textContent = text;
      container.appendChild(message);
  
      // Auto-hide after delay
      setTimeout(() => {
        message.classList.add('opacity-0');
        setTimeout(() => message.remove(), 300);
      }, 2000);
    },
  
    // Mark page and update localStorage
    markPage: function(pageNum) {
      if (pageNum < 1 || pageNum > 604) return;
      
      localStorage.setItem('lastPage', pageNum);
      console.log('Saved lastPage:', pageNum);
  
      // Show message in correct container
      const { singlePageMode, currentPage } = window.getPageState();
      const leftContainer = document.getElementById('page-left').parentElement;
      const rightContainer = document.getElementById('page-right-container');
  
      if (singlePageMode && pageNum === currentPage) {
        this.showMessage(leftContainer);
      } else if (!singlePageMode) {
        if (pageNum === currentPage) {
          this.showMessage(leftContainer);
        } else if (pageNum === currentPage + 1) {
          this.showMessage(rightContainer);
        }
      }
  
      this.init();
    },
  
    // Clear bookmark
    clear: function(container) {
      localStorage.removeItem('lastPage');
      this.showMessage(container, 'Last Reading Cleared');
      console.log('Cleared lastPage');
      this.init();
    },
  
    // Double-tap detection for touch devices
    handleDoubleTap: function(callback) {
      let lastTap = 0;
      return function(event) {
        if (event.changedTouches?.length > 1) return;
        const currentTime = Date.now();
        const tapLength = currentTime - lastTap;
        if (tapLength < 300 && tapLength > 0) {
          callback(event);
          event.preventDefault();
          event.stopPropagation();
        }
        lastTap = currentTime;
      };
    },
  
    // Triple-tap detection for touch devices
    handleTripleTap: function(callback) {
      let tapCount = 0;
      let lastTap = 0;
      return function(event) {
        if (event.changedTouches?.length > 1) return;
        const currentTime = Date.now();
        const tapLength = currentTime - lastTap;
        if (tapLength < 300) {
          tapCount++;
          if (tapCount === 3) {
            callback(event);
            tapCount = 0;
            event.preventDefault();
            event.stopPropagation();
          }
        } else {
          tapCount = 1;
        }
        lastTap = currentTime;
      };
    },
  
    // Triple-click detection for desktop
    handleTripleClick: function(callback) {
      let clickCount = 0;
      let lastClick = 0;
      return function(event) {
        const currentTime = Date.now();
        const clickLength = currentTime - lastClick;
        if (clickLength < 300) {
          clickCount++;
          if (clickCount === 3) {
            callback(event);
            clickCount = 0;
            event.stopPropagation();
          }
        } else {
          clickCount = 1;
        }
        lastClick = currentTime;
      };
    }
  };
  
  // Initialize on load
  document.addEventListener('DOMContentLoaded', () => {
    Bookmark.setupListeners();
    Bookmark.init();
  });
  
  // Public function to refresh bookmark state
  function updateBookmark() {
    Bookmark.init();
  }