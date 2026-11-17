import { renderToStaticMarkup } from 'react-dom/server'
import { I18nextProvider } from 'react-i18next'
import { describe, expect, it } from 'vitest'
import { computeCommission, findMarket, type CommissionInput } from '../../domain/commission'
import { createAppI18n } from '../../i18n'
import { CommissionChart } from './CommissionChart'

describe('CommissionChart (PF-04)', () => {
  it('draws one series with the current position and no table of other levels', async () => {
    const market = findMarket('ES')!
    const input: CommissionInput = { customerTurnover: 500, generationVolumes: [], teamVolumes: [] }
    const i18n = await createAppI18n('es-ES')
    const html = renderToStaticMarkup(
      <I18nextProvider i18n={i18n}>
        <CommissionChart input={input} market={market} current={computeCommission(input, market)} nextExtraOwn={325} />
      </I18nextProvider>,
    )
    expect(html).toContain('Tu comisión estimada según tu VC')
    expect(html).toContain('Ahora')
    expect(html.match(/<path /g)).toHaveLength(2) // area wash + line
    expect(html).not.toContain('<table')
  })
})
