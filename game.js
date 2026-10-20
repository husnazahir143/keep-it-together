// Keep It Together: a small canvas game with no libraries.
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const campusBackground = new Image();
campusBackground.src = 'campus-game-bg.png';
function loadStudentFrame(fileName) {
  const frame = new Image();
  frame.addEventListener('load', draw);
  frame.src = fileName;
  return frame;
}
const idleStudentSprite = loadStudentFrame('student-idle.png');
const runningStudentSprites = Array.from({ length: 8 }, (_, index) =>
  loadStudentFrame(`student-run-${index + 1}.png`)
);
function makeEmojiSticker(emoji) {
  const size = 72;
  const emojiCanvas = document.createElement('canvas');
  emojiCanvas.width = size;
  emojiCanvas.height = size;
  const emojiContext = emojiCanvas.getContext('2d');
  emojiContext.font = '44px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif';
  emojiContext.textAlign = 'center';
  emojiContext.textBaseline = 'middle';
  emojiContext.fillText(emoji, size / 2, size / 2);

  const emojiPixels = emojiContext.getImageData(0, 0, size, size).data;
  const stickerCanvas = document.createElement('canvas');
  stickerCanvas.width = size;
  stickerCanvas.height = size;
  const stickerContext = stickerCanvas.getContext('2d');
  const stickerPixels = stickerContext.createImageData(size, size);
  const outlineRadius = 4;
  const shadowRadius = 6;

  // Expand the emoji's opaque pixels to make a rounded, shape-following sticker edge.
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let nearestDistance = Infinity;
      for (let offsetY = -shadowRadius; offsetY <= shadowRadius; offsetY++) {
        for (let offsetX = -shadowRadius; offsetX <= shadowRadius; offsetX++) {
          const distance = Math.hypot(offsetX, offsetY);
          if (distance > shadowRadius) continue;
          const sourceX = x + offsetX;
          const sourceY = y + offsetY;
          if (sourceX < 0 || sourceX >= size || sourceY < 0 || sourceY >= size) continue;
          const alpha = emojiPixels[(sourceY * size + sourceX) * 4 + 3];
          if (alpha > 24 && distance < nearestDistance) nearestDistance = distance;
        }
      }

      const pixel = (y * size + x) * 4;
      if (nearestDistance <= outlineRadius) {
        stickerPixels.data[pixel] = 255;
        stickerPixels.data[pixel + 1] = 255;
        stickerPixels.data[pixel + 2] = 255;
        stickerPixels.data[pixel + 3] = 255;
      } else if (nearestDistance <= shadowRadius) {
        stickerPixels.data[pixel] = 74;
        stickerPixels.data[pixel + 1] = 64;
        stickerPixels.data[pixel + 2] = 57;
        stickerPixels.data[pixel + 3] = Math.round(42 * (shadowRadius - nearestDistance) / (shadowRadius - outlineRadius));
      }
    }
  }

  stickerContext.putImageData(stickerPixels, 0, 0);
  stickerContext.drawImage(emojiCanvas, 0, 0);
  return stickerCanvas;
}

function makeDoublePointsSticker() {
  const sticker = document.createElement('canvas');
  sticker.width = 96;
  sticker.height = 96;
  const stickerContext = sticker.getContext('2d');
  stickerContext.beginPath();
  stickerContext.arc(48, 48, 37, 0, Math.PI * 2);
  stickerContext.fillStyle = '#ffd45c';
  stickerContext.fill();
  stickerContext.lineWidth = 10;
  stickerContext.strokeStyle = '#fffdf5';
  stickerContext.stroke();
  stickerContext.lineWidth = 2;
  stickerContext.strokeStyle = '#6a4525';
  stickerContext.stroke();
  stickerContext.fillStyle = '#5a321e';
  stickerContext.font = '900 33px Trebuchet MS, Arial, sans-serif';
  stickerContext.textAlign = 'center';
  stickerContext.textBaseline = 'middle';
  stickerContext.fillText('2×', 48, 49);
  return sticker;
}

function makeRinggitNoteSticker(denomination, accent, background) {
  const sticker = document.createElement('canvas');
  sticker.width = 112;
  sticker.height = 72;
  const stickerContext = sticker.getContext('2d');
  noteRoundedRectPath(stickerContext, 3, 4, 106, 64, 10);
  stickerContext.fillStyle = background;
  stickerContext.fill();
  stickerContext.lineWidth = 5;
  stickerContext.strokeStyle = '#fffdf5';
  stickerContext.stroke();
  noteRoundedRectPath(stickerContext, 8, 9, 96, 54, 7);
  stickerContext.strokeStyle = accent;
  stickerContext.lineWidth = 2;
  stickerContext.stroke();
  stickerContext.fillStyle = accent;
  stickerContext.globalAlpha = 0.18;
  stickerContext.beginPath();
  stickerContext.arc(57, 36, 21, 0, Math.PI * 2);
  stickerContext.fill();
  stickerContext.globalAlpha = 1;
  stickerContext.fillStyle = '#fffaf0';
  stickerContext.font = '900 27px Trebuchet MS, Arial, sans-serif';
  stickerContext.textAlign = 'center';
  stickerContext.textBaseline = 'middle';
  stickerContext.fillText(String(denomination), 57, 37);
  stickerContext.font = '900 9px Trebuchet MS, Arial, sans-serif';
  stickerContext.fillStyle = accent;
  stickerContext.textAlign = 'left';
  stickerContext.fillText('BANK NEGARA', 13, 18);
  stickerContext.textAlign = 'right';
  stickerContext.fillText('MALAYSIA', 99, 18);
  stickerContext.textAlign = 'left';
  stickerContext.fillText('RINGGIT', 13, 56);
  stickerContext.textAlign = 'right';
  stickerContext.fillText('RM', 99, 56);
  stickerContext.setLineDash([2, 2]);
  stickerContext.strokeStyle = `${accent}99`;
  stickerContext.lineWidth = 1;
  stickerContext.beginPath();
  stickerContext.moveTo(27, 22);
  stickerContext.lineTo(27, 50);
  stickerContext.moveTo(87, 22);
  stickerContext.lineTo(87, 50);
  stickerContext.stroke();
  stickerContext.setLineDash([]);
  return sticker;
}

function noteRoundedRectPath(context, x, y, width, height, radius) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
}

