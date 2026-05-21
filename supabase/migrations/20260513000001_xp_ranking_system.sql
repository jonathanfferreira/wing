-- Migration: Sistema de XP e Ranking para dançarinos de festivais
-- Criada: 2026-05-13

-- ============================================
-- 1. COLUNA XP EM PROFILES
-- ============================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS xp INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS level INTEGER NOT NULL DEFAULT 1;

-- ============================================
-- 2. TABELA XP_TRANSACTIONS
-- ============================================

CREATE TYPE xp_reason AS ENUM (
  'inscription_approved',
  'festival_completed',
  'judge_score_bonus',
  'streak_bonus',
  'admin_grant'
);

CREATE TABLE IF NOT EXISTS public.xp_transactions (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dancer_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  festival_id UUID REFERENCES public.festivals(id) ON DELETE SET NULL,
  reason      xp_reason NOT NULL,
  amount      INTEGER NOT NULL CHECK (amount <> 0),
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.xp_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dancers can view own xp_transactions"
  ON public.xp_transactions FOR SELECT
  USING (auth.uid() = dancer_id);

CREATE POLICY "Admins can insert xp_transactions"
  ON public.xp_transactions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE INDEX IF NOT EXISTS idx_xp_transactions_dancer_id
  ON public.xp_transactions(dancer_id);

CREATE INDEX IF NOT EXISTS idx_xp_transactions_festival_id
  ON public.xp_transactions(festival_id);

CREATE INDEX IF NOT EXISTS idx_profiles_xp
  ON public.profiles(xp DESC);

-- ============================================
-- 3. TABELA DANCER_STREAKS
-- ============================================

CREATE TABLE IF NOT EXISTS public.dancer_streaks (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dancer_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  current_streak  INTEGER NOT NULL DEFAULT 0,
  longest_streak  INTEGER NOT NULL DEFAULT 0,
  last_festival_id UUID REFERENCES public.festivals(id) ON DELETE SET NULL,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (dancer_id)
);

ALTER TABLE public.dancer_streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dancers can view own streak"
  ON public.dancer_streaks FOR SELECT
  USING (auth.uid() = dancer_id);

CREATE POLICY "Everyone can view all streaks"
  ON public.dancer_streaks FOR SELECT
  USING (true);

CREATE INDEX IF NOT EXISTS idx_dancer_streaks_dancer_id
  ON public.dancer_streaks(dancer_id);

-- ============================================
-- 4. VIEW: RANKING GLOBAL (top 100 por XP)
-- ============================================

CREATE OR REPLACE VIEW public.ranking_global AS
SELECT
  p.id                                                AS dancer_id,
  p.full_name,
  p.xp,
  p.level,
  COALESCE(ds.current_streak, 0)                     AS current_streak,
  COALESCE(ds.longest_streak, 0)                     AS longest_streak,
  RANK() OVER (ORDER BY p.xp DESC)                   AS rank,
  GREATEST(1, FLOOR(p.xp::NUMERIC / 1000)::INTEGER)  AS xp_level
FROM public.profiles p
LEFT JOIN public.dancer_streaks ds ON ds.dancer_id = p.id
WHERE p.role = 'dancer'
ORDER BY p.xp DESC
LIMIT 100;

-- ============================================
-- 5. VIEW: RANKING POR FESTIVAL
-- ============================================

CREATE OR REPLACE VIEW public.ranking_by_festival AS
SELECT
  f.id                                              AS festival_id,
  f.name                                            AS festival_name,
  p.id                                              AS dancer_id,
  p.full_name,
  p.xp,
  COUNT(DISTINCT i.id)                              AS total_inscriptions,
  COUNT(DISTINCT i.id) FILTER (
    WHERE i.school_status = 'approved'
  )                                                 AS approved_inscriptions,
  SUM(
    COALESCE(xt.amount, 0)
  ) FILTER (
    WHERE xt.festival_id = f.id
  )                                                 AS festival_xp_earned,
  RANK() OVER (
    PARTITION BY f.id
    ORDER BY
      COUNT(DISTINCT i.id) FILTER (WHERE i.school_status = 'approved') DESC,
      p.xp DESC
  )                                                 AS festival_rank
FROM public.festivals f
JOIN public.choreographies ch   ON ch.category_id IN (
  SELECT id FROM public.festival_categories WHERE festival_id = f.id
)
JOIN public.inscriptions i       ON i.choreography_id = ch.id
JOIN public.profiles p           ON p.id = i.dancer_id
LEFT JOIN public.xp_transactions xt ON xt.dancer_id = p.id AND xt.festival_id = f.id
GROUP BY f.id, f.name, p.id, p.full_name, p.xp;

-- ============================================
-- 6. FUNÇÃO: conceder XP e recalcular level
-- ============================================

CREATE OR REPLACE FUNCTION public.grant_xp(
  p_dancer_id   UUID,
  p_festival_id UUID,
  p_reason      xp_reason,
  p_amount      INTEGER,
  p_description TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Inserir transação
  INSERT INTO public.xp_transactions (dancer_id, festival_id, reason, amount, description)
  VALUES (p_dancer_id, p_festival_id, p_reason, p_amount, p_description);

  -- Atualizar XP e recalcular level no perfil
  UPDATE public.profiles
  SET
    xp    = GREATEST(0, xp + p_amount),
    level = GREATEST(1, FLOOR((GREATEST(0, xp + p_amount))::NUMERIC / 1000)::INTEGER)
  WHERE id = p_dancer_id;
END;
$$;
