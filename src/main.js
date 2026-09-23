import { PoseTracker } from './pose.js';
import { AudioAnalyzer } from './audio.js';
import { PerformanceController } from './performance.js';
import { dancePose, blend } from './dance.js';

const $ = id => document.getElementById(id);
const video = $('video'), canvas = $('canvas'), ctx = canvas.getContext('2d');
const tracker = new PoseTracker(), audio = new AudioAnalyzer(), performanceCtl = new PerformanceController();
let cameraOn = false, micOn = false, last = 0, fps = 0, trail = [], faces = [];
const cfg = () => ({ line: +$('line').value, intensity: +$('intensity').value, reactivity: +$('reactivity').value, distance: +$('distance').value, genre: $('genre').value, mirror: $('mirror').checked, display: $('display').value, faceScale: +$('faceScale').value, faceX: +$('faceX').value, faceY: +$('faceY').value });
function resize() { canvas.width = innerWidth; canvas.height = innerHeight; }
addEventListener('resize', resize); resize();
const edge = [['shoulderL','shoulderR'],['shoulderL','elbowL'],['elbowL','wristL'],['shoulderR','elbowR'],['elbowR','wristR'],['shoulderL','hipL'],['shoulderR','hipR'],['hipL','hipR'],['hipL','kneeL'],['kneeL','ankleL'],['hipR','kneeR'],['kneeR','ankleR']];
function draw(p, alpha = 1) {
  const s = cfg(), j = p.joints;
  ctx.save(); ctx.globalAlpha = alpha; ctx.strokeStyle = '#d1ff45'; ctx.shadowColor = '#aaff00'; ctx.shadowBlur = 16; ctx.lineWidth = s.line; ctx.lineCap = 'round';
  for (const [a, b] of edge) { ctx.beginPath(); ctx.moveTo(j[a].x, j[a].y); ctx.lineTo(j[b].x, j[b].y); ctx.stroke(); }
  ctx.shadowBlur = 0; ctx.fillStyle = '#fff';
  for (const q of Object.values(j)) { ctx.beginPath(); ctx.arc(q.x, q.y, Math.max(2, s.line * .4), 0, Math.PI * 2); ctx.fill(); }
  const face = faces[+$('faceSelect').value], size = p.scale * s.faceScale;
  if (face) { ctx.save(); ctx.beginPath(); ctx.arc(p.head.x + s.faceX, p.head.y + s.faceY, size * .55, 0, Math.PI * 2); ctx.clip(); ctx.drawImage(face, p.head.x + s.faceX - size * .55, p.head.y + s.faceY - size * .55, size * 1.1, size * 1.1); ctx.restore(); }
  else { ctx.fillStyle = '#ff5ea8'; ctx.beginPath(); ctx.arc(p.head.x + s.faceX, p.head.y + s.faceY, size * .5, 0, Math.PI * 2); ctx.fill(); }
  ctx.restore();
}
function raw(p) { if (!p) return; ctx.fillStyle = '#ff5ea8'; for (const q of p.rawLandmarks) { ctx.beginPath(); ctx.arc(q.x, q.y, 2, 0, Math.PI * 2); ctx.fill(); } }
function detach(p, x) { const d = cfg().distance * x, dx = $('direction').value === 'left' ? -d : $('direction').value === 'up' ? 0 : d, dy = $('direction').value === 'up' ? -d * .6 : 0; for (const q of Object.values(p.joints)) { q.x += dx; q.y += dy; } p.head.x += dx; p.head.y += dy; return p; }function setPoseStatus(human) { const el = $('poseStatus'); if (el) el.textContent = `CAMERA: ${cameraOn ? 'READY' : 'OFF'} | MEDIAPIPE: ${tracker.status} | POSE: ${human ? 'DETECTED' : 'NOT DETECTED'} | LANDMARKS: ${tracker.landmarkCount}`; }
function loop(now) {
  requestAnimationFrame(loop); fps = fps * .9 + 1000 / Math.max(1, now - last) * .1; last = now;
  const s = cfg(), f = audio.update(now, $('bpmAuto').checked); if (!$('bpmAuto').checked) audio.bpm = +$('bpm').value;
  video.style.transform = s.mirror ? 'scaleX(-1)' : 'none'; const human = tracker.update(canvas.width, canvas.height, now, s.mirror), state = performanceCtl.update(now);
  ctx.clearRect(0, 0, canvas.width, canvas.height); video.style.opacity = s.display === 'live' ? '.7' : s.display === 'silhouette' ? '.16' : '0'; if (s.display === 'dark' || s.display === 'character') { ctx.fillStyle = '#07070a'; ctx.fillRect(0, 0, canvas.width, canvas.height); }
  if (human) { const p = performanceCtl.state === 'FOLLOW' ? human : detach(blend(human, dancePose(human, now, audio.bpm, s.genre, s.intensity, f), state.auto), state.auto); if (s.trail && performanceCtl.state !== 'FOLLOW') { trail.push(structuredClone(p)); while (trail.length > 18) trail.shift(); trail.forEach((v, i) => draw(v, i / trail.length * .16)); } else trail = []; draw(p); if ($('debug').checked) raw(tracker.raw); } else trail = [];
  $('notice').style.display = cameraOn && !human ? 'block' : 'none'; $('notice').textContent = tracker.status === 'ERROR' ? `MEDIAPIPE ERROR: ${tracker.error}` : 'NO POSE DETECTED'; setPoseStatus(human);
  if ($('debug').checked) { ctx.fillStyle = '#fff'; ctx.font = '12px monospace'; ctx.fillText(`Confidence ${tracker.confidence.toFixed(2)} | Pose FPS ${tracker.poseFps.toFixed(0)}`, 15, canvas.height - 18); }
  $('stats').textContent = `FPS ${fps.toFixed(0)} · ${performanceCtl.state}`; $('bpmStatus').textContent = !micOn ? 'BPM: --' : !$('bpmAuto').checked ? `BPM: ${audio.bpm | 0} (MANUAL)` : audio.last ? `BPM: ${Math.round(audio.bpm)} (AUTO)` : 'BPM: detecting...';
}
$('camera').onclick = async () => { try { video.srcObject = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } }); await video.play(); cameraOn = true; $('camera').textContent = 'CAMERA ON'; await tracker.start(video); } catch (e) { console.error('[Camera]', e); cameraOn = false; $('camera').textContent = 'CAMERA ERROR'; } };
$('faces').onchange = e => { for (const file of e.target.files) { const image = new Image(); image.onload = () => { faces.push(image); $('faceSelect').add(new Option(file.name, faces.length - 1)); }; image.src = URL.createObjectURL(file); } };
$('mic').onclick = async () => { micOn = await audio.start(); $('mic').textContent = micOn ? 'MIC ON' : 'MIC OFF'; }; $('bpm').oninput = e => $('bpmOut').textContent = e.target.value;
document.querySelectorAll('[data-state]').forEach(b => b.onclick = () => { performanceCtl.set(b.dataset.state); if ($('randomFace').checked && faces.length) $('faceSelect').value = Math.floor(Math.random() * faces.length); }); $('auto').onchange = e => performanceCtl.auto = e.target.checked; $('fullscreen').onclick = () => document.documentElement.requestFullscreen(); $('hide').onclick = () => $('panel').classList.add('hidden'); addEventListener('keydown', e => { if (e.key.toLowerCase() === 'h') $('panel').classList.toggle('hidden'); }); loop(performance.now());
