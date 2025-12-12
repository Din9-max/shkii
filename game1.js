// Конфигурация игры
const config = {
    rows: 4,
    cols: 4,
    totalPieces: 16
};

// Картинки для пазлов (больше картинок для уровней)
const puzzleImages = [
    {
        id: 1,
        name: "Новогодняя ёлка",
        url: "image/pazzl_1.jpg",
       
    },
    {
        id: 2,
        name: "Санта Клаус",
        url: "image/pazzl_2.jpg"
       
    },
    {
        id: 3,
        name: "Новогодний венок",
        url: "image/pazzl_3.jpg"
    
    },
   
];

// Состояние игры
const gameState = {
    time: 0,
    timer: null,
    connectedPieces: 0,
    isPlaying: false,
    puzzlePieces: [],
    pieceGroups: [],
    draggedGroup: null,
    assemblyArea: {
        x: 0,
        y: 0,
        width: 0,
        height: 0
    },
    piecePositions: {},
    isCompleted: false,
    gridCells: [],
    currentImageIndex: 0,
    fireworksInterval: null,
    isFireworksActive: false,
    currentLevel: 1,
    usedImages: new Set(),
    isFirstLoad: true,
    isLoading: true,
    loadingProgress: 0
};

// Элементы DOM
const gameBoard = document.getElementById('game-board');
const gameBoardContainer = document.querySelector('.game-board-container');
const timeElement = document.getElementById('time');
const connectedElement = document.getElementById('connected');
const winMessage = document.getElementById('win-message');
const winTimeElement = document.getElementById('win-time');
const winLevelElement = document.getElementById('win-level');
const closeWinButton = document.getElementById('close-win');
const changeImageBtn = document.getElementById('change-image-btn');
const referenceImage = document.getElementById('reference-image');
const assemblyGrid = document.getElementById('assembly-grid');
const snowContainer = document.getElementById('snow');
const assemblyArea = document.getElementById('assembly-area');
const currentLevelElement = document.getElementById('current-level');
const instructionModal = document.getElementById('instruction-modal');
const startGameBtn = document.getElementById('start-game-btn');
const loadingScreen = document.getElementById('loading-screen');
const loadingImage = document.getElementById('loading-image');
const progressFill = document.getElementById('progress-fill');
const progressText = document.getElementById('progress-text');

// Функция обновления прогресса загрузки
function updateLoadingProgress(progress) {
    gameState.loadingProgress = Math.min(progress, 100);
    progressFill.style.width = `${gameState.loadingProgress}%`;
    progressText.textContent = `${Math.round(gameState.loadingProgress)}%`;
}

// Функция имитации загрузки
async function simulateLoading() {
    updateLoadingProgress(0);
    
    // Имитация загрузки в несколько этапов
    await delay(300);
    updateLoadingProgress(10);
    
    await delay(200);
    updateLoadingProgress(25);
    
    // Загрузка снега
    createSnow();
    updateLoadingProgress(40);
    
    await delay(300);
    updateLoadingProgress(60);
    
    // Выбор картинки
    selectImageForLevel();
    updateLoadingProgress(75);
    
    await delay(200);
    updateLoadingProgress(85);
    
    // Предварительная инициализация
    await preloadGame();
    updateLoadingProgress(95);
    
    await delay(100);
    updateLoadingProgress(100);
    
    // Завершение загрузки
    await delay(500);
    hideLoadingScreen();
}

// Функция задержки
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Предзагрузка игры
async function preloadGame() {
    // Создаем сетку
    createGrid();
    
    // Создаем элементы пазла (но не показываем)
    createPuzzlePieces();
    
    // Обновляем статистику
    updateStats();
    
    // Восстанавливаем видимость сетки
    assemblyGrid.classList.remove('hidden');
    const gridLines = assemblyGrid.querySelectorAll('.grid-line');
    gridLines.forEach(line => line.classList.remove('hidden'));
    
    // Обновляем отображение уровня
    currentLevelElement.textContent = gameState.currentLevel;
    
    // Сбрасываем счетчик соединенных деталей
    gameState.connectedPieces = 0;
    connectedElement.textContent = `${gameState.connectedPieces}/${config.totalPieces}`;
}

// Скрыть экран загрузки
function hideLoadingScreen() {
    loadingScreen.classList.add('hidden');
    gameState.isLoading = false;
    
    // Показываем инструкцию после загрузки
    if (gameState.isFirstLoad) {
        showInstruction();
    } else {
        // Если это не первая загрузка, сразу начинаем игру
        initGame();
    }
}

// Показать инструкцию при загрузке
function showInstruction() {
    instructionModal.classList.remove('hidden');
    gameState.isPlaying = false;
    
    // Останавливаем таймер если он был запущен
    if (gameState.timer) {
        clearInterval(gameState.timer);
        gameState.timer = null;
    }
}

// Скрыть инструкцию и начать игру
function startGameFromModal() {
    instructionModal.classList.add('hidden');
    gameState.isFirstLoad = false;
    
    // Запускаем игру
    initGame();
}

