import { useRef, useState, useEffect } from 'react'

function App() {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const canvasRef = useRef(null)
  const [cameraOn, setCameraOn] = useState(false)
  const [spot, setSpot] = useState(null)

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      })
      videoRef.current.srcObject = stream
      streamRef.current = stream
      setCameraOn(true)
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

        // Strong red only
        const isStrongRed =
          r > 180 &&          // must be bright red
          g < 100 &&          // low green
          b < 100 &&          // low blue
          r - Math.max(g, b) > 80  // strong dominance

        if (isStrongRed) {
          sumX += x
          sumY += y
          count++
        }
      }
    }

    if (count < 20) return null  // require larger cluster
    return { x: sumX / count, y: sumY / count }
  }

  return (
    <div>
      <button onClick={cameraOn ? stopCamera : startCamera}>
        {cameraOn ? 'Turn Off Camera' : 'Turn On Camera'}
      </button>

      <video ref={videoRef} autoPlay playsInline style={{ width: '50%' }} />

      {/* hidden canvas for pixel reading */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* debug readout */}
      {spot ? (
        <p>🔴 Red light detected at x: {Math.round(spot.x)}, y: {Math.round(spot.y)}</p>
      ) : (
        <p>No red light detected</p>
      )}
    </div>
  )
}

export default App