import { useRef, useCallback, useEffect } from 'react'
import { BrowserMultiFormatReader } from '@zxing/browser'
import { DecodeHintType, BarcodeFormat } from '@zxing/library'

const SCAN_FORMATS = [
  BarcodeFormat.EAN_13,
  BarcodeFormat.EAN_8,
  BarcodeFormat.UPC_A,
  BarcodeFormat.UPC_E,
  BarcodeFormat.CODE_128,
  BarcodeFormat.CODE_39,
  BarcodeFormat.ITF,
]

const hints = new Map()
hints.set(DecodeHintType.POSSIBLE_FORMATS, SCAN_FORMATS)
hints.set(DecodeHintType.TRY_HARDER, true)

export type ScannerState = 'idle' | 'starting' | 'scanning' | 'error'
export type ScannerError = 'permission_denied' | 'no_camera' | 'unknown'

interface UseBarcodeOptions {
  onResult: (barcode: string) => void
  onError?: (error: ScannerError) => void
  onStateChange?: (state: ScannerState) => void
  debounceMs?: number
}

export function useBarcode({ onResult, onError, onStateChange, debounceMs = 1500 }: UseBarcodeOptions) {
  const controlsRef = useRef<{ stop: () => void } | null>(null)
  const lastResultRef = useRef<string>('')
  const lastResultTimeRef = useRef<number>(0)

  // Stable refs for callbacks to avoid re-creating startScan
  const onResultRef = useRef(onResult)
  onResultRef.current = onResult
  const onErrorRef = useRef(onError)
  onErrorRef.current = onError
  const onStateChangeRef = useRef(onStateChange)
  onStateChangeRef.current = onStateChange

  const stopScan = useCallback(() => {
    if (controlsRef.current) {
      controlsRef.current.stop()
      controlsRef.current = null
    }
    onStateChangeRef.current?.('idle')
  }, [])

  const startScan = useCallback(async (videoElement: HTMLVideoElement) => {
    // Clean up any existing scan
    stopScan()
    onStateChangeRef.current?.('starting')

    const reader = new BrowserMultiFormatReader(hints, { delayBetweenScanAttempts: 800, delayBetweenScanSuccess: 1500 })

    try {
      // Enumerate devices to pick rear camera
      const devices = await BrowserMultiFormatReader.listVideoInputDevices()
      if (devices.length === 0) {
        onErrorRef.current?.('no_camera')
        onStateChangeRef.current?.('error')
        return
      }

      // Prefer environment-facing camera
      const rearCamera = devices.find(d =>
        d.label.toLowerCase().includes('back') ||
        d.label.toLowerCase().includes('rear') ||
        d.label.toLowerCase().includes('traseira') ||
        d.label.toLowerCase().includes('environment'),
      )
      const deviceId = rearCamera?.deviceId ?? devices[0].deviceId

      onStateChangeRef.current?.('scanning')

      const controls = await reader.decodeFromVideoDevice(
        deviceId,
        videoElement,
        (result, error) => {
          if (result) {
            const text = result.getText()
            const now = Date.now()

            // Debounce: ignore same barcode within debounceMs
            if (text === lastResultRef.current && now - lastResultTimeRef.current < debounceMs) {
              return
            }

            lastResultRef.current = text
            lastResultTimeRef.current = now
            onResultRef.current(text)
          }
          // NotFoundException is normal (no barcode in frame) — ignore silently
          // Only surface actual errors
          if (error && error.name !== 'NotFoundException') {
            // ChecksumException and FormatException are retry-able — ignore
            if (error.name !== 'ChecksumException' && error.name !== 'FormatException') {
              onErrorRef.current?.('unknown')
            }
          }
        },
      )

      controlsRef.current = controls
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      if (message.includes('Permission') || message.includes('NotAllowed')) {
        onErrorRef.current?.('permission_denied')
      } else if (message.includes('NotFound') || message.includes('DevicesNotFound')) {
        onErrorRef.current?.('no_camera')
      } else {
        onErrorRef.current?.('unknown')
      }
      onStateChangeRef.current?.('error')
    }
  }, [stopScan, debounceMs])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (controlsRef.current) {
        controlsRef.current.stop()
        controlsRef.current = null
      }
    }
  }, [])

  return { startScan, stopScan }
}
