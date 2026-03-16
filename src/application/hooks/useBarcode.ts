import { useRef, useCallback } from 'react'
import { BrowserMultiFormatReader } from '@zxing/browser'

export function useBarcode(onResult: (barcode: string) => void) {
  const readerRef = useRef<BrowserMultiFormatReader | null>(null)
  const controlsRef = useRef<{ stop: () => void } | null>(null)

  const startScan = useCallback(async (videoElement: HTMLVideoElement) => {
    stopScan()
    const reader = new BrowserMultiFormatReader()
    readerRef.current = reader

    try {
      const controls = await reader.decodeFromVideoDevice(
        undefined,
        videoElement,
        (result) => {
          if (result) {
            onResult(result.getText())
            stopScan()
          }
        },
      )
      controlsRef.current = controls
    } catch (err) {
      console.error('Erro ao iniciar scanner:', err)
    }
  }, [onResult])

  const stopScan = useCallback(() => {
    controlsRef.current?.stop()
    controlsRef.current = null
    readerRef.current = null
  }, [])

  return { startScan, stopScan }
}
