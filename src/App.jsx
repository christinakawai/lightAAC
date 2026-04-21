import { useRef, useState, useEffect } from 'react'
import { BOARD_LAYOUT } from './utils/boardLayout'

function App() {
  // TODO: Incorporate the board
  
  // references to the live camera feed and its stream (needed to start/stop it)
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  // a hidden canvas used to grab and analyze individual video frames
  const canvasRef = useRef(null)
  // boolean of whether the camera is running
  const [cameraOn, setCameraOn] = useState(false)
  // the current detected position of the red light 
  const [spot, setSpot] = useState(null)
  // the four calibration points captured so far
  const [corners, setCorners] = useState([])
  // controls which UI is shown
  const [screen, setScreen] = useState('camera') // 'camera' | 'calibration' | 'detection'

  const CORNER_NAMES = [
    'Top-Left corner',
    'Top-Right corner',
    'Bottom-Left corner',
    'Bottom-Right corner'
  ]

  // requests camera access (preferring the rear camera via facingMode: 'environment'), 
  // attaches the stream to the video element, and moves to the calibration screen
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

  // stops all camera tracks and resets everything back to the start scree
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

  // This runs a requestAnimationFrame loop whenever the camera is on. Each frame it:
  // Draws the current video frame onto the hidden canvas
  // Reads the raw pixel data with getImageData
  // Passes it to findRedLight and updates spot
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

  // core detection algorithm to find where the red light is
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

  // saves the current spot position as a corner. After 4 corners are captured, moves to the detection screen
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