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
        monthlyTimings: null
    }
};

const utils = {
    showElement: (el) => {
        if (el) el.classList.remove('hidden');
    },
    hideElement: (el) => {
        if (el) el.classList.add('hidden');
    },
    renderError: (container, message) => {
        if (container) container.innerHTML = `<p class="text-center text-red-600">${message}</p>`;
    },
    toggleLocationInput: () => {
        const { locationInput } = elements;
        if (locationInput) locationInput.classList.toggle('hidden');
    },
    detectPrayerLocation: async () => {
        const { currentLocation } = elements;
        if (!currentLocation) return;

        const setDefaultLocation = () => {
            state.prayer.currentLocation = 'Jakarta, Indonesia';
            state.prayer.latitude = -6.2088;
            state.prayer.longitude = 106.8456;
            console.log('Using default location:', state.prayer);
            render.prayerLocation();
            render.dailyPrayerSchedule();
            render.monthlyPrayerSchedule();
            render.monthlyPrayerTitle();
        };

        if (navigator.geolocation) {
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
                console.log('Geolocation retrieved:', {
                    latitude: state.prayer.latitude,
                    longitude: state.prayer.longitude
                });

                try {
                    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${state.prayer.latitude}&lon=${state.prayer.longitude}&format=json`, {
                        headers: {
                            'User-Agent': 'QuranWebView/1.0 (Contact: your-email@example.com)'
                        }
                    });
                    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
                    const data = await response.json();
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

                    state.prayer.currentLocation = [...new Set(parts.filter(part => part))].join(', ');
                    console.log('Reverse geocoding successful:', state.prayer);
                } catch (error) {
                    console.error('Reverse geocoding failed:', error);
                    setDefaultLocation();
                    return;
                }
                render.prayerLocation();
                render.dailyPrayerSchedule();
                render.monthlyPrayerSchedule();
                render.monthlyPrayerTitle();
            } catch (error) {
                try {
                    const response = await fetch('https://ipinfo.io/json?token=060afd26c77039');
                    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
                    const data = await response.json();
                    state.prayer.currentLocation = data.city ? `${data.city}, ${data.country || 'Indonesia'}` : 'Jakarta, Indonesia';
                    const [lat, lon] = data.loc ? data.loc.split(',').map(Number) : [-6.2088, 106.8456];
                    state.prayer.latitude = lat;
                    state.prayer.longitude = lon;
                    console.log('IP-based location retrieved:', state.prayer);
                    render.prayerLocation();
                    render.dailyPrayerSchedule();
                    render.monthlyPrayerSchedule();
                    render.monthlyPrayerTitle();
                } catch (ipError) {
                    console.error('IP-based location failed:', ipError);
                    setDefaultLocation();
                }
            }
        } else {
            setDefaultLocation();
        }
    },
    updatePrayerLocation: () => {
        const { cityInput, cityDropdown } = elements;
        if (!cityInput) return;

        const city = cityInput.value.trim();
        if (!city) return;

        const highlightedItem = cityDropdown?.querySelector('.bg-gray-200');
        if (highlightedItem) {
            utils.handleCitySelection(highlightedItem);
            return;
        }

        console.log('Searching for city:', city);
        fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1`, {
            headers: {
                'User-Agent': 'QuranWebView/1.0 (Contact: your-email@example.com)'
            }
        })
            .then(response => response.json())
            .then(data => {
                if (data.length > 0) {
                    const displayName = data[0].display_name || '';
                    const parts = displayName.split(',').map(part => part.trim()).filter(part => part);
                    let locationParts = [];

                    if (parts.length > 2) {
                        locationParts = [city];
                        const cityIndex = parts.length - 3;
                        if (cityIndex >= 0 && parts[cityIndex] !== city) {
                            locationParts.push(parts[cityIndex]);
                        }
                        if (parts.length - 2 >= 0 && parts[parts.length - 2] !== city && (cityIndex < 0 || parts[parts.length - 2] !== parts[cityIndex])) {
                            locationParts.push(parts[parts.length - 2]);
                        }
                        locationParts.push(parts[parts.length - 1] || 'Indonesia');
                    } else {
                        locationParts = [city];
                        if (parts.length - 2 >= 0) {
                            locationParts.push(parts[parts.length - 2]);
                        }
                        locationParts.push(parts[parts.length - 1] || 'Indonesia');
                    }

                    state.prayer.currentLocation = locationParts.join(', ');
                    state.prayer.latitude = parseFloat(data[0].lat);
                    state.prayer.longitude = parseFloat(data[0].lon);
                    console.log('Location updated successfully:', state.prayer);
                } else {
                    console.warn('City not found, using default location');
                    state.prayer.currentLocation = 'Jakarta, Indonesia';
                    state.prayer.latitude = -6.2088;
                    state.prayer.longitude = 106.8456;
                }
                render.prayerLocation();
                render.dailyPrayerSchedule();
                render.monthlyPrayerSchedule();
                render.monthlyPrayerTitle();
                utils.hideElement(elements.locationInput);
            })
            .catch(error => {
                console.error('Error updating location:', error);
                alert('Gagal mendapatkan koordinat kota. Menggunakan lokasi default.');
                state.prayer.currentLocation = 'Jakarta, Indonesia';
                state.prayer.latitude = -6.2088;
                state.prayer.longitude = 106.8456;
                render.prayerLocation();
                render.dailyPrayerSchedule();
                render.monthlyPrayerSchedule();
                render.monthlyPrayerTitle();
                utils.hideElement(elements.locationInput);
            });
    },
    getNextPrayer: (timings) => {
        if (!timings) return 'Subuh';
        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();
        const prayerTimes = [
            { name: 'Subuh', time: timings.Fajr },
            { name: 'Dzuhur', time: timings.Dhuhr },
            { name: 'Ashar', time: timings.Asr },
            { name: 'Maghrib', time: timings.Maghrib },
            { name: 'Isya', time: timings.Isha }
        ];
        for (let prayer of prayerTimes) {
            if (!prayer.time) continue;
            const cleanedTime = prayer.time.replace(/\s*\(.*\)\s*/g, '').trim();
            const [hours, minutes] = cleanedTime.split(':').map(Number);
            const prayerTime = hours * 60 + minutes;
            if (prayerTime > currentTime) {
                return prayer.name;
            }
        }
        return 'Subuh';
    },
    calculateImsakTime: (fajrTime) => {
        if (!fajrTime || typeof fajrTime !== 'string' || !fajrTime.includes(':')) return 'N/A';
        const cleanedTime = fajrTime.replace(/\s*\(.*\)\s*/g, '').trim();
        const [hours, minutes] = cleanedTime.split(':').map(Number);
        if (isNaN(hours) || isNaN(minutes)) return 'N/A';

        const date = new Date();
        date.setHours(hours, minutes - 10, 0);
        const newHours = date.getHours().toString().padStart(2, '0');
        const newMinutes = date.getMinutes().toString().padStart(2, '0');
        return `${newHours}:${newMinutes}`;
    },
    showDropdown: (items) => {
        if (!elements.cityDropdown) return;

        if (!items || items.length === 0) {
            utils.hideElement(elements.cityDropdown);
            return;
        }

        elements.cityDropdown.innerHTML = items.map(city => `
        <div class="dropdown-item px-3 py-2 hover:bg-gray-100 cursor-pointer transition-colors duration-200"
             data-lat="${city.lat}"
             data-lon="${city.lon}"
             data-display-name="${city.display_name || ''}">
          <span class="font-medium">${city.display_name ? city.display_name.split(',')[0] : 'Unknown'}</span>
          <span class="text-gray-500 text-sm">${city.display_name ? `(${city.display_name.split(',').slice(1, 3).join(', ')})` : ''}</span>
        </div>
      `).join('');

        utils.showElement(elements.cityDropdown);
    },
    fetchCities: async (query) => {
        if (!query || query.length < 3) return [];

        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&accept-language=id`,
                {
                    headers: {
                        'User-Agent': 'QuranWebView/1.0 (Contact: your-email@example.com)'
                    }
                }
            );
            if (!response.ok) {
                console.error(`Nominatim API error: ${response.status}`);
                return [];
            }
            const data = await response.json();
            return data.filter(item => item.lat && item.lon && item.display_name);
        } catch (error) {
            console.error("Error fetching cities:", error);
            return [];
        }
    },
    handleCitySelection: (selectedItem) => {
        if (!selectedItem) return;

        const cityName = selectedItem.querySelector('span.font-medium')?.textContent || '';
        const displayName = selectedItem.dataset.displayName || '';
        const lat = selectedItem.dataset.lat;
        const lon = selectedItem.dataset.lon;

        if (!cityName || !lat || !lon) {
            console.error('Invalid city selection data:', { cityName, lat, lon });
            return;
        }

        if (elements.cityInput) {
            elements.cityInput.value = cityName;
        }

        utils.hideElement(elements.cityDropdown);

        const parts = displayName.split(',').map(part => part.trim()).filter(part => part);
        let locationParts = [];

        if (parts.length > 2) {
            locationParts = [cityName];
            const cityIndex = parts.length - 3;
            if (cityIndex >= 0 && parts[cityIndex] !== cityName) {
                locationParts.push(parts[cityIndex]);
            }
            if (parts.length - 2 >= 0 && parts[parts.length - 2] !== cityName && (cityIndex < 0 || parts[parts.length - 2] !== parts[cityIndex])) {
                locationParts.push(parts[parts.length - 2]);
            }
            locationParts.push(parts[parts.length - 1]);
        } else {
            locationParts = [cityName];
            if (parts.length - 2 >= 0) {
                locationParts.push(parts[parts.length - 2]);
            }
            locationParts.push(parts[parts.length - 1] || 'Indonesia');
        }

        state.prayer.currentLocation = locationParts.join(', ');
        state.prayer.latitude = parseFloat(lat);
        state.prayer.longitude = parseFloat(lon);

        console.log('City selected:', state.prayer);

        render.prayerLocation();
        render.dailyPrayerSchedule();
        render.monthlyPrayerSchedule();
        render.monthlyPrayerTitle();

        utils.hideElement(elements.locationInput);
    }
};

const render = {
    prayerLocation: () => {
        const { currentLocation } = elements;
        if (currentLocation) {
            currentLocation.textContent = state.prayer.currentLocation;
        }
    },
    dailyPrayerSchedule: async () => {
        const { dailyPrayerTimes, combinedDate } = elements;
        if (!dailyPrayerTimes) return;
        try {
            const url = `https://api.aladhan.com/v1/timings?latitude=${state.prayer.latitude}&longitude=${state.prayer.longitude}&method=20&school=0&tune=2,2,2,2,2,2,2,2,2`;
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            const data = await response.json();
            if (data.code === 200) {
                state.prayer.dailyTimings = data.data.timings;
                const gregorianDate = new Date(data.data.date.gregorian.date.split('-').reverse().join('-')).toLocaleDateString('id-ID', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                });
                const hijriDate = data.data.date.hijri;
                const formattedHijri = hijriDate ? `${hijriDate.day} ${hijriDate.month.en} ${hijriDate.year}` : 'N/A';
                const combinedDateText = `${gregorianDate} / ${formattedHijri}`;
                if (combinedDate) combinedDate.textContent = combinedDateText;

                const adjustedTimings = {
                    ...state.prayer.dailyTimings,
                    Imsak: utils.calculateImsakTime(state.prayer.dailyTimings.Fajr)
                };

                const nextPrayer = utils.getNextPrayer(adjustedTimings);
                const prayerTimes = [
                    { name: 'Imsak', time: adjustedTimings.Imsak },
                    { name: 'Subuh', time: adjustedTimings.Fajr || 'N/A' },
                    { name: 'Terbit', time: adjustedTimings.Sunrise || 'N/A' },
                    { name: 'Dzuhur', time: adjustedTimings.Dhuhr || 'N/A' },
                    { name: 'Ashar', time: adjustedTimings.Asr || 'N/A' },
                    { name: 'Maghrib', time: adjustedTimings.Maghrib || 'N/A' },
                    { name: 'Isya', time: adjustedTimings.Isha || 'N/A' }
                ];

                dailyPrayerTimes.innerHTML = prayerTimes.map(prayer => {
                    const isNext = prayer.name === nextPrayer;
                    return `
              <div class="bg-white rounded-lg shadow-lg p-5 sm:p-6 md:p-5 lg:p-6 hover:shadow-xl transition-all duration-300 ${isNext ? 'border-l-4 border-emerald-600 bg-emerald-50' : 'border-l-4 border-gray-200'}">
                <div class="flex justify-between items-center">
                  <span class="text-base sm:text-sm md:text-base lg:text-base ${isNext ? 'font-bold text-emerald-700' : 'font-semibold text-gray-600'}">${prayer.name}</span>
                  <span class="text-base sm:text-sm md:text-base lg:text-base ${isNext ? 'font-bold text-emerald-700' : 'text-gray-600'}">${prayer.time}</span>
                </div>
              </div>
            `;
                }).join('');
            } else {
                utils.renderError(dailyPrayerTimes, 'Gagal mengambil jadwal sholat harian.');
            }
        } catch (error) {
            utils.renderError(dailyPrayerTimes, 'Terjadi kesalahan saat mengambil data.');
            if (combinedDate) combinedDate.textContent = 'N/A';
        }
    },
    monthlyPrayerTitle: () => {
        const { monthlyPrayerTitle } = elements;
        if (!monthlyPrayerTitle) return;
        monthlyPrayerTitle.innerHTML = `
        <h3 class="text-lg font-semibold text-gray-800 mb-4">Jadwal Sholat Bulan ${new Date().toLocaleString('id-ID', { month: 'long' })}</h3>
      `;
    },
    monthlyPrayerSchedule: async () => {
        const { monthlyPrayerTimes } = elements;
        if (!monthlyPrayerTimes) return;
        try {
            const date = new Date();
            const month = date.getMonth() + 1;
            const year = date.getFullYear();
            const url = `https://api.aladhan.com/v1/calendar?latitude=${state.prayer.latitude}&longitude=${state.prayer.longitude}&method=20&school=0&tune=2,2,2,2,2,2,2,2,2&month=${month}&year=${year}`;
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            const data = await response.json();
            if (data.code === 200) {
                state.prayer.monthlyTimings = data.data;
                monthlyPrayerTimes.innerHTML = data.data.map(day => {
                    const timings = day.timings;
                    const adjustedTimings = {
                        ...timings,
                        Imsak: utils.calculateImsakTime(timings.Fajr)
                    };
                    const date = new Date(day.date.gregorian.date.split('-').reverse().join('-')).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                    });
                    return `
              <tr class="hover:bg-emerald-50 transition-colors duration-200">
                <td class="p-3">${date}</td>
                <td class="p-3">${adjustedTimings.Fajr || 'N/A'}</td>
                <td class="p-3">${adjustedTimings.Dhuhr || 'N/A'}</td>
                <td class="p-3">${adjustedTimings.Asr || 'N/A'}</td>
                <td class="p-3">${adjustedTimings.Maghrib || 'N/A'}</td>
                <td class="p-3">${adjustedTimings.Isha || 'N/A'}</td>
              </tr>
            `;
                }).join('');
            } else {
                utils.renderError(monthlyPrayerTimes, 'Gagal mengambil jadwal sholat bulanan.');
            }
        } catch (error) {
            utils.renderError(monthlyPrayerTimes, 'Terjadi kesalahan saat mengambil data.');
        }
    }
};

