-- ============================================================
-- Migration: Festival Engine Core
-- Motor central: enums, delegações, enriquecimento + RLS
-- ============================================================

-- ── Novos Enums ─────────────────────────────────────────────

CREATE TYPE festival_status AS ENUM (
    'draft',
    'published',
    'registration_open',
    'registration_closed',
    'active',
    'finished',
    'cancelled'
);

CREATE TYPE category_modality AS ENUM (
    'classical',
    'contemporary',
    'jazz',
    'urban',
    'folk',
    'battle',
    'freestyle',
    'show'
);

CREATE TYPE formation_type AS ENUM (
    'solo',
    'duo',
    'trio',
    'mini_group',
    'group',
    'large_group'
);

CREATE TYPE delegation_status AS ENUM (
    'draft',
    'submitted',
    'approved',
    'rejected',
    'suspended'
);

CREATE TYPE choreography_status AS ENUM (
    'draft',
    'pending_audio',
    'audio_submitted',
    'approved',
    'rejected',
    'withdrawn'
);

-- ── 1. Enriquecer: festivals ─────────────────────────────────

ALTER TABLE festivals
    ADD COLUMN status festival_status NOT NULL DEFAULT 'draft',
    ADD COLUMN city TEXT,
    ADD COLUMN state TEXT,
    ADD COLUMN venue_name TEXT,
    ADD COLUMN cover_image_url TEXT,
    ADD COLUMN rules_url TEXT,
    ADD COLUMN max_delegations INTEGER,
    ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- ── 2. Renomear + Enriquecer: categories → festival_categories

ALTER TABLE categories RENAME TO festival_categories;

ALTER TABLE festival_categories
    ADD COLUMN modality category_modality NOT NULL DEFAULT 'classical',
    ADD COLUMN formation formation_type NOT NULL DEFAULT 'solo',
    ADD COLUMN min_dancers INTEGER NOT NULL DEFAULT 1,
    ADD COLUMN max_dancers INTEGER NOT NULL DEFAULT 1,
    ADD COLUMN min_age INTEGER,
    ADD COLUMN max_age INTEGER,
    ADD COLUMN max_duration_seconds_strict BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN is_competitive BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN inscription_fee_per_dancer DECIMAL(10,2) NOT NULL DEFAULT 0,
    ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE festival_categories
    ADD CONSTRAINT chk_dancer_count CHECK (min_dancers <= max_dancers AND min_dancers >= 1);

-- ── 3. NOVA TABELA: delegations ──────────────────────────────
-- Âncora de participação de uma escola em um festival específico.
-- Todas as coreografias e faturas do par escola+festival passam por aqui.

CREATE TABLE delegations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    festival_id UUID REFERENCES festivals(id) ON DELETE CASCADE NOT NULL,
    school_id   UUID REFERENCES schools(id) ON DELETE CASCADE NOT NULL,
    director_id UUID REFERENCES profiles(id) NOT NULL,
    -- director_id denormalizado para evitar JOIN extra nas políticas RLS

    status delegation_status NOT NULL DEFAULT 'draft',

    bus_spots_requested   INTEGER NOT NULL DEFAULT 0,
    hotel_spots_requested INTEGER NOT NULL DEFAULT 0,
    logistics_notes TEXT,

    total_due  DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_paid DECIMAL(10,2) NOT NULL DEFAULT 0,

    enrolled_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    submitted_at TIMESTAMPTZ,
    approved_at  TIMESTAMPTZ,
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(festival_id, school_id)
);

ALTER TABLE delegations ENABLE ROW LEVEL SECURITY;

-- ── 4. Migrar: choreographies → referenciam delegations ──────

ALTER TABLE choreographies
    ADD COLUMN delegation_id UUID REFERENCES delegations(id) ON DELETE CASCADE,
    ADD COLUMN status choreography_status NOT NULL DEFAULT 'draft',
    ADD COLUMN performance_order INTEGER,
    ADD COLUMN audio_validated_at TIMESTAMPTZ,
    ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Em ambiente MVP (DB limpo), tornar delegation_id obrigatório e remover school_id
