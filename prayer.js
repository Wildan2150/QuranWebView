const elements = {
    currentLocation: document.getElementById('current-location'),
    locationInput: document.getElementById('location-input'),
    cityInput: document.getElementById('city-input'),
    cityDropdown: document.getElementById('city-dropdown'),
    combinedDate: document.getElementById('combined-date'),
    dailyPrayerTimes: document.getElementById('daily-prayer-times'),
    monthlyPrayerTimes: document.getElementById('monthly-prayer-times'),
};

const state = {
    prayer: {
        currentLocation: 'Jakarta, Indonesia',
        latitude: -6.2088,
        longitude: 106.8456,
        dailyTimings: null,
        monthlyTimings: null,
        
    },
};

// Hijri Months Mapping
const hijriMonthsName = {
    '1': 'Muharram',
    '2': 'Safar',
    '3': 'Rabiul Awal',
    '4': 'Rabiul Akhir',
    '5': 'Jumadil Awal',
    '6': 'Jumadil Akhir',
    '7': 'Rajab',
    '8': 'Sya’ban',
    '9': 'Ramadhan',
    '10': 'Syawwal',
    '11': 'Dzulqa’dah',
    '12': 'Dzulhijjah'
};

// Cache Utilities
const cacheUtils = {
    set: (key, data, ttl) => {
        const item = {
            value: data,
            expiry: Date.now() + ttl,
        };
        localStorage.setItem(key, JSON.stringify(item));
    },
    get: (key) => {
        const itemStr = localStorage.getItem(key);
        if (!itemStr) return null;
        const item = JSON.parse(itemStr);
        if (Date.now() > item.expiry) {
            localStorage.removeItem(key);
            return null;
        }
        return item.value;
    },
};

// DOM Utilities
const domUtils = {
    show: (el) => el?.classList.remove('hidden'),
    hide: (el) => el?.classList.add('hidden'),
    renderError: (container, message) => {
        if (container) container.innerHTML = `<p class="text-center text-red-600">${message}</p>`;
    },
    toggleLocationInput: () => elements.locationInput?.classList.toggle('hidden')

};

// Time Utilities
const timeUtils = {
    getNextPrayer: (timings) => {
        if (!timings) return 'Subuh';
        const now = new Date().getHours() * 60 + new Date().getMinutes();
        const prayers = [
            { name: 'Subuh', time: timings.Fajr },
            { name: 'Dzuhur', time: timings.Dhuhr },
            { name: 'Ashar', time: timings.Asr },
            { name: 'Maghrib', time: timings.Maghrib },
            { name: 'Isya', time: timings.Isha }
        ];
        const next = prayers.find(prayer => {
            const [hours, minutes] = prayer.time.split(' ')[0].split(':').map(Number);
            return (hours * 60 + minutes) > now;
        });
        return next?.name || 'Subuh';
    },

    calculateImsakTime: (fajrTime) => {
        if (!fajrTime) return 'N/A';
        const [hours, minutes] = fajrTime.split(' ')[0].split(':').map(Number);
        const date = new Date();
        date.setHours(hours, minutes - 10, 0);
        return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    },

    formatDate: (gregorian, hijri) => {
        const date = new Date(gregorian.date.split('-').reverse().join('-'));
        const gregorianStr = date.toLocaleDateString('id-ID', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
        });
        const hijriDay = hijri.day - 1;             // Adjust hijri day to correct value
        
        const hijriStr = `${hijriDay} ${hijriMonthsName[hijri.month.number]} ${hijri.year}`;
        console.log('Hijri Date:', hijriDay, 'type:', typeof hijriDay);
        return `${gregorianStr} / ${hijriStr}`;
    }
};

