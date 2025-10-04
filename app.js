// ===== نظام Flappy Bird الاحترافي - دقة عالية جدا =====

// متغيرات اللعبة
let gameRunning = false;
let gameSpeed = 2;
let score = 0;
let bestScore = 0;
let birdY = 250;
let birdVelocity = 0;
let activeObstacles = [];
let gameLoop;
let obstacleTimer;
let gap = 150;
let gameHeight = 500;
let groundHeight = 80;
let gameSettings = {
  soundEnabled: true,
  effectsEnabled: true,
  difficulty: 2
};

// عناصر DOM
let gameContainer, bird, scoreDisplay, startScreen, gameOverScreen, finalScoreDisplay;
let bestScoreDisplay, startBtn, restartBtn, mainMenuBtn, settingsBtn, saveSettingsBtn, backBtn;
let difficultySlider, difficultyText, soundToggle, effectsToggle, settingsScreen;

// نظام الأصوات
class SoundSystem {
  constructor() {
    this.audioContext = null;
    this.initAudio();
  }

  initAudio() {
    try {
      // إنشاء AudioContext واحد فقط
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)()
    } catch (error) {
      console.warn('لا يمكن تهيئة الأصوات:', error)
    }
  }

  createTone(frequency, duration, type = 'sine') {
    if (!this.audioContext) return;
    
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = type;
    
    gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
    
    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  playJump() {
    if (gameSettings.soundEnabled && this.audioContext) {
      this.createTone(440, 0.1, 'sine')
    }
  }

  playHit() {
    if (gameSettings.soundEnabled && this.audioContext) {
      this.createTone(200, 0.3, 'sawtooth')
    }
  }

  playPoint() {
    if (gameSettings.soundEnabled && this.audioContext) {
      this.createTone(880, 0.15, 'square')
    }
  }
}

const soundSystem = new SoundSystem();

// تهيئة اللعبة
function initGame() {
  // تهيئة عناصر DOM
  gameContainer = document.querySelector('.game-container');
  bird = document.querySelector('.bird');
  scoreDisplay = document.getElementById('score');
  startScreen = document.getElementById('startScreen');
  gameOverScreen = document.getElementById('gameOverScreen');
  finalScoreDisplay = document.getElementById('finalScore');
  bestScoreDisplay = document.getElementById('bestScore');
  startBtn = document.getElementById('startGameBtn');
  restartBtn = document.getElementById('restartGameBtn');
  mainMenuBtn = document.getElementById('mainMenuBtn');
  settingsBtn = document.getElementById('settingsBtn');
  saveSettingsBtn = document.getElementById('saveSettingsBtn');
  backBtn = document.getElementById('backBtn');
  difficultySlider = document.getElementById('difficultySlider');
  difficultyText = document.getElementById('difficultyText');
  soundToggle = document.getElementById('soundToggle');
  effectsToggle = document.getElementById('effectsToggle');
  settingsScreen = document.getElementById('settingsScreen');

  // تحميل الإعدادات والنتيجة الأفضل
  loadSettings();
  loadBestScore();

  // إضافة مستمعي الأحداث
  addEventListeners();
  
  // إظهار شاشة البداية
  showMainMenu();
}

// إضافة مستمعي الأحداث
function addEventListeners() {
  // أزرار التحكم
  if (startBtn) {
    addEventListenerSafe(startBtn, 'click', startGame);
  } else {
    console.error('❌ لم يتم العثور على زر البداية');
  }

  if (restartBtn) {
    addEventListenerSafe(restartBtn, 'click', restartGame);
  } else {
    console.error('❌ لم يتم العثور على زر إعادة اللعب');
  }

  if (mainMenuBtn) {
    addEventListenerSafe(mainMenuBtn, 'click', showMainMenu);
  } else {
    console.error('❌ لم يتم العثور على زر القائمة الرئيسية');
  }

  if (settingsBtn) {
    addEventListenerSafe(settingsBtn, 'click', showSettings);
  }

  if (saveSettingsBtn) {
    addEventListenerSafe(saveSettingsBtn, 'click', saveSettings);
  }

  if (backBtn) {
    addEventListenerSafe(backBtn, 'click', showMainMenu);
  }

  // إعدادات الصعوبة
  if (difficultySlider) {
    addEventListenerSafe(difficultySlider, 'input', updateDifficultyText);
  }

  // مستمعي الأحداث للقفز
  addEventListenerSafe(document, 'keydown', handleKeyDown);
  addEventListenerSafe(gameContainer, 'click', handleClick);
  addEventListenerSafe(gameContainer, 'touchstart', handleTouch);
}

