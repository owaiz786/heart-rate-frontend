const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const result = document.getElementById('result');
let greenSignal = [];

navigator.mediaDevices.getUserMedia({ video: true })
  .then(stream => {
    video.srcObject = stream;
    setInterval(processFrame, 100); // every ~3 FPS
  });

function processFrame() {
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  const frame = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

  let greenTotal = 0, count = 0;
  const regionTop = 60, regionBottom = 100, regionLeft = 100, regionRight = 220;

  for (let y = regionTop; y < regionBottom; y++) {
    for (let x = regionLeft; x < regionRight; x++) {
      const i = (y * canvas.width + x) * 4;
      greenTotal += frame[i + 1]; // green channel
      count++;
    }
  }

  const avgGreen = greenTotal / count;
  greenSignal.push(avgGreen);

  if (greenSignal.length >= 300) {
    fetch("https://heart-rate-backend-2x4b.onrender.com/analyze", {
      method: "POST",
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ green_signal: greenSignal, fs: 10 })
    })
    .then(res => {
      if (!res.ok) throw new Error("Failed to get response");
      return res.blob(); // 🔄 Get image blob instead of JSON
    })
    .then(blob => {
      const url = URL.createObjectURL(blob);
      result.innerHTML = `<img src="${url}" width="100%">`; // 🎯 Show the graph
      greenSignal = [];
    })
    .catch(() => {
      result.innerText = "Server error";
      greenSignal = [];
    });
  }
}

