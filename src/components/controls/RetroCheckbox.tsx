interface RetroCheckboxProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function RetroCheckbox({ label, checked, onChange }: RetroCheckboxProps) {
  return (
    <label
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        cursor: 'pointer',
        fontSize: '11px',
        fontWeight: 'bold',
      }}
    >
      <div
        onClick={() => onChange(!checked)}
        style={{
          width: '14px',
          height: '14px',
          border: '1px solid #000',
          background: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
        }}
      >
        {checked && (
          <span style={{ fontSize: '12px', lineHeight: 1 }}>✓</span>
        )}
      </div>
      {label}
    </label>
  );
}
