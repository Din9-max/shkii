// Элементы DOM
const gameArea = document.getElementById('game-area');
const scoreElement = document.getElementById('score');
const firesCountElement = document.getElementById('fires-count');
const snowballsLeftElement = document.getElementById('snowballs-left');
const accuracyElement = document.getElementById('accuracy');
const progressFill = document.getElementById('progress-fill');
const speedIndicator = document.getElementById('speed-indicator');
const startButton = document.getElementById('start-button');
const pauseButton = document.getElementById('pause-button');
const restartButton = document.getElementById('restart-button');
const gameOverScreen = document.getElementById('game-over');
const gameOverTitle = document.getElementById('game-over-title');
const finalScoreElement = document.getElementById('final-score');
const finalAccuracyElement = document.getElementById('final-accuracy');
const finalSpeedElement = document.getElementById('final-speed');
const loseReasonElement = document.getElementById('lose-reason');
const warningMessage = document.getElementById('warning-message');
const snowEffect = document.getElementById('snow-effect');
const throwerCircle = document.getElementById('thrower-circle');

// Новые элементы для модальных окон
const startModalOverlay = document.getElementById('start-modal-overlay');
const startModalButton = document.getElementById('start-modal-button');
const winModalOverlay = document.getElementById('win-modal-overlay');
const nextLevelButton = document.getElementById('next-level-button');

// Игровые переменные
let score = 0;
let fires = [];
let snowballsLeft = 50;
let gameActive = false;
let gamePaused = false;
let fireInterval = null;
let gameTime = 0;
let totalShots = 0;
let successfulShots = 0;
let accuracy = 100;
let activeSnowballs = [];
let currentSpeed = 1.0;
let maxSpeed = 1.0;
let lastTouchTime = 0;
let touchCooldown = 300; // 300ms cooldown between touches

// Константы
const MAX_FIRES = 10;
const WIN_SCORE = 100;
const BASE_SPAWN_INTERVAL = 1250; // 1.25 секунды
const POINTS_PER_FIRE = 5;
const MAX_SPEED = 3.0;
const HITBOX_MULTIPLIER = 3.0; // хитбокс в 3 раза больше огонька!

// Размеры игровой области
let gameWidth = gameArea.offsetWidth;
let gameHeight = gameArea.offsetHeight;

// Позиция метателя снежков (центр снизу)
let throwerX = gameWidth / 2;
let throwerY = gameHeight - 60;

// Функция обновления размеров
function updateGameAreaSize() {
    gameWidth = gameArea.offsetWidth;
    gameHeight = gameArea.offsetHeight;
    throwerX = gameWidth / 2;
    throwerY = gameHeight - 60;
}

// Создание снежного эффекта
function createSnowEffect() {
    snowEffect.innerHTML = '';
    
    const snowflakeCount = Math.min(25, Math.floor(gameWidth * gameHeight / 4000));
    
    for (let i = 0; i < snowflakeCount; i++) {
        const snowflake = document.createElement('div');
        snowflake.className = 'snowflake';
        
        const size = Math.random() * 2.5 + 1;
        snowflake.style.width = `${size}px`;
        snowflake.style.height = `${size}px`;
        snowflake.style.left = `${Math.random() * 100}%`;
        snowflake.style.top = `${Math.random() * 100}%`;
        snowflake.style.opacity = Math.random() * 0.18 + 0.08;
        
        const duration = Math.random() * 10 + 10;
        const delay = Math.random() * 10;
        snowflake.style.animation = `snowflakeFall ${duration}s linear ${delay}s infinite`;
        
        snowEffect.appendChild(snowflake);
    }
}

// Расчет текущей скорости на основе счета
function calculateCurrentSpeed() {
    const progress = Math.min(score / WIN_SCORE, 1.0);
    const speedMultiplier = 1.0 + (MAX_SPEED - 1.0) * Math.pow(progress, 1.5);
    
    return Math.round(speedMultiplier * 10) / 10;
}

