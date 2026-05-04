/**
 * ASCII STREET WALK — Three.js WebGL
 *
 * Required files (same folder as index.html):
 *   ascii-art_1.png
 *   ongEnvelope.png
 *   votive_calendar_background.jpg
 *   boDocOng.m4a
 *   Skype_connection_sound.mp3
 *   Skype_-_Skype_Ringtone__HQ_SOUND_.mp3
 */

// ─── RENDERER ────────────────────────────────────────────────────────────────
var renderer = new THREE.WebGLRenderer({ antialias: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0xf0ede6);
document.body.appendChild(renderer.domElement);

var scene  = new THREE.Scene();
scene.fog  = new THREE.FogExp2(0xf0ede6, 0.020);

var camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 300);
camera.position.set(0, 1.7, 0);

window.addEventListener('resize', function () {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ─── TEXTURES ────────────────────────────────────────────────────────────────
var loader = new THREE.TextureLoader();

// ════════════════════════════════════════════════════════════════════════════
// ██  SWAP THESE FILENAMES to use your own images for walls / floor / ceiling
// ════════════════════════════════════════════════════════════════════════════
// ════════════════════════════════════════════════════════════════════════════
// ██  TEXTURES  — swap any filename below to use your own image  ████████████
// ════════════════════════════════════════════════════════════════════════════
var TEXTURES = {
  floor:     'votive_calendar_background.jpg',
  wallLeft:  'red and yellow.png',
  wallRight: 'red and yellow.png',
  ceiling:   'horse votive.jpg',
};

// How many times each image tiles across its surface [horizontal, vertical]
var TILING = {
  floor:     [3,  15],
  wallLeft:  [10,  3],
  wallRight: [10,  3],
  ceiling:   [4,  30],
};

// Ceiling opacity — 0 = invisible, 1 = fully opaque
var CEILING_OPACITY = 0.9;
// ════════════════════════════════════════════════════════════════════════════
var CEILING_OPACITY = 0.18;
// ════════════════════════════════════════════════════════════════════════════

function tiledTex(key) {
  return loader.load(TEXTURES[key], function (t) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(TILING[key][0], TILING[key][1]);
    t.minFilter = THREE.LinearMipMapLinearFilter;
  });
}

// ─── GEOMETRY ────────────────────────────────────────────────────────────────
// Floor
var floor = new THREE.Mesh(
  new THREE.PlaneGeometry(14, 140),
  new THREE.MeshBasicMaterial({ map: tiledTex('floor') })
);
floor.rotation.x = -Math.PI / 2;
floor.position.set(0, 0, -60);
scene.add(floor);

// Walls
function makeWall(side, x, rotY) {
  var m = new THREE.Mesh(
    new THREE.PlaneGeometry(140, 8),
    new THREE.MeshBasicMaterial({ map: tiledTex(side), side: THREE.FrontSide })
  );
  m.position.set(x, 4, -60);
  m.rotation.y = rotY;
  scene.add(m);
}
makeWall('wallLeft',  -7,  Math.PI / 2);
makeWall('wallRight',  7, -Math.PI / 2);

// Ceiling
var ceil = new THREE.Mesh(
  new THREE.PlaneGeometry(14, 140),
  new THREE.MeshBasicMaterial({ map: tiledTex('ceiling'), transparent: true, opacity: CEILING_OPACITY })
);
ceil.rotation.x = Math.PI / 2;
ceil.position.set(0, 7.5, -60);
scene.add(ceil);

scene.add(new THREE.AmbientLight(0xffffff, 0.7));

// ─── BILLBOARDS ──────────────────────────────────────────────────────────────
function makeBillboard(file, pos, w, h, label) {
  var m = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshBasicMaterial({ map: loader.load(file), transparent: true, side: THREE.DoubleSide })
  );
  m.position.copy(pos);
  if (pos.x < 0) m.rotation.y =  Math.PI / 2;
  if (pos.x > 0) m.rotation.y = -Math.PI / 2;
  scene.add(m);
  return { mesh: m, label: label, position: pos.clone() };
}

var billboards = [
  makeBillboard('ongEnvelope.png',               new THREE.Vector3(-6.8, 2.5,  -25), 4.5, 3.2, 'Ông — thờ'),
  makeBillboard('votive_calendar_background.jpg', new THREE.Vector3( 6.8, 2.5,  -55), 4.0, 5.0, 'Chúc mừng năm mới'),
  makeBillboard('ong_o_dau.png',                 new THREE.Vector3(-6.8, 2.5,  -80), 4.5, 5.5, 'ông ở đâu'),
  makeBillboard('ascii_home.png',                new THREE.Vector3( 6.8, 2.5, -100), 5.0, 4.0, 'nhà'),
];

