export type UserRole = 'admin' | 'organizer' | 'school_director' | 'dancer' | 'judge'

export type FestivalStatus =
  | 'draft'
  | 'published'
  | 'registration_open'
  | 'registration_closed'
  | 'active'
  | 'finished'
  | 'cancelled'

export type CategoryModality =
  | 'classical'
  | 'contemporary'
  | 'jazz'
  | 'urban'
  | 'folk'
  | 'battle'
  | 'freestyle'
  | 'show'

export type FormationType =
  | 'solo'
  | 'duo'
  | 'trio'
  | 'mini_group'
  | 'group'
  | 'large_group'

export type DelegationStatus = 'draft' | 'submitted' | 'approved' | 'rejected' | 'suspended'

export type ChoreographyStatus =
  | 'draft'
  | 'pending_audio'
  | 'audio_submitted'
  | 'approved'
  | 'rejected'
  | 'withdrawn'

export type InscriptionStatus = 'pending' | 'approved' | 'rejected'
export type FestivalDancerStatus = 'registered' | 'blocked_from_lineup'
export type InvoiceStatus = 'pending' | 'paid' | 'canceled' | 'overdue'
export type InvoiceItemType = 'festival_fee' | 'hotel' | 'bus' | 'costume' | 'other'

export interface Profile {
  id: string
  role: UserRole
  full_name: string
  phone: string | null
  created_at: string
}

export interface School {
  id: string
  director_id: string
  name: string
  city: string | null
  state: string | null
  created_at: string
}

export interface Festival {
  id: string
  organizer_id: string
  name: string
  description: string | null
  start_date: string
  end_date: string
  registration_deadline: string
  payment_cutoff_date: string
  status: FestivalStatus
  city: string | null
  state: string | null
  venue_name: string | null
  cover_image_url: string | null
  rules_url: string | null
  max_delegations: number | null
  created_at: string
  updated_at: string
}

export interface FestivalCategory {
  id: string
  festival_id: string
  name: string
  modality: CategoryModality
  formation: FormationType
  min_dancers: number
  max_dancers: number
  min_age: number | null
  max_age: number | null
  max_duration_seconds: number
  max_duration_seconds_strict: boolean
  base_fee: number
  inscription_fee_per_dancer: number
  is_competitive: boolean
  created_at: string
  updated_at: string
}

export interface Delegation {
  id: string
  festival_id: string
  school_id: string
  director_id: string
  status: DelegationStatus
  bus_spots_requested: number
  hotel_spots_requested: number
  logistics_notes: string | null
  total_due: number
  total_paid: number
  enrolled_at: string
  submitted_at: string | null
  approved_at: string | null
  updated_at: string
}

export interface Choreography {
  id: string
  delegation_id: string
  category_id: string
  name: string
  audio_url: string | null
  audio_duration_seconds: number | null
  status: ChoreographyStatus
  performance_order: number | null
  audio_validated_at: string | null
  created_at: string
  updated_at: string
}

export interface Inscription {
  id: string
  choreography_id: string
  dancer_id: string
  school_status: InscriptionStatus
  festival_status: FestivalDancerStatus
  costume_measurements: Record<string, unknown> | null
  payment_lock: boolean
  payment_lock_reason: string | null
  checked_in_at: string | null
  created_at: string
  updated_at: string
}

export interface Invoice {
  id: string
  dancer_id: string
  festival_id: string
  school_id: string
  status: InvoiceStatus
  total_amount: number
  stripe_payment_id: string | null
  due_date: string
  created_at: string
}

export interface InvoiceItem {
  id: string
  invoice_id: string
  description: string
  item_type: InvoiceItemType
  amount: number
  created_at: string
}

// ── Display helpers ──────────────────────────────────────────

export const FESTIVAL_STATUS_LABEL: Record<FestivalStatus, string> = {
  draft: 'Rascunho',
  published: 'Publicado',
  registration_open: 'Inscrições Abertas',
  registration_closed: 'Inscrições Encerradas',
  active: 'Em Andamento',
  finished: 'Encerrado',
  cancelled: 'Cancelado',
}

export const MODALITY_LABEL: Record<CategoryModality, string> = {
  classical: 'Ballet Clássico',
  contemporary: 'Contemporâneo',
  jazz: 'Jazz',
  urban: 'Urbano / Street',
  folk: 'Danças Folclóricas',
  battle: 'Batalha',
  freestyle: 'Freestyle',
  show: 'Show / Exibição',
}

export const FORMATION_LABEL: Record<FormationType, string> = {
  solo: 'Solo (1)',
  duo: 'Duo (2)',
  trio: 'Trio (3)',
  mini_group: 'Mini Grupo (4–6)',
  group: 'Grupo (4+)',
  large_group: 'Grande Grupo (7+)',
}

export const DELEGATION_STATUS_LABEL: Record<DelegationStatus, string> = {
  draft: 'Rascunho',
  submitted: 'Submetida',
  approved: 'Aprovada',
  rejected: 'Rejeitada',
  suspended: 'Suspensa',
}

export const FORMATION_DANCER_DEFAULTS: Record<FormationType, { min: number; max: number }> = {
  solo: { min: 1, max: 1 },
  duo: { min: 2, max: 2 },
  trio: { min: 3, max: 3 },
  mini_group: { min: 4, max: 6 },
  group: { min: 4, max: 12 },
  large_group: { min: 7, max: 30 },
}
