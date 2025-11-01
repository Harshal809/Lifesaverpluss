import { useEffect, useCallback, useState } from 'react';

interface UseShakeDetectionOptions {
  threshold?: number; // Acceleration threshold in m/s² (default: 15)
  debounceTime?: number; // Time in ms between shake triggers (default: 2000)
  onShake: () => void;
  enabled?: boolean;
}

export const useShakeDetection = ({
  threshold = 15,
  debounceTime = 2000,
  onShake,
  enabled = true,
}: UseShakeDetectionOptions) => {
  const [permissionStatus, setPermissionStatus] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [isSupported, setIsSupported] = useState(false);
  const [lastShakeTime, setLastShakeTime] = useState(0);

  // Check if DeviceMotionEvent is supported
  useEffect(() => {
    if (typeof window !== 'undefined' && 'DeviceMotionEvent' in window) {
      setIsSupported(true);
    } else {
      setIsSupported(false);
      console.warn('DeviceMotionEvent is not supported in this browser');
    }
  }, []);

  // Request permission for motion sensors
  const requestPermission = useCallback(async () => {
    if (!isSupported) return false;

    try {
      // Check if Permission API is available
      if (navigator.permissions) {
        const result = await navigator.permissions.query({
          name: 'accelerometer' as PermissionName,
        } as PermissionDescriptor);
        setPermissionStatus(result.state === 'granted' ? 'granted' : result.state === 'denied' ? 'denied' : 'prompt');
        return result.state === 'granted';
      } else {
        // Fallback: Try to add event listener (some browsers show prompt automatically)
        setPermissionStatus('prompt');
        return true;
      }
    } catch (error) {
      console.warn('Permission API not available, trying fallback:', error);
      // Fallback: Some browsers require user interaction first
      setPermissionStatus('prompt');
      return true;
    }
  }, [isSupported]);

  // Shake detection handler
  useEffect(() => {
    if (!enabled || !isSupported || permissionStatus === 'denied') return;

    let lastAcceleration = { x: 0, y: 0, z: 0 };
    let requestFrameId: number | null = null;

    const handleMotion = (event: DeviceMotionEvent) => {
      const { acceleration } = event;
      
      if (!acceleration) return;

      const { x, y, z } = acceleration;
      
      // Calculate acceleration change
      const deltaX = Math.abs(x - lastAcceleration.x);
      const deltaY = Math.abs(y - lastAcceleration.y);
      const deltaZ = Math.abs(z - lastAcceleration.z);

      // Calculate total acceleration
      const totalAcceleration = Math.sqrt(deltaX ** 2 + deltaY ** 2 + deltaZ ** 2);

      // Check if threshold exceeded
      if (totalAcceleration > threshold) {
        const now = Date.now();
        // Debounce: Only trigger if enough time has passed since last shake
        if (now - lastShakeTime > debounceTime) {
          setLastShakeTime(now);
          onShake();
          
          // Optional: Vibrate device if supported
          if ('vibrate' in navigator) {
            navigator.vibrate([200, 100, 200]);
          }
        }
      }

      lastAcceleration = { x: x || 0, y: y || 0, z: z || 0 };
    };

    const startDetection = () => {
      if (typeof DeviceMotionEvent !== 'undefined') {
        if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
          // iOS 13+ requires explicit permission
          (DeviceMotionEvent as any)
            .requestPermission()
            .then((response: string) => {
              if (response === 'granted') {
                setPermissionStatus('granted');
                window.addEventListener('devicemotion', handleMotion);
              } else {
                setPermissionStatus('denied');
              }
            })
            .catch((error: Error) => {
              console.error('Error requesting motion permission:', error);
              setPermissionStatus('denied');
            });
        } else {
          // Android and other browsers
          window.addEventListener('devicemotion', handleMotion);
          setPermissionStatus('granted');
        }
      }
    };

    // Auto-request permission on mount if not already done
    if (permissionStatus === 'prompt') {
      requestPermission().then(() => {
        startDetection();
      });
    } else {
      startDetection();
    }

    return () => {
      window.removeEventListener('devicemotion', handleMotion);
      if (requestFrameId) {
        cancelAnimationFrame(requestFrameId);
      }
    };
  }, [enabled, isSupported, permissionStatus, threshold, debounceTime, onShake, lastShakeTime, requestPermission]);

  return {
    isSupported,
    permissionStatus,
    requestPermission,
  };
};


