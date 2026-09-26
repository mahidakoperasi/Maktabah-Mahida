'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Eye, Save, Send, Trash2 } from 'lucide-react';
import Link from 'next/link';

type ArticleData = {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  contentRaw: string | null;
  status: 'draft' | 'scheduled' | 'published' | 'archived';
  featuredImage: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
};

export default function ArticleEditor({ articleId }: { articleId?: number }) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [featuredImage, setFeaturedImage] = useState('');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [status, setStatus] = useState<'draft' | 'published'>('draft');
  const [slug, setSlug] = useState('');
  const [isLoading, setIsLoading] = useState(Boolean(articleId));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (!articleId) return;

    let active = true;

    async function loadArticle() {
      try {
        const response = await fetch(`/api/admin/articles/${articleId}`, {
          cache: 'no-store',
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Gagal memuat artikel');
        }

        if (!active) return;

        const article = data.article as ArticleData;
        setTitle(article.title ?? '');
        setExcerpt(article.excerpt ?? '');
        setContent(article.contentRaw ?? article.content ?? '');
        setFeaturedImage(article.featuredImage ?? '');
        setMetaTitle(article.metaTitle ?? '');
        setMetaDescription(article.metaDescription ?? '');
        setStatus(article.status === 'published' ? 'published' : 'draft');
        setSlug(article.slug ?? '');
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Gagal memuat artikel');
        }
      } finally {
        if (active) setIsLoading(false);
      }
    }

    loadArticle();

    return () => {
      active = false;
    };
  }, [articleId]);

  async function save(nextStatus: 'draft' | 'published') {
    setError('');
    setNotice('');

    if (!title.trim()) {
      setError('Judul wajib diisi.');
      return;
    }

    if (!content.trim()) {
      setError('Isi artikel wajib diisi.');
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch(
        articleId ? `/api/admin/articles/${articleId}` : '/api/admin/articles',
        {
          method: articleId ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            excerpt,
            content,
            featuredImage,
            metaTitle,
            metaDescription,
            status: nextStatus,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Gagal menyimpan artikel');
      }

      setStatus(data.article.status === 'published' ? 'published' : 'draft');
      setSlug(data.article.slug ?? '');
      setNotice(nextStatus === 'published' ? 'Artikel berhasil diterbitkan.' : 'Draft berhasil disimpan.');

      if (!articleId) {
        router.replace(`/admin/konten/artikel/${data.article.id}/edit`);
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan artikel');
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteArticle() {
    if (!articleId) return;
    if (!window.confirm('Hapus artikel ini secara permanen?')) return;

    setIsSaving(true);
    setError('');

    try {
      const response = await fetch(`/api/admin/articles/${articleId}`, {
        method: 'DELETE',
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Gagal menghapus artikel');
      }

      router.replace('/admin/konten/artikel');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus artikel');
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return <div className="text-sm text-warm-gray-500">Memuat artikel...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <Link
            href="/admin/konten/artikel"
            className="mb-2 inline-flex items-center gap-2 text-sm text-warm-gray-500 hover:text-emerald-forest"
          >
            <ArrowLeft size={15} />
            Daftar Artikel
          </Link>
          <h1 className="text-2xl font-serif font-bold text-charcoal">
            {articleId ? 'Edit Artikel' : 'Artikel Baru'}
          </h1>
          <p className="mt-1 text-sm text-warm-gray-500">
            {status === 'published' ? 'Artikel sudah diterbitkan' : 'Artikel masih berupa draft'}
            {slug ? ` • /${slug}` : ''}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {articleId && slug && status === 'published' && (
            <Link
              href={`/karya/artikel/${slug}`}
              target="_blank"
              className="btn-secondary"
            >
              <Eye size={16} />
              Lihat
            </Link>
          )}
          {articleId && (
            <button
              type="button"
              onClick={deleteArticle}
              disabled={isSaving}
              className="inline-flex items-center gap-2 border border-red-200 px-4 py-3 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
            >
              <Trash2 size={16} />
              Hapus
            </button>
          )}
          <button
            type="button"
            onClick={() => save('draft')}
            disabled={isSaving}
            className="btn-secondary"
          >
            <Save size={16} />
            Simpan Draft
          </button>
          <button
            type="button"
            onClick={() => save('published')}
            disabled={isSaving}
            className="btn-primary"
          >
            <Send size={16} />
            {status === 'published' ? 'Perbarui Terbitan' : 'Terbitkan'}
          </button>
        </div>
      </div>

      {error && (
        <div className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {notice && (
        <div className="border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {notice}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-5">
          <div className="bg-white border border-warm-gray-200 p-5">
            <label className="mb-2 block text-sm font-semibold text-charcoal">Judul Artikel</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Tulis judul artikel..."
              className="w-full border border-warm-gray-300 px-4 py-3 text-lg font-semibold outline-none focus:border-emerald-forest"
            />
          </div>

          <div className="bg-white border border-warm-gray-200 p-5">
            <label className="mb-2 block text-sm font-semibold text-charcoal">Ringkasan</label>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="Ringkasan singkat untuk kartu artikel dan hasil pencarian."
              rows={3}
              className="w-full resize-y border border-warm-gray-300 px-4 py-3 outline-none focus:border-emerald-forest"
            />
          </div>

          <div className="bg-white border border-warm-gray-200 p-5">
            <div className="mb-2 flex items-center justify-between gap-4">
              <label className="block text-sm font-semibold text-charcoal">Isi Artikel</label>
              <span className="text-xs text-warm-gray-400">
                {content.trim() ? content.trim().split(/\s+/).length : 0} kata
              </span>
            </div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Mulai menulis artikel di sini..."
              rows={22}
              className="w-full resize-y border border-warm-gray-300 px-4 py-4 font-serif text-[16px] leading-8 outline-none focus:border-emerald-forest"
            />
            <div className="mt-3 space-y-2 border border-[#dfe4d9] bg-[#f7f8f3] p-4 text-xs text-warm-gray-500">
              <p>
                Pisahkan paragraf dengan satu baris kosong. Untuk menyisipkan teaser video YouTube di posisi mana pun, tulis marker pada baris tersendiri:
              </p>
              <code className="block overflow-x-auto bg-white px-3 py-2 font-mono text-[11px] text-emerald-800">
                [[youtube:https://youtu.be/VIDEO_ID]]
              </code>
              <p>
                Judul teaser juga bisa ditentukan:
              </p>
              <code className="block overflow-x-auto bg-white px-3 py-2 font-mono text-[11px] text-emerald-800">
                [[youtube:https://youtu.be/VIDEO_ID|Saksikan momen setoran lengkap]]
              </code>
            </div>
          </div>
        </div>

        <aside className="space-y-5">
          <div className="bg-white border border-warm-gray-200 p-5">
            <h2 className="mb-4 font-semibold text-charcoal">Publikasi</h2>
            <dl className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-warm-gray-500">Status</dt>
                <dd className={status === 'published' ? 'font-semibold text-emerald-700' : 'font-semibold text-warm-gray-700'}>
                  {status === 'published' ? 'Terbit' : 'Draft'}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-warm-gray-500">Slug</dt>
                <dd className="max-w-[180px] break-all text-right text-warm-gray-700">
                  {slug || 'dibuat otomatis'}
                </dd>
              </div>
            </dl>
          </div>

          <div className="bg-white border border-warm-gray-200 p-5">
            <h2 className="mb-4 font-semibold text-charcoal">Gambar Utama</h2>
            <input
              value={featuredImage}
              onChange={(e) => setFeaturedImage(e.target.value)}
              placeholder="https://drive.google.com/file/d/.../view"
              className="w-full border border-warm-gray-300 px-3 py-2.5 text-sm outline-none focus:border-emerald-forest"
            />
            <p className="mt-2 text-xs text-warm-gray-400">Tempel tautan foto Google Drive yang dapat dilihat siapa pun yang memiliki tautan. Foto akan tampil di beranda, daftar artikel, dan halaman artikel.</p>
          </div>

          <div className="bg-white border border-warm-gray-200 p-5">
            <h2 className="mb-4 font-semibold text-charcoal">SEO</h2>
            <label className="mb-1.5 block text-xs font-semibold text-warm-gray-600">Judul SEO</label>
            <input
              value={metaTitle}
              onChange={(e) => setMetaTitle(e.target.value)}
              className="mb-4 w-full border border-warm-gray-300 px-3 py-2.5 text-sm outline-none focus:border-emerald-forest"
            />
            <label className="mb-1.5 block text-xs font-semibold text-warm-gray-600">Deskripsi SEO</label>
            <textarea
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              rows={4}
              className="w-full border border-warm-gray-300 px-3 py-2.5 text-sm outline-none focus:border-emerald-forest"
            />
          </div>
        </aside>
      </div>
    </div>
  );
}
