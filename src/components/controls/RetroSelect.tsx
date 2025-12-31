interface SelectOption {
  value: string;
  label: string;
}

interface RetroSelectProps {
  label?: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  inline?: boolean;
}

export function RetroSelect({
  label,
  value,
  options,
  onChange,
  inline = false,
}: RetroSelectProps) {
  return (
    <div className={inline ? 'control-inline' : ''} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      {label && <span className="label">{label}:</span>}
      <div className="retro-select">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