const init = () => {
    if (elements.cityInput) {
        elements.cityInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                utils.updatePrayerLocation();
            }
        });

        let searchTimeout;
        elements.cityInput.addEventListener('input', async (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(async () => {
                const query = e.target.value.trim();
                if (query.length >= 3) {
                    const cities = await utils.fetchCities(query);
                    utils.showDropdown(cities);
                } else {
                    utils.hideElement(elements.cityDropdown);
                }
            }, 300);
        });

        elements.cityInput.addEventListener('keydown', (e) => {
            const items = elements.cityDropdown?.querySelectorAll('.dropdown-item');
            if (!items || items.length === 0) return;

            let current = Array.from(items).findIndex(item =>
                item.classList.contains('bg-gray-200'));

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                current = (current + 1) % items.length;
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                current = (current - 1 + items.length) % items.length;
            } else if (e.key === 'Enter' && current >= 0) {
                e.preventDefault();
                utils.handleCitySelection(items[current]);
                return;
            }

            items.forEach(item => item.classList.remove('bg-gray-200'));
            if (current >= 0) {
                items[current].classList.add('bg-gray-200');
                items[current].scrollIntoView({ block: 'nearest' });
            }
        });
    }

    if (elements.cityDropdown) {
        elements.cityDropdown.addEventListener('click', (e) => {
            const item = e.target.closest('.dropdown-item');
            if (item) {
                utils.handleCitySelection(item);
            }
        });
    }

    document.addEventListener('click', (e) => {
        if (!elements.cityInput?.contains(e.target) &&
            !elements.cityDropdown?.contains(e.target)) {
            utils.hideElement(elements.cityDropdown);
        }
    });

    utils.detectPrayerLocation();
};

document.addEventListener('DOMContentLoaded', init);