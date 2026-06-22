import React, { useState } from 'react';

interface SMSAuthPanelProps {
  onAuthComplete: () => void;
  onSkip?: () => void;
}

export function SMSAuthPanel({ onAuthComplete, onSkip }: SMSAuthPanelProps) {
  const [phone, setPhone] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [limitError, setLimitError] = useState(false);

  // ハイフンを除いた純粋な数字の文字列を取得
  const rawDigits = phone.replace(/-/g, '');
  const isValidPhone = /^(090|080|070)\d{8}$/.test(rawDigits);

  const formatPhone = (val: string) => {
    // 数字以外の入力を弾き、最大11桁に制限
    const digits = val.replace(/[^0-9]/g, '').slice(0, 11);
    
    // 桁数に応じてハイフンを挿入 (3桁-4桁-4桁)
    if (digits.length <= 3) return digits;
    if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhone(e.target.value));
    if (limitError) setLimitError(false); // 入力が変わったらエラー表示を消す
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidPhone) return;

    // localStorage で月1回制限のモックチェック
    const usedNumbersStr = localStorage.getItem('used_phone_numbers');
    const usedNumbers: string[] = usedNumbersStr ? JSON.parse(usedNumbersStr) : [];
    
    if (usedNumbers.includes(rawDigits)) {
      setLimitError(true);
      return;
    }

    setIsSending(true);
    // モック: 1秒後に送信完了として扱う
    setTimeout(() => {
      setIsSending(false);
      // 利用済みリストに追加
      usedNumbers.push(rawDigits);
      localStorage.setItem('used_phone_numbers', JSON.stringify(usedNumbers));
      
      // UIを送信完了画面に切り替え
      setIsSent(true);
    }, 1000);
  };

  if (isSent) {
    return (
      <div style={{
        padding: 'var(--space-6)',
        background: 'var(--color-surface)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--color-border)',
        marginTop: 'var(--space-4)',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '3rem', marginBottom: 'var(--space-4)' }}>✉️</div>
        <h3 style={{ margin: '0 0 var(--space-4) 0', fontSize: 'var(--text-lg)' }}>
          SMSを送信しました
        </h3>
        <p style={{ margin: '0 0 var(--space-6) 0', color: 'var(--color-text-muted)', fontSize: 'var(--text-base)', lineHeight: 1.6 }}>
          入力された電話番号（{phone}）宛に<br />
          クーポンのご案内メッセージを送信しました。<br />
          メッセージ内のリンクをタップして進んでください。
        </p>

        <div style={{
          padding: 'var(--space-4)',
          background: 'var(--color-background)',
          borderRadius: 'var(--radius-md)',
          border: '1px dashed var(--color-border)',
        }}>
          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-3)', fontWeight: 'bold' }}>
            ※デモ用操作
          </div>
          <button
            onClick={onAuthComplete}
            style={{
              padding: 'var(--space-3) var(--space-4)',
              background: 'var(--color-primary)',
              color: 'var(--color-text-inverse)',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--text-base)',
              fontWeight: 600,
              cursor: 'pointer',
              width: '100%',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            📱 SMSに届いたリンクを開く
          </button>
        </div>
      </div>
    );
  }

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
        <br /><br />
        ※お急ぎの方や不要な方は、下部のリンクからクーポンを受け取らずに本解除を終了することもできます。
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <input
          type="tel"
          placeholder="090-1234-5678"
          value={phone}
          maxLength={13} // 11桁 + ハイフン2文字
          onChange={handlePhoneChange}
          style={{
            padding: 'var(--space-3)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            fontSize: 'var(--text-base)',
            textAlign: 'center'
          }}
          disabled={isSending}
        />
        {phone.length > 0 && !isValidPhone && !limitError && (
          <div style={{ color: 'var(--color-error)', fontSize: 'var(--text-sm)' }}>
            ※090、080、070から始まる11桁の番号を入力してください
          </div>
        )}
        
        {limitError && (
          <div style={{ 
            color: 'var(--color-error)', 
            fontSize: 'var(--text-sm)',
            background: 'rgba(255, 0, 0, 0.05)',
            padding: 'var(--space-3)',
            borderRadius: 'var(--radius-md)',
            fontWeight: 'bold',
            border: '1px solid rgba(255, 0, 0, 0.2)'
          }}>
            この電話番号は今月すでにクーポンを取得済みです。
          </div>
        )}

        <button
          type="submit"
          disabled={!isValidPhone || isSending}
          style={{
            padding: 'var(--space-3)',
            background: 'var(--color-primary)',
            color: 'var(--color-text-inverse)',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            fontSize: 'var(--text-base)',
            fontWeight: 600,
            cursor: (!isValidPhone || isSending) ? 'not-allowed' : 'pointer',
            opacity: (!isValidPhone || isSending) ? 0.7 : 1
          }}
        >
          {isSending ? '送信中...' : 'SMSにクーポンを送信'}
        </button>

        {onSkip && (
          <div style={{ marginTop: 'var(--space-2)', textAlign: 'center' }}>
            <button
              type="button"
              onClick={onSkip}
              disabled={isSending}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--color-text-muted)',
                textDecoration: 'underline',
                fontSize: 'var(--text-sm)',
                cursor: isSending ? 'not-allowed' : 'pointer',
                padding: 'var(--space-2)'
              }}
            >
              クーポンを受け取らずに終了する
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
