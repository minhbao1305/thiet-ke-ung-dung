/**
 * Weather Planner - Application Logic & State Management
 * Kiến trúc mã nguồn Module hóa (Modular Architecture):
 * 1. Data Repository & Constant Configuration
 * 2. Storage Module (saveStorage, loadStorage, saveAppState, loadAppState)
 * 3. UI Rendering Module (renderUI, renderWeather, renderItinerary, populateCitySelect)
 * 4. Business Logic & Action Handlers (Add, Toggle Visited, Delete, City Switch)
 * 5. Event Listeners & Bootstrapping
 * 
 * Tuân thủ quy tắc skill.md:
 * - Quy tắc 1: Tìm kiếm, lọc trạng thái, sắp xếp tiêu đề, phân trang (10, 20, 50, all)
 * - Quy tắc 2 & 7: JavaScript thuần, tách file external
 * - Quy tắc 3: Hiệu ứng Glassmorphism tinh tế
 */

// ===================================================================
// MODULE 1: CONFIGURATION & DATA REPOSITORIES
// ===================================================================

/**
 * Các khóa lưu trữ trong LocalStorage (Tách biệt độc lập)
 */
const STORAGE_KEYS = {
  ITINERARY: "wp_itinerary",
  LAST_CITY: "wp_last_city",
  DEPARTURE_DATE: "wp_departure_date"
};

/**
 * Biến lưu tham chiếu vòng lặp đếm ngược setInterval
 */
let countdownIntervalId = null;

/**
 * Dữ liệu thời tiết của 3 thành phố (Biên Hòa, Đà Lạt, Vũng Tàu)
 */
const CITIES_WEATHER = [
  {
    id: "bien-hoa",
    name: "Biên Hòa",
    fullName: "Biên Hòa, Đồng Nai",
    temp: 33,
    feelsLike: 36,
    condition: "Nắng ráo",
    conditionType: "sunny",
    humidity: 65,
    wind: "12 km/h",
    uv: "8 (Rất cao)",
    advice: "Thời tiết nắng nóng nhiệt độ 33°C, thuận lợi tham quan KDL Bửu Long và dạo mát ven sông Đồng Nai, nên mang nón và che chắn cẩn thận.",
    forecast: [
      { day: "Hôm nay", temp: "33°C", icon: "sunny" },
      { day: "Ngày mai", temp: "34°C", icon: "sunny" },
      { day: "Ngày kia", temp: "32°C", icon: "cloudy" }
    ]
  },
  {
    id: "da-lat",
    name: "Đà Lạt",
    fullName: "Đà Lạt, Lâm Đồng",
    temp: 18,
    feelsLike: 17,
    condition: "Mưa phùn & Se lạnh",
    conditionType: "rainy",
    humidity: 92,
    wind: "8 km/h",
    uv: "3 (Thấp)",
    advice: "Không khí vùng cao 18°C kèm mưa phùn sương mù lãng mạn. Rất thích hợp nhâm nhi cà phê ngắm đồi thông, nên mang áo khoác ấm và ô che.",
    forecast: [
      { day: "Hôm nay", temp: "18°C", icon: "rainy" },
      { day: "Ngày mai", temp: "19°C", icon: "cloudy" },
      { day: "Ngày kia", temp: "21°C", icon: "sunny" }
    ]
  },
  {
    id: "vung-tau",
    name: "Vũng Tàu",
    fullName: "Vũng Tàu, Bà Rịa - Vũng Tàu",
    temp: 30,
    feelsLike: 33,
    condition: "Nắng & Gió biển",
    conditionType: "sunny",
    humidity: 75,
    wind: "20 km/h",
    uv: "7 (Cao)",
    advice: "Biển êm, trời nắng đẹp 30°C cùng gió biển trong lành. Rất lý tưởng để tắm biển Bãi Sau, ngắm hoàng hôn Bãi Trước và check-in Mũi Nghinh Phong.",
    forecast: [
      { day: "Hôm nay", temp: "30°C", icon: "sunny" },
      { day: "Ngày mai", temp: "30°C", icon: "sunny" },
      { day: "Ngày kia", temp: "29°C", icon: "cloudy" }
    ]
  }
];

/**
 * Biểu tượng thời tiết SVG vector
 */
