import { Button } from '@anibelin007/tcg-ui'
import { useTranslation } from 'react-i18next'
import { MAX_GENERATION_FIELDS, parsePoints, type FieldId, type TeamDraft } from './form-model'
import { formatPoints } from './format'
import { NumberField } from './NumberField'

interface TeamCardProps {
  team: TeamDraft
  index: number
  invalid: readonly FieldId[]
  onChange: (team: TeamDraft) => void
  onRemove: () => void
}

/** One team (*pata*): points per generation, generation 1 being the direct partner. */
export function TeamCard({ team, index, invalid, onChange, onRemove }: TeamCardProps) {
  const { t, i18n } = useTranslation('calculator')
  const number = index + 1
  const volume = team.generations.reduce((total, raw) => total + (parsePoints(raw) ?? 0), 0)
  const setGeneration = (generationIndex: number, value: string) =>
    onChange({ ...team, generations: team.generations.map((raw, i) => (i === generationIndex ? value : raw)) })

  return (
    <section className="flex flex-col gap-4 rounded border border-tcg-surface-strong bg-white p-4" aria-label={t('teams.team', { number })}>
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-lg">{t('teams.team', { number })}</h3>
        <button type="button" onClick={onRemove} className="text-sm font-semibold text-tcg-primary underline">
          {t('teams.removeTeam', { number })}
        </button>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {team.generations.map((raw, generationIndex) => {
          const deep = generationIndex === MAX_GENERATION_FIELDS - 1
          return (
            <NumberField
              key={generationIndex}
              label={deep ? t('teams.deepGenerations') : t('teams.generation', { number: generationIndex + 1 })}
              help={deep ? t('teams.deepGenerationsHelp') : undefined}
              value={raw}
              onChange={(value) => setGeneration(generationIndex, value)}
              error={invalid.includes(`team-${index}-generation-${generationIndex}`) ? t('invalid') : undefined}
            />
          )
        })}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm">{t('teams.teamVolume', { volume: formatPoints(i18n.language, volume) })}</p>
        {team.generations.length < MAX_GENERATION_FIELDS && (
          <Button variant="secondary" onClick={() => onChange({ ...team, generations: [...team.generations, ''] })}>
            {t('teams.addGeneration')}
          </Button>
        )}
      </div>
    </section>
  )
}