const itemImages = {
  book: makeEmojiSticker('📚'),
  dumbbell: makeEmojiSticker('🏃'),
  savingsJar: makeEmojiSticker('💰'),
  burger: makeEmojiSticker('🍔'),
  gamingController: makeEmojiSticker('🎮'),
  shoppingBags: makeEmojiSticker('🛍️'),
  timeBonus: makeEmojiSticker('⏱️'),
  doublePointsBonus: makeDoublePointsSticker(),
  rm1Note: makeRinggitNoteSticker(1, '#397d9b', '#9ec8d6'),
  rm5Note: makeRinggitNoteSticker(5, '#477c5e', '#a8d29c'),
  rm10Note: makeRinggitNoteSticker(10, '#a84f6d', '#e8b6c4'),
  financialThief: makeEmojiSticker('🥷'),
  monkeySticker: makeEmojiSticker('🐒')
};
const monkeySprite = itemImages.monkeySticker;
document.getElementById('monkey-instruction-image').src = monkeySprite.toDataURL();
const scoreText = document.getElementById('score');
const livesText = document.getElementById('lives');
const timeText = document.getElementById('time');
const timeLabel = document.querySelector('.time-stat .stat-label');
const screen = document.getElementById('screen');
const mainMenu = document.getElementById('main-menu');
const mainMenuPanel = document.getElementById('main-menu-panel');
const musicToggleButton = document.getElementById('music-toggle');
const soundEffectsToggleButton = document.getElementById('sound-effects-toggle');
const touchControls = document.getElementById('touch-controls');
const touchControlButtons = [...document.querySelectorAll('.touch-control[data-direction]')];
const pauseButton = document.getElementById('pause-button');
const pauseOverlay = document.getElementById('pause-overlay');
const pauseMenuPanel = document.getElementById('pause-menu-panel');
const pauseConfirmationPanel = document.getElementById('pause-confirmation-panel');
const resumeButton = document.getElementById('resume-button');
const pauseMainMenuButton = document.getElementById('pause-main-menu-button');
const confirmMainMenuButton = document.getElementById('confirm-main-menu-button');
const cancelMainMenuButton = document.getElementById('cancel-main-menu-button');
const instructionCard = document.getElementById('instruction-card');
const modeSelectionCard = document.getElementById('mode-selection-card');
const modeCards = [...document.querySelectorAll('.mode-card[data-mode]')];
const modePreviewTitle = document.getElementById('mode-preview-title');
const modePreviewCopy = document.getElementById('mode-preview-copy');
const confirmModeButton = document.getElementById('confirm-mode-button');
const modesBackButton = document.getElementById('modes-back-button');
const instructionsBackButton = document.getElementById('instructions-back-button');
const screenTitle = document.getElementById('screen-title');
const screenCopy = document.getElementById('screen-copy');
const modeInstructionDetail = document.getElementById('mode-instruction-detail');
const classicInstructions = document.getElementById('classic-instructions');
const monkeyInstructions = document.getElementById('monkey-instructions');
const financialMasterInstructions = document.getElementById('financial-master-instructions');
const financialTargetHud = document.getElementById('financial-target-hud');
const financialMoneyStat = document.getElementById('financial-money-stat');
const financialMoneyText = document.getElementById('financial-money');
const financialTargetText = document.getElementById('financial-target-text');
const financialTargetProgress = document.getElementById('financial-target-progress');
const financialFrenzyIndicator = document.getElementById('financial-frenzy-indicator');
const financialFrenzyTime = document.getElementById('financial-frenzy-time');
const timeBonusInstructionImage = document.getElementById('time-bonus-instruction-image');
const doublePointsInstructionImage = document.getElementById('double-points-instruction-image');
timeBonusInstructionImage.src = itemImages.timeBonus.toDataURL();
doublePointsInstructionImage.src = itemImages.doublePointsBonus.toDataURL();
const classicItemInstructionImages = {
  'classic-book-instruction-image': itemImages.book,
  'classic-exercise-instruction-image': itemImages.dumbbell,
  'classic-savings-instruction-image': itemImages.savingsJar,
  'classic-burger-instruction-image': itemImages.burger,
  'classic-gaming-instruction-image': itemImages.gamingController,
  'classic-shopping-instruction-image': itemImages.shoppingBags,
  'classic-mode-book-instruction-image': itemImages.book,
  'classic-mode-exercise-instruction-image': itemImages.dumbbell,
  'classic-mode-savings-instruction-image': itemImages.savingsJar,
  'classic-mode-burger-instruction-image': itemImages.burger,
  'classic-mode-gaming-instruction-image': itemImages.gamingController,
  'classic-mode-shopping-instruction-image': itemImages.shoppingBags
};
for (const [imageId, image] of Object.entries(classicItemInstructionImages)) {
  document.getElementById(imageId).src = image.toDataURL();
}
const financialInstructionImages = {
  'financial-rm1-instruction-image': itemImages.rm1Note,
  'financial-rm5-instruction-image': itemImages.rm5Note,
  'financial-rm10-instruction-image': itemImages.rm10Note
};
for (const [imageId, image] of Object.entries(financialInstructionImages)) {
  document.getElementById(imageId).src = image.toDataURL();
}
const resultCard = document.getElementById('result-card');
const resultEyebrow = document.getElementById('result-eyebrow');
const resultTitle = document.getElementById('result-title');
const resultCopy = document.getElementById('result-copy');
const newBestScoreMessage = document.getElementById('new-best-score-message');
const resultScoreRow = document.getElementById('result-score-row');
const resultScoreLabel = document.getElementById('result-score-label');
const resultScore = document.getElementById('result-score');
const resultBestScore = document.getElementById('result-best-score');
const resultTime = document.getElementById('result-time');
const resultTimeStat = document.getElementById('result-time-stat');
const resultTimeLabel = document.getElementById('result-time-label');
const resultLives = document.getElementById('result-lives');
const resultLivesStat = document.getElementById('result-lives-stat');
const resultFinancialMoneyStat = document.getElementById('result-financial-money-stat');
const resultFinancialMoney = document.getElementById('result-financial-money');
const startButton = document.getElementById('start-button');
const restartButton = document.getElementById('restart-button');
const resultPlayAgainButton = document.getElementById('result-play-again');
const resultMainMenuButton = document.getElementById('result-main-menu');
const toast = document.getElementById('toast');
const playArea = document.querySelector('.play-area');
const gameShell = document.querySelector('.game-shell');

let selectedMode = 'classic';
const GAME_MODES = {
  classic: {
    title: 'Main Mode',
    preview: 'Help Amina survive the challenges of university life! Collect good habits, and avoid bad habits to get through campus life.',
    instructionTitle: 'Main Mode',
    instructionCopy: 'Help Amina catch healthy habits, avoid distractions, and make it through university life!',
    details: '',
    playable: true
  },
  monkey: {
    title: 'Monkey Attack',
    preview: 'Oh no! Monkeys are attacking the campus! Help Amina collect good items, avoid bad habits and dodge mischievous monkeys.',
    instructionTitle: 'Monkey Attack',
    instructionCopy: 'Help Amina dodge monkeys and collect good habits to survive campus!',
    details: '',
    playable: true
  },
  financialMaster: {
    title: 'Financial Master',
    preview: "Amina is the secretary of her university hiking club, and it's time to raise funds for the annual club activity! Collect moneys, reach fundraising targets, and avoid sneaky thieves along the way.",
    instructionTitle: 'Financial Master',
    instructionCopy: 'Amina is the hiking club secretary. Help her collect money, protect the club funds, and keep fundraising.',
    details: '',
    playable: true
  },
};

const goodItems = [
  { name: 'Book', image: itemImages.book },
  { name: 'Exercise', image: itemImages.dumbbell },
  { name: 'Save Money', image: itemImages.savingsJar }
];
const badItems = [
  { name: 'Fast Food', image: itemImages.burger },
  { name: 'Gaming', image: itemImages.gamingController },
  { name: 'Shopping', image: itemImages.shoppingBags }
];
const financialNotes = [
  { denomination: 1, name: 'RM1 banknote', image: itemImages.rm1Note },
  { denomination: 5, name: 'RM5 banknote', image: itemImages.rm5Note },
  { denomination: 10, name: 'RM10 banknote', image: itemImages.rm10Note }
];
const FINANCIAL_TARGETS = [100];
const FINANCIAL_TARGET_INCREMENT = 150;
const FINANCIAL_THIEF_SPAWN_INTERVAL_SECONDS = 3.6;
const FINANCIAL_MONEY_WIND_CHANCE = 0.35;
const FINANCIAL_MONEY_LANE_COUNT = 8;
const FALLING_SPEED_STEP_SECONDS = 30;
const FALLING_SPEED_STEP_MULTIPLIER = 0.5;
const MAX_FALLING_SPEED_MULTIPLIER = 2;
const soundEffects = {
  buttonClick: 'Sound/button-click.mp3',
  goodCatch: 'Sound/good-catch.mp3',
  badCatch: 'Sound/bad-catch.mp3',
  timeBonus: 'Sound/time-bonus.mp3',
  victory: 'Sound/victory.mp3',
  gameOver: 'Sound/game-over.mp3'
};
const activeCatchSounds = new Set();
const activeSoundEffects = new Set();
const ROUND_DURATION_SECONDS = 60;
const TARGET_SCORE = 50;
const MAX_LIVES = 3;
const TIME_BONUS_CHANCE = 0.08;
const TIME_BONUS_SECONDS = 5;
const DOUBLE_POINTS_BONUS_CHANCE = 0.05;
const DOUBLE_POINTS_DURATION_SECONDS = 10;
const MONKEY_DOUBLE_POINTS_CHANCE = 0.05;
const MONKEY_DOUBLE_POINTS_DURATION_SECONDS = 10;
const MONKEY_BEST_SCORE_KEY = 'keepItTogether.monkeyAttack.bestScore';
const FINANCIAL_MASTER_BEST_SCORE_KEY = 'keepItTogether.financialMaster.bestScore';
const BEST_SCORE_KEY = 'keepItTogether.bestScore';
const MUSIC_SETTING_KEY = 'keepItTogether.musicEnabled';
const SOUND_EFFECTS_SETTING_KEY = 'keepItTogether.soundEffectsEnabled';
function readBestScore(key = BEST_SCORE_KEY) {
  try {
    const bestScore = Number(localStorage.getItem(key));
    return Number.isFinite(bestScore) && bestScore > 0 ? bestScore : 0;
  } catch {
    return 0;
  }
}
function saveBestScore(bestScore, key = BEST_SCORE_KEY) {
  try {
    localStorage.setItem(key, String(bestScore));
  } catch {
    // The current round still works if browser storage is unavailable.
  }
}
function recordBestScore(roundScore, key = BEST_SCORE_KEY) {
  const previousBestScore = readBestScore(key);
  const isNewBestScore = roundScore > previousBestScore;
  const bestScore = isNewBestScore ? roundScore : previousBestScore;
  if (isNewBestScore) saveBestScore(bestScore, key);
  return { bestScore, isNewBestScore };
}
function bestScoreKeyForMode(mode) {
  if (mode === 'monkey') return MONKEY_BEST_SCORE_KEY;
  if (mode === 'financialMaster') return FINANCIAL_MASTER_BEST_SCORE_KEY;
  return BEST_SCORE_KEY;
}
function updateModeBestScoreDisplays() {
  for (const card of modeCards) {
    const scoreLabel = card.querySelector('.mode-card-best-score');
    if (scoreLabel) scoreLabel.textContent = `🏆 BEST SCORE: ${readBestScore(bestScoreKeyForMode(card.dataset.mode))}`;
  }
}
function readAudioSetting(key) {
  try {
    return localStorage.getItem(key) !== 'false';
  } catch {
    return true;
  }
}
function saveAudioSetting(key, enabled) {
  try {
    localStorage.setItem(key, String(enabled));
  } catch {
    // Audio settings still work for this session when storage is unavailable.
  }
}
let musicEnabled = readAudioSetting(MUSIC_SETTING_KEY);
let soundEffectsEnabled = readAudioSetting(SOUND_EFFECTS_SETTING_KEY);
const menuMusic = new Audio('Music/main-menu-music.mp3');
const gameplayMusic = new Audio('Music/gameplay-music.mp3');
menuMusic.loop = true;
gameplayMusic.loop = true;
menuMusic.volume = 0.30;
gameplayMusic.volume = 0.30;
let activeBackgroundMusic = null;
let currentAudioScreen = 'menu';
let paused = false;

