import { useState, useEffect, useRef, useCallback } from 'react'
import { X, Camera, AlertTriangle, RefreshCw } from 'lucide-react'
import { useBarcode, type ScannerState, type ScannerError } from '@/application/hooks/useBarcode'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface Props {
  onResult: (barcode: string) => void
  onClose: () => void
}

export function BarcodeScanner({ onResult, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [state, setState] = useState<ScannerState>('idle')
  const [error, setError] = useState<ScannerError | null>(null)
  const [manualCode, setManualCode] = useState('')

  const handleResult = useCallback((barcode: string) => {
    onResult(barcode)
  }, [onResult])

  const handleError = useCallback((err: ScannerError) => {
    setError(err)
  }, [])

  const handleStateChange = useCallback((s: ScannerState) => {
    setState(s)
  }, [])

  const { startScan, stopScan } = useBarcode({
    onResult: handleResult,
    onError: handleError,
    onStateChange: handleStateChange,
  })

  useEffect(() => {
    if (videoRef.current) {
      startScan(videoRef.current)
    }
    return () => {
      stopScan()
    }
  // startScan and stopScan are stable (no deps on callbacks)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleClose() {
    stopScan()
    onClose()
  }

  function handleRetry() {
    setError(null)
    setState('idle')
    if (videoRef.current) {
      startScan(videoRef.current)
    }
  }

  function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault()
    const code = manualCode.trim()
    if (code) {
      stopScan()
      onResult(code)
    }
  }

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-xl bg-black">
        {/* Video element — always rendered so startScan can attach */}
        <video
          ref={videoRef}
          className="h-52 w-full object-cover"
          autoPlay
          playsInline
          muted
        />

        {/* Scan guide overlay */}
        {state === 'scanning' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-28 w-56 rounded-lg border-2 border-white/70 shadow-[0_0_0_9999px_rgba(0,0,0,0.4)]" />
          </div>
        )}

        {/* Loading state */}
        {(state === 'idle' || state === 'starting') && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60">
            <Camera className="h-8 w-8 text-white/60 animate-pulse" />
            <p className="mt-2 text-sm text-white/60">Iniciando câmera...</p>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 px-4 text-center">
            <AlertTriangle className="h-8 w-8 text-amber-400" />
            <p className="mt-2 text-sm font-medium text-white">
              {error === 'permission_denied'
                ? 'Acesso à câmera negado'
                : error === 'no_camera'
                  ? 'Nenhuma câmera encontrada'
                  : 'Erro ao acessar câmera'}
            </p>
            <p className="mt-1 text-xs text-white/60">
              {error === 'permission_denied'
                ? 'Permita o acesso nas configurações do navegador'
                : 'Use o campo abaixo para digitar o código'}
            </p>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleRetry}
              className="mt-3"
            >
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
              Tentar novamente
            </Button>
          </div>
        )}

        {/* Close button */}
        <Button
          variant="secondary"
          size="sm"
          onClick={handleClose}
          className="absolute right-2 top-2"
        >
          <X className="h-4 w-4" />
          Fechar
        </Button>
      </div>

      {/* Manual code entry fallback */}
      <form onSubmit={handleManualSubmit} className="flex gap-2">
        <Input
          placeholder="Digitar código manualmente"
          value={manualCode}
          onChange={e => setManualCode(e.target.value)}
          inputMode="numeric"
        />
        <Button type="submit" variant="outline" disabled={!manualCode.trim()}>
          OK
        </Button>
      </form>
    </div>
  )
}
