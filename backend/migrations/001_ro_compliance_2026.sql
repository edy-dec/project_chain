-- ============================================================
-- Migrare: conformitate legislatie romana 2026
-- Ruleaza INAINTE de prima pornire a serverului cu noile modele.
-- PostgreSQL 12+
-- ============================================================

-- ------------------------------------------------------------
-- 1. Tabela salaries — campuri noi
-- ------------------------------------------------------------
ALTER TABLE salaries
  ADD COLUMN IF NOT EXISTS cam_amount        DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cas_amount        DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cass_amount       DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS holiday_indemnity DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS holiday_days      INTEGER       DEFAULT 0;

-- Backfill: cam_amount din social_contributions existente (estimat)
-- social_contributions contine CAS(25%) + CASS(10%) = 35% din gross.
-- CAM = 2.25% din gross. gross = social_contributions / 0.35
UPDATE salaries
SET
  cam_amount  = ROUND((gross_salary * 0.0225)::numeric, 2),
  cas_amount  = ROUND((gross_salary * 0.25)::numeric, 2),
  cass_amount = ROUND((gross_salary * 0.10)::numeric, 2)
WHERE cam_amount = 0;

-- ------------------------------------------------------------
-- 2. Tabela leaves — adauga valori noi in enum
-- PostgreSQL nu permite ADD VALUE in tranzactie cu date existente.
-- Executat separat, in afara oricarui BEGIN/COMMIT explicit.
-- ------------------------------------------------------------
DO $$ BEGIN
  BEGIN ALTER TYPE "enum_leaves_type" ADD VALUE IF NOT EXISTS 'parental'; EXCEPTION WHEN duplicate_object THEN null; END;
  BEGIN ALTER TYPE "enum_leaves_type" ADD VALUE IF NOT EXISTS 'study';    EXCEPTION WHEN duplicate_object THEN null; END;
END $$;

-- ------------------------------------------------------------
-- 3. Tabela users — campuri noi
-- ------------------------------------------------------------
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS fiscal_exemption VARCHAR(30) DEFAULT NULL,
  ADD CONSTRAINT IF NOT EXISTS users_fiscal_exemption_check
    CHECK (fiscal_exemption IN ('it','construction','agriculture','disability'));

-- Resetam sick_leave_balance la 0 (concediul medical nu mai foloseste sold fix)
-- ATENTIE: comentati linia de mai jos daca vreti sa pastrati valorile istorice
-- UPDATE users SET sick_leave_balance = 0 WHERE sick_leave_balance > 0;

-- ------------------------------------------------------------
-- 4. Tabela noua: legal_holidays
-- (creata automat de sequelize.sync dar inclusa si aici pentru migrari manuale)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS legal_holidays (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  holiday_date  DATE         NOT NULL,
  name          VARCHAR(150) NOT NULL,
  country       CHAR(2)      NOT NULL DEFAULT 'RO',
  is_recurring  BOOLEAN      NOT NULL DEFAULT true,
  valid_from    DATE         NOT NULL DEFAULT '2000-01-01',
  valid_until   DATE,
  created_at    TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMP    NOT NULL DEFAULT NOW(),
  UNIQUE (holiday_date, country)
);

-- ------------------------------------------------------------
-- 5. Tabela noua: overtime_balance
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS overtime_balance (
  id                 UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  period_start       DATE         NOT NULL,
  expiration_date    DATE         NOT NULL,
  accumulated_hours  DECIMAL(6,2) NOT NULL DEFAULT 0,
  compensated_hours  DECIMAL(6,2) NOT NULL DEFAULT 0,
  paid_hours         DECIMAL(6,2) NOT NULL DEFAULT 0,
  created_at         TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMP    NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, period_start)
);

-- ------------------------------------------------------------
-- 6. Tabela noua: tax_rules
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tax_rules (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  country         CHAR(2)       NOT NULL DEFAULT 'RO',
  rule_type       VARCHAR(80)   NOT NULL,
  rate            DECIMAL(8,6),
  amount          DECIMAL(12,2),
  valid_from      DATE          NOT NULL,
  valid_until     DATE,
  notes           TEXT,
  created_at      TIMESTAMP     NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMP     NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tax_rules_lookup ON tax_rules (country, rule_type, valid_from);

-- ------------------------------------------------------------
-- 7. Tabela noua: leave_balance_history
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS leave_balance_history (
  id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  performed_by   UUID         REFERENCES users(id) ON DELETE SET NULL,
  leave_type     VARCHAR(30)  NOT NULL,
  change_amount  INTEGER      NOT NULL,
  balance_after  INTEGER      NOT NULL,
  reason         VARCHAR(255),
  created_at     TIMESTAMP    NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_leave_balance_history_user ON leave_balance_history (user_id, created_at DESC);