function stopBackgroundMusic() {
  menuMusic.pause();
  gameplayMusic.pause();
  activeBackgroundMusic = null;
}

function pauseBackgroundMusic() {
  if (activeBackgroundMusic) activeBackgroundMusic.pause();
  activeBackgroundMusic = null;
}

function playBackgroundMusic(audio, restart = false) {
  if (!musicEnabled) {
    stopBackgroundMusic();
    return;
  }
  if (activeBackgroundMusic === audio && !restart) return;
  stopBackgroundMusic();
  if (restart) audio.currentTime = 0;
  activeBackgroundMusic = audio;
  try {
    const playback = audio.play();
    if (playback && typeof playback.catch === 'function') {
      playback.catch(() => {
        if (activeBackgroundMusic === audio) activeBackgroundMusic = null;
      });
    }
  } catch {
    if (activeBackgroundMusic === audio) activeBackgroundMusic = null;
  }
}

function restoreBackgroundMusic(restart = false) {
  if (currentAudioScreen === 'gameplay' && paused) {
    stopBackgroundMusic();
    return;
  }
  if (currentAudioScreen === 'menu') playBackgroundMusic(menuMusic, restart);
  else if (currentAudioScreen === 'gameplay') playBackgroundMusic(gameplayMusic, restart);
  else stopBackgroundMusic();
}

function updateAudioToggleStates() {
  musicToggleButton.setAttribute('aria-checked', String(musicEnabled));
  soundEffectsToggleButton.setAttribute('aria-checked', String(soundEffectsEnabled));
}

function stopSoundEffects() {
  for (const audio of activeSoundEffects) {
    audio.pause();
    audio.currentTime = 0;
  }
  activeSoundEffects.clear();
  activeCatchSounds.clear();
}

function playSound(source, trackCatch = false) {
  if (!soundEffectsEnabled) return;
  let audio;
  try {
    audio = new Audio(source);
    if (source === soundEffects.timeBonus) audio.volume = 0.9;
    activeSoundEffects.add(audio);
    if (trackCatch) activeCatchSounds.add(audio);
    const clearSoundTracking = () => {
      activeSoundEffects.delete(audio);
      activeCatchSounds.delete(audio);
    };
    audio.addEventListener('ended', clearSoundTracking, { once: true });
    audio.addEventListener('error', clearSoundTracking, { once: true });
    const playback = audio.play();
    if (playback && typeof playback.catch === 'function') {
      playback.catch(() => {
        activeSoundEffects.delete(audio);
        activeCatchSounds.delete(audio);
      });
    }
  } catch {
    if (audio) {
      activeSoundEffects.delete(audio);
      activeCatchSounds.delete(audio);
    }
  }
}
const keys = new Set();
const touchDirections = new Set();
const activeTouchPointers = new Map();
const player = { x: 400, y: 436, width: 52, speed: 330 };
let items = [];
let score = 0;
let roundElapsed = 0;
let lives = MAX_LIVES;
let secondsLeft = ROUND_DURATION_SECONDS;
let doublePointsSecondsRemaining = 0;
let running = false;
let lastTime = 0;
let spawnTimer = 0;
let toastTimer = 0;
let gameTimer = 0;
let animationFrameId = null;
let scorePulseTimer = 0;
let shakeTimer = 0;
let lifePulseTimer = 0;
let animationTime = 0;
let playerDirection = 1;
let monkeyDoublePointsSecondsRemaining = 0;
let monkeySpawnCount = 0;
let financialTotalMoney = 0;
let financialTargetProgressAmount = 0;
let financialTargetIndex = 0;
let financialTargetAmount = FINANCIAL_TARGETS[0];
let financialFrenzySecondsRemaining = 0;
let financialTargetProcessing = false;
let financialThiefSpawnTimer = 0;
let financialHitCooldownSeconds = 0;
const MONKEY_LANE_COUNT = 8;

function roundedRectPath(x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function roundedRect(x, y, width, height, radius, color) {
  ctx.fillStyle = color;
  roundedRectPath(x, y, width, height, radius);
  ctx.fill();
}

function drawCloud(x, y, scale) {
  ctx.fillStyle = '#fffdf2';
  ctx.beginPath();
  ctx.arc(x, y, 15 * scale, 0, Math.PI * 2);
  ctx.arc(x + 17 * scale, y - 7 * scale, 20 * scale, 0, Math.PI * 2);
  ctx.arc(x + 39 * scale, y, 15 * scale, 0, Math.PI * 2);
  ctx.fill();
}

// Draw a soft, illustrated campus backdrop.
function drawCampus() {
  if (campusBackground.complete && campusBackground.naturalWidth > 0) {
    ctx.drawImage(campusBackground, 0, 0, canvas.width, canvas.height);
    // A very light warm wash keeps falling items readable against the artwork.
    ctx.fillStyle = 'rgba(255, 249, 231, 0.08)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    return;
  }

  const sky = ctx.createLinearGradient(0, 0, 0, 500);
  sky.addColorStop(0, '#80c4fb');
  sky.addColorStop(0.53, '#b9dcf4');
  sky.addColorStop(0.72, '#f5d9b2');
  sky.addColorStop(1, '#f5d7a5');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, 800, 500);

  drawCloud(90, 72, 0.7);
  drawCloud(586, 61, 0.85);

  // Soft green tree line behind the central campus building.
  ctx.fillStyle = '#8dbd88';
  ctx.beginPath(); ctx.moveTo(0, 249); ctx.quadraticCurveTo(110, 192, 218, 244); ctx.quadraticCurveTo(335, 197, 442, 244); ctx.quadraticCurveTo(592, 187, 800, 245); ctx.lineTo(800, 354); ctx.lineTo(0, 354); ctx.fill();

  // Broad, symmetrical campus facade and its simple triangular roof.
  ctx.fillStyle = '#d6a77b';
  ctx.beginPath(); ctx.moveTo(259, 195); ctx.lineTo(400, 92); ctx.lineTo(541, 195); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#f4d7ad';
  ctx.beginPath(); ctx.moveTo(279, 190); ctx.lineTo(400, 106); ctx.lineTo(521, 190); ctx.closePath(); ctx.fill();
  roundedRect(205, 191, 390, 119, 5, '#f0d8b4');
  roundedRect(190, 185, 420, 17, 4, '#cf9c70');
  roundedRect(333, 207, 134, 103, 3, '#d5ad84');
  ctx.fillStyle = '#75958a';
  for (const x of [225, 270, 315, 485, 530, 575]) {
    roundedRect(x, 216, 29, 45, 3, '#9dc7ca');
    ctx.fillStyle = '#e9d9bb';
    ctx.fillRect(x + 13, 216, 3, 45);
    ctx.fillRect(x, 237, 29, 3);
    ctx.fillStyle = '#75958a';
  }
  for (const x of [350, 375, 400, 425, 450]) {
    ctx.fillStyle = '#f4e3c6';
    ctx.fillRect(x, 210, 7, 93);
    ctx.fillStyle = '#a8c6bd';
    ctx.fillRect(x + 2, 220, 3, 31);
  }
  roundedRect(377, 261, 46, 49, 3, '#668779');
  ctx.fillStyle = '#f6e5c7';
  ctx.fillRect(397, 262, 3, 48);

  // Palms frame the building, echoing the campus artwork.
  for (const side of [-1, 1]) {
    const baseX = 168 + (side > 0 ? 464 : 0);
    ctx.strokeStyle = '#9b7654'; ctx.lineWidth = 9; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(baseX, 340); ctx.quadraticCurveTo(baseX + side * 22, 258, baseX + side * 5, 170); ctx.stroke();
    ctx.strokeStyle = '#6b9b62'; ctx.lineWidth = 7;
    for (let frond = -2; frond <= 2; frond++) {
      ctx.beginPath(); ctx.moveTo(baseX + side * 5, 172); ctx.quadraticCurveTo(baseX + side * (frond * 24), 133, baseX + side * (frond * 45 + 4), 174 + Math.abs(frond) * 7); ctx.stroke();
    }
    ctx.fillStyle = '#87b46c';
    for (let leaf = -2; leaf <= 2; leaf++) {
      ctx.beginPath(); ctx.ellipse(baseX + side * leaf * 16, 164 + Math.abs(leaf) * 3, 19, 5, side * leaf * 0.23, 0, Math.PI * 2); ctx.fill();
    }
  }

  // Warm tiled courtyard leading toward the entrance.
  const paving = ctx.createLinearGradient(0, 302, 0, 500);
  paving.addColorStop(0, '#e9c99c');
  paving.addColorStop(1, '#d99f73');
  ctx.fillStyle = paving;
  ctx.fillRect(0, 302, 800, 198);
  ctx.strokeStyle = 'rgba(142, 103, 74, 0.26)'; ctx.lineWidth = 1;
  for (let y = 326; y < 500; y += 27) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(800, y); ctx.stroke();
  }
  for (let x = -150; x <= 950; x += 92) {
    ctx.beginPath(); ctx.moveTo(400 + (x - 400) * 0.16, 302); ctx.lineTo(x, 500); ctx.stroke();
  }

  // Low flower beds add soft colour around the courtyard edges.
  for (const [x, y, color] of [[45, 316, '#e89091'], [90, 309, '#fff1d5'], [132, 321, '#f1bf67'], [672, 316, '#e89091'], [716, 307, '#fff1d5'], [758, 322, '#f1bf67']]) {
    ctx.fillStyle = '#69946a';
    ctx.beginPath(); ctx.ellipse(x, y + 7, 24, 9, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = color;
    for (const petal of [-1, 0, 1]) {
      ctx.beginPath(); ctx.arc(x + petal * 7, y + Math.abs(petal) * 2, 4, 0, Math.PI * 2); ctx.fill();
    }
  }

  // A light warm wash softens the illustration so it blends into the loaded artwork.
  ctx.fillStyle = 'rgba(255, 239, 211, 0.12)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawPlayer() {
  const moving = keys.has('ArrowLeft') || keys.has('ArrowRight') || keys.has('a') || keys.has('d') || touchDirections.size > 0;
  const runFrame = Math.floor(animationTime * 8) % runningStudentSprites.length;
  const sprite = moving ? runningStudentSprites[runFrame] : idleStudentSprite;
  const bob = moving ? 0 : Math.sin(animationTime * 2.5) * 1.2;
  const spriteHeight = 118;
  const spriteWidth = sprite.naturalWidth > 0
    ? spriteHeight * sprite.naturalWidth / sprite.naturalHeight
    : 78;
  const spriteTop = player.y - spriteHeight + 29 + bob;

  ctx.fillStyle = 'rgba(52, 84, 57, 0.22)';
  ctx.beginPath(); ctx.ellipse(player.x, player.y + 29, 25, 6, 0, 0, Math.PI * 2); ctx.fill();

  if (sprite.complete && sprite.naturalWidth > 0) {
    ctx.save();
    ctx.translate(player.x, 0);
    ctx.scale(playerDirection, 1);
    ctx.drawImage(sprite, -spriteWidth / 2, spriteTop, spriteWidth, spriteHeight);
    ctx.restore();
    return;
  }

  // Simple canvas fallback while the separate student sprite is loading.
  roundedRect(player.x - 17, player.y - 1 + bob, 34, 29, 11, '#5d9273');
  ctx.fillStyle = '#eac09b'; ctx.beginPath(); ctx.arc(player.x, player.y - 13 + bob, 14, 0, Math.PI * 2); ctx.fill();
  roundedRect(player.x + 11, player.y + 5 + bob, 17, 25, 7, '#d99b53');
}

