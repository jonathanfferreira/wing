'use client'

import { useState } from 'react'
import { useFormStatus } from 'react-dom'
import { Plus, Trash2, ChevronDown, ChevronUp, Music2 } from 'lucide-react'
import { createFestival } from '@/app/actions/festivals'
import {
  MODALITY_LABEL,
  FORMATION_LABEL,
  FORMATION_DANCER_DEFAULTS,
  type CategoryModality,
  type FormationType,
} from '@/types/domain'

interface CategoryDraft {
  id: string
  name: string
  modality: CategoryModality
  formation: FormationType
  min_dancers: number
  max_dancers: number
  min_age: string
  max_age: string
  max_duration_seconds: number
  max_duration_seconds_strict: boolean
  base_fee: string
  inscription_fee_per_dancer: string
  is_competitive: boolean
  expanded: boolean
}

function newCategory(): CategoryDraft {
  return {
    id: crypto.randomUUID(),
    name: '',
    modality: 'classical',
    formation: 'solo',
    min_dancers: 1,
    max_dancers: 1,
    min_age: '',
    max_age: '',
    max_duration_seconds: 120,
    max_duration_seconds_strict: true,
    base_fee: '0',
    inscription_fee_per_dancer: '0',
    is_competitive: true,
    expanded: true,
  }
}

function Toggle({
  value,
  onChange,
  labelOn,
  labelOff,
}: {
  value: boolean
  onChange: (v: boolean) => void
  labelOn: string
  labelOff: string
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          value ? 'bg-primary' : 'bg-gray-700'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            value ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
      <span className="text-xs text-gray-400">{value ? labelOn : labelOff}</span>
    </div>
  )
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="bg-gradient-neon rounded-md px-8 py-3 text-white font-bold uppercase tracking-wider font-display hover:opacity-90 transition-opacity shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {pending ? 'Salvando…' : 'Salvar como Rascunho'}
    </button>
  )
}