// Инициализация игры
function initGame() {
    resetGameState();
    createGrid();
    createPuzzlePieces();
    updateStats();
    startTimer();
    gameState.isPlaying = true;
    gameState.isCompleted = false;
   
    // Восстанавливаем видимость сетки
    assemblyGrid.classList.remove('hidden');
    const gridLines = assemblyGrid.querySelectorAll('.grid-line');
    gridLines.forEach(line => line.classList.remove('hidden'));
   
    // Обновляем отображение уровня
    currentLevelElement.textContent = gameState.currentLevel;
    
    // Сбрасываем счетчик соединенных деталей
    gameState.connectedPieces = 0;
    connectedElement.textContent = `${gameState.connectedPieces}/${config.totalPieces}`;
}

// Выбор картинки для уровня
function selectImageForLevel() {
    // Если использовали все картинки, сбрасываем список использованных
    if (gameState.usedImages.size >= puzzleImages.length) {
        gameState.usedImages.clear();
    }
   
    // Выбираем случайную неиспользованную картинку
    let availableImages = [];
    for (let i = 0; i < puzzleImages.length; i++) {
        if (!gameState.usedImages.has(i)) {
            availableImages.push(i);
        }
    }
   
    if (availableImages.length === 0) {
        // Если все картинки использованы, сбрасываем
        gameState.usedImages.clear();
        availableImages = Array.from({length: puzzleImages.length}, (_, i) => i);
    }
   
    const randomIndex = Math.floor(Math.random() * availableImages.length);
    gameState.currentImageIndex = availableImages[randomIndex];
    gameState.usedImages.add(gameState.currentImageIndex);
   
    // Обновляем образец для сборки
    referenceImage.src = puzzleImages[gameState.currentImageIndex].url;
}

// Смена картинки пазла
function changePuzzleImage() {
    // Останавливаем таймер
    if (gameState.timer) {
        clearInterval(gameState.timer);
        gameState.timer = null;
    }
   
    // Останавливаем салют если он активен
    if (gameState.fireworksInterval) {
        clearInterval(gameState.fireworksInterval);
        gameState.fireworksInterval = null;
        gameState.isFireworksActive = false;
    }
   
    // Выбираем случайную картинку, отличную от текущей
    let newIndex;
    do {
        newIndex = Math.floor(Math.random() * puzzleImages.length);
    } while (newIndex === gameState.currentImageIndex && puzzleImages.length > 1);
   
    // Обновляем текущую картинку
    gameState.currentImageIndex = newIndex;
   
    // Обновляем образец для сборки
    referenceImage.src = puzzleImages[gameState.currentImageIndex].url;
   
    // Перезапускаем игру с новой картинкой БЕЗ инструкции
    resetGameState();
    createGrid();
    createPuzzlePieces();
    updateStats();
    startTimer();
    gameState.isPlaying = true;
    gameState.isCompleted = false;
   
    // Восстанавливаем видимость сетки
    assemblyGrid.classList.remove('hidden');
    const gridLines = assemblyGrid.querySelectorAll('.grid-line');
    gridLines.forEach(line => line.classList.remove('hidden'));
}

// Создание сетки 4x4
function createGrid() {
    assemblyGrid.innerHTML = '';
   
    // Создаем 16 ячеек для сетки 4x4
    for (let i = 0; i < 16; i++) {
        const cell = document.createElement('div');
        cell.className = 'grid-line';
        assemblyGrid.appendChild(cell);
    }
   
    // Динамически вычисляем размеры в зависимости от экрана
    const boardWidth = gameBoard.offsetWidth;
    const boardHeight = gameBoard.offsetHeight;
   
    // Размер области сборки (70% от минимальной стороны для мобильных)
    const minSide = Math.min(boardWidth, boardHeight);
    const assemblySize = Math.min(400, minSide * 0.7);
   
    // Обновляем размер области сборки
    assemblyArea.style.width = `${assemblySize}px`;
    assemblyArea.style.height = `${assemblySize}px`;
   
    // Обновляем конфигурацию размера пазлов
    config.size = assemblySize / config.cols;
   
    // Обновляем позиции в состоянии
    gameState.assemblyArea.width = assemblySize;
    gameState.assemblyArea.height = assemblySize;
   
    // Пересчитываем позицию области сборки
    updateAssemblyAreaPosition();
}

// Обновление позиции области сборки
function updateAssemblyAreaPosition() {
    const boardRect = gameBoard.getBoundingClientRect();
    
    // Позиционируем область сборки точно по центру
    gameState.assemblyArea.x = (boardRect.width - gameState.assemblyArea.width) / 2;
    gameState.assemblyArea.y = (boardRect.height - gameState.assemblyArea.height) / 2;
}

// Сброс состояния игры
function resetGameState() {
    gameState.time = 0;
    gameState.connectedPieces = 0;
    gameState.puzzlePieces = [];
    gameState.pieceGroups = [];
    gameState.draggedGroup = null;
    gameState.piecePositions = {};
    gameState.isCompleted = false;
    gameState.gridCells = [];
   
    // Очистка игрового поля (оставляем только область сборки)
    gameBoard.innerHTML = '';
    gameBoard.appendChild(assemblyArea);
    
    // Убираем рамку завершения, если она есть
    const oldBorder = document.querySelector('.completed-border');
    if (oldBorder) oldBorder.remove();
}

