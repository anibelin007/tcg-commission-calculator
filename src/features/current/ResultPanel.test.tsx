import { renderToStaticMarkup } from 'react-dom/server'
import { I18nextProvider } from 'react-i18next'
import { describe, expect, it } from 'vitest'
import { computeCommission, findMarket, type CommissionInput, type CommissionOptions } from '../../domain/commission'
import { createAppI18n } from '../../i18n'
import { ResultPanel } from './ResultPanel'

const GUIDE_TEAM: CommissionInput = {
  customerTurnover: 1000,
  generationVolumes: [1600, 1900],
  teamVolumes: [1700, 1800],
  strongestTeamGenerations: [900, 900],
}

const solo = (ct: number): CommissionInput => ({ customerTurnover: ct, generationVolumes: [], teamVolumes: [] })

async function render(input: CommissionInput, marketId = 'ES', locale: 'es-ES' | 'en-GB' = 'es-ES', options: CommissionOptions = {}) {
  const market = findMarket(marketId)!
  const i18n = await createAppI18n(locale)
  const html = renderToStaticMarkup(
    <I18nextProvider i18n={i18n}>
      <ResultPanel result={computeCommission(input, market, options)} market={market} legNames={input.teamVolumes.map((_, i) => (i === 1 ? 'Eva' : `Pata ${i + 1}`))} />
    </I18nextProvider>,
  )
  return html.replace(/ | /g, ' ')
}

describe('ResultPanel', () => {
  it('by default does not apply the limit (D-005): TC-02 gives the guideline amount, with a note', async () => {
    const html = await render(GUIDE_TEAM)
    expect(html).toContain('Meta 3')
    expect(html).toContain('909,48 €')
    expect(html).toContain('Todavía estamos confirmando')
    expect(html).not.toContain('Tope de la pata más fuerte (')
  })

  it('shows the limit row and the provisional note when a limit strategy is used', async () => {
    const html = await render(GUIDE_TEAM, 'ES', 'es-ES', { strongestTeamLimit: 'teamVolumeProportional' })
    expect(html).toContain('Meta 3')
    expect(html).toContain('Generación 2')
    expect(html).toContain('Tope de la pata más fuerte (Eva: VE 1800, límite 1500)')
    expect(html).toContain('663,5')
    expect(html).toContain('875,82 €')
    expect(html).toContain('de forma provisional')
  })

  it('explains that there is no commission below level 1', async () => {
    const html = await render(solo(109))
    expect(html).toContain('no llegas a la meta 1')
    expect(html).not.toContain('Comisión estimada</span>')
  })

  it('reminds that small commissions are paid as a voucher (D-008)', async () => {
    expect(await render(solo(110))).toContain('se te pagará en forma de vale de descuento')
    expect(await render(solo(1000))).not.toContain('vale de descuento')
  })

  it('warns about the additional settlement in France, Italy, Switzerland and Mexico (BR-15)', async () => {
    expect(await render(solo(1000), 'FR-vdi')).toContain('documento de liquidación por motivos fiscales')
    expect(await render(solo(1000), 'ES')).not.toContain('motivos fiscales')
  })

  it('asks to complete the strongest-team breakdown when it is missing', async () => {
    const html = await render({ customerTurnover: 400, generationVolumes: [10000], teamVolumes: [10000] }, 'ES', 'es-ES', {
      strongestTeamLimit: 'teamVolumeProportional',
    })
    expect(html).toContain('todavía no está aplicado')
    expect(html).not.toContain('de forma provisional')
  })

  it('shows input warnings', async () => {
    const html = await render({ customerTurnover: 400, generationVolumes: [500], teamVolumes: [600] })
    expect(html).toContain('Revisa los datos')
  })

  it('always shows the exceptions and bonuses notes (D-012)', async () => {
    const html = await render(solo(1000))
    expect(html).toContain('RINGANA only')
    expect(html).toContain('No incluye bonificaciones')
  })

  it('formats amounts in the market currency and the UI language', async () => {
    expect(await render(solo(1000), 'GB', 'en-GB')).toContain('£431.73')
    expect(await render(solo(1000), 'US', 'en-GB')).toContain('US$624.00')
  })
})
