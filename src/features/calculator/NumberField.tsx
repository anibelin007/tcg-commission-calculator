import { useId } from 'react'

interface NumberFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  help?: string
  /** Message shown when the value is invalid. */
  error?: string
}

/** Points input. `type="number"` lets the browser handle the local decimal separator. */
export function NumberField({ label, value, onChange, help, error }: NumberFieldProps) {
  const id = useId()
  const describedBy = [help ? `${id}-help` : null, error ? `${id}-error` : null].filter(Boolean).join(' ') || undefined
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-semibold text-tcg-heading">
        {label}
      </label>
      <input
        id={id}
        type="number"
        inputMode="decimal"
        min={0}
        step="any"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className="rounded border border-tcg-border bg-white px-4 py-3 text-tcg-input-text shadow-xs focus:border-tcg-primary focus:outline-2 focus:outline-tcg-primary/30 aria-invalid:border-red-700"
      />
      {help && (
        <p id={`${id}-help`} className="text-sm">
          {help}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="text-sm font-semibold text-red-700">
          {error}
        </p>
      )}
    </div>
  )
}