// Обновление скорости игры
function updateGameSpeed() {
    const newSpeed = calculateCurrentSpeed();
    
    if (newSpeed !== currentSpeed) {
        currentSpeed = newSpeed;
        maxSpeed = Math.max(maxSpeed, currentSpeed);
        
        updateSpeedIndicator();
        
        if (gameActive && !gamePaused && fireInterval) {
            clearInterval(fireInterval);
            const spawnInterval = Math.max(350, BASE_SPAWN_INTERVAL / currentSpeed);
            fireInterval = setInterval(createFire, spawnInterval);
        }
    }
}

// Обновление индикатора скорости
function updateSpeedIndicator() {
    speedIndicator.textContent = `Скорость: ${currentSpeed.toFixed(1)}x`;
    
    if (currentSpeed > 1.0) {
        speedIndicator.style.display = 'block';
        
        if (currentSpeed >= 2.5) {
            speedIndicator.style.color = '#ff6b6b';
            speedIndicator.style.borderColor = '#ff6b6b';
        } else if (currentSpeed >= 2.0) {
            speedIndicator.style.color = '#ffa726';
            speedIndicator.style.borderColor = '#ffa726';
        } else if (currentSpeed >= 1.5) {
            speedIndicator.style.color = '#36b1ff';
            speedIndicator.style.borderColor = '#36b1ff';
        } else if (currentSpeed >= 1.1) {
            speedIndicator.style.color = '#2a8fdb';
            speedIndicator.style.borderColor = '#2a8fdb';
        }
    } else {
        speedIndicator.style.display = 'none';
    }
}

// Создание огонька-эмодзи с ОГРОМНЫМ хитбоксом
function createFire() {
    if (!gameActive || gamePaused) return;
    
    if (fires.length >= MAX_FIRES) {
        checkGameOver();
        return;
    }
    
    const fire = document.createElement('div');
    fire.className = 'fire-emoji';
    fire.innerHTML = '🔥';
    
    const size = 22 + Math.random() * 15;
    const x = Math.random() * (gameWidth - size);
    const y = Math.random() * (gameHeight - 100);
    
    fire.style.left = `${x}px`;
    fire.style.top = `${y}px`;
    fire.style.fontSize = `${size}px`;
    
    if (currentSpeed > 2.0) {
        fire.style.animationDuration = `${2 / currentSpeed}s`;
    }
    
    gameArea.appendChild(fire);
    
    // Создаем ОГРОМНЫЙ хитбокс - в 3 раза больше эмодзи!
    const hitboxSize = size * HITBOX_MULTIPLIER;
    const hitboxX = x - (hitboxSize - size) / 2;
    const hitboxY = y - (hitboxSize - size) / 2;
    
    const hitbox = document.createElement('div');
    hitbox.className = 'fire-hitbox';
    hitbox.style.width = `${hitboxSize}px`;
    hitbox.style.height = `${hitboxSize}px`;
    hitbox.style.left = `${hitboxX}px`;
    hitbox.style.top = `${hitboxY}px`;
    
    gameArea.appendChild(hitbox);
    
    const fireObj = {
        element: fire,
        hitbox: hitbox,
        x: x,
        y: y,
        size: size,
        hitboxSize: hitboxSize,
        hitboxX: hitboxX,
        hitboxY: hitboxY,
        hit: false,
        createdAt: Date.now()
    };
    
    fires.push(fireObj);
    updateFiresCount();
    
    if (fires.length >= 7) {
        fire.classList.add('warning');
    }
    
    updateWarningMessage();
}

// Создание следа от снежка
function createTrail(x, y) {
    const trail = document.createElement('div');
    trail.className = 'snowball-trail';
    trail.style.left = `${x}px`;
    trail.style.top = `${y}px`;
    
    gameArea.appendChild(trail);
    
    setTimeout(() => {
        if (trail.parentNode) {
            trail.remove();
        }
    }, 600);
}

// Анимация броска
function animateThrow() {
    throwerCircle.style.animation = 'throwAnimation 0.3s ease-in-out';
    
    setTimeout(() => {
        throwerCircle.style.animation = '';
    }, 300);
}

