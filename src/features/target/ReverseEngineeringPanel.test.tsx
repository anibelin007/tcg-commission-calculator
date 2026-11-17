import { renderToStaticMarkup } from 'react-dom/server'
import { I18nextProvider } from 'react-i18next'
import { describe, expect, it } from 'vitest'
import { findMarket } from '../../domain/commission'
import { planToInput, type Plan } from '../../domain/planning'
import { createAppI18n } from '../../i18n'
import { ReverseEngineeringPanel } from './ReverseEngineeringPanel'

/**
 * Synthetic plan: willing own CT 600, legs Ana (1,000) and Eva (600), spread over generations
 * like 900 / 700 → the same engine input as the earlier example (level 2, 361.68 €).
 */
const PLAN: Plan = { ownCt: 600, legs: [1000, 600], generationShares: [900 / 1600, 700 / 1600] }

async function render(target: number, average = 800, plan: Plan = PLAN) {
  const market = findMarket('ES')!
  const i18n = await createAppI18n('es-ES')
  return renderToStaticMarkup(
    <I18nextProvider i18n={i18n}>
      <ReverseEngineeringPanel input={planToInput(plan)} market={market} target={target} average={average} legNames={['Ana', 'Eva']} />
    </I18nextProvider>,
  ).replace(/ | /g, ' ')
}

describe('ReverseEngineeringPanel (tab 3, design §7)', () => {
  it('shows nothing until a target is entered', async () => {
    expect(await render(0)).toBe('')
  })

  it('says when the plan already reaches the target', async () => {
    expect(await render(300)).toContain('¡Con tu plan llegas! Meta 2, comisión estimada 361,68 €.')
  })

  it('says how far the plan falls short', async () => {
    expect(await render(600)).toContain('Con tu plan no es suficiente: llegarías a 361,68 € (meta 2) y te faltan 238,32 €.')
  })

  it('offers more own CT (exact), more from the legs and a combination, worded as conditions', async () => {
    const html = await render(600)
    expect(html).toContain('Más VC tuyo')
    expect(html).toContain('Si tú haces 225 puntos más y tu equipo 0, llegarías a la meta 3 con una comisión estimada de 602,91 €.')
    expect(html).toContain('Más puntos de tus patas')
    expect(html).toContain('Si tú haces 0 puntos más y tu equipo 1069,28, llegarías a la meta 3 con una comisión estimada de 600,00 €.')
    expect(html).toMatch(/<dt>Eva<\/dt><dd[^>]*>\+734,64<\/dd>/)
    expect(html).toContain('Combinado')
    expect(html).not.toMatch(/ganarás|vas a ganar/i)
  })

  it('works out how many more partners at the average would be needed', async () => {
    // One more leg of 800: level 3, 571.56 €; two: 656.04 €.
    expect(await render(600)).toContain('Con patas que hagan de media 800 puntos, necesitarías 2 patas activas más: meta 3, comisión estimada 656,04 €.')
  })

  it('asks for the legs’ points when there is no average', async () => {
    expect(await render(600, 0)).toContain('Indica cuánto crees que harán tus patas')
  })

  it('without legs, the team alternatives explain why they are impossible', async () => {
    const html = await render(600, 0, { ownCt: 600, legs: [] })
    expect(html).toContain('Añade tus patas arriba')
  })
})
