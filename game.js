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

const itemImages = {
  book: makeEmojiSticker('📚'),
  dumbbell: makeEmojiSticker('🏃'),
  savingsJar: makeEmojiSticker('💰'),
  burger: makeEmojiSticker('🍔'),
  gamingController: makeEmojiSticker('🎮'),
  shoppingBags: makeEmojiSticker('🛍️'),
  timeBonus: makeEmojiSticker('⏱️')
};
const scoreText = document.getElementById('score');
const livesText = document.getElementById('lives');
const timeText = document.getElementById('time');
const screen = document.getElementById('screen');
const mainMenu = document.getElementById('main-menu');
const mainMenuPanel = document.getElementById('main-menu-panel');
const musicToggleButton = document.getElementById('music-toggle');
const soundEffectsToggleButton = document.getElementById('sound-effects-toggle');
const pauseButton = document.getElementById('pause-button');
const pauseOverlay = document.getElementById('pause-overlay');
const pauseMenuPanel = document.getElementById('pause-menu-panel');
const pauseConfirmationPanel = document.getElementById('pause-confirmation-panel');
const resumeButton = document.getElementById('resume-button');
const pauseMainMenuButton = document.getElementById('pause-main-menu-button');
const confirmMainMenuButton = document.getElementById('confirm-main-menu-button');
const cancelMainMenuButton = document.getElementById('cancel-main-menu-button');
const instructionCard = document.getElementById('instruction-card');
const resultCard = document.getElementById('result-card');
const resultTitle = document.getElementById('result-title');
const resultCopy = document.getElementById('result-copy');
const newBestScoreMessage = document.getElementById('new-best-score-message');
const mainMenuBestScore = document.getElementById('main-menu-best-score');
const resultScoreRow = document.getElementById('result-score-row');
const resultScoreLabel = document.getElementById('result-score-label');
const resultScore = document.getElementById('result-score');
const resultBestScore = document.getElementById('result-best-score');
const resultTime = document.getElementById('result-time');
const resultLives = document.getElementById('result-lives');
const startButton = document.getElementById('start-button');
const restartButton = document.getElementById('restart-button');
const resultPlayAgainButton = document.getElementById('result-play-again');
const resultMainMenuButton = document.getElementById('result-main-menu');
const toast = document.getElementById('toast');
const playArea = document.querySelector('.play-area');
const gameShell = document.querySelector('.game-shell');

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
const BEST_SCORE_KEY = 'keepItTogether.bestScore';
const MUSIC_SETTING_KEY = 'keepItTogether.musicEnabled';
const SOUND_EFFECTS_SETTING_KEY = 'keepItTogether.soundEffectsEnabled';
function readBestScore() {
  try {
    const bestScore = Number(localStorage.getItem(BEST_SCORE_KEY));
    return Number.isFinite(bestScore) && bestScore > 0 ? bestScore : 0;
  } catch {
    return 0;
  }
}
function saveBestScore(bestScore) {
  try {
    localStorage.setItem(BEST_SCORE_KEY, String(bestScore));
  } catch {
    // The current round still works if browser storage is unavailable.
  }
}
function recordBestScore(roundScore) {
  const previousBestScore = readBestScore();
  const isNewBestScore = roundScore > previousBestScore;
  const bestScore = isNewBestScore ? roundScore : previousBestScore;
  if (isNewBestScore) saveBestScore(bestScore);
  return { bestScore, isNewBestScore };
}
function updateBestScoreDisplay(bestScore = readBestScore()) {
  mainMenuBestScore.textContent = `🏆 BEST SCORE: ${bestScore}`;
}
updateBestScoreDisplay();
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
const player = { x: 400, y: 436, width: 52, speed: 330 };
let items = [];
let score = 0;
let roundElapsed = 0;
const MAX_LIVES = 5;
let lives = MAX_LIVES;
let secondsLeft = 60;
let running = false;
let lastTime = 0;
let spawnTimer = 0;
let toastTimer = 0;
let gameTimer = 0;
let animationFrameId = null;
let scorePulseTimer = 0;
let shakeTimer = 0;
let lifePulseTimer = 0;
let feedbackIndex = 0;
const goodMessages = ['+2 POINTS!'];
const badMessages = ['-1 Life!'];
let animationTime = 0;
let playerDirection = 1;

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
  sky.addColorStop(0, '#b8dfe0');
  sky.addColorStop(0.62, '#e1eee0');
  sky.addColorStop(1, '#b8d2a5');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, 800, 500);

  drawCloud(88, 66, 0.85);
  drawCloud(630, 78, 1.05);

  // Rolling hills and lawn
  ctx.fillStyle = '#a9cda4';
  ctx.beginPath(); ctx.moveTo(0, 226); ctx.quadraticCurveTo(162, 145, 340, 228); ctx.quadraticCurveTo(584, 135, 800, 218); ctx.lineTo(800, 500); ctx.lineTo(0, 500); ctx.fill();
  ctx.fillStyle = '#80b18a';
  ctx.beginPath(); ctx.moveTo(0, 282); ctx.quadraticCurveTo(198, 230, 385, 291); ctx.quadraticCurveTo(600, 240, 800, 278); ctx.lineTo(800, 500); ctx.lineTo(0, 500); ctx.fill();

  // Main campus building, with rounded windows and a welcoming entrance.
  roundedRect(229, 111, 342, 140, 12, '#f2dfbd');
  roundedRect(213, 101, 374, 24, 9, '#b9825b');
  roundedRect(335, 177, 130, 74, 8, '#547d69');
  roundedRect(348, 188, 104, 63, 6, '#365b4c');
  roundedRect(250, 139, 32, 31, 6, '#9dcac7');
  roundedRect(295, 139, 32, 31, 6, '#9dcac7');
  roundedRect(473, 139, 32, 31, 6, '#9dcac7');
  roundedRect(518, 139, 32, 31, 6, '#9dcac7');
  ctx.strokeStyle = '#f6ebd4'; ctx.lineWidth = 3;
  for (const x of [266, 311, 489, 534]) {
    ctx.beginPath(); ctx.moveTo(x, 140); ctx.lineTo(x, 169); ctx.moveTo(x - 15, 155); ctx.lineTo(x + 15, 155); ctx.stroke();
  }
  ctx.fillStyle = '#fff5df'; ctx.font = 'bold 11px Trebuchet MS, Arial, sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('UUM  •  CAMPUS LIFE', 400, 119);
  roundedRect(372, 193, 56, 8, 4, '#f0d39f');

  // Curving walkway
  ctx.fillStyle = '#e4cfaa';
  ctx.beginPath(); ctx.moveTo(350, 251); ctx.quadraticCurveTo(345, 327, 256, 500); ctx.lineTo(544, 500); ctx.quadraticCurveTo(455, 327, 450, 251); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#d4bd96'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(373, 270); ctx.quadraticCurveTo(369, 355, 319, 490); ctx.moveTo(427, 270); ctx.quadraticCurveTo(431, 355, 481, 490); ctx.stroke();

  // Rounded campus trees
  for (const x of [42, 115, 684, 756]) {
    roundedRect(x - 5, 239, 10, 43, 5, '#8b684c');
    ctx.fillStyle = '#54896a';
    ctx.beginPath(); ctx.arc(x, 224, 27, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#70a77b';
    ctx.beginPath(); ctx.arc(x - 10, 216, 15, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#91bd83';
    ctx.beginPath(); ctx.arc(x + 9, 210, 11, 0, Math.PI * 2); ctx.fill();
  }

  // Small flower dots add a little campus garden detail.
  for (const [x, y, color] of [[176, 350, '#e68e91'], [622, 372, '#f1c56f'], [137, 420, '#fff3dc'], [662, 450, '#e68e91'], [75, 386, '#f1c56f']]) {
    ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#547d69'; ctx.fillRect(x - 1, y + 4, 2, 8);
  }
}

function drawPlayer() {
  const moving = keys.has('ArrowLeft') || keys.has('ArrowRight') || keys.has('a') || keys.has('d');
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
    ctx.drawImage(item.image, item.x - item.width / 2, item.y - item.height / 2, item.width, item.height);
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
  timeText.textContent = secondsLeft;
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
  const { bestScore, isNewBestScore } = recordBestScore(score);
  updateBestScoreDisplay(bestScore);
  running = false;
  paused = false;
  pauseButton.hidden = true;
  pauseOverlay.hidden = true;
  currentAudioScreen = 'result';
  stopBackgroundMusic();
  for (const audio of activeCatchSounds) {
    audio.pause();
    audio.currentTime = 0;
    activeSoundEffects.delete(audio);
  }
  activeCatchSounds.clear();
  playSound(won ? soundEffects.victory : soundEffects.gameOver);
  clearInterval(gameTimer);
  if (animationFrameId !== null) cancelAnimationFrame(animationFrameId);
  animationFrameId = null;
  restartButton.hidden = true;
  resultTitle.textContent = won ? 'YOU DID IT!' : 'YOU LOST YOUR BALANCE';
  resultCopy.textContent = won
    ? 'You kept it together and completed your university journey!'
    : 'University life can be tough. Try again and keep going!';
  newBestScoreMessage.hidden = !(won && isNewBestScore);
  resultScoreLabel.textContent = '⭐ Final Score';
  resultScoreRow.classList.toggle('new-high-score', won && isNewBestScore);
  resultScore.textContent = score;
  resultBestScore.textContent = bestScore;
  resultTime.textContent = `${secondsLeft} seconds`;
  resultLives.textContent = lives;
  instructionCard.hidden = true;
  resultCard.hidden = false;
  gameShell.classList.add('result-active');
  screen.classList.remove('hidden', 'win-result', 'game-over-result');
  screen.classList.add('result-screen', won ? 'win-result' : 'game-over-result');
  screen.hidden = false;
  draw();

}

function spawnItem(difficultyProgress = 0) {
  const wantsTimeBonus = Math.random() < 0.08;
  const hasActiveTimeBonus = items.some(item => item.timeBonus);
  const isTimeBonus = wantsTimeBonus && !hasActiveTimeBonus;
  const isGood = !isTimeBonus && Math.random() < 0.65;
  const choices = isGood ? goodItems : badItems;
  const choice = isTimeBonus
    ? { name: 'Time Bonus', image: itemImages.timeBonus }
    : choices[Math.floor(Math.random() * choices.length)];
  const maxSize = 64;
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
    good: !isTimeBonus && isGood,
    timeBonus: isTimeBonus,
    speed: (115 + Math.random() * 65) * (1 + 0.25 * difficultyProgress)
  });
}