// Обновление предупреждения
function updateWarningMessage() {
    if (fires.length >= 8) {
        warningMessage.style.display = 'block';
        warningMessage.textContent = `⚠️ Огоньков: ${fires.length}/10! ⚠️`;
    } else if (fires.length >= 5) {
        warningMessage.style.display = 'block';
        warningMessage.textContent = `Огоньков: ${fires.length}`;
    } else {
        warningMessage.style.display = 'none';
    }
}

// Проверка столкновения линии с ОГРОМНЫМ хитбоксом
function checkLineHitboxCollision(startX, startY, endX, endY, hitboxX, hitboxY, hitboxSize) {
    const lineVecX = endX - startX;
    const lineVecY = endY - startY;
    
    const toHitboxVecX = hitboxX + hitboxSize/2 - startX;
    const toHitboxVecY = hitboxY + hitboxSize/2 - startY;
    
    const lineLength = Math.sqrt(lineVecX * lineVecX + lineVecY * lineVecY);
    
    if (lineLength === 0) {
        const distToStart = Math.sqrt(toHitboxVecX * toHitboxVecX + toHitboxVecY * toHitboxVecY);
        return distToStart <= hitboxSize/2;
    }
    
    const lineDirX = lineVecX / lineLength;
    const lineDirY = lineVecY / lineLength;
    
    const projectionLength = toHitboxVecX * lineDirX + toHitboxVecY * lineDirY;
    
    let closestX, closestY;
    
    if (projectionLength < 0) {
        closestX = startX;
        closestY = startY;
    } else if (projectionLength > lineLength) {
        closestX = endX;
        closestY = endY;
    } else {
        closestX = startX + lineDirX * projectionLength;
        closestY = startY + lineDirY * projectionLength;
    }
    
    const distX = closestX - (hitboxX + hitboxSize/2);
    const distY = closestY - (hitboxY + hitboxSize/2);
    const distance = Math.sqrt(distX * distX + distY * distY);
    
    return distance <= hitboxSize/2;
}

// Обработчик клика по игровому полю
function handleGameAreaClick(event) {
    if (!gameActive || gamePaused || snowballsLeft <= 0) return;
    
    // Коолдаун для предотвращения спама
    const now = Date.now();
    if (now - lastTouchTime < touchCooldown) return;
    lastTouchTime = now;
    
    const rect = gameArea.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;
    
    snowballsLeft--;
    totalShots++;
    updateSnowballsLeft();
    
    animateThrow();
    createSnowballFromCenter(clickX, clickY);
}

// Обработчик тапа для мобильных устройств
function handleTouch(event) {
    if (!gameActive || gamePaused || snowballsLeft <= 0) return;
    
    // Коолдаун для предотвращения спама
    const now = Date.now();
    if (now - lastTouchTime < touchCooldown) return;
    lastTouchTime = now;
    
    event.preventDefault();
    const rect = gameArea.getBoundingClientRect();
    const touch = event.touches[0] || event.changedTouches[0];
    const touchX = touch.clientX - rect.left;
    const touchY = touch.clientY - rect.top;
    
    snowballsLeft--;
    totalShots++;
    updateSnowballsLeft();
    
    animateThrow();
    createSnowballFromCenter(touchX, touchY);
}