// API Utilities
const apiUtils = {
    fetchWithRetry: async (url, retries = 3) => {
        for (let i = 0; i < retries; i++) {
            try {
                const response = await fetch(url, {
                    headers: { 'Accept': 'application/json' },
                    credentials: 'omit',
                    mode: 'cors'
                });
                if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
                return await response.json();
            } catch (error) {
                if (i === retries - 1) throw error;
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
    },

    getPrayerTimes: async (latitude, longitude) => {
        const cacheKey = `prayerTimes_${latitude}_${longitude}_${new Date().toDateString()}`;
        const cached = cacheUtils.get(cacheKey);
        if (cached) return cached;

        const date = new Date();
        const url = `https://api.aladhan.com/v1/timings/${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}?latitude=${latitude}&longitude=${longitude}&method=20&shafaq=general&tune=2,2,2,2,2,2,2,2,2&calendarMethod=UAQ`;
        const data = await apiUtils.fetchWithRetry(url);
        if (data.code !== 200) throw new Error('Invalid API response');

        cacheUtils.set(cacheKey, data, 24 * 60 * 60 * 1000);
        return data;
    },

    getMonthlyPrayerTimes: async (latitude, longitude, date = new Date()) => {
        const startDate = new Date(date);
        const endDate = new Date(date);
        endDate.setDate(startDate.getDate() + 30); // Add 30 days to the start date
    
        const formatDate = (d) => {
            const day = d.getDate().toString().padStart(2, '0');
            const month = (d.getMonth() + 1).toString().padStart(2, '0');
            const year = d.getFullYear();
            return `${day}-${month}-${year}`;
        };
    
        const cacheKey = `monthlyPrayerTimes_${latitude}_${longitude}_${formatDate(startDate)}_${formatDate(endDate)}`;
        const cached = cacheUtils.get(cacheKey);
        if (cached) return cached;
    
        const url = `https://api.aladhan.com/v1/calendar/from/${formatDate(startDate)}/to/${formatDate(endDate)}?latitude=${latitude}&longitude=${longitude}&method=20&shafaq=general&tune=2,2,2,2,2,2,2,2,2&calendarMethod=UAQ`;
        const data = await apiUtils.fetchWithRetry(url);
        if (data.code !== 200) throw new Error('Invalid API response');
    
        cacheUtils.set(cacheKey, data, 30 * 24 * 60 * 60 * 1000); // Cache for 30 days
        return data;
    },

    reverseGeocode: async (latitude, longitude) => {
        const cacheKey = `geocode_${latitude}_${longitude}`;
        const cached = cacheUtils.get(cacheKey);
        if (cached) return cached;

        const url = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`;
        const data = await apiUtils.fetchWithRetry(url);
        cacheUtils.set(cacheKey, data, 7 * 24 * 60 * 60 * 1000);
        return data;
    },

    searchCities: async (query) => {
        if (!query || query.length < 3) return [];
        const cacheKey = `searchCities_${query.toLowerCase()}`;
        const cached = cacheUtils.get(cacheKey);
        if (cached) return cached;
    
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=20&accept-language=id`;
        const data = await apiUtils.fetchWithRetry(url);
    
        // Prioritaskan wilayah Indonesia
        const indonesiaCities = data.filter(city => city.display_name?.includes('Indonesia'));
        const otherCities = data.filter(city => !city.display_name?.includes('Indonesia'));
    
        // Gabungkan hasil dengan prioritas Indonesia di awal
        const prioritizedResults = [...indonesiaCities, ...otherCities];
    
        // Normalisasi data untuk pencarian
        const normalizedResults = prioritizedResults.map(city => ({
            ...city,
            normalized_display_name: city.display_name.toLowerCase().replace(/[^a-z0-9\s]/g, ''),
        }));
    
        // Pencarian autocomplete (awalan query)
        const autocompleteMatches = normalizedResults.filter(city =>
            city.normalized_display_name.startsWith(query.toLowerCase())
        );
    
        // Gunakan Fuse.js untuk pencarian fuzzy
        const fuse = new Fuse(normalizedResults, {
            keys: ['normalized_display_name'], // Gunakan nama yang dinormalisasi
            threshold: 0.8, // Tingkat sensitivitas pencarian
        });
    
        const fuzzyResults = fuse.search(query).map(result => result.item);
    
        // Gabungkan hasil autocomplete dengan hasil Fuse.js
        const combinedResults = [...new Set([...autocompleteMatches, ...fuzzyResults])];
    
        // Cache hasil pencarian
        cacheUtils.set(cacheKey, combinedResults, 24 * 60 * 60 * 1000);
        return combinedResults;
    }
};

// Location Utilities
const locationUtils = {
    setDefaultLocation: () => {
        state.prayer = {
            ...state.prayer,
            currentLocation: 'Jakarta, Indonesia',
            latitude: -6.2088,
            longitude: 106.8456
        };
        cacheUtils.set('location', state.prayer, 30 * 24 * 60 * 60 * 1000); // Cache for 30 days
        console.log('Using default location:', state.prayer);
        renderUtils.updateAll();
    },

    parseLocationFromGeocode: (data) => {
        const address = data.address || {};
        const parts = [];

        if (address.village || address.town || address.city_district) {
            parts.push(address.village || address.town || address.city_district);
        }
        if (address.city || address.town) {
            parts.push(address.city || address.town);
        }
        if (address.state) {
            parts.push(address.state);
        }
        parts.push(address.country || 'Indonesia');

        return [...new Set(parts.filter(Boolean))].join(', ');
    },

    parseLocationFromSelection: (displayName, cityName) => {
        const parts = displayName.split(',')
            .map(part => part.trim())
            .filter(part => part && !/^\d+$/.test(part)); // Exclude numeric parts
        
        // Keep only unique parts and prioritize city name
        const uniqueParts = [...new Set([cityName, ...parts])];
        
        // Ensure we don't repeat the same information
        const filteredParts = uniqueParts.filter((part, index) => {
            if (index === 0) return true;
            return !part.includes(cityName) && !cityName.includes(part);
        });
        
        return filteredParts.slice(0, 3).join(', '); // Max 3 parts
    },

    detectLocation: async (forceRefresh = false) => {
        if (!elements.currentLocation) return;

        if (!forceRefresh) {
            const cachedLocation = cacheUtils.get('location');
            if (cachedLocation) {
                state.prayer = { ...state.prayer, ...cachedLocation };
                console.log('Using cached location:', state.prayer);
                renderUtils.updateAll();
                return;
            }
        }

        try {
            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                });
            });

            state.prayer.latitude = position.coords.latitude;
            state.prayer.longitude = position.coords.longitude;

            const geocodeData = await apiUtils.reverseGeocode(state.prayer.latitude, state.prayer.longitude);
            state.prayer.currentLocation = locationUtils.parseLocationFromGeocode(geocodeData);

            cacheUtils.set('location', state.prayer, 30 * 24 * 60 * 60 * 1000); // Cache for 30 days
            console.log('Geolocation retrieved:', state.prayer);
            renderUtils.updateAll();
        } catch (geolocationError) {
            console.error('Geolocation failed:', geolocationError);

            try {
                const response = await fetch('https://ipinfo.io/json?token=060afd26c77039');
                if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

                const ipData = await response.json();
                state.prayer.currentLocation = ipData.city ?
                    `${ipData.city}, ${ipData.country || 'Indonesia'}` :
                    'Jakarta, Indonesia';

                const [lat, lon] = ipData.loc ?
                    ipData.loc.split(',').map(Number) :
                    [-6.2088, 106.8456];

                state.prayer.latitude = lat;
                state.prayer.longitude = lon;

                cacheUtils.set('location', state.prayer, 30 * 24 * 60 * 60 * 1000); // Cache for 30 days
                console.log('IP-based location retrieved:', state.prayer);
                renderUtils.updateAll();
            } catch (ipError) {
                console.error('IP-based location failed:', ipError);
                locationUtils.setDefaultLocation();
            }
        }
    },

    updateLocation: async (city) => {
        if (!city) return;

        try {
            const cities = await apiUtils.searchCities(city);
            if (cities.length === 0) throw new Error('City not found');

            const firstResult = cities[0];
            state.prayer.currentLocation = locationUtils.parseLocationFromSelection(
                firstResult.display_name || '',
                city
            );

            state.prayer.latitude = parseFloat(firstResult.lat);
            state.prayer.longitude = parseFloat(firstResult.lon);

            cacheUtils.set('location', state.prayer, 30 * 24 * 60 * 60 * 1000); // Cache for 30 days
            console.log('Location updated:', state.prayer);
            renderUtils.updateAll();
        } catch (error) {
            console.error('Error updating location:', error);
            alert('Gagal mendapatkan koordinat kota. Menggunakan lokasi default.');
            locationUtils.setDefaultLocation();
        } finally {
            domUtils.hide(elements.locationInput);
        }
    },

    handleCitySelection: (selectedItem) => {
        if (!selectedItem) return;
    
        const cityName = selectedItem.querySelector('span.font-medium')?.textContent || '';
        const displayName = selectedItem.dataset.displayName || '';
        const [lat, lon] = [selectedItem.dataset.lat, selectedItem.dataset.lon];
    
        if (!cityName || !lat || !lon) {
            console.error('Invalid city selection:', { cityName, lat, lon });
            return;
        }
    
        // Update UI
        if (elements.cityInput) elements.cityInput.value = cityName;
        domUtils.hide(elements.cityDropdown);
    
        // Update state
        state.prayer.currentLocation = locationUtils.parseLocationFromSelection(displayName, cityName);
        state.prayer.latitude = parseFloat(lat);
        state.prayer.longitude = parseFloat(lon);
    
        // Cache and render
        cacheUtils.set('location', state.prayer, 30 * 24 * 60 * 60 * 1000);
        console.log('City selected:', state.prayer);
        renderUtils.updateAll();
    }
};

