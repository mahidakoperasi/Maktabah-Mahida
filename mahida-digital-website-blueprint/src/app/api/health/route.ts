import { db } from '@/db';
import { sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!process.env.DATABASE_URL) {
    return Response.json(
      {
        ok: false,
        database: 'not_configured',
        authSchemaReady: false,
        articleCmsReady: false,
      },
      { status: 503 },
    );
  }

  try {
    const connection = await db.execute(sql`select 1 as ok`);
    const schema = await db.execute(sql`
      select
        to_regclass('public.users') is not null as users_table,
        to_regclass('public.otp_codes') is not null as otp_codes_table,
        to_regclass('public.posts') is not null as posts_table,
        to_regclass('public.cms_pages') is not null as cms_pages_table,
        to_regclass('public.navigation_items') is not null as navigation_items_table,
        to_regclass('public.products') is not null as products_table,
        to_regclass('public.videos') is not null as videos_table,
        to_regclass('public.galleries') is not null as galleries_table,
        to_regclass('public.ebook_orders') is not null as ebook_orders_table,
        to_regclass('public.gallery_documents') is not null as gallery_documents_table,
        to_regclass('public.design_documents') is not null as design_documents_table,
        to_regclass('public.publication_documents') is not null as publication_documents_table
    `);

    const row = schema.rows?.[0] as
      | {
          users_table?: boolean;
          otp_codes_table?: boolean;
          posts_table?: boolean;
          cms_pages_table?: boolean;
          navigation_items_table?: boolean;
          products_table?: boolean;
          videos_table?: boolean;
          galleries_table?: boolean;
          ebook_orders_table?: boolean;
          gallery_documents_table?: boolean;
          design_documents_table?: boolean;
          publication_documents_table?: boolean;
        }
      | undefined;

    const usersTable = Boolean(row?.users_table);
    const otpCodesTable = Boolean(row?.otp_codes_table);
    const postsTable = Boolean(row?.posts_table);

    return Response.json({
      ok: Boolean(connection),
      database: 'connected',
      authSchemaReady: usersTable && otpCodesTable,
      articleCmsReady: postsTable,
      galleryFolderReady: Boolean(row?.gallery_documents_table),
      visualClippingReady: Boolean(row?.design_documents_table),
      publicationReady: Boolean(row?.publication_documents_table),
      stage2CmsReady: Boolean(
        row?.cms_pages_table &&
          row?.navigation_items_table &&
          row?.products_table &&
          row?.videos_table &&
          row?.galleries_table &&
          row?.ebook_orders_table,
      ),
      tables: {
        users: usersTable,
        otpCodes: otpCodesTable,
        posts: postsTable,
        cmsPages: Boolean(row?.cms_pages_table),
        navigationItems: Boolean(row?.navigation_items_table),
        products: Boolean(row?.products_table),
        videos: Boolean(row?.videos_table),
        galleries: Boolean(row?.galleries_table),
        ebookOrders: Boolean(row?.ebook_orders_table),
        galleryDocuments: Boolean(row?.gallery_documents_table),
        designDocuments: Boolean(row?.design_documents_table),
        publicationDocuments: Boolean(row?.publication_documents_table),
      },
    });
  } catch (error) {
    console.error('Health check error:', error);
    return Response.json(
      {
        ok: false,
        database: 'unreachable',
        authSchemaReady: false,
        articleCmsReady: false,
      },
      { status: 503 },
    );
  }
}
