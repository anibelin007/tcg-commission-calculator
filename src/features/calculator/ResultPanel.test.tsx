import { renderToStaticMarkup } from 'react-dom/server'
import { I18nextProvider } from 'react-i18next'
import { describe, expect, it } from 'vitest'
import { computeCommission, findMarket, type CommissionInput } from '../../domain/commission'
import { createAppI18n } from '../../i18n'
import { ResultPanel } from './ResultPanel'

const GUIDE_TEAM: CommissionInput = {
  customerTurnover: 1000,
  teams: [{ generations: [700, 1000] }, { generations: [900, 900] }],
}

async function render(input: CommissionInput, marketId = 'ES', locale: 'es-ES' | 'en-GB' = 'es-ES') {
  const market = findMarket(marketId)!
  const i18n = await createAppI18n(locale)
  const html = renderToStaticMarkup(
    <I18nextProvider i18n={i18n}>
      <ResultPanel result={computeCommission(input, market)} market={market} />
    </I18nextProvider>,
  )
  return html.replace(/ | /g, ' ')
}

describe('ResultPanel', () => {
  it('shows level, breakdown, provisional limit and amount (TC-02 under D-005)', async () => {
    const html = await render(GUIDE_TEAM)
    expect(html).toContain('Meta 3')
    expect(html).toContain('Generación 2')
    expect(html).toContain('Tope de la pata más fuerte (pata 2: VE 1800, límite 1500)')
    expect(html).toContain('663,5')
    expect(html).toContain('875,82 €')
    expect(html).toContain('de forma provisional')
  })

  it('explains that there is no commission below level 1', async () => {
    const html = await render({ customerTurnover: 109, teams: [] })
    expect(html).toContain('no llegas a la meta 1')
    expect(html).not.toContain('Comisión estimada</span>')
  })

  it('reminds that small commissions are paid as a voucher (D-008)', async () => {
    expect(await render({ customerTurnover: 110, teams: [] })).toContain('se te pagará en forma de vale de descuento')
    expect(await render({ customerTurnover: 1000, teams: [] })).not.toContain('vale de descuento')
  })

  it('warns about the additional settlement in France, Italy, Switzerland and Mexico (BR-15)', async () => {
    expect(await render({ customerTurnover: 1000, teams: [] }, 'FR-vdi')).toContain('documento de liquidación por motivos fiscales')
    expect(await render({ customerTurnover: 1000, teams: [] }, 'ES')).not.toContain('motivos fiscales')
  })

  it('always shows the exceptions and bonuses notes (D-012)', async () => {
    const html = await render({ customerTurnover: 1000, teams: [] })
    expect(html).toContain('RINGANA only')
    expect(html).toContain('No incluye bonificaciones')
  })

  it('formats amounts in the market currency and the UI language', async () => {
    expect(await render({ customerTurnover: 1000, teams: [] }, 'GB', 'en-GB')).toContain('£431.73')
    expect(await render({ customerTurnover: 1000, teams: [] }, 'US', 'en-GB')).toContain('US$624.00')
  })
})
