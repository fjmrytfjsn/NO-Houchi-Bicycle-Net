import type { Coupon } from '../../lib/owner/types';
import styles from './CouponList.module.css';

interface CouponListProps {
  coupons: Coupon[];
}

export function CouponList({ coupons }: CouponListProps) {
  if (coupons.length === 0) return null;

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <span className={styles.headerIcon}>🎁</span>
        <h3 className={styles.headerTitle}>獲得したクーポン</h3>
      </div>
      {coupons.map((coupon, index) => (
        <div key={`${coupon.name}-${index}`} className={styles.couponCard}>
          <div className={styles.couponName}>{coupon.name}</div>
          <div className={styles.couponDiscount}>
            {coupon.discount}
            {coupon.discountType === 'fixed' ? '' : '割引'}
          </div>
          {coupon.expiresAt && (
            <div className={styles.couponExpiry}>
              有効期限: {new Date(coupon.expiresAt).toLocaleDateString('ja-JP')}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
