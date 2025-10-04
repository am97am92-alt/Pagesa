// ===== نظام Flappy Bird الاحترافي - دقة عالية جداً =====

// متغيرات اللعبة الأساسية
let bird, gameDisplay, ground, scoreBoard, startScreen, gameOverScreen, finalScore, settingsScreen, bestScoreDisplay
let birdLeft, birdBottom, gravity, isGameOver, gap, score, gameTimerId, gameSpeed

// إعدادات اللعبة
let gameSettings = {
  difficulty: 2, // 1: سهل، 2: متوسط، 3: صعب
  soundEnabled: true,
  effectsEnabled: true
}

// تهيئة الأصوات مع AudioContext واحد
let gameSounds = {
  audioContext: null,
  init: function() {
    if (gameSettings.soundEnabled) {
      try {
        // إنشاء AudioContext واحد فقط
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)()
      } catch (error) {
        console.warn('لا يمكن تهيئة الأصوات:', error)
      }
    }
  },
  createTone: function(frequency, duration, type) {
    if (!this.audioContext) return
    
    const oscillator = this.audioContext.createOscillator()
    const gainNode = this.audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(this.audioContext.destination)
    
    oscillator.frequency.value = frequency
    oscillator.type = type
    gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration)
    
    oscillator.start(this.audioContext.currentTime)
    oscillator.stop(this.audioContext.currentTime + duration)
  },
  playJump: function() {
    if (gameSettings.soundEnabled && this.audioContext) {
      this.createTone(440, 0.1, 'sine')
    }
  },
  playHit: function() {
    if (gameSettings.soundEnabled && this.audioContext) {
      this.createTone(150, 0.3, 'sawtooth')
    }
  },
  playPoint: function() {
    if (gameSettings.soundEnabled && this.audioContext) {
      this.createTone(880, 0.05, 'square')
    }
  }
}

// تهيئة المتغيرات عند تحميل الصفحة
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
  
  // تحميل الإعدادات المحفوظة
  loadSettings()
  updateBestScoreDisplay()
  
  // إعداد مستمعي الأحداث للإعدادات
  setupSettingsListeners()
  
  // إعداد مستمعي الأحداث للأزرار
  setupButtonListeners()
})

// إصلاح تسريبات الذاكرة - تنظيف Event Listeners
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

function startGame() {
  // التأكد من تهيئة المتغيرات
  if (!bird || !gameDisplay || !ground || !scoreBoard || !startScreen || !gameOverScreen || !finalScore) {
    console.error('لم يتم تهيئة المتغيرات بشكل صحيح')
    return
  }
  
  startScreen.style.display = "none"
  initGameVars()
  
  // إعادة تشغيل حركة الأرض
  if (ground) {
    ground.classList.add('moving')
  }
  
  gameTimerId = setInterval(gameLoop, 16) // 60 FPS
  generateObstacle()
  
  // إضافة جميع طرق التحكم مع Feature Detection
  if (typeof document.addEventListener === 'function') {
  document.addEventListener('keydown', control)
    document.addEventListener('click', handleClick)
    
    // فحص دعم Touch Events
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
      document.addEventListener('touchstart', handleTouch)
    }
  }
  
  // إضافة تعليمات التحكم
  showControlsHint()
}

// إصلاح تسريبات الذاكرة - إدارة DOM nodes
let hintElement = null
let hintStyleElement = null
let scoreEffectElement = null

