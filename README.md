# Autonomous Dance Skeleton

PC camera pose tracking turns a participant into an illustrated-face stick figure that follows, drifts away, dances autonomously to music, and returns. It is a browser-only prototype designed for an exhibition setting.

## Features

- MediaPipe Pose Landmarker with EMA smoothing; face uploads (PNG/JPEG/WebP)
- FOLLOW → DRIFT → DETACH → AUTONOMOUS → RETURN controller and optional auto-performance
- Procedural, beat-clocked phrase vocabulary for House, Hip-hop, Jazz, Breaking, Funk/Disco, and Contemporary
- Microphone analyser: RMS, frequency bands, onset-derived BPM smoothing, and manual 60–180 BPM fallback
- Live, silhouette, character-only and dark display modes; trails, fullscreen, debug and H-key panel hiding

## Run locally

```bash
npm install
npm run dev
```

Camera and microphone require permission; use localhost or HTTPS. Start Camera and Microphone from their buttons. The published demo is available at https://kkodamalab.github.io/autonomous-dance-skeleton/.

## Limitations

The phrase set is stylized motion vocabulary, not a claim of authentic dance instruction. Pose and BPM quality depend on light, camera framing, and music input. MediaPipe model files are loaded from Google/CDN at runtime.
