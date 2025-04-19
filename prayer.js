const elements = {
    currentLocation: document.getElementById('current-location'),
    locationInput: document.getElementById('location-input'),
    cityInput: document.getElementById('city-input'),
    cityDropdown: document.getElementById('city-dropdown'),
    combinedDate: document.getElementById('combined-date'),
    dailyPrayerTimes: document.getElementById('daily-prayer-times'),
    monthlyPrayerTimes: document.getElementById('monthly-prayer-times'),
    monthlyPrayerTitle: document.getElementById('monthly-prayer-title'),
};

const state = {
    prayer: {
        currentLocation: 'Jakarta, Indonesia',
        latitude: -6.2088,
        longitude: 106.8456,
        dailyTimings: null,
        monthlyTimings: null,
        // Tambahkan konfigurasi penyesuaian Hijriah
        hijriAdjustment: {
            // Default offset untuk lokasi tertentu (dalam hari)
            offsets: {
                'Indonesia': 0, // Misalnya, Indonesia sering terpaut 1 hari
                'Saudi Arabia': 0, // Umm al-Qura biasanya tidak perlu penyesuaian
                'default': 0 // Untuk lokasi lain
            },
            // Metode perhitungan (opsional, untuk fleksibilitas)
            method: 15 // Umm al-Qura sebagai default
        }
    }
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
        
        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();
        
        return [
            { name: 'Subuh', time: timings.Fajr },
            { name: 'Dzuhur', time: timings.Dhuhr },
            { name: 'Ashar', time: timings.Asr },
            { name: 'Maghrib', time: timings.Maghrib },
            { name: 'Isya', time: timings.Isha }
        ].find(prayer => {
            if (!prayer.time) return false;
            const [hours, minutes] = prayer.time.replace(/\s*\(.*\)\s*/g, '').trim().split(':').map(Number);
            return (hours * 60 + minutes) > currentTime;
        })?.name || 'Subuh';
    },
    
    calculateImsakTime: (fajrTime) => {
        if (!fajrTime || typeof fajrTime !== 'string' || !fajrTime.includes(':')) return 'N/A';
        
        const [hours, minutes] = fajrTime.replace(/\s*\(.*\)\s*/g, '').trim().split(':').map(Number);
        if (isNaN(hours) || isNaN(minutes)) return 'N/A';

        const date = new Date();
        date.setHours(hours, minutes - 10, 0);
        return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    },
    
    formatGregorianDate: (dateStr) => {
        const date = new Date(dateStr.split('-').reverse().join('-'));
        return date.toLocaleDateString('id-ID', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    },
    
    adjustHijriDate: (hijriDate, timings, location) => {
        if (!hijriDate) return hijriDate;

        // Tentukan offset berdasarkan lokasi
        const country = location.split(',').pop().trim();
        const offset = state.prayer.hijriAdjustment.offsets[country] ?? 
                      state.prayer.hijriAdjustment.offsets['default'];

        // Penyesuaian berbasis waktu Maghrib
        const now = new Date();
        const maghribTime = timings.Maghrib?.replace(/\s*\(.*\)\s*/g, '').trim();
        let adjustedDay = parseInt(hijriDate.day);

        if (maghribTime) {
            const [maghribHours, maghribMinutes] = maghribTime.split(':').map(Number);
            const maghribDate = new Date();
            maghribDate.setHours(maghribHours, maghribMinutes, 0);

            if (now < maghribDate) {
                adjustedDay -= 1; // Hari Hijriah belum berganti
            }
        }

        // Terapkan offset lokal
        adjustedDay += offset;

        // Tangani kasus di mana hari menjadi 0 atau negatif (perlu penyesuaian bulan)
        if (adjustedDay <= 0) {
            // Sederhanakan: asumsikan 30 hari per bulan untuk kasus sederhana
            adjustedDay += 30;
            // Catatan: Untuk akurasi, perlu logika untuk menyesuaikan bulan dan tahun
            console.warn('Penyesuaian bulan Hijriah belum diimplementasikan sepenuhnya');
        }

        return {
            ...hijriDate,
            day: adjustedDay.toString()
        };
    },
    
    formatHijriDate: (hijriDate) => {
        return hijriDate ? `${hijriDate.day} ${hijriDate.month.en} ${hijriDate.year}` : 'N/A';
    }
};

