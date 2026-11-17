import { Button } from '@anibelin007/tcg-ui'
import { useTranslation } from 'react-i18next'
import type { FieldId, TeamDraft } from './form-model'
import { TeamCard } from './TeamCard'

interface TeamsEditorProps {
  teams: readonly TeamDraft[]
  invalid: readonly FieldId[]
  onChange: (teams: readonly TeamDraft[]) => void
  onAdd: () => void
}

export function TeamsEditor({ teams, invalid, onChange, onAdd }: TeamsEditorProps) {
  const { t } = useTranslation('calculator')
  return (
    <fieldset className="flex flex-col gap-4">
      <legend className="mb-2 text-xl font-semibold text-tcg-heading">{t('teams.legend')}</legend>
      <p className="text-sm">{t('teams.help')}</p>
      {teams.length === 0 && <p className="text-sm italic">{t('teams.empty')}</p>}
      {teams.map((team, index) => (
        <TeamCard
          key={team.key}
          team={team}
          index={index}
          invalid={invalid}
          onChange={(updated) => onChange(teams.map((candidate) => (candidate.key === team.key ? updated : candidate)))}
          onRemove={() => onChange(teams.filter((candidate) => candidate.key !== team.key))}
        />
      ))}
      <Button className="self-start" onClick={onAdd}>
        {t('teams.addTeam')}
      </Button>
    </fieldset>
  )
}