-- Em produção com dados: popular delegation_id antes de executar as duas linhas abaixo
ALTER TABLE choreographies ALTER COLUMN delegation_id SET NOT NULL;
ALTER TABLE choreographies DROP COLUMN school_id;

-- ── 5. Enriquecer: inscriptions ──────────────────────────────

ALTER TABLE inscriptions
    ADD COLUMN payment_lock BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN payment_lock_reason TEXT,
    ADD COLUMN checked_in_at TIMESTAMPTZ,
    ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- ── 6. Índices de Performance ────────────────────────────────

CREATE INDEX idx_festivals_status ON festivals(status);
CREATE INDEX idx_festivals_organizer_id ON festivals(organizer_id);

CREATE INDEX idx_festival_categories_festival_id ON festival_categories(festival_id);

CREATE INDEX idx_delegations_festival_id ON delegations(festival_id);
CREATE INDEX idx_delegations_school_id ON delegations(school_id);
CREATE INDEX idx_delegations_director_id ON delegations(director_id);
CREATE INDEX idx_delegations_status ON delegations(status);

CREATE INDEX idx_choreographies_delegation_id ON choreographies(delegation_id);
CREATE INDEX idx_choreographies_category_id ON choreographies(category_id);

CREATE INDEX idx_inscriptions_choreography_id ON inscriptions(choreography_id);
CREATE INDEX idx_inscriptions_dancer_id ON inscriptions(dancer_id);
CREATE INDEX idx_inscriptions_payment_lock ON inscriptions(payment_lock) WHERE payment_lock = TRUE;

-- ── 7. Remover políticas obsoletas ───────────────────────────

DROP POLICY IF EXISTS "Categories viewable by everyone" ON festival_categories;
DROP POLICY IF EXISTS "Organizers can manage categories" ON festival_categories;
DROP POLICY IF EXISTS "Festivals are viewable by everyone" ON festivals;
DROP POLICY IF EXISTS "Organizers can manage own festivals" ON festivals;
DROP POLICY IF EXISTS "Directors can manage their choreographies" ON choreographies;
DROP POLICY IF EXISTS "Dancers can view their choreographies" ON choreographies;
DROP POLICY IF EXISTS "Dancers can manage own inscriptions" ON inscriptions;
DROP POLICY IF EXISTS "Directors can manage school inscriptions" ON inscriptions;

-- ── 8. RLS: festivals ────────────────────────────────────────

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

-- ── 9. RLS: festival_categories ─────────────────────────────

CREATE POLICY "Categorias: visíveis conforme festival" ON festival_categories
    FOR SELECT USING (
        festival_id IN (
            SELECT id FROM festivals
            WHERE organizer_id = auth.uid() OR status NOT IN ('draft', 'cancelled')
        )
    );

CREATE POLICY "Categorias: organizadores gerenciam as suas" ON festival_categories
    FOR ALL USING (
        festival_id IN (SELECT id FROM festivals WHERE organizer_id = auth.uid())
    );

-- ── 10. RLS: delegations ─────────────────────────────────────

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
        director_id = auth.uid()
        AND status IN ('draft', 'submitted')
    );

-- ── 11. RLS: choreographies ──────────────────────────────────

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

-- ── 12. RLS: inscriptions ────────────────────────────────────

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

-- ── 13. RLS: invoices (políticas de escrita faltantes) ───────

CREATE POLICY "Faturas: bailarino cria a sua" ON invoices
    FOR INSERT WITH CHECK (dancer_id = auth.uid());

CREATE POLICY "Faturas: diretor cria para escola" ON invoices
    FOR INSERT WITH CHECK (
        school_id IN (SELECT id FROM schools WHERE director_id = auth.uid())
    );

-- ── 14. RLS: invoice_items (políticas de escrita faltantes) ──

CREATE POLICY "Itens de fatura: dono da fatura cria" ON invoice_items
    FOR INSERT WITH CHECK (
        invoice_id IN (
            SELECT id FROM invoices
            WHERE dancer_id = auth.uid()
               OR school_id IN (SELECT id FROM schools WHERE director_id = auth.uid())
        )
    );
