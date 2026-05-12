'use client';

import { useState, useRef } from 'react';
import { Upload, X, CheckCircle, Loader, Image as ImageIcon, Trash2, Minimize2 } from 'lucide-react';
import { uploadImage, isValidImageType, formatFileSize, type CompressOptions } from '@/lib/image-compress';

interface ImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  hint?: string;
  maxWidth?: number;
  maxHeight?: number;
}

export default function ImageUploader({
  value, onChange, label, hint,
  maxWidth = 1200, maxHeight = 1200,
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [result, setResult] = useState<{
    originalSize: number; compressedSize: number; ratio: string;
  } | null>(null);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!isValidImageType(file)) {
      setError('不支援的圖片格式。支援：JPG、PNG、WebP、GIF、BMP、TIFF');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setError('原始檔案過大（最大 20MB）');
      return;
    }

    setError('');
    setUploading(true);
    setResult(null);

    try {
      const options: CompressOptions = { maxWidth, maxHeight, quality: 0.8, outputType: 'image/jpeg' };
      const res = await uploadImage(file, options);
      onChange(res.url);
      setResult({
        originalSize: res.originalSize,
        compressedSize: res.compressedSize,
        ratio: res.ratio,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : '上傳失敗');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  const handleClear = () => {
    onChange('');
    setResult(null);
    setError('');
  };

  return (
    <div>
      {label && <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>{label}</label>}

      {/* URL Input + Upload Button */}
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
        <input
          value={value}
          onChange={e => { onChange(e.target.value); setResult(null); }}
          placeholder="輸入圖片網址 或 上傳圖片..."
          style={{ flex: 1 }}
        />
        <button
          type="button"
          className="btn btn-outline btn-sm"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          style={{ whiteSpace: 'nowrap', minWidth: 80 }}
        >
          {uploading ? <Loader size={14} className="spin" /> : <Upload size={14} />}
          {uploading ? '壓縮中...' : '上傳'}
        </button>
        {value && (
          <button type="button" className="btn btn-outline btn-sm" onClick={handleClear} style={{ color: 'var(--danger)' }}>
            <Trash2 size={14} />
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/bmp,image/tiff"
        style={{ display: 'none' }}
        onChange={handleInputChange}
      />

      {hint && <div className="img-hint" style={{ marginBottom: '0.5rem' }}><ImageIcon size={13} /> {hint}</div>}

      {/* Drop Zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        style={{
          border: `2px dashed ${dragOver ? 'var(--primary)' : error ? 'var(--danger)' : 'var(--admin-border)'}`,
          borderRadius: 'var(--radius-sm)',
          padding: value ? 0 : '1.5rem',
          textAlign: 'center',
          transition: 'var(--transition)',
          background: dragOver ? 'rgba(124,58,237,0.08)' : 'transparent',
          cursor: 'pointer',
          overflow: 'hidden',
          position: 'relative',
        }}
        onClick={() => !value && inputRef.current?.click()}
      >
        {value ? (
          <div style={{ position: 'relative' }}>
            <img
              src={value}
              alt="Preview"
              style={{ width: '100%', maxHeight: 200, objectFit: 'contain', display: 'block' }}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        ) : (
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            <Upload size={24} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
            <div>拖曳圖片到此處，或點擊上傳</div>
            <div style={{ fontSize: '0.75rem', marginTop: '0.25rem', opacity: 0.7 }}>
              支援 JPG、PNG、WebP、GIF（系統會自動壓縮）
            </div>
          </div>
        )}
      </div>

      {/* Compression Result */}
      {result && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem',
          fontSize: '0.78rem', color: 'var(--success)',
          background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)',
          borderRadius: 'var(--radius-full)', padding: '0.3rem 0.85rem',
        }}>
          <Minimize2 size={12} />
          <span>減肥成功！</span>
          <span className="font-en">{formatFileSize(result.originalSize)}</span>
          <span>→</span>
          <span className="font-en" style={{ fontWeight: 700 }}>{formatFileSize(result.compressedSize)}</span>
          <span style={{ color: 'var(--accent)' }}>({result.ratio})</span>
          <CheckCircle size={12} />
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.5rem',
          fontSize: '0.78rem', color: 'var(--danger)',
          background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: 'var(--radius-full)', padding: '0.3rem 0.85rem',
        }}>
          <X size={12} /> {error}
        </div>
      )}
    </div>
  );
}