function drawItems() {
  for (const item of items) {
    if (!item.image || item.image.width === 0 || item.image.height === 0) continue;
    const shake = item.monkeyObstacle && item.laneChangeState === 'warning'
      ? Math.sin(animationTime * 75) * 5
      : 0;
    if (item.monkeyObstacle && item.laneChangeState === 'warning') {
      ctx.save();
      ctx.strokeStyle = '#f06d55';
      ctx.lineWidth = 4;
      ctx.setLineDash([7, 5]);
      ctx.beginPath();
      ctx.arc(item.x, item.y, 43 + Math.sin(animationTime * 20) * 3, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#fff8e8';
      ctx.font = '900 22px Trebuchet MS, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('!', item.x, item.y - 43);
      ctx.restore();
    }
    ctx.drawImage(item.image, item.x - item.width / 2 + shake, item.y - item.height / 2, item.width, item.height);
  }
}

function draw() {
  drawCampus();
  drawItems();
  if (running) drawPlayer();
}

campusBackground.addEventListener('load', draw);

function updateHud() {
  scoreText.textContent = score;
  livesText.textContent = Array.from({ length: MAX_LIVES }, (_, index) => index < lives ? '♥' : '♡').join(' ');
  const isFinancialMode = selectedMode === 'financialMaster';
  const isSurvivalMode = selectedMode === 'monkey' || isFinancialMode;
  financialMoneyStat.hidden = true;
  timeLabel.textContent = isSurvivalMode ? 'SURVIVAL' : 'TIME';
  timeText.textContent = isSurvivalMode ? formatSurvivalTime(roundElapsed) : secondsLeft;
  updateFinancialHud();
}

function formatRinggit(amount) {
  return `RM${amount.toFixed(2)}`;
}

function financialTargetAt(index) {
  return FINANCIAL_TARGETS[0] + FINANCIAL_TARGET_INCREMENT * index;
}

function fallingSpeedMultiplier() {
  const elapsedSteps = Math.floor(roundElapsed / FALLING_SPEED_STEP_SECONDS);
  return Math.min(MAX_FALLING_SPEED_MULTIPLIER, 1 + elapsedSteps * FALLING_SPEED_STEP_MULTIPLIER);
}

function updateFinancialHud() {
  const isFinancialMode = selectedMode === 'financialMaster';
  financialTargetHud.hidden = !isFinancialMode || !running;
  if (!isFinancialMode) return;
  financialTargetText.textContent = `${formatRinggit(financialTargetProgressAmount)} / ${formatRinggit(financialTargetAmount)}`;
  financialTargetProgress.style.width = `${Math.min(100, financialTargetProgressAmount / financialTargetAmount * 100)}%`;
  financialFrenzyIndicator.hidden = financialFrenzySecondsRemaining <= 0;
  financialFrenzyTime.textContent = `${Math.max(0, financialFrenzySecondsRemaining).toFixed(1)}s`;
}

function advanceFinancialTarget() {
  financialTargetIndex += 1;
  financialTargetAmount = financialTargetAt(financialTargetIndex);
  financialTargetProgressAmount = 0;
  financialTargetProcessing = false;
  updateFinancialHud();
  showToast(`NEXT TARGET: ${formatRinggit(financialTargetAmount)}`, true);
}

function startFinancialFrenzy() {
  if (financialTargetProcessing) return;
  financialTargetProcessing = true;
  financialFrenzySecondsRemaining = 5;
  financialThiefSpawnTimer = 0;
  items = items.filter(item => !item.financialThief);
  financialTargetProgressAmount = financialTargetAmount;
  updateFinancialHud();
  playSound(soundEffects.timeBonus, true);
  showToast('FRENZY BONUS! 5 SECONDS!', true);
}

function spawnFinancialThief() {
  const size = 68;
  items.push({
    x: 36 + Math.random() * (canvas.width - 72),
    y: -36,
    name: 'Thief',
    image: itemImages.financialThief,
    width: size,
    height: size,
    financialThief: true,
    baseSpeed: 126 + Math.random() * 26
  });
}

function spawnFinancialMoney(difficultyProgress = 0, count = 1) {
  for (let index = 0; index < count; index++) {
    const spawnRoll = Math.random();
    const note = spawnRoll < 0.70
      ? financialNotes[0]
      : spawnRoll < 0.90
        ? financialNotes[1]
        : financialNotes[2];
    const size = 68;
    const aspectRatio = note.image.width / note.image.height;
    const width = aspectRatio >= 1 ? size : size * aspectRatio;
    const height = aspectRatio >= 1 ? size / aspectRatio : size;
    items.push({
      x: 42 + Math.random() * (canvas.width - 84),
      y: -28 - index * 12,
      name: note.name,
      image: note.image,
      width,
      height,
      denomination: note.denomination,
      financialMoney: true,
      windLaneChange: Math.random() < FINANCIAL_MONEY_WIND_CHANCE,
      windLaneChangeAtY: canvas.height * (0.25 + Math.random() * 0.25),
      windLaneChangeState: 'waiting',
      windLaneChangeTimer: 0,
      windLaneChangeFromX: 0,
      windLaneChangeTargetX: 0,
      baseSpeed: 100 + Math.random() * 24
    });
  }
}

function loseFinancialLife() {
  if (financialHitCooldownSeconds > 0) return;
  financialHitCooldownSeconds = 1.1;
  lives -= 1;
  playSound(soundEffects.badCatch, true);
  showToast('THIEF! −1 LIFE', false);
  showLifeLoss();
  shakeScreen();
  updateHud();
  if (lives <= 0) endGame(false);
}

function updateFinancialMaster(delta) {
  animationTime += delta;
  roundElapsed += delta;
  financialHitCooldownSeconds = Math.max(0, financialHitCooldownSeconds - delta);
  const difficultyProgress = Math.min(roundElapsed / 240, 1);
  const frenzyActive = financialFrenzySecondsRemaining > 0;

  if (keys.has('ArrowLeft') || keys.has('a') || touchDirections.has('left')) {
    player.x -= player.speed * (frenzyActive ? 1.5 : 1) * delta;
    playerDirection = -1;
  }
  if (keys.has('ArrowRight') || keys.has('d') || touchDirections.has('right')) {
    player.x += player.speed * (frenzyActive ? 1.5 : 1) * delta;
    playerDirection = 1;
  }
  player.x = Math.max(38, Math.min(canvas.width - 38, player.x));

  spawnTimer += delta;
  const normalSpawnInterval = Math.max(0.62, 1.05 - difficultyProgress * 0.22);
  if (spawnTimer >= (frenzyActive ? 0.36 : normalSpawnInterval)) {
    spawnFinancialMoney(difficultyProgress, frenzyActive ? 2 : 1);
    spawnTimer = 0;
  }

  if (!frenzyActive) {
    financialThiefSpawnTimer += delta;
    const thiefSpawnInterval = Math.max(1.8, FINANCIAL_THIEF_SPAWN_INTERVAL_SECONDS - Math.floor(roundElapsed / 30) * 0.6);
    if (financialThiefSpawnTimer >= thiefSpawnInterval) {
      spawnFinancialThief();
      financialThiefSpawnTimer = Math.random() * 0.6;
    }
  }

  const catchArea = { left: player.x - player.width * 0.35, right: player.x + player.width * 0.35, top: player.y - 56, bottom: player.y - 6 };
  for (let index = items.length - 1; index >= 0; index--) {
    const item = items[index];
    const difficultySpeed = fallingSpeedMultiplier();
    const frenzySpeed = frenzyActive && item.financialMoney ? 1.5 : 1;
    item.speed = Math.min(item.baseSpeed * difficultySpeed * frenzySpeed, item.baseSpeed * MAX_FALLING_SPEED_MULTIPLIER);
    item.y += item.speed * delta;
    if (item.windLaneChange && item.windLaneChangeState === 'waiting' && item.y >= item.windLaneChangeAtY) {
      const laneSpacing = (canvas.width - 84) / (FINANCIAL_MONEY_LANE_COUNT - 1);
      const currentLane = Math.max(0, Math.min(FINANCIAL_MONEY_LANE_COUNT - 1, Math.round((item.x - 42) / laneSpacing)));
      const otherLanes = Array.from({ length: FINANCIAL_MONEY_LANE_COUNT }, (_, lane) => lane).filter(lane => lane !== currentLane);
      const targetLane = otherLanes[Math.floor(Math.random() * otherLanes.length)];
      item.windLaneChangeFromX = item.x;
      item.windLaneChangeTargetX = 42 + targetLane * laneSpacing;
      item.windLaneChangeTimer = 0;
      item.windLaneChangeState = 'drifting';
    }
    if (item.windLaneChangeState === 'drifting') {
      item.windLaneChangeTimer += delta;
      const progress = Math.min(item.windLaneChangeTimer / 0.32, 1);
      const eased = progress * progress * (3 - 2 * progress);
      item.x = item.windLaneChangeFromX + (item.windLaneChangeTargetX - item.windLaneChangeFromX) * eased;
      if (progress >= 1) item.windLaneChangeState = 'done';
    }
    const itemArea = { left: item.x - item.width * 0.4, right: item.x + item.width * 0.4, top: item.y - item.height * 0.4, bottom: item.y + item.height * 0.4 };
    const playerBody = { left: player.x - 28, right: player.x + 28, top: player.y - 90, bottom: player.y + 4 };
    const collided = itemArea.right >= playerBody.left && itemArea.left <= playerBody.right
      && itemArea.bottom >= playerBody.top && itemArea.top <= playerBody.bottom;
    if (collided) {
      items.splice(index, 1);
      if (item.financialThief) {
        loseFinancialLife();
        if (!running) return;
      } else if (item.financialMoney) {
        score += item.denomination;
        financialTotalMoney += item.denomination;
        playSound(soundEffects.goodCatch, true);
        showScoreChange();
        showToast(`+${item.denomination} POINT${item.denomination === 1 ? '' : 'S'} · +RM${item.denomination}.00`, true);
        if (!financialTargetProcessing) {
          financialTargetProgressAmount += item.denomination;
          if (financialTargetProgressAmount >= financialTargetAmount) startFinancialFrenzy();
        }
      }
      updateHud();
    } else if (item.y > canvas.height + 40) items.splice(index, 1);
  }

  if (frenzyActive && financialFrenzySecondsRemaining > 0) {
    financialFrenzySecondsRemaining = Math.max(0, financialFrenzySecondsRemaining - delta);
    if (financialFrenzySecondsRemaining === 0 && financialTargetProcessing) advanceFinancialTarget();
  }
  updateHud();
}

function showToast(message, good) {
  toast.textContent = message;
  toast.style.color = good ? '#315c4b' : '#bb5149';
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 1000);
}

