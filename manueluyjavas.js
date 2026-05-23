let currentIndex = 0;
let autoPlayTimer;
let isPlaying = true;


        function autoPlay() {
            const track = document.getElementById('filmTrack');
            if (!track) return; // Exit if slider isn't on the current page

            const slides = track.querySelectorAll('.film-slide');
            const totalSlides = slides.length;
            if (totalSlides <= 1) return; // No need to slide if there's only one image
            
            currentIndex++;
            
            if (currentIndex >= totalSlides) {
                currentIndex = 0;
            }
            
            const translateValue = -currentIndex * 100;
            track.style.transform = `translateX(${translateValue}%)`;
            
            if (isPlaying) {
                startAutoPlay();
            }
        }

        function startAutoPlay() {
            clearTimeout(autoPlayTimer); // Clear existing timer to prevent overlapping transitions
            autoPlayTimer = setTimeout(autoPlay, 5000);
        }

        function pauseAutoPlay() {
            isPlaying = false;
            clearTimeout(autoPlayTimer);
        }

        function resumeAutoPlay() {
            isPlaying = true;
            startAutoPlay();
        }

        // Theme Toggle Logic
        function initTheme() {
            const toggleBtn = document.getElementById('themeToggle');
            if (!toggleBtn) return;

            const currentTheme = localStorage.getItem('theme') || 'light';
            document.documentElement.setAttribute('data-theme', currentTheme);
            toggleBtn.textContent = currentTheme === 'dark' ? '☀️' : '🌙';

            toggleBtn.addEventListener('click', () => {
                const theme = document.documentElement.getAttribute('data-theme');
                const newTheme = theme === 'light' ? 'dark' : 'light';
                
                document.documentElement.setAttribute('data-theme', newTheme);
                localStorage.setItem('theme', newTheme);
                toggleBtn.textContent = newTheme === 'dark' ? '☀️' : '🌙';
            });
        }

        // Initialize all features once the DOM is fully loaded
        function init() {
            startAutoPlay();
            initTheme();
            initChatbot();
            loadWeather();
            initVideoControl();
        }

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
        } else {
            init();
        }
    
        // Weather widget (Open-Meteo) - Calatagan, Batangas
        async function loadWeather() {
            const detailsEl = document.getElementById('weatherDetails');
            const statusEl = document.getElementById('weatherStatus');
            const errorEl = document.getElementById('weatherError');

            if (!detailsEl || !statusEl || !errorEl) return; // widget not on this page

            const conditionEl = document.getElementById('weatherConditionText');
            const tempEl = document.getElementById('weatherLargeTemp');
            const iconEl = document.getElementById('weatherLargeIcon');
            const feelsLikeEl = document.getElementById('weatherFeelsLike');
            const humidityEl = document.getElementById('weatherHumidity');
            const windEl = document.getElementById('weatherWind');
            const updatedEl = document.getElementById('weatherUpdated');

            statusEl.textContent = 'Loading weather...';

            try {
                // Approximate coordinates for Calatagan, Batangas
                const lat = 14.03;
                const lon = 120.65;

                // Open-Meteo current weather does not require an API key
                const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,weather_code,relative_humidity_2m,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=Asia%2FManila&forecast_days=3`;

                const res = await fetch(url, { method: 'GET' });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);

                const data = await res.json();
                const current = data && data.current ? data.current : null;
                if (!current) throw new Error('Invalid weather response');

                const temperature = current.temperature_2m;
                const feelsLike = current.apparent_temperature;
                const code = current.weather_code;
                const humidity = current.relative_humidity_2m;
                const wind = current.wind_speed_10m;

                const { text, icon } = getConditionFromCode(code);

                // Update header background based on condition
                const heroEl = document.getElementById('weatherHero');
                if (heroEl) {
                    heroEl.classList.remove('weather-sunny', 'weather-cloudy', 'weather-rainy');
                    if (code <= 1) heroEl.classList.add('weather-sunny');
                    else if (code <= 3) heroEl.classList.add('weather-cloudy');
                    else heroEl.classList.add('weather-rainy');
                }

                const now = new Date();
                const formatted = now.toLocaleString('en-PH', {
                    year: 'numeric',
                    month: 'short',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                }).replace(/\s(?=[AP]M)/, '');

                if (conditionEl) conditionEl.textContent = text;
                if (tempEl) tempEl.textContent = `${Math.round(temperature)}°C`;
                if (iconEl) iconEl.textContent = icon;
                if (feelsLikeEl) feelsLikeEl.textContent = `${Math.round(feelsLike)}°C`;
                if (humidityEl) humidityEl.textContent = `${humidity}%`;
                if (windEl) windEl.textContent = `${Math.round(wind)} km/h`;
                if (updatedEl) updatedEl.textContent = formatted;

                // Render Forecast
                const forecastContainer = document.getElementById('forecastContainer');
                const forecastSection = document.getElementById('forecastSection');
                if (forecastContainer && data.daily) {
                    forecastContainer.innerHTML = '';
                    data.daily.time.forEach((date, i) => {
                        const dayCode = data.daily.weather_code[i];
                        const { icon: dayIcon } = getConditionFromCode(dayCode);
                        const dayName = new Date(date).toLocaleDateString('en-PH', { weekday: 'short' });
                        
                        forecastContainer.innerHTML += `
                            <div class="forecast-card">
                                <span class="forecast-day">${i === 0 ? 'Today' : dayName}</span>
                                <span class="forecast-icon">${dayIcon}</span>
                                <span class="forecast-temp">${Math.round(data.daily.temperature_2m_max[i])}° / ${Math.round(data.daily.temperature_2m_min[i])}°</span>
                            </div>
                        `;
                    });
                    forecastSection.style.display = 'block';
                }

                statusEl.style.display = 'none';
                detailsEl.style.display = 'block';
                errorEl.style.display = 'none';
                errorEl.textContent = '';
            } catch (err) {
                console.error('Weather load failed:', err);
                statusEl.textContent = 'Weather unavailable';
                errorEl.textContent = 'Unable to load weather right now. Please try again later.';
                errorEl.style.display = 'block';
                detailsEl.style.display = 'none';
            }
        }

        function getConditionFromCode(code) {
            // Open-Meteo weather codes (current weather):
            // https://open-meteo.com/en/docs#weathercode
            const map = {
                0: { text: 'Clear sky', icon: '☀️' },
                1: { text: 'Mainly clear', icon: '🌤️' },
                2: { text: 'Partly cloudy', icon: '⛅' },
                3: { text: 'Overcast', icon: '☁️' },
                45: { text: 'Fog', icon: '🌫️' },
                48: { text: 'Depositing rime fog', icon: '🌫️' },
                51: { text: 'Light drizzle', icon: '🌦️' },
                53: { text: 'Moderate drizzle', icon: '🌦️' },
                55: { text: 'Dense drizzle', icon: '🌧️' },
                56: { text: 'Light freezing drizzle', icon: '🌧️' },
                57: { text: 'Dense freezing drizzle', icon: '🌧️' },
                61: { text: 'Slight rain', icon: '🌦️' },
                63: { text: 'Moderate rain', icon: '🌧️' },
                65: { text: 'Heavy rain', icon: '⛈️' },
                66: { text: 'Light freezing rain', icon: '🌧️' },
                67: { text: 'Heavy freezing rain', icon: '🌧️' },
                71: { text: 'Slight snow fall', icon: '🌨️' },
                73: { text: 'Moderate snow fall', icon: '🌨️' },
                75: { text: 'Heavy snow fall', icon: '❄️' },
                77: { text: 'Snow grains', icon: '❄️' },
                80: { text: 'Slight rain showers', icon: '🌦️' },
                81: { text: 'Moderate rain showers', icon: '🌧️' },
                82: { text: 'Violent rain showers', icon: '⛈️' },
                85: { text: 'Slight snow showers', icon: '🌨️' },
                86: { text: 'Heavy snow showers', icon: '❄️' },
                95: { text: 'Thunderstorm', icon: '⛈️' },
                96: { text: 'Thunderstorm with slight hail', icon: '⛈️' },
                99: { text: 'Thunderstorm with heavy hail', icon: '⛈️' }
            };
            return map[code] || { text: 'Unknown conditions', icon: '❓' };
        }

    // Chatbot Logic
    function initChatbot() {
        const chatbotToggler = document.querySelector(".chatbot-toggler");
        const chatbox = document.querySelector(".chatbox");
        const chatInput = document.querySelector(".chat-input textarea");
        const sendChatBtn = document.querySelector(".chat-input span");

        let userMessage = null; 
        const inputInitHeight = chatInput ? chatInput.scrollHeight : 0;

        if(!chatbotToggler || !chatbox || !chatInput) return;

        const createChatLi = (message, className) => {
            const chatLi = document.createElement("li");
            chatLi.classList.add("chat", `${className}`);
            let chatContent = className === "incoming" ? `<span class="material-symbols-outlined">waves</span><p></p>` : `<p></p>`;
            chatLi.innerHTML = chatContent;
            chatLi.querySelector("p").textContent = message;
            return chatLi; 
        }

        const generateResponse = (chatElement) => {
            const messageElement = chatElement.querySelector("p");
            // Normalize message: lowercase and remove punctuation for better matching
            const cleanMessage = userMessage.toLowerCase().replace(/[^\w\s]/gi, '');

            // Define the knowledge base with grouped triggers (synonyms/same thoughts)
            const knowledgeBase = [
                {
                    triggers: ["hi", "hello", "hey", "greetings", "good morning", "good afternoon"],
                    response: "Hello! Welcome to Manuel Uy Beach Resort. How can I help you plan your visit today?"
                },
                {
                    triggers: ["reservation", "book", "reserve", "slot", "appointment", "walk in"],
                    response: "We have no reservations. We are open for walk-ins every day, Monday–Sunday."
                },
                {
                    triggers: ["overnight", "sleep", "stay over"],
                    response: "Overnight Stay Information:\n• Check-in: 5:30 AM – 11:00 PM (Strictly no entry after 11 PM)\n• Check-out: 12:00 NN the following day\n• Entrance Fee: ₱350 (Adults), ₱250 (Kids 4-10/Seniors/PWD)\n• Requirement: Bringing your own tent or renting one is mandatory for overnight campers."
                },
                {
                    triggers: ["day tour", "daytour", "day trip", "visit for a day"],
                    response: "Day Tour Information:\n• Hours: 5:30 AM to 5:00 PM\n• Entrance Fee: ₱250 (Adults), ₱200 (Kids 4-10/Seniors/PWD)\n• Infants (0-3 years old) are free of charge."
                },
                {
                    triggers: ["fee", "rate", "price", "how much", "cost", "payment", "expensive", "discount", "senior", "kid", "child", "pwd"],
                    response: "Rates & Fees:\n• Day Tour: ₱250 (Adult) / ₱200 (Senior/Kid/PWD)\n• Overnight: ₱350 (Adult) / ₱250 (Senior/Kid/PWD)\n• Kids 0-3: FREE\n• Tent Rental: ₱500 (good for 2-3 pax)\n• Parking: ₱150 (Car) / ₱30 (Motorcycle)"
                },
                {
                    triggers: ["parking", "car", "motorcycle", "vehicle", "garage"],
                    response: "Parking Fees:\n• Cars/SUVs: ₱150\n• Motorcycles: ₱30\nNote: Parking is open 24/7 for checked-in guests."
                },
                {
                    triggers: ["tent", "camp", "glamp", "pitch"],
                    response: "Camping Info:\n• You are welcome to bring your own tent (no corkage fee for own tents).\n• Tent Rental: Starts at ₱500.\n• Note: We do not provide pillows or blankets, so please bring your own for a comfortable sleep."
                },
                {
                    triggers: ["swim", "beach", "water", "ocean", "life guard"],
                    response: "Swimming hours are from 6:30 AM to 5:30 PM only. For your safety, swimming during high tide or at night is strictly prohibited."
                },
                {
                    triggers: ["silent", "quiet", "noise", "loud", "music", "karaoke", "speaker", "bluetooth"],
                    response: "To preserve the serene atmosphere, Karaoke and large sound systems are STRICTLY PROHIBITED. Small speakers must be kept at a low volume and turned off by 1:00 AM."
                },
                {
                    triggers: ["rule", "policy", "requirement", "law", "guideline", "prohibited", "forbidden"],
                    response: "Resort Rules:\n• NO Karaoke/Loud Music\n• NO Glass Bottles on the beach\n• NO Bonfires on the sand\n• NO Littering (CLAYGO)\n• NO Drones without permit\n• Pets must be leashed at all times."
                },
                {
                    triggers: ["pet", "dog", "cat", "animal"],
                    response: "Pets are allowed! We just ask that you keep them on a leash and ensure you clean up after them."
                },
                {
                    triggers: ["cook", "grill", "food", "eat", "hungry", "corkage", "bbq", "bottle", "drink", "liquor", "charcoal"],
                    response: "Food & Drinks:\n• NO CORKAGE fee for any food or drinks brought in.\n• Grilling is allowed (please bring your own charcoal).\n• STRICT RULE: Glass bottles (beer/soda) are not allowed on the sand to prevent injuries."
                },
                {
                    triggers: ["trash", "garbage", "clean", "waste", "dirty", "claygo", "plastic"],
                    response: "We strictly implement the 'Clean As You Go' (CLAYGO) policy. We encourage guests to bring their own trash bags and help us keep the beach pristine."
                },
                {
                    triggers: ["island hopping", "boat", "sandbar", "starfish", "tour", "snorkeling"],
                    response: "Island Hopping is available! \n• Rate: ₱1,500 per boat (up to 10 pax).\n• Destinations: Starfish Island and the Sandbar.\n• Duration: Roughly 1-2 hours of exploration."
                },
                {
                    triggers: ["electricity", "charge", "outlet", "power", "appliance", "rice cooker", "electric fan"],
                    response: "Electricity & Appliances:\n• We do NOT have electrical outlets for high-wattage appliances (Rice Cookers, Electric Fans, etc.).\n• Charging of gadgets (phones/power banks) is available at the common pavilion for a small fee."
                },
                {
                    triggers: ["best time", "visit", "when to go", "weather", "month"],
                    response: "The best time to visit is from March to May for calm, clear waters. Weekdays are recommended if you want to avoid large crowds!"
                },
                {
                    triggers: ["cr", "toilet", "shower", "comfort room", "restroom", "wash", "water"],
                    response: "Facilities:\n• We have common shower areas and toilets available 24/7 for all campers.\n• Please note that we do not have private bathrooms or luxury rooms; we offer a pure camping experience."
                },
                {
                    triggers: ["bring", "essential", "pack", "need", "equipment"],
                    response: "Don't forget to pack sunblock, a sturdy tent (for overnight), power banks, and drinking water."
                },
                {
                    triggers: ["location", "manila", "how to get there", "distance", "drive", "commute"],
                    response: "Manuel Uy Beach Resort is located in Calatagan, Batangas. It is approximately a 3 to 4-hour drive from Metro Manila via Tagaytay-Nasugbu highway."
                }
            ];

            // Find the first intent that has a matching trigger
            const match = knowledgeBase.find(item => 
                item.triggers.some(trigger => cleanMessage.includes(trigger))
            );

            let response = match ? match.response : "I'm sorry, I don't have information on that. You can ask about our rates, rules, pets, or cooking policies!";

            messageElement.textContent = response;
            chatbox.scrollTo(0, chatbox.scrollHeight);
        }

        const handleChat = () => {
            userMessage = chatInput.value.trim(); 
            if (!userMessage) return;

            chatInput.value = "";
            chatInput.style.height = `${inputInitHeight}px`;

            chatbox.appendChild(createChatLi(userMessage, "outgoing"));
            chatbox.scrollTo(0, chatbox.scrollHeight);
            
            setTimeout(() => {
                const incomingChatLi = createChatLi("Thinking...", "incoming");
                chatbox.appendChild(incomingChatLi);
                chatbox.scrollTo(0, chatbox.scrollHeight);
                generateResponse(incomingChatLi);
            }, 600);
        }

        chatInput.addEventListener("input", () => {
            chatInput.style.height = `${inputInitHeight}px`;
            chatInput.style.height = `${chatInput.scrollHeight}px`;
        });

        chatInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter" && !e.shiftKey && window.innerWidth > 800) {
                e.preventDefault();
                handleChat();
            }
        });

        sendChatBtn.addEventListener("click", handleChat);
        chatbotToggler.addEventListener("click", () => document.body.classList.toggle("show-chatbot"));
    }

    // Video Auto-Pause Logic
    function initVideoControl() {
        let currentPlaying = null;

        // Check for active iframe every 500ms to ensure only one video plays at a time
        setInterval(() => {
            const activeEl = document.activeElement;
            
            // Check if the current focused element is an iframe within our video containers
            if (activeEl && activeEl.tagName === 'IFRAME' && activeEl.closest('.video-container')) {
                if (currentPlaying && currentPlaying !== activeEl) {
                    // Reset src of the previous video to stop playback
                    const prevSrc = currentPlaying.src;
                    currentPlaying.src = "";
                    currentPlaying.src = prevSrc;
                }
                // Update the current playing tracker
                currentPlaying = activeEl;
            }
        }, 500);
    }