const SVG_ICONS = {
  sunny: `<svg viewBox="0 0 64 64" fill="none" class="weather-illustration"><circle cx="32" cy="32" r="14" fill="#FBBF24"/><path d="M32 6V12M32 52V58M6 32H12M52 32H58M13.6 13.6L17.8 17.8M46.2 46.2L50.4 50.4M13.6 50.4L17.8 46.2M46.2 17.8L50.4 13.6" stroke="#F59E0B" stroke-width="4" stroke-linecap="round"/></svg>`,
  rainy: `<svg viewBox="0 0 64 64" fill="none" class="weather-illustration"><path d="M46 36C49.3 36 52 33.3 52 30C52 27.2 50.1 24.8 47.4 24.2C46.8 17.3 41 12 34 12C28.2 12 23.3 15.6 21.4 20.8C20.9 20.7 20.5 20.6 20 20.6C15.6 20.6 12 24.2 12 28.6C12 32.7 15.1 36 19.2 36H46Z" fill="#94A3B8"/><path d="M22 42L18 52M32 42L28 52M42 42L38 52" stroke="#38BDF8" stroke-width="3.5" stroke-linecap="round"/></svg>`,
  cloudy: `<svg viewBox="0 0 64 64" fill="none" class="weather-illustration"><path d="M48 40C51.3 40 54 37.3 54 34C54 31 51.9 28.5 49 28.1C48.4 20.3 41.8 14 34 14C27.5 14 22 18.2 19.9 24C19.3 23.9 18.7 23.8 18 23.8C13 23.8 9 27.8 9 32.8C9 37.4 12.5 41.2 17 41.8H48Z" fill="#CBD5E1"/><circle cx="24" cy="20" r="8" fill="#FBBF24" opacity="0.8"/></svg>`
};

/**
 * Trạng thái trung tâm của ứng dụng (Application State)
 */
const state = {
  currentCityId: "da-lat", // Sẽ được khôi phục từ LocalStorage
  departureDate: null,     // Sẽ được khôi phục từ LocalStorage
  searchTerm: "",
  selectedStatus: "all",   // 'all', 'pending', 'visited'
  sortOrder: "asc",        // 'asc' or 'desc' by Title
  pageSize: 10,            // 10, 20, 50, or 'all'
  currentPage: 1,
  justAddedId: null        // ID mục vừa thêm để kích hoạt CSS animation
};

/**
 * Danh sách lịch trình trong bộ nhớ (được nạp từ LocalStorage)
 */
let ITINERARY_LIST = [];

// ===================================================================
// MODULE 2: STORAGE MODULE (saveStorage & loadStorage)
// ===================================================================

/**
 * Lưu dữ liệu bất kỳ vào LocalStorage theo key
 * @param {string} key 
 * @param {*} data 
 * @returns {boolean}
 */
function saveStorage(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error(`[LocalStorage] Lỗi khi lưu dữ liệu "${key}":`, error);
    return false;
  }
}

/**
 * Đọc dữ liệu từ LocalStorage theo key kèm giá trị mặc định
 * @param {string} key 
 * @param {*} fallback 
 * @returns {*}
 */
function loadStorage(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null || raw === undefined) {
      return fallback;
    }
    return JSON.parse(raw);
  } catch (error) {
    console.error(`[LocalStorage] Lỗi khi đọc dữ liệu "${key}":`, error);
    return fallback;
  }
}

/**
 * Khôi phục toàn bộ trạng thái ứng dụng từ LocalStorage
 */
function loadAppState() {
  // 1. Tự động hiển thị lại thành phố đã chọn cuối cùng (mặc định Đà Lạt)
  const savedCity = loadStorage(STORAGE_KEYS.LAST_CITY, "da-lat");
  const isValidCity = CITIES_WEATHER.some(c => c.id === savedCity);
  state.currentCityId = isValidCity ? savedCity : "da-lat";

  // 2. Khôi phục danh sách lịch trình đã lưu (lần đầu khởi tạo trống theo lựa chọn A1)
  const savedItinerary = loadStorage(STORAGE_KEYS.ITINERARY, []);
  ITINERARY_LIST = Array.isArray(savedItinerary) ? savedItinerary : [];

  // 3. Khôi phục ngày khởi hành đã lưu trong LocalStorage
  state.departureDate = loadStorage(STORAGE_KEYS.DEPARTURE_DATE, null);
}

/**
 * Lưu đồng bộ danh sách lịch trình vào LocalStorage
 */
function persistItineraryList() {
  saveStorage(STORAGE_KEYS.ITINERARY, ITINERARY_LIST);
}

/**
 * Lưu thành phố vừa chọn vào LocalStorage
 */
function persistSelectedCity(cityId) {
  saveStorage(STORAGE_KEYS.LAST_CITY, cityId);
}

// ===================================================================
// MODULE 3: UTILITIES & PROCESSING
// ===================================================================

/**
 * Chuẩn hóa chuỗi tiếng Việt không dấu để tìm kiếm thông minh
 */
function normalizeVietnamese(str) {
  if (!str) return "";
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();
}

/**
 * Lọc và sắp xếp danh sách lịch trình (Tuân thủ Quy tắc 1)
 */