// Создание элементов пазла
function createPuzzlePieces() {
    const { rows, cols } = config;
    const pieceSize = config.size;
    const currentImage = puzzleImages[gameState.currentImageIndex];
   
    // Размеры игрового поля
    const boardWidth = gameBoard.offsetWidth;
    const boardHeight = gameBoard.offsetHeight;
   
    // Создание массива с позициями
    const positions = [];
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            positions.push({ row, col, id: `${row}-${col}` });
        }
    }
   
    // Перемешивание позиций
    shuffleArray(positions);
   
    // Массив для отслеживания занятых позиций
    const occupiedPositions = [];
   
    // Создание элементов пазла
    positions.forEach((pos, index) => {
        const piece = document.createElement('div');
        piece.className = 'puzzle-piece';
        piece.dataset.row = pos.row;
        piece.dataset.col = pos.col;
        piece.dataset.id = pos.id;
        piece.dataset.index = index;
        piece.dataset.placed = 'false';
        piece.dataset.group = `group-${index}`;
       
        // Установка фонового изображения
        const bgX = -pos.col * pieceSize;
        const bgY = -pos.row * pieceSize;
       
        piece.style.width = `${pieceSize}px`;
        piece.style.height = `${pieceSize}px`;
        piece.style.backgroundImage = `url('${currentImage.url}')`;
        piece.style.backgroundPosition = `${bgX}px ${bgY}px`;
        piece.style.backgroundSize = `${pieceSize * cols}px ${pieceSize * rows}px`;
       
        // Упрощенный алгоритм размещения пазлов
        let x, y;
        let attempts = 0;
        const maxAttempts = 100;
       
        do {
            // Случайные координаты, но гарантируем, что пазл будет виден
            // Размещаем пазлы по краям игрового поля
            const side = Math.floor(Math.random() * 4);
            const padding = 10; // Минимальный отступ от края
           
            switch(side) {
                case 0: // Слева
                    x = padding;
                    y = Math.random() * (boardHeight - pieceSize - padding) + padding;
                    break;
                case 1: // Справа
                    x = boardWidth - pieceSize - padding;
                    y = Math.random() * (boardHeight - pieceSize - padding) + padding;
                    break;
                case 2: // Сверху
                    x = Math.random() * (boardWidth - pieceSize - padding) + padding;
                    y = padding;
                    break;
                case 3: // Снизу
                    x = Math.random() * (boardWidth - pieceSize - padding) + padding;
                    y = boardHeight - pieceSize - padding;
                    break;
            }
           
            attempts++;
           
            // Проверяем, не перекрывает ли эта позиция другие пазлы
            const overlaps = occupiedPositions.some(occupied => {
                return Math.abs(occupied.x - x) < pieceSize * 0.8 && Math.abs(occupied.y - y) < pieceSize * 0.8;
            });
           
            if (!overlaps || attempts >= maxAttempts) {
                break;
            }
        } while (true);
       
        // Сохраняем позицию как занятую
        occupiedPositions.push({ x, y });
       
        piece.style.left = `${x}px`;
        piece.style.top = `${y}px`;
       
        // Сохраняем начальную позицию
        gameState.piecePositions[pos.id] = { x, y, row: pos.row, col: pos.col };
       
        // Добавление обработчиков для перетаскивания
        piece.setAttribute('draggable', 'true');
        piece.addEventListener('dragstart', handleDragStart);
        piece.addEventListener('dragend', handleDragEnd);
       
        // Добавляем обработчики для сенсорных устройств
        piece.addEventListener('touchstart', handleTouchStart, { passive: false });
        piece.addEventListener('touchmove', handleTouchMove, { passive: false });
        piece.addEventListener('touchend', handleTouchEnd);
       
        gameBoard.appendChild(piece);
        gameState.puzzlePieces.push(piece);
       
        // Каждая деталь в своей группе
        createPieceGroup([piece]);
    });
}

// Создание группы для детали
function createPieceGroup(pieces) {
    const groupId = pieces[0].dataset.group;
   
    // Создаем объект группы
    const group = {
        id: groupId,
        pieces: pieces,
        positions: pieces.map(piece => {
            const rect = piece.getBoundingClientRect();
            const boardRect = gameBoard.getBoundingClientRect();
            return {
                element: piece,
                startX: rect.left - boardRect.left,
                startY: rect.top - boardRect.top,
                row: parseInt(piece.dataset.row),
                col: parseInt(piece.dataset.col)
            };
        })
    };
   
    gameState.pieceGroups.push(group);
    return group;
}

// Поиск группы по детали
function findGroupByPiece(piece) {
    const groupId = piece.dataset.group;
    return gameState.pieceGroups.find(group => group.id === groupId);
}

// Объединение двух групп - ИСПРАВЛЕННАЯ ВЕРСИЯ
function mergeGroups(group1, group2) {
    if (group1.id === group2.id) return group1;
   
    // Сохраняем текущее количество правильно размещенных деталей
    const placedBeforeGroup1 = group1.pieces.filter(p => p.dataset.placed === 'true').length;
    const placedBeforeGroup2 = group2.pieces.filter(p => p.dataset.placed === 'true').length;
   
    // Объединяем детали
    const mergedPieces = [...group1.pieces, ...group2.pieces];
   
    // Обновляем данные у всех деталей
    mergedPieces.forEach(piece => {
        piece.dataset.group = group1.id;
        piece.classList.add('connected');
       
        // Если деталь правильно размещена, запрещаем перетаскивание
        if (piece.dataset.placed === 'true') {
            lockPieceInPlace(piece);
        }
    });
   
    // Обновляем группу
    group1.pieces = mergedPieces;
    group1.positions = [...group1.positions, ...group2.positions];
   
    // Удаляем вторую группу
    const group2Index = gameState.pieceGroups.indexOf(group2);
    if (group2Index > -1) {
        gameState.pieceGroups.splice(group2Index, 1);
    }
   
    // Анимация соединения
    showConnectionAnimation(group1);
   
    // Вычисляем новое количество правильно размещенных деталей
    const placedAfter = mergedPieces.filter(p => p.dataset.placed === 'true').length;
    
    // Обновляем счетчик соединенных деталей
    gameState.connectedPieces = placedAfter;
    connectedElement.textContent = `${gameState.connectedPieces}/${config.totalPieces}`;
   
    return group1;
}

