// ===== DOM ELEMENTS =====
// These constants store references to HTML elements that we'll need to update dynamically
const menuToggle = document.querySelector('.menu-toggle'); // Button to toggle the sidebar
const sidebar = document.querySelector('.sidebar'); // The sidebar navigation element
const searchInput = document.getElementById('location-search'); // Input field for city search
const searchBtn = document.getElementById('search-btn'); // Search button
const cityName = document.getElementById('city-name'); // Element to display current city
const weatherCondition = document.getElementById('weather-condition'); // Current weather description
const temperature = document.getElementById('temperature'); // Current temperature
const feelsLike = document.getElementById('feels-like'); // "Feels like" temperature
const humidity = document.getElementById('humidity'); // Humidity percentage
const wind = document.getElementById('wind'); // Wind speed
const visibility = document.getElementById('visibility'); // Visibility distance
const weatherIcon = document.getElementById('weather-icon'); // Weather icon
const lastUpdated = document.getElementById('last-updated'); // Last update timestamp
const aqiValue = document.getElementById('aqi-value'); // Air Quality Index value
const statusLevel = document.getElementById('status-level'); // AQI status bar
const pm25 = document.getElementById('pm25'); // Air quality description
const windDirection = document.getElementById('wind-direction'); // Wind direction and speed
const aqiLastUpdated = document.getElementById('aqi-last-updated'); // AQI last update time
const trendList = document.getElementById('trend-list'); // Temperature trend list
const trendLastUpdated = document.getElementById('trend-last-updated'); // Trend last update time
const bikeSavings = document.getElementById('bike-savings'); // Bike carbon savings
const walkSavings = document.getElementById('walk-savings'); // Walking carbon savings
const totalSavings = document.getElementById('total-savings'); // Total carbon savings
const carbonLastUpdated = document.getElementById('carbon-last-updated'); // Carbon savings last update

// ===== API CONFIGURATION =====
// Base URLs for the Open-Meteo API endpoints
const BASE_URL = 'https://geocoding-api.open-meteo.com/v1/search'; // For location search
const WEATHER_URL = 'https://api.open-meteo.com/v1/forecast'; // For weather data

// ===== CARBON EMISSION CONSTANTS =====
// These values represent CO₂ emissions in kg per kilometer for different transportation methods
const CAR_EMISSIONS = 0.404; // Average car emissions per km
const BIKE_EMISSIONS = 0.016; // Bike emissions (from food production) per km
const WALK_EMISSIONS = 0.008; // Walking emissions (from food production) per km

// ===== EVENT LISTENERS =====
// Toggle sidebar visibility when menu button is clicked
menuToggle.addEventListener('click', () => {
  sidebar.classList.toggle('active');
});

// Handle search when button is clicked or Enter key is pressed
searchBtn.addEventListener('click', handleSearch);
searchInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    handleSearch();
  }
});

// ===== INITIALIZATION =====
// When page loads, try to get user's location for weather data
window.addEventListener('DOMContentLoaded', () => {
  if (navigator.geolocation) {
    // If geolocation is available, get current position
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const coords = {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        name: 'Your Location'
      };
      try {
        // Get and display weather for current location
        const weatherData = await getWeatherData(coords);
        updateWeatherUI(weatherData, coords.name);
      } catch (e) {
        // If weather fetch fails, use default city
        handleSearchFallback();
      }
    }, handleSearchFallback);
  } else {
    // If geolocation is not available, use default city
    handleSearchFallback();
  }
});

// ===== FALLBACK FUNCTION =====
// Use London as default city if location services fail
function handleSearchFallback() {
  getCoordinates('London').then(async coords => {
    const weatherData = await getWeatherData(coords);
    updateWeatherUI(weatherData, coords.name);
  });
}

// ===== SEARCH HANDLING =====
// Main search function that processes user input and updates weather display
async function handleSearch() {
  const location = searchInput.value.trim();
  if (!location) {
    showError('Please enter a city name');
    return;
  }

  try {
    setLoading(true); // Show loading state
    // Get coordinates for the searched location
    const coords = await getCoordinates(location);
    if (!coords) {
      throw new Error('Location not found');
    }
    
    // Get weather data using coordinates
    const weatherData = await getWeatherData(coords);
    updateWeatherUI(weatherData, location);
    showError(false); // Clear any error messages
  } catch (error) {
    console.error('Error fetching weather data:', error);
    showError(error.message || 'Error fetching weather data. Please try again.');
  } finally {
    setLoading(false); // Hide loading state
  }
}

