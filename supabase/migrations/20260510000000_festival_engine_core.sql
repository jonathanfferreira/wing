-- ============================================================
-- Migration: Festival Engine Core (completamente idempotente)
-- Seguro para re-executar independente do estado atual do banco.
-- Cada bloco verifica existência antes de agir.
-- ============================================================

-- ── 1. Enums ─────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE festival_status AS ENUM (
    'draft','published','registration_open','registration_closed',
    'active','finished','cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE category_modality AS ENUM (
    'classical','contemporary','jazz','urban','folk','battle','freestyle','show'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE formation_type AS ENUM (
    'solo','duo','trio','mini_group','group','large_group'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE delegation_status AS ENUM (
    'draft','submitted','approved','rejected','suspended'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE choreography_status AS ENUM (
    'draft','pending_audio','audio_submitted','approved','rejected','withdrawn'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── 2. Renomear categories → festival_categories ─────────────
-- Só age se 'categories' existir E 'festival_categories' ainda não existir.

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'categories'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'festival_categories'
  ) THEN
    ALTER TABLE categories RENAME TO festival_categories;
  END IF;
END $$;

-- ── 3. Enriquecer festivals ───────────────────────────────────
-- ADD COLUMN IF NOT EXISTS é seguro por definição.

ALTER TABLE festivals ADD COLUMN IF NOT EXISTS status           festival_status NOT NULL DEFAULT 'draft';
ALTER TABLE festivals ADD COLUMN IF NOT EXISTS city             TEXT;
ALTER TABLE festivals ADD COLUMN IF NOT EXISTS state            TEXT;
ALTER TABLE festivals ADD COLUMN IF NOT EXISTS venue_name       TEXT;
ALTER TABLE festivals ADD COLUMN IF NOT EXISTS cover_image_url  TEXT;
ALTER TABLE festivals ADD COLUMN IF NOT EXISTS rules_url        TEXT;
ALTER TABLE festivals ADD COLUMN IF NOT EXISTS max_delegations  INTEGER;
ALTER TABLE festivals ADD COLUMN IF NOT EXISTS updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- ── 4. Enriquecer festival_categories ────────────────────────
-- Tudo dentro de um DO block: só executa se a tabela existir.

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'festival_categories'
  ) THEN
    RAISE NOTICE 'festival_categories não existe — pulando alterações de colunas.';
    RETURN;
  END IF;

  EXECUTE $x$ALTER TABLE festival_categories ADD COLUMN IF NOT EXISTS modality                    category_modality NOT NULL DEFAULT 'classical'$x$;
  EXECUTE $x$ALTER TABLE festival_categories ADD COLUMN IF NOT EXISTS formation                   formation_type NOT NULL DEFAULT 'solo'$x$;
  EXECUTE $x$ALTER TABLE festival_categories ADD COLUMN IF NOT EXISTS min_dancers                 INTEGER NOT NULL DEFAULT 1$x$;
  EXECUTE $x$ALTER TABLE festival_categories ADD COLUMN IF NOT EXISTS max_dancers                 INTEGER NOT NULL DEFAULT 1$x$;
  EXECUTE $x$ALTER TABLE festival_categories ADD COLUMN IF NOT EXISTS min_age                     INTEGER$x$;
  EXECUTE $x$ALTER TABLE festival_categories ADD COLUMN IF NOT EXISTS max_age                     INTEGER$x$;
  EXECUTE $x$ALTER TABLE festival_categories ADD COLUMN IF NOT EXISTS max_duration_seconds_strict BOOLEAN NOT NULL DEFAULT TRUE$x$;
  EXECUTE $x$ALTER TABLE festival_categories ADD COLUMN IF NOT EXISTS is_competitive              BOOLEAN NOT NULL DEFAULT TRUE$x$;
  EXECUTE $x$ALTER TABLE festival_categories ADD COLUMN IF NOT EXISTS inscription_fee_per_dancer  DECIMAL(10,2) NOT NULL DEFAULT 0$x$;
  EXECUTE $x$ALTER TABLE festival_categories ADD COLUMN IF NOT EXISTS updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()$x$;

  BEGIN
    EXECUTE $x$ALTER TABLE festival_categories ADD CONSTRAINT chk_dancer_count CHECK (min_dancers <= max_dancers AND min_dancers >= 1)$x$;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

-- ── 5. Tabela delegations ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS delegations (
    id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    festival_id   UUID REFERENCES festivals(id)  ON DELETE CASCADE NOT NULL,
    school_id     UUID REFERENCES schools(id)    ON DELETE CASCADE NOT NULL,
    director_id   UUID REFERENCES profiles(id)   NOT NULL,
    status        delegation_status NOT NULL DEFAULT 'draft',
    bus_spots_requested   INTEGER NOT NULL DEFAULT 0,
    hotel_spots_requested INTEGER NOT NULL DEFAULT 0,
    logistics_notes       TEXT,
    total_due   DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_paid  DECIMAL(10,2) NOT NULL DEFAULT 0,
    enrolled_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    submitted_at TIMESTAMPTZ,
    approved_at  TIMESTAMPTZ,
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(festival_id, school_id)
);

ALTER TABLE delegations ENABLE ROW LEVEL SECURITY;

-- ── 6. Enriquecer choreographies ─────────────────────────────

ALTER TABLE choreographies ADD COLUMN IF NOT EXISTS delegation_id      UUID REFERENCES delegations(id) ON DELETE CASCADE;
ALTER TABLE choreographies ADD COLUMN IF NOT EXISTS status             choreography_status NOT NULL DEFAULT 'draft';
ALTER TABLE choreographies ADD COLUMN IF NOT EXISTS performance_order  INTEGER;
ALTER TABLE choreographies ADD COLUMN IF NOT EXISTS audio_validated_at TIMESTAMPTZ;
ALTER TABLE choreographies ADD COLUMN IF NOT EXISTS updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Tornar delegation_id NOT NULL (ignora se já for ou se falhar por dados existentes)
DO $$ BEGIN
  ALTER TABLE choreographies ALTER COLUMN delegation_id SET NOT NULL;
EXCEPTION WHEN others THEN NULL;
END $$;

-- Remover school_id legado
DO $$ BEGIN
  ALTER TABLE choreographies DROP COLUMN school_id;
EXCEPTION WHEN undefined_column THEN NULL;
END $$;

-- ── 7. Enriquecer inscriptions ────────────────────────────────

ALTER TABLE inscriptions ADD COLUMN IF NOT EXISTS payment_lock        BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE inscriptions ADD COLUMN IF NOT EXISTS payment_lock_reason TEXT;
ALTER TABLE inscriptions ADD COLUMN IF NOT EXISTS checked_in_at       TIMESTAMPTZ;
ALTER TABLE inscriptions ADD COLUMN IF NOT EXISTS updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- ── 8. Índices ────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_festivals_status           ON festivals(status);
CREATE INDEX IF NOT EXISTS idx_festivals_organizer_id     ON festivals(organizer_id);
CREATE INDEX IF NOT EXISTS idx_delegations_festival_id    ON delegations(festival_id);
CREATE INDEX IF NOT EXISTS idx_delegations_school_id      ON delegations(school_id);
CREATE INDEX IF NOT EXISTS idx_delegations_director_id    ON delegations(director_id);
CREATE INDEX IF NOT EXISTS idx_delegations_status         ON delegations(status);
CREATE INDEX IF NOT EXISTS idx_choreographies_deleg_id    ON choreographies(delegation_id);
CREATE INDEX IF NOT EXISTS idx_inscriptions_choreo_id     ON inscriptions(choreography_id);
CREATE INDEX IF NOT EXISTS idx_inscriptions_dancer_id     ON inscriptions(dancer_id);
CREATE INDEX IF NOT EXISTS idx_inscriptions_lock          ON inscriptions(payment_lock) WHERE payment_lock = TRUE;

-- Índice em festival_categories só se a tabela existir
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'festival_categories'
  ) THEN
    EXECUTE $x$CREATE INDEX IF NOT EXISTS idx_fest_cat_festival_id ON festival_categories(festival_id)$x$;
  END IF;
END $$;

-- ── 9. Remover políticas obsoletas (com guards de tabela) ─────

-- Políticas que podem estar em 'categories' OU 'festival_categories'
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='festival_categories') THEN
    DROP POLICY IF EXISTS "Categories viewable by everyone"  ON festival_categories;
    DROP POLICY IF EXISTS "Organizers can manage categories" ON festival_categories;
    -- Remover possíveis runs parciais desta própria migration
    DROP POLICY IF EXISTS "Categorias: visíveis conforme festival"          ON festival_categories;
    DROP POLICY IF EXISTS "Categorias: organizadores gerenciam as suas"     ON festival_categories;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='categories') THEN
    DROP POLICY IF EXISTS "Categories viewable by everyone"  ON categories;
    DROP POLICY IF EXISTS "Organizers can manage categories" ON categories;
  END IF;