// Зафиксировать пазл на месте - ИСПРАВЛЕННАЯ ВЕРСИЯ
function lockPieceInPlace(piece) {
    if (piece.classList.contains('correct')) return; // Уже зафиксирован
    
    piece.classList.add('correct');
    piece.setAttribute('draggable', 'false');
    piece.style.pointerEvents = 'none';
   
    // Точные координаты
    const pieceRow = parseInt(piece.dataset.row);
    const pieceCol = parseInt(piece.dataset.col);
    const pieceSize = config.size;
   
    // Правильные координаты внутри области сборки
    const correctX = gameState.assemblyArea.x + pieceCol * pieceSize;
    const correctY = gameState.assemblyArea.y + pieceRow * pieceSize;
   
    // Устанавливаем точные координаты
    piece.style.left = `${correctX}px`;
    piece.style.top = `${correctY}px`;
    piece.style.transform = 'none';
    piece.style.position = 'absolute';
   
    // Убираем все трансформации и эффекты перетаскивания
    piece.classList.remove('dragging');
   
    // Убедимся, что пазл помечен как правильно размещенный
    piece.dataset.placed = 'true';
}

// Показать анимацию соединения
function showConnectionAnimation(group) {
    // Вычисляем границы группы
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
   
    group.pieces.forEach(piece => {
        const rect = piece.getBoundingClientRect();
        minX = Math.min(minX, rect.left);
        maxX = Math.max(maxX, rect.right);
        minY = Math.min(minY, rect.top);
        maxY = Math.max(maxY, rect.bottom);
    });
   
    // Создаем элемент анимации
    const animation = document.createElement('div');
    animation.className = 'connection-animation';
    animation.style.position = 'absolute';
    animation.style.left = `${minX}px`;
    animation.style.top = `${minY}px`;
    animation.style.width = `${maxX - minX}px`;
    animation.style.height = `${maxY - minY}px`;
    animation.style.borderRadius = '5px';
   
    gameBoard.appendChild(animation);
   
    // Удаляем анимацию после завершения
    setTimeout(() => {
        animation.remove();
    }, 500);
}

// Функция для безопасного обновления счетчика
function updateConnectedCounter() {
    // Пересчитываем правильно размещенные пазлы из всех групп
    let totalPlaced = 0;
    gameState.pieceGroups.forEach(group => {
        totalPlaced += group.pieces.filter(p => p.dataset.placed === 'true').length;
    });
    
    // Обновляем состояние только если счетчик увеличился
    if (totalPlaced > gameState.connectedPieces) {
        gameState.connectedPieces = totalPlaced;
        connectedElement.textContent = `${gameState.connectedPieces}/${config.totalPieces}`;
    }
}