// ===== UI STATE MANAGEMENT =====
// Show/hide loading state
function setLoading(isLoading) {
  const weatherWidget = document.querySelector('.weather-widget');
  if (isLoading) {
    weatherWidget.classList.add('loading');
    searchBtn.disabled = true;
  } else {
    weatherWidget.classList.remove('loading');
    searchBtn.disabled = false;
  }
}

// Display error messages to user
function showError(message) {
  let errorDiv = document.querySelector('.error-message');
  if (!errorDiv) {
    errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    document.querySelector('.weather-widget').prepend(errorDiv);
  }

  if (message) {
    errorDiv.textContent = message;
    errorDiv.classList.add('show');
  } else {
    errorDiv.classList.remove('show');
  }
}

// ===== API INTERACTION =====
// Get coordinates for a location using Open-Meteo geocoding API
async function getCoordinates(location) {
  try {
    const response = await fetch(`${BASE_URL}?name=${encodeURIComponent(location)}&count=1&language=en&format=json`);
    const data = await response.json();
    
    if (!data.results || data.results.length === 0) {
      throw new Error('Location not found. Please try a different city name.');
    }

    const result = data.results[0];
    return {
      latitude: result.latitude,
      longitude: result.longitude,
      name: result.name,
      country: result.country
    };
  } catch (error) {
    console.error('Error in getCoordinates:', error);
    throw new Error('Failed to find location. Please check your internet connection and try again.');
  }
}

// Get weather data from Open-Meteo API
async function getWeatherData(coords) {
  const response = await fetch(
    `${WEATHER_URL}?latitude=${coords.latitude}&longitude=${coords.longitude}&current=temperature_2m,apparent_temperature,weather_code,uv_index,uv_index_clear_sky,relative_humidity_2m,dew_point_2m,precipitation,rain,showers,snowfall,cloud_cover,cloud_cover_low,cloud_cover_mid,cloud_cover_high,wind_speed_10m,wind_gusts_10m,wind_direction_10m,surface_pressure,visibility,is_day,freezing_level_height&hourly=temperature_2m,weather_code,is_day&timezone=auto`
  );
  if (!response.ok) throw new Error('Weather data not found');
  return await response.json();
}

// ===== WEATHER DATA PROCESSING =====
// Convert weather code to human-readable description
function getWeatherDescription(code) {
  const weatherCodes = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Foggy',
    48: 'Depositing rime fog',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Dense drizzle',
    61: 'Slight rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    71: 'Slight snow',
    73: 'Moderate snow',
    75: 'Heavy snow',
    77: 'Snow grains',
    80: 'Slight rain showers',
    81: 'Moderate rain showers',
    82: 'Violent rain showers',
    85: 'Slight snow showers',
    86: 'Heavy snow showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with slight hail',
    99: 'Thunderstorm with heavy hail'
  };
  return weatherCodes[code] || 'Unknown';
}

// Get appropriate weather icon based on weather code and time of day
function getWeatherIcon(code, isDay = true) {
  const iconMap = {
    0: isDay ? 'sunny' : 'clear_night', // Clear sky
    1: isDay ? 'partly_cloudy_day' : 'partly_cloudy_night', // Mainly clear
    2: isDay ? 'partly_cloudy_day' : 'partly_cloudy_night', // Partly cloudy
    3: 'cloudy', // Overcast
    45: 'foggy', // Foggy
    48: 'foggy', // Depositing rime fog
    51: 'rainy', // Light drizzle
    53: 'rainy', // Moderate drizzle
    55: 'rainy', // Dense drizzle
    61: 'rainy', // Slight rain
    63: 'rainy', // Moderate rain
    65: 'rainy', // Heavy rain
    71: 'snowing', // Slight snow
    73: 'snowing', // Moderate snow
    75: 'snowing', // Heavy snow
    77: 'snowing', // Snow grains
    80: 'rainy', // Slight rain showers
    81: 'rainy', // Moderate rain showers
    82: 'rainy', // Violent rain showers
    85: 'snowing', // Slight snow showers
    86: 'snowing', // Heavy snow showers
    95: 'thunderstorm', // Thunderstorm
    96: 'thunderstorm', // Thunderstorm with slight hail
    99: 'thunderstorm' // Thunderstorm with heavy hail
  };
  return iconMap[code] || 'cloud';
}

