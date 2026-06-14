import React, { useState } from 'react';

interface SMSAuthPanelProps {
  onAuthComplete: () => void;
}

export function SMSAuthPanel({ onAuthComplete }: SMSAuthPanelProps) {
  const [phone, setPhone] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) return;

    setIsSending(true);
    // モック: 1秒後に送信完了として扱う
    setTimeout(() => {
      setIsSending(false);
      // モック: 本来はここでSMSを受信し、リンクをクリックして戻ってくる想定
      alert('【モック】SMSを送信しました。\n実際はSMS内のリンクをクリックして次の画面に進みます。\n「OK」を押すと次の画面へ進みます。');
      onAuthComplete();
    }, 1000);
  };

  return (
    <div style={{
      padding: 'var(--space-4)',
      background: 'var(--color-surface)',
      borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--color-border)',
      marginTop: 'var(--space-4)',
      textAlign: 'center'
    }}>
      <h3 style={{ margin: '0 0 var(--space-2) 0', fontSize: 'var(--text-lg)' }}>クーポンを受け取る</h3>
      <p style={{ margin: '0 0 var(--space-4) 0', color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
        携帯電話番号を入力してSMSでクーポンを受け取ってください。
        <br />※お一人様月1回まで
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <input
          type="tel"
          placeholder="09012345678"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          style={{
            padding: 'var(--space-3)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            fontSize: 'var(--text-base)',
            textAlign: 'center'
          }}
          disabled={isSending}
        />
        <button
          type="submit"
          disabled={!phone || isSending}
          style={{
            padding: 'var(--space-3)',
            background: 'var(--color-primary)',
            color: 'var(--color-text-inverse)',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            fontSize: 'var(--text-base)',
            fontWeight: 600,
            cursor: (!phone || isSending) ? 'not-allowed' : 'pointer',
            opacity: (!phone || isSending) ? 0.7 : 1
          }}
        >
          {isSending ? '送信中...' : 'SMSにクーポンを送信'}
        </button>
      </form>
    </div>
  );
}