const debounce = (func, wait) => {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
};

// Render Utilities
const renderUtils = {
    updateAll: () => {
        renderUtils.prayerLocation();
        renderUtils.dailyPrayerSchedule();
        renderUtils.monthlyPrayerSchedule();
    },

    prayerLocation: () => {
        elements.currentLocation.textContent = state.prayer.currentLocation;
    },

    dailyPrayerSchedule: async () => {
        try {
            const data = await apiUtils.getPrayerTimes(state.prayer.latitude, state.prayer.longitude);
            const timings = data.data.timings;
            timings.Imsak = timeUtils.calculateImsakTime(timings.Fajr);

            elements.combinedDate.textContent = timeUtils.formatDate(data.data.date.gregorian, data.data.date.hijri);

            const nextPrayer = timeUtils.getNextPrayer(timings);
            const prayerTimes = [
                { name: 'Imsak', time: timings.Imsak },
                { name: 'Subuh', time: timings.Fajr },
                { name: 'Terbit', time: timings.Sunrise },
                { name: 'Dzuhur', time: timings.Dhuhr },
                { name: 'Ashar', time: timings.Asr },
                { name: 'Maghrib', time: timings.Maghrib },
                { name: 'Isya', time: timings.Isha }
            ];

            elements.dailyPrayerTimes.innerHTML = prayerTimes.map(prayer => {
                const isNext = prayer.name === nextPrayer;
                return `
                    <div class="bg-white rounded-lg shadow-lg p-5 hover:shadow-xl transition-all duration-200 dark:border-2 dark:hover:bg-gray-700 ${isNext ? 'border-l-4 border-emerald-600 bg-emerald-50 dark:bg-gray-900' : 'border-l-4 border-gray-200 dark:border-gray-700 dark:bg-gray-800'}">
                        <div class="flex justify-between items-center">
                            <span class="text-base ${isNext ? 'font-bold text-emerald-700 dark:text-gray-200' : 'font-semibold text-gray-600 dark:text-gray-200'}">${prayer.name}</span>
                            <span class="text-base ${isNext ? 'font-bold text-emerald-700 dark:text-gray-200' : 'text-gray-600 dark:text-gray-200'}">${prayer.time.split(' ')[0]}</span>
                        </div>
                    </div>
                `;
            }).join('');
        } catch (error) {
            console.error('Error fetching daily prayer times:', error);
            elements.dailyPrayerTimes.innerHTML = '<p class="text-center text-red-600">Gagal memuat jadwal sholat.</p>';
            elements.combinedDate.textContent = 'N/A';
        }
    },

    monthlyPrayerSchedule: async () => {
        try {
            const data = await apiUtils.getMonthlyPrayerTimes(state.prayer.latitude, state.prayer.longitude);
            elements.monthlyPrayerTimes.innerHTML = data.data.map(day => {
                const timings = day.timings;
                timings.Imsak = timeUtils.calculateImsakTime(timings.Fajr);
                const date = new Date(day.date.gregorian.date.split('-').reverse().join('-'));
                const formattedDate = date.toLocaleDateString('id-ID', {
                    day: 'numeric', month: 'long', year: 'numeric'
                });

                return `
                    <tr class="hover:bg-emerald-50 dark:hover:bg-emerald-300/20 dark:text-gray-200 transition-colors duration-200">
                        <td class="p-3">${formattedDate}</td>
                        <td class="p-3">${timings.Fajr}</td>
                        <td class="p-3">${timings.Dhuhr}</td>
                        <td class="p-3">${timings.Asr}</td>
                        <td class="p-3">${timings.Maghrib}</td>
                        <td class="p-3">${timings.Isha}</td>
                    </tr>
                `;
            }).join('');
        } catch (error) {
            console.error('Error fetching monthly prayer times:', error);
            elements.monthlyPrayerTimes.innerHTML = '<p class="text-center text-red-600">Gagal memuat jadwal sholat.</p>';
        }
    },

    showDropdown: (items) => {
        if (!elements.cityDropdown) return;

        if (!items || items.length === 0) {
            domUtils.hide(elements.cityDropdown);
            return;
        }

        elements.cityDropdown.innerHTML = items.map(city => `
            <div class="dropdown-item px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors duration-200"
                 data-lat="${city.lat}"
                 data-lon="${city.lon}"
                 data-display-name="${city.display_name || ''}">
                <span class="font-medium text-black dark:text-gray-200">${city.display_name ? city.display_name.split(',')[0] : 'Unknown'}</span>
                <span class="text-gray-500 dark:text-gray-400 text-sm">${city.display_name ? `(${city.display_name.split(',').slice(1, 4).join(', ')})` : ''}</span>
            </div>
        `).join('');

        domUtils.show(elements.cityDropdown);
    },
    showLoading: (container) => {
        container.innerHTML = `
            <div class="flex items-center px-3 py-2 text-gray-500 dark:text-gray-400">Memuat...</div>
        `;
    }
};