function getProcessedItinerary() {
  const normSearch = normalizeVietnamese(state.searchTerm);

  // 1. Lọc theo từ khóa tìm kiếm & trạng thái
  let result = ITINERARY_LIST.filter(item => {
    const normTitle = normalizeVietnamese(item.title);
    const matchesSearch = !normSearch || normTitle.includes(normSearch);

    let matchesStatus = true;
    if (state.selectedStatus === "pending") {
      matchesStatus = !item.visited;
    } else if (state.selectedStatus === "visited") {
      matchesStatus = item.visited;
    }

    return matchesSearch && matchesStatus;
  });

  // 2. Sắp xếp trên tiêu đề (A-Z / Z-A)
  result.sort((a, b) => {
    const comp = a.title.localeCompare(b.title, "vi");
    return state.sortOrder === "asc" ? comp : -comp;
  });

  return result;
}

// ===================================================================
// MODULE 4: UI RENDERING (renderUI, renderWeather, renderItinerary, populateCitySelect)
// ===================================================================

/**
 * Hàm điều phối toàn bộ việc hiển thị giao diện (renderUI)
 */
function renderUI() {
  populateCitySelect();
  renderWeather(state.currentCityId, false);
  renderItinerary();
  initDepartureCountdown();
}

/**
 * Khởi tạo & đồng bộ options cho các ô <select> thành phố
 */
function populateCitySelect() {
  const optionsHtml = CITIES_WEATHER.map(city => `
    <option value="${city.id}" ${city.id === state.currentCityId ? "selected" : ""}>
      📍 ${city.name} (${city.fullName.split(", ")[1] || ""})
    </option>
  `).join("");

  const heroSelect = document.getElementById("cityWeatherSelect");
  if (heroSelect) {
    heroSelect.innerHTML = optionsHtml;
  }

  const headerSelect = document.getElementById("headerCitySelect");
  if (headerSelect) {
    headerSelect.innerHTML = CITIES_WEATHER.map(city => `
      <option value="${city.id}" ${city.id === state.currentCityId ? "selected" : ""}>
        📍 ${city.name}
      </option>
    `).join("");
  }
}

/**
 * Cập nhật thông tin thời tiết ở cột bên trái không cần tải lại trang
 */
function renderWeather(cityId = state.currentCityId, withTransition = false) {
  const data = CITIES_WEATHER.find(c => c.id === cityId) || CITIES_WEATHER[0];
  state.currentCityId = data.id;

  // Tự động lưu thành phố vừa chọn vào LocalStorage
  persistSelectedCity(data.id);

  const dynamicWrap = document.getElementById("weatherDynamicContent");

  const executeUpdate = () => {
    // 1. Tên địa phương & Ngày
    const cityEl = document.getElementById("weatherCityName");
    const dateEl = document.getElementById("weatherCurrentDate");
    if (cityEl) cityEl.textContent = data.fullName;
    if (dateEl) {
      const now = new Date();
      const options = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
      dateEl.textContent = now.toLocaleDateString("vi-VN", options);
    }

    // 2. Tình trạng thời tiết (Nắng/Mưa/Mây)
    const conditionPillEl = document.getElementById("weatherConditionPill");
    if (conditionPillEl) {
      conditionPillEl.className = `condition-pill ${data.conditionType}`;
      conditionPillEl.innerHTML = `
        <span>●</span>
        <span>${data.condition}</span>
      `;
    }

    // 3. Nhiệt độ & Hình vector
    const tempNumberEl = document.getElementById("tempNumber");
    const illustrationEl = document.getElementById("weatherIllustrationWrap");
    if (tempNumberEl) tempNumberEl.textContent = data.temp;
    if (illustrationEl) illustrationEl.innerHTML = SVG_ICONS[data.conditionType] || SVG_ICONS.sunny;

    // 4. Các thông số phụ (Độ ẩm, Gió, UV, Cảm nhận)
    const humidityValEl = document.getElementById("humidityVal");
    const windValEl = document.getElementById("windVal");
    const uvValEl = document.getElementById("uvVal");
    const feelsLikeValEl = document.getElementById("feelsLikeVal");
    if (humidityValEl) humidityValEl.textContent = `${data.humidity}%`;
    if (windValEl) windValEl.textContent = data.wind;
    if (uvValEl) uvValEl.textContent = data.uv;
    if (feelsLikeValEl) feelsLikeValEl.textContent = `${data.feelsLike}°C`;

    // 5. Gợi ý hành trình
    const adviceTextEl = document.getElementById("weatherAdviceText");
    if (adviceTextEl) adviceTextEl.textContent = data.advice;

    // 6. Dự báo 3 ngày tới
    const forecastRowEl = document.getElementById("forecastRow");
    if (forecastRowEl && data.forecast) {
      forecastRowEl.innerHTML = data.forecast.map(item => `
        <div class="forecast-col">
          <span class="forecast-day">${item.day}</span>
          <div class="forecast-icon">
            ${item.icon === "sunny" ? "☀️" : item.icon === "rainy" ? "🌧️" : "⛅"}
          </div>
          <span class="forecast-temp">${item.temp}</span>
        </div>
      `).join("");
    }

    // 7. Đồng bộ ô select
    const heroSelect = document.getElementById("cityWeatherSelect");
    if (heroSelect && heroSelect.value !== data.id) {
      heroSelect.value = data.id;
    }
    const headerSelect = document.getElementById("headerCitySelect");
    if (headerSelect && headerSelect.value !== data.id) {
      headerSelect.value = data.id;
    }

    // 8. Cập nhật gợi ý trang phục theo nhiệt độ thành phố được chọn
    renderOutfitAdvisor(data.temp);
  };

  if (withTransition && dynamicWrap) {
    dynamicWrap.classList.add("weather-fading");
    setTimeout(() => {
      executeUpdate();
      dynamicWrap.classList.remove("weather-fading");
      showGlassToast(`Thời tiết ${data.name}: ${data.temp}°C (${data.condition}) • Đã lưu lựa chọn`);
    }, 150);
  } else {
    executeUpdate();
  }
}

