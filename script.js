// Solar System 3D Simulation
class SolarSystem {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.planets = [];
        this.sun = null;
        this.animationId = null;
        this.isAnimating = true;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.tooltip = document.getElementById('planetTooltip');
        this.moon = null;
        this.asteroids = [];
        this.planetTrails = [];
        this.orbitLines = [];
        this.timeSpeed = 1.0;
        
        // Realistic planet data based on actual NASA imagery
        this.planetData = {
            mercury: {
                name: 'Mercury',
                size: 1.5,
                distance: 20,
                speed: 0.02,
                color: 0x8C7853,
                info: 'Closest planet to the Sun. Temperature: 427°C'
            },
            venus: {
                name: 'Venus',
                size: 2.2,
                distance: 28,
                speed: 0.015,
                color: 0xE6E6FA,
                info: 'Hottest planet in our solar system. Temperature: 462°C'
            },
            earth: {
                name: 'Earth',
                size: 2.5,
                distance: 35,
                speed: 0.01,
                color: 0x6B93D6,
                info: 'Our home planet. Perfect for life. Temperature: 15°C'
            },
            mars: {
                name: 'Mars',
                size: 1.8,
                distance: 42,
                speed: 0.008,
                color: 0xCD5C5C,
                info: 'The Red Planet. Temperature: -65°C'
            },
            jupiter: {
                name: 'Jupiter',
                size: 8,
                distance: 55,
                speed: 0.006,
                color: 0xD2691E,
                info: 'Largest planet. Great Red Spot storm. Temperature: -110°C'
            },
            saturn: {
                name: 'Saturn',
                size: 7,
                distance: 70,
                speed: 0.005,
                color: 0xFAD5A5,
                info: 'Beautiful ring system. Temperature: -140°C'
            },
            uranus: {
                name: 'Uranus',
                size: 4,
                distance: 85,
                speed: 0.004,
                color: 0x87CEEB,
                info: 'Ice giant tilted on its side. Temperature: -195°C'
            },
            neptune: {
                name: 'Neptune',
                size: 3.8,
                distance: 100,
                speed: 0.003,
                color: 0x4682B4,
                info: 'Windiest planet. Winds up to 2100 km/h. Temperature: -200°C'
            }
        };
        
