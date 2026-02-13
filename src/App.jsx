import { useRef, useState, useEffect } from 'react'
import { BOARD_LAYOUT } from './utils/boardLayout'

function App() {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const canvasRef = useRef(null)
  const [cameraOn, setCameraOn] = useState(false)
  const [spot, setSpot] = useState(null)
  const [corners, setCorners] = useState([])
  const [screen, setScreen] = useState('camera') // 'camera' | 'calibration' | 'detection'

  const CORNER_NAMES = [
    'Top-Left corner',
    'Top-Right corner',
    'Bottom-Left corner',
    'Bottom-Right corner'
  ]

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      })
      videoRef.current.srcObject = stream
      streamRef.current = stream
      setCameraOn(true)
      setScreen('calibration')
    } catch(err) {
      alert(err.message)
    }
  }

  const stopCamera = () => {
    try {
      streamRef.current.getTracks().forEach(track => track.stop())
      videoRef.current.srcObject = null
      setCameraOn(false)
      setSpot(null)
      setCorners([])
      setScreen('camera')
    } catch(err) {
      alert(err.message)
    }
  }

  useEffect(() => {
    if (!cameraOn) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    let animId

    const detect = () => {
      animId = requestAnimationFrame(detect)
      const video = videoRef.current
      if (!video || !video.videoWidth) return

      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      ctx.drawImage(video, 0, 0)

      const frame = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const result = findRedLight(frame)
      setSpot(result)
    }

    animId = requestAnimationFrame(detect)
    return () => cancelAnimationFrame(animId)
  }, [cameraOn])

  const findRedLight = (imageData) => {
    const { data, width, height } = imageData
    let sumX = 0, sumY = 0, count = 0

    for (let y = 0; y < height; y += 3) {
      for (let x = 0; x < width; x += 3) {
        const i = (y * width + x) * 4
        const r = data[i]
        const g = data[i + 1]
        const b = data[i + 2]

        if (r > 150 && r > g * 1.6 && r > b * 1.6) {
          sumX += x
          sumY += y
          count++
        }
      }
    }

    if (count < 8) return null
    return {
      x: sumX / count,
      y: sumY / count,
      normX: (sumX / count) / imageData.width,
      normY: (sumY / count) / imageData.height
    }
  }

  const captureCorner = () => {
    if (!spot) {
      alert('No red light detected! Point your light at the corner first.')
      return
    }
    const newCorners = [...corners, { x: spot.normX, y: spot.normY }]
    setCorners(newCorners)

    if (newCorners.length === 4) {
      setScreen('detection')
    }
  }

  return (
    <div>
      <video ref={videoRef} autoPlay playsInline style={{ width: '100%' }} />
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* SCREEN 1 — Start */}
      {screen === 'camera' && (
        <div>
          <h2>LightSpeak</h2>
          <button onClick={startCamera}>Start Camera</button>
        </div>
      )}

      {/* SCREEN 2 — Calibration */}
      {screen === 'calibration' && (
        <div>
          <p>Step {corners.length + 1} of 4</p>
          <p>Point your light at the <strong>{CORNER_NAMES[corners.length]}</strong> of the board</p>
          {spot ? (
            <p>🔴 Light detected!</p>
          ) : (
            <p>⏳ Waiting for red light...</p>
          )}
          <button onClick={captureCorner}>Capture Corner</button>
          <button onClick={stopCamera}>Cancel</button>
        </div>
      )}

      {/* SCREEN 3 — Detection */}
      {screen === 'detection' && (
        <div>
          <p>✅ Calibrated! Detection active.</p>
          <p>{spot ? `🔴 Light at: ${Math.round(spot.normX * 100)}%, ${Math.round(spot.normY * 100)}%` : 'No light detected'}</p>
          <button onClick={() => { setCorners([]); setScreen('calibration') }}>Recalibrate</button>
          <button onClick={stopCamera}>Stop</button>
        </div>
      )}
    </div>
  )
}

export default App