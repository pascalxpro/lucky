'use client';

import { useState, useEffect, useCallback } from 'react';
import { getCampaigns, getBanners, createBanner, updateBanner, deleteBanner, reorderBanners } from '@/lib/actions';
import { Plus, Trash2, Edit2, Save, X, Eye, Image as ImageIcon, GripVertical } from 'lucide-react';
import { IMAGE_DIMENSIONS } from '@/lib/themes';
import ImageUploader from '@/components/ImageUploader';
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, TouchSensor, useSensor, useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy, useSortable, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

type Banner = Awaited<ReturnType<typeof getBanners>>[0];

/* ── Multi-Banner Preview: simulates the carousel as it appears on front-page ── */
function BannerCarouselPreview({ banners, currentImage }: { banners: Banner[]; currentImage?: string }) {
  const [idx, setIdx] = useState(0);

  // Combine existing banners + new image being added
  const allImages = [
    ...banners.map(b => ({ url: b.imageUrl, link: b.linkUrl })),
    ...(currentImage ? [{ url: currentImage, link: null }] : []),
  ].filter(img => img.url);

  const safeIdx = allImages.length > 0 ? idx % allImages.length : 0;

  // Auto advance
  useEffect(() => {
    if (allImages.length <= 1) return;
    const timer = setInterval(() => setIdx(i => (i + 1) % allImages.length), 3000);
    return () => clearInterval(timer);
  }, [allImages.length]);

  if (allImages.length === 0) {
    return (
      <div className="preview-panel">
        <div className="preview-panel-header"><Eye size={14} /> 即時預覽 — 輪播 Banner</div>
        <div className="preview-viewport">
          <div style={{
            width: '100%', aspectRatio: '21/9', borderRadius: 'var(--radius-sm)',
            overflow: 'hidden', background: 'var(--gradient-card)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '0.3rem',
          }}>
            <ImageIcon size={32} style={{ color: 'var(--text-muted)' }} />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>上傳圖片即可預覽</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="preview-panel">
      <div className="preview-panel-header"><Eye size={14} /> 即時預覽 — 輪播 Banner</div>
      <div className="preview-viewport" style={{ position: 'relative' }}>
        <div style={{
          width: '100%', aspectRatio: '21/9', borderRadius: 'var(--radius-sm)',
          overflow: 'hidden', position: 'relative',
        }}>
          {allImages.map((img, i) => (
            <img key={i} src={img.url} alt={`Banner ${i + 1}`}
              style={{
                position: i === 0 ? 'relative' : 'absolute',
                top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover',
                opacity: i === safeIdx ? 1 : 0, transition: 'opacity 0.5s ease',
              }}
              onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0'; }}
            />
          ))}
          {/* Counter badge */}
          {allImages.length > 1 && (
            <div style={{
              position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.5)',
              color: '#fff', fontSize: '0.65rem', padding: '2px 8px', borderRadius: 10,
              fontFamily: 'var(--font-en)', backdropFilter: 'blur(4px)',
            }}>
              {safeIdx + 1}/{allImages.length}
            </div>
          )}
        </div>
        {allImages[safeIdx]?.link && (
          <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--info)', textAlign: 'center', wordBreak: 'break-all' }}>
            🔗 點擊跳轉：{allImages[safeIdx].link}
          </div>
        )}
        {/* Dots */}
        {allImages.length > 1 && (
          <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center', marginTop: '0.75rem' }}>
            {allImages.map((_, i) => (
              <button key={i} onClick={() => setIdx(i)}
                style={{
                  width: i === safeIdx ? 24 : 6, height: 6, borderRadius: 3, border: 'none', cursor: 'pointer',
                  background: i === safeIdx ? 'var(--primary)' : 'var(--glass-border)',
                  transition: 'all 0.3s ease',
                }} />
            ))}
          </div>
        )}
      </div>
      <div className="preview-scale-notice">
        ↑ 前台輪播效果 · 共 {allImages.length} 張 Banner · 每 5 秒自動切換
      </div>
    </div>
  );
}