// Проверка соединения деталей - ИСПРАВЛЕННАЯ ВЕРСИЯ
function checkAndConnectPieces() {
    if (gameState.isCompleted) return;
   
    const pieceSize = config.size;
    const tolerance = pieceSize * 0.25;
   
    // Проверяем все группы
    for (let i = 0; i < gameState.pieceGroups.length; i++) {
        for (let j = i + 1; j < gameState.pieceGroups.length; j++) {
            const group1 = gameState.pieceGroups[i];
            const group2 = gameState.pieceGroups[j];
           
            // Проверяем все пары деталей между группами
            for (const pos1 of group1.positions) {
                for (const pos2 of group2.positions) {
                    // Проверяем, являются ли детали соседями
                    const rowDiff = Math.abs(pos1.row - pos2.row);
                    const colDiff = Math.abs(pos1.col - pos2.col);
                   
                    // Детали являются соседями, если разница в строке или столбце равна 1
                    const areNeighbors = (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
                   
                    if (areNeighbors) {
                        // Проверяем правильность позиций
                        const expectedX1 = gameState.assemblyArea.x + pos1.col * pieceSize;
                        const expectedY1 = gameState.assemblyArea.y + pos1.row * pieceSize;
                        const expectedX2 = gameState.assemblyArea.x + pos2.col * pieceSize;
                        const expectedY2 = gameState.assemblyArea.y + pos2.row * pieceSize;
                       
                        const actualX1 = pos1.startX;
                        const actualY1 = pos1.startY;
                        const actualX2 = pos2.startX;
                        const actualY2 = pos2.startY;
                       
                        const piece1Correct =
                            Math.abs(actualX1 - expectedX1) <= tolerance &&
                            Math.abs(actualY1 - expectedY1) <= tolerance &&
                            pos1.element.dataset.placed === 'true';
                           
                        const piece2Correct =
                            Math.abs(actualX2 - expectedX2) <= tolerance &&
                            Math.abs(actualY2 - expectedY2) <= tolerance &&
                            pos2.element.dataset.placed === 'true';
                       
                        if (piece1Correct && piece2Correct) {
                            // Объединяем группы
                            mergeGroups(group1, group2);
                           
                            // Обновляем счетчик после объединения
                            updateConnectedCounter();
                           
                            // После объединения проверяем, собрана ли вся картинка
                            if (gameState.pieceGroups.length === 1 &&
                                gameState.pieceGroups[0].pieces.length === config.totalPieces) {
                                // Дополнительная проверка - все ли детали правильно размещены
                                const allPlaced = gameState.pieceGroups[0].pieces.every(p => p.dataset.placed === 'true');
                                if (allPlaced) {
                                    completePuzzle();
                                }
                            }
                           
                            return;
                        }
                    }
                }
            }
        }
    }
}

// Проверка позиции детали - ИСПРАВЛЕННАЯ ВЕРСИЯ
function checkPiecePosition(piece) {
    if (gameState.isCompleted || 
        piece.classList.contains('correct') || 
        piece.dataset.placed === 'true') return;
   
    const pieceRow = parseInt(piece.dataset.row);
    const pieceCol = parseInt(piece.dataset.col);
    const pieceSize = config.size;
   
    // Вычисляем правильную позицию для этой ячейки сетки
    const correctX = gameState.assemblyArea.x + pieceCol * pieceSize;
    const correctY = gameState.assemblyArea.y + pieceRow * pieceSize;
   
    // Текущая позиция пазла
    const rect = piece.getBoundingClientRect();
    const boardRect = gameBoard.getBoundingClientRect();
    const currentX = rect.left - boardRect.left;
    const currentY = rect.top - boardRect.top;
   
    // Точность размещения (допуск) - адаптивный
    const tolerance = pieceSize * 0.3;
   
    // Проверяем, находится ли пазл в правильной ячейке
    const isCorrectPosition =
        Math.abs(currentX - correctX) <= tolerance &&
        Math.abs(currentY - correctY) <= tolerance;
   
    if (isCorrectPosition) {
        // Размещаем деталь точно на правильной позиции
        piece.style.left = `${correctX}px`;
        piece.style.top = `${correctY}px`;
        piece.dataset.placed = 'true';
       
        // Фиксируем пазл на месте
        lockPieceInPlace(piece);
       
        // Обновляем счетчик соединенных деталей
        gameState.connectedPieces++;
        connectedElement.textContent = `${gameState.connectedPieces}/${config.totalPieces}`;
       
        // Немедленная проверка соединений
        setTimeout(() => {
            checkAndConnectPieces();
        }, 10);
    }
}

// Создание снега
function createSnow() {
    for (let i = 0; i < 50; i++) {
        const snowflake = document.createElement('div');
        snowflake.className = 'snowflake';
       
        // Случайный размер снежинки
        const size = Math.random() * 5 + 2;
        snowflake.style.width = `${size}px`;
        snowflake.style.height = `${size}px`;
       
        // Случайная позиция
        snowflake.style.left = `${Math.random() * 100}%`;
       
        // Случайная прозрачность
        snowflake.style.opacity = Math.random() * 0.7 + 0.3;
       
        // Случайное смещение по X при падении
        snowflake.style.setProperty('--random-x', (Math.random() * 2 - 1).toFixed(2));
       
        // Случайная скорость падения
        const duration = Math.random() * 10 + 5;
        snowflake.style.animationDuration = `${duration}s`;
       
        // Случайная задержка начала анимации
        snowflake.style.animationDelay = `${Math.random() * 5}s`;
       
        snowContainer.appendChild(snowflake);
    }
}

// Анимация разрушения стены
function createWallBreakAnimation() {
    const wallBreak = document.createElement('div');
    wallBreak.className = 'wall-break-animation';
    wallBreak.id = 'wall-break-animation';
   
    // Создаем несколько трещин в разных местах
    for (let i = 0; i < 8; i++) {
        const crack = document.createElement('div');
        crack.className = 'wall-crack';
       
        // Случайная позиция трещины
        const x = Math.random() * window.innerWidth;
        const y = Math.random() * window.innerHeight;
        crack.style.left = `${x}px`;
        crack.style.top = `${y}px`;
       
        // Случайная задержка анимации
        crack.style.animationDelay = `${Math.random() * 0.5}s`;
       
        wallBreak.appendChild(crack);
    }
   
    document.body.appendChild(wallBreak);
   
    // Показываем анимацию
    setTimeout(() => {
        wallBreak.classList.add('show');
       
        // Убираем анимацию после завершения
        setTimeout(() => {
            wallBreak.classList.remove('show');
            setTimeout(() => {
                if (wallBreak.parentNode) {
                    wallBreak.parentNode.removeChild(wallBreak);
                }
            }, 500);
        }, 800);
    }, 100);
}

// Завершение пазла
function completePuzzle() {
    gameState.isCompleted = true;
    gameState.isPlaying = false;
    clearInterval(gameState.timer);
   
    // Убираем только зеленые рамки, но НЕ убираем границы пазлов
    gameState.puzzlePieces.forEach(piece => {
        // Убираем зеленые рамки и анимации
        const afterElement = piece.querySelector('::after');
        if (afterElement) {
            afterElement.remove();
        }
       
        // Убираем классы, связанные с анимацией и подсветкой
        piece.classList.remove('correct');
        piece.classList.remove('connected');
       
        // ЗАПРЕЩАЕМ взаимодействие с пазлами
        piece.setAttribute('draggable', 'false');
        piece.style.pointerEvents = 'none';
        piece.style.cursor = 'default';
       
        // Добавляем эффект для собранного пазла
        piece.classList.add('puzzle-completed');
    });
   
    // Убираем полупрозрачные белые линии сетки
    assemblyGrid.classList.add('hidden');
    const gridLines = assemblyGrid.querySelectorAll('.grid-line');
    gridLines.forEach(line => line.classList.add('hidden'));
   
    // Добавляем эффектную рамку вокруг собранного пазла
    const completedBorder = document.createElement('div');
    completedBorder.className = 'completed-border';
    completedBorder.style.width = `${gameState.assemblyArea.width}px`;
    completedBorder.style.height = `${gameState.assemblyArea.height}px`;
    completedBorder.style.left = `${gameState.assemblyArea.x}px`;
    completedBorder.style.top = `${gameState.assemblyArea.y}px`;
    gameBoard.appendChild(completedBorder);
   
    // Анимация разрушения стены
    createWallBreakAnimation();
   
    // Запускаем расширенный салют на 5 секунд
    startExtendedFireworks();
   
    // Показываем окно победы через 2 секунды
    setTimeout(() => {
        showWinMessage();
    }, 2000);
}

// Запуск расширенного салюта на 5 секунд
function startExtendedFireworks() {
    gameState.isFireworksActive = true;
    const colors = ['#ff0000', '#00ff00', '#ffff00', '#ff00ff', '#00ffff', '#ff8800', '#ff0088', '#ff4500', '#9400d3', '#00ff7f'];
    const boardRect = gameBoard.getBoundingClientRect();
    const centerX = boardRect.left + boardRect.width / 2;
    const centerY = boardRect.top + boardRect.height / 2;
   
    // Создаем много залпов салюта с разной интенсивностью
    let fireworkCount = 0;
    const maxFireworks = 30; // Ограничиваем количество фейерверков
   
    gameState.fireworksInterval = setInterval(() => {
        if (fireworkCount >= maxFireworks) {
            clearInterval(gameState.fireworksInterval);
            gameState.fireworksInterval = null;
            return;
        }
       
        // Создаем несколько фейерверков одновременно
        const simultaneousFireworks = 3;
        for (let i = 0; i < simultaneousFireworks; i++) {
            createExtendedFirework(
                centerX + (Math.random() - 0.5) * 300,
                centerY + (Math.random() - 0.5) * 300,
                colors[Math.floor(Math.random() * colors.length)]
            );
        }
       
        fireworkCount++;
    }, 200); // Каждые 200ms новый залп
   
    // Останавливаем салют через 5 секунд
    setTimeout(() => {
        if (gameState.fireworksInterval) {
            clearInterval(gameState.fireworksInterval);
            gameState.fireworksInterval = null;
        }
        gameState.isFireworksActive = false;
    }, 5000);
}

// Создание одного расширенного фейерверка
function createExtendedFirework(x, y, color) {
    const particleCount = 100; // Больше частиц
    const particles = [];
   
    // Создаем основную частицу
    const mainParticle = document.createElement('div');
    mainParticle.className = 'firework';
    mainParticle.style.backgroundColor = color;
    mainParticle.style.left = `${x}px`;
    mainParticle.style.top = `${window.innerHeight}px`;
    mainParticle.style.setProperty('--x', `${x - (window.innerWidth / 2)}px`);
    mainParticle.style.setProperty('--y', `${y - window.innerHeight}px`);
    mainParticle.style.setProperty('--initialY', '0px');
    mainParticle.style.setProperty('--initialSize', '8px'); // Больше размер
    mainParticle.style.animation = `firework 1s ease-out forwards`;
   
    document.body.appendChild(mainParticle);
   
    // Удаляем основную частицу после анимации
    setTimeout(() => {
        mainParticle.remove();
       
        // Создаем взрыв частиц
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'firework';
            particle.style.backgroundColor = color;
            particle.style.left = `${x}px`;
            particle.style.top = `${y}px`;
           
            const angle = (Math.PI * 2 * i) / particleCount;
            const speed = 3 + Math.random() * 3; // Быстрее
            const tx = Math.cos(angle) * speed * 50; // Больший радиус
            const ty = Math.sin(angle) * speed * 50;
           
            particle.style.setProperty('--tx', `${tx}px`);
            particle.style.setProperty('--ty', `${ty}px`);
            particle.style.animation = `fireworkParticle 1.2s ease-out forwards`; // Дольше анимация
           
            // Добавляем свечение
            particle.style.boxShadow = `0 0 10px ${color}, 0 0 20px ${color}`;
           
            document.body.appendChild(particle);
            particles.push(particle);
           
            // Удаляем частицу после анимации
            setTimeout(() => {
                particle.remove();
            }, 1200);
        }
    }, 1000);
}