// ─── ESP32-CAM STREAM ────────────────────────────────────────────────────────
// Change this IP to match whatever the DHCP server assigns to the ESP32-CAM.
// On a standard hostapd/dnsmasq AP the first client is usually 192.168.4.2.
var ESP32_STREAM_URL = 'http://192.168.4.154/stream';

var webcamMesh = null;
function setupWebcam() {
  var canvas = document.createElement('canvas');
  canvas.width  = 640;
  canvas.height = 480;
  var ctx = canvas.getContext('2d');

  var tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.LinearFilter;

  webcamMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(10, 7),
    new THREE.MeshBasicMaterial({ map: tex })
  );
  webcamMesh.position.set(0, 3, -118);
  scene.add(webcamMesh);

  // Label
  var c = document.createElement('canvas');
  c.width = 512; c.height = 64;
  var cx = c.getContext('2d');
  cx.fillStyle = '#f0ede6'; cx.fillRect(0,0,512,64);
  cx.fillStyle = '#111'; cx.font = '26px Courier New'; cx.textAlign = 'center';
  cx.fillText('cháu có nhơ ông', 256, 42);
  var lbl = new THREE.Mesh(
    new THREE.PlaneGeometry(6, 0.6),
    new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true })
  );
  lbl.position.set(0, 7.2, -118);
  scene.add(lbl);

  // MJPEG stream: keep a hidden <img> the browser updates continuously,
  // then blit it onto the canvas texture each render frame.
  var img = document.createElement('img');
  img.crossOrigin = 'anonymous';
  // visibility:hidden keeps it in the render tree so the browser keeps
  // pushing MJPEG frames into it; display:none or off-screen can pause it.
  img.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:1px;visibility:hidden;';
  document.body.appendChild(img);
  function loadStream() {
    img.src = '';
    img.src = ESP32_STREAM_URL;
  }
  img.onerror = function () {
    console.warn('ESP32 stream unreachable, retrying in 3s…');
    setTimeout(loadStream, 3000);
  };
  loadStream();

  webcamMesh.userData.updateTex = function () {
    try {
      ctx.drawImage(img, 0, 0, 640, 480);
      tex.needsUpdate = true;
    } catch (e) {}
  };
}

// ─── AUDIO SYSTEM ────────────────────────────────────────────────────────────
// We use HTMLAudioElement for the ringtone (handled in index.html).
// For spatial / proximity sounds inside the 3D world we use Web Audio API.
// Key rules that make this reliable:
//   1. AudioContext created on the SAME click that starts the game (user gesture).
//   2. audioCtx.resume() called right after creation (Chrome sometimes starts suspended).
//   3. Sounds loaded with XMLHttpRequest (works for local files; fetch() can fail with file://).
//   4. Gain starts at 0 so nothing is audible until the player is close.

var audioCtx = null;

// ── helper: load a file into an AudioBuffer via XHR ──────────────────────────
function loadBuffer(url, onDone) {
  var xhr = new XMLHttpRequest();
  xhr.open('GET', url, true);
  xhr.responseType = 'arraybuffer';
  xhr.onload = function () {
    audioCtx.decodeAudioData(xhr.response, function (buf) {
      onDone(buf);
    }, function (e) { console.warn('decodeAudioData failed for', url, e); });
  };
  xhr.onerror = function () { console.warn('XHR failed for', url); };
  xhr.send();
}

// ── Spatial billboard sounds ──────────────────────────────────────────────────
// Each entry needs: url, position (Vector3), maxDist
// Add/remove entries here to match your billboards.
var spatialDefs = [
  { url: 'boDocOng.m4a',  position: new THREE.Vector3(-6.8, 2.5, -25), maxDist: 18 },
  { url: 'boDocOng.m4a',  position: new THREE.Vector3( 6.8, 2.5, -55), maxDist: 18 },
  { url: 'boDocOng2.m4a', position: new THREE.Vector3(-6.8, 2.5, -80), maxDist: 18 },
];

// Runtime state added per entry after audio loads
// { buf, source, gain, panner, playing }

function initSpatialSounds() {
  spatialDefs.forEach(function (s) {
    loadBuffer(s.url, function (buf) {
      // Start looping immediately at gain 0 — volume is controlled each frame
      s.gain = audioCtx.createGain();
      s.gain.gain.value = 0;
      s.gain.connect(audioCtx.destination);

      s.source = audioCtx.createBufferSource();
      s.source.buffer = buf;
      s.source.loop   = true;
      s.source.connect(s.gain);
      s.source.start(0);
      s.ready = true;
    });
  });
}

function updateSpatialSounds() {
  if (!audioCtx) return;
  var p = camera.position;

  spatialDefs.forEach(function (s) {
    if (!s.ready) return;
    var dist = p.distanceTo(s.position);
    var vol  = Math.max(0, 1 - dist / s.maxDist);
    s.gain.gain.setTargetAtTime(vol, audioCtx.currentTime, 0.1);
  });
}