function showScoreChange() {
  scoreText.classList.remove('score-pop');
  // Restart the animation even when good items are caught in quick succession.
  void scoreText.offsetWidth;
  scoreText.classList.add('score-pop');
  clearTimeout(scorePulseTimer);
  scorePulseTimer = setTimeout(() => scoreText.classList.remove('score-pop'), 450);
}

function shakeScreen() {
  playArea.classList.remove('shake');
  void playArea.offsetWidth;
  playArea.classList.add('shake');
  clearTimeout(shakeTimer);
  shakeTimer = setTimeout(() => playArea.classList.remove('shake'), 380);
}

function showLifeLoss() {
  livesText.classList.remove('life-hit');
  void livesText.offsetWidth;
  livesText.classList.add('life-hit');
  clearTimeout(lifePulseTimer);
  lifePulseTimer = setTimeout(() => livesText.classList.remove('life-hit'), 450);
}

function endGame(won) {
  if (!running) return;
  const isClassicMode = selectedMode === 'classic';
  const isMonkeyMode = selectedMode === 'monkey';
  const isFinancialMode = selectedMode === 'financialMaster';
  const bestScoreKey = bestScoreKeyForMode(selectedMode);
  const { bestScore, isNewBestScore } = recordBestScore(score, bestScoreKey);
  running = false;
  paused = false;
  financialFrenzySecondsRemaining = 0;
  financialTargetProcessing = false;
  updateFinancialHud();
  financialMoneyStat.hidden = true;
  gameShell.classList.remove('is-playing');
  pauseButton.hidden = true;
  touchControls.hidden = true;
  pauseOverlay.hidden = true;
  currentAudioScreen = 'result';
  stopBackgroundMusic();
  for (const audio of activeCatchSounds) {
    audio.pause();
    audio.currentTime = 0;
    activeSoundEffects.delete(audio);
  }
  activeCatchSounds.clear();
  if (!isMonkeyMode) playSound(won ? soundEffects.victory : soundEffects.gameOver);
  else playSound(soundEffects.gameOver);
  clearInterval(gameTimer);
  if (animationFrameId !== null) cancelAnimationFrame(animationFrameId);
  animationFrameId = null;
  restartButton.hidden = true;
  resultEyebrow.textContent = isMonkeyMode ? 'YOUR CAMPUS SURVIVAL' : isFinancialMode ? 'YOUR FUNDRAISING JOURNEY' : 'YOUR CAMPUS JOURNEY';
  if (isMonkeyMode) {
    resultTitle.textContent = 'THE MONKEY GOT YOU!';
    resultCopy.textContent = "Don't give up! Ready for another round?";
  } else if (isFinancialMode) {
    resultTitle.textContent = 'EVERY RINGGIT COUNTS!';
    resultCopy.textContent = 'You did your best raising funds for the hiking club! Ready to raise even more?';
  } else {
    resultTitle.textContent = won ? 'YOU DID IT!' : 'YOU LOST YOUR BALANCE';
    resultCopy.textContent = won
      ? 'You kept it together and completed your university journey!'
      : 'University life can be tough. Try again and keep going!';
  }
  newBestScoreMessage.hidden = isMonkeyMode || isFinancialMode ? !isNewBestScore : !(won && isNewBestScore);
  resultScoreLabel.textContent = '⭐ Final Score';
  resultScoreRow.classList.toggle('new-high-score', isMonkeyMode || isFinancialMode ? isNewBestScore : won && isNewBestScore);
  resultScore.textContent = score;
  resultBestScore.textContent = bestScore;
  resultTimeLabel.textContent = isMonkeyMode || isFinancialMode ? '⏱ Survival Time' : '🕒 Time Left';
  resultTime.textContent = isMonkeyMode || isFinancialMode ? formatSurvivalTime(roundElapsed) : `${secondsLeft} seconds`;
  resultTimeStat.hidden = isClassicMode && won;
  resultFinancialMoneyStat.hidden = true;
  resultFinancialMoney.textContent = formatRinggit(financialTotalMoney);
  resultLives.textContent = lives;
  resultLivesStat.hidden = isFinancialMode || isMonkeyMode || (isClassicMode && !won);
  resultMainMenuButton.textContent = 'Main Menu';
  resultCard.classList.toggle('financial-master-result', isFinancialMode);
  resultCard.classList.toggle('monkey-attack-result', isMonkeyMode);
  instructionCard.hidden = true;
  resultCard.hidden = false;
  gameShell.classList.add('result-active');
  screen.classList.remove('hidden', 'win-result', 'game-over-result');
  screen.classList.toggle('monkey-attack-result', isMonkeyMode);
  screen.classList.toggle('financial-master-result', isFinancialMode);
  screen.classList.add('result-screen', !isMonkeyMode && won ? 'win-result' : 'game-over-result');
  screen.hidden = false;
  draw();

}