// Показать сообщение о победе
function showWinMessage() {
    // Форматирование времени для окна победы
    const minutes = Math.floor(gameState.time / 60).toString().padStart(2, '0');
    const seconds = (gameState.time % 60).toString().padStart(2, '0');
   
    winTimeElement.textContent = `${minutes}:${seconds}`;
    winLevelElement.textContent = gameState.currentLevel;
   
    winMessage.classList.add('show');
}

// Следующий уровень
function nextLevel() {
    // Увеличиваем уровень
    gameState.currentLevel++;
   
    // Закрываем окно победы
    winMessage.classList.remove('show');
   
    // Останавливаем салют если он активен
    if (gameState.fireworksInterval) {
        clearInterval(gameState.fireworksInterval);
        gameState.fireworksInterval = null;
        gameState.isFireworksActive = false;
    }
   
    // Выбираем новую картинку для уровня
    selectImageForLevel();
   
    // Начинаем новую игру БЕЗ показа инструкции
    resetGameState();
    createGrid();
    createPuzzlePieces();
    updateStats();
    startTimer();
    gameState.isPlaying = true;
    gameState.isCompleted = false;
   
    // Восстанавливаем видимость сетки
    assemblyGrid.classList.remove('hidden');
    const gridLines = assemblyGrid.querySelectorAll('.grid-line');
    gridLines.forEach(line => line.classList.remove('hidden'));
   
    // Обновляем отображение уровня
    currentLevelElement.textContent = gameState.currentLevel;
    
    // Сбрасываем счетчик соединенных деталей
    gameState.connectedPieces = 0;
    connectedElement.textContent = `${gameState.connectedPieces}/${config.totalPieces}`;
}