// Создание снежка, который летит из центра снизу
function createSnowballFromCenter(targetX, targetY) {
    const snowball = document.createElement('div');
    snowball.className = 'snowball';
    
    const size = Math.max(18, Math.min(22, gameWidth / 20));
    snowball.style.width = `${size}px`;
    snowball.style.height = `${size}px`;
    
    const startX = throwerX - size/2;
    const startY = throwerY - size/2;
    
    snowball.style.left = `${startX}px`;
    snowball.style.top = `${startY}px`;
    
    snowball.style.animation = 'snowballSpin 1s linear infinite';
    
    gameArea.appendChild(snowball);
    
    const dx = targetX - startX;
    const dy = targetY - startY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const speed = 0.6 * Math.min(currentSpeed, 1.5);
    const duration = distance / speed;
    
    const directionX = dx / distance;
    const directionY = dy / distance;
    
    let startTime = null;
    let lastTrailTime = 0;
    let lastX = startX + size/2;
    let lastY = startY + size/2;
    let hitDetected = false;
    let hitFire = null;
    let hitIndex = -1;
    
    const snowballObj = {
        element: snowball,
        x: startX,
        y: startY,
        size: size,
        active: true
    };
    
    activeSnowballs.push(snowballObj);
    
    function animateSnowball(timestamp) {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        
        if (elapsed > duration || !gameActive || gamePaused || hitDetected) {
            if (!hitDetected) {
                showMissMessage(targetX, targetY);
            }
            
            setTimeout(() => {
                if (snowball.parentNode) {
                    snowball.remove();
                }
                const index = activeSnowballs.indexOf(snowballObj);
                if (index > -1) {
                    activeSnowballs.splice(index, 1);
                }
            }, 100);
            
            updateAccuracy();
            checkGameOver();
            return;
        }
        
        const currentX = startX + directionX * speed * elapsed;
        const currentY = startY + directionY * speed * elapsed;
        const currentCenterX = currentX + size/2;
        const currentCenterY = currentY + size/2;
        
        snowballObj.x = currentX;
        snowballObj.y = currentY;
        
        snowball.style.left = `${currentX}px`;
        snowball.style.top = `${currentY}px`;
        
        const snowGlow = 0.9 + 0.1 * Math.sin(elapsed / 30);
        snowball.style.opacity = snowGlow;
        
        if (elapsed - lastTrailTime > 60) {
            createTrail(currentCenterX, currentCenterY);
            lastTrailTime = elapsed;
        }
        
        // Проверка столкновений с ОГРОМНЫМ хитбоксом
        if (!hitDetected) {
            for (let i = 0; i < fires.length; i++) {
                const fire = fires[i];
                if (fire.hit) continue;
                
                // Используем ОГРОМНЫЙ хитбокс (в 3 раза больше эмодзи)
                if (checkLineHitboxCollision(
                    lastX, lastY, 
                    currentCenterX, currentCenterY,
                    fire.hitboxX, fire.hitboxY,
                    fire.hitboxSize
                )) {
                    hitDetected = true;
                    hitFire = fire;
                    hitIndex = i;
                    
                    successfulShots++;
                    hitFire.hit = true;
                    
                    score += POINTS_PER_FIRE;
                    updateScore();
                    
                    showHitMessage(currentCenterX, currentCenterY, POINTS_PER_FIRE);
                    
                    setTimeout(() => {
                        if (hitFire.element.parentNode) {
                            createSnowExtinguishEffect(hitFire);
                            setTimeout(() => {
                                if (hitFire.element.parentNode) {
                                    hitFire.element.remove();
                                }
                                if (hitFire.hitbox.parentNode) {
                                    hitFire.hitbox.remove();
                                }
                            }, 400);
                        }
                        fires.splice(hitIndex, 1);
                        updateFiresCount();
                        updateWarningMessage();
                    }, 100);
                    
                    if (score >= WIN_SCORE) {
                        winGame();
                        return;
                    }
                    break;
                }
            }
        }
        
        lastX = currentCenterX;
        lastY = currentCenterY;
        
        requestAnimationFrame(animateSnowball);
    }
    
    requestAnimationFrame(animateSnowball);
}