export function FestivalForm({ error }: { error?: string }) {
  const [categories, setCategories] = useState<CategoryDraft[]>([])

  const addCategory = () => setCategories((prev) => [...prev, newCategory()])

  const removeCategory = (id: string) =>
    setCategories((prev) => prev.filter((c) => c.id !== id))

  const toggleExpand = (id: string) =>
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, expanded: !c.expanded } : c))
    )

  const update = (id: string, patch: Partial<CategoryDraft>) =>
    setCategories((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c
        const next = { ...c, ...patch }
        if (patch.formation) {
          const d = FORMATION_DANCER_DEFAULTS[patch.formation]
          next.min_dancers = d.min
          next.max_dancers = d.max
        }
        return next
      })
    )

  const serialized = JSON.stringify(
    categories.map(({ id: _id, expanded: _exp, ...rest }) => rest)
  )

  return (
    <form action={createFestival} className="space-y-10">
      <input type="hidden" name="categories" value={serialized} />

      {error && (
        <div className="p-4 bg-red-900/30 border border-red-500/50 text-red-200 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* ── 1. Identidade ──────────────────────────────────── */}
      <section className="space-y-5">
        <h2 className="text-sm font-heading text-white border-b border-gray-800 pb-2 tracking-wider">
          1 — Identidade do Festival
        </h2>

        <div className="space-y-1.5">
          <label className="label-field" htmlFor="name">
            Nome do Evento
          </label>
          <input
            required
            name="name"
            id="name"
            className="input-field"
            placeholder="Ex: Wing Dance Festival 2026"
          />
        </div>

        <div className="space-y-1.5">
          <label className="label-field" htmlFor="description">
            Descrição / Edital Resumido
          </label>
          <textarea
            required
            name="description"
            id="description"
            rows={4}
            className="input-field resize-none"
            placeholder="Descreva o propósito do festival, estilos aceitos e regras principais."
          />
        </div>
      </section>

      {/* ── 2. Local ───────────────────────────────────────── */}
      <section className="space-y-5">
        <h2 className="text-sm font-heading text-white border-b border-gray-800 pb-2 tracking-wider">
          2 — Local
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1 space-y-1.5">
            <label className="label-field" htmlFor="venue_name">
              Nome do Espaço / Teatro
            </label>
            <input
              name="venue_name"
              id="venue_name"
              className="input-field"
              placeholder="Ex: Teatro Municipal"
            />
          </div>
          <div className="space-y-1.5">
            <label className="label-field" htmlFor="city">
              Cidade
            </label>
            <input name="city" id="city" className="input-field" placeholder="São Paulo" />
          </div>
          <div className="space-y-1.5">
            <label className="label-field" htmlFor="state">
              Estado (UF)
            </label>
            <input
              name="state"
              id="state"
              maxLength={2}
              className="input-field uppercase"
              placeholder="SP"
            />
          </div>
        </div>
      </section>

      {/* ── 3. Cronograma ──────────────────────────────────── */}
      <section className="space-y-5">
        <h2 className="text-sm font-heading text-white border-b border-gray-800 pb-2 tracking-wider">
          3 — Cronograma
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="label-field" htmlFor="start_date">
              Início do Evento
            </label>
            <input
              required
              type="date"
              name="start_date"
              id="start_date"
              className="input-field [color-scheme:dark]"
            />
          </div>
          <div className="space-y-1.5">
            <label className="label-field" htmlFor="end_date">
              Encerramento do Evento
            </label>
            <input
              required
              type="date"
              name="end_date"
              id="end_date"
              className="input-field [color-scheme:dark]"
            />
          </div>
          <div className="space-y-1.5">
            <label className="label-field" htmlFor="registration_deadline">
              Prazo de Inscrições de Escolas
            </label>
            <input
              required
              type="datetime-local"
              name="registration_deadline"
              id="registration_deadline"
              className="input-field [color-scheme:dark]"
            />
          </div>
          <div className="space-y-1.5">
            <label className="label-field" htmlFor="payment_cutoff_date">
              Corte de Pagamentos
            </label>
            <input
              required
              type="datetime-local"
              name="payment_cutoff_date"
              id="payment_cutoff_date"
              className="input-field [color-scheme:dark]"
            />
          </div>
        </div>

        <div className="space-y-1.5 max-w-xs">
          <label className="label-field" htmlFor="max_delegations">
            Limite de Escolas (opcional)
          </label>
          <input
            type="number"
            name="max_delegations"
            id="max_delegations"
            min={1}
            className="input-field"
            placeholder="Deixe vazio para ilimitado"
          />
        </div>
      </section>

      {/* ── 4. Categorias ──────────────────────────────────── */}
      <section className="space-y-5">
        <div className="flex items-center justify-between border-b border-gray-800 pb-2">
          <h2 className="text-sm font-heading text-white tracking-wider">
            4 — Categorias de Competição
          </h2>
          <button
            type="button"
            onClick={addCategory}
            className="inline-flex items-center text-xs font-bold uppercase tracking-wider text-secondary border border-secondary/40 hover:bg-secondary/10 px-3 py-1.5 rounded-md transition-colors"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Adicionar
          </button>
        </div>

        {categories.length === 0 && (
          <div className="border border-dashed border-gray-700 rounded-xl p-8 text-center">
            <Music2 className="w-8 h-8 text-gray-600 mx-auto mb-3" />
            <p className="text-sm text-gray-500">
              Nenhuma categoria adicionada ainda.
            </p>
            <p className="text-xs text-gray-600 mt-1">
              Você pode adicionar categorias após criar o festival.
            </p>
          </div>
        )}

        <div className="space-y-3">
          {categories.map((cat, index) => (
            <div
              key={cat.id}
              className="border border-gray-800 rounded-xl overflow-hidden"
            >
              {/* Header */}
              <div
                className="flex items-center justify-between px-4 py-3 bg-black/40 cursor-pointer hover:bg-white/5 transition-colors"
                onClick={() => toggleExpand(cat.id)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-6 h-6 flex-shrink-0 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-xs font-bold text-primary">
                    {index + 1}
                  </span>
                  <span className="font-medium text-sm truncate">
                    {cat.name || (
                      <span className="text-gray-500 italic">Categoria sem nome</span>
                    )}
                  </span>
                  {cat.name && (
                    <span className="hidden md:inline flex-shrink-0 text-xs text-gray-500 bg-gray-900 px-2 py-0.5 rounded">
                      {MODALITY_LABEL[cat.modality]} · {FORMATION_LABEL[cat.formation]}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      removeCategory(cat.id)
                    }}
                    className="p-1.5 text-gray-600 hover:text-red-400 transition-colors rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  {cat.expanded ? (
                    <ChevronUp className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  )}
                </div>
              </div>

              {/* Body */}
              {cat.expanded && (
                <div className="p-5 space-y-5 border-t border-gray-800">
                  {/* Nome + Modalidade */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="label-field">Nome da Categoria</label>
                      <input
                        value={cat.name}
                        onChange={(e) => update(cat.id, { name: e.target.value })}
                        className="input-field"
                        placeholder="Ex: Ballet Clássico Solo Juvenil"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="label-field">Modalidade</label>
                      <select
                        value={cat.modality}
                        onChange={(e) =>
                          update(cat.id, { modality: e.target.value as CategoryModality })
                        }
                        className="input-field bg-black/50"
                      >
                        {(Object.entries(MODALITY_LABEL) as [CategoryModality, string][]).map(
                          ([v, l]) => (
                            <option key={v} value={v}>
                              {l}
                            </option>
                          )
                        )}
                      </select>
                    </div>
                  </div>

                  {/* Formação + Bailarinos */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="label-field">Formação</label>
                      <select
                        value={cat.formation}
                        onChange={(e) =>
                          update(cat.id, { formation: e.target.value as FormationType })
                        }
                        className="input-field bg-black/50"
                      >
                        {(Object.entries(FORMATION_LABEL) as [FormationType, string][]).map(
                          ([v, l]) => (
                            <option key={v} value={v}>
                              {l}
                            </option>
                          )
                        )}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="label-field">Mín. Bailarinos</label>
                      <input
                        type="number"
                        min={1}
                        value={cat.min_dancers}
                        onChange={(e) =>
                          update(cat.id, { min_dancers: parseInt(e.target.value) || 1 })
                        }
                        className="input-field"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="label-field">Máx. Bailarinos</label>
                      <input
                        type="number"
                        min={1}
                        value={cat.max_dancers}
                        onChange={(e) =>
                          update(cat.id, { max_dancers: parseInt(e.target.value) || 1 })
                        }
                        className="input-field"
                      />
                    </div>
                  </div>

                  {/* Idades + Duração */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-1.5">
                      <label className="label-field">Idade Mín.</label>
                      <input
                        type="number"
                        min={0}
                        value={cat.min_age}
                        onChange={(e) => update(cat.id, { min_age: e.target.value })}
                        className="input-field"
                        placeholder="Livre"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="label-field">Idade Máx.</label>
                      <input
                        type="number"
                        min={0}
                        value={cat.max_age}
                        onChange={(e) => update(cat.id, { max_age: e.target.value })}
                        className="input-field"
                        placeholder="Livre"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="label-field">Duração Máx. (s)</label>
                      <input
                        type="number"
                        min={10}
                        value={cat.max_duration_seconds}
                        onChange={(e) =>
                          update(cat.id, {
                            max_duration_seconds: parseInt(e.target.value) || 120,
                          })
                        }
                        className="input-field"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="label-field">Corte de Áudio</label>
                      <div className="h-[46px] flex items-center">
                        <Toggle
                          value={cat.max_duration_seconds_strict}
                          onChange={(v) =>
                            update(cat.id, { max_duration_seconds_strict: v })
                          }
                          labelOn="Corta"
                          labelOff="Avisa"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Taxas + Tipo */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="label-field">Taxa Base / Coreografia (R$)</label>
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={cat.base_fee}
                        onChange={(e) => update(cat.id, { base_fee: e.target.value })}
                        className="input-field"
                        placeholder="0,00"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="label-field">Taxa por Bailarino (R$)</label>
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={cat.inscription_fee_per_dancer}
                        onChange={(e) =>
                          update(cat.id, { inscription_fee_per_dancer: e.target.value })
                        }
                        className="input-field"
                        placeholder="0,00"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="label-field">Modalidade da Categoria</label>
                      <div className="h-[46px] flex items-center">
                        <Toggle
                          value={cat.is_competitive}
                          onChange={(v) => update(cat.id, { is_competitive: v })}
                          labelOn="Competitiva"
                          labelOff="Exibição"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── Submit ─────────────────────────────────────────── */}
      <div className="pt-6 border-t border-gray-800 flex flex-col sm:flex-row justify-end gap-3">
        <a
          href="/organizer/festivals"
          className="px-6 py-3 text-sm font-bold uppercase tracking-wider text-gray-400 hover:text-white transition-colors text-center"
        >
          Cancelar
        </a>
        <SubmitButton />
      </div>
    </form>
  )
}