// ── Webcam proximity sound — Một Cõi Đi Về ───────────────────────────────────
// Starts silent at the beginning of the tunnel, grows to full volume at the webcam.
var WEBCAM_POS      = new THREE.Vector3(0, 1.7, -118);
var WEBCAM_MAX_DIST = 118; // full tunnel length
var connectLoop     = { buf: null, source: null, gain: null, playing: false };

function initConnectLoop() {
  loadBuffer('mot_coi_di_ve.mp3', function (buf) {
    connectLoop.gain = audioCtx.createGain();
    connectLoop.gain.gain.value = 0;
    connectLoop.gain.connect(audioCtx.destination);

    connectLoop.source = audioCtx.createBufferSource();
    connectLoop.source.buffer = buf;
    connectLoop.source.loop   = true;
    connectLoop.source.connect(connectLoop.gain);
    connectLoop.source.start(0);
    connectLoop.playing = true;
  });
}

function updateConnectLoop() {
  if (!connectLoop.gain || !audioCtx) return;
  var dist    = camera.position.distanceTo(WEBCAM_POS);
  var linear  = Math.max(0, 1 - dist / WEBCAM_MAX_DIST); // 0 at start, 1 at webcam
  var vol     = 0.08 + linear * 0.77;  // ranges from 0.08 (entrance) → 0.85 (webcam)
  connectLoop.gain.gain.setTargetAtTime(vol, audioCtx.currentTime, 0.5);
}

// ── Constant ambient — shortwave radio, flat volume throughout ────────────────
var ambientLoop = { source: null, gain: null };

function initAmbient() {
  loadBuffer('ambient_shortwave.wav', function (buf) {
    ambientLoop.gain = audioCtx.createGain();
    ambientLoop.gain.gain.value = 0.85; // always-on, clearly audible throughout
    ambientLoop.gain.connect(audioCtx.destination);

    ambientLoop.source = audioCtx.createBufferSource();
    ambientLoop.source.buffer = buf;
    ambientLoop.source.loop   = true;
    ambientLoop.source.connect(ambientLoop.gain);
    ambientLoop.source.start(0);
  });
}

// ── One-shot connection jingle (called by index.html on Answer click) ─────────
// Uses a plain Audio element so it fires immediately from the click handler.
window.playConnectJingle = function () {
  var a = new Audio('Skype_connection_sound.mp3');
  a.volume = 1.0;
  a.play().catch(function (e) { console.warn('connect jingle:', e); });
};

// ─── CONTROLS ────────────────────────────────────────────────────────────────
var keys = {};
window.addEventListener('keydown', function (e) { keys[e.code] = true;  });
window.addEventListener('keyup',   function (e) { keys[e.code] = false; });

var yaw = 0, pitch = 0;

// ── Look mode: pointer lock (click to lock) OR click-drag (always works) ──────
var pointerLocked = false;
var isDragging    = false;
var lastMouseX    = 0;
var lastMouseY    = 0;
var LOOK_SPEED    = 0.005; // drag sensitivity (higher = faster turn)

// Pointer lock — still available if user clicks the canvas
renderer.domElement.addEventListener('click', function () {
  if (gameStarted && !isDragging) renderer.domElement.requestPointerLock();
});
document.addEventListener('pointerlockchange', function () {
  pointerLocked = document.pointerLockElement === renderer.domElement;
  // Update cursor visual
  renderer.domElement.style.cursor = pointerLocked ? 'none' : 'grab';
});

// Pointer-lock mouse movement
document.addEventListener('mousemove', function (e) {
  if (!pointerLocked) return;
  applyDelta(e.movementX, e.movementY);
});

// ── Click-drag mouse look (works without pointer lock) ──────────────────────
renderer.domElement.addEventListener('mousedown', function (e) {
  if (!gameStarted) return;
  // Exit pointer lock so drag mode takes over cleanly
  if (pointerLocked) document.exitPointerLock();
  isDragging = true;
  lastMouseX = e.clientX;
  lastMouseY = e.clientY;
  renderer.domElement.style.cursor = 'grabbing';
  e.preventDefault();
});
window.addEventListener('mousemove', function (e) {
  if (!isDragging) return;
  applyDelta(e.clientX - lastMouseX, e.clientY - lastMouseY);
  lastMouseX = e.clientX;
  lastMouseY = e.clientY;
});
window.addEventListener('mouseup', function () {
  if (!isDragging) return;
  isDragging = false;
  renderer.domElement.style.cursor = 'grab';
});
// Cancel drag if mouse leaves window
window.addEventListener('mouseleave', function () {
  isDragging = false;
});

