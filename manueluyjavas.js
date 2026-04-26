 let currentIndex = 0;
        let autoPlayTimer;
        let isPlaying = true;

        function autoPlay() {
            const track = document.getElementById('filmTrack');
            const slides = document.querySelectorAll('.film-slide');
            const totalSlides = slides.length;
            
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

        // Start autoplay when page loads
        document.addEventListener('DOMContentLoaded', function() {
            startAutoPlay();
        });

        // Fallback if DOM is already loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', startAutoPlay);
        } else {
            startAutoPlay();
        }
    