function update(delta) {
  animationTime += delta;
  roundElapsed = Math.min(60, roundElapsed + delta);
  // Difficulty rises smoothly through the 0–20s Easy, 21–40s Medium, and 41–60s Challenging ranges.
  const difficultyProgress = roundElapsed / 60;
  if (keys.has('ArrowLeft') || keys.has('a')) {
    player.x -= player.speed * delta;
    playerDirection = -1;
  }
  if (keys.has('ArrowRight') || keys.has('d')) {
    player.x += player.speed * delta;
    playerDirection = 1;
  }
  player.x = Math.max(38, Math.min(canvas.width - 38, player.x));

  spawnTimer += delta;
  const spawnInterval = 0.85 - 0.15 * difficultyProgress;
  if (spawnTimer >= spawnInterval) { spawnItem(difficultyProgress); spawnTimer = 0; }

  for (let i = items.length - 1; i >= 0; i--) {
    const item = items[i];
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
        secondsLeft = Math.min(60, secondsLeft + 3);
        showToast('+3 SECONDS!', true);
      } else if (item.good) {
        playSound(soundEffects.goodCatch, true);
        score += 2;
        showToast(goodMessages[feedbackIndex % goodMessages.length], true);
        feedbackIndex++;
      } else {
        playSound(soundEffects.badCatch, true);
        lives -= 1;
        showToast(badMessages[feedbackIndex % badMessages.length], false);
        feedbackIndex++;
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
    if (secondsLeft <= 0) endGame(score >= 20 && lives > 0);
  }, 1000);
}

