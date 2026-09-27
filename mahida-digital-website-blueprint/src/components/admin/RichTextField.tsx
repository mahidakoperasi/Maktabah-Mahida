'use client';

import { useRef, useState } from 'react';
import { Bold, ImagePlus, Italic, Underline } from 'lucide-react';
import { driveIdFromUrl } from '@/lib/media-links';
import RichContent from '@/components/RichContent';

export default function RichTextField({ value, onChange, label = 'Isi tulisan' }: {
  value: string; onChange: (value: string) => void; label?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [preview, setPreview] = useState(false);
  const [error, setError] = useState('');

  function insert(before: string, after: string, placeholder: string, block = false) {
    const field = ref.current;
    if (!field) return;
    const start = field.selectionStart;
    const end = field.selectionEnd;
    const selected = block ? '' : value.slice(start, end) || placeholder;
    const prefix = block && start > 0 && !value.slice(0, start).endsWith('\n\n') ? '\n\n' : '';
    const suffix = block && !value.slice(end).startsWith('\n\n') ? '\n\n' : '';
    onChange(value.slice(0, start) + prefix + before + selected + after + suffix + value.slice(end));
    requestAnimationFrame(() => { field.focus(); field.setSelectionRange(start + prefix.length + before.length, start + prefix.length + before.length + selected.length); });
  }

  function addImage() {
    const url = window.prompt('Tempel tautan berkas foto Google Drive (akses: siapa saja dengan link)');
    if (url === null) return;
    if (!driveIdFromUrl(url.trim())) { setError('Gunakan tautan berkas Google Drive yang valid.'); return; }
    const caption = window.prompt('Keterangan foto (opsional)')?.replace(/[|\[\]]/g, '').trim().slice(0, 200);
    setError('');
    insert(`[[image:${url.trim()}${caption ? `|${caption}` : ''}]]`, '', '', true);
  }

  return <div className="min-w-0 space-y-2">
    <span className="text-sm font-medium">{label}</span>
    <div role="toolbar" aria-label="Format tulisan" className="flex flex-wrap gap-2 rounded border border-warm-gray-300 bg-warm-gray-50 p-2">
      <button type="button" title="Tebal" aria-label="Tebal" className="grid h-11 w-11 place-items-center rounded border bg-white" onClick={() => insert('**', '**', 'teks tebal')}><Bold size={18} /></button>
      <button type="button" title="Miring" aria-label="Miring" className="grid h-11 w-11 place-items-center rounded border bg-white" onClick={() => insert('*', '*', 'teks miring')}><Italic size={18} /></button>
      <button type="button" title="Garis bawah" aria-label="Garis bawah" className="grid h-11 w-11 place-items-center rounded border bg-white" onClick={() => insert('++', '++', 'teks bergaris bawah')}><Underline size={18} /></button>
      <button type="button" title="Sisipkan foto Drive" className="flex min-h-11 items-center gap-2 rounded border bg-white px-3 text-sm" onClick={addImage}><ImagePlus size={18} /> Sisipkan gambar</button>
      <button type="button" className="min-h-11 rounded border bg-white px-3 text-sm" onClick={() => setPreview(!preview)} aria-pressed={preview}>Pratinjau</button>
    </div>
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    <textarea ref={ref} required value={value} onChange={(event) => onChange(event.target.value)} aria-label={label} rows={18} className="w-full resize-y border border-warm-gray-300 p-4 text-base leading-8" dir="auto" />
    {preview && <div className="prose-article min-h-20 rounded border bg-white p-4" aria-label="Pratinjau tulisan"><RichContent content={value} /></div>}
    <p className="text-xs text-warm-gray-500">Pilih teks lalu gunakan toolbar. Sisipan gambar memakai tautan berkas Drive yang dapat dilihat publik.</p>
  </div>;
}