function showControlsHint() {
  // تنظيف العناصر القديمة
  if (hintElement && hintElement.parentNode) {
    hintElement.remove()
  }
  
  // إضافة تلميح للتحكم
  hintElement = document.createElement('div')
  hintElement.id = 'controlsHint'
  hintElement.textContent = 'Press SPACE, Click, or Touch to jump!'
  hintElement.style.cssText = `
    position: absolute;
    top: 60px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0,0,0,0.7);
    color: white;
    padding: 8px 16px;
    border-radius: 20px;
    font-size: 14px;
    z-index: 6;
    opacity: 1;
    transition: opacity 0.5s ease;
  `
  
  // إضافة CSS للانيميشن (مرة واحدة فقط)
  if (!hintStyleElement) {
    hintStyleElement = document.createElement('style')
    hintStyleElement.id = 'hintAnimation'
    hintStyleElement.textContent = `
      @keyframes fadeOut {
        0% { opacity: 1; }
        70% { opacity: 1; }
        100% { opacity: 0; }
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
    }, 500)
  }
}

function showScoreEffect() {
  if (!gameSettings.effectsEnabled) return
  
  // إعادة استخدام العنصر إذا كان موجوداً
  if (!scoreEffectElement) {
    scoreEffectElement = document.createElement('div')
    scoreEffectElement.style.cssText = `
      position: absolute;
      top: 100px;
      left: 50%;
      transform: translateX(-50%);
      color: #FFD700;
      font-size: 24px;
      font-weight: bold;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
      z-index: 7;
      pointer-events: none;
      animation: scorePop 1s ease-out forwards;
    `
    
    // إضافة CSS للانيميشن
    if (!document.getElementById('scoreEffectStyle')) {
      const style = document.createElement('style')
      style.id = 'scoreEffectStyle'
      style.textContent = `
        @keyframes scorePop {
          0% {
            opacity: 1;
            transform: translateX(-50%) translateY(0) scale(1);
          }
          50% {
            opacity: 1;
            transform: translateX(-50%) translateY(-20px) scale(1.2);
          }
          100% {
            opacity: 0;
            transform: translateX(-50%) translateY(-40px) scale(0.8);
          }
        }
      `
      document.head.appendChild(style)
    }
  }
  
  // إعادة تعيين النص والانيميشن
  scoreEffectElement.textContent = '+1'
  scoreEffectElement.style.animation = 'none'
  scoreEffectElement.offsetHeight // Force reflow
  scoreEffectElement.style.animation = 'scorePop 1s ease-out forwards'
  
  // إضافة العنصر إذا لم يكن موجوداً
  if (!scoreEffectElement.parentNode) {
    gameDisplay.appendChild(scoreEffectElement)
  }
}

// نظام التحكم المحسن
let lastJumpTime = 0
const JUMP_COOLDOWN = 100 // منع القفز المتكرر السريع

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
    
    // إعادة تشغيل AudioContext إذا كان معلق
    if (gameSounds.audioContext && gameSounds.audioContext.state === 'suspended') {
      gameSounds.audioContext.resume()
    }
    
    jump()
  }
}

function jump() {
  if (!isGameOver && bird) {
    birdBottom += 45
    
    // منع الطائر من تجاوز الحدود العليا
    if (birdBottom > 460) {
      birdBottom = 460
    }
    
  bird.style.bottom = birdBottom + 'px'
    
    // تشغيل صوت القفزة
    gameSounds.playJump()
    
    // إخفاء التلميح عند أول قفزة
    hideControlsHint()
    
    // إضافة تأثير بصري للقفز (إذا كانت مفعلة)
    if (gameSettings.effectsEnabled) {
      bird.classList.remove('falling')
      bird.classList.add('jumping')
      setTimeout(() => {
        if (bird) {
          bird.classList.remove('jumping')
          bird.classList.add('falling')
        }
      }, 150)
    }
  }
}

function gameLoop() {
  if (!isGameOver && bird) {
    birdBottom -= gravity
    
    // منع الطائر من تجاوز الحدود القصوى
    if (birdBottom < 0) {
      birdBottom = 0
    }
    if (birdBottom > 460) {
      birdBottom = 460
    }
    
    // تحديث موضع الطائر
    bird.style.bottom = birdBottom + 'px'
    
    // ===== كشف التصادم مع جميع العقبات النشطة =====
    checkAllCollisions()
  }
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
  
  let obstacleLeft = gameDisplay.offsetWidth
  
  // إنشاء العقبات بحجم واحد مع طول متغير - استخدام أبعاد ديناميكية
  const gameHeight = gameDisplay.offsetHeight // ارتفاع منطقة اللعبة من DOM
  const groundElement = document.querySelector('.ground')
  const groundHeight = groundElement ? groundElement.offsetHeight : 80 // ارتفاع الأرض من DOM
  const playAreaHeight = gameHeight - groundHeight
  // استخدام متغير gap العام بدلاً من الثابت
  
  // طول العقبة السفلية (متغير)
  let obstacleHeight = Math.random() * 120 + 80 // من 80 إلى 200
  if (isNaN(obstacleHeight) || obstacleHeight < 80 || obstacleHeight > 200) {
    obstacleHeight = 140 // قيمة افتراضية
  }
  
  // طول العقبة العلوية (متغير أيضاً)
  let topObstacleHeight = playAreaHeight - obstacleHeight - gap // باقي المساحة
  if (topObstacleHeight < 50) {
    topObstacleHeight = 50 // حد أدنى
  }
  
  // مواضع العقبات
  let obstacleBottom = groundHeight  // الأرض تبدأ من 80px
  let topObstacleBottom = gameHeight - topObstacleHeight // ملتصق بالسقف تماماً
  
  const obstacle = document.createElement('div')
  const topObstacle = document.createElement('div')

  obstacle.classList.add('obstacle')
  topObstacle.classList.add('topObstacle')
  gameDisplay.appendChild(obstacle)
  gameDisplay.appendChild(topObstacle)

  // تطبيق المواضع والأحجام
  obstacle.style.left = obstacleLeft + 'px'
  topObstacle.style.left = obstacleLeft + 'px'
  obstacle.style.bottom = obstacleBottom + 'px'
  obstacle.style.height = obstacleHeight + 'px'
  topObstacle.style.bottom = topObstacleBottom + 'px'
  topObstacle.style.height = topObstacleHeight + 'px'
  
  // التأكد من أن العقبة العلوية ملتصقة بالسقف
  topObstacle.style.top = '0px'
  topObstacle.style.bottom = 'auto'
  topObstacleBottom = 0 // إعادة تعيين الموضع
  
  // عرض ثابت للأعمدة (70px) - إجبار القيمة نهائياً
  obstacle.style.width = '70px'
  obstacle.style.minWidth = '70px'
  obstacle.style.maxWidth = '70px'
  obstacle.style.boxSizing = 'border-box'
  obstacle.style.padding = '0'
  obstacle.style.margin = '0'
  obstacle.style.border = 'none'
  obstacle.style.backgroundSize = '70px 100%'
  
  topObstacle.style.width = '70px'
  topObstacle.style.minWidth = '70px'
  topObstacle.style.maxWidth = '70px'
  topObstacle.style.boxSizing = 'border-box'
  topObstacle.style.padding = '0'
  topObstacle.style.margin = '0'
  topObstacle.style.border = 'none'
  topObstacle.style.backgroundSize = '70px 100%'

  // ===== إنشاء كائن العقبة مع جميع المعلومات المطلوبة =====
  const obstacleData = {
    id: Date.now() + Math.random(), // معرف فريد
    left: obstacleLeft,
    bottomHeight: obstacleHeight,
    topHeight: topObstacleHeight,
    topBottom: topObstacleBottom,
    element: obstacle,
    topElement: topObstacle,
    timerId: null
  }

  // إضافة العقبة إلى المصفوفة النشطة
  activeObstacles.push(obstacleData)

  function moveObstacle() {
    if (isGameOver) {
      clearInterval(obstacleData.timerId) // مصحح - استخدام obstacleData.timerId
      return
    }
    obstacleLeft -= gameSpeed
    obstacle.style.left = obstacleLeft + 'px'
    topObstacle.style.left = obstacleLeft + 'px'

    // تحديث موضع العقبة في البيانات
    obstacleData.left = obstacleLeft

    if (obstacleLeft <= -70) {
      clearInterval(obstacleData.timerId) // مصحح - استخدام obstacleData.timerId
      obstacle.remove()
      topObstacle.remove()
      
      // إزالة العقبة من المصفوفة النشطة
      const index = activeObstacles.findIndex(obs => obs.id === obstacleData.id)
      if (index > -1) {
        activeObstacles.splice(index, 1)
      }
      
      score++
      scoreBoard.textContent = "Score: " + score
      
      // تشغيل صوت تسجيل النقطة
      gameSounds.playPoint()
      
      // إضافة مؤثر بصري عند تسجيل النقطة
      showScoreEffect()
      
      // زيادة الصعوبة تدريجياً - محسنة ومعتدلة
      if (score % 15 === 0) { // كل 15 نقطة بدلاً من 10
        gameSpeed += 0.03 // زيادة أقل في السرعة
        if (gap > 100) gap -= 1 // تقليل أقل في المسافة
      }
    }
  }
  
  obstacleData.timerId = setInterval(moveObstacle, 16) // 60 FPS
  if (!isGameOver) {
    generateObstacleTimeout = setTimeout(generateObstacle, 3000) // مصحح - تتبع setTimeout
  }
}

function gameOver() {
  clearInterval(gameTimerId)
  isGameOver = true
  
  // تشغيل صوت التصادم
  gameSounds.playHit()
  
  // إلغاء setTimeout لتجنب تسريبات الذاكرة
  if (generateObstacleTimeout) {
    clearTimeout(generateObstacleTimeout)
    generateObstacleTimeout = null
  }
  
  // إزالة جميع مستمعي الأحداث
  document.removeEventListener('keydown', control)
  document.removeEventListener('click', handleClick)
  document.removeEventListener('touchstart', handleTouch)
  
  // تنظيف Event Listeners المخصصة
  removeAllEventListeners()
  
  // تنظيف DOM elements المخصصة
  if (hintElement && hintElement.parentNode) {
    hintElement.remove()
    hintElement = null
  }
  
  // إضافة تأثير بصري للطائر عند الموت (إذا كانت مفعلة)
  if (gameSettings.effectsEnabled && bird) {
    bird.classList.add('falling')
  }
  
  // إيقاف الأرض المتحركة بدون إضافة كلاس الأرض الثابتة
  if (ground) {
    ground.classList.remove('moving')
  }
  
  // تحسين عرض النتيجة النهائية مع فحص localStorage
  let bestScore = 0
  if (typeof Storage !== 'undefined' && localStorage) {
    try {
      const savedScore = localStorage.getItem('flappyBirdBestScore')
      if (savedScore && !isNaN(parseInt(savedScore))) {
        bestScore = parseInt(savedScore)
      }
    } catch (error) {
      console.warn('خطأ في قراءة أفضل نتيجة:', error)
    }
  }
  
  const isNewRecord = score > bestScore
  if (isNewRecord && typeof Storage !== 'undefined' && localStorage) {
    try {
      localStorage.setItem('flappyBirdBestScore', score)
    } catch (error) {
      console.warn('خطأ في حفظ أفضل نتيجة:', error)
    }
  }
  
  if (finalScore) {
    // تحسين مظهر النتيجة النهائية مع HTML آمن
    const gameOverText = 'Game Over 😢'
    const scoreText = `Score: ${score}`
    const bestScoreText = isNewRecord ? '🎉 New Record!' : `Best: ${bestScore}`
    
    finalScore.innerHTML = `
      <div style="font-size: 24px; margin-bottom: 10px;">${gameOverText}</div>
      <div style="font-size: 20px; margin-bottom: 8px;">${scoreText}</div>
      <div style="font-size: 18px; color: ${isNewRecord ? '#FFD700' : '#FFA500'};">
        ${bestScoreText}
      </div>
    `
  }
  if (gameOverScreen) {
    gameOverScreen.style.display = "flex"
    console.log('📺 تم إظهار شاشة Game Over')
  } else {
    console.error('❌ لم يتم العثور على شاشة Game Over')
  }
}

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

// نظام الإعدادات والإحصائيات
function loadSettings() {
  if (typeof Storage === 'undefined' || !localStorage) return
  
  try {
    const savedSettings = localStorage.getItem('flappyBirdSettings')
    if (savedSettings) {
      const parsedSettings = JSON.parse(savedSettings)
      // التحقق من صحة البيانات
      if (parsedSettings && typeof parsedSettings === 'object') {
        gameSettings = { ...gameSettings, ...parsedSettings }
      }
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
  updateSettingsUI()
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
    difficultyText.textContent = ['سهل', 'متوسط', 'صعب'][gameSettings.difficulty - 1]
  }
  
  if (soundToggle) soundToggle.checked = gameSettings.soundEnabled
  if (effectsToggle) effectsToggle.checked = gameSettings.effectsEnabled
}

function setupSettingsListeners() {
  const difficultySlider = document.getElementById('difficultySlider')
  const difficultyText = document.getElementById('difficultyText')
  const soundToggle = document.getElementById('soundToggle')
  const effectsToggle = document.getElementById('effectsToggle')
  
  if (difficultySlider) {
    difficultySlider.addEventListener('input', (e) => {
      const value = parseInt(e.target.value)
      // التحقق من صحة البيانات
      if (!isNaN(value) && value >= 1 && value <= 3) {
        gameSettings.difficulty = value
        if (difficultyText) {
          difficultyText.textContent = ['سهل', 'متوسط', 'صعب'][value - 1]
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
  let bestScore = 0
  // فحص دعم localStorage
  if (typeof Storage !== 'undefined' && localStorage) {
    try {
      const savedScore = localStorage.getItem('flappyBirdBestScore')
      if (savedScore && !isNaN(parseInt(savedScore))) {
        bestScore = parseInt(savedScore)
      }
    } catch (error) {
      console.warn('خطأ في قراءة أفضل نتيجة:', error)
    }
  }
  
  if (bestScoreDisplay) {
    bestScoreDisplay.textContent = `Best Score: ${bestScore}`
  }
}

function toggleSettings() {
  if (startScreen) startScreen.style.display = "none"
  if (settingsScreen) settingsScreen.style.display = "flex"
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