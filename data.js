const surahData = [
    { number: 1, name: "Al-Fatihah", arabic: "الفاتحة", page: 1, juz: [1], revelation: "Makkiyah", verses: 7 },
    { number: 2, name: "Al-Baqarah", arabic: "البقرة", page: 2, juz: [1, 2, 3], revelation: "Madaniyah", verses: 286 },
    { number: 3, name: "Ali 'Imran", arabic: "آل عمران", page: 50, juz: [3, 4], revelation: "Madaniyah", verses: 200 },
    { number: 4, name: "An-Nisa", arabic: "النساء", page: 77, juz: [4, 5, 6], revelation: "Madaniyah", verses: 176 },
    { number: 5, name: "Al-Ma'idah", arabic: "المائدة", page: 106, juz: [6, 7], revelation: "Madaniyah", verses: 120 },
    { number: 6, name: "Al-An'am", arabic: "الأنعام", page: 128, juz: [7, 8], revelation: "Makkiyah", verses: 165 },
    { number: 7, name: "Al-A'raf", arabic: "الأعراف", page: 151, juz: [8, 9], revelation: "Makkiyah", verses: 206 },
    { number: 8, name: "Al-Anfal", arabic: "الأنفال", page: 177, juz: [9, 10], revelation: "Madaniyah", verses: 75 },
    { number: 9, name: "At-Tawbah", arabic: "التوبة", page: 187, juz: [10, 11], revelation: "Madaniyah", verses: 129 },
    { number: 10, name: "Yunus", arabic: "يونس", page: 208, juz: [11], revelation: "Makkiyah", verses: 109 },
    { number: 11, name: "Hud", arabic: "هود", page: 221, juz: [11, 12], revelation: "Makkiyah", verses: 123 },
    { number: 12, name: "Yusuf", arabic: "يوسف", page: 235, juz: [12, 13], revelation: "Makkiyah", verses: 111 },
    { number: 13, name: "Ar-Ra'd", arabic: "الرعد", page: 249, juz: [13], revelation: "Madaniyah", verses: 43 },
    { number: 14, name: "Ibrahim", arabic: "إبراهيم", page: 255, juz: [13], revelation: "Makkiyah", verses: 52 },
    { number: 15, name: "Al-Hijr", arabic: "الحجر", page: 262, juz: [14], revelation: "Makkiyah", verses: 99 },
    { number: 16, name: "An-Nahl", arabic: "النحل", page: 267, juz: [14], revelation: "Makkiyah", verses: 128 },
    { number: 17, name: "Al-Isra", arabic: "الإسراء", page: 282, juz: [15], revelation: "Makkiyah", verses: 111 },
    { number: 18, name: "Al-Kahf", arabic: "الكهف", page: 293, juz: [15, 16], revelation: "Makkiyah", verses: 110 },
    { number: 19, name: "Maryam", arabic: "مريم", page: 305, juz: [16], revelation: "Makkiyah", verses: 98 },
    { number: 20, name: "Ta-Ha", arabic: "طه", page: 312, juz: [16], revelation: "Makkiyah", verses: 135 },
    { number: 21, name: "Al-Anbiya", arabic: "الأنبياء", page: 322, juz: [17], revelation: "Makkiyah", verses: 112 },
    { number: 22, name: "Al-Hajj", arabic: "الحج", page: 332, juz: [17], revelation: "Madaniyah", verses: 78 },
    { number: 23, name: "Al-Mu'minun", arabic: "المؤمنون", page: 342, juz: [18], revelation: "Makkiyah", verses: 118 },
    { number: 24, name: "An-Nur", arabic: "النور", page: 350, juz: [18], revelation: "Madaniyah", verses: 64 },
    { number: 25, name: "Al-Furqan", arabic: "الفرقان", page: 359, juz: [18, 19], revelation: "Makkiyah", verses: 77 },
    { number: 26, name: "Asy-Syu'ara", arabic: "الشعراء", page: 367, juz: [19], revelation: "Makkiyah", verses: 227 },
    { number: 27, name: "An-Naml", arabic: "النمل", page: 377, juz: [19, 20], revelation: "Makkiyah", verses: 93 },
    { number: 28, name: "Al-Qasas", arabic: "القصص", page: 385, juz: [20], revelation: "Makkiyah", verses: 88 },
    { number: 29, name: "Al-'Ankabut", arabic: "العنكبوت", page: 396, juz: [20, 21], revelation: "Makkiyah", verses: 69 },
    { number: 30, name: "Ar-Rum", arabic: "الروم", page: 404, juz: [21], revelation: "Makkiyah", verses: 60 },
    { number: 31, name: "Luqman", arabic: "لقمان", page: 411, juz: [21], revelation: "Makkiyah", verses: 34 },
    { number: 32, name: "As-Sajdah", arabic: "السجدة", page: 415, juz: [21], revelation: "Makkiyah", verses: 30 },
    { number: 33, name: "Al-Ahzab", arabic: "الأحزاب", page: 418, juz: [21, 22], revelation: "Madaniyah", verses: 73 },
    { number: 34, name: "Saba", arabic: "سبأ", page: 428, juz: [22], revelation: "Makkiyah", verses: 54 },
    { number: 35, name: "Fatir", arabic: "فاطر", page: 434, juz: [22], revelation: "Makkiyah", verses: 45 },
    { number: 36, name: "Ya-Sin", arabic: "يس", page: 440, juz: [22, 23], revelation: "Makkiyah", verses: 83 },
    { number: 37, name: "As-Saffat", arabic: "الصافات", page: 446, juz: [23], revelation: "Makkiyah", verses: 182 },
    { number: 38, name: "Sad", arabic: "ص", page: 453, juz: [23], revelation: "Makkiyah", verses: 88 },
    { number: 39, name: "Az-Zumar", arabic: "الزمر", page: 458, juz: [23, 24], revelation: "Makkiyah", verses: 75 },
    { number: 40, name: "Ghafir", arabic: "غافر", page: 467, juz: [24], revelation: "Makkiyah", verses: 85 },
    { number: 41, name: "Fussilat", arabic: "فصلت", page: 477, juz: [24, 25], revelation: "Makkiyah", verses: 54 },
    { number: 42, name: "Asy-Syura", arabic: "الشورى", page: 483, juz: [25], revelation: "Makkiyah", verses: 53 },
    { number: 43, name: "Az-Zukhruf", arabic: "الزخرف", page: 489, juz: [25], revelation: "Makkiyah", verses: 89 },
    { number: 44, name: "Ad-Dukhan", arabic: "الدخان", page: 496, juz: [25], revelation: "Makkiyah", verses: 59 },
    { number: 45, name: "Al-Jathiyah", arabic: "الجاثية", page: 499, juz: [25], revelation: "Makkiyah", verses: 37 },
    { number: 46, name: "Al-Ahqaf", arabic: "الأحقاف", page: 502, juz: [26], revelation: "Makkiyah", verses: 35 },
    { number: 47, name: "Muhammad", arabic: "محمد", page: 507, juz: [26], revelation: "Madaniyah", verses: 38 },
    { number: 48, name: "Al-Fath", arabic: "الفتح", page: 511, juz: [26], revelation: "Madaniyah", verses: 29 },
    { number: 49, name: "Al-Hujurat", arabic: "الحجرات", page: 515, juz: [26], revelation: "Madaniyah", verses: 18 },
    { number: 50, name: "Qaf", arabic: "ق", page: 518, juz: [26], revelation: "Makkiyah", verses: 45 },
    { number: 51, name: "Adz-Dzariyat", arabic: "الذاريات", page: 520, juz: [26, 27], revelation: "Makkiyah", verses: 60 },
    { number: 52, name: "At-Tur", arabic: "الطور", page: 523, juz: [27], revelation: "Makkiyah", verses: 49 },
    { number: 53, name: "An-Najm", arabic: "النجم", page: 526, juz: [27], revelation: "Makkiyah", verses: 62 },
    { number: 54, name: "Al-Qamar", arabic: "القمر", page: 528, juz: [27], revelation: "Makkiyah", verses: 55 },
    { number: 55, name: "Ar-Rahman", arabic: "الرحمن", page: 531, juz: [27], revelation: "Madaniyah", verses: 78 },
    { number: 56, name: "Al-Waqi'ah", arabic: "الواقعة", page: 534, juz: [27], revelation: "Makkiyah", verses: 96 },
    { number: 57, name: "Al-Hadid", arabic: "الحديد", page: 537, juz: [27], revelation: "Madaniyah", verses: 29 },
    { number: 58, name: "Al-Mujadilah", arabic: "المجادلة", page: 542, juz: [28], revelation: "Madaniyah", verses: 22 },
    { number: 59, name: "Al-Hasyr", arabic: "الحشر", page: 545, juz: [28], revelation: "Madaniyah", verses: 24 },
    { number: 60, name: "Al-Mumtahanah", arabic: "الممتحنة", page: 549, juz: [28], revelation: "Madaniyah", verses: 13 },
    { number: 61, name: "As-Saff", arabic: "الصف", page: 551, juz: [28], revelation: "Madaniyah", verses: 14 },
    { number: 62, name: "Al-Jumu'ah", arabic: "الجمعة", page: 553, juz: [28], revelation: "Madaniyah", verses: 11 },
    { number: 63, name: "Al-Munafiqun", arabic: "المنافقون", page: 554, juz: [28], revelation: "Madaniyah", verses: 11 },
    { number: 64, name: "At-Taghabun", arabic: "التغابن", page: 556, juz: [28], revelation: "Madaniyah", verses: 18 },
    { number: 65, name: "At-Talaq", arabic: "الطلاق", page: 558, juz: [28], revelation: "Madaniyah", verses: 12 },
    { number: 66, name: "At-Tahrim", arabic: "التحريم", page: 560, juz: [28], revelation: "Madaniyah", verses: 12 },
    { number: 67, name: "Al-Mulk", arabic: "الملك", page: 562, juz: [29], revelation: "Makkiyah", verses: 30 },
    { number: 68, name: "Al-Qalam", arabic: "القلم", page: 564, juz: [29], revelation: "Makkiyah", verses: 52 },
    { number: 69, name: "Al-Haqqah", arabic: "الحاقة", page: 566, juz: [29], revelation: "Makkiyah", verses: 52 },
    { number: 70, name: "Al-Ma'arij", arabic: "المعارج", page: 568, juz: [29], revelation: "Makkiyah", verses: 44 },
    { number: 71, name: "Nuh", arabic: "نوح", page: 570, juz: [29], revelation: "Makkiyah", verses: 28 },
    { number: 72, name: "Al-Jinn", arabic: "الجن", page: 572, juz: [29], revelation: "Makkiyah", verses: 28 },
    { number: 73, name: "Al-Muzzammil", arabic: "المزمل", page: 574, juz: [29], revelation: "Makkiyah", verses: 20 },
    { number: 74, name: "Al-Muddaththir", arabic: "المدثر", page: 575, juz: [29], revelation: "Makkiyah", verses: 56 },
    { number: 75, name: "Al-Qiyamah", arabic: "القيامة", page: 577, juz: [29], revelation: "Makkiyah", verses: 40 },
    { number: 76, name: "Al-Insan", arabic: "الإنسان", page: 578, juz: [29], revelation: "Madaniyah", verses: 31 },
    { number: 77, name: "Al-Mursalat", arabic: "المرسلات", page: 580, juz: [29], revelation: "Makkiyah", verses: 50 },
    { number: 78, name: "An-Naba", arabic: "النبأ", page: 582, juz: [30], revelation: "Makkiyah", verses: 40 },
    { number: 79, name: "An-Nazi'at", arabic: "النازعات", page: 583, juz: [30], revelation: "Makkiyah", verses: 46 },
    { number: 80, name: "'Abasa", arabic: "عبس", page: 585, juz: [30], revelation: "Makkiyah", verses: 42 },
    { number: 81, name: "At-Takwir", arabic: "التكوير", page: 586, juz: [30], revelation: "Makkiyah", verses: 29 },
    { number: 82, name: "Al-Infitar", arabic: "الانفطار", page: 587, juz: [30], revelation: "Makkiyah", verses: 19 },
    { number: 83, name: "Al-Mutaffifin", arabic: "المطففين", page: 587, juz: [30], revelation: "Makkiyah", verses: 36 },
    { number: 84, name: "Al-Insyiqaq", arabic: "الانشقاق", page: 589, juz: [30], revelation: "Makkiyah", verses: 25 },
    { number: 85, name: "Al-Buruj", arabic: "البروج", page: 590, juz: [30], revelation: "Makkiyah", verses: 22 },
    { number: 86, name: "At-Tariq", arabic: "الطارق", page: 591, juz: [30], revelation: "Makkiyah", verses: 17 },
    { number: 87, name: "Al-A'la", arabic: "الأعلى", page: 591, juz: [30], revelation: "Makkiyah", verses: 19 },
    { number: 88, name: "Al-Ghasyiyah", arabic: "الغاشية", page: 592, juz: [30], revelation: "Makkiyah", verses: 26 },
    { number: 89, name: "Al-Fajr", arabic: "الفجر", page: 593, juz: [30], revelation: "Makkiyah", verses: 30 },
    { number: 90, name: "Al-Balad", arabic: "البلد", page: 594, juz: [30], revelation: "Makkiyah", verses: 20 },
    { number: 91, name: "Asy-Syams", arabic: "الشمس", page: 595, juz: [30], revelation: "Makkiyah", verses: 15 },
    { number: 92, name: "Al-Lail", arabic: "الليل", page: 595, juz: [30], revelation: "Makkiyah", verses: 21 },
    { number: 93, name: "Ad-Dhuha", arabic: "الضحى", page: 596, juz: [30], revelation: "Makkiyah", verses: 11 },
    { number: 94, name: "Asy-Syarh", arabic: "الشرح", page: 596, juz: [30], revelation: "Makkiyah", verses: 8 },
    { number: 95, name: "At-Tin", arabic: "التين", page: 597, juz: [30], revelation: "Makkiyah", verses: 8 },
    { number: 96, name: "Al-'Alaq", arabic: "العلق", page: 597, juz: [30], revelation: "Makkiyah", verses: 19 },
    { number: 97, name: "Al-Qadr", arabic: "القدر", page: 598, juz: [30], revelation: "Makkiyah", verses: 5 },
    { number: 98, name: "Al-Bayyinah", arabic: "البينة", page: 598, juz: [30], revelation: "Madaniyah", verses: 8 },
    { number: 99, name: "Az-Zalzalah", arabic: "الزلزلة", page: 599, juz: [30], revelation: "Madaniyah", verses: 8 },
    { number: 100, name: "Al-'Adiyat", arabic: "العاديات", page: 599, juz: [30], revelation: "Makkiyah", verses: 11 },
    { number: 101, name: "Al-Qari'ah", arabic: "القارعة", page: 600, juz: [30], revelation: "Makkiyah", verses: 11 },
    { number: 102, name: "At-Takathur", arabic: "التكاثر", page: 600, juz: [30], revelation: "Makkiyah", verses: 8 },
    { number: 103, name: "Al-'Asr", arabic: "العصر", page: 601, juz: [30], revelation: "Makkiyah", verses: 3 },
    { number: 104, name: "Al-Humazah", arabic: "الهمزة", page: 601, juz: [30], revelation: "Makkiyah", verses: 9 },
    { number: 105, name: "Al-Fil", arabic: "الفيل", page: 601, juz: [30], revelation: "Makkiyah", verses: 5 },
    { number: 106, name: "Quraisy", arabic: "قريش", page: 602, juz: [30], revelation: "Makkiyah", verses: 4 },
    { number: 107, name: "Al-Ma'un", arabic: "الماعون", page: 602, juz: [30], revelation: "Makkiyah", verses: 7 },
    { number: 108, name: "Al-Kawthar", arabic: "الكوثر", page: 602, juz: [30], revelation: "Makkiyah", verses: 3 },
    { number: 109, name: "Al-Kafirun", arabic: "الكافرون", page: 603, juz: [30], revelation: "Makkiyah", verses: 6 },
    { number: 110, name: "An-Nasr", arabic: "النصر", page: 603, juz: [30], revelation: "Madaniyah", verses: 3 },
    { number: 111, name: "Al-Lahab", arabic: "اللهب", page: 603, juz: [30], revelation: "Makkiyah", verses: 5 },
    { number: 112, name: "Al-Ikhlas", arabic: "الإخلاص", page: 604, juz: [30], revelation: "Makkiyah", verses: 4 },
    { number: 113, name: "Al-Falaq", arabic: "الفلق", page: 604, juz: [30], revelation: "Makkiyah", verses: 5 },
    { number: 114, name: "An-Nas", arabic: "الناس", page: 604, juz: [30], revelation: "Makkiyah", verses: 6 }
];