function formatSurvivalTime(seconds) {
  const elapsed = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(elapsed / 60);
  const remainingSeconds = String(elapsed % 60).padStart(2, '0');
  return `${minutes}:${remainingSeconds}`;
}

function spawnItem(difficultyProgress = 0) {
  if (selectedMode === 'financialMaster') {
    spawnFinancialMoney(difficultyProgress);
    return;
  }
  if (selectedMode === 'monkey') {
    const hasActiveDoublePointsBonus = items.some(item => item.doublePointsBonus);
    const isDoublePointsBonus = !hasActiveDoublePointsBonus
      && monkeyDoublePointsSecondsRemaining <= 0
      && Math.random() < MONKEY_DOUBLE_POINTS_CHANCE;
    const isMonkeyObstacle = !isDoublePointsBonus && Math.random() < 0.24;
    const isGood = !isDoublePointsBonus && !isMonkeyObstacle && Math.random() < 0.65;
    const choices = isGood ? goodItems : badItems;
    const choice = isDoublePointsBonus
      ? { name: 'Double Points', image: itemImages.doublePointsBonus }
      : isMonkeyObstacle
        ? { name: 'Falling Monkey', image: monkeySprite }
        : choices[Math.floor(Math.random() * choices.length)];
    const maxSize = isDoublePointsBonus ? 54 : 64;
    const sourceWidth = choice.image.width || maxSize;
    const sourceHeight = choice.image.height || maxSize;
    const aspectRatio = sourceWidth / sourceHeight;
    const width = aspectRatio >= 1 ? maxSize : maxSize * aspectRatio;
    const height = aspectRatio >= 1 ? maxSize / aspectRatio : maxSize;
    const lane = Math.floor(Math.random() * MONKEY_LANE_COUNT);
    const laneWidth = (canvas.width - 84) / (MONKEY_LANE_COUNT - 1);
    items.push({
      x: isMonkeyObstacle ? 42 + lane * laneWidth : 36 + Math.random() * (canvas.width - 72),
      y: -24,
      name: choice.name,
      image: choice.image,
      width,
      height,
      good: isGood,
      doublePointsBonus: isDoublePointsBonus,
      monkeyObstacle: isMonkeyObstacle,
      lane,
      switchAt: 95 + Math.random() * 130,
      laneChangeAttempted: false,
      laneChangeState: 'none',
      laneChangeTimer: 0,
      laneChangeFromX: 0,
      targetLane: lane,
      targetX: 0,
      baseSpeed: (isMonkeyObstacle ? 130 : 105) + Math.random() * (isMonkeyObstacle ? 34 : 38)
    });
    return;
  }
  const hasActiveTimeBonus = items.some(item => item.timeBonus);
  const hasActiveDoublePointsBonus = items.some(item => item.doublePointsBonus);
  const bonusRoll = Math.random();
  const isTimeBonus = bonusRoll < TIME_BONUS_CHANCE && !hasActiveTimeBonus;
  const isDoublePointsBonus = bonusRoll >= TIME_BONUS_CHANCE
    && bonusRoll < TIME_BONUS_CHANCE + DOUBLE_POINTS_BONUS_CHANCE
    && !hasActiveDoublePointsBonus
    && doublePointsSecondsRemaining <= 0;
  const isSpecialBonus = isTimeBonus || isDoublePointsBonus;
  const isGood = !isSpecialBonus && Math.random() < 0.65;
  const choices = isGood ? goodItems : badItems;
  const choice = isTimeBonus
    ? { name: 'Time Bonus', image: itemImages.timeBonus }
    : isDoublePointsBonus
      ? { name: 'Double Points', image: itemImages.doublePointsBonus }
      : choices[Math.floor(Math.random() * choices.length)];
  const maxSize = isDoublePointsBonus ? 54 : 64;
  const sourceWidth = choice.image.width || maxSize;
  const sourceHeight = choice.image.height || maxSize;
  const aspectRatio = sourceWidth / sourceHeight;
  const width = aspectRatio >= 1 ? maxSize : maxSize * aspectRatio;
  const height = aspectRatio >= 1 ? maxSize / aspectRatio : maxSize;
  items.push({
    x: 36 + Math.random() * (canvas.width - 72),
    y: -20,
    name: choice.name,
    image: choice.image,
    width,
    height,
    good: !isSpecialBonus && isGood,
    timeBonus: isTimeBonus,
    doublePointsBonus: isDoublePointsBonus,
    baseSpeed: 115 + Math.random() * 65,
    speed: 0
  });
}

function loseMonkeyLife(message) {
  lives -= 1;
  playSound(soundEffects.badCatch, true);
  showToast(message, false);
  showLifeLoss();
  shakeScreen();
  updateHud();
  if (lives <= 0) endGame(false);
}

function updateMonkey(delta) {
  animationTime += delta;
  roundElapsed += delta;
  updateHud();
  monkeyDoublePointsSecondsRemaining = Math.max(0, monkeyDoublePointsSecondsRemaining - delta);
  const difficultyScale = fallingSpeedMultiplier();
  if (keys.has('ArrowLeft') || keys.has('a') || touchDirections.has('left')) {
    player.x -= player.speed * delta;
    playerDirection = -1;
  }
  if (keys.has('ArrowRight') || keys.has('d') || touchDirections.has('right')) {
    player.x += player.speed * delta;
    playerDirection = 1;
  }
  player.x = Math.max(38, Math.min(canvas.width - 38, player.x));
  spawnTimer += delta;
  const spawnInterval = Math.max(0.50, 0.92 - Math.min(roundElapsed, 210) * 0.0019);
  if (spawnTimer >= spawnInterval) { spawnItem(); spawnTimer = 0; }

  const catchArea = { left: player.x - player.width * 0.35, right: player.x + player.width * 0.35, top: player.y - 56, bottom: player.y - 6 };
  for (let i = items.length - 1; i >= 0; i--) {
    const item = items[i];
    item.speed = item.baseSpeed * difficultyScale;
    item.y += item.speed * delta;
    if (item.monkeyObstacle) {
      if (!item.laneChangeAttempted && item.y >= item.switchAt) {
        item.laneChangeAttempted = true;
        const laneSwitchTravel = item.speed * 0.72 + item.height * 0.4;
        if (item.y + laneSwitchTravel < player.y - 90) {
          const options = Array.from({ length: MONKEY_LANE_COUNT }, (_, lane) => lane).filter(lane => lane !== item.lane);
          item.targetLane = options[Math.floor(Math.random() * options.length)];
          item.laneChangeFromX = item.x;
          item.targetX = 42 + item.targetLane * ((canvas.width - 84) / (MONKEY_LANE_COUNT - 1));
          item.laneChangeState = 'warning';
          item.laneChangeTimer = 0.5;
        }
      }
      if (item.laneChangeState === 'warning') {
        item.laneChangeTimer -= delta;
        if (item.laneChangeTimer <= 0) { item.laneChangeState = 'switching'; item.laneChangeTimer = 0; }
      } else if (item.laneChangeState === 'switching') {
        item.laneChangeTimer += delta;
        const progress = Math.min(item.laneChangeTimer / 0.22, 1);
        const eased = progress * progress * (3 - 2 * progress);
        item.x = item.laneChangeFromX + (item.targetX - item.laneChangeFromX) * eased;
        if (progress >= 1) { item.x = item.targetX; item.lane = item.targetLane; item.laneChangeState = 'none'; }
      }
      const monkeyArea = { left: item.x - item.width * 0.36, right: item.x + item.width * 0.36, top: item.y - item.height * 0.38, bottom: item.y + item.height * 0.38 };
      const playerBody = { left: player.x - 28, right: player.x + 28, top: player.y - 90, bottom: player.y + 4 };
      const collided = monkeyArea.right >= playerBody.left && monkeyArea.left <= playerBody.right
        && monkeyArea.bottom >= playerBody.top && monkeyArea.top <= playerBody.bottom;
      if (collided) {
        items.splice(i, 1);
        loseMonkeyLife('-1 LIFE!');
        if (!running) return;
        continue;
      }
    } else {
      const itemArea = { left: item.x - item.width * 0.42, right: item.x + item.width * 0.42, top: item.y - item.height * 0.42, bottom: item.y + item.height * 0.42 };
      const caught = itemArea.right >= catchArea.left && itemArea.left <= catchArea.right && itemArea.bottom >= catchArea.top && itemArea.top <= catchArea.bottom;
      if (caught) {
        if (item.doublePointsBonus) {
          monkeyDoublePointsSecondsRemaining = MONKEY_DOUBLE_POINTS_DURATION_SECONDS;
          playSound(soundEffects.timeBonus, true);
          showToast('2× EXTRA BONUS!', true);
        } else if (item.good) {
          const points = monkeyDoublePointsSecondsRemaining > 0 ? 4 : 2;
          score += points;
          playSound(soundEffects.goodCatch, true);
          showToast(`+${points} POINTS!`, true);
          showScoreChange();
        } else {
          loseMonkeyLife('-1 LIFE!');
          if (!running) return;
        }
        items.splice(i, 1);
        updateHud();
      }
    }
    if (item.y > canvas.height + 30) items.splice(i, 1);
  }
}