EXCEPTION WHEN others THEN NULL;
END $$;

-- Políticas em tabelas que sempre existem
DROP POLICY IF EXISTS "Festivals are viewable by everyone"           ON festivals;
DROP POLICY IF EXISTS "Organizers can manage own festivals"          ON festivals;
DROP POLICY IF EXISTS "Festivals: owner vê tudo, público vê não-rascunhos" ON festivals;
DROP POLICY IF EXISTS "Festivals: organizadores criam"               ON festivals;
DROP POLICY IF EXISTS "Festivals: organizadores atualizam os seus"   ON festivals;
DROP POLICY IF EXISTS "Festivals: organizadores deletam rascunhos"   ON festivals;

DROP POLICY IF EXISTS "Directors can manage their choreographies"    ON choreographies;
DROP POLICY IF EXISTS "Dancers can view their choreographies"        ON choreographies;
DROP POLICY IF EXISTS "Coreos: diretor gerencia via delegação"       ON choreographies;
DROP POLICY IF EXISTS "Coreos: organizador vê do seu festival"       ON choreographies;
DROP POLICY IF EXISTS "Coreos: bailarino vê as aprovadas"            ON choreographies;

DROP POLICY IF EXISTS "Dancers can manage own inscriptions"          ON inscriptions;
DROP POLICY IF EXISTS "Directors can manage school inscriptions"     ON inscriptions;
DROP POLICY IF EXISTS "Inscrições: bailarino gerencia as suas"       ON inscriptions;
DROP POLICY IF EXISTS "Inscrições: diretor gerencia via coreografia" ON inscriptions;
DROP POLICY IF EXISTS "Inscrições: organizador vê do seu festival"   ON inscriptions;