const juzInfo = [
    { number: 1, start: 1, end: 21, surahs: [1, 2] },
    { number: 2, start: 22, end: 41, surahs: [2] },
    { number: 3, start: 42, end: 61, surahs: [2, 3] },
    { number: 4, start: 62, end: 81, surahs: [3, 4] },
    { number: 5, start: 82, end: 101, surahs: [4, 5] },
    { number: 6, start: 102, end: 121, surahs: [5, 6] },
    { number: 7, start: 122, end: 141, surahs: [6, 7] },
    { number: 8, start: 142, end: 161, surahs: [7, 8] },
    { number: 9, start: 162, end: 181, surahs: [8, 9] },
    { number: 10, start: 182, end: 201, surahs: [9] },
    { number: 11, start: 202, end: 221, surahs: [9, 10, 11] },
    { number: 12, start: 222, end: 241, surahs: [11, 12] },
    { number: 13, start: 242, end: 261, surahs: [12, 13, 14] },
    { number: 14, start: 262, end: 281, surahs: [15, 16] },
    { number: 15, start: 282, end: 301, surahs: [17, 18] },
    { number: 16, start: 302, end: 321, surahs: [18, 19, 20] },
    { number: 17, start: 322, end: 341, surahs: [21, 22] },
    { number: 18, start: 342, end: 361, surahs: [23, 24, 25] },
    { number: 19, start: 362, end: 381, surahs: [25, 26, 27] },
    { number: 20, start: 382, end: 401, surahs: [27, 28, 29] },
    { number: 21, start: 402, end: 421, surahs: [29, 30, 31, 32] },
    { number: 22, start: 422, end: 441, surahs: [33, 34, 35, 36] },
    { number: 23, start: 442, end: 461, surahs: [36, 37, 38, 39] },
    { number: 24, start: 462, end: 481, surahs: [40, 41] },
    { number: 25, start: 482, end: 501, surahs: [41, 42, 43, 44, 45] },
    { number: 26, start: 502, end: 521, surahs: [46, 47, 48, 49, 50, 51] },
    { number: 27, start: 522, end: 541, surahs: [51, 52, 53, 54, 55, 56, 57] },
    { number: 28, start: 542, end: 561, surahs: [58, 59, 60, 61, 62, 63, 64, 65, 66] },
    { number: 29, start: 562, end: 581, surahs: [67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77] },
    { number: 30, start: 582, end: 604, surahs: [78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114] }
];