// Event Handlers
const eventHandlers = {
    handleCityInput: async (e) => {
        const query = e.target.value.trim();
        if (!query || query.length < 3) {
            domUtils.hide(elements.cityDropdown);
            return;
        }
    
        renderUtils.showLoading(elements.cityDropdown);
        domUtils.show(elements.cityDropdown);
    
        try {
            const cities = await apiUtils.searchCities(query);
            if (cities.length === 0) {
                elements.cityDropdown.innerHTML = `
                    <div class="px-3 py-2 text-gray-500 dark:text-gray-400">
                        Tidak ditemukan hasil untuk "${query}"
                    </div>
                `;
            } else {
                renderUtils.showDropdown(cities);
            }
        } catch (error) {
            elements.cityDropdown.innerHTML = `
                <div class="px-3 py-2 text-red-500">
                    Gagal memuat hasil pencarian
                </div>
            `;
        }
    },

    handleCityKeyDown: (e) => {
        const items = elements.cityDropdown?.querySelectorAll('.dropdown-item');
        if (!items || items.length === 0) return;

        let current = Array.from(items).findIndex(item => 
            item.classList.contains('bg-gray-200') || 
            item.classList.contains('dark:bg-gray-700')
        );

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            current = (current + 1) % items.length;
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            current = (current - 1 + items.length) % items.length;
        } else if (e.key === 'Enter' && current >= 0) {
            e.preventDefault();
            locationUtils.handleCitySelection(items[current]);
            domUtils.hide(elements.locationInput);

            return;
        }

        items.forEach(item => {
            item.classList.remove('bg-gray-200', 'dark:bg-gray-700');
        });
        if (current >= 0) {
            items[current].classList.add('bg-gray-200', 'dark:bg-gray-700');
            items[current].scrollIntoView({ block: 'nearest' });
        }
    },

    handleDropdownClick: (e) => {
        const item = e.target.closest('.dropdown-item');
        if (item) locationUtils.handleCitySelection(item);
    },

    handleOutsideClick: (e) => {
        if (!elements.cityInput?.contains(e.target) && !elements.cityDropdown?.contains(e.target)) {
            domUtils.hide(elements.cityDropdown);
        }
    }
};

