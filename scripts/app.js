// DOM Elements
const menuToggle = document.querySelector('.menu-toggle');
const sidebar = document.querySelector('.sidebar');
const searchInput = document.getElementById('location-search');
const searchBtn = document.getElementById('search-btn');
const cityName = document.getElementById('city-name');
const weatherCondition = document.getElementById('weather-condition');
const temperature = document.getElementById('temperature');
const feelsLike = document.getElementById('feels-like');
const humidity = document.getElementById('humidity');
const wind = document.getElementById('wind');
const visibility = document.getElementById('visibility');
const weatherIcon = document.getElementById('weather-icon');
const lastUpdated = document.getElementById('last-updated');
const aqiValue = document.getElementById('aqi-value');
const statusLevel = document.getElementById('status-level');
const pm25 = document.getElementById('pm25');
const windDirection = document.getElementById('wind-direction');
const aqiLastUpdated = document.getElementById('aqi-last-updated');
const trendList = document.getElementById('trend-list');
const trendLastUpdated = document.getElementById('trend-last-updated');
const bikeSavings = document.getElementById('bike-savings');
const walkSavings = document.getElementById('walk-savings');
const totalSavings = document.getElementById('total-savings');
const carbonLastUpdated = document.getElementById('carbon-last-updated');

// Open-Meteo API configuration
const BASE_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const WEATHER_URL = 'https://api.open-meteo.com/v1/forecast';

// Carbon emission constants (kg CO₂ per km)
const CAR_EMISSIONS = 0.404; // Average car emissions
const BIKE_EMISSIONS = 0.016; // Bike emissions (from food production)
const WALK_EMISSIONS = 0.008; // Walking emissions (from food production)

// Event Listeners
menuToggle.addEventListener('click', () => {
  sidebar.classList.toggle('active');
});

searchBtn.addEventListener('click', handleSearch);
searchInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    handleSearch();
  }
});

// Functions
async function handleSearch() {
  const location = searchInput.value.trim();
  if (!location) {
    showError('Please enter a city name');
    return;
  }

  try {
    setLoading(true);
    // First, get coordinates for the location
    const coords = await getCoordinates(location);
    if (!coords) {
      throw new Error('Location not found');
    }
    
    // Then get weather data using coordinates
    const weatherData = await getWeatherData(coords);
    updateWeatherUI(weatherData, location);
    showError(false);
  } catch (error) {
    console.error('Error fetching weather data:', error);
    showError(error.message || 'Error fetching weather data. Please try again.');
  } finally {
    setLoading(false);
  }
}

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

async function getWeatherData(coords) {
  const response = await fetch(
    `${WEATHER_URL}?latitude=${coords.latitude}&longitude=${coords.longitude}&current=temperature_2m,weather_code,uv_index,relative_humidity_2m,wind_speed_10m,wind_direction_10m,visibility,apparent_temperature,surface_pressure&timezone=auto`
  );
  if (!response.ok) throw new Error('Weather data not found');
  return await response.json();
}

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

function getWeatherIcon(code) {
  const iconMap = {
    0: 'sunny', // Clear sky
    1: 'partly_cloudy_day', // Mainly clear
    2: 'cloudy', // Partly cloudy
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

function getAQICategory(aqi) {
  if (aqi <= 50) return { category: 'Good', color: '#4CAF50', width: '20%' };
  if (aqi <= 100) return { category: 'Moderate', color: '#FFC107', width: '40%' };
  if (aqi <= 150) return { category: 'Unhealthy for Sensitive Groups', color: '#FF9800', width: '60%' };
  if (aqi <= 200) return { category: 'Unhealthy', color: '#F44336', width: '80%' };
  if (aqi <= 300) return { category: 'Very Unhealthy', color: '#9C27B0', width: '90%' };
  return { category: 'Hazardous', color: '#7D0000', width: '100%' };
}

function updateAirQualityUI(data) {
  const current = data.current;
  const timestamp = new Date().toLocaleTimeString();
  
  // Calculate AQI based on PM2.5 (simplified version)
  const pm25Value = current.pm2_5;
  const aqi = Math.round(pm25Value * 2); // Simple conversion for demonstration
  
  // Update AQI display
  aqiValue.textContent = aqi;
  
  // Update status bar
  const aqiCategory = getAQICategory(aqi);
  statusLevel.style.width = aqiCategory.width;
  statusLevel.style.backgroundColor = aqiCategory.color;
  
  // Update PM2.5
  pm25.textContent = `${Math.round(pm25Value)} μg/m³`;
  
  // Update wind direction
  const windSpeed = current.wind_speed_10m;
  const windDir = current.wind_direction_10m;
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(windDir / 45) % 8;
  windDirection.textContent = `${directions[index]} ${Math.round(windSpeed)} km/h`;
  
  // Update last updated time
  aqiLastUpdated.textContent = `Last updated: ${timestamp}`;
}

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
  
  // Find min and max temperatures for scaling
  const minTemp = Math.min(...next6Hours.map(h => h.temp));
  const maxTemp = Math.max(...next6Hours.map(h => h.temp));
  const tempRange = maxTemp - minTemp;
  
  // Clear and update trend list
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

function calculateCarbonSavings() {
  // Simulate some activity data (in a real app, this would come from user input or tracking)
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

function updateWeatherUI(data, location) {
  try {
    const current = data.current;
    const timestamp = new Date().toLocaleTimeString();
    
    // Update city name
    cityName.innerHTML = `
      <span class="material-symbols-rounded">location_on</span>
      <span>${location}</span>
    `;
    
    // Update weather condition and icon
    const weatherCode = current.weather_code;
    weatherCondition.textContent = getWeatherDescription(weatherCode);
    weatherIcon.textContent = getWeatherIcon(weatherCode);
    
    // Update temperature and feels like
    temperature.textContent = `${Math.round(current.temperature_2m)}°C`;
    feelsLike.textContent = `Feels like: ${Math.round(current.apparent_temperature)}°C`;
    
    // Update additional weather details
    humidity.textContent = `${current.relative_humidity_2m}%`;
    wind.textContent = `${current.wind_speed_10m} km/h`;
    visibility.textContent = `${(current.visibility / 1000).toFixed(1)} km`;
    
    // Update last updated time
    lastUpdated.textContent = `Last updated: ${timestamp}`;
    
    // Update air quality
    updateAirQualityUI(data);
    
    // Update temperature trend
    updateTemperatureTrend(data);
    
    // Update carbon savings
    calculateCarbonSavings();
  } catch (error) {
    console.error('Error in updateWeatherUI:', error);
    showError('Failed to update weather information. Please try again.');
  }
}