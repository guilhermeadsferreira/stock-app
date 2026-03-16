import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { useBarcode } from '@/application/hooks/useBarcode'
import { Button } from '@/components/ui/button'

interface Props {
  onResult: (barcode: string) => void
  onClose: () => void
}

export function BarcodeScanner({ onResult, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const { startScan, stopScan } = useBarcode(onResult)

  useEffect(() => {
    if (videoRef.current) {
      startScan(videoRef.current)
    }
    return () => {
      stopScan()
    }
  }, [startScan, stopScan])

  function handleClose() {
    stopScan()
    onClose()
  }

  return (
    <div className="relative overflow-hidden rounded-xl bg-black">
      <video
        ref={videoRef}
        className="h-52 w-full object-cover"
        autoPlay
        playsInline
        muted
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-28 w-56 rounded-lg border-2 border-white/70 shadow-[0_0_0_9999px_rgba(0,0,0,0.4)]" />
      </div>
      <Button
        variant="secondary"
        size="sm"
        onClick={handleClose}
        className="absolute right-2 top-2"
      >
        <X className="h-4 w-4" />
        Fechar câmera
      </Button>
    </div>
  )
}
