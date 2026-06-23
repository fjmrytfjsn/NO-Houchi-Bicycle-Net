import { RefObject, useEffect, useRef } from 'react';
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
  const onDetectedRef = useRef(onDetected);

  useEffect(() => {
    onDetectedRef.current = onDetected;
  }, [onDetected]);

  useEffect(() => {
    if (!active) return;

    let isRunning = true;
    let animationFrameId: number;
    let timeoutId: ReturnType<typeof setTimeout>;

    const scanLoop = () => {
      if (!isRunning) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      if (!video || !canvas) {
        animationFrameId = requestAnimationFrame(scanLoop);
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        animationFrameId = requestAnimationFrame(scanLoop);
        return;
      }

      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const qrCode = jsQR(imageData.data, imageData.width, imageData.height);

        if (qrCode) {
          onDetectedRef.current(qrCode.data);
          // 0.5秒待機してからスキャンを再開
          timeoutId = setTimeout(() => {
            if (isRunning) {
              animationFrameId = requestAnimationFrame(scanLoop);
            }
          }, 500);
          return;
        }
      }

      animationFrameId = requestAnimationFrame(scanLoop);
    };

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          if (isRunning) {
            scanLoop();
          }
        }
      } catch {
        onCameraError();
      }
    };

    startCamera();

    return () => {
      isRunning = false;
      cancelAnimationFrame(animationFrameId);
      clearTimeout(timeoutId);

      const stream = videoRef.current?.srcObject as MediaStream | null;
      if (stream?.getTracks) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [active, canvasRef, onCameraError, videoRef]);
}
