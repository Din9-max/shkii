// Получаем элементы DOM
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const goalElement = document.getElementById('goal');
const startModal = document.getElementById('startModal');
const gameOverModal = document.getElementById('gameOverModal');
const victoryModal = document.getElementById('victoryModal');
const finalScoreModal = document.getElementById('finalScoreModal');
const victoryScore = document.getElementById('victoryScore');
const startGameBtn = document.getElementById('startGameBtn');
const restartGameBtn = document.getElementById('restartGameBtn');
const victoryRestartBtn = document.getElementById('victoryRestartBtn');
const pauseBtn = document.getElementById('pauseBtn');
const leftBtn = document.getElementById('leftBtn');
const rightBtn = document.getElementById('rightBtn');

// Устанавливаем размеры canvas
function resizeCanvas() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
}

// Инициализация размеров canvas
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Игровые переменные
let game = {
    running: false,
    paused: false,
    score: 0,
    goal: 1000,
    gravity: 0.3,
    platforms: [],
    platformCount: 10,
    platformWidth: 85,
    platformHeight: 20,
    platformRadius: 10,
    ball: {
        x: 0,
        y: 0,
        radius: 18,
        velocityX: 0,
        velocityY: 0,
        speed: 5,
        jumpPower: 12,
        rotation: 0
    },
    keys: {
        left: false,
        right: false
    },
    cameraY: 0,
    minPlatformGap: 45,
    maxPlatformGap: 95,
    snowflakes: [],
    confetti: [],
    goalReached: false,
    // Начальная платформа - не исчезает
    initialPlatform: null
};

// Класс платформы
class Platform {
    constructor(x, y, width, isInitial = false) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = game.platformHeight;
        this.color = this.getChristmasColor();
        this.brightColor = this.getBrightColor();
        this.isSpecial = Math.random() < 0.15; // 15% chance to be special
        this.isInitial = isInitial; // Начальная платформа
        this.alpha = 1;
        this.pulse = 0;
        this.pulseDirection = 1;
        this.stars = [];
        this.used = false;
        this.disappearing = false;
        
