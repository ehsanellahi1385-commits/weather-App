import "./input.css";

const API_KEY = "2174dd9aac44eed44d1b0f9ec6d42298       ";

const searchForm = document.querySelector("#search-form");
const cityInput = document.querySelector("#city-input");
const errorMessage = document.querySelector("#error-message");

const cityName = document.querySelector("#city-name");
const locationName = document.querySelector("#location-name");
const weatherDescription = document.querySelector("#weather-description");
const temperature = document.querySelector("#temperature");
const temperatureUnit = document.querySelector("#temperature-unit");
const feelsLike = document.querySelector("#feels-like");
const weatherIcon = document.querySelector("#weather-icon");

const humidity = document.querySelector("#humidity");
const windSpeed = document.querySelector("#wind-speed");
const visibility = document.querySelector("#visibility");
const rainChance = document.querySelector("#rain-chance");

const sunrise = document.querySelector("#sunrise");
const sunset = document.querySelector("#sunset");
const cloudCover = document.querySelector("#cloud-cover");
const windDirection = document.querySelector("#wind-direction");

const hourlyForecast = document.querySelector("#hourly-forecast");
const dailyForecast = document.querySelector("#daily-forecast");

const unitToggle = document.querySelector("#unit-toggle");

let currentUnit = "C";
let currentWeather = null;
let currentLocation = null;

function showError(message) {
  errorMessage.textContent = message;
  errorMessage.classList.remove("hidden");
}

function hideError() {
  errorMessage.textContent = "";
  errorMessage.classList.add("hidden");
}

async function getCityCoordinates(city) {
  const url =
    `https://api.openweathermap.org/geo/1.0/direct` +
    `?q=${encodeURIComponent(city)}` +
    `&limit=1` +
    `&appid=${API_KEY}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Failed to search for the city");
  }

  const data = await response.json();

  if (!data.length) {
    throw new Error("City not found");
  }

  return data[0];
}

async function getWeather(lat, lon) {
  const currentUrl =
    `https://api.openweathermap.org/data/2.5/weather` +
    `?lat=${lat}` +
    `&lon=${lon}` +
    `&units=metric` +
    `&appid=${API_KEY}`;

  const forecastUrl =
    `https://api.openweathermap.org/data/2.5/forecast` +
    `?lat=${lat}` +
    `&lon=${lon}` +
    `&units=metric` +
    `&appid=${API_KEY}`;

  const [currentResponse, forecastResponse] = await Promise.all([
    fetch(currentUrl),
    fetch(forecastUrl),
  ]);

  if (!currentResponse.ok || !forecastResponse.ok) {
    throw new Error("Failed to fetch weather data");
  }

  const current = await currentResponse.json();
  const forecast = await forecastResponse.json();

  return {
    current,
    forecast,
  };
}

function convertTemperature(celsius) {
  if (currentUnit === "C") {
    return Math.round(celsius);
  }

  return Math.round((celsius * 9) / 5 + 32);
}

function getWeatherEmoji(icon) {
  const icons = {
    "01d": "☀️",
    "01n": "🌙",
    "02d": "🌤️",
    "02n": "☁️",
    "03d": "☁️",
    "03n": "☁️",
    "04d": "☁️",
    "04n": "☁️",
    "09d": "🌧️",
    "09n": "🌧️",
    "10d": "🌦️",
    "10n": "🌧️",
    "11d": "⛈️",
    "11n": "⛈️",
    "13d": "❄️",
    "13n": "❄️",
    "50d": "🌫️",
    "50n": "🌫️",
  };

  return icons[icon] || "🌤️";
}

