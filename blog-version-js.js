/* ⚡ JavaScript للعبة Flappy Bird - نسخة المدونات */

// ===== متغيرات اللعبة =====
let bird, gameDisplay, ground, scoreBoard, startScreen, gameOverScreen, finalScore, settingsScreen, bestScoreDisplay
let birdLeft = 150
let birdBottom = 250
let gravity = 1.0
let isGameOver = false
let score = 0
let gameTimerId = null
let gameSpeed = 1.2
let gap = 180
let lastJumpTime = 0
const JUMP_COOLDOWN = 100

// ===== إعدادات اللعبة =====
let gameSettings = {
  difficulty: 2, // 1: سهل، 2: متوسط، 3: صعب
  soundEnabled: true,
  effectsEnabled: true
}

// ===== نظام الأصوات =====
const gameSounds = {
  audioContext: null,
  
  init() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)()
    } catch (error) {
      console.warn('لا يمكن تهيئة الأصوات:', error)
    }
  },
  
  playJump() {
    if (!this.audioContext || !gameSettings.soundEnabled) return
    
    const oscillator = this.audioContext.createOscillator()
    const gainNode = this.audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(this.audioContext.destination)
    
    oscillator.frequency.setValueAtTime(400, this.audioContext.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(600, this.audioContext.currentTime + 0.1)
    
    gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1)
    
    oscillator.start(this.audioContext.currentTime)
    oscillator.stop(this.audioContext.currentTime + 0.1)
  },
  
  playHit() {
    if (!this.audioContext || !gameSettings.soundEnabled) return
    
    const oscillator = this.audioContext.createOscillator()
    const gainNode = this.audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(this.audioContext.destination)
    
    oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(50, this.audioContext.currentTime + 0.3)
    
    gainNode.gain.setValueAtTime(0.5, this.audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3)
    
    oscillator.start(this.audioContext.currentTime)
    oscillator.stop(this.audioContext.currentTime + 0.3)
  },
  
  playPoint() {
    if (!this.audioContext || !gameSettings.soundEnabled) return
    
    const oscillator = this.audioContext.createOscillator()
    const gainNode = this.audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(this.audioContext.destination)
    
    oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(1200, this.audioContext.currentTime + 0.2)
    
    gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2)
    
    oscillator.start(this.audioContext.currentTime)
    oscillator.stop(this.audioContext.currentTime + 0.2)
  }
}

// ===== تهيئة المتغيرات عند تحميل الصفحة =====
document.addEventListener('DOMContentLoaded', function() {
  bird = document.querySelector('.bird')
  gameDisplay = document.querySelector('.game-container')
  ground = document.querySelector('.ground')
  scoreBoard = document.getElementById('score')
  startScreen = document.getElementById('startScreen')
  gameOverScreen = document.getElementById('gameOverScreen')
  finalScore = document.getElementById('finalScore')
  settingsScreen = document.getElementById('settingsScreen')
  bestScoreDisplay = document.getElementById('bestScore')
  
  // تحميل الإعدادات
  loadSettings()
  updateBestScoreDisplay()
  
  // إعداد مستمعي الأحداث للإعدادات
  setupSettingsListeners()
  
  // إعداد مستمعي الأحداث للأزرار
  setupButtonListeners()
})

// ===== إصلاح تسريبات الذاكرة - تنظيف Event Listeners =====
let activeEventListeners = []

function addEventListenerSafe(element, event, handler) {
  if (element && typeof handler === 'function') {
    element.addEventListener(event, handler)
    activeEventListeners.push({ element, event, handler })
  }
}

function removeAllEventListeners() {
  activeEventListeners.forEach(({ element, event, handler }) => {
    if (element && element.removeEventListener) {
      element.removeEventListener(event, handler)
    }
  })
  activeEventListeners = []
}

