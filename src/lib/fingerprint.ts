/**
 * Device Fingerprint Generator (client-side)
 * Combines canvas fingerprint + localStorage token for device identification
 */

const STORAGE_KEY = 'riiqi_device_id';

function generateCanvasFingerprint(): string {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';
    
    canvas.width = 200;
    canvas.height = 50;
    
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText('RiiqiLucky🎰', 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('RiiqiLucky🎰', 4, 17);
    
    const dataUrl = canvas.toDataURL();
    let hash = 0;
    for (let i = 0; i < dataUrl.length; i++) {
      const char = dataUrl.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return Math.abs(hash).toString(36);
  } catch {
    return '';
  }
}

function generateRandomId(): string {
  return 'rl_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 10);
}

/**
 * Get or create a persistent device ID
 */
export function getDeviceId(): string {
  // Try localStorage first
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return stored;
    
    // Generate new ID combining canvas fingerprint + random
    const canvasFp = generateCanvasFingerprint();
    const deviceId = canvasFp ? `${canvasFp}_${generateRandomId()}` : generateRandomId();
    
    localStorage.setItem(STORAGE_KEY, deviceId);
    return deviceId;
  }
  
  return generateRandomId();
}