/**
 * Phân tích và trả về cấu trúc gợi ý trang phục theo ngưỡng nhiệt độ
 * Phân loại 3 mức: < 20°C, 20°C - 30°C, > 30°C
 */
function getOutfitSuggestion(temp) {
  if (temp < 20) {
    return {
      emoji: "🧥",
      badge: "Trời Lạnh",
      themeClass: "outfit-cold",
      text: "Nhiệt độ dưới 20°C: Nên mang theo áo khoác dày, khăn ấm và giữ ấm cơ thể khi di chuyển ngoài trời."
    };
  } else if (temp <= 30) {
    return {
      emoji: "👕",
      badge: "Mát Mẻ",
      themeClass: "outfit-moderate",
      text: "Nhiệt độ 20°C - 30°C dễ chịu: Nên mặc trang phục thoáng mát, mang theo áo khoác mỏng nhẹ và kính râm."
    };
  } else {
    return {
      emoji: "🧢",
      badge: "Nắng Nóng",
      themeClass: "outfit-hot",
      text: "Nhiệt độ trên 30°C: Nên mang theo kem chống nắng và mũ rộng vành, kính râm và bổ sung đủ nước."
    };
  }
}

/**
 * Hiển thị dòng gợi ý trang phục lên Thẻ Kính Mờ Outfit Advisor Card
 */
function renderOutfitAdvisor(temp) {
  const outfit = getOutfitSuggestion(temp);
  const cardEl = document.getElementById("outfitAdvisorCard");
  const iconWrapEl = document.getElementById("outfitIconWrap");
  const badgeEl = document.getElementById("outfitTempBadge");
  const textEl = document.getElementById("outfitSuggestionText");

  if (cardEl) {
    cardEl.className = `glass-card outfit-card ${outfit.themeClass}`;
  }
  if (iconWrapEl) {
    iconWrapEl.innerHTML = `<span class="outfit-emoji">${outfit.emoji}</span>`;
  }
  if (badgeEl) {
    badgeEl.textContent = `${temp}°C • ${outfit.badge}`;
  }
  if (textEl) {
    textEl.textContent = outfit.text;
  }
}

// ===================================================================
// MODULE: DEPARTURE COUNTDOWN TIMER (setInterval & LocalStorage)
// ===================================================================

/**
 * Khởi tạo Đồng hồ đếm ngược ngày khởi hành
 */
function initDepartureCountdown() {
  const dateInput = document.getElementById("departureDateInput");
  if (!dateInput) return;

  // Giới hạn ngày nhỏ nhất là hôm nay
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  dateInput.min = `${yyyy}-${mm}-${dd}`;

  // Nếu trong LocalStorage chưa có ngày khởi hành, đặt mặc định 5 ngày tới
  if (!state.departureDate) {
    const future = new Date();
    future.setDate(future.getDate() + 5);
    const fY = future.getFullYear();
    const fM = String(future.getMonth() + 1).padStart(2, "0");
    const fD = String(future.getDate()).padStart(2, "0");
    state.departureDate = `${fY}-${fM}-${fD}`;
    saveStorage(STORAGE_KEYS.DEPARTURE_DATE, state.departureDate);
  }

  // Gán giá trị vào ô input date
  dateInput.value = state.departureDate;

  // Kích hoạt đồng hồ đếm ngược với setInterval
  startCountdownTimer();
}