        if (this.isSpecial) {
            // Добавляем мерцающие звездочки на особые платформы
            for (let i = 0; i < 3; i++) {
                this.stars.push({
                    x: Math.random() * this.width,
                    y: Math.random() * this.height,
                    size: Math.random() * 3 + 2,
                    pulse: Math.random() * Math.PI * 2
                });
            }
        }
    }
    
    getChristmasColor() {
        const colors = [
            '#ff3366', // Красный
            '#00cc66', // Зеленый
            '#ffcc00', // Золотой
            '#0099cc', // Синий
            '#cc66ff'  // Фиолетовый
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    getBrightColor() {
        const colors = [
            '#ff6699', // Ярко-розовый
            '#00ff99', // Ярко-зеленый
            '#ffff66', // Ярко-желтый
            '#66ffff', // Бирюзовый
            '#ff99ff'  // Ярко-фиолетовый
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    draw() {
        const yPos = this.y - game.cameraY;
        
        // Не рисуем если платформа исчезла
        if (this.alpha <= 0) return;
        
        // Рисуем платформу с закругленными углами
        ctx.beginPath();
        ctx.roundRect(this.x, yPos, this.width, this.height, game.platformRadius);
        
        // Градиент для особых платформ
        if (this.isSpecial && !this.used) {
            const gradient = ctx.createLinearGradient(this.x, yPos, this.x, yPos + this.height);
            gradient.addColorStop(0, this.brightColor);
            gradient.addColorStop(1, this.color);
            ctx.fillStyle = gradient;
        } else {
            ctx.fillStyle = this.color;
        }
        
        ctx.globalAlpha = this.alpha;
        ctx.fill();
        ctx.globalAlpha = 1;
        
        // Добавляем свечение для особых платформ
        if (this.isSpecial && !this.used) {
            this.pulse += 0.05 * this.pulseDirection;
            if (this.pulse > 1 || this.pulse < 0) this.pulseDirection *= -1;
            
            ctx.shadowColor = this.brightColor;
            ctx.shadowBlur = 10 + this.pulse * 10;
            
            // Рисуем мерцающие звездочки
            for (const star of this.stars) {
                ctx.beginPath();
                const starPulse = Math.sin(Date.now() * 0.003 + star.pulse) * 0.5 + 0.5;
                ctx.fillStyle = `rgba(255, 255, 255, ${starPulse})`;
                ctx.arc(this.x + star.x, yPos + star.y, star.size * starPulse, 0, Math.PI * 2);
                ctx.fill();
            }
            
            ctx.shadowBlur = 0;
        }
        
        // Обводка платформы
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Добавляем снег на платформу
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        for (let i = 0; i < 5; i++) {
            const snowX = this.x + (i * this.width / 5) + Math.random() * 5;
            ctx.beginPath();
            ctx.arc(snowX, yPos + 3, 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    update() {
        // Исчезаем если платформа была использована и это не начальная платформа
        if (this.disappearing && !this.isInitial) {
            this.alpha -= 0.03; // Быстро исчезаем
            if (this.alpha <= 0) {
                return false; // Платформа полностью исчезла
            }
        }
        this.draw();
        return true; // Платформа еще существует
    }
    
    hit() {
        if (!this.used) {
            this.used = true;
            // Начальная платформа не исчезает, остальные начинают исчезать
            if (!this.isInitial) {
                this.disappearing = true;
            }
            return true; // Первое попадание
        }
        return false; // Уже было попадание
    }
}

// Снежинки
class Snowflake {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 3 + 1;
        this.speed = Math.random() * 1 + 0.5;
        this.wind = Math.random() * 0.5 - 0.25;
    }
    
    update() {
        this.y += this.speed;
        this.x += this.wind;
        
        if (this.y > canvas.height) {
            this.y = 0;
            this.x = Math.random() * canvas.width;
        }
        if (this.x > canvas.width) this.x = 0;
        if (this.x < 0) this.x = canvas.width;
    }
    
    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 150, 255, 0.6)'; // Голубые снежинки на светлом фоне
        ctx.fill();
    }
}

// Показать начальное модальное окно
function showStartModal() {
    startModal.classList.add('active');
    game.running = false;
}

// Скрыть начальное модальное окно
function hideStartModal() {
    startModal.classList.remove('active');
}

// Показать модальное окно проигрыша
function showGameOverModal() {
    finalScoreModal.textContent = game.score;
    gameOverModal.classList.add('active');
}

// Скрыть модальное окно проигрыша
function hideGameOverModal() {
    gameOverModal.classList.remove('active');
}

// Показать модальное окно победы
function showVictoryModal() {
    victoryScore.textContent = game.score;
    victoryModal.classList.add('active');
}

// Скрыть модальное окно победы
function hideVictoryModal() {
    victoryModal.classList.remove('active');
}

// Инициализация игры
function initGame() {
    game.score = 0;
    scoreElement.textContent = game.score;
    game.cameraY = 0;
    game.platforms = [];
    game.goalReached = false;
    game.paused = false;
    game.ball.x = canvas.width / 2;
    game.ball.y = canvas.height - 100;
    game.ball.velocityX = 0;
    game.ball.velocityY = 0;
    game.ball.rotation = 0;
    
    // Скрыть все модальные окна
    hideStartModal();
    hideGameOverModal();
    hideVictoryModal();
    
    // Инициализация снежинок
    game.snowflakes = [];
    for (let i = 0; i < 50; i++) {
        game.snowflakes.push(new Snowflake());
    }
    
    // Создаем начальную платформу (не исчезает)
    const initialX = canvas.width / 2 - game.platformWidth / 2;
    const initialY = canvas.height - 50;
    game.initialPlatform = new Platform(initialX, initialY, game.platformWidth, true);
    game.platforms.push(game.initialPlatform);
    
    // Создаем остальные платформы
    for (let i = 1; i < game.platformCount; i++) {
        let x, y;
        
        x = Math.random() * (canvas.width - game.platformWidth);
        y = game.platforms[i-1].y - (game.minPlatformGap + Math.random() * (game.maxPlatformGap - game.minPlatformGap));
        
        game.platforms.push(new Platform(x, y, game.platformWidth, false));
    }
    
    game.running = true;
    requestAnimationFrame(animate);
}

// Отрисовка фона
function drawBackground() {
    // Светлое небо с градиентом
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#e6f7ff'); // Светло-голубой
    gradient.addColorStop(1, '#ffffff'); // Белый
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Легкие облака
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    for (let i = 0; i < 5; i++) {
        const x = (i * 80) % canvas.width;
        const y = (i * 50) % (canvas.height * 0.3);
        const width = 60 + Math.sin(Date.now() * 0.001 + i) * 10;
        const height = 20;
        
        ctx.beginPath();
        ctx.ellipse(x, y, width, height, 0, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Рисуем шарик-леденец
function drawCandyCaneBall(x, y, radius, rotation) {
    ctx.save();
    ctx.translate(x, y - game.cameraY);
    ctx.rotate(rotation);
    
    // Рисуем спираль леденца
    const segments = 12;
    const segmentAngle = (Math.PI * 2) / segments;
    
    for (let i = 0; i < segments; i++) {
        ctx.beginPath();
        ctx.arc(0, 0, radius, i * segmentAngle, (i + 1) * segmentAngle);
        ctx.lineTo(0, 0);
        ctx.closePath();
        
        // Чередуем красный и белый
        if (i % 2 === 0) {
            ctx.fillStyle = '#ff3366'; // Красный
        } else {
            ctx.fillStyle = '#ffffff'; // Белый
        }
        
        ctx.fill();
        
        // Обводка между сегментами
        ctx.strokeStyle = '#ff6699';
        ctx.lineWidth = 1;
        ctx.stroke();
    }
    
    // Добавляем блик
    ctx.beginPath();
    ctx.arc(-radius/3, -radius/3, radius/4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fill();
    
    // Обводка шарика
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.strokeStyle = '#ff3366';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    ctx.restore();
}

// Обновление позиции шарика
function updateBall() {
    // Вращение шарика
    game.ball.rotation += game.ball.velocityX * 0.05;
    
    // Движение влево/вправо
    if (game.keys.left) {
        game.ball.velocityX = -game.ball.speed;
    } else if (game.keys.right) {
        game.ball.velocityX = game.ball.speed;
    } else {
        // Замедление при отпускании клавиш
        game.ball.velocityX *= 0.9;
    }
    
    // Применяем гравитацию
    game.ball.velocityY += game.gravity;
    
    // Обновляем позицию
    game.ball.x += game.ball.velocityX;
    game.ball.y += game.ball.velocityY;
    
    // Проверяем столкновения со стенами
    if (game.ball.x - game.ball.radius < 0) {
        game.ball.x = game.ball.radius;
        game.ball.velocityX *= -0.5;
    } else if (game.ball.x + game.ball.radius > canvas.width) {
        game.ball.x = canvas.width - game.ball.radius;
        game.ball.velocityX *= -0.5;
    }
    
    // Проверяем столкновения с платформами
    for (let i = 0; i < game.platforms.length; i++) {
        const platform = game.platforms[i];
        
        if (
            game.ball.y + game.ball.radius >= platform.y &&
            game.ball.y + game.ball.radius <= platform.y + platform.height &&
            game.ball.x + game.ball.radius >= platform.x &&
            game.ball.x - game.ball.radius <= platform.x + platform.width &&
            game.ball.velocityY > 0
        ) {
            // Шарик приземлился на платформу
            game.ball.y = platform.y - game.ball.radius;
            game.ball.velocityY = -game.ball.jumpPower;
            
            // Первое попадание на платформу
            if (platform.hit()) {
                // Добавляем очки
                let points = platform.isSpecial ? 25 : 10;
                game.score += points;
                scoreElement.textContent = game.score;
                
                // Создаем частицы для платформы
                createPlatformParticles(platform);
                
                // Проверяем достижение цели
                if (!game.goalReached && game.score >= game.goal) {
                    game.goalReached = true;
                    createFinalPlatform();
                }
            }
            
            break;
        }
    }
    
    // Удаляем исчезнувшие платформы (кроме начальной)
    for (let i = game.platforms.length - 1; i >= 0; i--) {
        const platform = game.platforms[i];
        if (!platform.update() && !platform.isInitial) {
            game.platforms.splice(i, 1);
        }
    }
    
    // Если шарик падает ниже видимой области
    if (game.ball.y - game.cameraY > canvas.height + 100) {
        endGame();
        return;
    }
    
    // Перемещаем камеру, когда шарик поднимается
    if (game.ball.y < game.cameraY + canvas.height * 0.3) {
        game.cameraY = game.ball.y - canvas.height * 0.3;
    }
    
    // Генерируем новые платформы, когда шарик поднимается
    while (game.platforms.length > 0 && 
           game.platforms[game.platforms.length - 1].y > game.cameraY) {
        const lastPlatform = game.platforms[game.platforms.length - 1];
        const y = lastPlatform.y - (game.minPlatformGap + Math.random() * (game.maxPlatformGap - game.minPlatformGap));
        const x = Math.random() * (canvas.width - game.platformWidth);
        game.platforms.push(new Platform(x, y, game.platformWidth, false));
    }
    
    // Удаляем платформы, которые ушли за пределы видимости
    while (game.platforms.length > 0 && 
           game.platforms[0].y - game.cameraY > canvas.height) {
        // Не удаляем начальную платформу
        if (game.platforms[0].isInitial) {
            break;
        }
        game.platforms.shift();
    }
}

function createPlatformParticles(platform) {
    for (let i = 0; i < 5; i++) {
        game.confetti.push({
            x: platform.x + Math.random() * platform.width,
            y: platform.y - game.cameraY,
            color: platform.color,
            size: Math.random() * 3 + 2,
            velocityX: Math.random() * 4 - 2,
            velocityY: Math.random() * -5 - 2,
            gravity: 0.1,
            life: 1
        });
    }
}

function createFinalPlatform() {
    const finalPlatformWidth = canvas.width * 0.8;
    const finalPlatformHeight = 30;
    const finalPlatformY = game.cameraY - 200;
    
    // Создаем большую праздничную платформу
    const finalPlatform = {
        x: (canvas.width - finalPlatformWidth) / 2,
        y: finalPlatformY,
        width: finalPlatformWidth,
        height: finalPlatformHeight,
        color: '#ffcc00',
        isInitial: false,
        alpha: 1,
        used: false,
        disappearing: false,
        draw: function() {
            const yPos = this.y - game.cameraY;
            
            // Рисуем платформу с праздничным градиентом
            const gradient = ctx.createLinearGradient(this.x, yPos, this.x, yPos + this.height);
            gradient.addColorStop(0, '#ffcc00');
            gradient.addColorStop(1, '#ff9900');
            
            ctx.beginPath();
            ctx.roundRect(this.x, yPos, this.width, this.height, 15);
            ctx.fillStyle = gradient;
            ctx.fill();
            
            // Добавляем текст
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 24px Comic Sans MS';
            ctx.textAlign = 'center';
            ctx.fillText('🎉 ПОБЕДА! 🎉', this.x + this.width/2, yPos + this.height/2 + 8);
            
            // Добавляем искры
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            for (let i = 0; i < 10; i++) {
                const time = Date.now() * 0.001;
                const angle = time + i * Math.PI * 0.2;
                const sparkleX = this.x + this.width/2 + Math.cos(angle) * 50;
                const sparkleY = yPos - 20 + Math.sin(angle) * 10;
                
                ctx.beginPath();
                ctx.arc(sparkleX, sparkleY, 3, 0, Math.PI * 2);
                ctx.fill();
            }
        },
        update: function() {
            if (this.alpha <= 0) return false;
            this.draw();
            return true;
        },
        hit: function() {
            this.used = true;
            this.disappearing = true;
            return true;
        }
    };
    
    game.platforms.push(finalPlatform);
    
    // Создаем праздничное конфетти
    for (let i = 0; i < 100; i++) {
        game.confetti.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height * 0.5,
            color: ['#ff3366', '#00cc66', '#ffcc00', '#0099cc'][Math.floor(Math.random() * 4)],
            size: Math.random() * 5 + 3,
            velocityX: Math.random() * 6 - 3,
            velocityY: Math.random() * -10 - 5,
            gravity: 0.05,
            life: 2
        });
    }
    
    // Показываем экран победы с задержкой
    setTimeout(() => {
        if (game.goalReached) {
            game.running = false;
            showVictoryModal();
            createVictoryConfetti();
        }
    }, 2000);
}

function createVictoryConfetti() {
    // Создаем много конфетти для экрана победы
    for (let i = 0; i < 200; i++) {
        setTimeout(() => {
            game.confetti.push({
                x: Math.random() * canvas.width,
                y: -10,
                color: ['#ff3366', '#00cc66', '#ffcc00', '#0099cc', '#ff6699'][Math.floor(Math.random() * 5)],
                size: Math.random() * 6 + 4,
                velocityX: Math.random() * 8 - 4,
                velocityY: Math.random() * 5 + 2,
                gravity: 0.1,
                life: 3
            });
        }, i * 10);
    }
}

function updateParticles() {
    for (let i = game.confetti.length - 1; i >= 0; i--) {
        const p = game.confetti[i];
        p.x += p.velocityX;
        p.y += p.velocityY;
        p.velocityY += p.gravity;
        p.life -= 0.02;
        
        if (p.life <= 0) {
            game.confetti.splice(i, 1);
        }
    }
}

function drawParticles() {
    for (const p of game.confetti) {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;
}

// Игровой цикл
function animate() {
    if (!game.running || game.paused) return;
    
    drawBackground();
    
    // Обновляем и рисуем снежинки
    for (const flake of game.snowflakes) {
        flake.update();
        flake.draw();
    }
    
    updateParticles();
    drawParticles();
    
    updateBall();
    drawCandyCaneBall(game.ball.x, game.ball.y, game.ball.radius, game.ball.rotation);
    
    requestAnimationFrame(animate);
}

// Пауза игры
function togglePause() {
    if (!game.running) return;
    
    game.paused = !game.paused;
    pauseBtn.textContent = game.paused ? '▶ Продолжить' : '⏸ Пауза';
    
    if (!game.paused) {
        requestAnimationFrame(animate);
    }
}

// Конец игры
function endGame() {
    game.running = false;
    showGameOverModal();
}

// Обработчики событий клавиатуры
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'Left' || e.key === 'a') {
        game.keys.left = true;
    } else if (e.key === 'ArrowRight' || e.key === 'Right' || e.key === 'd') {
        game.keys.right = true;
    } else if (e.key === ' ' && !game.running) {
        initGame();
    } else if (e.key === 'Escape' || e.key === 'p') {
        togglePause();
    }
});

document.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'Left' || e.key === 'a') {
        game.keys.left = false;
    } else if (e.key === 'ArrowRight' || e.key === 'Right' || e.key === 'd') {
        game.keys.right = false;
    }
});

