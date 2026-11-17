import { renderToStaticMarkup } from 'react-dom/server'
import { I18nextProvider } from 'react-i18next'
import { describe, expect, it } from 'vitest'
import { computeCommission, findMarket, type CommissionInput } from '../../domain/commission'
import { createAppI18n } from '../../i18n'
import { SimulationPanel } from './SimulationPanel'

async function renderWithTarget(input: CommissionInput, target: string) {
  const market = findMarket('ES')!
  const i18n = await createAppI18n('es-ES')
  return renderToStaticMarkup(
    <I18nextProvider i18n={i18n}>
      <SimulationPanel input={input} market={market} current={computeCommission(input, market)} initialTarget={target} />
    </I18nextProvider>,
  ).replace(/ | /g, ' ')
}

const solo = (ct: number): CommissionInput => ({ customerTurnover: ct, generationVolumes: [], teamVolumes: [] })
const render = (input: CommissionInput) => renderWithTarget(input, '')

describe('SimulationPanel', () => {
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

  it('draws the chart and shows no table of other levels', async () => {
    const html = await render(solo(500))
    expect(html).toContain('Tu comisión estimada según tu VC')
    expect(html).not.toContain('<table')
  })

  it('offers the team route for a target amount, stating its assumption', async () => {
    const html = await renderWithTarget({ customerTurnover: 600, generationVolumes: [900, 700], teamVolumes: [1000, 600] }, '600')
    expect(html).toContain('Necesitarías 225 puntos de VC más (VC total 825)')
    expect(html).toContain('tu equipo necesitaría 1069,28 puntos más en tu 1.ª generación, de socias que no sean tus patas más fuertes: meta 3')
    expect(html).toContain('Los de tu pata más fuerte no suben tu VE-1')
  })

  it('says when the top level is reached', async () => {
    const top: CommissionInput = { customerTurnover: 660, generationVolumes: [270000], teamVolumes: [70000, 70000, 70000, 60000] }
    expect(await render(top)).toContain('Ya estás en la meta 10')
  })
})