// ===== إعداد مستمعي الأحداث للأزرار =====
function setupButtonListeners() {
  // تنظيف Event Listeners القديمة
  removeAllEventListeners()
  
  // زر بدء اللعبة
  const startGameBtn = document.getElementById('startGameBtn')
  addEventListenerSafe(startGameBtn, 'click', startGame)
  
  // زر الإعدادات
  const settingsBtn = document.getElementById('settingsBtn')
  addEventListenerSafe(settingsBtn, 'click', toggleSettings)
  
  // زر إعادة اللعب
  const restartGameBtn = document.getElementById('restartGameBtn')
  if (restartGameBtn) {
    console.log('✅ تم العثور على زر إعادة اللعب')
    addEventListenerSafe(restartGameBtn, 'click', restartGame)
  } else {
    console.error('❌ لم يتم العثور على زر إعادة اللعب')
  }
  
  // زر القائمة الرئيسية
  const mainMenuBtn = document.getElementById('mainMenuBtn')
  if (mainMenuBtn) {
    console.log('✅ تم العثور على زر القائمة الرئيسية')
    addEventListenerSafe(mainMenuBtn, 'click', showMainMenu)
  } else {
    console.error('❌ لم يتم العثور على زر القائمة الرئيسية')
  }
  
  // زر حفظ الإعدادات
  const saveSettingsBtn = document.getElementById('saveSettingsBtn')
  addEventListenerSafe(saveSettingsBtn, 'click', saveSettings)
  
  // زر الرجوع
  const backBtn = document.getElementById('backBtn')
  addEventListenerSafe(backBtn, 'click', showMainMenu)
}

// ===== تهيئة متغيرات اللعبة =====
function initGameVars() {
  // إعادة تعيين جميع المتغيرات الأساسية
  birdLeft = 150
  birdBottom = 250
  isGameOver = false
  score = 0
  
  // تهيئة الأصوات
  gameSounds.init()
  
  // تطبيق إعدادات الصعوبة
  switch(gameSettings.difficulty) {
    case 1: // سهل
      gravity = 0.8
      gap = 200
      gameSpeed = 1.0
      break
    case 2: // متوسط
      gravity = 1.0
      gap = 180
      gameSpeed = 1.2
      break
    case 3: // صعب
      gravity = 1.2
      gap = 160
      gameSpeed = 1.5
      break
  }
  
  // إعادة تعيين النتيجة والعناصر
  if (scoreBoard) scoreBoard.textContent = "Score: 0"
  if (bird) {
    bird.style.left = birdLeft + 'px'
    bird.style.bottom = birdBottom + 'px'
    
    // إزالة جميع التأثيرات البصرية
    if (gameSettings.effectsEnabled) {
      bird.classList.remove('jumping', 'falling')
    }
  }
}

// ===== بدء اللعبة =====
function startGame() {
  // التأكد من تهيئة المتغيرات
  if (!bird || !gameDisplay || !ground || !scoreBoard || !startScreen || !gameOverScreen || !finalScore) {
    console.error('لم يتم تهيئة المتغيرات بشكل صحيح')
    return
  }
  
  // إخفاء شاشة البداية
  startScreen.style.display = "none"
  
  // تهيئة متغيرات اللعبة
  initGameVars()
  
  // إظهار تلميح التحكم
  showControlsHint()
  
  // إضافة مستمعي الأحداث للتحكم
  if (typeof document.addEventListener === 'function') {
    document.addEventListener('keydown', control)
    document.addEventListener('click', handleClick)
    
    // فحص دعم Touch Events
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
      document.addEventListener('touchstart', handleTouch)
    }
  }
  
  // بدء حلقة اللعبة
  gameTimerId = setInterval(gameLoop, 16) // 60 FPS
  generateObstacle()
  
  // إعادة تشغيل حركة الأرض
  if (ground) {
    ground.classList.add('moving')
  }
}

// ===== تلميح التحكم =====
let hintElement = null
let hintStyleElement = null