// ===== AIR QUALITY FUNCTIONS =====
// Get AQI category and styling based on AQI value
function getAQICategory(aqi) {
  if (aqi <= 50) return { category: 'Good', color: '#4CAF50', width: '20%' };
  if (aqi <= 100) return { category: 'Moderate', color: '#FFC107', width: '40%' };
  if (aqi <= 150) return { category: 'Unhealthy for Sensitive Groups', color: '#FF9800', width: '60%' };
  if (aqi <= 200) return { category: 'Unhealthy', color: '#F44336', width: '80%' };
  if (aqi <= 300) return { category: 'Very Unhealthy', color: '#9C27B0', width: '90%' };
  return { category: 'Hazardous', color: '#7D0000', width: '100%' };
}

// Normalize a value to 0-1 range for calculations
function normalizeValue(value, min, max) {
  if (value === undefined || value === null) return 0.5;
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
}

// Calculate Air Quality Index based on various weather factors
function calculateAirQualityIndex(current) {
  try {
    // Base factors that affect air quality
    const factors = {
      windSpeed: normalizeValue(current.wind_speed_10m, 0, 30), // Higher wind speed = better air quality
      humidity: normalizeValue(current.relative_humidity_2m, 0, 100), // Moderate humidity = better air quality
      cloudCover: normalizeValue(current.cloud_cover, 0, 100), // More clouds can trap pollutants
      visibility: normalizeValue(current.visibility / 1000, 0, 10) // Higher visibility = better air quality
    };

    // Weights for different factors in AQI calculation
    const weights = {
      windSpeed: 0.3,
      humidity: 0.2,
      cloudCover: 0.2,
      visibility: 0.3
    };

    // Calculate base AQI (0-100 scale)
    let baseAQI = 0;
    baseAQI += (1 - factors.windSpeed) * weights.windSpeed * 100; // Invert wind speed (higher is better)
    baseAQI += Math.abs(factors.humidity - 0.5) * weights.humidity * 100; // Optimal humidity is around 50%
    baseAQI += factors.cloudCover * weights.cloudCover * 100;
    baseAQI += (1 - factors.visibility) * weights.visibility * 100; // Invert visibility (higher is better)

    // Adjust AQI based on time of day and weather conditions
    const hour = new Date().getHours();
    const isDay = current.is_day === 1;
    const weatherCode = current.weather_code;

    // Time-based adjustments
    let timeMultiplier = 1.0;
    if (isDay) {
      // Higher pollution during peak hours (8-10 AM and 4-7 PM)
      if ((hour >= 8 && hour <= 10) || (hour >= 16 && hour <= 19)) {
        timeMultiplier = 1.2;
      }
    } else {
      // Lower pollution at night
      timeMultiplier = 0.8;
    }

    // Weather condition adjustments
    let weatherMultiplier = 1.0;
    switch (weatherCode) {
      case 0: // Clear sky
        weatherMultiplier = 1.1; // Slightly higher pollution on clear days
        break;
      case 1: // Mainly clear
      case 2: // Partly cloudy
        weatherMultiplier = 1.0;
        break;
      case 3: // Overcast
        weatherMultiplier = 0.9; // Lower pollution due to cloud cover
        break;
      case 45: // Foggy
      case 48: // Depositing rime fog
        weatherMultiplier = 1.3; // Higher pollution due to trapped pollutants
        break;
      case 51: // Light drizzle
      case 53: // Moderate drizzle
      case 55: // Dense drizzle
      case 61: // Slight rain
      case 63: // Moderate rain
      case 65: // Heavy rain
        weatherMultiplier = 0.7; // Lower pollution due to rain
        break;
      case 71: // Slight snow
      case 73: // Moderate snow
      case 75: // Heavy snow
        weatherMultiplier = 0.6; // Even lower pollution due to snow
        break;
      case 95: // Thunderstorm
      case 96: // Thunderstorm with slight hail
      case 99: // Thunderstorm with heavy hail
        weatherMultiplier = 0.8; // Lower pollution due to storm activity
        break;
    }

    // Calculate final AQI (0-500 scale)
    const finalAQI = Math.round(baseAQI * timeMultiplier * weatherMultiplier * 5);

    // Ensure AQI stays within reasonable bounds
    return Math.min(Math.max(finalAQI, 0), 500);
  } catch (error) {
    console.error('Error calculating AQI:', error);
    return 50; // Return a default "Good" AQI value in case of error
  }
}