/**
 * Kích hoạt vòng lặp setInterval đếm ngược thời gian thực (1 giây/lần)
 */
function startCountdownTimer() {
  // Hủy vòng lặp cũ nếu đang chạy
  if (countdownIntervalId) {
    clearInterval(countdownIntervalId);
  }

  // Cập nhật giao diện ngay lập tức
  updateCountdownDisplay();

  // Sử dụng setInterval để cập nhật liên tục mỗi giây
  countdownIntervalId = setInterval(updateCountdownDisplay, 1000);
}

/**
 * Tính toán chênh lệch thời gian và cập nhật dòng:
 * "Còn ... ngày ... giờ ... phút nữa là đến ngày đi"
 */
function updateCountdownDisplay() {
  const daysEl = document.getElementById("countDays");
  const hoursEl = document.getElementById("countHours");
  const minutesEl = document.getElementById("countMinutes");
  const secondsEl = document.getElementById("countSeconds");
  const summaryTextEl = document.getElementById("countdownTextSummary");
  const badgeEl = document.getElementById("countdownStatusBadge");

  if (!state.departureDate) {
    if (daysEl) daysEl.textContent = "--";
    if (hoursEl) hoursEl.textContent = "--";
    if (minutesEl) minutesEl.textContent = "--";
    if (secondsEl) secondsEl.textContent = "--";
    if (summaryTextEl) summaryTextEl.textContent = "Vui lòng chọn ngày khởi hành để bắt đầu đếm ngược!";
    if (badgeEl) badgeEl.textContent = "Chưa chọn ngày";
    return;
  }

  // Tính toán thời điểm đích: 00:00:00 của ngày khởi hành
  const targetDate = new Date(`${state.departureDate}T00:00:00`);
  const targetTime = targetDate.getTime();
  const currentTime = new Date().getTime();
  const diffMs = targetTime - currentTime;

  // Xử lý khi ngày đến hoặc đã qua
  if (diffMs <= 0) {
    if (daysEl) daysEl.textContent = "0";
    if (hoursEl) hoursEl.textContent = "00";
    if (minutesEl) minutesEl.textContent = "00";
    if (secondsEl) secondsEl.textContent = "00";

    // Nếu trong vòng 24h của ngày hôm nay
    if (diffMs > -86400000) {
      if (badgeEl) badgeEl.textContent = "🎉 Hôm nay khởi hành!";
      if (summaryTextEl) {
        summaryTextEl.innerHTML = "🎉 <strong>Hôm nay là ngày khởi hành của bạn!</strong> Chúc bạn có một hành trình đầy ắp niềm vui và an toàn!";
      }
    } else {
      if (badgeEl) badgeEl.textContent = "⚠️ Đã qua ngày đi";
      if (summaryTextEl) {
        summaryTextEl.innerHTML = "⚠️ Ngày khởi hành này đã trôi qua trong quá khứ. Hãy chọn một ngày trong tương lai!";
      }
    }
    return;
  }

  // Quy đổi chênh lệch sang Ngày, Giờ, Phút, Giây
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diffMs / (1000 * 60)) % 60);
  const seconds = Math.floor((diffMs / 1000) % 60);

  // Cập nhật 4 ô số
  if (daysEl) daysEl.textContent = days;
  if (hoursEl) hoursEl.textContent = String(hours).padStart(2, "0");
  if (minutesEl) minutesEl.textContent = String(minutes).padStart(2, "0");
  if (secondsEl) secondsEl.textContent = String(seconds).padStart(2, "0");

  // Cập nhật badge trạng thái
  if (badgeEl) badgeEl.textContent = `Còn ${days} ngày nữa`;

  // Hiển thị chuẩn theo yêu cầu:
  // "Còn ... ngày ... giờ ... phút nữa là đến ngày đi"
  if (summaryTextEl) {
    summaryTextEl.innerHTML = `Còn <strong>${days}</strong> ngày <strong>${hours}</strong> giờ <strong>${minutes}</strong> phút <strong>${seconds}</strong> giây nữa là đến ngày đi.`;
  }
}

/**
 * Xử lý khi người dùng chọn ngày khởi hành mới
 */
function handleDepartureDateChange(newDateStr) {
  if (!newDateStr) return;

  state.departureDate = newDateStr;

  // Tự động lưu vào LocalStorage theo lựa chọn A2
  saveStorage(STORAGE_KEYS.DEPARTURE_DATE, newDateStr);

  // Khởi động lại đồng hồ đếm ngược với ngày mới
  startCountdownTimer();

  showGlassToast(`Đã lưu ngày khởi hành: ${newDateStr} • Đang đếm ngược!`);
}

/**
 * Hiển thị danh sách lịch trình kèm tìm kiếm, lọc, sắp xếp tiêu đề & phân trang (Quy tắc 1)
 */