// Перемешивание массива
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Запуск таймера
function startTimer() {
    if (gameState.timer) clearInterval(gameState.timer);
   
    gameState.timer = setInterval(() => {
        gameState.time++;
        updateStats();
    }, 1000);
}

// Обновление статистики
function updateStats() {
    // Форматирование времени
    const minutes = Math.floor(gameState.time / 60).toString().padStart(2, '0');
    const seconds = (gameState.time % 60).toString().padStart(2, '0');
    timeElement.textContent = `${minutes}:${seconds}`;
}

// Обработчики событий перетаскивания
function handleDragStart(e) {
    if (!gameState.isPlaying || gameState.isCompleted) return;
   
    const piece = e.target;
   
    // Проверяем, можно ли двигать эту деталь
    if (piece.dataset.placed === 'true' || piece.classList.contains('correct')) {
        e.preventDefault();
        return false;
    }
   
    const group = findGroupByPiece(piece);
   
    if (group) {
        gameState.draggedGroup = group;
       
        // Помечаем все детали в группе как перетаскиваемые
        group.pieces.forEach(p => {
            if (p.dataset.placed === 'false' && !p.classList.contains('correct')) {
                p.classList.add('dragging');
            }
        });
       
        // Сохраняем смещение курсора
        const rect = piece.getBoundingClientRect();
        group.dragOffsetX = e.clientX - rect.left;
        group.dragOffsetY = e.clientY - rect.top;
       
        // Сохраняем начальные позиции
        group.startPositions = group.positions.map(pos => ({
            ...pos,
            element: pos.element
        }));
    }
   
    e.dataTransfer.setData('text/plain', 'drag');
    e.dataTransfer.effectAllowed = 'move';
    return true;
}

function handleDragEnd(e) {
    if (gameState.draggedGroup) {
        // Убираем класс dragging у всех деталей в группе
        gameState.draggedGroup.pieces.forEach(p => {
            p.classList.remove('dragging');
        });
       
        // Проверяем правильность позиций деталей в группе
        gameState.draggedGroup.pieces.forEach(piece => {
            checkPiecePosition(piece);
        });
       
        // Обновляем позиции в группе
        gameState.draggedGroup.positions = gameState.draggedGroup.pieces.map(piece => {
            const rect = piece.getBoundingClientRect();
            const boardRect = gameBoard.getBoundingClientRect();
            return {
                element: piece,
                startX: rect.left - boardRect.left,
                startY: rect.top - boardRect.top,
                row: parseInt(piece.dataset.row),
                col: parseInt(piece.dataset.col)
            };
        });
       
        // Проверяем соединения после перемещения
        setTimeout(() => {
            checkAndConnectPieces();
        }, 100);
       
        gameState.draggedGroup = null;
    }
}

// Обработчики для сенсорных устройств
let touchStartX = 0;
let touchStartY = 0;
let isTouchDragging = false;
let touchDraggedGroup = null;

function handleTouchStart(e) {
    if (!gameState.isPlaying || gameState.isCompleted) return;
   
    e.preventDefault();
    const piece = e.targetTouches[0].target;
   
    // Проверяем, можно ли двигать эту деталь
    if (piece.dataset.placed === 'true' || piece.classList.contains('correct')) {
        return;
    }
   
    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
   
    const group = findGroupByPiece(piece);
    if (group) {
        touchDraggedGroup = group;
        isTouchDragging = true;
       
        // Помечаем все детали в группе как перетаскиваемые
        group.pieces.forEach(p => {
            if (p.dataset.placed === 'false' && !p.classList.contains('correct')) {
                p.classList.add('dragging');
            }
        });
       
        // Сохраняем смещение
        const rect = piece.getBoundingClientRect();
        group.touchOffsetX = touch.clientX - rect.left;
        group.touchOffsetY = touch.clientY - rect.top;
       
        // Сохраняем начальные позиции
        group.startPositions = group.positions.map(pos => ({
            ...pos,
            element: pos.element
        }));
    }
}