// Создание эффекта тушения огонька снежком
function createSnowExtinguishEffect(fire) {
    const steam = document.createElement('div');
    steam.style.position = 'absolute';
    steam.style.width = `${fire.hitboxSize * 1.5}px`;
    steam.style.height = `${fire.hitboxSize * 1.5}px`;
    steam.style.left = `${fire.hitboxX - fire.hitboxSize * 0.25}px`;
    steam.style.top = `${fire.hitboxY - fire.hitboxSize * 0.25}px`;
    steam.style.borderRadius = '50%';
    steam.style.background = 'radial-gradient(circle at center, rgba(200, 230, 255, 0.9), transparent 70%)';
    steam.style.zIndex = '11';
    steam.style.animation = 'fadeUp 0.6s forwards';
    
    gameArea.appendChild(steam);
    
    fire.element.innerHTML = '💨';
    fire.element.style.color = '#aaa';
    fire.element.style.textShadow = '0 0 5px rgba(150, 150, 150, 0.5)';
    fire.element.style.transform = 'scale(0.8)';
    
    setTimeout(() => {
        if (steam.parentNode) {
            steam.remove();
        }
    }, 600);
}

// Показать сообщение о промахе
function showMissMessage(x, y) {
    const missMsg = document.createElement('div');
    missMsg.className = 'miss-message';
    missMsg.textContent = 'Промах!';
    missMsg.style.left = `${x}px`;
    missMsg.style.top = `${y}px`;
    
    gameArea.appendChild(missMsg);
    
    setTimeout(() => {
        if (missMsg.parentNode) {
            missMsg.remove();
        }
    }, 1000);
}

// Показать сообщение о попадании
function showHitMessage(x, y, points) {
    const hitMsg = document.createElement('div');
    hitMsg.className = 'hit-message';
    hitMsg.textContent = `+${points}!`;
    hitMsg.style.left = `${x}px`;
    hitMsg.style.top = `${y}px`;
    
    createSnowflakesEffect(x, y);
    
    gameArea.appendChild(hitMsg);
    
    setTimeout(() => {
        if (hitMsg.parentNode) {
            hitMsg.remove();
        }
    }, 1500);
}

// Создание эффекта снежинок при попадании
function createSnowflakesEffect(x, y) {
    for (let i = 0; i < 4; i++) {
        const snowflake = document.createElement('div');
        snowflake.style.position = 'absolute';
        snowflake.style.width = '6px';
        snowflake.style.height = '6px';
        snowflake.style.left = `${x}px`;
        snowflake.style.top = `${y}px`;
        snowflake.style.borderRadius = '50%';
        snowflake.style.background = 'radial-gradient(circle, white, #b3e0ff)';
        snowflake.style.zIndex = '12';
        snowflake.style.boxShadow = '0 0 3px white';
        
        gameArea.appendChild(snowflake);
        
        const angle = (i / 4) * Math.PI * 2;
        const speed = 0.7 + Math.random() * 1.2;
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;
        
        let opacity = 1;
        const snowflakeInterval = setInterval(() => {
            x += vx;
            y += vy;
            opacity -= 0.04;
            
            snowflake.style.left = `${x}px`;
            snowflake.style.top = `${y}px`;
            snowflake.style.opacity = opacity;
            
            if (opacity <= 0) {
                clearInterval(snowflakeInterval);
                if (snowflake.parentNode) {
                    snowflake.remove();
                }
            }
        }, 30);
    }
}

// Обновление прогресса
function updateProgress() {
    const progressPercent = Math.min(100, (score / WIN_SCORE) * 100);
    progressFill.style.width = `${progressPercent}%`;
    
    if (progressPercent >= 90) {
        progressFill.style.background = 'linear-gradient(90deg, #36ff5f, #2adb8f)';
    } else if (progressPercent >= 70) {
        progressFill.style.background = 'linear-gradient(90deg, #36b1ff, #2a8fdb)';
    } else if (progressPercent >= 50) {
        progressFill.style.background = 'linear-gradient(90deg, #5bc0ff, #36b1ff)';
    } else {
        progressFill.style.background = 'linear-gradient(90deg, #36b1ff, #2a8fdb)';
    }
    
    // Обновляем скорость только если игра активна
    if (gameActive) {
        updateGameSpeed();
    }
}

