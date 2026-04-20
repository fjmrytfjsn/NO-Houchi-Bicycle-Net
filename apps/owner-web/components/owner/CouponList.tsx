import type { Coupon } from '../../lib/owner/types';

interface CouponListProps {
  coupons: Coupon[];
}

export function CouponList({ coupons }: CouponListProps) {
  if (coupons.length === 0) return null;

  return (
    <div
      style={{
        marginTop: 12,
        padding: 12,
        background: '#d4edda',
        borderRadius: 6,
        border: '1px solid #28a745',
      }}
    >
      <h3 style={{ margin: '0 0 8px 0' }}>🎁 獲得したクーポン</h3>
      {coupons.map((coupon, index) => (
        <div
          key={`${coupon.name}-${index}`}
          style={{
            padding: 8,
            background: '#fff',
            borderRadius: 4,
            marginBottom: 8,
            borderLeft: '4px solid #28a745',
          }}
        >
          <div style={{ fontWeight: 'bold' }}>{coupon.name}</div>
          <div style={{ fontSize: '14px', color: '#666' }}>
            {coupon.discount}
            {coupon.discountType === 'fixed' ? '' : '割引'}
          </div>
          {coupon.expiresAt && (
            <div style={{ fontSize: '12px', color: '#999' }}>
              有効期限: {new Date(coupon.expiresAt).toLocaleDateString('ja-JP')}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