function showControlsHint() {
  if (hintElement) return // تجنب التكرار
  
  hintElement = document.createElement('div')
  hintElement.id = 'controlsHint'
  hintElement.textContent = 'Press SPACE, Click, or Touch to jump!'
  hintElement.style.cssText = `
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: white;
    font-size: 18px;
    font-weight: bold;
    text-align: center;
    z-index: 200;
    background: rgba(0, 0, 0, 0.7);
    padding: 15px 25px;
    border-radius: 10px;
    backdrop-filter: blur(5px);
    border: 2px solid rgba(255, 255, 255, 0.3);
  `
  
  if (!hintStyleElement) {
    hintStyleElement = document.createElement('style')
    hintStyleElement.textContent = `
      #controlsHint {
        animation: fadeOut 3s ease-out forwards;
      }
      @keyframes fadeOut {
        0% { opacity: 1; }
        70% { opacity: 1; }
        100% { opacity: 0; visibility: hidden; }
      }
    `
    document.head.appendChild(hintStyleElement)
  }
  
  gameDisplay.appendChild(hintElement)
}

function hideControlsHint() {
  if (hintElement) {
    hintElement.style.opacity = '0'
    setTimeout(() => {
      if (hintElement && hintElement.parentNode) {
        hintElement.remove()
        hintElement = null
      }
    }, 300)
  }
}

// ===== مؤثر النتيجة =====
let scoreEffectElement = null

function showScoreEffect() {
  if (!gameSettings.effectsEnabled) return
  
  if (!scoreEffectElement) {
    scoreEffectElement = document.createElement('div')
    scoreEffectElement.className = 'score-effect'
    
    if (!document.getElementById('scoreEffectStyle')) {
      const style = document.createElement('style')
      style.id = 'scoreEffectStyle'
      style.textContent = `
        .score-effect {
          position: absolute;
          color: #ffeb3b;
          font-size: 24px;
          font-weight: bold;
          z-index: 20;
          pointer-events: none;
          animation: scorePop 1s ease-out forwards;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
        }
        @keyframes scorePop {
          0% { transform: scale(0.5); opacity: 0; }
          50% { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(1); opacity: 0; }
        }
      `
      document.head.appendChild(style)
    }
  }
  
  scoreEffectElement.textContent = '+1'
  scoreEffectElement.style.left = (birdLeft + 20) + 'px'
  scoreEffectElement.style.bottom = (birdBottom + 20) + 'px'
  
  gameDisplay.appendChild(scoreEffectElement)
  
  setTimeout(() => {
    if (scoreEffectElement && scoreEffectElement.parentNode) {
      scoreEffectElement.remove()
    }
  }, 1000)
}

// ===== نظام التحكم =====
function control(e) {
  if (e.code === "Space" || e.key === " " || e.key === "ArrowUp") {
    e.preventDefault()
    handleJump()
  }
}

function handleClick(e) {
  e.preventDefault()
  hideControlsHint()
  handleJump()
}

function handleTouch(e) {
  e.preventDefault()
  e.stopPropagation()
  hideControlsHint()
  handleJump()
}

function handleJump() {
  const currentTime = Date.now()
  if (currentTime - lastJumpTime > JUMP_COOLDOWN && !isGameOver) {
    lastJumpTime = currentTime
    
    // استئناف AudioContext إذا كان معلق
    if (gameSounds.audioContext && gameSounds.audioContext.state === 'suspended') {
      gameSounds.audioContext.resume()
    }
    
    jump()
  }
}

function jump() {
  if (isGameOver) return
  
  birdBottom += 50
  bird.style.bottom = birdBottom + 'px'
  
  // تشغيل صوت القفز
  gameSounds.playJump()
  
  // تأثيرات بصرية
  if (gameSettings.effectsEnabled && bird) {
    bird.classList.remove('falling')
    bird.classList.add('jumping')
    setTimeout(() => {
      if (bird) {
        bird.classList.remove('jumping')
      }
    }, 150)
  }
  
  hideControlsHint()
}

// ===== حلقة اللعبة الرئيسية =====
function gameLoop() {
  if (isGameOver) return
  
  birdBottom -= gravity
  bird.style.bottom = birdBottom + 'px'
  
  // تأثيرات بصرية للسقوط
  if (gameSettings.effectsEnabled && bird && !bird.classList.contains('jumping')) {
    bird.classList.add('falling')
  }
  
  // فحص التصادمات
  checkAllCollisions()
}