export default function BannersPage() {
  const [campaignId, setCampaignId] = useState('');
  const [banners, setBanners] = useState<Banner[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ imageUrl: '', linkUrl: '' });
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ imageUrl: '', linkUrl: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const campaigns = await getCampaigns();
      const active = campaigns.find(c => c.isActive);
      if (active) { setCampaignId(active.id); setBanners(await getBanners(active.id)); }
      setLoading(false);
    })();
  }, []);

  const load = async () => { if (campaignId) setBanners(await getBanners(campaignId)); };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.imageUrl) return;
    setSaving(true);
    await createBanner({ campaignId, imageUrl: form.imageUrl, linkUrl: form.linkUrl || undefined });
    setForm({ imageUrl: '', linkUrl: '' });
    setShowForm(false);
    await load();
    setSaving(false);
  };

  // Quick add — add image directly to banners without the link field
  const handleQuickAdd = async (url: string) => {
    if (!url) return;
    setSaving(true);
    await createBanner({ campaignId, imageUrl: url });
    await load();
    setSaving(false);
  };

  const handleEdit = (b: Banner) => {
    setEditId(b.id);
    setEditForm({ imageUrl: b.imageUrl, linkUrl: b.linkUrl || '' });
    setShowForm(false);
  };

  const handleSaveEdit = async () => {
    if (!editId) return;
    setSaving(true);
    await updateBanner(editId, { imageUrl: editForm.imageUrl, linkUrl: editForm.linkUrl || undefined });
    setEditId(null);
    await load();
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('確定刪除此 Banner？')) return;
    await deleteBanner(id);
    load();
  };

  const handleReorder = async (orderedIds: string[]) => {
    // Optimistic UI update
    const reordered = orderedIds.map(id => banners.find(b => b.id === id)!).filter(Boolean);
    setBanners(reordered);
    // Persist to database
    await reorderBanners(orderedIds);
  };

  if (loading) return <p>載入中...</p>;

  return (
    <div>
      <div className="admin-header">
        <h1>🖼️ Banner 管理</h1>
        <button className="btn btn-primary btn-sm" onClick={() => { setShowForm(!showForm); setEditId(null); }}>
          <Plus size={16} /> 新增 Banner
        </button>
      </div>

      {/* ── Create Form with Preview ── */}
      {showForm && (
        <div className="edit-with-preview" style={{ marginBottom: '1.5rem' }}>
          <div className="admin-panel edit-form-side">
            <div className="admin-panel-title">✨ 新增 Banner</div>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <ImageUploader
                value={form.imageUrl}
                onChange={url => setForm(f => ({ ...f, imageUrl: url }))}
                label="Banner 圖片"
                hint={`建議尺寸：${IMAGE_DIMENSIONS.banner.label}，比例 ${IMAGE_DIMENSIONS.banner.ratio}`}
                maxWidth={1200}
                maxHeight={514}
              />
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>點擊跳轉連結（選填）</label>
                <input placeholder="https://example.com" value={form.linkUrl} onChange={e => setForm(f => ({ ...f, linkUrl: e.target.value }))} />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="submit" className="btn btn-primary btn-sm" disabled={saving || !form.imageUrl}>{saving ? '建立中...' : '建立'}</button>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setShowForm(false)}>取消</button>
              </div>
            </form>
          </div>
          <BannerCarouselPreview banners={banners} currentImage={form.imageUrl} />
        </div>
      )}

      {/* ── Edit Form with Preview ── */}
      {editId && (
        <div className="edit-with-preview" style={{ marginBottom: '1.5rem' }}>
          <div className="admin-panel edit-form-side" style={{ borderColor: 'var(--primary)', borderWidth: 2 }}>
            <div className="admin-panel-title"><Edit2 size={14} style={{ display: 'inline', marginRight: 6 }} />編輯 Banner</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <ImageUploader
                value={editForm.imageUrl}
                onChange={url => setEditForm(f => ({ ...f, imageUrl: url }))}
                label="Banner 圖片"
                hint={`建議尺寸：${IMAGE_DIMENSIONS.banner.label}，比例 ${IMAGE_DIMENSIONS.banner.ratio}`}
                maxWidth={1200}
                maxHeight={514}
              />
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>跳轉連結</label>
                <input value={editForm.linkUrl} onChange={e => setEditForm(f => ({ ...f, linkUrl: e.target.value }))} placeholder="選填" />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-primary btn-sm" onClick={handleSaveEdit} disabled={saving}>
                  <Save size={14} /> {saving ? '儲存中...' : '儲存'}
                </button>
                <button className="btn btn-outline btn-sm" onClick={() => setEditId(null)}>
                  <X size={14} /> 取消
                </button>
              </div>
            </div>
          </div>
          <BannerCarouselPreview banners={banners.filter(b => b.id !== editId)} currentImage={editForm.imageUrl} />
        </div>
      )}

      {/* ── Quick Add: batch upload area ── */}
      {!showForm && !editId && (
        <div className="admin-panel" style={{ marginBottom: '1.5rem' }}>
          <div className="admin-panel-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            📤 快速上傳 Banner（支援多張，上傳前自動壓縮）
          </div>
          <ImageUploader
            value=""
            onChange={url => handleQuickAdd(url)}
            hint={`建議尺寸：${IMAGE_DIMENSIONS.banner.label}，比例 ${IMAGE_DIMENSIONS.banner.ratio}（上傳後自動建立 Banner）`}
            maxWidth={1200}
            maxHeight={514}
          />
        </div>
      )}

      {/* ── Banner list with carousel preview ── */}
      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
        {/* Left: carousel preview */}
        {banners.length > 0 && (
          <div style={{ flex: '1 1 400px', maxWidth: 600 }}>
            <BannerCarouselPreview banners={banners} />
          </div>
        )}

        {/* Right: sortable banner list */}
        <div style={{ flex: '1 1 400px' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            共 <strong className="font-en">{banners.length}</strong> 張 Banner
            {banners.length > 1 && (
              <span style={{ fontSize: '0.75rem', color: 'var(--info)' }}>⇅ 拖曳排序</span>
            )}
          </div>
          <SortableBannerList
            banners={banners}
            editId={editId}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onReorder={handleReorder}
          />
          {banners.length === 0 && <p style={{ color: 'var(--text-muted)' }}>尚無 Banner，上方可快速上傳</p>}
        </div>
      </div>
    </div>
  );
}