// API Utilities
const apiUtils = {
    fetchWithRetry: async (url, options = {}, retries = 3) => {
        try {
            const response = await fetch(url, {
                ...options,
                headers: {
                    'Accept': 'application/json', // Explicitly request JSON
                    ...options.headers, // Allow custom headers
                },
                credentials: 'omit', // Avoid sending cookies
                mode: 'cors', // Ensure CORS mode
            });
            
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            return await response.json();
        } catch (error) {
            if (retries > 0) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                return apiUtils.fetchWithRetry(url, options, retries - 1);
            }
            throw error;
        }
    },
    
    getPrayerTimes: async (latitude, longitude) => {
        const url = `https://api.aladhan.com/v1/timings?latitude=${latitude}&longitude=${longitude}&method=${state.prayer.hijriAdjustment.method}&school=0&tune=2,2,2,2,2,2,2,2,2`;
        return apiUtils.fetchWithRetry(url);
    },
    
    getMonthlyPrayerTimes: async (latitude, longitude, date = new Date()) => {
        const month = date.getMonth() + 1;
        const year = date.getFullYear();
        const url = `https://api.aladhan.com/v1/calendar?latitude=${latitude}&longitude=${longitude}&method=${state.prayer.hijriAdjustment.method}&school=0&tune=2,2,2,2,2,2,2,2,2&month=${month}&year=${year}`;
        return apiUtils.fetchWithRetry(url);
    },
    
    reverseGeocode: async (latitude, longitude) => {
        const url = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`;
        return apiUtils.fetchWithRetry(url);
    },
    
    searchCities: async (query) => {
        if (!query || query.length < 3) return [];
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&accept-language=id`;
        return apiUtils.fetchWithRetry(url);
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
        const parts = displayName.split(',').map(part => part.trim()).filter(Boolean);
        const locationParts = [cityName];
        
        if (parts.length > 2) {
            const cityIndex = parts.length - 3;
            if (cityIndex >= 0 && parts[cityIndex] !== cityName) {
                locationParts.push(parts[cityIndex]);
            }
            if (parts.length - 2 >= 0 && parts[parts.length - 2] !== cityName && 
                (cityIndex < 0 || parts[parts.length - 2] !== parts[cityIndex])) {
                locationParts.push(parts[parts.length - 2]);
            }
            locationParts.push(parts[parts.length - 1]);
        } else {
            if (parts.length - 2 >= 0) {
                locationParts.push(parts[parts.length - 2]);
            }
            locationParts.push(parts[parts.length - 1] || 'Indonesia');
        }
        
        return locationParts.join(', ');
    },
    
    detectLocation: async () => {
        if (!elements.currentLocation) return;
        
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
        const lat = selectedItem.dataset.lat;
        const lon = selectedItem.dataset.lon;
        
        if (!cityName || !lat || !lon) {
            console.error('Invalid city selection:', { cityName, lat, lon });
            return;
        }
        
        if (elements.cityInput) {
            elements.cityInput.value = cityName;
        }
        
        domUtils.hide(elements.cityDropdown);
        
        state.prayer.currentLocation = locationUtils.parseLocationFromSelection(displayName, cityName);
        state.prayer.latitude = parseFloat(lat);
        state.prayer.longitude = parseFloat(lon);
        
        console.log('City selected:', state.prayer);
        renderUtils.updateAll();
    }
};