// Get human-readable air quality description based on AQI value
function getAirQualityDescription(aqi) {
  if (aqi <= 50) return 'Good - Air quality is satisfactory';
  if (aqi <= 100) return 'Moderate - Air quality is acceptable';
  if (aqi <= 150) return 'Unhealthy for Sensitive Groups';
  if (aqi <= 200) return 'Unhealthy - Everyone may begin to experience health effects';
  if (aqi <= 300) return 'Very Unhealthy - Health warnings of emergency conditions';
  return 'Hazardous - Health alert: everyone may experience more serious health effects';
}

// ===== UI UPDATE FUNCTIONS =====
// Update air quality information in the UI
function updateAirQualityUI(data) {
  try {
    const current = data.current;
    const timestamp = new Date().toLocaleTimeString();
    
    // Calculate and display AQI
    const aqi = calculateAirQualityIndex(current);
    aqiValue.textContent = aqi;
    
    // Update AQI status bar
    const aqiCategory = getAQICategory(aqi);
    statusLevel.style.width = aqiCategory.width;
    statusLevel.style.backgroundColor = aqiCategory.color;
    
    // Update air quality description
    pm25.textContent = getAirQualityDescription(aqi);
    
    // Update wind direction and speed
    const windSpeed = current.wind_speed_10m ?? 0;
    const windDir = current.wind_direction_10m ?? 0;
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(windDir / 45) % 8;
    windDirection.textContent = `${directions[index]} ${Math.round(windSpeed)} km/h`;
    
    // Update timestamp
    aqiLastUpdated.textContent = `Last updated: ${timestamp}`;
  } catch (error) {
    console.error('Error updating air quality UI:', error);
    // Set fallback values in case of error
    aqiValue.textContent = 'N/A';
    pm25.textContent = 'Air quality data unavailable';
    windDirection.textContent = 'N/A';
    statusLevel.style.width = '0%';
    statusLevel.style.backgroundColor = '#9E9E9E';
  }
}

// Update temperature trend graph
function updateTemperatureTrend(data) {
  const hourly = data.hourly;
  const currentHour = new Date().getHours();
  const timestamps = hourly.time;
  const temperatures = hourly.temperature_2m;
  
  // Get next 6 hours of data
  const next6Hours = [];
  for (let i = 0; i < 6; i++) {
    const index = (currentHour + i) % 24;
    next6Hours.push({
      time: new Date(timestamps[index]).toLocaleTimeString([], { hour: 'numeric' }),
      temp: temperatures[index]
    });
  }
  
  // Calculate min/max for scaling
  const minTemp = Math.min(...next6Hours.map(h => h.temp));
  const maxTemp = Math.max(...next6Hours.map(h => h.temp));
  const tempRange = maxTemp - minTemp;
  
  // Generate trend graph HTML
  trendList.innerHTML = next6Hours.map(hour => {
    const height = ((hour.temp - minTemp) / tempRange) * 100;
    return `
      <li class="trend-item">
        <span class="trend-time">${hour.time}</span>
        <div class="trend-bar" style="height: ${height}%"></div>
        <span class="trend-value">${Math.round(hour.temp)}°C</span>
      </li>
    `;
  }).join('');
  
  trendLastUpdated.textContent = `Last updated: ${new Date().toLocaleTimeString()}`;
}

