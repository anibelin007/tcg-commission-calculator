import { renderToStaticMarkup } from 'react-dom/server'
import { I18nextProvider } from 'react-i18next'
import { describe, expect, it } from 'vitest'
import { computeCommission, findMarket, type CommissionInput } from '../../domain/commission'
import { createAppI18n } from '../../i18n'
import { TargetAmountPanel } from './TargetAmountPanel'

async function render(input: CommissionInput, target: string) {
  const market = findMarket('ES')!
  const i18n = await createAppI18n('es-ES')
  return renderToStaticMarkup(
    <I18nextProvider i18n={i18n}>
      <TargetAmountPanel input={input} market={market} current={computeCommission(input, market)} initialTarget={target} />
    </I18nextProvider>,
  ).replace(/ | /g, ' ')
}

const example: CommissionInput = { customerTurnover: 600, generationVolumes: [900, 700], teamVolumes: [1000, 600] }

describe('TargetAmountPanel (PF-03, own route)', () => {
  it('shows the extra own CT for a target, landing on the level jump', async () => {
    expect(await render(example, '600')).toContain('Necesitarías 225 puntos de VC más (VC total 825): meta 3, comisión estimada 602,91 €.')
  })

  it('says when the target is already reached', async () => {
    expect(await render(example, '100')).toContain('Con tus puntos actuales ya llegas')
  })

  it('shows nothing until a target is entered, and never promises earnings (BR-21)', async () => {
    const html = await render(example, '')
    expect(html).not.toContain('Necesitarías')
    expect(await render(example, '600')).not.toMatch(/ganarás|vas a ganar/i)
  })
})