// Render Utilities
const renderUtils = {
    updateAll: () => {
        renderUtils.prayerLocation();
        renderUtils.dailyPrayerSchedule();
        renderUtils.monthlyPrayerSchedule();
        renderUtils.monthlyPrayerTitle();
    },
    
    prayerLocation: () => {
        if (elements.currentLocation) {
            elements.currentLocation.textContent = state.prayer.currentLocation;
        }
    },
    
    dailyPrayerSchedule: async () => {
        if (!elements.dailyPrayerTimes) return;
        
        try {
            const data = await apiUtils.getPrayerTimes(state.prayer.latitude, state.prayer.longitude);
            
            if (data.code !== 200) throw new Error('Invalid response from API');
            
            state.prayer.dailyTimings = data.data.timings;
            
            // Update date display dengan penyesuaian Hijriah
            if (elements.combinedDate) {
                const gregorianDate = timeUtils.formatGregorianDate(data.data.date.gregorian.date);
                const adjustedHijri = timeUtils.adjustHijriDate(
                    data.data.date.hijri, 
                    data.data.timings, 
                    state.prayer.currentLocation
                );
                const hijriDate = timeUtils.formatHijriDate(adjustedHijri);
                elements.combinedDate.textContent = `${gregorianDate} / ${hijriDate}`;
            }
            
            const adjustedTimings = {
                ...state.prayer.dailyTimings,
                Imsak: timeUtils.calculateImsakTime(state.prayer.dailyTimings.Fajr)
            };
            
            const nextPrayer = timeUtils.getNextPrayer(adjustedTimings);
            const prayerTimes = [
                { name: 'Imsak', time: adjustedTimings.Imsak },
                { name: 'Subuh', time: adjustedTimings.Fajr || 'N/A' },
                { name: 'Terbit', time: adjustedTimings.Sunrise || 'N/A' },
                { name: 'Dzuhur', time: adjustedTimings.Dhuhr || 'N/A' },
                { name: 'Ashar', time: adjustedTimings.Asr || 'N/A' },
                { name: 'Maghrib', time: adjustedTimings.Maghrib || 'N/A' },
                { name: 'Isya', time: adjustedTimings.Isha || 'N/A' }
            ];
            
            elements.dailyPrayerTimes.innerHTML = prayerTimes.map(prayer => {
                const isNext = prayer.name === nextPrayer;
                return `
                    <div class="bg-white rounded-lg shadow-lg p-5 sm:p-6 md:p-5 lg:p-6 hover:shadow-xl transition-all duration-300 ${
                        isNext ? 'border-l-4 border-emerald-600 bg-emerald-50' : 'border-l-4 border-gray-200'
                    }">
                        <div class="flex justify-between items-center">
                            <span class="text-base sm:text-sm md:text-base lg:text-base ${
                                isNext ? 'font-bold text-emerald-700' : 'font-semibold text-gray-600'
                            }">${prayer.name}</span>
                            <span class="text-base sm:text-sm md:text-base lg:text-base ${
                                isNext ? 'font-bold text-emerald-700' : 'text-gray-600'
                            }">${prayer.time}</span>
                        </div>
                    </div>
                `;
            }).join('');
        } catch (error) {
            console.error('Error fetching daily prayer times:', error);
            domUtils.renderError(elements.dailyPrayerTimes, 'Terjadi kesalahan saat mengambil data.');
            if (elements.combinedDate) elements.combinedDate.textContent = 'N/A';
        }
    },
    
    monthlyPrayerSchedule: async () => {
        if (!elements.monthlyPrayerTimes) return;
        
        try {
            const data = await apiUtils.getMonthlyPrayerTimes(state.prayer.latitude, state.prayer.longitude);
            
            if (data.code !== 200) throw new Error('Invalid response from API');
            
            state.prayer.monthlyTimings = data.data;
            
            elements.monthlyPrayerTimes.innerHTML = data.data.map(day => {
                const adjustedTimings = {
                    ...day.timings,
                    Imsak: timeUtils.calculateImsakTime(day.timings.Fajr)
                };
                
                const date = new Date(day.date.gregorian.date.split('-').reverse().join('-'));
                const formattedDate = date.toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                });
                
                return `
                    <tr class="hover:bg-emerald-50 transition-colors duration-200">
                        <td class="p-3">${formattedDate}</td>
                        <td class="p-3">${adjustedTimings.Fajr || 'N/A'}</td>
                        <td class="p-3">${adjustedTimings.Dhuhr || 'N/A'}</td>
                        <td class="p-3">${adjustedTimings.Asr || 'N/A'}</td>
                        <td class="p-3">${adjustedTimings.Maghrib || 'N/A'}</td>
                        <td class="p-3">${adjustedTimings.Isha || 'N/A'}</td>
                    </tr>
                `;
            }).join('');
        } catch (error) {
            console.error('Error fetching monthly prayer times:', error);
            domUtils.renderError(elements.monthlyPrayerTimes, 'Terjadi kesalahan saat mengambil data.');
        }
    },
    
    monthlyPrayerTitle: () => {
        if (!elements.monthlyPrayerTitle) return;
        
        elements.monthlyPrayerTitle.innerHTML = `
            <h3 class="text-lg font-semibold text-gray-800 mb-4">
                Jadwal Sholat Bulan ${new Date().toLocaleString('id-ID', { month: 'long' })}
            </h3>
        `;
    },
    
    showDropdown: (items) => {
        if (!elements.cityDropdown) return;
        
        if (!items || items.length === 0) {
            domUtils.hide(elements.cityDropdown);
            return;
        }
        
        elements.cityDropdown.innerHTML = items.map(city => `
            <div class="dropdown-item px-3 py-2 hover:bg-gray-100 cursor-pointer transition-colors duration-200"
                 data-lat="${city.lat}"
                 data-lon="${city.lon}"
                 data-display-name="${city.display_name || ''}">
                <span class="font-medium">${city.display_name ? city.display_name.split(',')[0] : 'Unknown'}</span>
                <span class="text-gray-500 text-sm">${
                    city.display_name ? `(${city.display_name.split(',').slice(1, 3).join(', ')})` : ''
                }</span>
            </div>
        `).join('');
        
        domUtils.show(elements.cityDropdown);
    }
};

