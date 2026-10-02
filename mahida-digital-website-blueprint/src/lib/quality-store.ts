import { createHash } from 'node:crypto';
import { pool } from '@/db';
import { getHomepageSettings } from './homepage-settings';
import { getEditorialContent } from './editorial-content';
import { driveFolder } from './gallery-schema';
import { karyaPostPath } from './karya-post';
import type { Publication } from './publication-schema';
import type { QualitySnapshot } from './quality-schema';
export function snapshotHash(value: unknown) {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}
export function postPath(post: {
  slug: string;
  type: string;
  karya_category?: string;
}) {
  return (
    karyaPostPath({
      slug: post.slug,
      type: post.type,
      karyaCategory: post.karya_category ?? null,
    }) ??
    `/media/${post.type === 'news' ? 'berita' : post.type === 'story' ? 'kegiatan' : 'pengumuman'}/${post.slug}`
  );
}
export async function publicRouteExists(input: string) {
  let path: string;
  try {
    path =
      decodeURIComponent(
        new URL(input, 'https://mahida.my.id').pathname,
      ).replace(/\/$/, '') || '/';
  } catch {
    return false;
  }
  if (path.startsWith('/admin') || /^\/(api|masuk|daftar)(\/|$)/.test(path))
    return false;
  if (path === '/literasi/esai') path = '/karya/esai';
  if (/^\/arsip\/(20\d{2})$/.test(path)) return true;
  const cms = await pool.query(
    "SELECT 1 FROM cms_pages WHERE path=$1 AND status='published'",
    [path],
  );
  if (cms.rowCount) return true;
  const detail =
    /^\/(karya\/(artikel|esai|terjemahan|manuskrip)|media\/(berita|kegiatan|pengumuman|galeri|video)|koperasi\/(buku|ebook))\/([^/]+)$/.exec(
      path,
    );
  if (detail) {
    const type = detail[2] ?? detail[3] ?? detail[4],
      slug = detail[5];
    const table =
      type === 'galeri'
        ? 'galleries'
        : type === 'video'
          ? 'videos'
          : ['buku', 'ebook'].includes(type)
            ? 'products'
            : 'posts';
    const row = (
      await pool.query(
        `SELECT * FROM ${table} WHERE slug=$1 AND status='published'`,
        [slug],
      )
    ).rows[0];
    if (!row) return false;
    return table === 'posts'
      ? postPath(row) === path
      : table === 'products'
        ? path ===
          `/koperasi/${row.product_type === 'ebook' ? 'ebook' : 'buku'}/${row.slug}`
        : true;
  }
  if (/^\/penulis\/[^/]+$/.test(path))
    return Boolean(
      (
        await pool.query('SELECT 1 FROM authors WHERE slug=$1', [
          path.split('/')[2],
        ])
      ).rowCount,
    );
  return false;
}
function addText(s: QualitySnapshot, text: unknown) {
  const value = typeof text === 'string' ? text : '';
  if (!value) return;
  s.texts.push(value);
  const markers = [
    ...value.matchAll(
      /\[\[(image|video|youtube):(https:\/\/[^\]|\s]+)(?:\|([^\]]*))?\]\]/gi,
    ),
  ];
  for (const m of markers)
    if (m[1].toLowerCase() === 'image')
      s.images.push({
        url: m[2],
        alt: m[3]?.trim() ?? '',
        label: 'Foto dalam teks',
      });
    else
      s.videos.push({ url: m[2], label: m[3]?.trim() || 'Video dalam teks' });
  const stripped = value.replace(/\[\[(image|video|youtube):[^\]]*\]\]/gi, '');
  for (const m of stripped.matchAll(
    /\[([^\]\n]*)\]\(([^\s)]+)\)|https:\/\/[^\s<>()\]]+/g,
  ))
    s.links.push({
      url: m[2] ?? m[0].replace(/[.,!?;:]+$/, ''),
      label: m[1] ?? 'Tautan dalam teks',
      textLink: true,
    });
}
function applyPublication(s: QualitySnapshot, data: Publication) {
  if (data.type === 'page') {
    s.title = data.title;
    addText(s, data.body);
    addText(s, data.intro);
    for (const section of data.content?.sections ?? [])
      if (section.enabled) {
        s.headings.push(section.title);
        addText(s, section.body);
      }
    for (const key of ['address', 'serviceHours', 'fees'] as const)
      addText(s, data.content?.[key]);
    for (const f of data.content?.faq ?? []) {
      s.headings.push(f.question);
      addText(s, f.answer);
    }
    for (const t of data.content?.testimonials ?? []) addText(s, t.text);
    if (data.content?.brochureUrl)
      s.links.push({ url: data.content.brochureUrl, label: 'Brosur' });
    if (data.content?.mapsUrl)
      s.links.push({ url: data.content.mapsUrl, label: 'Peta lokasi' });
    if (data.media?.headerLogoUrl)
      s.images.push({
        url: data.media.headerLogoUrl,
        alt: 'Logo header website',
        label: 'Logo header',
      });
    for (const c of data.media?.clips ?? []) {
      if (c.type === 'image')
        s.images.push({ url: c.url, alt: c.alt, label: 'Foto kliping' });
      else s.videos.push({ url: c.url, label: c.alt });
      if (c.poster)
        s.images.push({ url: c.poster, alt: c.alt, label: 'Poster video' });
    }
  } else if (data.type === 'gallery') {
    s.title = data.data.title;
    addText(s, data.data.description);
    const folderId = driveFolder(data.data.folderUrl)?.id;
    for (const p of data.data.photos)
      if (p.selected && p.visible) {
        s.images.push({
          url: p.imageUrl,
          alt: p.alt,
          label: p.title || p.caption || 'Foto galeri',
          folderId,
        });
      }
  } else {
    s.title = data.title;
    addText(s, data.excerpt);
    addText(s, data.content);
    if (data.featuredImage)
      s.images.push({
        url: data.featuredImage,
        alt: data.title,
        label: 'Foto sampul pengumuman',
      });
  }
}
export async function loadQualitySnapshot(
  target: string,
  version: 'draft' | 'published',
  supplied?: Publication,
) {
  const s: QualitySnapshot = {
    target,
    title: '',
    status: 'published',
    publicPath: '',
    texts: [],
    headings: [],
    images: [],
    videos: [],
    links: [],
  };
  const [kind, ...rest] = target.split(':'),
    key = rest.join(':');
  if (['page', 'media', 'content'].includes(kind)) {
    const page = (
      await pool.query('SELECT * FROM cms_pages WHERE path=$1', [key])
    ).rows[0];
    if (!page) throw Error('Halaman tidak ditemukan');
    s.title = page.title;
    s.status = page.status;
    s.publicPath = key;
    const docs = (
      await pool.query('SELECT * FROM design_documents WHERE path=$1', [key])
    ).rows;
    const document = (name: string) =>
      docs.find((d) => d.kind === name)?.[version] ?? null;
    let data = {
      type: 'page',
      path: key,
      title: page.title,
      intro: page.intro ?? '',
      body: page.body ?? '',
      content: document('content'),
      media: document('media'),
    } as Publication & { type: 'page' };
    if (kind === 'page' && version === 'draft') {
      const draft = (
        await pool.query(
          'SELECT draft FROM publication_documents WHERE target=$1',
          [target],
        )
      ).rows[0]?.draft;
      if (draft?.type === 'page')
        data = { ...data, ...draft, content: data.content, media: data.media };
    }
    if (supplied?.type === 'page' && kind === 'page') data = supplied;
    if (kind === 'media')
      data = { ...data, body: '', intro: '', content: null };
    if (kind === 'content')
      data = { ...data, body: '', intro: '', media: null };
    applyPublication(s, data);
    if (kind !== 'content' && (!data.media || data.media.useLegacyMedia)) {
      const editorial = await getEditorialContent(key);
      for (const url of editorial.images.filter(Boolean))
        s.images.push({ url, alt: '', label: 'Foto Visual & Unit Pendidikan' });
      for (const f of editorial.facilities)
        if (f.visible && f.imageUrl)
          s.images.push({
            url: f.imageUrl,
            alt: f.title,
            label: 'Foto fasilitas',
          });
      if (kind === 'page' && editorial.ctaHref)
        s.links.push({ url: editorial.ctaHref, label: editorial.ctaLabel });
    }
    if (kind === 'page' && key === '/') await addHomepage(s);
  } else if (kind === 'gallery') {
    const album = (
      await pool.query('SELECT * FROM galleries WHERE id=$1', [Number(key)])
    ).rows[0];
    if (!album) throw Error('Album tidak ditemukan');
    s.status = album.status;
    s.publicPath = `/media/galeri/${album.slug}`;
    const doc = (
      await pool.query('SELECT * FROM gallery_documents WHERE gallery_id=$1', [
        album.id,
      ])
    ).rows[0];
    const legacy = (
      await pool.query(
        'SELECT image_url,caption,id FROM gallery_images WHERE gallery_id=$1 ORDER BY sort_order,id',
        [album.id],
      )
    ).rows;
    const data = doc?.[version] ?? {
      title: album.title,
      description: album.description ?? '',
      folderUrl: '',
      photos: legacy.map((p) => ({
        imageUrl: p.image_url,
        alt: '',
        caption: p.caption,
        selected: true,
        visible: true,
      })),
    };
    applyPublication(s, supplied ?? { type: 'gallery', id: album.id, data });
  } else if (kind === 'post' || kind === 'announcement') {
    const post = (
      await pool.query('SELECT * FROM posts WHERE id=$1', [Number(key)])
    ).rows[0];
    if (!post || (kind === 'announcement' && post.type !== 'announcement'))
      throw Error('Konten tidak ditemukan');
    s.status = post.status;
    s.publicPath = postPath(post);
    let data = {
      type: 'announcement',
      id: post.id,
      title: post.title,
      excerpt: post.excerpt ?? '',
      content: post.content_raw ?? post.content ?? '',
      featuredImage: post.featured_image ?? '',
    } as Publication;
    if (version === 'draft' && post.type === 'announcement')
      data =
        (
          await pool.query(
            'SELECT draft FROM publication_documents WHERE target=$1',
            [`announcement:${post.id}`],
          )
        ).rows[0]?.draft ?? data;
    applyPublication(s, supplied ?? data);
  } else if (kind === 'video') {
    const video = (
      await pool.query('SELECT * FROM videos WHERE id=$1', [Number(key)])
    ).rows[0];
    if (!video) throw Error('Video tidak ditemukan');
    s.title = video.title;
    s.status = video.status;
    s.publicPath = `/media/video/${video.slug}`;
    addText(s, video.description);
    s.videos.push({
      url: `https://www.youtube.com/watch?v=${video.youtube_id}`,
      label: video.title,
    });
  } else if (kind === 'product') {
    const p = (
      await pool.query('SELECT * FROM products WHERE id=$1', [Number(key)])
    ).rows[0];
    if (!p) throw Error('Produk tidak ditemukan');
    s.title = p.name;
    s.status = p.status;
    s.publicPath = `/koperasi/${p.product_type === 'ebook' ? 'ebook' : 'buku'}/${p.slug}`;
    addText(s, p.description);
    if (p.image_url)
      s.images.push({ url: p.image_url, alt: p.name, label: 'Sampul produk' });
    // Digital file URLs are private delivery resources, never probed as public links.
  } else if (target === 'homepage') {
    s.title = 'Beranda';
    s.publicPath = '/';
    await addHomepage(s);
  } else if (target === 'navigation') {
    s.title = 'Menu navigasi';
    for (const row of (
      await pool.query(
        'SELECT label,path FROM navigation_items WHERE is_visible ORDER BY sort_order,id',
      )
    ).rows)
      s.links.push({ label: row.label, url: row.path });
  } else if (target === 'directory') {
    s.title = 'Media sosial dan kontak';
    s.publicPath = '/tentang/kontak';
    const raw = (
      await pool.query(
        "SELECT value FROM settings WHERE key='public_directory'",
      )
    ).rows[0]?.value;
    const directory = raw ? JSON.parse(raw) : {};
    for (const p of directory.socials ?? [])
      if (p.isVisible) s.links.push({ url: p.url, label: p.label });
    for (const p of directory.contacts ?? [])
      if (p.isVisible)
        s.links.push({
          url:
            p.channel === 'website'
              ? p.value
              : p.channel === 'whatsapp'
                ? `https://wa.me/${p.value}`
                : `${p.channel === 'email' ? 'mailto' : 'tel'}:${p.value}`,
          label: p.label,
        });
  } else if (target === 'admissions') {
    s.title = 'Pendaftaran santri';
    s.publicPath = '/tentang/pendaftaran';
    const row = (
      await pool.query('SELECT * FROM admission_settings WHERE id=1')
    ).rows[0];
    if (row) {
      addText(s, row.introduction);
      for (const text of [...row.steps, ...row.requirements]) addText(s, text);
      if (row.application_url)
        s.links.push({
          url: row.application_url,
          label: row.application_label,
        });
    }
  } else if (target === 'commerce') {
    s.title = 'Pengaturan koperasi';
    s.publicPath = '/koperasi';
    const raw = (
      await pool.query("SELECT value FROM settings WHERE key='commerce'")
    ).rows[0]?.value;
    const settings = raw ? JSON.parse(raw) : {};
    if (settings.whatsappNumber)
      s.links.push({
        url: `https://wa.me/${settings.whatsappNumber}`,
        label: 'WhatsApp Koperasi',
      });
    if (settings.qrisImageUrl)
      s.images.push({
        url: settings.qrisImageUrl,
        alt: 'QRIS resmi koperasi',
        label: 'QRIS',
      });
  } else throw Error('Target tidak ditemukan');
  return s;
}
async function addHomepage(s: QualitySnapshot) {
  const h = await getHomepageSettings();
  s.title = h.seoTitle;
  s.headings.push(
    h.heroTitleLine1,
    h.heroTitleLine2,
    h.unitsTitle,
    h.newsTitle,
  );
  addText(s, h.heroDescription);
  addText(s, h.aboutDescription);
  for (const [url, alt, label] of [
    [h.siteLogoUrl, h.siteName, 'Logo navbar'],
    [h.heroImageUrl, '', 'Foto hero'],
    [
      h.heroWidgetImageUrl,
      h.heroWidgetLayout === 'logo' ? h.siteName : '',
      'Foto widget',
    ],
    [h.aboutImageUrl, '', 'Foto pengantar'],
  ])
    if (url) s.images.push({ url, alt, label });
  if (h.heroVideoUrl)
    s.videos.push({ url: h.heroVideoUrl, label: 'Video hero' });
  for (const [url, label] of [
    [h.heroPrimaryHref, h.heroPrimaryLabel],
    [h.heroSecondaryHref, h.heroSecondaryLabel],
  ])
    if (url) s.links.push({ url, label });
}