function renderItinerary() {
  const processed = getProcessedItinerary();
  const totalCount = processed.length;
  const listEl = document.getElementById("destinationsList");
  const totalBadgeEl = document.getElementById("totalCountBadge");
  const paginationContainer = document.getElementById("paginationContainer");
  const paginationInfoEl = document.getElementById("paginationInfo");
  const paginationActionsEl = document.getElementById("paginationActions");

  if (totalBadgeEl) {
    totalBadgeEl.textContent = `${totalCount} địa điểm`;
  }

  // Xử lý trạng thái rỗng
  if (totalCount === 0) {
    if (listEl) {
      const isFiltered = state.searchTerm || state.selectedStatus !== "all";
      listEl.innerHTML = `
        <div class="empty-state">
          <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            <line x1="8" y1="11" x2="14" y2="11"></line>
          </svg>
          <p>${isFiltered 
            ? 'Không tìm thấy mục lịch trình nào khớp với bộ lọc/từ khóa.' 
            : 'Chưa có lịch trình du lịch nào được lưu trong bộ nhớ.'}
          </p>
          <small>Hãy nhập <strong>Tên địa điểm</strong> & <strong>Thời gian</strong> ở phía trên và bấm <strong>Thêm</strong> để bắt đầu!</small>
        </div>
      `;
    }
    if (paginationContainer) paginationContainer.style.display = "none";
    return;
  }

  if (paginationContainer) paginationContainer.style.display = "flex";

  // Phân trang (Tùy chọn: 10, 20, 50, all - Tuân thủ Quy tắc 1)
  const isAll = state.pageSize === "all";
  const limit = isAll ? totalCount : parseInt(state.pageSize, 10);
  const totalPages = isAll ? 1 : Math.max(1, Math.ceil(totalCount / limit));

  if (state.currentPage > totalPages) state.currentPage = totalPages;
  if (state.currentPage < 1) state.currentPage = 1;

  const startIndex = isAll ? 0 : (state.currentPage - 1) * limit;
  const endIndex = isAll ? totalCount : Math.min(startIndex + limit, totalCount);
  const visibleItems = processed.slice(startIndex, endIndex);

  // Render danh sách thẻ lịch trình
  if (listEl) {
    listEl.innerHTML = visibleItems.map(item => {
      const isNew = item.id === state.justAddedId;
      const visitedClass = item.visited ? "item-visited" : "";
      const animClass = isNew ? "new-item-entering" : "";

      return `
        <article class="dest-card ${visitedClass} ${animClass}" data-id="${item.id}">
          <div class="dest-left">
            <div class="dest-avatar">${item.icon || "📍"}</div>
            <div class="dest-info">
              <h3 class="dest-title">
                ${item.title}
              </h3>
              <p class="dest-desc">${item.note || "Kế hoạch hành trình tham quan"}</p>
              <div class="dest-tags">
                <span class="time-badge">⏰ ${item.time}</span>
                ${item.visited 
                  ? `<span class="tag-badge tag-nature">✓ Đã đến</span>` 
                  : `<span class="tag-badge" style="background: rgba(255,255,255,0.08); color: var(--text-secondary);">⏳ Chưa đến</span>`
                }
              </div>
            </div>
          </div>

          <div class="dest-right">
            <div class="itinerary-actions">
              <!-- Nút 'Đã đến' (đổi màu thẻ) -->
              <button 
                type="button" 
                class="btn-status-toggle ${item.visited ? 'is-visited' : ''}" 
                data-action="toggle-visited" 
                data-id="${item.id}"
                title="${item.visited ? 'Bấm để đánh dấu chưa đến' : 'Bấm để đánh dấu đã đến'}"
              >
                ${item.visited ? "✓ Đã đến" : "Đánh dấu đã đến"}
              </button>

              <!-- Nút 'Xóa' -->
              <button 
                type="button" 
                class="btn-delete-item" 
                data-action="delete-item" 
                data-id="${item.id}"
                title="Xóa mục này khỏi lịch trình"
              >
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
                <span>Xóa</span>
              </button>
            </div>
          </div>
        </article>
      `;
    }).join("");

    // Reset cờ mục vừa thêm sau animation
    if (state.justAddedId) {
      setTimeout(() => {
        state.justAddedId = null;
      }, 1600);
    }
  }

  // Cập nhật thông tin phân trang
  if (paginationInfoEl) {
    const from = totalCount === 0 ? 0 : startIndex + 1;
    paginationInfoEl.innerHTML = `Hiển thị <strong>${from} - ${endIndex}</strong> trên tổng số <strong>${totalCount}</strong> địa điểm`;
  }

  // Cập nhật các nút phân trang
  if (paginationActionsEl) {
    if (isAll || totalPages <= 1) {
      paginationActionsEl.innerHTML = `
        <button class="page-btn active" disabled>Trang 1 / 1</button>
      `;
    } else {
      let buttonsHtml = "";

      // Nút Trước
      buttonsHtml += `
        <button class="page-btn" id="prevPageBtn" ${state.currentPage === 1 ? "disabled" : ""} title="Trang trước">
          ‹
        </button>
      `;

      // Các nút trang
      for (let p = 1; p <= totalPages; p++) {
        const isActive = p === state.currentPage ? "active" : "";
        buttonsHtml += `
          <button class="page-btn ${isActive}" data-page="${p}">${p}</button>
        `;
      }

      // Nút Sau
      buttonsHtml += `
        <button class="page-btn" id="nextPageBtn" ${state.currentPage === totalPages ? "disabled" : ""} title="Trang kế tiếp">
          ›
        </button>
      `;

      paginationActionsEl.innerHTML = buttonsHtml;
    }
  }
}