function update(delta) {
  if (selectedMode === 'financialMaster') { updateFinancialMaster(delta); return; }
  if (selectedMode === 'monkey') { updateMonkey(delta); return; }
  animationTime += delta;
  roundElapsed = Math.min(60, roundElapsed + delta);
  doublePointsSecondsRemaining = Math.max(0, doublePointsSecondsRemaining - delta);
  // Difficulty rises smoothly through the 0–20s Easy, 21–40s Medium, and 41–60s Challenging ranges.
  const difficultyProgress = roundElapsed / 60;
  if (keys.has('ArrowLeft') || keys.has('a') || touchDirections.has('left')) {
    player.x -= player.speed * delta;
    playerDirection = -1;
  }
  if (keys.has('ArrowRight') || keys.has('d') || touchDirections.has('right')) {
    player.x += player.speed * delta;
    playerDirection = 1;
  }
  player.x = Math.max(38, Math.min(canvas.width - 38, player.x));

  spawnTimer += delta;
  const spawnInterval = 0.85 - 0.15 * difficultyProgress;
  if (spawnTimer >= spawnInterval) { spawnItem(difficultyProgress); spawnTimer = 0; }

  for (let i = items.length - 1; i >= 0; i--) {
    const item = items[i];
    item.speed = item.baseSpeed * fallingSpeedMultiplier();
    item.y += item.speed * delta;
    // Only the student's central torso area catches items; the item box still
    // follows its visible sprite with a small transparent-edge inset.
    const catchArea = {
      left: player.x - player.width * 0.35,
      right: player.x + player.width * 0.35,
      top: player.y - 56,
      bottom: player.y - 6
    };
    const itemInsetX = item.width * 0.08;
    const itemInsetY = item.height * 0.08;
    const itemArea = {
      left: item.x - item.width / 2 + itemInsetX,
      right: item.x + item.width / 2 - itemInsetX,
      top: item.y - item.height / 2 + itemInsetY,
      bottom: item.y + item.height / 2 - itemInsetY
    };
    const caught = itemArea.right >= catchArea.left
      && itemArea.left <= catchArea.right
      && itemArea.bottom >= catchArea.top
      && itemArea.top <= catchArea.bottom;
    if (caught) {
      if (item.timeBonus) {
        playSound(soundEffects.timeBonus, true);
        secondsLeft = Math.min(ROUND_DURATION_SECONDS, secondsLeft + TIME_BONUS_SECONDS);
        showToast('+5 SECONDS!', true);
      } else if (item.doublePointsBonus) {
        doublePointsSecondsRemaining = DOUBLE_POINTS_DURATION_SECONDS;
        playSound(soundEffects.timeBonus, true);
        showToast('2× EXTRA BONUS!', true);
      } else if (item.good) {
        playSound(soundEffects.goodCatch, true);
        const points = doublePointsSecondsRemaining > 0 ? 4 : 2;
        score += points;
        showToast(`+${points} POINTS!`, true);
      } else {
        playSound(soundEffects.badCatch, true);
        lives -= 1;
        showToast('-1 Life!', false);
        showLifeLoss();
        shakeScreen();
      }
      items.splice(i, 1);
      updateHud();
      if (item.good) showScoreChange();
      if (lives <= 0) { endGame(false); return; }
    } else if (item.y > canvas.height + 30) {
      items.splice(i, 1);
    }
  }
}

function frame(timestamp) {
  if (!running || paused) {
    animationFrameId = null;
    return;
  }
  const delta = Math.min((timestamp - lastTime) / 1000, 0.04);
  lastTime = timestamp;
  update(delta);
  draw();

  if (running && !paused) animationFrameId = requestAnimationFrame(frame);
  else animationFrameId = null;
}

function startGameTimer() {
  clearInterval(gameTimer);
  gameTimer = setInterval(() => {
    if (!running || paused) return;
    secondsLeft--;
    updateHud();
    if (secondsLeft <= 0) endGame(score >= TARGET_SCORE && lives > 0);
  }, 1000);
}

function pauseGame() {
  if (!running || paused) return;
  paused = true;
  keys.clear();
  touchDirections.clear();
  activeTouchPointers.clear();
  touchControlButtons.forEach((button) => button.classList.remove('is-pressed'));
  touchControls.hidden = true;
  clearInterval(gameTimer);
  gameTimer = null;
  if (animationFrameId !== null) cancelAnimationFrame(animationFrameId);
  animationFrameId = null;
  pauseBackgroundMusic();
  pauseButton.hidden = true;
  restartButton.hidden = true;
  pauseMenuPanel.hidden = false;
  pauseConfirmationPanel.hidden = true;
  pauseOverlay.hidden = false;
  resumeButton.focus();
}

function resumeGame() {
  if (!running || !paused) return;
  paused = false;
  touchControls.hidden = false;
  pauseOverlay.hidden = true;
  pauseMenuPanel.hidden = false;
  pauseConfirmationPanel.hidden = true;
  pauseButton.hidden = false;
  restartButton.hidden = false;
  keys.clear();
  lastTime = performance.now();
  if (selectedMode === 'classic') startGameTimer();
  if (musicEnabled) restoreBackgroundMusic();
  animationFrameId = requestAnimationFrame(frame);
}

function showMainMenuConfirmation() {
  pauseMenuPanel.hidden = true;
  pauseConfirmationPanel.hidden = false;
  confirmMainMenuButton.focus();
}

function cancelMainMenuConfirmation() {
  pauseConfirmationPanel.hidden = true;
  pauseMenuPanel.hidden = false;
  pauseMainMenuButton.focus();
}

function updateModeSelection(mode = selectedMode) {
  selectedMode = mode;
  updateModeBestScoreDisplays();
  const modeInfo = GAME_MODES[selectedMode];
  for (const card of modeCards) {
    const isSelected = card.dataset.mode === selectedMode;
    card.setAttribute('aria-pressed', String(isSelected));
  }
  modePreviewTitle.textContent = modeInfo.title;
  modePreviewCopy.textContent = modeInfo.preview;
  draw();
}

function showModeSelection() {
  updateModeSelection();
  mainMenu.classList.add('hidden');
  financialTargetHud.hidden = true;
  financialMoneyStat.hidden = true;
  gameShell.classList.add('is-mode-selection');
  gameShell.classList.remove('is-instructions');
  gameShell.classList.remove('is-monkey-mode');
  gameShell.classList.remove('main-menu-active', 'result-active');
  draw();
  modeSelectionCard.hidden = false;
  instructionCard.hidden = true;
  resultCard.hidden = true;
  screen.classList.remove('hidden', 'result-screen', 'win-result', 'game-over-result');
  screen.hidden = false;
  modeCards.find(card => card.dataset.mode === selectedMode)?.focus();
}

function showMainMenuFromModeSelection() {
  modeSelectionCard.hidden = true;
  instructionCard.hidden = false;
  screen.hidden = true;
  screen.classList.remove('result-screen', 'win-result', 'game-over-result');
  mainMenu.classList.remove('hidden');
  mainMenuPanel.hidden = false;
  gameShell.classList.remove('result-active');
  gameShell.classList.remove('is-monkey-mode');
  gameShell.classList.remove('is-mode-selection');
  gameShell.classList.remove('is-instructions');
  gameShell.classList.add('main-menu-active');
  draw();
  currentAudioScreen = 'menu';
  restoreBackgroundMusic();
}

function showSelectedModeInstructions() {
  const modeInfo = GAME_MODES[selectedMode];
  modeSelectionCard.hidden = true;
  instructionCard.hidden = false;
  resultCard.hidden = true;
  screen.classList.remove('hidden', 'result-screen', 'win-result', 'game-over-result');
  screen.hidden = false;
  screenTitle.textContent = modeInfo.instructionTitle;
  screenCopy.textContent = modeInfo.instructionCopy;
  gameShell.classList.remove('is-mode-selection');
  gameShell.classList.add('is-instructions');
  draw();
  financialMoneyStat.hidden = true;
  const isClassic = selectedMode === 'classic';
  const isMonkey = selectedMode === 'monkey';
  const isFinancialMaster = selectedMode === 'financialMaster';
  if (isClassic) {
    timeLabel.textContent = 'TIME';
    timeText.textContent = String(ROUND_DURATION_SECONDS);
  } else {
    timeLabel.textContent = 'SURVIVAL';
    timeText.textContent = '0:00';
  }
  screenCopy.hidden = false;
  modeInstructionDetail.hidden = isClassic || isMonkey || isFinancialMaster;
  modeInstructionDetail.textContent = modeInfo.details || '';
  classicInstructions.hidden = !isClassic;
  monkeyInstructions.hidden = !isMonkey;
  financialMasterInstructions.hidden = !isFinancialMaster;
  startButton.disabled = !modeInfo.playable;
}