// ===== نظام كشف التصادم الدقيق باستخدام getBoundingClientRect =====
function checkAllCollisions() {
  if (!bird) return
  
  const birdRect = bird.getBoundingClientRect()
  const gameContainerRect = gameDisplay.getBoundingClientRect()
  
  // تحويل الإحداثيات النسبية للحاوية
  const birdTop = birdRect.top - gameContainerRect.top
  const birdBottom = birdRect.bottom - gameContainerRect.top
  const birdLeft = birdRect.left - gameContainerRect.left
  const birdRight = birdRect.right - gameContainerRect.left
  
  // فحص التصادم مع الأرض - استخدام ارتفاع ديناميكي
  const groundHeight = ground ? ground.offsetHeight : 80
  if (birdBottom >= gameContainerRect.height - groundHeight) {
    gameOver()
    return
  }
  
  // فحص التصادم مع السقف
  if (birdTop <= 0) {
    gameOver()
    return
  }
  
  // فحص التصادم مع العقبات
  for (let i = 0; i < activeObstacles.length; i++) {
    const obstacle = activeObstacles[i]
    
    if (!obstacle.element || !obstacle.topElement) continue
    
    const obstacleRect = obstacle.element.getBoundingClientRect()
    const topObstacleRect = obstacle.topElement.getBoundingClientRect()
    
    // تحويل إحداثيات العقبات النسبية للحاوية
    const obstacleTop = obstacleRect.top - gameContainerRect.top
    const obstacleBottom = obstacleRect.bottom - gameContainerRect.top
    const obstacleLeft = obstacleRect.left - gameContainerRect.left
    const obstacleRight = obstacleRect.right - gameContainerRect.left
    
    const topObstacleTop = topObstacleRect.top - gameContainerRect.top
    const topObstacleBottom = topObstacleRect.bottom - gameContainerRect.top
    const topObstacleLeft = topObstacleRect.left - gameContainerRect.left
    const topObstacleRight = topObstacleRect.right - gameContainerRect.left
    
    // فحص التصادم مع العقبة السفلية
    if (birdLeft < obstacleRight && 
        birdRight > obstacleLeft && 
        birdTop < obstacleBottom && 
        birdBottom > obstacleTop) {
      gameOver()
      return
    }
    
    // فحص التصادم مع العقبة العلوية
    if (birdLeft < topObstacleRight && 
        birdRight > topObstacleLeft && 
        birdTop < topObstacleBottom && 
        birdBottom > topObstacleTop) {
      gameOver()
      return
    }
    
    // تسجيل النقاط
    if (obstacleLeft + 70 < birdLeft && !obstacle.scored) {
      obstacle.scored = true
      score++
      scoreBoard.textContent = "Score: " + score
      gameSounds.playPoint()
      showScoreEffect()
      
      // زيادة الصعوبة تدريجياً
      if (score % 15 === 0) {
        gameSpeed += 0.03
        if (gap > 100) gap -= 1
      }
    }
  }
}

// ===== نظام تتبع العقبات الاحترافي =====
let activeObstacles = [] // مصفوفة لتتبع جميع العقبات النشطة
let generateObstacleTimeout = null // متغير لتتبع setTimeout