// ===================================================================
// MODULE 5: BUSINESS LOGIC ACTIONS (Add, Toggle, Delete)
// ===================================================================

/**
 * Thêm mục lịch trình mới vào danh sách và lưu LocalStorage
 */
function handleAddItinerary(place, time) {
  const newId = Date.now();
  const newItem = {
    id: newId,
    title: place,
    time: time,
    visited: false,
    icon: "📍",
    note: `Lên lịch trình lúc ${new Date().toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })}`
  };

  ITINERARY_LIST.unshift(newItem);
  state.justAddedId = newId;
  state.currentPage = 1;

  // Lưu vào LocalStorage
  persistItineraryList();

  // Render lại UI
  renderItinerary();
  showGlassToast(`Đã thêm & lưu: "${newItem.title} - ${newItem.time}" vào LocalStorage!`);
}

/**
 * Đổi trạng thái 'Đã đến' (đổi màu thẻ) và cập nhật LocalStorage
 */
function handleToggleVisited(itemId) {
  const targetItem = ITINERARY_LIST.find(i => i.id === itemId);
  if (!targetItem) return;

  targetItem.visited = !targetItem.visited;

  // Cập nhật LocalStorage
  persistItineraryList();

  // Render lại UI
  renderItinerary();

  if (targetItem.visited) {
    showGlassToast(`✓ Đã lưu trạng thái: "${targetItem.title}" (Đã đến)`);
  } else {
    showGlassToast(`⏳ Đã chuyển "${targetItem.title}" về danh sách chờ đi`);
  }
}

/**
 * Xóa mục lịch trình khỏi danh sách với animation và cập nhật LocalStorage
 */
function handleDeleteItinerary(itemId, cardElement) {
  const targetItem = ITINERARY_LIST.find(i => i.id === itemId);
  const title = targetItem ? targetItem.title : "Địa điểm";

  if (cardElement) {
    cardElement.classList.add("item-leaving");
  }

  setTimeout(() => {
    ITINERARY_LIST = ITINERARY_LIST.filter(i => i.id !== itemId);
    // Cập nhật LocalStorage
    persistItineraryList();
    renderItinerary();
    showGlassToast(`🗑️ Đã xóa "${title}" và đồng bộ LocalStorage`);
  }, 280);
}

// ===================================================================
// MODULE 6: EVENT LISTENERS SETUP
// ===================================================================