/* ── Sortable Banner List Component ── */
function SortableBannerList({ banners, editId, onEdit, onDelete, onReorder }: {
  banners: Banner[]; editId: string | null;
  onEdit: (b: Banner) => void; onDelete: (id: string) => void;
  onReorder: (ids: string[]) => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
    useSensor(KeyboardSensor),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = banners.findIndex(b => b.id === active.id);
    const newIdx = banners.findIndex(b => b.id === over.id);
    const reordered = arrayMove(banners, oldIdx, newIdx);
    onReorder(reordered.map(b => b.id));
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={banners.map(b => b.id)} strategy={verticalListSortingStrategy}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {banners.map((b, i) => (
            <SortableBannerItem key={b.id} banner={b} index={i} isEditing={editId === b.id}
              onEdit={() => onEdit(b)} onDelete={() => onDelete(b.id)} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

/* ── Single Sortable Banner Item ── */
function SortableBannerItem({ banner, index, isEditing, onEdit, onDelete }: {
  banner: Banner; index: number; isEditing: boolean;
  onEdit: () => void; onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: banner.id });

  return (
    <div ref={setNodeRef}
      className="admin-panel"
      style={{
        display: 'flex', gap: '0.75rem', alignItems: 'center', padding: '0.6rem 0.75rem',
        borderColor: isEditing ? 'var(--primary)' : undefined,
        borderWidth: isEditing ? 2 : undefined,
        transform: CSS.Translate.toString(transform), transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 10 : undefined,
        cursor: 'default',
      }}>
      {/* Drag handle */}
      <div {...attributes} {...listeners}
        style={{
          cursor: 'grab', display: 'flex', alignItems: 'center',
          color: 'var(--text-muted)', padding: '0.25rem',
          touchAction: 'none',
        }}
        title="拖曳排序">
        <GripVertical size={18} />
      </div>

      {/* Thumbnail */}
      <div style={{
        width: 100, height: 44, borderRadius: 'var(--radius-sm)', overflow: 'hidden',
        background: 'var(--gradient-card)', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {banner.imageUrl ? (
          <img src={banner.imageUrl} alt={`Banner ${index + 1}`}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        ) : (
          <ImageIcon size={18} style={{ color: 'var(--text-muted)' }} />
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.15rem' }}>
          <span className="badge badge-primary font-en" style={{ fontSize: '0.6rem' }}>#{index + 1}</span>
          {banner.linkUrl && (
            <span style={{ fontSize: '0.65rem', color: 'var(--info)' }}>🔗 有連結</span>
          )}
        </div>
        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {banner.imageUrl}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '0.3rem', flexShrink: 0 }}>
        <button className="btn btn-outline btn-sm" onClick={onEdit} title="編輯">
          <Edit2 size={14} />
        </button>
        <button className="btn btn-outline btn-sm" style={{ color: 'var(--danger)' }}
          onClick={onDelete} title="刪除">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}