        this.init();
        this.setupEventListeners();
        this.animate();
    }
    
    init() {
        // Create scene
        this.scene = new THREE.Scene();
        
        // Create camera
        const canvas = document.getElementById('solarSystemCanvas');
        this.camera = new THREE.PerspectiveCamera(
            75,
            canvas.clientWidth / canvas.clientHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 50, 100);
        
        // Create renderer
        this.renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            antialias: true,
            alpha: true
        });
        this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // Create controls
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.minDistance = 10;
        this.controls.maxDistance = 200;
        
        // Setup lighting
        this.setupLighting();
        
        // Create starfield
        this.createStarfield();
        
        // Create sun
        this.createSun();
        
        // Create planets
        this.createPlanets();
        
        // Create moon
        this.createMoon();
        
        // Create asteroid belt
        this.createAsteroidBelt();
    }
    
    setupLighting() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.1);
        this.scene.add(ambientLight);
        
        // Point light from sun
        const sunLight = new THREE.PointLight(0xFFFFAA, 2, 300);
        sunLight.position.set(0, 0, 0);
        sunLight.castShadow = true;
        sunLight.shadow.mapSize.width = 2048;
        sunLight.shadow.mapSize.height = 2048;
        this.scene.add(sunLight);
    }
    
    createStarfield() {
        const starsGeometry = new THREE.BufferGeometry();
        const starsCount = 5000;
        const positions = new Float32Array(starsCount * 3);
        
        for (let i = 0; i < starsCount * 3; i++) {
            positions[i] = (Math.random() - 0.5) * 2000;
        }
        
        starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const starsMaterial = new THREE.PointsMaterial({
            color: 0xFFFFFF,
            size: 1,
            sizeAttenuation: false
        });
        
        const stars = new THREE.Points(starsGeometry, starsMaterial);
        this.scene.add(stars);
    }
    
    
    createSun() {
        const sunGeometry = new THREE.SphereGeometry(5, 64, 64);
        const sunMaterial = new THREE.MeshBasicMaterial({
            color: 0xFDB813,
            emissive: 0xFDB813,
            emissiveIntensity: 0.8
        });
        
        this.sun = new THREE.Mesh(sunGeometry, sunMaterial);
        this.sun.name = 'Sun';
        this.scene.add(this.sun);
        
        // Simple subtle glow
        const glowGeometry = new THREE.SphereGeometry(6.5, 32, 32);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0xFFDD44,
            transparent: true,
            opacity: 0.2,
            side: THREE.BackSide
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        this.sun.add(glow);
    }
    
    createPlanets() {
        Object.entries(this.planetData).forEach(([planetKey, data]) => {
            const planet = this.createPlanet(data);
            planet.userData = {
                name: data.name,
                info: data.info,
                orbitRadius: data.distance,
                orbitSpeed: data.speed,
                baseSpeed: data.speed,
                angle: Math.random() * Math.PI * 2,
                planetKey: planetKey
            };
            
            // Set initial position
            planet.position.x = Math.cos(planet.userData.angle) * planet.userData.orbitRadius;
            planet.position.z = Math.sin(planet.userData.angle) * planet.userData.orbitRadius;
            
            this.planets.push(planet);
            this.scene.add(planet);
            
            // Create orbit line
            const orbitLine = this.createOrbitLine(data.distance);
            this.orbitLines.push(orbitLine);
            
            // Create trail for this planet
            this.createPlanetTrail(planet);
        });
        
        // Special handling for Saturn's rings
        this.addSaturnRings();
    }
    
    createPlanet(data) {
        const geometry = new THREE.SphereGeometry(data.size, 32, 32);
        const material = new THREE.MeshLambertMaterial({
            color: data.color
        });
        
        const planet = new THREE.Mesh(geometry, material);
        planet.name = data.name;
        planet.castShadow = true;
        planet.receiveShadow = true;
        
        return planet;
    }
    
    createOrbitLine(radius) {
        const points = [];
        const segments = 128;
        
        for (let i = 0; i <= segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            points.push(new THREE.Vector3(
                Math.cos(angle) * radius,
                0,
                Math.sin(angle) * radius
            ));
        }
        
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({
            color: 0x666699,
            opacity: 0.2,
            transparent: true
        });
        
        const orbitLine = new THREE.Line(geometry, material);
        this.scene.add(orbitLine);
        return orbitLine;
    }
    
    createPlanetTrail(planet) {
        const trailGeometry = new THREE.BufferGeometry();
        const maxPoints = 50;
        const positions = new Float32Array(maxPoints * 3);
        
        // Initialize with current position
        for (let i = 0; i < maxPoints; i++) {
            positions[i * 3] = planet.position.x;
            positions[i * 3 + 1] = planet.position.y;
            positions[i * 3 + 2] = planet.position.z;
        }
        
        trailGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const trailMaterial = new THREE.LineBasicMaterial({
            color: 0x666666,
            opacity: 0.3,
            transparent: true
        });
        
        const trail = new THREE.Line(trailGeometry, trailMaterial);
        this.scene.add(trail);
        
        planet.userData.trail = trail;
        planet.userData.trailPositions = [];
        this.planetTrails.push(trail);
    }
    
    createMoon() {
        const moonGeometry = new THREE.SphereGeometry(0.3, 16, 16);
        const moonMaterial = new THREE.MeshLambertMaterial({
            color: 0xAAAAAA
        });
        
        this.moon = new THREE.Mesh(moonGeometry, moonMaterial);
        this.moon.name = 'Moon';
        this.moon.userData = {
            orbitRadius: 4,
            orbitSpeed: 0.1,
            angle: 0
        };
        
        this.scene.add(this.moon);
    }
    
    createAsteroidBelt() {
        const asteroidCount = 200;
        const innerRadius = 47;
        const outerRadius = 52;
        
        for (let i = 0; i < asteroidCount; i++) {
            const asteroidGeometry = new THREE.SphereGeometry(0.1 + Math.random() * 0.3, 8, 8);
            const asteroidMaterial = new THREE.MeshLambertMaterial({
                color: 0x555555
            });
            
            const asteroid = new THREE.Mesh(asteroidGeometry, asteroidMaterial);
            
            const angle = Math.random() * Math.PI * 2;
            const radius = innerRadius + Math.random() * (outerRadius - innerRadius);
            
            asteroid.position.x = Math.cos(angle) * radius;
            asteroid.position.z = Math.sin(angle) * radius;
            asteroid.position.y = (Math.random() - 0.5) * 2;
            
            asteroid.userData = {
                orbitRadius: radius,
                orbitSpeed: 0.001 + Math.random() * 0.002,
                angle: angle
            };
            
            this.asteroids.push(asteroid);
            this.scene.add(asteroid);
        }
    }
    
    addSaturnRings() {
        const saturn = this.planets.find(p => p.userData.planetKey === 'saturn');
        if (!saturn) return;
        
        const ringGeometry = new THREE.RingGeometry(
            saturn.geometry.parameters.radius * 1.5,
            saturn.geometry.parameters.radius * 2.2,
            32
        );
        const ringMaterial = new THREE.MeshLambertMaterial({
            color: 0xC4A484,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.8
        });
        
        const rings = new THREE.Mesh(ringGeometry, ringMaterial);
        rings.rotation.x = Math.PI / 2;
        saturn.add(rings);
    }
    
    setupEventListeners() {
        // Window resize
        window.addEventListener('resize', () => this.onWindowResize());
        
        // Mouse events for planet interaction
        this.renderer.domElement.addEventListener('mousemove', (event) => this.onMouseMove(event));
        this.renderer.domElement.addEventListener('click', (event) => this.onMouseClick(event));
        
        // Control panel events
        this.setupControlPanel();
        
        // Theme toggle
        const themeBtn = document.getElementById('themeToggle');
        if (themeBtn) {
            themeBtn.addEventListener('click', () => this.toggleTheme());
        }
    }
    
    setupControlPanel() {
        // Speed sliders
        Object.keys(this.planetData).forEach(planetKey => {
            const slider = document.getElementById(`${planetKey}Speed`);
            if (slider) {
                const speedValue = slider.parentElement.querySelector('.speed-value');
                
                slider.addEventListener('input', (e) => {
                    const speed = parseFloat(e.target.value);
                    speedValue.textContent = speed.toFixed(1) + 'x';
                    
                    const planet = this.planets.find(p => p.userData.planetKey === planetKey);
                    if (planet) {
                        planet.userData.orbitSpeed = this.planetData[planetKey].speed * speed;
                    }
                });
            }
        });
        
        // Pause/Resume button
        const pauseBtn = document.getElementById('pauseResume');
        if (pauseBtn) {
            pauseBtn.addEventListener('click', () => this.toggleAnimation());
        }
        
        // Reset camera button
        const resetBtn = document.getElementById('resetCamera');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.resetCamera());
        }
        
        // Feature toggles
        const showTrails = document.getElementById('showTrails');
        if (showTrails) {
            showTrails.addEventListener('change', (e) => this.toggleTrails(e.target.checked));
        }
        
        const showOrbits = document.getElementById('showOrbits');
        if (showOrbits) {
            showOrbits.addEventListener('change', (e) => this.toggleOrbits(e.target.checked));
        }
        
        const showMoon = document.getElementById('showMoon');
        if (showMoon) {
            showMoon.addEventListener('change', (e) => this.toggleMoon(e.target.checked));
        }
        
        const showAsteroids = document.getElementById('showAsteroids');
        if (showAsteroids) {
            showAsteroids.addEventListener('change', (e) => this.toggleAsteroids(e.target.checked));
        }
        
        // Time speed control
        const timeSpeed = document.getElementById('timeSpeed');
        const timeSpeedValue = document.getElementById('timeSpeedValue');
        if (timeSpeed && timeSpeedValue) {
            timeSpeed.addEventListener('input', (e) => {
                this.timeSpeed = parseFloat(e.target.value);
                timeSpeedValue.textContent = this.timeSpeed.toFixed(1) + 'x';
            });
        }
    }
    
    onWindowResize() {
        const canvas = this.renderer.domElement;
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }
    
    onMouseMove(event) {
        const canvas = this.renderer.domElement;
        const rect = canvas.getBoundingClientRect();
        
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects([this.sun, ...this.planets]);
        
        if (intersects.length > 0) {
            const object = intersects[0].object;
            this.showTooltip(event, object);
        } else {
            this.hideTooltip();
        }
    }
    
    onMouseClick(event) {
        const canvas = this.renderer.domElement;
        const rect = canvas.getBoundingClientRect();
        
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects([this.sun, ...this.planets]);
        
        if (intersects.length > 0) {
            const object = intersects[0].object;
            this.focusOnObject(object);
        }
    }
    
    showTooltip(event, object) {
        const planetData = Object.values(this.planetData).find(p => p.name === object.name);
        const info = object.name === 'Sun' ? 'The Sun - Center of our solar system. Temperature: 5778K' : planetData?.info || '';
        
        this.tooltip.innerHTML = `<strong>${object.name}</strong><br>${info}`;
        this.tooltip.style.left = event.clientX + 10 + 'px';
        this.tooltip.style.top = event.clientY + 10 + 'px';
        this.tooltip.classList.add('show');
    }
    
    hideTooltip() {
        this.tooltip.classList.remove('show');
    }
    
    focusOnObject(object) {
        const targetPosition = object.position.clone();
        const distance = object.name === 'Sun' ? 20 : 15;
        
        // Calculate camera position
        const cameraPosition = targetPosition.clone().add(new THREE.Vector3(distance, distance, distance));
        
        // Animate camera to target
        this.animateCamera(cameraPosition, targetPosition);
    }
    
    animateCamera(position, target) {
        const startPosition = this.camera.position.clone();
        const startTarget = this.controls.target.clone();
        
        let progress = 0;
        const duration = 2000; // 2 seconds
        const startTime = Date.now();
        
        const animate = () => {
            const currentTime = Date.now();
            progress = Math.min((currentTime - startTime) / duration, 1);
            
            // Easing function
            const easeInOutCubic = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
            const easedProgress = easeInOutCubic(progress);
            
            this.camera.position.lerpVectors(startPosition, position, easedProgress);
            this.controls.target.lerpVectors(startTarget, target, easedProgress);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        animate();
    }
    
    toggleAnimation() {
        this.isAnimating = !this.isAnimating;
        const button = document.getElementById('pauseResume');
        button.textContent = this.isAnimating ? '⏸️ Pause' : '▶️ Resume';
    }
    
    resetCamera() {
        this.animateCamera(
            new THREE.Vector3(0, 50, 100),
            new THREE.Vector3(0, 0, 0)
        );
    }
    
    toggleTheme() {
        const body = document.body;
        const themeToggle = document.getElementById('themeToggle');
        
        if (body.getAttribute('data-theme') === 'light') {
            body.removeAttribute('data-theme');
            themeToggle.textContent = '🌙';
        } else {
            body.setAttribute('data-theme', 'light');
            themeToggle.textContent = '☀️';
        }
    }
    
    animate() {
        this.animationId = requestAnimationFrame(() => this.animate());
        
        const time = Date.now() * 0.001;
        
        if (this.isAnimating) {
            // Animate planets
            this.planets.forEach(planet => {
                planet.userData.angle += planet.userData.orbitSpeed * this.timeSpeed;
                planet.position.x = Math.cos(planet.userData.angle) * planet.userData.orbitRadius;
                planet.position.z = Math.sin(planet.userData.angle) * planet.userData.orbitRadius;
                
                // Planet rotation
                planet.rotation.y += 0.01 * this.timeSpeed;
                
                // Update trail
                this.updatePlanetTrail(planet);
            });
            
            // Animate moon around Earth
            if (this.moon) {
                const earth = this.planets.find(p => p.userData.planetKey === 'earth');
                if (earth) {
                    this.moon.userData.angle += this.moon.userData.orbitSpeed * this.timeSpeed;
                    this.moon.position.x = earth.position.x + Math.cos(this.moon.userData.angle) * this.moon.userData.orbitRadius;
                    this.moon.position.z = earth.position.z + Math.sin(this.moon.userData.angle) * this.moon.userData.orbitRadius;
                }
            }
            
            // Animate asteroids
            this.asteroids.forEach(asteroid => {
                asteroid.userData.angle += asteroid.userData.orbitSpeed * this.timeSpeed;
                asteroid.position.x = Math.cos(asteroid.userData.angle) * asteroid.userData.orbitRadius;
                asteroid.position.z = Math.sin(asteroid.userData.angle) * asteroid.userData.orbitRadius;
            });
            
            // Animate sun
            if (this.sun) {
                this.sun.rotation.y += 0.005 * this.timeSpeed;
            }
        }
        
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
    
    dispose() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        this.scene.traverse((object) => {
            if (object.geometry) object.geometry.dispose();
            if (object.material) {
                if (Array.isArray(object.material)) {
                    object.material.forEach(material => material.dispose());
                } else {
                    object.material.dispose();
                }
            }
        });
        
        this.renderer.dispose();
    }
    
    updatePlanetTrail(planet) {
        if (!planet.userData.trail) return;
        
        const maxPoints = 50;
        if (!planet.userData.trailPositions) {
            planet.userData.trailPositions = [];
        }
        
        // Add current position to trail
        planet.userData.trailPositions.push({
            x: planet.position.x,
            y: planet.position.y,
            z: planet.position.z
        });
        
        // Keep only last maxPoints positions
        if (planet.userData.trailPositions.length > maxPoints) {
            planet.userData.trailPositions.shift();
        }
        
        // Update trail geometry
        const positions = new Float32Array(maxPoints * 3);
        for (let i = 0; i < maxPoints; i++) {
            const index = planet.userData.trailPositions.length - maxPoints + i;
            if (index >= 0 && index < planet.userData.trailPositions.length) {
                const pos = planet.userData.trailPositions[index];
                positions[i * 3] = pos.x;
                positions[i * 3 + 1] = pos.y;
                positions[i * 3 + 2] = pos.z;
            } else {
                positions[i * 3] = planet.position.x;
                positions[i * 3 + 1] = planet.position.y;
                positions[i * 3 + 2] = planet.position.z;
            }
        }
        
        planet.userData.trail.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        planet.userData.trail.geometry.attributes.position.needsUpdate = true;
    }
    
    toggleTrails(show) {
        this.planetTrails.forEach(trail => {
            trail.visible = show;
        });
    }
    
    toggleOrbits(show) {
        this.orbitLines.forEach(orbit => {
            orbit.visible = show;
        });
    }
    
    toggleMoon(show) {
        if (this.moon) {
            this.moon.visible = show;
        }
    }
    
    toggleAsteroids(show) {
        this.asteroids.forEach(asteroid => {
            asteroid.visible = show;
        });
    }
}

// Initialize the solar system when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new SolarSystem();
});