function setupEventListeners() {
  // 1. Lắng nghe chọn thành phố (Cột trái & Header)
  const heroCitySelect = document.getElementById("cityWeatherSelect");
  if (heroCitySelect) {
    heroCitySelect.addEventListener("change", (e) => {
      renderWeather(e.target.value, true);
    });
  }

  const headerCitySelect = document.getElementById("headerCitySelect");
  if (headerCitySelect) {
    headerCitySelect.addEventListener("change", (e) => {
      renderWeather(e.target.value, true);
    });
  }

  // 2. Submit Form Thêm lịch trình
  const itineraryForm = document.getElementById("itineraryForm");
  const placeInput = document.getElementById("itineraryPlaceInput");
  const timeInput = document.getElementById("itineraryTimeInput");

  if (itineraryForm) {
    itineraryForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const placeVal = placeInput.value.trim();
      const timeVal = timeInput.value.trim();

      if (!placeVal || !timeVal) {
        showGlassToast("⚠️ Vui lòng nhập đầy đủ Tên địa điểm và Thời gian!");
        return;
      }

      handleAddItinerary(placeVal, timeVal);

      // Reset form & focus
      placeInput.value = "";
      timeInput.value = "";
      placeInput.focus();
    });
  }

  // 3. Tìm kiếm theo tiêu đề (Search on Title)
  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      state.searchTerm = e.target.value;
      state.currentPage = 1;
      renderItinerary();
    });
  }

  // 4. Lọc trạng thái (Status Filter: all, pending, visited)
  const statusFilter = document.getElementById("statusFilter");
  if (statusFilter) {
    statusFilter.addEventListener("change", (e) => {
      state.selectedStatus = e.target.value;
      state.currentPage = 1;
      renderItinerary();
    });
  }

  // 5. Sắp xếp trên tiêu đề (Sort on Title: A-Z / Z-A)
  const titleSort = document.getElementById("titleSort");
  if (titleSort) {
    titleSort.addEventListener("change", (e) => {
      state.sortOrder = e.target.value;
      renderItinerary();
    });
  }

  // 6. Số lượng hiển thị mỗi trang (Page Size: 10, 20, 50, all)
  const pageSizeSelect = document.getElementById("pageSizeSelect");
  if (pageSizeSelect) {
    pageSizeSelect.addEventListener("change", (e) => {
      state.pageSize = e.target.value;
      state.currentPage = 1;
      renderItinerary();
    });
  }

  // 7. Click delegation trên từng thẻ lịch trình (Đã đến & Xóa)
  const listEl = document.getElementById("destinationsList");
  if (listEl) {
    listEl.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-action]");
      if (!btn) return;

      const action = btn.dataset.action;
      const itemId = Number(btn.dataset.id);

      if (action === "toggle-visited") {
        handleToggleVisited(itemId);
      } else if (action === "delete-item") {
        const card = btn.closest(".dest-card");
        handleDeleteItinerary(itemId, card);
      }
    });
  }

  // 8. Chuyển trang (Pagination click delegation)
  const paginationActionsEl = document.getElementById("paginationActions");
  if (paginationActionsEl) {
    paginationActionsEl.addEventListener("click", (e) => {
      const target = e.target;
      if (target.id === "prevPageBtn") {
        if (state.currentPage > 1) {
          state.currentPage--;
          renderItinerary();
        }
      } else if (target.id === "nextPageBtn") {
        const processed = getProcessedItinerary();
        const limit = state.pageSize === "all" ? processed.length : parseInt(state.pageSize, 10);
        const totalPages = Math.ceil(processed.length / limit);
        if (state.currentPage < totalPages) {
          state.currentPage++;
          renderItinerary();
        }
      } else if (target.dataset.page) {
        state.currentPage = parseInt(target.dataset.page, 10);
        renderItinerary();
      }
    });
  }

  // 9. Lắng nghe thay đổi ngày khởi hành (Departure Date Picker)
  const departureDateInput = document.getElementById("departureDateInput");
  if (departureDateInput) {
    departureDateInput.addEventListener("change", (e) => {
      handleDepartureDateChange(e.target.value);
    });
  }
}

/**
 * Thông báo Toast phong cách Glassmorphism
 */
function showGlassToast(message) {
  let toast = document.getElementById("glassToast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "glassToast";
    toast.style.position = "fixed";
    toast.style.bottom = "24px";
    toast.style.right = "24px";
    toast.style.background = "rgba(15, 23, 42, 0.92)";
    toast.style.backdropFilter = "blur(16px)";
    toast.style.webkitBackdropFilter = "blur(16px)";
    toast.style.border = "1px solid rgba(255, 255, 255, 0.14)";
    toast.style.boxShadow = "0 8px 24px rgba(0, 0, 0, 0.5)";
    toast.style.color = "#f8fafc";
    toast.style.padding = "10px 18px";
    toast.style.borderRadius = "8px";
    toast.style.fontFamily = "'DM Sans', sans-serif";
    toast.style.fontSize = "0.85rem";
    toast.style.fontWeight = "600";
    toast.style.letterSpacing = "0.01em";
    toast.style.zIndex = "9999";
    toast.style.transition = "all 0.22s cubic-bezier(0.16, 1, 0.3, 1)";
    toast.style.opacity = "0";
    toast.style.transform = "translateY(12px)";
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.style.opacity = "1";
  toast.style.transform = "translateY(0)";

  clearTimeout(window._toastTimeout);
  window._toastTimeout = setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(20px)";
  }, 3200);
}

// ===================================================================
// MODULE 7: BOOTSTRAPPING (Khởi chạy ứng dụng)
// ===================================================================

document.addEventListener("DOMContentLoaded", () => {
  // 1. Tải dữ liệu đã lưu từ LocalStorage (thành phố cuối cùng & danh sách lịch trình)
  loadAppState();

  // 2. Render toàn bộ UI (renderUI)
  renderUI();

  // 3. Đăng ký các bộ lắng nghe sự kiện
  setupEventListeners();
});