// دالة آمنة لإضافة مستمعي الأحداث
function addEventListenerSafe(element, event, handler) {
  if (element && typeof element.addEventListener === 'function') {
    element.addEventListener(event, handler);
  }
}

// معالجة الضغط على المفاتيح
function handleKeyDown(e) {
  if (e.code === 'Space' && gameRunning) {
    e.preventDefault();
    jump();
  }
}

// معالجة النقر
function handleClick(e) {
  if (gameRunning) {
    e.preventDefault();
    jump();
  }
}

// معالجة اللمس
function handleTouch(e) {
  if (gameRunning) {
    e.preventDefault();
    jump();
  }
}

// بدء اللعبة
function startGame() {
  console.log('🎮 بدء اللعبة');
  
  // التأكد من تهيئة المتغيرات
  if (!gameContainer || !gameOverScreen) {
    console.error('لم يتم تهيئة المتغيرات بشكل صحيح');
    return;
  }

  gameRunning = true;
  score = 0;
  birdY = 250;
  birdVelocity = 0;
  activeObstacles = [];
  
  // إخفاء الشاشات
  startScreen.style.display = 'none';
  gameOverScreen.style.display = 'none';
  settingsScreen.style.display = 'none';
  
  // بدء حركة الأرض
  const ground = document.querySelector('.ground');
  if (ground) {
    ground.classList.add('moving');
  }
  
  // تحديث النتيجة
  updateScore();
  
  // بدء حلقات اللعبة
  gameLoop = setInterval(updateGame, 20);
  obstacleTimer = setInterval(createObstacle, 2000);
  
  console.log('✅ تم بدء اللعبة بنجاح');
}

// القفز
function jump() {
  if (!gameRunning) return;
  
  birdVelocity = -8;
  soundSystem.playJump();
  
  // تأثير دوران الطائر
  if (bird) {
    bird.classList.add('jumping');
    setTimeout(() => {
      if (bird) bird.classList.remove('jumping');
    }, 100);
  }
}

// تحديث اللعبة
function updateGame() {
  if (!gameRunning) return;

  // تحديث موضع الطائر
  birdVelocity += 0.5;
  birdY += birdVelocity;
  
  if (bird) {
    bird.style.bottom = `${birdY}px`;
  }

  // تحديث العقبات
  activeObstacles.forEach(obstacleData => {
    obstacleData.left -= gameSpeed;
    
    // تحديث موضع العقبات
    if (obstacleData.element) {
      obstacleData.element.style.left = obstacleData.left + 'px';
    }
    if (obstacleData.topElement) {
      obstacleData.topElement.style.left = obstacleData.left + 'px';
    }
    
    // إزالة العقبات التي خرجت من الشاشة
    if (obstacleData.left < -70) {
      if (obstacleData.element) obstacleData.element.remove();
      if (obstacleData.topElement) obstacleData.topElement.remove();
      
      // إزالة من المصفوفة
      const index = activeObstacles.indexOf(obstacleData);
      if (index > -1) {
        activeObstacles.splice(index, 1);
        
        // إضافة نقطة
        if (!obstacleData.passed) {
          score++;
          updateScore();
          soundSystem.playPoint();
          
          // زيادة الصعوبة تدريجياً
          if (score % 10 === 0) {
            gameSpeed = Math.min(gameSpeed + 0.2, 4);
            gap = Math.max(gap - 2, 100);
          }
        }
      }
    }
  });

  // فحص التصادم
  if (checkCollision()) {
    gameOver();
  }
}

