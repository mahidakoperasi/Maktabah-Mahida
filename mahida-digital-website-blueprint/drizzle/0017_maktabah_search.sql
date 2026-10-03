-- Derived search data only. Canonical kitab metadata/content remain in posts/maktabah_books.
CREATE OR REPLACE FUNCTION mahida_search_normalize(value text) RETURNS text
LANGUAGE sql IMMUTABLE PARALLEL SAFE AS $$
  SELECT translate(regexp_replace(normalize(lower(coalesce(value, '')), NFKD),
    U&'[\0300-\036F\0610-\061A\0640\064B-\065F\0670\06D6-\06DC\06DF-\06E4\06E7-\06E8\06EA-\06ED\08D3-\08FF]', '', 'g'),
    '٠١٢٣٤٥٦٧٨٩۰۱۲۳۴۵۶۷۸۹یک', '01234567890123456789يك')
$$;

CREATE TABLE IF NOT EXISTS maktabah_search_entries (
  id bigserial PRIMARY KEY,
  post_id integer NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK(kind IN ('book','chapter','body','footnote')),
  chapter_id text NOT NULL DEFAULT '',
  chapter_title text NOT NULL DEFAULT '',
  block_id text NOT NULL DEFAULT '',
  content text NOT NULL,
  content_hash text NOT NULL DEFAULT '',
  search_vector tsvector GENERATED ALWAYS AS (to_tsvector('simple', mahida_search_normalize(content))) STORED,
  CONSTRAINT maktabah_search_identity_idx UNIQUE(post_id, kind, chapter_id, block_id)
);
CREATE INDEX IF NOT EXISTS maktabah_search_vector_idx ON maktabah_search_entries USING gin(search_vector);
CREATE INDEX IF NOT EXISTS maktabah_search_post_idx ON maktabah_search_entries(post_id);

-- Walk paragraphs, list items and cells. Group footnote paragraphs under their note anchor.
CREATE OR REPLACE FUNCTION mahida_maktabah_search_blocks(source jsonb)
RETURNS TABLE(block_id text, kind text, level integer, content text)
LANGUAGE sql IMMUTABLE AS $$
  WITH RECURSIVE tree AS (
    SELECT value AS block, ARRAY[ordinality] AS position,
      CASE WHEN value->>'kind'='footnote' THEN value->>'id' END AS note_id
    FROM jsonb_array_elements(coalesce(source, '[]')) WITH ORDINALITY
    UNION ALL
    SELECT child.value, parent.position || ARRAY[r.ordinality, c.ordinality, child.ordinality],
      coalesce(parent.note_id, CASE WHEN child.value->>'kind'='footnote' THEN child.value->>'id' END)
    FROM tree parent
    CROSS JOIN LATERAL jsonb_array_elements(coalesce(parent.block->'rows','[]')) WITH ORDINALITY r
    CROSS JOIN LATERAL jsonb_array_elements(r.value) WITH ORDINALITY c
    CROSS JOIN LATERAL jsonb_array_elements(c.value) WITH ORDINALITY child
  ), leaves AS (
    SELECT coalesce(note_id,block->>'id') AS block_id,
      CASE WHEN note_id IS NOT NULL THEN 'footnote' ELSE block->>'kind' END AS kind,
      CASE WHEN note_id IS NOT NULL THEN 0 ELSE coalesce((block->>'level')::integer,0) END AS level,
      position,
      (SELECT string_agg(coalesce(run->>'text',''),'' ORDER BY ordinality)
        FROM jsonb_array_elements(coalesce(block->'runs','[]')) WITH ORDINALITY AS runs(run,ordinality)) AS content
    FROM tree
  )
  SELECT block_id, kind, level, string_agg(content,' ' ORDER BY position)
  FROM leaves WHERE coalesce(content,'') <> ''
  GROUP BY block_id,kind,level
$$;

