const socket = io("https://hashwelium.github.io/stereo-chat/"); // ←ここ自分のURL

let localStream;
let pc;
let startTime;
let timerInterval;

const statusEl = document.getElementById("status");
const timerEl = document.getElementById("timer");

function logStatus(msg) {
  console.log(msg);
  statusEl.textContent = msg;
}

function enableStereo(sdp) {
  return sdp.replace(
    /a=fmtp:111 minptime=10;useinbandfec=1/g,
    "a=fmtp:111 minptime=10;useinbandfec=1;stereo=1;sprop-stereo=1"
  );
}

function startTimer() {
  startTime = Date.now();
  timerInterval = setInterval(() => {
    const diff = Date.now() - startTime;
    const min = Math.floor(diff / 60000).toString().padStart(2, "0");
    const sec = Math.floor((diff % 60000) / 1000).toString().padStart(2, "0");
    timerEl.textContent = `${min}:${sec}`;
  }, 1000);
}

async function startCall() {
  logStatus("🎤 マイク取得中...");

  localStream = await navigator.mediaDevices.getUserMedia({
    audio: {
      channelCount: 2,
      sampleRate: 48000,
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false,
    }
  });

  pc = new RTCPeerConnection({
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      {
        urls: "turn:openrelay.metered.ca:80",
        username: "openrelayproject",
        credential: "openrelayproject"
      }
    ]
  });

  localStream.getTracks().forEach(track => pc.addTrack(track, localStream));

  pc.ontrack = (event) => {
    const audio = new Audio();
    audio.srcObject = event.streams[0];
    audio.play();
    logStatus("🔊 相手の音声受信中");
    startTimer();
  };

  pc.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit("ice-candidate", event.candidate);
    }
  };

  const offer = await pc.createOffer();
  await pc.setLocalDescription({ type: "offer", sdp: enableStereo(offer.sdp) });

  socket.emit("offer", pc.localDescription);
  logStatus("📡 接続待機中...");
}

socket.on("offer", async (offer) => {
  if (!pc) await startCall();

  await pc.setRemoteDescription(offer);
  const answer = await pc.createAnswer();
  await pc.setLocalDescription({ type: "answer", sdp: enableStereo(answer.sdp) });
  socket.emit("answer", pc.localDescription);
});

socket.on("answer", async (answer) => {
  await pc.setRemoteDescription(answer);
});

socket.on("ice-candidate", async (candidate) => {
  try {
    await pc.addIceCandidate(candidate);
  } catch (e) {
    console.error(e);
  }
});

document.getElementById("startBtn").onclick = startCall;