DROP POLICY IF EXISTS "Delegações: organizador vê as do seu festival"     ON delegations;
DROP POLICY IF EXISTS "Delegações: organizador atualiza status"           ON delegations;
DROP POLICY IF EXISTS "Delegações: diretor vê as suas"                    ON delegations;
DROP POLICY IF EXISTS "Delegações: diretor cria"                          ON delegations;
DROP POLICY IF EXISTS "Delegações: diretor atualiza rascunhos/submetidas" ON delegations;

DROP POLICY IF EXISTS "Faturas: bailarino cria a sua"                ON invoices;
DROP POLICY IF EXISTS "Faturas: diretor cria para escola"            ON invoices;
DROP POLICY IF EXISTS "Itens de fatura: dono da fatura cria"         ON invoice_items;

-- ── 10. RLS: festivals ────────────────────────────────────────

CREATE POLICY "Festivals: owner vê tudo, público vê não-rascunhos" ON festivals
    FOR SELECT USING (
        organizer_id = auth.uid()
        OR status NOT IN ('draft', 'cancelled')
    );
CREATE POLICY "Festivals: organizadores criam" ON festivals
    FOR INSERT WITH CHECK (organizer_id = auth.uid());
CREATE POLICY "Festivals: organizadores atualizam os seus" ON festivals
    FOR UPDATE USING (organizer_id = auth.uid());
CREATE POLICY "Festivals: organizadores deletam rascunhos" ON festivals
    FOR DELETE USING (organizer_id = auth.uid() AND status = 'draft');