// Проверка условий окончания игры
function checkGameOver() {
    if (fires.length >= MAX_FIRES) {
        loseReasonElement.textContent = "Слишком много огоньков на поле!";
        endGame(false);
        return;
    }
    
    if (snowballsLeft <= 0 && fires.length > 0) {
        loseReasonElement.textContent = "Закончились снежки!";
        endGame(false);
        return;
    }
    
    if (snowballsLeft <= 0) {
        loseReasonElement.textContent = "Закончились снежки!";
        endGame(false);
    }
}

// Победа в игре
function winGame() {
    gameActive = false;
    if (fireInterval) {
        clearInterval(fireInterval);
        fireInterval = null;
    }
    
    activeSnowballs.forEach(snowball => {
        snowball.active = false;
    });
    
    // Скрываем стандартное окно окончания игры
    gameOverScreen.style.display = 'none';
    
    // Показываем кастомное модальное окно победы
    winModalOverlay.style.display = 'flex';
}

// Окончание игры (проигрыш)
function endGame(isWin = false) {
    gameActive = false;
    if (fireInterval) {
        clearInterval(fireInterval);
        fireInterval = null;
    }
    
    activeSnowballs.forEach(snowball => {
        snowball.active = false;
    });
    
    // Скрываем модальное окно победы если оно было показано
    winModalOverlay.style.display = 'none';
    
    if (!isWin) {
        gameOverTitle.textContent = "Игра окончена!";
        gameOverScreen.classList.remove('win');
        finalScoreElement.textContent = `Вы набрали ${score} очков`;
        finalAccuracyElement.textContent = `Точность: ${accuracy}%`;
        finalSpeedElement.textContent = `Максимальная скорость: ${maxSpeed.toFixed(1)}x`;
        gameOverScreen.style.display = 'flex';
    }
}

// Начало игры
function startGame() {
    // Закрываем стартовое модальное окно
    startModalOverlay.style.display = 'none';
    
    // Останавливаем предыдущую игру, если она запущена
    if (gameActive) {
        if (fireInterval) {
            clearInterval(fireInterval);
            fireInterval = null;
        }
        gameActive = false;
    }
    
    // Сбрасываем все переменные
    score = 0;
    fires = [];
    snowballsLeft = 50;
    gameTime = 0;
    totalShots = 0;
    successfulShots = 0;
    accuracy = 100;
    activeSnowballs = [];
    currentSpeed = 1.0; // Сбрасываем скорость до 1.0
    maxSpeed = 1.0;
    
    updateGameAreaSize();
    
    // Удаляем все существующие элементы
    const existingFires = document.querySelectorAll('.fire-emoji, .fire-hitbox');
    existingFires.forEach(fire => fire.remove());
    
    const existingSnowballs = document.querySelectorAll('.snowball');
    existingSnowballs.forEach(snowball => snowball.remove());
    
    const existingMessages = document.querySelectorAll('.miss-message, .hit-message, .win-message, .snowball-trail');
    existingMessages.forEach(msg => msg.remove());
    
    // Сбрасываем индикатор скорости
    speedIndicator.textContent = 'Скорость: 1x';
    speedIndicator.style.display = 'none';
    speedIndicator.style.color = '#36b1ff';
    speedIndicator.style.borderColor = '#2a8fdb';
    
    updateScore();
    updateFiresCount();
    updateSnowballsLeft();
    updateAccuracy();
    updateProgress();
    
    gameOverScreen.style.display = 'none';
    gameOverScreen.classList.remove('win');
    warningMessage.style.display = 'none';
    
    gameActive = true;
    gamePaused = false;
    pauseButton.textContent = 'Пауза';
    
    createSnowEffect();
    
    // Запускаем создание огоньков с базовым интервалом
    // Исправлено: ясно сбрасываем интервал
    if (fireInterval) {
        clearInterval(fireInterval);
    }
    fireInterval = setInterval(createFire, BASE_SPAWN_INTERVAL);
    
    // Создаем первый огонек через небольшое время
    setTimeout(() => {
        if (gameActive && !gamePaused) {
            createFire();
        }
    }, 500);
}

