import styles from './TempUnlockButton.module.css';

interface TempUnlockButtonProps {
  disabled: boolean;
  onClick: () => void;
}

export function TempUnlockButton({ disabled, onClick }: TempUnlockButtonProps) {
  return (
    <div className={styles.wrap}>
      <button
        onClick={onClick}
        disabled={disabled}
        className={styles.button}
      >
        <span className={styles.buttonIcon}>🔓</span>
        仮解除を申請する
      </button>
      <p className={styles.hint}>
        ※ 仮解除後、一定時間経過で本解除が可能になります
      </p>
    </div>
  );
}