function handleTouchMove(e) {
    if (!isTouchDragging || !touchDraggedGroup) return;
   
    e.preventDefault();
    const touch = e.touches[0];
   
    // Вычисляем новые координаты для всей группы
    const boardRect = gameBoard.getBoundingClientRect();
    const newX = touch.clientX - boardRect.left - touchDraggedGroup.touchOffsetX;
    const newY = touch.clientY - boardRect.top - touchDraggedGroup.touchOffsetY;
   
    // Вычисляем смещение относительно первой детали
    const firstPiece = touchDraggedGroup.startPositions[0];
    const deltaX = newX - firstPiece.startX;
    const deltaY = newY - firstPiece.startY;
   
    // Применяем смещение ко всем деталям в группе
    touchDraggedGroup.startPositions.forEach(pos => {
        // Проверяем, можно ли двигать эту деталь
        if (pos.element.dataset.placed === 'true' || pos.element.classList.contains('correct')) return;
       
        const newPieceX = pos.startX + deltaX;
        const newPieceY = pos.startY + deltaY;
       
        // Ограничиваем перемещение в пределах игрового поля
        const pieceSize = config.size;
        const maxX = boardRect.width - pieceSize;
        const maxY = boardRect.height - pieceSize;
       
        const clampedX = Math.max(0, Math.min(newPieceX, maxX));
        const clampedY = Math.max(0, Math.min(newPieceY, maxY));
       
        pos.element.style.left = `${clampedX}px`;
        pos.element.style.top = `${clampedY}px`;
    });
}

function handleTouchEnd(e) {
    if (!isTouchDragging || !touchDraggedGroup) return;
   
    // Убираем класс dragging у всех деталей в группе
    touchDraggedGroup.pieces.forEach(p => {
        p.classList.remove('dragging');
    });
   
    // Проверяем правильность позиций деталей в группе
    touchDraggedGroup.pieces.forEach(piece => {
        checkPiecePosition(piece);
    });
   
    // Обновляем позиции в группе
    touchDraggedGroup.positions = touchDraggedGroup.pieces.map(piece => {
        const rect = piece.getBoundingClientRect();
        const boardRect = gameBoard.getBoundingClientRect();
        return {
            element: piece,
            startX: rect.left - boardRect.left,
            startY: rect.top - boardRect.top,
            row: parseInt(piece.dataset.row),
            col: parseInt(piece.dataset.col)
        };
    });
   
    // Проверяем соединения после перемещения
    setTimeout(() => {
        checkAndConnectPieces();
    }, 100);
   
    isTouchDragging = false;
    touchDraggedGroup = null;
}

// Настройка перетаскивания для игрового поля
gameBoard.addEventListener('dragover', function(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
   
    if (gameState.draggedGroup) {
        // Вычисляем новые координаты для всей группы
        const boardRect = gameBoard.getBoundingClientRect();
        const newX = e.clientX - boardRect.left - gameState.draggedGroup.dragOffsetX;
        const newY = e.clientY - boardRect.top - gameState.draggedGroup.dragOffsetY;
       
        // Вычисляем смещение относительно первой детали
        const firstPiece = gameState.draggedGroup.startPositions[0];
        const deltaX = newX - firstPiece.startX;
        const deltaY = newY - firstPiece.startY;
       
        // Применяем смещение ко всем деталям в группе
        gameState.draggedGroup.startPositions.forEach(pos => {
            // Проверяем, можно ли двигать эту деталь
            if (pos.element.dataset.placed === 'true' || pos.element.classList.contains('correct')) return;
           
            const newPieceX = pos.startX + deltaX;
            const newPieceY = pos.startY + deltaY;
           
            // Ограничиваем перемещение в пределах игрового поля
            const pieceSize = config.size;
            const maxX = boardRect.width - pieceSize;
            const maxY = boardRect.height - pieceSize;
           
            const clampedX = Math.max(0, Math.min(newPieceX, maxX));
            const clampedY = Math.max(0, Math.min(newPieceY, maxY));
           
            pos.element.style.left = `${clampedX}px`;
            pos.element.style.top = `${clampedY}px`;
        });
    }
});

gameBoard.addEventListener('drop', function(e) {
    e.preventDefault();
});

// Обработчик события для кнопки "Следующий уровень"
closeWinButton.addEventListener('click', nextLevel);

// Обработчик события для кнопки "Сменить картинку"
changeImageBtn.addEventListener('click', changePuzzleImage);

// Обработчик события для кнопки "Начать игру"
startGameBtn.addEventListener('click', startGameFromModal);

// Пересчет размеров при изменении размера окна
window.addEventListener('resize', function() {
    if (!gameState.isPlaying) return;
   
    // Обновляем позицию области сборки
    updateAssemblyAreaPosition();
   
    // Обновляем позиции всех пазлов
    gameState.puzzlePieces.forEach(piece => {
        if (piece.dataset.placed === 'true') {
            // Обновляем позицию правильно размещенных пазлов
            const pieceRow = parseInt(piece.dataset.row);
            const pieceCol = parseInt(piece.dataset.col);
            const pieceSize = config.size;
           
            const correctX = gameState.assemblyArea.x + pieceCol * pieceSize;
            const correctY = gameState.assemblyArea.y + pieceRow * pieceSize;
           
            piece.style.left = `${correctX}px`;
            piece.style.top = `${correctY}px`;
        }
    });
});

// Инициализация игры при загрузке страницы
window.addEventListener('load', () => {
    // Показываем экран загрузки
    loadingScreen.classList.remove('hidden');
    
    // Запускаем процесс загрузки
    simulateLoading();
});

// Функция для замены картинки загрузки
function setLoadingImage(imageUrl) {
    loadingImage.src = imageUrl;
}

// Экспортируем функцию для замены картинки загрузки
window.setLoadingImage = setLoadingImage;