// Пауза/возобновление игры
function togglePause() {
    if (!gameActive) return;
    
    gamePaused = !gamePaused;
    pauseButton.textContent = gamePaused ? 'Продолжить' : 'Пауза';
    
    if (gamePaused) {
        if (fireInterval) {
            clearInterval(fireInterval);
            fireInterval = null;
        }
    } else {
        // При возобновлении игры используем текущую скорость
        const spawnInterval = Math.max(350, BASE_SPAWN_INTERVAL / currentSpeed);
        fireInterval = setInterval(createFire, spawnInterval);
    }
}

// Обновление счета
function updateScore() {
    scoreElement.textContent = score;
    
    if (score >= WIN_SCORE * 0.8) {
        scoreElement.style.color = '#2a8fdb';
        scoreElement.style.textShadow = '0 0 10px rgba(42, 143, 219, 0.4)';
    } else if (score >= WIN_SCORE * 0.6) {
        scoreElement.style.color = '#36b1ff';
    } else if (score >= WIN_SCORE * 0.3) {
        scoreElement.style.color = '#5bc0ff';
    } else {
        scoreElement.style.color = '#2a8fdb';
    }
    
    updateProgress();
}

// Обновление количества огоньков
function updateFiresCount() {
    firesCountElement.textContent = fires.length;
    
    if (fires.length >= 8) {
        firesCountElement.style.color = '#ff6b6b';
    } else if (fires.length >= 5) {
        firesCountElement.style.color = '#ffa726';
    } else {
        firesCountElement.style.color = '#2a8fdb';
    }
}

// Обновление количества снежков
function updateSnowballsLeft() {
    snowballsLeftElement.textContent = snowballsLeft;
    
    if (snowballsLeft <= 10) {
        snowballsLeftElement.style.color = '#ff6b6b';
    } else if (snowballsLeft <= 25) {
        snowballsLeftElement.style.color = '#ffa726';
    } else {
        snowballsLeftElement.style.color = '#2a8fdb';
    }
}

// Обновление точности
function updateAccuracy() {
    if (totalShots > 0) {
        accuracy = Math.round((successfulShots / totalShots) * 100);
    } else {
        accuracy = 100;
    }
    accuracyElement.textContent = `${accuracy}%`;
    
    if (accuracy >= 80) {
        accuracyElement.style.color = '#2a8fdb';
    } else if (accuracy >= 60) {
        accuracyElement.style.color = '#36b1ff';
    } else if (accuracy >= 40) {
        accuracyElement.style.color = '#5bc0ff';
    } else {
        accuracyElement.style.color = '#ff6b6b';
    }
}

// Инициализация игры
function init() {
    startButton.addEventListener('click', startGame);
    pauseButton.addEventListener('click', togglePause);
    restartButton.addEventListener('click', startGame);
    
    // Новые обработчики для модальных окон
    startModalButton.addEventListener('click', startGame);
    nextLevelButton.addEventListener('click', function() {
        winModalOverlay.style.display = 'none';
        startGame();
    });
    
    // Добавляем обработчики для тач-событий
    gameArea.addEventListener('touchstart', handleTouch);
    gameArea.addEventListener('touchmove', function(e) {
        if (gameActive && !gamePaused) {
            e.preventDefault();
        }
    });
    gameArea.addEventListener('touchend', function(e) {
        if (gameActive && !gamePaused) {
            e.preventDefault();
        }
    });
    
    // Добавляем обработчик для клика мышью
    gameArea.addEventListener('click', handleGameAreaClick);
    
    // Обновляем размеры при изменении окна
    window.addEventListener('resize', function() {
        updateGameAreaSize();
        createSnowEffect();
    });
    
    // Инициализируем размеры и эффекты
    updateGameAreaSize();
    createSnowEffect();
    updateScore();
    updateFiresCount();
    updateSnowballsLeft();
    updateAccuracy();
    updateProgress();
    
    // Скрываем кнопку "Начать игру" в controls
    startButton.style.display = 'none';
}

// Запускаем игру при загрузке страницы
window.addEventListener('load', init);