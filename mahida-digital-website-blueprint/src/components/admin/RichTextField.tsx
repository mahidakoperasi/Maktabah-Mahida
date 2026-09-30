'use client';

import { useRef, useState } from 'react';
import {
  Bold,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Play,
  Underline,
} from 'lucide-react';
import { driveIdFromUrl, videoEmbedFromUrl } from '@/lib/media-links';
import { safeArticleLink } from '@/lib/rich-links';
import RichContent from '@/components/RichContent';

export default function RichTextField({
  value,
  onChange,
  label = 'Isi tulisan',
}: {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [preview, setPreview] = useState(false);
  const [error, setError] = useState('');

  function insert(
    before: string,
    after: string,
    placeholder: string,
    block = false,
  ) {
    const field = ref.current;
    if (!field) return;
    const start = field.selectionStart;
    const end = field.selectionEnd;
    const selected = block ? '' : value.slice(start, end) || placeholder;
    const prefix =
      block && start > 0 && !value.slice(0, start).endsWith('\n\n')
        ? '\n\n'
        : '';
    const suffix = block && !value.slice(end).startsWith('\n\n') ? '\n\n' : '';
    onChange(
      value.slice(0, start) +
        prefix +
        before +
        selected +
        after +
        suffix +
        value.slice(end),
    );
    requestAnimationFrame(() => {
      field.focus({ preventScroll: true });
      field.setSelectionRange(
        start + prefix.length + before.length,
        start + prefix.length + before.length + selected.length,
      );
    });
  }

  function addList(ordered: boolean) {
    const field = ref.current;
    if (!field) return;
    const start = value.lastIndexOf('\n', field.selectionStart - 1) + 1;
    const nextNewline = value.indexOf('\n', field.selectionEnd);
    const end = nextNewline === -1 ? value.length : nextNewline;
    const lines = (value.slice(start, end) || 'Poin daftar').split('\n');
    const listed = lines
      .map(
        (line, index) =>
          `${ordered ? `${index + 1}.` : '-'} ${line.replace(/^\s*(?:\d+\.|[-*])\s+/, '') || 'Poin daftar'}`,
      )
      .join('\n');
    const before = start > 0 && value[start - 1] !== '\n' ? '\n' : '';
    const after = end < value.length && value[end + 1] !== '\n' ? '\n' : '';
    onChange(
      value.slice(0, start) + before + listed + after + value.slice(end),
    );
    requestAnimationFrame(() => {
      field.focus({ preventScroll: true });
      field.setSelectionRange(
        start + before.length,
        start + before.length + listed.length,
      );
    });
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((event.ctrlKey || event.metaKey) && !event.altKey) {
      const wrap = { b: '**', i: '*', u: '++' }[
        event.key.toLowerCase() as 'b' | 'i' | 'u'
      ];
      if (wrap) {
        event.preventDefault();
        insert(wrap, wrap, 'teks');
      }
      return;
    }
    if (event.key !== 'Enter' || event.shiftKey) return;
    const field = ref.current;
    if (!field || field.selectionStart !== field.selectionEnd) return;
    const start = value.lastIndexOf('\n', field.selectionStart - 1) + 1;
    const line = value.slice(start, field.selectionStart);
    const numbered = /^(\d+)\.\s+(.+)$/.exec(line);
    const bulleted = /^-\s+(.+)$/.exec(line);
    if (numbered || bulleted) {
      event.preventDefault();
      insert(`\n${numbered ? `${Number(numbered[1]) + 1}.` : '-'} `, '', '');
    } else if (/^(?:\d+\.|-)\s*$/.test(line)) {
      event.preventDefault();
      onChange(value.slice(0, start) + value.slice(field.selectionStart));
      requestAnimationFrame(() => {
        field.focus({ preventScroll: true });
        field.setSelectionRange(start, start);
      });
    }
  }

  function addImage() {
    const url = window.prompt(
      'Tempel tautan berkas foto Google Drive (akses: siapa saja dengan link)',
    );
    if (url === null) return;
    if (!driveIdFromUrl(url.trim())) {
      setError('Gunakan tautan berkas Google Drive yang valid.');
      return;
    }
    const caption = window
      .prompt('Keterangan foto (opsional)')
      ?.replace(/[|\[\]]/g, '')
      .trim()
      .slice(0, 200);
    setError('');
    insert(
      `[[image:${url.trim()}${caption ? `|${caption}` : ''}]]`,
      '',
      '',
      true,
    );
  }

  function addLink() {
    const url = window.prompt('Tempel tautan HTTPS tujuan');
    if (url === null) return;
    const href = safeArticleLink(url.trim());
    if (!href) {
      setError('Gunakan tautan HTTPS yang valid.');
      return;
    }
    setError('');
    insert('[', `](${href})`, 'teks tautan');
  }

  function addVideo() {
    const url = window.prompt(
      'Tempel tautan video publik YouTube, Facebook, Instagram, atau TikTok',
    );
    if (url === null) return;
    const video = videoEmbedFromUrl(url.trim());
    if (!video) {
      setError('Gunakan tautan postingan video publik yang lengkap dan valid.');
      return;
    }
    const caption = window
      .prompt('Judul video (opsional)')
      ?.replace(/[|\[\]]/g, '')
      .trim()
      .slice(0, 200);
    setError('');
    insert(
      `[[video:${video.url}${caption ? `|${caption}` : ''}]]`,
      '',
      '',
      true,
    );
  }

  return (
    <div className="min-w-0 space-y-2">
      <span className="text-sm font-medium">{label}</span>
      <div
        role="toolbar"
        aria-label="Format tulisan"
        onMouseDown={(event) => {
          if ((event.target as Element).closest('button'))
            event.preventDefault();
        }}
        className="flex flex-wrap gap-2 rounded border border-warm-gray-300 bg-warm-gray-50 p-2"
      >
        <button
          type="button"
          aria-label="Heading"
          className="min-h-11 rounded border bg-white px-3"
          onClick={() => insert('\n\n## ', '\n\n', 'Judul bagian')}
        >
          Heading
        </button>
        <button
          type="button"
          title="Tebal"
          aria-label="Tebal"
          className="grid h-11 w-11 place-items-center rounded border bg-white"
          onClick={() => insert('**', '**', 'teks tebal')}
        >
          <Bold size={18} />
        </button>
        <button
          type="button"
          title="Miring"
          aria-label="Miring"
          className="grid h-11 w-11 place-items-center rounded border bg-white"
          onClick={() => insert('*', '*', 'teks miring')}
        >
          <Italic size={18} />
        </button>
        <button
          type="button"
          title="Garis bawah"
          aria-label="Garis bawah"
          className="grid h-11 w-11 place-items-center rounded border bg-white"
          onClick={() => insert('++', '++', 'teks bergaris bawah')}
        >
          <Underline size={18} />
        </button>
        <button
          type="button"
          title="Daftar bernomor"
          aria-label="Daftar bernomor"
          className="grid h-11 w-11 place-items-center rounded border bg-white"
          onClick={() => addList(true)}
        >
          <ListOrdered size={18} />
        </button>
        <button
          type="button"
          title="Daftar poin"
          aria-label="Daftar poin"
          className="grid h-11 w-11 place-items-center rounded border bg-white"
          onClick={() => addList(false)}
        >
          <List size={18} />
        </button>
        <button
          type="button"
          title="Sisipkan tautan"
          className="flex min-h-11 items-center gap-2 rounded border bg-white px-3 text-sm"
          onClick={addLink}
        >
          <Link2 size={18} /> Sisipkan tautan
        </button>
        <button
          type="button"
          title="Sisipkan foto Drive"
          className="flex min-h-11 items-center gap-2 rounded border bg-white px-3 text-sm"
          onClick={addImage}
        >
          <ImagePlus size={18} /> Sisipkan gambar
        </button>
        <button
          type="button"
          title="Sisipkan video"
          className="flex min-h-11 items-center gap-2 rounded border bg-white px-3 text-sm"
          onClick={addVideo}
        >
          <Play size={18} /> Sisipkan video
        </button>
        <button
          type="button"
          className="min-h-11 rounded border bg-white px-3 text-sm"
          onClick={() => setPreview(!preview)}
          aria-pressed={preview}
        >
          Pratinjau
        </button>
      </div>
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
      <textarea
        ref={ref}
        required
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        aria-label={label}
        rows={18}
        className="w-full resize-y border border-warm-gray-300 p-4 text-base leading-8"
        dir="auto"
      />
      {preview && (
        <div
          className="prose-article min-h-20 rounded border bg-white p-4"
          aria-label="Pratinjau tulisan"
        >
          <RichContent content={value} />
        </div>
      )}
      <p className="text-xs text-warm-gray-500">
        Pilih teks lalu gunakan toolbar. Ctrl/⌘+B/I/U untuk format; Enter
        melanjutkan daftar. Foto memakai Drive publik; video memakai tautan
        postingan publik.
      </p>
    </div>
  );
}