-- ── 11. RLS: festival_categories (só se tabela existir) ───────

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'festival_categories'
  ) THEN
    RAISE NOTICE 'festival_categories não existe — pulando políticas RLS.';
    RETURN;
  END IF;

  EXECUTE $x$
    CREATE POLICY "Categorias: visíveis conforme festival" ON festival_categories
      FOR SELECT USING (
        festival_id IN (
          SELECT id FROM festivals
          WHERE organizer_id = auth.uid() OR status NOT IN ('draft', 'cancelled')
        )
      )
  $x$;

  EXECUTE $x$
    CREATE POLICY "Categorias: organizadores gerenciam as suas" ON festival_categories
      FOR ALL USING (
        festival_id IN (SELECT id FROM festivals WHERE organizer_id = auth.uid())
      )
  $x$;
END $$;

-- ── 12. RLS: delegations ─────────────────────────────────────

CREATE POLICY "Delegações: organizador vê as do seu festival" ON delegations
    FOR SELECT USING (
        festival_id IN (SELECT id FROM festivals WHERE organizer_id = auth.uid())
    );
CREATE POLICY "Delegações: organizador atualiza status" ON delegations
    FOR UPDATE USING (
        festival_id IN (SELECT id FROM festivals WHERE organizer_id = auth.uid())
    );
CREATE POLICY "Delegações: diretor vê as suas" ON delegations
    FOR SELECT USING (director_id = auth.uid());
CREATE POLICY "Delegações: diretor cria" ON delegations
    FOR INSERT WITH CHECK (
        director_id = auth.uid()
        AND school_id IN (SELECT id FROM schools WHERE director_id = auth.uid())
    );
CREATE POLICY "Delegações: diretor atualiza rascunhos/submetidas" ON delegations
    FOR UPDATE USING (
        director_id = auth.uid() AND status IN ('draft', 'submitted')
    );

-- ── 13. RLS: choreographies ───────────────────────────────────

CREATE POLICY "Coreos: diretor gerencia via delegação" ON choreographies
    FOR ALL USING (
        delegation_id IN (SELECT id FROM delegations WHERE director_id = auth.uid())
    );
CREATE POLICY "Coreos: organizador vê do seu festival" ON choreographies
    FOR SELECT USING (
        delegation_id IN (
            SELECT d.id FROM delegations d
            JOIN festivals f ON f.id = d.festival_id
            WHERE f.organizer_id = auth.uid()
        )
    );
CREATE POLICY "Coreos: bailarino vê as aprovadas" ON choreographies
    FOR SELECT USING (
        id IN (
            SELECT choreography_id FROM inscriptions
            WHERE dancer_id = auth.uid() AND school_status = 'approved'
        )
    );

-- ── 14. RLS: inscriptions ─────────────────────────────────────

CREATE POLICY "Inscrições: bailarino gerencia as suas" ON inscriptions
    FOR ALL USING (dancer_id = auth.uid());
CREATE POLICY "Inscrições: diretor gerencia via coreografia" ON inscriptions
    FOR ALL USING (
        choreography_id IN (
            SELECT c.id FROM choreographies c
            JOIN delegations d ON d.id = c.delegation_id
            WHERE d.director_id = auth.uid()
        )
    );
CREATE POLICY "Inscrições: organizador vê do seu festival" ON inscriptions
    FOR SELECT USING (
        choreography_id IN (
            SELECT c.id FROM choreographies c
            JOIN delegations d ON d.id = c.delegation_id
            JOIN festivals f ON f.id = d.festival_id
            WHERE f.organizer_id = auth.uid()
        )
    );

-- ── 15. RLS: invoices + invoice_items ────────────────────────

CREATE POLICY "Faturas: bailarino cria a sua" ON invoices
    FOR INSERT WITH CHECK (dancer_id = auth.uid());
CREATE POLICY "Faturas: diretor cria para escola" ON invoices
    FOR INSERT WITH CHECK (
        school_id IN (SELECT id FROM schools WHERE director_id = auth.uid())
    );
CREATE POLICY "Itens de fatura: dono da fatura cria" ON invoice_items
    FOR INSERT WITH CHECK (
        invoice_id IN (
            SELECT id FROM invoices
            WHERE dancer_id = auth.uid()
               OR school_id IN (SELECT id FROM schools WHERE director_id = auth.uid())
        )
    );
