import { renderToStaticMarkup } from 'react-dom/server'
import { I18nextProvider } from 'react-i18next'
import { describe, expect, it } from 'vitest'
import { computeCommission, findMarket, type CommissionInput } from '../../domain/commission'
import { createAppI18n } from '../../i18n'
import { ReverseEngineeringPanel } from './ReverseEngineeringPanel'

/** Synthetic partner: CT 600, generations 900 / 700, legs Ana (VE 1,000) and Eva (VE 600). */
const E: CommissionInput = { customerTurnover: 600, generationVolumes: [900, 700], teamVolumes: [1000, 600] }

async function render(input: CommissionInput, target: string, own?: string) {
  const market = findMarket('ES')!
  const i18n = await createAppI18n('es-ES')
  return renderToStaticMarkup(
    <I18nextProvider i18n={i18n}>
      <ReverseEngineeringPanel
        input={input}
        market={market}
        current={computeCommission(input, market)}
        legNames={['Ana', 'Eva']}
        initialTarget={target}
        initialOwn={own}
      />
    </I18nextProvider>,
  ).replace(/ | /g, ' ')
}

describe('ReverseEngineeringPanel (D-021)', () => {
  it('shows only the target field until a target is entered', async () => {
    const html = await render(E, '')
    expect(html).toContain('Comisión que te gustaría (EUR)')
    expect(html).not.toContain('Solo yo')
  })

  it('shows the three scenarios with their labels', async () => {
    const html = await render(E, '600')
    expect(html).toContain('Solo yo')
    expect(html).toContain('Mínimo exacto')
    expect(html).toContain('Mi equipo y yo')
    expect(html).toContain('Mayor aportación del equipo')
    expect(html.match(/Propuesta/g)?.length).toBeGreaterThanOrEqual(2)
  })

  it('words each scenario as a condition with the final figures', async () => {
    const html = await render(E, '600')
    expect(html).toContain('Si tú haces 225 puntos más y tu equipo 0, llegarías a la meta 3 con una comisión estimada de 602,91 €.')
    expect(html).toContain('Si tú haces 0 puntos más y tu equipo 1069,28, llegarías a la meta 3 con una comisión estimada de 600,00 €.')
    expect(html).not.toMatch(/ganarás|vas a ganar/i)
  })

  it('splits the team points by leg name and explains the strategy', async () => {
    const html = await render(E, '600')
    expect(html).toMatch(/<dt>Ana<\/dt><dd[^>]*>\+334,64<\/dd>/)
    expect(html).toMatch(/<dt>Eva<\/dt><dd[^>]*>\+734,64<\/dd>/)
    expect(html).toContain('Reparto nivelado: primero las patas más débiles')
  })

  it('shows final VE and VE-1/2/3 and the difference to the target', async () => {
    const html = await render(E, '600')
    // «Solo yo»: CT 825, TT 2,425; TT-1 = 2,425 − strongest leg 1,000; TT-2 = TT-3 = 825.
    expect(html).toMatch(/VE final<\/dt><dd[^>]*>2425<\/dd>/)
    expect(html).toMatch(/VE-1 final<\/dt><dd[^>]*>1425<\/dd>/)
    expect(html).toMatch(/VE-3 final<\/dt><dd[^>]*>825<\/dd>/)
    expect(html).toMatch(/Sobre el objetivo<\/dt><dd[^>]*>\+2,91 €<\/dd>/)
  })

  it('manual control: with +100 own points the team would need 581.78', async () => {
    const html = await render(E, '600', '100')
    expect(html).toContain('Tu propio reparto')
    expect(html).toContain('Si tú haces 100 puntos más y tu equipo 581,78')
  })

  it('says when the target is already reached', async () => {
    expect(await render(E, '300')).toContain('Con tus datos actuales ya llegas: 361,68 €.')
  })

  it('explains why team scenarios are impossible without legs', async () => {
    const html = await render({ customerTurnover: 600, generationVolumes: [], teamVolumes: [] }, '600')
    expect(html).toContain('Añade tus patas en «Mi comisión actual»')
  })

  it('states the generation-1 assumption, the proposal meaning and that these are estimates', async () => {
    const html = await render(E, '600')
    expect(html).toContain('los hace la propia socia directa (1.ª generación)')
    expect(html).toContain('«Propuesta» es la mejor combinación')
    expect(html).toContain('no promesas de ingresos')
  })
})