function generateObstacle() {
  if (isGameOver) return
  
  // فحص صحة gameDisplay قبل الاستخدام
  if (!gameDisplay || !gameDisplay.offsetWidth) {
    console.error('gameDisplay غير صحيح')
    return
  }
  
  // الحصول على الأبعاد الديناميكية
  const gameHeight = gameDisplay.offsetHeight
  const groundElement = document.querySelector('.ground')
  const groundHeight = groundElement ? groundElement.offsetHeight : 80
  
  // حساب الارتفاع العشوائي للعقبة السفلية
  const minHeight = 50
  const maxHeight = gameHeight - groundHeight - gap - 50
  const obstacleHeight = Math.random() * (maxHeight - minHeight) + minHeight
  
  // إنشاء العقبة السفلية
  const obstacle = document.createElement('div')
  obstacle.className = 'obstacle'
  obstacle.style.left = gameDisplay.offsetWidth + 'px'
  obstacle.style.bottom = '0px'
  obstacle.style.height = obstacleHeight + 'px'
  obstacle.style.width = '70px'
  obstacle.style.minWidth = '70px'
  obstacle.style.maxWidth = '70px'
  
  // إنشاء العقبة العلوية
  const topObstacle = document.createElement('div')
  topObstacle.className = 'topObstacle'
  topObstacle.style.left = gameDisplay.offsetWidth + 'px'
  topObstacle.style.top = '0px'
  topObstacle.style.bottom = 'auto'
  topObstacle.style.height = (gameHeight - groundHeight - gap - obstacleHeight) + 'px'
  topObstacle.style.width = '70px'
  topObstacle.style.minWidth = '70px'
  topObstacle.style.maxWidth = '70px'
  
  // إضافة العقبات للعبة
  gameDisplay.appendChild(obstacle)
  gameDisplay.appendChild(topObstacle)
  
  // بيانات العقبة للتتبع
  const obstacleData = {
    element: obstacle,
    topElement: topObstacle,
    left: gameDisplay.offsetWidth,
    topBottom: 0,
    scored: false,
    timerId: null
  }
  
  activeObstacles.push(obstacleData)
  
  // دالة تحريك العقبة
  function moveObstacle() {
    if (isGameOver) {
      clearInterval(obstacleData.timerId)
      return
    }
    
    obstacleData.left -= gameSpeed
    obstacle.style.left = obstacleData.left + 'px'
    topObstacle.style.left = obstacleData.left + 'px'
    
    const obstacleLeft = obstacleData.left
    
    if (obstacleLeft <= -70) {
      clearInterval(obstacleData.timerId)
      obstacle.remove()
      topObstacle.remove()
      
      // إزالة العقبة من المصفوفة
      const index = activeObstacles.indexOf(obstacleData)
      if (index > -1) {
        activeObstacles.splice(index, 1)
      }
    }
  }
  
  // بدء تحريك العقبة
  obstacleData.timerId = setInterval(moveObstacle, 16) // 60 FPS
  if (!isGameOver) {
    generateObstacleTimeout = setTimeout(generateObstacle, 3000)
  }
}

// ===== إنهاء اللعبة =====
function gameOver() {
  clearInterval(gameTimerId)
  isGameOver = true
  
  // تشغيل صوت الاصطدام
  gameSounds.playHit()
  
  // إلغاء setTimeout لتجنب تسريبات الذاكرة
  if (generateObstacleTimeout) {
    clearTimeout(generateObstacleTimeout)
    generateObstacleTimeout = null
  }
  
  // إيقاف حركة الأرض
  if (ground) {
    ground.classList.remove('moving')
  }
  
  // تحسين عرض النتيجة النهائية مع فحص localStorage
  let bestScore = 0
  let isNewRecord = false
  
  if (typeof Storage !== 'undefined' && localStorage) {
    try {
      const savedScore = localStorage.getItem('flappyBirdBestScore')
      if (savedScore) {
        bestScore = parseInt(savedScore)
      }
    } catch (error) {
      console.warn('خطأ في قراءة أفضل نتيجة:', error)
    }
  }
  
  if (score > bestScore) {
    bestScore = score
    isNewRecord = true
    
    if (typeof Storage !== 'undefined' && localStorage) {
      try {
        localStorage.setItem('flappyBirdBestScore', score)
      } catch (error) {
        console.warn('خطأ في حفظ أفضل نتيجة:', error)
      }
    }
  }
  
  const gameOverText = isNewRecord ? '🎉 New Record!' : 'Game Over 😢'
  const scoreText = `Score: ${score}`
  const bestScoreText = isNewRecord ? '🎉 New Record!' : `Best: ${bestScore}`
  
  finalScore.innerHTML = `
    <div style="font-size: 24px; margin-bottom: 10px;">${gameOverText}</div>
    <div style="font-size: 20px; margin-bottom: 8px;">${scoreText}</div>
    <div style="font-size: 16px; color: #ffeb3b;">${bestScoreText}</div>
  `
  
  // إظهار شاشة Game Over
  if (gameOverScreen) {
    gameOverScreen.style.display = "flex"
    console.log('📺 تم إظهار شاشة Game Over')
  } else {
    console.error('❌ لم يتم العثور على شاشة Game Over')
  }
}

