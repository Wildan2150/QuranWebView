document.addEventListener("DOMContentLoaded", function () {
  // === State Management ===
  let currentPage = 1; 
  const totalPages = 604; 
  let singlePageMode = window.innerWidth < 768; 
  let fullscreenActive = false;
  const preloadCache = new Map(); 
  const MAX_CACHE_SIZE = 10; 
  let lastDirection = null; 

  // === DOM Elements ===
  const pageLeft = document.getElementById("page-left"); 
  const pageRight = document.getElementById("page-right"); 
  const pageRightContainer = document.getElementById("page-right-container"); 
  const pageNumberInput = document.getElementById("page-number"); 
  const currentSurahDisplay = document.getElementById("current-surah"); 
  const currentJuzDisplay = document.getElementById("current-juz"); 
  const juzPageRange = document.getElementById("juz-page-range"); 
  const juzProgressFill = document.getElementById("juz-progress-fill"); 
  const currentJuzDisplayTop = document.getElementById("current-juz-display"); 
  const quranContainer = document.getElementById("quran-container"); 
  const drawerOverlay = document.getElementById("drawer-overlay"); 
  const pageLeftLoader = document.getElementById("page-left-loader"); 
  const pageRightLoader = document.getElementById("page-right-loader"); 
  const hamburgerBtn = document.getElementById("hamburger-btn"); 
  const closeDrawerBtn = document.getElementById("close-drawer-btn"); 
  const appDrawer = document.getElementById("app-drawer"); 

  // === Helper Functions ===

  // Fungsi untuk memuat gambar dengan mekanisme retry jika gagal
  async function loadImageWithRetry(imgElement, src, retries = 3) {
    for (let i = 0; i < retries; i++) {
      try {
        await new Promise((resolve, reject) => {
          imgElement.onload = resolve; // Berhasil jika gambar dimuat
          imgElement.onerror = reject; // Gagal jika ada error
          imgElement.src = src; // Set sumber gambar
        });
        return true;
      } catch (err) {
        if (i === retries - 1) {
          console.error(`Gagal memuat ${src} setelah ${retries} percobaan`);
          return false;
        }
        await new Promise((r) => setTimeout(r, 1000)); // Tunggu 1 detik sebelum mencoba lagi
      }
    }
  }

  // Fungsi untuk membatasi ukuran cache agar tidak melebihi MAX_CACHE_SIZE
  function pruneCache() {
    if (preloadCache.size > MAX_CACHE_SIZE) {
      const oldestKey = preloadCache.keys().next().value; // Ambil kunci tertua
      preloadCache.delete(oldestKey); // Hapus dari cache
    }
  }

  // Fungsi untuk membuka/tutup dropdown dengan animasi ikon
  function toggleDropdown(dropdownId, btnId) {
    const dropdown = document.getElementById(dropdownId);
    const btn = document.getElementById(btnId);

    dropdown.classList.toggle("open"); // Toggle status dropdown
    const icon = btn.querySelector("i");
    if (icon) {
      icon.classList.toggle("fa-chevron-down"); // Ganti ikon chevron
      icon.classList.toggle("fa-chevron-up");
    }

    // Tutup dropdown lain yang terbuka
    if (dropdown.classList.contains("open")) {
      document.querySelectorAll(".dropdown-content").forEach((dd) => {
        if (dd.id !== dropdownId && dd.classList.contains("open")) {
          dd.classList.remove("open");
          const otherBtn = document.querySelector(`[aria-controls="${dd.id}"]`);
          if (otherBtn) {
            const otherIcon = otherBtn.querySelector("i");
            if (otherIcon) {
              otherIcon.classList.remove("fa-chevron-up");
              otherIcon.classList.add("fa-chevron-down");
            }
          }
        }
      });
    }
  }

  function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
  }

  function initQueryParam() {
    const pageNumber = getQueryParam("page");
  if (pageNumber) {
    const parsedPageNumber = parseInt(pageNumber);
    if (!isNaN(parsedPageNumber) && parsedPageNumber >= 1 && parsedPageNumber <= totalPages) {
      currentPage = parsedPageNumber;
      if (!singlePageMode && currentPage % 2 === 0) currentPage--;
    }
  }

  const leftSrc = `https://media.qurankemenag.net/khat2/QK_${String(currentPage).padStart(3, "0")}.webp`;
  const rightSrc = !singlePageMode
    ? `https://media.qurankemenag.net/khat2/QK_${String(currentPage + 1).padStart(3, "0")}.webp`
    : null;

  const leftPreload = document.createElement("link");
  leftPreload.rel = "preload";
  leftPreload.as = "image";
  leftPreload.href = leftSrc;
  document.head.appendChild(leftPreload);

  if (!singlePageMode && rightSrc) {
    const rightPreload = document.createElement("link");
    rightPreload.rel = "preload";
    rightPreload.as = "image";
    rightPreload.href = rightSrc;
    document.head.appendChild(rightPreload);
  }

  pageLeft.src = leftSrc;
  if (!singlePageMode) {
    pageRight.src = rightSrc;
  } else {
    pageRight.removeAttribute("src");
  }
  }
  // === Core Navigation Functions ===

  // Fungsi utama untuk memperbarui tampilan halaman
  async function updatePages() {
    // Efek transisi: sembunyikan halaman sementara
    pageLeft.classList.add("opacity-0");
    if (!singlePageMode) pageRight.classList.add("opacity-0");
    await new Promise((r) => setTimeout(r, 100)); // Tunggu animasi selesai

    // Tampilkan indikator loading
    pageLeftLoader.classList.remove("hidden");
    if (!singlePageMode) pageRightLoader.classList.remove("hidden");

    // Perbarui input nomor halaman
    pageNumberInput.value = singlePageMode ? currentPage : `${currentPage}-${currentPage + 1}`;
    document.getElementById("drawer-page-number").value = singlePageMode
      ? currentPage
      : `${currentPage}-${currentPage + 1}`;

    // Sesuaikan tampilan berdasarkan mode (satu/dua halaman)
    pageRightContainer.style.display = singlePageMode ? "none" : "block";

    // URL gambar halaman dari server
    const leftSrc = `https://media.qurankemenag.net/khat2/QK_${String(currentPage).padStart(3, "0")}.webp`;
    const rightSrc = !singlePageMode
      ? `https://media.qurankemenag.net/khat2/QK_${String(currentPage + 1).padStart(3, "0")}.webp`
      : null;

    // Gunakan cache jika ada, jika tidak muat gambar baru
    if (preloadCache.has(currentPage)) {
      pageLeft.src = preloadCache.get(currentPage).src;
    } else {
      pageLeft.setAttribute("loading", "eager");
      await loadImageWithRetry(pageLeft, leftSrc);
      preloadCache.set(currentPage, pageLeft);
      pruneCache();
    }

    if (!singlePageMode) {
      if (preloadCache.has(currentPage + 1)) {
        pageRight.src = preloadCache.get(currentPage + 1).src;
      } else {
        pageRight.setAttribute("loading", "eager");
        await loadImageWithRetry(pageRight, rightSrc);
        preloadCache.set(currentPage + 1, pageRight);
        pruneCache();
      }
    } else {
      pageRight.setAttribute("loading", "lazy"); // Lazy load untuk halaman kanan jika tidak digunakan
    }

    // Sembunyikan indikator loading dan tampilkan halaman
    pageLeftLoader.classList.add("hidden");
    if (!singlePageMode) pageRightLoader.classList.add("hidden");
    pageLeft.classList.remove("opacity-0");
    if (!singlePageMode) pageRight.classList.remove("opacity-0");

    // Perbarui informasi surah, juz, dan preload halaman berikutnya
    updateSurahJuzDisplay();
    preloadPages();
    updateButtonStyles();
    closeDrawer();
  }

  // Fungsi untuk memperbarui tampilan informasi surah dan juz
  function updateSurahJuzDisplay() {
    // Cari surah terakhir yang halamannya <= currentPage
    const currentSurah = surahData.findLast
      ? surahData.findLast((s) => s.page <= currentPage)
      : [...surahData].reverse().find((s) => s.page <= currentPage);

    if (currentSurah) {
      currentSurahDisplay.textContent = `${currentSurah.number}. ${currentSurah.name}`;
      document.getElementById("drawer-current-surah").textContent = `${currentSurah.number}. ${currentSurah.name}`;
    }

    // Cari juz yang sesuai dengan halaman saat ini
    const currentJuz = juzInfo.find((j) => currentPage >= j.start && currentPage <= j.end);
    if (currentJuz) {
      currentJuzDisplay.textContent = `Juz ${currentJuz.number}`;
      document.getElementById("drawer-current-juz").textContent = `Juz ${currentJuz.number}`;
      currentJuzDisplayTop.textContent = `Juz ${currentJuz.number}`;
      juzPageRange.textContent = `Page ${currentJuz.start}-${currentJuz.end}`;
      const progress = ((currentPage - currentJuz.start) / (currentJuz.end - currentJuz.start)) * 100;
      juzProgressFill.style.width = `${Math.max(2, Math.min(100, progress))}%`; // Progress bar minimal 2%
    }
  }

  // Fungsi untuk preload gambar halaman berikutnya berdasarkan arah navigasi
  function preloadPages() {
    let pagesToPreload;
    if (lastDirection === "next") {
      pagesToPreload = singlePageMode ? [currentPage + 1] : [currentPage + 2, currentPage + 3];
    } else if (lastDirection === "prev") {
      pagesToPreload = singlePageMode ? [currentPage - 1] : [currentPage - 2, currentPage - 1];
    } else {
      pagesToPreload = singlePageMode
        ? [currentPage - 1, currentPage + 1]
        : [currentPage - 2, currentPage - 1, currentPage + 2, currentPage + 3];
    }

    pagesToPreload.forEach((page) => {
      if (page > 0 && page <= totalPages && !preloadCache.has(page)) {
        const img = new Image();
        img.src = `https://media.qurankemenag.net/khat2/QK_${String(page).padStart(3, "0")}.webp`;
        preloadCache.set(page, img);
        pruneCache();

        // Tambahkan elemen preload ke head untuk optimasi
        const link = document.createElement("link");
        link.rel = "preload";
        link.as = "image";
        link.href = img.src;
        document.head.appendChild(link);
      }
    });
  }

  // === Drawer Functions ===

  // Buka drawer navigasi
  function openDrawer() {
    appDrawer.classList.add("open");
    drawerOverlay.classList.add("active");
    document.body.style.overflow = "hidden"; // Cegah scroll saat drawer terbuka
  }

  // Tutup drawer navigasi
  function closeDrawer() {
    appDrawer.classList.remove("open");
    drawerOverlay.classList.remove("active");
    document.body.style.overflow = ""; // Kembalikan scroll
  }

  // === Fullscreen Handling ===

  // Toggle mode layar penuh
  async function toggleFullscreen() {
    try {
      if (!fullscreenActive) {
        if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen();
        else if (document.documentElement.webkitRequestFullscreen) await document.documentElement.webkitRequestFullscreen();
        else if (document.documentElement.msRequestFullscreen) await document.documentElement.msRequestFullscreen();
        fullscreenActive = true;
      } else {
        if (document.exitFullscreen) await document.exitFullscreen();
        else if (document.webkitExitFullscreen) await document.webkitExitFullscreen();
        else if (document.msExitFullscreen) await document.msExitFullscreen();
        fullscreenActive = false;
      }
    } catch (err) {
      console.error("Fullscreen error:", err);
    }
    updateButtonStyles(); // Perbarui gaya tombol setelah perubahan
  }

  // Listener untuk mendeteksi perubahan status layar penuh
  ["fullscreenchange", "webkitfullscreenchange", "msfullscreenchange"].forEach((event) => {
    document.addEventListener(event, () => {
      fullscreenActive = !!(document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement);
      updateButtonStyles();
    });
  });

  // Fungsi untuk memperbarui gaya tombol berdasarkan state
  function updateButtonStyles() {
    // Toggle warna tombol mode halaman
    document.getElementById("single-page-button").classList.toggle("bg-emerald-700", singlePageMode);
    document.getElementById("single-page-button").classList.toggle("bg-emerald-600", !singlePageMode);
    document.getElementById("two-page-button").classList.toggle("bg-emerald-700", !singlePageMode);
    document.getElementById("two-page-button").classList.toggle("bg-emerald-600", singlePageMode);
    document.getElementById("drawer-single-page-button").classList.toggle("bg-emerald-700", singlePageMode);
    document.getElementById("drawer-single-page-button").classList.toggle("bg-emerald-600", !singlePageMode);
    document.getElementById("drawer-two-page-button").classList.toggle("bg-emerald-700", !singlePageMode);
    document.getElementById("drawer-two-page-button").classList.toggle("bg-emerald-600", singlePageMode);

    // Toggle warna tombol fullscreen
    const fullscreenButton = document.getElementById("fullscreen-button");
    const drawerFullscreenButton = document.getElementById("drawer-fullscreen-button");
    if (fullscreenButton) {
      fullscreenButton.classList.toggle("bg-emerald-700", fullscreenActive);
      fullscreenButton.classList.toggle("bg-emerald-600", !fullscreenActive);
    }
    if (drawerFullscreenButton) {
      drawerFullscreenButton.classList.toggle("bg-emerald-700", fullscreenActive);
      drawerFullscreenButton.classList.toggle("bg-emerald-600", !fullscreenActive);
    }

    // Ganti ikon fullscreen
    const icon = document.querySelector("#fullscreen-button i");
    if (icon) icon.className = fullscreenActive ? "fas fa-compress" : "fas fa-expand";
    const drawerIcon = document.querySelector("#drawer-fullscreen-button i");
    if (drawerIcon) drawerIcon.className = fullscreenActive ? "fas fa-compress" : "fas fa-expand";

    // Nonaktifkan tombol dua halaman di layar kecil
    const twoPageButton = document.getElementById("two-page-button");
    const drawerTwoPageButton = document.getElementById("drawer-two-page-button");
    if (twoPageButton) {
      twoPageButton.disabled = window.innerWidth < 768;
      twoPageButton.classList.toggle("opacity-50", window.innerWidth < 768);
      twoPageButton.classList.toggle("cursor-not-allowed", window.innerWidth < 768);
    }
    if (drawerTwoPageButton) {
      drawerTwoPageButton.disabled = window.innerWidth < 768;
      drawerTwoPageButton.classList.toggle("opacity-50", window.innerWidth < 768);
      drawerTwoPageButton.classList.toggle("cursor-not-allowed", window.innerWidth < 768);
    }
  }

  // === Surah Navigation ===

  // Inisialisasi dropdown pemilih surah
  function initSurahSelector(prefix = "") {
    const elements = {
      btn: document.getElementById(`${prefix}surah-dropdown-btn`),
      dropdown: document.getElementById(`${prefix}surah-dropdown`),
      search: document.getElementById(`${prefix}surah-search`),
      list: document.getElementById(`${prefix}surah-list`),
      current: document.getElementById(`${prefix}current-surah`),
    };

    if (!elements.btn || !elements.dropdown) return;

    // Fungsi untuk mengisi daftar surah berdasarkan filter pencarian
    function populateSurahList(filter = "") {
      if (!elements.list) return;
      elements.list.innerHTML = "";
      const filtered = surahData.filter(
        (s) => s.name.toLowerCase().includes(filter.toLowerCase()) || s.number.toString().includes(filter)
      );

      filtered.forEach((surah) => {
        const item = document.createElement("div");
        item.className = "p-3 hover:bg-emerald-50 cursor-pointer flex justify-between items-center transition-colors";
        item.innerHTML = `
          <div class="flex-1 min-w-0">
            <span class="font-medium text-emerald-700 truncate">${surah.number}. ${surah.name}</span>
            <div class="flex items-center mt-1 text-xs text-gray-500">
              <span class="mr-2">Page ${surah.page}</span>
              <span class="px-1.5 py-0.5 bg-gray-100 rounded-full text-xs">${surah.revelation}</span>
            </div>
          </div>
          <span class="text-xs bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full whitespace-nowrap ml-2">
            Juz ${Array.isArray(surah.juz) ? surah.juz.join(",") : surah.juz}
          </span>
        `;
        item.addEventListener("click", () => {
          navigateToSurah(surah.number);
          elements.dropdown.classList.remove("open");
          const icon = elements.btn.querySelector("i");
          if (icon) {
            icon.classList.remove("fa-chevron-up");
            icon.classList.add("fa-chevron-down");
          }
        });
        elements.list.appendChild(item);
      });
    }

    elements.search?.addEventListener("input", (e) => populateSurahList(e.target.value));
    elements.btn.addEventListener("click", () => {
      toggleDropdown(elements.dropdown.id, elements.btn.id);
      if (elements.dropdown.classList.contains("open")) {
        populateSurahList();
        elements.search?.focus();
      }
    });

    // Tutup dropdown jika klik di luar
    document.addEventListener("click", (e) => {
      if (!elements.dropdown.contains(e.target) && e.target !== elements.btn) {
        elements.dropdown.classList.remove("open");
        const icon = elements.btn.querySelector("i");
        if (icon) {
          icon.classList.remove("fa-chevron-up");
          icon.classList.add("fa-chevron-down");
        }
      }
    });

    // A11y: accessibility attributes
    elements.btn.setAttribute("aria-expanded", "false");
    elements.btn.setAttribute("aria-controls", elements.dropdown.id);
    elements.btn.addEventListener("click", () => {
      const expanded = elements.btn.getAttribute("aria-expanded") === "true";
      elements.btn.setAttribute("aria-expanded", !expanded);
    });

    populateSurahList();
  }

  // Navigasi ke halaman awal surah yang dipilih
  function navigateToSurah(surahNumber) {
    const surah = surahData.find((s) => s.number === surahNumber);
    if (surah) {
      currentPage = surah.page;
      if (!singlePageMode && currentPage % 2 === 0) currentPage--; // Sesuaikan untuk mode dua halaman
      updatePages();
    }
  }

  // === Juz Navigation ===

  // Inisialisasi dropdown pemilih juz
  function initJuzSelector(prefix = "") {
    const elements = {
      btn: document.getElementById(`${prefix}juz-dropdown-btn`),
      dropdown: document.getElementById(`${prefix}juz-dropdown`),
      list: document.getElementById(`${prefix}juz-list`),
      current: document.getElementById(`${prefix}current-juz`),
    };

    if (!elements.btn || !elements.dropdown || !elements.list) return;

    elements.list.innerHTML = "";
    juzInfo.forEach((juz) => {
      const item = document.createElement("div");
      item.className = "p-3 hover:bg-emerald-50 cursor-pointer transition-colors";
      item.innerHTML = `
        <div class="flex items-center justify-between w-full">
          <div class="py-0.5 font-bold text-emerald-600">Juz ${juz.number}</div>
          <span class="text-xs text-gray-500 bg-gray-100 rounded-full px-2 py-0.5 whitespace-nowrap">
            Pages ${juz.start}-${juz.end}
          </span>
        </div>
        <div class="text-xs text-gray-500 mt-1 truncate">${juz.surahs
          .map((s) => {
            const surah = surahData.find((sd) => sd.number === s);
            return surah ? surah.name : "";
          })
          .join(", ")}
        </div>
      `;
      item.addEventListener("click", () => {
        currentPage = juz.start;
        if (!singlePageMode && currentPage % 2 === 0) currentPage--;
        updatePages();
        elements.dropdown.classList.remove("open");
        const icon = elements.btn.querySelector("i");
        if (icon) {
          icon.classList.remove("fa-chevron-up");
          icon.classList.add("fa-chevron-down");
        }
      });
      elements.list.appendChild(item);
    });

    elements.btn.addEventListener("click", () => toggleDropdown(elements.dropdown.id, elements.btn.id));
    document.addEventListener("click", (e) => {
      if (!elements.dropdown.contains(e.target) && e.target !== elements.btn) {
        elements.dropdown.classList.remove("open");
        const icon = elements.btn.querySelector("i");
        if (icon) {
          icon.classList.remove("fa-chevron-up");
          icon.classList.add("fa-chevron-down");
        }
      }
    });

    // A11y: accessibility attributes
    elements.btn.setAttribute("aria-expanded", "false");
    elements.btn.setAttribute("aria-controls", elements.dropdown.id);
    elements.btn.addEventListener("click", () => {
      const expanded = elements.btn.getAttribute("aria-expanded") === "true";
      elements.btn.setAttribute("aria-expanded", !expanded);
    });
  }

  // === Event Listeners ===

  // Inisialisasi semua event listener
  function initEventListeners() {
    if (hamburgerBtn) hamburgerBtn.addEventListener("click", openDrawer);
    if (closeDrawerBtn) closeDrawerBtn.addEventListener("click", closeDrawer);
    if (drawerOverlay) drawerOverlay.addEventListener("click", closeDrawer);

    // Ambil semua versi tombol
    const prevButtons = [
      document.getElementById("prev-btn-mobile"),
      document.getElementById("prev-btn-desktop")
    ];
    const nextButtons = [
      document.getElementById("next-btn-mobile"),
      document.getElementById("next-btn-desktop")
    ];

    // Fungsi handler untuk navigasi
    function handlePrevPage() {
      if (currentPage > 1) {
        lastDirection = "prev";
        currentPage -= singlePageMode ? 1 : 2;
        updatePages();
      }
    }

    function handleNextPage() {
      if (currentPage < (singlePageMode ? totalPages : totalPages - 1)) {
        lastDirection = "next";
        currentPage += singlePageMode ? 1 : 2;
        updatePages();
      }
    }

    // Tambahkan event listener ke semua tombol
    prevButtons.forEach(btn => {
      if (btn) btn.addEventListener("click", handlePrevPage);
    });

    nextButtons.forEach(btn => {
      if (btn) btn.addEventListener("click", handleNextPage);
    });

    // Navigasi sentuh (swipe)
    let touchStartX = 0;
    let touchEndX = 0;
    if (quranContainer) {
      quranContainer.addEventListener("touchstart", (e) => {
        touchStartX = e.changedTouches[0].screenX;
      }, { passive: true });

      quranContainer.addEventListener("touchend", (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
      }, { passive: true });
    }

    function handleSwipe() {
      const threshold = 50; // Ambang batas swipe
      if (touchStartX - touchEndX > threshold && currentPage > 1) {
        lastDirection = "prev";
        currentPage -= singlePageMode ? 1 : 2;
        updatePages();
      } else if (touchEndX - touchStartX > threshold && currentPage < (singlePageMode ? totalPages : totalPages - 1)) {
        lastDirection = "next";
        currentPage += singlePageMode ? 1 : 2;
        updatePages();
      }
    }

    // Navigasi keyboard
    document.addEventListener("keydown", (e) => {
      // Ambil referensi tombol desktop
      const desktopPrevBtn = document.getElementById("prev-btn-desktop");
      const desktopNextBtn = document.getElementById("next-btn-desktop");

      if (e.key === "ArrowLeft") {
        lastDirection = "next";
        if (currentPage < (singlePageMode ? totalPages : totalPages - 1)) {
          currentPage += singlePageMode ? 1 : 2;
          updatePages();
          
          // Animasi untuk tombol desktop next
          if (desktopNextBtn && window.innerWidth >= 768) {
            desktopNextBtn.classList.add("lg:text-emerald-800", "scale-110", "transition-transform", "transition-colors", "duration-200", "ease-out");
            setTimeout(() => {
              desktopNextBtn.classList.remove("lg:text-emerald-800", "scale-110", "transition-transform", "transition-colors", "duration-200", "ease-out");
            }, 200);
          }
        }
      } else if (e.key === "ArrowRight") {
        lastDirection = "prev";
        if (currentPage > 1) {
          currentPage -= singlePageMode ? 1 : 2;
          updatePages();
          
          // Animasi untuk tombol desktop prev
          if (desktopPrevBtn && window.innerWidth >= 768) {
            desktopPrevBtn.classList.add("lg:text-emerald-800", "scale-110", "transition-transform", "transition-colors", "duration-200", "ease-out");
            setTimeout(() => {
              desktopPrevBtn.classList.remove("lg:text-emerald-800", "scale-110", "transition-transform", "transition-colors", "duration-200", "ease-out");
            }, 200);
          }
        }
      }
    });

    // Input nomor halaman utama
    if (pageNumberInput) {
      pageNumberInput.addEventListener("change", () => {
        let inputValue = pageNumberInput.value;
        let newPage = inputValue.includes("-") ? parseInt(inputValue.split("-")[0]) : parseInt(inputValue);
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

    // Input nomor halaman di drawer
    const drawerPageNumber = document.getElementById("drawer-page-number");
    const drawerPageGo = document.getElementById("drawer-page-go");

    function handlePageChange() {
      let inputValue = drawerPageNumber.value;
      let newPage = inputValue.includes("-") ? parseInt(inputValue.split("-")[0]) : parseInt(inputValue);
      if (!isNaN(newPage)) {
        if (newPage < 1) newPage = 1;
        if (newPage > totalPages) newPage = totalPages;
        if (!singlePageMode && newPage % 2 === 0) newPage--;
        currentPage = newPage;
        updatePages();
      }
    }

    if (drawerPageNumber) {
      drawerPageNumber.addEventListener("change", handlePageChange);
      drawerPageNumber.addEventListener("keypress", (e) => {
        if (e.key === "Enter") handlePageChange();
      });
    }

    if (drawerPageGo) drawerPageGo.addEventListener("click", handlePageChange);

    // Tombol mode tampilan
    const singlePageButton = document.getElementById("single-page-button");
    const twoPageButton = document.getElementById("two-page-button");
    const drawerSinglePageButton = document.getElementById("drawer-single-page-button");
    const drawerTwoPageButton = document.getElementById("drawer-two-page-button");

    if (singlePageButton) {
      singlePageButton.addEventListener("click", () => {
        if (!singlePageMode) {
          singlePageMode = true;
          if (currentPage % 2 === 0) currentPage--;
          updatePages();
          updateButtonStyles();
        }
      });
    }

    if (twoPageButton) {
      twoPageButton.addEventListener("click", () => {
        if (singlePageMode && window.innerWidth >= 768) {
          singlePageMode = false;
          if (currentPage % 2 === 0) currentPage--;
          updatePages();
          updateButtonStyles();
        }
      });
    }

    if (drawerSinglePageButton) {
      drawerSinglePageButton.addEventListener("click", () => {
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
      drawerTwoPageButton.addEventListener("click", () => {
        if (singlePageMode && window.innerWidth >= 768) {
          singlePageMode = false;
          if (currentPage % 2 === 0) currentPage--;
          updatePages();
          updateButtonStyles();
          closeDrawer();
        }
      });
    }

    // Tombol fullscreen
    const fullscreenButton = document.getElementById("fullscreen-button");
    const drawerFullscreenButton = document.getElementById("drawer-fullscreen-button");

    if (fullscreenButton) fullscreenButton.addEventListener("click", toggleFullscreen);
    if (drawerFullscreenButton) {
      drawerFullscreenButton.addEventListener("click", () => {
        toggleFullscreen();
        closeDrawer();
      });
    }

    // Listener untuk resize window
    window.addEventListener("resize", () => {
      if (window.innerWidth < 768 && !singlePageMode) {
        singlePageMode = true;
        if (currentPage % 2 === 0) currentPage--;
        updatePages();
      }
      updateButtonStyles();
    });
  }

  // Tutup semua dropdown jika klik di luar
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".dropdown-content") && !e.target.closest("[aria-controls]")) {
      document.querySelectorAll(".dropdown-content").forEach((dd) => {
        dd.classList.remove("open");
        const btn = document.querySelector(`[aria-controls="${dd.id}"]`);
        if (btn) {
          const icon = btn.querySelector("i");
          if (icon) {
            icon.classList.remove("fa-chevron-up");
            icon.classList.add("fa-chevron-down");
          }
        }
      });
    }
  });

  
  // === Initialization ===

  // Fungsi utama untuk menginisialisasi aplikasi
  function init() {
    initQueryParam();
    initSurahSelector(); // Inisialisasi dropdown surah utama
    initSurahSelector("drawer-"); // Inisialisasi dropdown surah di drawer
    initJuzSelector(); // Inisialisasi dropdown juz utama
    initJuzSelector("drawer-"); // Inisialisasi dropdown juz di drawer
    initEventListeners(); // Inisialisasi semua event listener
    updatePages(); // Muat halaman awal

    singlePageMode = window.innerWidth < 768; // Set mode berdasarkan lebar layar
    updateButtonStyles();

    
  }

  init(); // Jalankan inisialisasi saat DOM siap
});