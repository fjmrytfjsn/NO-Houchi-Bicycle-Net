import { RefObject, useCallback, useEffect } from 'react';
import jsQR from 'jsqr';

interface UseQrScannerParams {
  active: boolean;
  videoRef: RefObject<HTMLVideoElement>;
  canvasRef: RefObject<HTMLCanvasElement>;
  onDetected: (qrData: string) => void;
  onCameraError: () => void;
}

export function useQrScanner({
  active,
  videoRef,
  canvasRef,
  onDetected,
  onCameraError,
}: UseQrScannerParams) {
  const scanQR = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const scanLoop = () => {
      if (!active) return;

      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const qrCode = jsQR(imageData.data, imageData.width, imageData.height);

        if (qrCode) {
          onDetected(qrCode.data);
          return;
        }
      }

      requestAnimationFrame(scanLoop);
    };

    scanLoop();
  }, [active, canvasRef, onDetected, videoRef]);

  useEffect(() => {
    if (!active) return;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          scanQR();
        }
      } catch {
        onCameraError();
      }
    };

    startCamera();

    return () => {
      const stream = videoRef.current?.srcObject as MediaStream | null;
      if (stream?.getTracks) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [active, onCameraError, scanQR, videoRef]);
}