// ── Touch drag (mobile 360 look) ────────────────────────────────────────────
var lastTouchX = 0, lastTouchY = 0;
renderer.domElement.addEventListener('touchstart', function (e) {
  if (!gameStarted) return;
  lastTouchX = e.touches[0].clientX;
  lastTouchY = e.touches[0].clientY;
  e.preventDefault();
}, { passive: false });
renderer.domElement.addEventListener('touchmove', function (e) {
  if (!gameStarted) return;
  applyDelta(e.touches[0].clientX - lastTouchX, e.touches[0].clientY - lastTouchY);
  lastTouchX = e.touches[0].clientX;
  lastTouchY = e.touches[0].clientY;
  e.preventDefault();
}, { passive: false });

function applyDelta(dx, dy) {
  yaw   -= dx * LOOK_SPEED;
  pitch -= dy * LOOK_SPEED;
  pitch  = Math.max(-Math.PI * 0.45, Math.min(Math.PI * 0.45, pitch));
}

// ─── PROXIMITY LABEL ─────────────────────────────────────────────────────────
var proximityEl = document.getElementById('proximity-label');
var lastLabel   = '';
function showLabel(text) {
  if (text === lastLabel) return;
  lastLabel = text;
  proximityEl.textContent = text;
  proximityEl.style.opacity = text ? '1' : '0';
}

// ─── PATH ────────────────────────────────────────────────────────────────────
var HALF_W = 5.5, Z_START = 2, Z_END = -120;

// ─── GAME START ──────────────────────────────────────────────────────────────
var gameStarted = false;

// Called by index.html when user clicks Answer
window.onSkypeAnswer = function () {
  gameStarted = true;

  // Show drag cursor as default look mode
  renderer.domElement.style.cursor = 'grab';

  // Update HUD to mention both input methods
  var hud = document.getElementById('hud');
  if (hud) hud.textContent = 'WASD — move  |  drag — look  |  click — lock mouse';

  // Create AudioContext on this user gesture — guaranteed to be running
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  audioCtx.resume(); // Chrome sometimes starts suspended

  initSpatialSounds();
  initConnectLoop();
  initAmbient();
  setupWebcam();
  renderer.domElement.requestPointerLock();
};

// ─── PARTICLES ───────────────────────────────────────────────────────────────
(function () {
  var n = 400, pos = new Float32Array(n * 3), geo = new THREE.BufferGeometry();
  for (var i = 0; i < n; i++) {
    pos[i*3]   = (Math.random() - 0.5) * 12;
    pos[i*3+1] = Math.random() * 7;
    pos[i*3+2] = -(Math.random() * 120);
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  scene.add(new THREE.Points(geo, new THREE.PointsMaterial({ color: 0x222222, size: 0.04, transparent: true, opacity: 0.15 })));
}());

// ─── LOOP ────────────────────────────────────────────────────────────────────
var clock   = new THREE.Clock();
var moveDir = new THREE.Vector3();
var euler   = new THREE.Euler(0, 0, 0, 'YXZ');

function animate() {
  requestAnimationFrame(animate);

  if (!gameStarted) {
    renderer.render(scene, camera);
    return;
  }

  var dt = Math.min(clock.getDelta(), 0.05);

  // Movement
  moveDir.set(0, 0, 0);
  if (keys['KeyW'] || keys['ArrowUp'])    moveDir.z -= 1;
  if (keys['KeyS'] || keys['ArrowDown'])  moveDir.z += 1;
  if (keys['KeyA'] || keys['ArrowLeft'])  moveDir.x -= 1;
  if (keys['KeyD'] || keys['ArrowRight']) moveDir.x += 1;
  if (moveDir.lengthSq() > 0) moveDir.normalize();
  moveDir.applyEuler(new THREE.Euler(0, yaw, 0, 'YXZ'));

  camera.position.x = Math.max(-HALF_W,  Math.min(HALF_W,   camera.position.x + moveDir.x * 6.5 * dt));
  camera.position.z = Math.max(Z_END,    Math.min(Z_START,   camera.position.z + moveDir.z * 6.5 * dt));
  camera.position.y = 1.7;

  euler.set(pitch, yaw, 0);
  camera.quaternion.setFromEuler(euler);

  // Audio
  updateSpatialSounds();
  updateConnectLoop();

  // Stream texture
  if (webcamMesh && webcamMesh.userData.updateTex) webcamMesh.userData.updateTex();

  // Labels
  var lbl = '';
  billboards.forEach(function (b) {
    if (camera.position.distanceTo(b.position) < 10) lbl = b.label;
  });
  if (webcamMesh && camera.position.distanceTo(WEBCAM_POS) < 12) lbl = 'ông có nghe cháu không?';
  showLabel(lbl);

  renderer.render(scene, camera);
}

animate();
