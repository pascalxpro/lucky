'use client';

import { useState, useEffect } from 'react';
import { getCampaigns, getProjects, createProject, updateProject, deleteProject, reorderProjects } from '@/lib/actions';
import { Plus, Trash2, GripVertical, Edit2, Save, X, Eye, Image as ImageIcon } from 'lucide-react';
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

type Project = Awaited<ReturnType<typeof getProjects>>[0];

/** Parse images JSON string to array */
function parseImages(images: string | null | undefined): string[] {
  if (!images) return [];
  try { return JSON.parse(images); } catch { return []; }
}

/* ── Preview: simulates a project card with per-image carousel ── */
function ProjectPreview({ name, description, images }: { name: string; description: string; images: string[] }) {
  const [idx, setIdx] = useState(0);
  const safeIdx = images.length > 0 ? idx % images.length : 0;

  return (
    <div className="preview-panel">
      <div className="preview-panel-header"><Eye size={14} /> 即時預覽 — 投票作品卡片</div>
      <div className="preview-viewport">
        <div style={{
          background: 'var(--bg-card)', backdropFilter: 'blur(16px)',
          border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)',
          overflow: 'hidden',
        }}>
          {/* Card Image Area — mini carousel */}
          <div style={{
            width: '100%', aspectRatio: '4/3', background: 'var(--gradient-card)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden', position: 'relative',
          }}>
            {images.length > 0 ? (
              <>
                <img src={images[safeIdx]} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                {images.length > 1 && (
                  <div style={{ position: 'absolute', bottom: 6, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 4 }}>
                    {images.map((_, i) => (
                      <button key={i} onClick={() => setIdx(i)}
                        style={{
                          width: i === safeIdx ? 16 : 6, height: 6, borderRadius: 3, border: 'none', cursor: 'pointer',
                          background: i === safeIdx ? 'var(--primary)' : 'rgba(255,255,255,0.6)',
                          transition: 'var(--transition)',
                        }} />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <span style={{ fontSize: '3rem' }}>🎨</span>
            )}
          </div>
          <div style={{ padding: '1rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.4rem' }}>
              {name || '作品名稱'}
            </h3>
            <p style={{
              fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5,
              marginBottom: '0.75rem', display: '-webkit-box', WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical', overflow: 'hidden',
            }}>
              {description || '作品描述文字預覽'}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <span className="vote-count" style={{ fontSize: '1.2rem' }}>0</span>
                <span className="vote-label">票</span>
              </div>
              <button className="btn btn-sm btn-gold" style={{ pointerEvents: 'none' }}>🗳️ 投票</button>
            </div>
          </div>
        </div>
      </div>
      {images.length > 0 && (
        <div className="preview-scale-notice">
          共 {images.length} 張圖片 · 前台可左右滑動切換
        </div>
      )}
    </div>
  );
}

/* ── Multi-image manager component ── */
function MultiImageManager({ images, onChange }: { images: string[]; onChange: (imgs: string[]) => void }) {
  const handleAdd = (url: string) => {
    if (url && !images.includes(url)) {
      onChange([...images, url]);
    }
  };

  const handleRemove = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newArr = [...images];
    [newArr[index - 1], newArr[index]] = [newArr[index], newArr[index - 1]];
    onChange(newArr);
  };

  return (
    <div>
      <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        <ImageIcon size={13} /> 作品圖片（可上傳多張，前台會輪播展示）
      </label>

      {/* Existing images thumbnails */}
      {images.length > 0 && (
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem', marginTop: '0.5rem' }}>
          {images.map((url, i) => (
            <div key={i} style={{
              position: 'relative', width: 80, height: 60, borderRadius: 'var(--radius-sm)',
              overflow: 'hidden', border: '1px solid var(--glass-border)',
            }}>
              <img src={url} alt={`圖片 ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => { (e.target as HTMLImageElement).src = ''; }} />
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: '0.2rem', opacity: 0, transition: 'var(--transition)',
              }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.opacity = '1'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.opacity = '0'; }}>
                {i > 0 && (
                  <button type="button" onClick={() => handleMoveUp(i)}
                    style={{ background: 'rgba(255,255,255,0.3)', border: 'none', borderRadius: 4, color: '#fff', cursor: 'pointer', padding: '2px 4px', fontSize: '0.7rem' }}>
                    ◀
                  </button>
                )}
                <button type="button" onClick={() => handleRemove(i)}
                  style={{ background: 'rgba(239,68,68,0.8)', border: 'none', borderRadius: 4, color: '#fff', cursor: 'pointer', padding: '2px 4px', fontSize: '0.7rem' }}>
                  ✕
                </button>
              </div>
              <div style={{
                position: 'absolute', top: 2, left: 2, background: 'rgba(0,0,0,0.6)', color: '#fff',
                fontSize: '0.6rem', padding: '1px 4px', borderRadius: 3, fontFamily: 'var(--font-en)',
              }}>{i + 1}</div>
            </div>
          ))}
        </div>
      )}

      {/* Upload new image */}
      <ImageUploader
        value=""
        onChange={(url) => handleAdd(url)}
        hint={`建議尺寸：${IMAGE_DIMENSIONS.project.label}（可上傳多張）`}
        maxWidth={800}
        maxHeight={600}
      />
    </div>
  );
}

export default function ProjectsPage() {
  const [campaignId, setCampaignId] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', images: [] as string[] });
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', description: '', images: [] as string[] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const campaigns = await getCampaigns();
      const active = campaigns.find(c => c.isActive);
      if (active) { setCampaignId(active.id); setProjects(await getProjects(active.id)); }
      setLoading(false);
    })();
  }, []);

  const load = async () => { if (campaignId) setProjects(await getProjects(campaignId)); };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await createProject({
      campaignId,
      name: form.name,
      description: form.description || undefined,
      imageUrl: form.images[0] || undefined,
      images: form.images.length > 0 ? JSON.stringify(form.images) : undefined,
    });
    setForm({ name: '', description: '', images: [] });
    setShowForm(false);
    await load();
    setSaving(false);
  };

  const handleEdit = (p: Project) => {
    setEditId(p.id);
    const imgs = parseImages(p.images);
    // fallback: if images is empty but imageUrl exists, use it
    const finalImgs = imgs.length > 0 ? imgs : (p.imageUrl ? [p.imageUrl] : []);
    setEditForm({ name: p.name, description: p.description || '', images: finalImgs });
    setShowForm(false);
  };

  const handleSaveEdit = async () => {
    if (!editId) return;
    setSaving(true);
    await updateProject(editId, {
      name: editForm.name,
      description: editForm.description,
      imageUrl: editForm.images[0] || undefined,
      images: editForm.images.length > 0 ? JSON.stringify(editForm.images) : undefined,
    });
    setEditId(null);
    await load();
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('確定刪除此作品？相關投票也會一併刪除。')) return;
    await deleteProject(id);
    load();
  };

  const handleReorder = async (orderedIds: string[]) => {
    const reordered = orderedIds.map(id => projects.find(p => p.id === id)!).filter(Boolean);
    setProjects(reordered);
    await reorderProjects(orderedIds.map((id, i) => ({ id, sortOrder: i })));
  };

  if (loading) return <p>載入中...</p>;

  return (
    <div>
      <div className="admin-header">
        <h1>🎨 作品管理</h1>
        <button className="btn btn-primary btn-sm" onClick={() => { setShowForm(!showForm); setEditId(null); }}>
          <Plus size={16} /> 新增作品
        </button>
      </div>

      {/* ── Create Form with Preview ── */}
      {showForm && (
        <div className="edit-with-preview" style={{ marginBottom: '1.5rem' }}>
          <div className="admin-panel edit-form-side">
            <div className="admin-panel-title">✨ 新增作品</div>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>作品名稱</label>
                <input placeholder="例：星空幻境" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>作品描述（選填）</label>
                <input placeholder="例：夢幻般的星空藝術創作" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <MultiImageManager
                images={form.images}
                onChange={imgs => setForm(f => ({ ...f, images: imgs }))}
              />
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>{saving ? '建立中...' : '建立'}</button>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setShowForm(false)}>取消</button>
              </div>
            </form>
          </div>
          <ProjectPreview name={form.name} description={form.description} images={form.images} />
        </div>
      )}

      {/* ── Edit Form with Preview ── */}
      {editId && (
        <div className="edit-with-preview" style={{ marginBottom: '1.5rem' }}>
          <div className="admin-panel edit-form-side" style={{ borderColor: 'var(--primary)', borderWidth: 2 }}>
            <div className="admin-panel-title"><Edit2 size={14} style={{ display: 'inline', marginRight: 6 }} />編輯作品</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>作品名稱</label>
                <input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} required />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>作品描述</label>
                <input value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <MultiImageManager
                images={editForm.images}
                onChange={imgs => setEditForm(f => ({ ...f, images: imgs }))}
              />
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
          <ProjectPreview name={editForm.name} description={editForm.description} images={editForm.images} />
        </div>
      )}

      <SortableProjectTable
        projects={projects}
        editId={editId}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onReorder={handleReorder}
      />
    </div>
  );
}

/* ── Sortable Project Table ── */
function SortableProjectTable({ projects, editId, onEdit, onDelete, onReorder }: {
  projects: Project[]; editId: string | null;
  onEdit: (p: Project) => void; onDelete: (id: string) => void;
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
    const oldIdx = projects.findIndex(p => p.id === active.id);
    const newIdx = projects.findIndex(p => p.id === over.id);
    const reordered = arrayMove(projects, oldIdx, newIdx);
    onReorder(reordered.map(p => p.id));
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={projects.map(p => p.id)} strategy={verticalListSortingStrategy}>
        <table className="data-table">
          <thead>
            <tr><th>排序</th><th>作品名稱</th><th>描述</th><th>圖片</th><th>票數</th><th>操作</th></tr>
          </thead>
          <tbody>
            {projects.map((p) => (
              <SortableProjectRow key={p.id} project={p} isEditing={editId === p.id}
                onEdit={() => onEdit(p)} onDelete={() => onDelete(p.id)} />
            ))}
            {projects.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>尚無作品</td></tr>}
          </tbody>
        </table>
      </SortableContext>
    </DndContext>
  );
}

/* ── Single Sortable Row ── */
function SortableProjectRow({ project, isEditing, onEdit, onDelete }: {
  project: Project; isEditing: boolean;
  onEdit: () => void; onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: project.id });
  const imgCount = parseImages(project.images).length || (project.imageUrl ? 1 : 0);

  return (
    <tr ref={setNodeRef}
      style={{
        background: isEditing ? 'rgba(124,58,237,0.08)' : undefined,
        transform: CSS.Translate.toString(transform), transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 10 : undefined,
        position: 'relative',
      }}>
      <td>
        <div {...attributes} {...listeners}
          style={{ cursor: 'grab', display: 'flex', alignItems: 'center', touchAction: 'none' }}
          title="拖曳排序">
          <GripVertical size={16} style={{ color: 'var(--text-muted)' }} />
        </div>
      </td>
      <td><strong>{project.name}</strong></td>
      <td style={{ color: 'var(--text-secondary)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{project.description || '—'}</td>
      <td>
        {imgCount > 0 ? (
          <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>{imgCount} 張</span>
        ) : (
          <span className="badge badge-gold" style={{ fontSize: '0.7rem' }}>未設定</span>
        )}
      </td>
      <td className="font-en" style={{ fontWeight: 700 }}>{project._count.votes}</td>
      <td>
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <button className="btn btn-outline btn-sm" onClick={onEdit} title="編輯">
            <Edit2 size={14} />
          </button>
          <button className="btn btn-outline btn-sm" style={{ color: 'var(--danger)' }} onClick={onDelete} title="刪除">
            <Trash2 size={14} />
          </button>
        </div>
      </td>
    </tr>
  );
}