function backToModeSelection() {
  instructionCard.hidden = true;
  modeSelectionCard.hidden = false;
  screen.classList.remove('result-screen', 'win-result', 'game-over-result');
  screen.hidden = false;
  gameShell.classList.add('is-mode-selection');
  gameShell.classList.remove('is-instructions');
  updateModeSelection();
}

function returnToMainMenu() {
  running = false;
  paused = false;
  gameShell.classList.remove('is-playing');
  gameShell.classList.remove('is-mode-selection');
  gameShell.classList.remove('is-instructions');
  financialTargetHud.hidden = true;
  financialMoneyStat.hidden = true;
  stopBackgroundMusic();
  clearInterval(gameTimer);
  gameTimer = null;
  if (animationFrameId !== null) cancelAnimationFrame(animationFrameId);
  animationFrameId = null;
  keys.clear();
  touchDirections.clear();
  activeTouchPointers.clear();
  touchControlButtons.forEach((button) => button.classList.remove('is-pressed'));
  touchControls.hidden = true;
  pauseButton.hidden = true;
  pauseOverlay.hidden = true;
  pauseMenuPanel.hidden = false;
  pauseConfirmationPanel.hidden = true;
  restartButton.hidden = true;
  resultCard.hidden = true;
  modeSelectionCard.hidden = true;
  instructionCard.hidden = false;
  screen.hidden = true;
  screen.classList.remove('hidden', 'result-screen', 'win-result', 'game-over-result');
  mainMenuPanel.hidden = false;
  mainMenu.classList.remove('hidden');
  gameShell.classList.remove('result-active');
  gameShell.classList.remove('is-monkey-mode');
  gameShell.classList.add('main-menu-active');
  draw();
  currentAudioScreen = 'menu';
  restoreBackgroundMusic(true);
}

function startGame(restartMusic = false) {
  if (!GAME_MODES[selectedMode]?.playable) return;
  clearInterval(gameTimer);
  gameTimer = null;
  paused = false;
  gameShell.classList.add('is-playing');
  gameShell.classList.remove('is-mode-selection');
  gameShell.classList.remove('is-instructions');
  gameShell.classList.toggle('is-monkey-mode', selectedMode === 'monkey');
  touchControls.hidden = false;
  pauseOverlay.hidden = true;
  pauseButton.hidden = false;
  pauseMenuPanel.hidden = false;
  pauseConfirmationPanel.hidden = true;
  currentAudioScreen = 'gameplay';
  playBackgroundMusic(gameplayMusic, true);
  // Cancel any pending frame so restarting cannot leave two game loops running.
  if (animationFrameId !== null) cancelAnimationFrame(animationFrameId);
  animationFrameId = null;
  clearTimeout(toastTimer);
  clearTimeout(scorePulseTimer);
  clearTimeout(shakeTimer);
  clearTimeout(lifePulseTimer);
  toast.classList.remove('show');
  toast.textContent = '';
  scoreText.classList.remove('score-pop');
  livesText.classList.remove('life-hit');
  playArea.classList.remove('shake');
  keys.clear();
  touchDirections.clear();
  activeTouchPointers.clear();
  touchControlButtons.forEach((button) => button.classList.remove('is-pressed'));

  score = 0;
  roundElapsed = 0;
  lives = MAX_LIVES;
  secondsLeft = selectedMode === 'classic' ? ROUND_DURATION_SECONDS : 0;
  monkeyDoublePointsSecondsRemaining = 0;
  doublePointsSecondsRemaining = 0;
  financialTotalMoney = 0;
  financialTargetProgressAmount = 0;
  financialTargetIndex = 0;
  financialTargetAmount = FINANCIAL_TARGETS[0];
  financialFrenzySecondsRemaining = 0;
  financialTargetProcessing = false;
  financialThiefSpawnTimer = 0;
  financialHitCooldownSeconds = 0;
  items = [];
  spawnTimer = 0;
  player.x = canvas.width / 2;
  updateHud();
  instructionCard.hidden = false;
  resultCard.hidden = true;
  gameShell.classList.remove('result-active');
  screen.classList.remove('result-screen', 'win-result', 'game-over-result');
  screen.classList.add('hidden');
  screen.hidden = false;
  running = true;
  if (selectedMode === 'financialMaster') updateFinancialHud();
  else financialTargetHud.hidden = true;
  restartButton.hidden = false;
  lastTime = performance.now();
  if (selectedMode === 'classic') startGameTimer();
  animationFrameId = requestAnimationFrame(frame);
}

document.getElementById('play-menu-button').addEventListener('click', showModeSelection);
for (const card of modeCards) {
  card.addEventListener('click', () => updateModeSelection(card.dataset.mode));
}
confirmModeButton.addEventListener('click', showSelectedModeInstructions);
modesBackButton.addEventListener('click', showMainMenuFromModeSelection);
instructionsBackButton.addEventListener('click', backToModeSelection);

pauseButton.addEventListener('click', pauseGame);
resumeButton.addEventListener('click', resumeGame);
pauseMainMenuButton.addEventListener('click', showMainMenuConfirmation);
cancelMainMenuButton.addEventListener('click', cancelMainMenuConfirmation);
confirmMainMenuButton.addEventListener('click', returnToMainMenu);
startButton.addEventListener('click', () => {
  if (GAME_MODES[selectedMode]?.playable) startGame();
});
resultPlayAgainButton.addEventListener('click', () => startGame(true));
restartButton.addEventListener('click', () => startGame(true));
musicToggleButton.addEventListener('click', () => {
  musicEnabled = !musicEnabled;
  saveAudioSetting(MUSIC_SETTING_KEY, musicEnabled);
  updateAudioToggleStates();
  if (musicEnabled) restoreBackgroundMusic();
  else stopBackgroundMusic();
});
soundEffectsToggleButton.addEventListener('click', () => {
  soundEffectsEnabled = !soundEffectsEnabled;
  saveAudioSetting(SOUND_EFFECTS_SETTING_KEY, soundEffectsEnabled);
  updateAudioToggleStates();
  if (!soundEffectsEnabled) stopSoundEffects();
});
resultMainMenuButton.addEventListener('click', returnToMainMenu);
window.addEventListener('keydown', (event) => {
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
  if (['ArrowLeft', 'ArrowRight'].includes(key)) event.preventDefault();
  if (running && !paused) keys.add(key);
});
window.addEventListener('keyup', (event) => {
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
  keys.delete(key);
});

function releaseTouchDirection(pointerId) {
  const direction = activeTouchPointers.get(pointerId);
  if (!direction) return;
  activeTouchPointers.delete(pointerId);
  if (![...activeTouchPointers.values()].includes(direction)) {
    touchDirections.delete(direction);
    touchControlButtons.find((button) => button.dataset.direction === direction)?.classList.remove('is-pressed');
  }
}

function clearReleasedTouchButton(button, event) {
  const bounds = button.getBoundingClientRect();
  const stillTouchingButton = [...event.touches].some((touch) =>
    touch.clientX >= bounds.left && touch.clientX <= bounds.right &&
    touch.clientY >= bounds.top && touch.clientY <= bounds.bottom
  );
  if (stillTouchingButton) return;

  const direction = button.dataset.direction;
  touchDirections.delete(direction);
  for (const [pointerId, activeDirection] of activeTouchPointers) {
    if (activeDirection === direction) activeTouchPointers.delete(pointerId);
  }
  button.classList.remove('is-pressed');
}

for (const button of touchControlButtons) {
  for (const eventName of ['touchend', 'touchcancel']) {
    button.addEventListener(eventName, (event) => clearReleasedTouchButton(button, event), { passive: true });
  }
  button.addEventListener('pointerdown', (event) => {
    if (!running || paused) return;
    event.preventDefault();
    const direction = button.dataset.direction;
    activeTouchPointers.set(event.pointerId, direction);
    touchDirections.add(direction);
    button.classList.add('is-pressed');
    if (event.pointerType === 'touch' && typeof navigator.vibrate === 'function') {
      try { navigator.vibrate(25); } catch {}
    }
    try { button.setPointerCapture(event.pointerId); } catch {}
  });
  for (const eventName of ['pointerup', 'pointercancel', 'lostpointercapture']) {
    button.addEventListener(eventName, (event) => releaseTouchDirection(event.pointerId));
  }
  button.addEventListener('contextmenu', (event) => event.preventDefault());
}

document.addEventListener('visibilitychange', () => {
  if (document.hidden && running && !paused) pauseGame();
});

draw();
updateAudioToggleStates();

document.addEventListener('click', (event) => {
  const button = event.target.closest('button');
  if (!button) return;
  if (!button.matches('.touch-control') && soundEffectsEnabled) playSound(soundEffects.buttonClick);
  if (currentAudioScreen === 'menu') restoreBackgroundMusic();
});

// Attempt autoplay, then retry once when the browser allows audio after a user gesture.
document.addEventListener('pointerdown', () => {
  if (musicEnabled) restoreBackgroundMusic();
}, { once: true });
document.addEventListener('keydown', () => {
  if (musicEnabled) restoreBackgroundMusic();
}, { once: true });
restoreBackgroundMusic();