function pauseGame() {
  if (!running || paused) return;
  paused = true;
  keys.clear();
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
  pauseOverlay.hidden = true;
  pauseMenuPanel.hidden = false;
  pauseConfirmationPanel.hidden = true;
  pauseButton.hidden = false;
  restartButton.hidden = false;
  keys.clear();
  lastTime = performance.now();
  startGameTimer();
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

function returnToMainMenu() {
  running = false;
  paused = false;
  stopBackgroundMusic();
  clearInterval(gameTimer);
  gameTimer = null;
  if (animationFrameId !== null) cancelAnimationFrame(animationFrameId);
  animationFrameId = null;
  keys.clear();
  pauseButton.hidden = true;
  pauseOverlay.hidden = true;
  pauseMenuPanel.hidden = false;
  pauseConfirmationPanel.hidden = true;
  restartButton.hidden = true;
  resultCard.hidden = true;
  instructionCard.hidden = false;
  screen.hidden = true;
  screen.classList.remove('hidden', 'result-screen', 'win-result', 'game-over-result');
  mainMenuPanel.hidden = false;
  mainMenu.classList.remove('hidden');
  gameShell.classList.remove('result-active');
  gameShell.classList.add('main-menu-active');
  currentAudioScreen = 'menu';
  restoreBackgroundMusic(true);
}

function startGame(restartMusic = false) {
  paused = false;
  pauseOverlay.hidden = true;
  pauseButton.hidden = false;
  pauseMenuPanel.hidden = false;
  pauseConfirmationPanel.hidden = true;
  currentAudioScreen = 'gameplay';
  playBackgroundMusic(gameplayMusic, restartMusic);
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

  score = 0;
  roundElapsed = 0;
  lives = MAX_LIVES;
  secondsLeft = 60;
  items = [];
  spawnTimer = 0;
  player.x = canvas.width / 2;
  updateHud();
  feedbackIndex = 0;
  instructionCard.hidden = false;
  resultCard.hidden = true;
  gameShell.classList.remove('result-active');
  screen.classList.remove('result-screen', 'win-result', 'game-over-result');
  screen.classList.add('hidden');
  screen.hidden = false;
  running = true;
  restartButton.hidden = false;
  lastTime = performance.now();
  startGameTimer();
  animationFrameId = requestAnimationFrame(frame);
}

document.getElementById('play-menu-button').addEventListener('click', () => {
  currentAudioScreen = 'gameplay';
  playBackgroundMusic(gameplayMusic);
  mainMenu.classList.add('hidden');
  gameShell.classList.remove('main-menu-active', 'result-active');
  instructionCard.hidden = false;
  resultCard.hidden = true;
  screen.classList.remove('result-screen', 'win-result', 'game-over-result');
  screen.hidden = false;
  screen.classList.remove('hidden');
});

pauseButton.addEventListener('click', pauseGame);
resumeButton.addEventListener('click', resumeGame);
pauseMainMenuButton.addEventListener('click', showMainMenuConfirmation);
cancelMainMenuButton.addEventListener('click', cancelMainMenuConfirmation);
confirmMainMenuButton.addEventListener('click', returnToMainMenu);
startButton.addEventListener('click', () => startGame());
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
  if (['ArrowLeft', 'ArrowRight', ' '].includes(key)) event.preventDefault();
  if (running && !paused) keys.add(key);
});
window.addEventListener('keyup', (event) => {
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
  keys.delete(key);
});

draw();
updateAudioToggleStates();

document.addEventListener('click', (event) => {
  if (!event.target.closest('button')) return;
  if (soundEffectsEnabled) playSound(soundEffects.buttonClick);
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