// إنشاء عقبة
function createObstacle() {
  if (!gameRunning || !gameContainer) return;

  const obstacleHeight = Math.random() * (gameHeight - gap - groundHeight - 100) + 50;
  const topHeight = obstacleHeight;
  const bottomHeight = gameHeight - obstacleHeight - gap - groundHeight;

  // العقبة السفلية
  const bottomObstacle = document.createElement('div');
  bottomObstacle.className = 'obstacle';
  bottomObstacle.style.left = '400px';
  bottomObstacle.style.bottom = '0px';
  bottomObstacle.style.height = `${bottomHeight}px`;
  gameContainer.appendChild(bottomObstacle);

  // العقبة العلوية
  const topObstacle = document.createElement('div');
  topObstacle.className = 'obstacle topObstacle';
  topObstacle.style.left = '400px';
  topObstacle.style.bottom = `${bottomHeight + gap}px`;
  topObstacle.style.height = `${topHeight}px`;
  gameContainer.appendChild(topObstacle);

  // إضافة العقبات إلى المصفوفة
  activeObstacles.push({
    element: bottomObstacle,
    topElement: topObstacle,
    left: 400,
    passed: false
  });
}

// فحص التصادم
function checkCollision() {
  if (!bird || !gameContainer) return false;

  const birdRect = bird.getBoundingClientRect();
  const gameRect = gameContainer.getBoundingClientRect();

  // تصادم مع الأرض والسقف
  if (birdY <= 0 || birdY >= gameHeight - groundHeight - 40) {
    return true;
  }

  // تصادم مع العقبات
  for (let obstacleData of activeObstacles) {
    if (!obstacleData.element || !obstacleData.topElement) continue;

    const obstacleRect = obstacleData.element.getBoundingClientRect();
    const topObstacleRect = obstacleData.topElement.getBoundingClientRect();

    // فحص التصادم الأفقي
    const horizontalOverlap = birdRect.right > obstacleRect.left && birdRect.left < obstacleRect.right;
    
    // فحص التصادم العمودي مع العقبة السفلية
    const verticalOverlapBottom = birdRect.bottom > obstacleRect.top && birdRect.top < obstacleRect.bottom;
    
    // فحص التصادم العمودي مع العقبة العلوية
    const verticalOverlapTop = birdRect.bottom > topObstacleRect.top && birdRect.top < topObstacleRect.bottom;

    if (horizontalOverlap && (verticalOverlapBottom || verticalOverlapTop)) {
      return true;
    }

    // تتبع النقاط
    if (!obstacleData.passed && obstacleData.left + 70 < birdRect.left - gameRect.left) {
      obstacleData.passed = true;
    }
  }

  return false;
}

// انتهاء اللعبة
function gameOver() {
  console.log('💥 انتهاء اللعبة');
  
  gameRunning = false;
  clearInterval(gameLoop);
  clearInterval(obstacleTimer);

  // إيقاف حركة الأرض
  const ground = document.querySelector('.ground');
  if (ground) {
    ground.classList.remove('moving');
  }

  // تشغيل صوت الاصطدام
  soundSystem.playHit();

  // تحديث أفضل نتيجة
  if (score > bestScore) {
    bestScore = score;
    saveBestScore();
    if (bestScoreDisplay) {
      bestScoreDisplay.textContent = `Best Score: ${bestScore}`;
    }
  }

  // إظهار شاشة Game Over
  if (gameOverScreen && finalScoreDisplay) {
    const isNewRecord = score > getBestScore();
    finalScoreDisplay.innerHTML = `
      <div style='font-size: 28px; margin-bottom: 15px;'>Game Over 😢</div>
      <div style='font-size: 24px; margin-bottom: 10px;'>Score: ${score}</div>
      ${isNewRecord ? '<div style='color: #ffd700; font-size: 20px;'>🎉 New Record!</div>' : ''}
    `;
    gameOverScreen.style.display = 'flex';
  }

  // إزالة جميع العقبات
  activeObstacles.forEach(obstacleData => {
    if (obstacleData.element) obstacleData.element.remove();
    if (obstacleData.topElement) obstacleData.topElement.remove();
  });
  activeObstacles = [];
}

