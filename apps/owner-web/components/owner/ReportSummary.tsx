import { useState, useEffect } from 'react';
import type { Declaration, Report, ReportStatus } from '../../lib/owner/types';
import { useNow } from '../../hooks/useNow';
import styles from './ReportSummary.module.css';

interface ReportSummaryProps {
  report?: Report;
  declaration?: Declaration | null;
}

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  reported: { label: '通報済み', className: styles.badgeReported },
  temporary: { label: '仮解除中', className: styles.badgeTemporary },
  resolved: { label: '解除済み', className: styles.badgeResolved },
};

function getStatusInfo(status?: ReportStatus) {
  if (!status) return { label: '未報告', className: styles.badgeDefault };
  return STATUS_MAP[status] || { label: status, className: styles.badgeDefault };
}

function getEffectiveStatus(report?: Report, declaration?: Declaration | null): ReportStatus | undefined {
  if (!declaration) return report?.status;
  if (declaration.status === 'finalized' || declaration.status === 'resolved') return 'resolved';
  if (declaration.status === 'temporary') return 'temporary';
  return report?.status;
}

export function ReportSummary({ report, declaration }: ReportSummaryProps) {
  const nowTime = useNow(60000); // 1分ごとに更新
  const [locationText, setLocationText] = useState('-');

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationText('位置情報がサポートされていません');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`);
          const data = await res.json();
          if (data && data.address) {
            const p = data.address;
            // 取得できた住所パーツを結合して日本の住所っぽく整形
            const addressText = [p.province, p.state, p.city, p.ward, p.town, p.suburb, p.neighbourhood, p.quarter, p.road].filter(Boolean).join('');
            setLocationText(addressText || data.display_name || `現在地 (緯度:${lat.toFixed(4)}, 経度:${lon.toFixed(4)})`);
          } else {
            setLocationText(`現在地 (緯度:${lat.toFixed(4)}, 経度:${lon.toFixed(4)})`);
          }
        } catch {
          setLocationText(`現在地 (緯度:${lat.toFixed(4)}, 経度:${lon.toFixed(4)})`);
        }
      },
      () => {
        setLocationText('現在地を取得できませんでした');
      },
      { timeout: 10000 }
    );
  }, []);

  const effectiveStatus = getEffectiveStatus(report, declaration);
  const statusInfo = getStatusInfo(effectiveStatus);

  const formattedDate = new Date(nowTime).toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className={styles.card}>
      <div className={styles.imageWrap}>
        {report?.imageUrl ? (
          <img
            src={report.imageUrl}
            alt="通報された自転車の写真"
            className={styles.image}
          />
        ) : (
          <div className={styles.imagePlaceholder}>
            <span className={styles.placeholderIcon}>📷</span>
            <span className={styles.placeholderText}>画像なし</span>
          </div>
        )}
      </div>

      <div className={styles.content}>
        <div className={styles.statusRow}>
          <span className={styles.statusLabel}>現在の状態</span>
          <span className={`${styles.badge} ${statusInfo.className}`}>
            {statusInfo.label}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', marginTop: 'var(--space-3)', paddingTop: 'var(--space-3)', borderTop: '1px dashed var(--color-border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)' }}>
            <span style={{ color: 'var(--color-text-muted)' }}>報告日時</span>
            <span style={{ fontWeight: 500 }}>{formattedDate}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)', alignItems: 'flex-start' }}>
            <span style={{ color: 'var(--color-text-muted)', flexShrink: 0, marginRight: 'var(--space-2)' }}>位置識別情報</span>
            <span style={{ fontWeight: 500, textAlign: 'right', wordBreak: 'break-all' }}>
              {locationText}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