// Event Handlers
const eventHandlers = {
    handleCityInput: async (e) => {
        const query = e.target.value.trim();
        
        if (e.key === 'Enter') {
            e.preventDefault();
            await locationUtils.updateLocation(query);
            return;
        }
        
        if (query.length >= 3) {
            const cities = await apiUtils.searchCities(query);
            renderUtils.showDropdown(cities);
        } else {
            domUtils.hide(elements.cityDropdown);
        }
    },
    
    handleCityKeyDown: (e) => {
        const items = elements.cityDropdown?.querySelectorAll('.dropdown-item');
        if (!items || items.length === 0) return;
        
        let current = Array.from(items).findIndex(item => item.classList.contains('bg-gray-200'));
        
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            current = (current + 1) % items.length;
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            current = (current - 1 + items.length) % items.length;
        } else if (e.key === 'Enter' && current >= 0) {
            e.preventDefault();
            locationUtils.handleCitySelection(items[current]);
            return;
        }
        
        items.forEach(item => item.classList.remove('bg-gray-200'));
        if (current >= 0) {
            items[current].classList.add('bg-gray-200');
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

// Initialization
const init = () => {
    // Muat konfigurasi dari localStorage (jika ada)
    const savedAdjustment = localStorage.getItem('hijriAdjustment');
    if (savedAdjustment) {
        state.prayer.hijriAdjustment = JSON.parse(savedAdjustment);
    }

    // Simpan konfigurasi saat berubah
    const saveAdjustment = () => {
        localStorage.setItem('hijriAdjustment', JSON.stringify(state.prayer.hijriAdjustment));
    };

    // Tambahkan event listener untuk perubahan lokasi
    const originalUpdateLocation = locationUtils.updateLocation;
    locationUtils.updateLocation = async (city) => {
        await originalUpdateLocation(city);
        saveAdjustment();
    };

    // Set up event listeners
    if (elements.cityInput) {
        let searchTimeout;
        
        elements.cityInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => eventHandlers.handleCityInput(e), 300);
        });
        
        elements.cityInput.addEventListener('keydown', eventHandlers.handleCityKeyDown);
    }
    
    if (elements.cityDropdown) {
        elements.cityDropdown.addEventListener('click', eventHandlers.handleDropdownClick);
    }
    
    document.addEventListener('click', eventHandlers.handleOutsideClick);
    
    // Initialize location and prayer times
    locationUtils.detectLocation();
};

document.addEventListener('DOMContentLoaded', init);