// ===== إعادة تشغيل اللعبة =====
function restartGame() {
  console.log('🔄 تم استدعاء restartGame')
  
  // التأكد من تهيئة المتغيرات
  if (!gameDisplay || !gameOverScreen) {
    console.error('لم يتم تهيئة المتغيرات بشكل صحيح')
    return
  }
  
  console.log('🎮 بدء إعادة تشغيل اللعبة...')
  
  // إيقاف جميع المؤقتات
  if (gameTimerId) {
    clearInterval(gameTimerId)
    gameTimerId = null
  }
  
  // إيقاف جميع مؤقتات العقبات النشطة
  activeObstacles.forEach(obstacle => {
    if (obstacle.timerId) {
      clearInterval(obstacle.timerId)
    }
  })
  
  // إلغاء setTimeout لتجنب تسريبات الذاكرة
  if (generateObstacleTimeout) {
    clearTimeout(generateObstacleTimeout)
    generateObstacleTimeout = null
  }
  
  // إعادة تعيين جميع المؤقتات
  gameTimerId = null
  
  // إزالة جميع مستمعي الأحداث قبل إعادة التشغيل
  document.removeEventListener('keydown', control)
  document.removeEventListener('click', handleClick)
  document.removeEventListener('touchstart', handleTouch)
  
  // إزالة جميع العقبات الموجودة - محسنة
  const obstacles = document.querySelectorAll('.obstacle, .topObstacle')
  obstacles.forEach(obstacle => obstacle.remove())
  
  // إعادة تعيين مصفوفة العقبات النشطة
  activeObstacles = []
  
  // إعادة تعيين المتغيرات
  isGameOver = false
  score = 0
  
  // إعادة تعيين موضع الطائر والعناصر البصرية
  if (bird) {
    birdLeft = 150
    birdBottom = 250
    bird.style.left = birdLeft + 'px'
    bird.style.bottom = birdBottom + 'px'
    
    // إزالة جميع التأثيرات البصرية
    if (gameSettings.effectsEnabled) {
      bird.classList.remove('jumping', 'falling')
    }
  }
  
  // إعادة تعيين النتيجة
  if (scoreBoard) {
    scoreBoard.textContent = "Score: 0"
  }
  
  // إخفاء شاشة Game Over
  if (gameOverScreen) {
    gameOverScreen.style.display = "none"
  }
  
  // التأكد من إعادة تشغيل حركة الأرض
  if (ground) {
    ground.classList.add('moving')
  }
  
  // إعادة تشغيل اللعبة
  console.log('🚀 بدء اللعبة الجديدة...')
  startGame()
  
  console.log('✅ تم إعادة تشغيل اللعبة بنجاح')
}

// ===== نظام الإعدادات والإحصائيات =====
function loadSettings() {
  if (typeof Storage === 'undefined' || !localStorage) return
  
  try {
    const savedSettings = localStorage.getItem('flappyBirdSettings')
    if (savedSettings) {
      const parsedSettings = JSON.parse(savedSettings)
      gameSettings = { ...gameSettings, ...parsedSettings }
    }
  } catch (error) {
    console.warn('خطأ في تحليل إعدادات اللعبة:', error)
    // استخدام الإعدادات الافتراضية في حالة الخطأ
    gameSettings = {
      difficulty: 2,
      soundEnabled: true,
      effectsEnabled: true
    }
  }
}