// Global function for "Use Current Location" button
window.useCurrentLocation = () => {
    locationUtils.detectLocation(true); // Force refresh to bypass cache
    domUtils.toggleLocationInput();
};

// Initialization
const init = () => {
    const savedAdjustment = localStorage.getItem('hijriAdjustment');
    if (savedAdjustment) {
        state.prayer.hijriAdjustment = JSON.parse(savedAdjustment);
    }

    const saveAdjustment = () => {
        localStorage.setItem('hijriAdjustment', JSON.stringify(state.prayer.hijriAdjustment));
    };

    const originalUpdateLocation = locationUtils.updateLocation;
    locationUtils.updateLocation = async (city) => {
        await originalUpdateLocation(city);
        saveAdjustment();
    };

    if (elements.cityInput) {
        let searchTimeout;

        let lastQuery = '';
elements.cityInput.addEventListener('input', debounce(async (e) => {
    const query = e.target.value.trim();
    if (query === lastQuery || query.length < 3) {
        if (query.length < 3) domUtils.hide(elements.cityDropdown);
        return;
    }
    
    lastQuery = query;
    await eventHandlers.handleCityInput(e);
}, 500));

        elements.cityInput.addEventListener('keydown', eventHandlers.handleCityKeyDown);
    }

    if (elements.cityDropdown) {
        elements.cityDropdown.addEventListener('click', eventHandlers.handleDropdownClick);
    }

    document.addEventListener('click', eventHandlers.handleOutsideClick);

    locationUtils.detectLocation();

    // Initialize dark mode from localStorage
    const isDarkMode = localStorage.getItem('darkMode') === 'true' || (!localStorage.getItem('darkMode') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', isDarkMode);
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        if (!localStorage.getItem('darkMode')) {
            document.documentElement.classList.toggle('dark', e.matches);
        }
    });
    console.log('Dark mode loaded from:', localStorage.getItem('darkMode') !== null ? 'localStorage' : 'system preference');

    // Tangkap event tombol kembali
    window.addEventListener("popstate", function () {
        // Arahkan pengguna ke homepage
        window.location.href = "index.html";
    });
};

function forceRefreshAndClearCache() {
    console.log('Clearing cache and forcing location refresh...');
    localStorage.removeItem('location'); // Hapus cache lokasi
    localStorage.removeItem('prayerTimes'); // Hapus cache waktu sholat harian
    localStorage.removeItem('monthlyPrayerTimes'); // Hapus cache waktu sholat bulanan
    cacheUtils.set('location', null, 0); // Clear location cache
    locationUtils.detectLocation(true); // Force refresh location
}

document.addEventListener('DOMContentLoaded', init);