function formatVisibility(meters) {
  if (meters >= 10000) {
    return "10+ km";
  }

  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`;
  }

  return `${meters} m`;
}

function formatTime(timestamp, timezoneOffset) {
  const date = new Date((timestamp + timezoneOffset) * 1000);

  return date.toISOString().slice(11, 16);
}

function getWindDirection(degrees) {
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];

  const index = Math.round(degrees / 45) % 8;

  return directions[index];
}

function renderCurrentWeather(weather, location) {
  const current = weather.current;
  const nextForecast = weather.forecast.list[0];

  const rain = Math.round(nextForecast.pop * 100);

  const weatherData = current.weather[0];
  const description = weatherData.description;
  const icon = weatherData.icon;

  cityName.textContent = location.name;

  locationName.textContent = `${location.country || ""}${location.state ? ` · ${location.state}` : ""}`;

  weatherDescription.textContent = description;

  temperature.textContent = convertTemperature(current.main.temp);

  temperatureUnit.textContent = `°${currentUnit}`;

  feelsLike.textContent = `Feels like ${convertTemperature(current.main.feels_like)}°${currentUnit}`;

  weatherIcon.textContent = getWeatherEmoji(icon);

  weatherIcon.setAttribute("aria-label", description);

  humidity.textContent = `${current.main.humidity}%`;

  windSpeed.textContent = `${Math.round(current.wind.speed * 3.6)} km/h`;

  visibility.textContent = formatVisibility(current.visibility);

  rainChance.textContent = `${rain}%`;

  sunrise.textContent = formatTime(current.sys.sunrise, current.timezone);

  sunset.textContent = formatTime(current.sys.sunset, current.timezone);

  cloudCover.textContent = `${current.clouds.all}%`;

  windDirection.textContent = `${getWindDirection(current.wind.deg)} ${current.wind.deg}°`;
}

function renderHourlyForecast(weather) {
  const forecastList = weather.forecast.list;
  const timezoneOffset = weather.current.timezone;

  const hourlyData = forecastList.slice(0, 8);

  hourlyForecast.innerHTML = "";

  hourlyData.forEach((item) => {
    const time = new Date((item.dt + timezoneOffset) * 1000);

    const hour = time.toISOString().slice(11, 16);

    const rain = Math.round(item.pop * 100);

    const card = document.createElement("div");

    card.className =
      "min-w-28 shrink-0 rounded-xl border border-white/10 bg-black/20 p-3 text-center";

    const timeElement = document.createElement("p");

    timeElement.textContent = hour;

    timeElement.className = "text-xs text-white/40";

    card.appendChild(timeElement);

    const iconElement = document.createElement("div");

    iconElement.textContent = getWeatherEmoji(item.weather[0].icon);

    iconElement.className = "mt-2 text-3xl";

    card.appendChild(iconElement);

    const temperatureElement = document.createElement("p");

    temperatureElement.textContent = `${convertTemperature(item.main.temp)}°${currentUnit}`;

    temperatureElement.className = "mt-2 text-lg font-bold";

    card.appendChild(temperatureElement);

    const rainElement = document.createElement("p");

    rainElement.textContent = `${rain}%`;

    rainElement.className = "mt-2 text-xs text-emerald-300";

    card.appendChild(rainElement);

    hourlyForecast.appendChild(card);
  });
}

function renderDailyForecast(weather) {
  const forecastList = weather.forecast.list;
  const timezoneOffset = weather.current.timezone;

  const dailyData = {};

  forecastList.forEach((item) => {
    const date = new Date((item.dt + timezoneOffset) * 1000);

    const day = date.toISOString().slice(0, 10);

    if (!dailyData[day]) {
      dailyData[day] = [];
    }

    dailyData[day].push(item);
  });

  const days = Object.keys(dailyData);

  dailyForecast.innerHTML = "";

  days.forEach((day) => {
    const dayItems = dailyData[day];

    const temperatures = dayItems.map((item) => item.main.temp);

    const minTemp = Math.min(...temperatures);

    const maxTemp = Math.max(...temperatures);

    const middleItem = dayItems[Math.floor(dayItems.length / 2)];

    const icon = getWeatherEmoji(middleItem.weather[0].icon);

    const rainChance = Math.max(...dayItems.map((item) => Math.round(item.pop * 100)));

    const date = new Date(`${day}T00:00:00`);

    const dayName = date.toLocaleDateString("en-US", {
      weekday: "short",
      timeZone: "UTC",
    });

    const card = document.createElement("div");

    card.className =
      "min-w-26 shrink-0 rounded-xl border border-white/10 bg-black/20 p-3 text-center";

    const dayElement = document.createElement("p");

    dayElement.textContent = dayName;

    dayElement.className = "text-sm font-semibold text-white/70";

    card.appendChild(dayElement);

    const iconElement = document.createElement("div");

    iconElement.textContent = icon;

    iconElement.className = "mt-2 text-3xl";

    card.appendChild(iconElement);

    const temperatureElement = document.createElement("p");

    temperatureElement.textContent = `${convertTemperature(maxTemp)}° / ${convertTemperature(minTemp)}°${currentUnit}`;

    temperatureElement.className = "mt-2 text-sm font-bold";

    card.appendChild(temperatureElement);

    const rainElement = document.createElement("p");

    rainElement.textContent = `${rainChance}%`;

    rainElement.className = "mt-1 text-xs text-emerald-300";

    card.appendChild(rainElement);

    dailyForecast.appendChild(card);
  });
}

unitToggle.addEventListener("click", () => {
  currentUnit = currentUnit === "C" ? "F" : "C";

  unitToggle.textContent = `°${currentUnit}`;

  if (currentWeather && currentLocation) {
    renderCurrentWeather(currentWeather, currentLocation);

    renderHourlyForecast(currentWeather);

    renderDailyForecast(currentWeather);
  }
});

searchForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  hideError();

  const city = cityInput.value.trim();

  if (!city) {
    showError("Please enter a city name.");

    return;
  }

  try {
    const location = await getCityCoordinates(city);

    const weather = await getWeather(location.lat, location.lon);

    currentWeather = weather;
    currentLocation = location;

    renderCurrentWeather(weather, location);

    renderHourlyForecast(weather);

    renderDailyForecast(weather);
  } catch (error) {
    console.error(error);

    if (error.message === "City not found") {
      showError("City not found. Please check the city name.");
    } else {
      showError("Something went wrong. Please try again.");
    }
  }
});