function saveSettings() {
  // فحص دعم localStorage
  if (typeof Storage !== 'undefined' && localStorage) {
    try {
      localStorage.setItem('flappyBirdSettings', JSON.stringify(gameSettings))
    } catch (error) {
      console.warn('خطأ في حفظ الإعدادات:', error)
    }
  } else {
    console.warn('localStorage غير مدعوم في هذا المتصفح')
  }
  showMainMenu()
}

function updateSettingsUI() {
  const difficultySlider = document.getElementById('difficultySlider')
  const difficultyText = document.getElementById('difficultyText')
  const soundToggle = document.getElementById('soundToggle')
  const effectsToggle = document.getElementById('effectsToggle')
  
  if (difficultySlider) {
    difficultySlider.value = gameSettings.difficulty
  }
  if (difficultyText) {
    const difficultyNames = ['سهل', 'متوسط', 'صعب']
    difficultyText.textContent = difficultyNames[gameSettings.difficulty - 1]
  }
  if (soundToggle) {
    soundToggle.checked = gameSettings.soundEnabled
  }
  if (effectsToggle) {
    effectsToggle.checked = gameSettings.effectsEnabled
  }
}

function setupSettingsListeners() {
  const difficultySlider = document.getElementById('difficultySlider')
  const difficultyText = document.getElementById('difficultyText')
  const soundToggle = document.getElementById('soundToggle')
  const effectsToggle = document.getElementById('effectsToggle')
  
  if (difficultySlider) {
    difficultySlider.addEventListener('input', (e) => {
      const value = parseInt(e.target.value)
      if (!isNaN(value) && value >= 1 && value <= 3) {
        gameSettings.difficulty = value
        const difficultyNames = ['سهل', 'متوسط', 'صعب']
        if (difficultyText) {
          difficultyText.textContent = difficultyNames[value - 1]
        }
      }
    })
  }
  
  if (soundToggle) {
    soundToggle.addEventListener('change', (e) => {
      gameSettings.soundEnabled = e.target.checked
    })
  }
  
  if (effectsToggle) {
    effectsToggle.addEventListener('change', (e) => {
      gameSettings.effectsEnabled = e.target.checked
    })
  }
}

function updateBestScoreDisplay() {
  // فحص دعم localStorage
  if (typeof Storage !== 'undefined' && localStorage) {
    try {
      const savedScore = localStorage.getItem('flappyBirdBestScore')
      if (savedScore) {
        const bestScore = parseInt(savedScore)
        if (!isNaN(bestScore) && bestScoreDisplay) {
          bestScoreDisplay.textContent = `Best Score: ${bestScore}`
        }
      }
    } catch (error) {
      console.warn('خطأ في قراءة أفضل نتيجة:', error)
    }
  }
}

function toggleSettings() {
  if (startScreen) startScreen.style.display = "none"
  if (settingsScreen) {
    settingsScreen.style.display = "flex"
    updateSettingsUI()
  }
}

function showMainMenu() {
  console.log('🏠 تم استدعاء showMainMenu')
  
  // إيقاف اللعبة إذا كانت تعمل
  if (gameTimerId) {
    clearInterval(gameTimerId)
    gameTimerId = null
  }
  
  // إعادة تعيين حالة اللعبة
  isGameOver = false
  
  // إخفاء جميع الشاشات
  if (gameOverScreen) {
    gameOverScreen.style.display = "none"
    console.log('📺 تم إخفاء شاشة Game Over')
  }
  if (settingsScreen) {
    settingsScreen.style.display = "none"
    console.log('⚙️ تم إخفاء شاشة الإعدادات')
  }
  
  // إظهار شاشة البداية
  if (startScreen) {
    startScreen.style.display = "flex"
    console.log('🎮 تم إظهار شاشة البداية')
  } else {
    console.error('❌ لم يتم العثور على شاشة البداية')
  }
  
  // تحديث أفضل نتيجة
  updateBestScoreDisplay()
  
  // إعادة تهيئة متغيرات اللعبة
  initGameVars()
}
