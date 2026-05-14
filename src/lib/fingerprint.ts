/**
 * Enhanced Device Fingerprint Generator (client-side)
 * 
 * 防灌票策略：
 * 1. 基於硬體/瀏覽器特徵生成「確定性指紋」（不含隨機數）
 *    → 無痕模式、清除 localStorage 後仍產生相同指紋
 * 2. localStorage 持久化加速（避免每次重算）
 * 3. 伺服器端另有 IP 限制作為第二層防護
 */

const STORAGE_KEY = 'riiqi_device_id';

/**
 * Canvas fingerprint — 基於 GPU 渲染差異
 */
function getCanvasFingerprint(): string {
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

    return canvas.toDataURL();
  } catch {
    return '';
  }
}

/**
 * WebGL fingerprint — 基於 GPU 型號
 */
function getWebGLFingerprint(): string {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return '';
    const webgl = gl as WebGLRenderingContext;

    const debugInfo = webgl.getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) {
      const vendor = webgl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || '';
      const renderer = webgl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || '';
      return `${vendor}~${renderer}`;
    }
    return '';
  } catch {
    return '';
  }
}

/**
 * 收集確定性的設備特徵（同設備+同瀏覽器 = 相同值）
 */
function collectDeviceTraits(): string {
  const traits: string[] = [];

  // 螢幕特徵
  traits.push(`s:${screen.width}x${screen.height}`);
  traits.push(`cd:${screen.colorDepth}`);
  traits.push(`pd:${window.devicePixelRatio || 1}`);

  // 時區 + 語言
  traits.push(`tz:${Intl.DateTimeFormat().resolvedOptions().timeZone || new Date().getTimezoneOffset()}`);
  traits.push(`lang:${navigator.language}`);

  // 硬體
  traits.push(`cpu:${navigator.hardwareConcurrency || 0}`);
  traits.push(`mem:${(navigator as unknown as Record<string, unknown>).deviceMemory || 0}`);
  traits.push(`plat:${navigator.platform}`);
  traits.push(`touch:${navigator.maxTouchPoints || 0}`);

  // Canvas 指紋
  const canvasFp = getCanvasFingerprint();
  traits.push(`c:${canvasFp.length > 0 ? canvasFp.substring(canvasFp.length - 64) : 'none'}`);

  // WebGL 指紋
  traits.push(`gl:${getWebGLFingerprint()}`);

  return traits.join('|');
}

/**
 * 將字串雜湊為固定格式 ID
 */
function hashString(str: string): string {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);

  const hash = (4294967296 * (2097151 & h2) + (h1 >>> 0));
  return 'fp_' + hash.toString(36);
}

/**
 * 取得設備 ID（確定性指紋）
 * 
 * - 同設備 + 同瀏覽器 → 永遠相同（即使無痕模式、清除快取）
 * - 不同瀏覽器 → 可能不同（由伺服器端 IP 限制補強）
 */
export function getDeviceId(): string {
  if (typeof window === 'undefined') {
    return 'ssr_' + Date.now().toString(36);
  }

  // 1. 先嘗試 localStorage（快速路徑）
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) return stored;

  // 2. 生成確定性指紋
  const traits = collectDeviceTraits();
  const deviceId = hashString(traits);

  // 3. 存入 localStorage 加速下次讀取
  try {
    localStorage.setItem(STORAGE_KEY, deviceId);
  } catch {
    // 無痕模式可能限制 storage，忽略
  }

  return deviceId;
}
