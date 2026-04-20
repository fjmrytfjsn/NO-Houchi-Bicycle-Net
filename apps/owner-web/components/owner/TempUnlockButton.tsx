interface TempUnlockButtonProps {
  disabled: boolean;
  onClick: () => void;
}

export function TempUnlockButton({ disabled, onClick }: TempUnlockButtonProps) {
  return (
    <div style={{ marginTop: 12 }}>
      <button
        onClick={onClick}
        disabled={disabled}
        style={{
          background: '#ff6b6b',
          color: '#fff',
          padding: '12px 16px',
          border: 'none',
          borderRadius: 6,
          opacity: disabled ? 0.5 : 1,
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}
      >
        解除（仮）
      </button>
    </div>
  );
}