// Обработчики для кнопок управления на мобильных устройствах
leftBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    game.keys.left = true;
});

leftBtn.addEventListener('touchend', (e) => {
    e.preventDefault();
    game.keys.left = false;
});

rightBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    game.keys.right = true;
});

rightBtn.addEventListener('touchend', (e) => {
    e.preventDefault();
    game.keys.right = false;
});

// Обработчики для кнопок мыши на мобильных устройствах
leftBtn.addEventListener('mousedown', () => {
    game.keys.left = true;
});

leftBtn.addEventListener('mouseup', () => {
    game.keys.left = false;
});

leftBtn.addEventListener('mouseleave', () => {
    game.keys.left = false;
});

rightBtn.addEventListener('mousedown', () => {
    game.keys.right = true;
});

rightBtn.addEventListener('mouseup', () => {
    game.keys.right = false;
});

rightBtn.addEventListener('mouseleave', () => {
    game.keys.right = false;
});

// Обработчики кнопок
startGameBtn.addEventListener('click', () => {
    initGame();
});

restartGameBtn.addEventListener('click', () => {
    initGame();
});

victoryRestartBtn.addEventListener('click', () => {
    initGame();
});

pauseBtn.addEventListener('click', togglePause);

// Инициализация начального экрана
function initStartScreen() {
    drawBackground();
    
    // Рисуем начальные снежинки
    for (let i = 0; i < 50; i++) {
        const flake = new Snowflake();
        flake.draw();
    }
    
    // Рисуем начальные платформы
    const initialX = canvas.width / 2 - game.platformWidth / 2;
    const initialY = canvas.height - 50;
    const initialPlatform = new Platform(initialX, initialY, game.platformWidth, true);
    initialPlatform.draw();
    
    for (let i = 1; i < 4; i++) {
        const x = canvas.width / 2 - game.platformWidth / 2 + (i-1.5) * 100;
        const y = canvas.height / 2 + 150 + i * 40;
        const platform = new Platform(x, y, game.platformWidth, false);
        platform.draw();
    }
    
    // Рисуем шарик-леденец на начальном экране
    game.ball.x = canvas.width / 2;
    game.ball.y = canvas.height / 2 + 120;
    drawCandyCaneBall(game.ball.x, game.ball.y, game.ball.radius, 0);
    
    // Показываем начальное модальное окно
    setTimeout(() => {
        showStartModal();
    }, 500);
}

// Запуск начального экрана
initStartScreen();