// إعادة تشغيل اللعبة
function restartGame() {
  console.log('🔄 إعادة تشغيل اللعبة');
  startGame();
}

// إظهار القائمة الرئيسية
function showMainMenu() {
  console.log('🏠 إظهار القائمة الرئيسية');
  
  if (startScreen) {
    startScreen.style.display = 'flex';
  } else {
    console.error('❌ لم يتم العثور على شاشة البداية');
  }
  
  if (gameOverScreen) {
    gameOverScreen.style.display = 'none';
  }
  
  if (settingsScreen) {
    settingsScreen.style.display = 'none';
  }
}

// إظهار الإعدادات
function showSettings() {
  if (settingsScreen) {
    settingsScreen.style.display = 'flex';
    startScreen.style.display = 'none';
  }
}

// حفظ الإعدادات
function saveSettings() {
  gameSettings.difficulty = parseInt(difficultySlider.value);
  gameSettings.soundEnabled = soundToggle.checked;
  gameSettings.effectsEnabled = effectsToggle.checked;
  
  // تطبيق الصعوبة
  switch (gameSettings.difficulty) {
    case 1: // سهل
      gameSpeed = 1.5;
      gap = 180;
      break;
    case 2: // متوسط
      gameSpeed = 2;
      gap = 150;
      break;
    case 3: // صعب
      gameSpeed = 2.5;
      gap = 120;
      break;
  }
  
  saveSettingsToStorage();
  showMainMenu();
}

// تحديث نص الصعوبة
function updateDifficultyText() {
  const difficulties = ['', 'سهل', 'متوسط', 'صعب'];
  difficultyText.textContent = difficulties[difficultySlider.value];
}

// تحديث النتيجة
function updateScore() {
  if (scoreDisplay) {
    scoreDisplay.textContent = `Score: ${score}`;
  }
}

// حفظ أفضل نتيجة
function saveBestScore() {
  try {
    localStorage.setItem('flappyBirdBestScore', bestScore.toString());
  } catch (error) {
    console.warn('لا يمكن حفظ أفضل نتيجة:', error);
  }
}

// تحميل أفضل نتيجة
function loadBestScore() {
  try {
    const saved = localStorage.getItem('flappyBirdBestScore');
    bestScore = saved ? parseInt(saved) : 0;
    if (bestScoreDisplay) {
      bestScoreDisplay.textContent = `Best Score: ${bestScore}`;
    }
  } catch (error) {
    console.warn('لا يمكن تحميل أفضل نتيجة:', error);
    bestScore = 0;
  }
}

// حفظ الإعدادات
function saveSettingsToStorage() {
  try {
    localStorage.setItem('flappyBirdSettings', JSON.stringify(gameSettings));
  } catch (error) {
    console.warn('لا يمكن حفظ الإعدادات:', error);
  }
}

// تحميل الإعدادات
function loadSettings() {
  try {
    const saved = localStorage.getItem('flappyBirdSettings');
    if (saved) {
      const parsed = JSON.parse(saved);
      gameSettings = { ...gameSettings, ...parsed };
      
      // تطبيق الإعدادات على واجهة المستخدم
      if (difficultySlider) difficultySlider.value = gameSettings.difficulty;
      if (soundToggle) soundToggle.checked = gameSettings.soundEnabled;
      if (effectsToggle) effectsToggle.checked = gameSettings.effectsEnabled;
      
      updateDifficultyText();
    }
  } catch (error) {
    console.warn('لا يمكن تحميل الإعدادات:', error);
  }
}

// الحصول على أفضل نتيجة
function getBestScore() {
  try {
    const best = localStorage.getItem('flappyBirdBestScore');
    return best ? parseInt(best) : 0;
  } catch (error) {
    console.warn('لا يمكن قراءة أفضل نتيجة:', error);
    return 0;
  }
}

// تهيئة اللعبة عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', initGame);
