import { useRef, useState } from 'react'

function App() {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [cameraOn, setCameraOn] = useState(false)

  const startCamera = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' }
    })
    videoRef.current.srcObject = stream
    streamRef.current = stream
    setCameraOn(true)
  }

  const stopCamera = () => {
    streamRef.current.getTracks().forEach(track => track.stop())
    videoRef.current.srcObject = null
    setCameraOn(false)
  }

  return (
    <div>
      <button onClick={cameraOn ? stopCamera : startCamera}>
        {cameraOn ? 'Turn Off Camera' : 'Turn On Camera'}
      </button>
      <video ref={videoRef} autoPlay playsInline />
    </div>
  )
}

export default App