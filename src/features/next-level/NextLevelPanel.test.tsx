import { renderToStaticMarkup } from 'react-dom/server'
import { I18nextProvider } from 'react-i18next'
import { describe, expect, it } from 'vitest'
import { computeCommission, findMarket, type CommissionInput } from '../../domain/commission'
import { createAppI18n } from '../../i18n'
import { NextLevelPanel } from './NextLevelPanel'

async function render(input: CommissionInput) {
  const market = findMarket('ES')!
  const i18n = await createAppI18n('es-ES')
  return renderToStaticMarkup(
    <I18nextProvider i18n={i18n}>
      <NextLevelPanel input={input} market={market} current={computeCommission(input, market)} />
    </I18nextProvider>,
  ).replace(/ | /g, ' ')
}

const solo = (ct: number): CommissionInput => ({ customerTurnover: ct, generationVolumes: [], teamVolumes: [] })

describe('NextLevelPanel', () => {
  it('shows what is missing for the next level and the commission there (PF-02)', async () => {
    const html = await render(solo(824))
    expect(html).toContain('Para llegar a la meta 3:')
    expect(html).toContain('VC: te faltan 1 puntos (necesitas 825)')
    expect(html).toContain('VE-1: te faltan 776 puntos (necesitas 1600)')
    expect(html).toContain('necesitarías 1 puntos de VC más (VC total 825)')
    expect(html).toContain('424,71 € (109,28 € más que ahora)')
    expect(html).toContain('no cuentan hasta el mes que viene')
  })

  it('never promises earnings (BR-21)', async () => {
    const html = await render(solo(824))
    expect(html).not.toMatch(/ganarás|vas a ganar/i)
  })

  it('says when the top level is reached', async () => {
    const top: CommissionInput = { customerTurnover: 660, generationVolumes: [270000], teamVolumes: [70000, 70000, 70000, 60000] }
    expect(await render(top)).toContain('Ya estás en la meta 10')
  })
})