CREATE OR REPLACE FUNCTION mahida_refresh_maktabah_search(book_id integer) RETURNS void
LANGUAGE plpgsql AS $$
DECLARE b record; ch jsonb; block record; piece text; chapter_number integer := 0; chapter_id text; chapter_title text;
BEGIN
  DELETE FROM maktabah_search_entries WHERE post_id=book_id;
  SELECT p.*, m.published AS meta, m.chapters, m.content_hash, m.document_id, m.blocked
    INTO b FROM posts p LEFT JOIN maktabah_books m ON m.post_id=p.id WHERE p.id=book_id;
  IF NOT FOUND OR b.type <> 'work' OR b.karya_category <> 'terjemahan' OR b.status <> 'published' THEN RETURN; END IF;
  IF coalesce(b.meta->>'docsUrl','') <> '' AND
    (coalesce(b.blocked,false) OR b.document_id IS DISTINCT FROM
      substring(b.meta->>'docsUrl' FROM '^https://docs\.google\.com/document/d/([A-Za-z0-9_-]+)')) THEN RETURN; END IF;
  INSERT INTO maktabah_search_entries(post_id,kind,content,content_hash) VALUES(book_id,'book',
    coalesce(nullif(b.meta->>'title',''),b.title) || ' ' || coalesce(b.meta->>'arabicTitle','') || ' ' || coalesce(b.excerpt,''),
    coalesce(b.content_hash,''));
  IF coalesce(b.meta->>'docsUrl','') <> '' THEN
    FOR ch IN SELECT value FROM jsonb_array_elements(coalesce(b.chapters,'[]')) LOOP
      INSERT INTO maktabah_search_entries(post_id,kind,chapter_id,chapter_title,block_id,content,content_hash)
        VALUES(book_id,'chapter',ch->>'id',ch->>'title',ch->>'id',ch->>'title',coalesce(b.content_hash,''));
      FOR block IN SELECT * FROM mahida_maktabah_search_blocks(ch->'blocks') LOOP
        IF block.kind='heading' AND block.block_id=ch->>'id' THEN CONTINUE; END IF;
        INSERT INTO maktabah_search_entries(post_id,kind,chapter_id,chapter_title,block_id,content,content_hash)
          VALUES(book_id,CASE WHEN block.kind='heading' THEN 'chapter' WHEN block.kind='footnote' THEN 'footnote' ELSE 'body' END,
            ch->>'id',ch->>'title',block.block_id,block.content,coalesce(b.content_hash,''));
      END LOOP;
    END LOOP;
  ELSE
    FOR piece IN SELECT regexp_split_to_table(coalesce(nullif(b.content_raw,''),b.content,''),'(?=^#{1,2}\s+\S)','m') LOOP
      IF btrim(piece)='' THEN CONTINUE; END IF;
      chapter_number := chapter_number+1;
      chapter_id := 'lama-' || chapter_number;
      chapter_title := coalesce(substring(btrim(piece) FROM '^#{1,2}\s+([^\n]+)'), CASE WHEN chapter_number=1 THEN 'Isi Kitab' ELSE 'Bagian ' || chapter_number END);
      INSERT INTO maktabah_search_entries(post_id,kind,chapter_id,chapter_title,block_id,content)
        VALUES(book_id,'chapter',chapter_id,chapter_title,'legacy-content',chapter_title);
      INSERT INTO maktabah_search_entries(post_id,kind,chapter_id,chapter_title,block_id,content)
        VALUES(book_id,'body',chapter_id,chapter_title,'legacy-content',
          regexp_replace(regexp_replace(piece,'\[\[(image|youtube|video):[^]]+\]\]','','g'),'!?\[([^]]*)\]\([^)]*\)','\1','g'));
    END LOOP;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION mahida_maktabah_search_trigger() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_TABLE_NAME='posts' THEN
    PERFORM mahida_refresh_maktabah_search(NEW.id);
  ELSE
    PERFORM mahida_refresh_maktabah_search(CASE WHEN TG_OP='DELETE' THEN OLD.post_id ELSE NEW.post_id END);
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER maktabah_search_post_insert AFTER INSERT ON posts
  FOR EACH ROW WHEN (NEW.type='work' AND NEW.karya_category='terjemahan') EXECUTE FUNCTION mahida_maktabah_search_trigger();
CREATE TRIGGER maktabah_search_post_update AFTER UPDATE ON posts
  FOR EACH ROW WHEN (((OLD.type='work' AND OLD.karya_category='terjemahan') OR (NEW.type='work' AND NEW.karya_category='terjemahan'))
    AND (OLD.type IS DISTINCT FROM NEW.type OR OLD.karya_category IS DISTINCT FROM NEW.karya_category
      OR OLD.status IS DISTINCT FROM NEW.status OR OLD.title IS DISTINCT FROM NEW.title OR OLD.excerpt IS DISTINCT FROM NEW.excerpt
      OR OLD.content IS DISTINCT FROM NEW.content OR OLD.content_raw IS DISTINCT FROM NEW.content_raw OR OLD.published_at IS DISTINCT FROM NEW.published_at))
  EXECUTE FUNCTION mahida_maktabah_search_trigger();
CREATE TRIGGER maktabah_search_book_insert AFTER INSERT ON maktabah_books
  FOR EACH ROW EXECUTE FUNCTION mahida_maktabah_search_trigger();
CREATE TRIGGER maktabah_search_book_update AFTER UPDATE ON maktabah_books
  FOR EACH ROW WHEN (OLD.published IS DISTINCT FROM NEW.published OR OLD.chapters IS DISTINCT FROM NEW.chapters
    OR OLD.content_hash IS DISTINCT FROM NEW.content_hash OR OLD.document_id IS DISTINCT FROM NEW.document_id OR OLD.blocked IS DISTINCT FROM NEW.blocked)
  EXECUTE FUNCTION mahida_maktabah_search_trigger();

CREATE TRIGGER maktabah_search_book_delete AFTER DELETE ON maktabah_books
  FOR EACH ROW EXECUTE FUNCTION mahida_maktabah_search_trigger();

-- Existing published translations are indexed immediately, without fetching private Docs again.
SELECT mahida_refresh_maktabah_search(id) FROM posts WHERE type='work' AND karya_category='terjemahan' AND status='published';