// Calculate and display carbon savings
function calculateCarbonSavings() {
  // Simulate activity data (in a real app, this would come from user input or tracking)
  const bikeDistance = 5; // km
  const walkDistance = 2; // km
  
  // Calculate savings
  const bikeSavingsValue = (CAR_EMISSIONS - BIKE_EMISSIONS) * bikeDistance;
  const walkSavingsValue = (CAR_EMISSIONS - WALK_EMISSIONS) * walkDistance;
  const totalSavingsValue = bikeSavingsValue + walkSavingsValue;
  
  // Update UI
  bikeSavings.textContent = `${bikeSavingsValue.toFixed(1)} kg CO₂`;
  walkSavings.textContent = `${walkSavingsValue.toFixed(1)} kg CO₂`;
  totalSavings.textContent = `${totalSavingsValue.toFixed(1)} kg CO₂`;
  
  carbonLastUpdated.textContent = `Last updated: ${new Date().toLocaleTimeString()}`;
}

// Update hourly forecast display
function updateHourlyForecast(data) {
  try {
    const hourly = data.hourly;
    const currentHour = new Date().getHours();
    const hourlyContainer = document.querySelector('.hourly-forecast');
    
    if (!hourlyContainer) {
      console.error('Hourly forecast container not found');
      return;
    }

    // Get next 12 hours of data
    const next12Hours = [];
    for (let i = 0; i < 12; i++) {
      const index = currentHour + i;
      if (index < hourly.time.length) {
        next12Hours.push({
          time: new Date(hourly.time[index]),
          temp: hourly.temperature_2m[index],
          weatherCode: hourly.weather_code[index],
          isDay: hourly.is_day[index]
        });
      }
    }

    // Generate hourly forecast HTML
    const hourlyHTML = next12Hours.map((hour, index) => {
      const time = index === 0 ? 'Now' : hour.time.toLocaleTimeString([], { hour: 'numeric' });
      const icon = getWeatherIcon(hour.weatherCode, hour.isDay);
      
      // Determine temperature category for styling
      let tempCategory = 'cool';
      if (hour.temp >= 25) tempCategory = 'hot';
      else if (hour.temp >= 20) tempCategory = 'warm';
      else if (hour.temp >= 15) tempCategory = 'cool';
      else tempCategory = 'cold';
      
      return `
        <div class="hourly-item" data-temp="${tempCategory}">
          <div class="hourly-time">${time}</div>
          <div class="hourly-icon material-symbols-rounded">${icon}</div>
          <div class="hourly-temp">${Math.round(hour.temp)}°</div>
        </div>
      `;
    }).join('');

    hourlyContainer.innerHTML = hourlyHTML;
  } catch (error) {
    console.error('Error updating hourly forecast:', error);
  }
}

// Main function to update all weather information in the UI
function updateWeatherUI(data, location) {
  try {
    const current = data.current;
    const timestamp = new Date().toLocaleTimeString();
    
    // Update city name with location icon
    cityName.innerHTML = `
      <span class="material-symbols-rounded">location_on</span>
      <span>${location}</span>
    `;
    
    // Update weather condition and icon
    const weatherCode = current.weather_code;
    weatherCondition.textContent = getWeatherDescription(weatherCode);
    weatherIcon.textContent = getWeatherIcon(weatherCode, current.is_day);
    
    // Update temperature information
    temperature.textContent = `${Math.round(current.temperature_2m)}°C`;
    feelsLike.textContent = `Feels like: ${Math.round(current.apparent_temperature)}°C`;
    
    // Update weather details
    humidity.textContent = `${current.relative_humidity_2m}%`;
    wind.textContent = `${current.wind_speed_10m} km/h`;
    visibility.textContent = `${(current.visibility / 1000).toFixed(1)} km`;
    
    // Update timestamps
    lastUpdated.textContent = `Last updated: ${timestamp}`;
    
    // Update all other UI components
    updateAirQualityUI(data);
    updateTemperatureTrend(data);
    updateHourlyForecast(data);
    calculateCarbonSavings();
  } catch (error) {
    console.error('Error in updateWeatherUI:', error);
    showError('Failed to update weather information. Please try again.');
  }
}