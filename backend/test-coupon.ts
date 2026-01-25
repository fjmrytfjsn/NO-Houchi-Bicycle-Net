import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { CouponService } from './src/services/couponService';

const prisma = new PrismaClient();
const couponService = new CouponService(prisma);

async function testCouponSystem() {
  try {
    console.log('🎫 クーポンシステムのテストを開始します...\n');

    // デフォルトクーポンを作成
    console.log('1. デフォルトクーポンを作成中...');
    await couponService.createDefaultCoupons();
    console.log('✅ デフォルトクーポンを作成しました\n');

    // マーカーを作成
    console.log('2. テスト用マーカーを作成中...');
    const marker = await prisma.marker.create({
      data: {
        code: 'TEST-MARKER-001',
      },
    });
    console.log(`✅ マーカーを作成しました (ID: ${marker.id})\n`);

    // 仮解除を作成
    console.log('3. 仮解除を作成中...');
    const declaredAt = new Date();
    const eligibleFinalAt = new Date(declaredAt.getTime() - 1000); // 1秒前（すぐに本解除可能）
    const expiresAt = new Date(declaredAt.getTime() + 24 * 60 * 60 * 1000);

    const declaration = await prisma.declaration.create({
      data: {
        markerId: marker.id,
        declaredAt,
        eligibleFinalAt,
        expiresAt,
        status: 'temporary',
      },
    });
    console.log(`✅ 仮解除を作成しました (ID: ${declaration.id})\n`);

    // クーポン発行テスト
    console.log('4. 本解除時にクーポンを発行中...');
    const coupon = await couponService.issueCouponForFinalUnlock(
      marker.id,
      'test@example.com'
    );

    if (coupon) {
      console.log('✅ クーポンを発行しました！');
      console.log(`  クーポン名: ${coupon.name}`);
      console.log(`  店舗名: ${coupon.shopName}`);
      console.log(`  割引: ${coupon.discount}${coupon.discountType === 'percentage' ? '%' : '円'}`);
      console.log(`  有効期限: ${coupon.expiresAt.toLocaleDateString('ja-JP')}`);
      console.log(`  ステータス: ${coupon.status}\n`);

      // クーポン一覧を取得
      console.log('5. クーポン一覧を取得中...');
      const coupons = await couponService.getCouponsByMarker(marker.id);
      console.log(`✅ ${coupons.length}件のクーポンが見つかりました\n`);

      // クーポン使用テスト
      console.log('6. クーポンを使用中...');
      const useResult = await couponService.useCoupon(coupon.id);
      if (useResult) {
        console.log('✅ クーポンを使用しました\n');
      } else {
        console.log('❌ クーポンの使用に失敗しました\n');
      }
    } else {
      console.log('❌ クーポンの発行に失敗しました\n');
    }

    // クリーンアップ
    console.log('7. テストデータをクリーンアップ中...');
    await prisma.couponIssuance.deleteMany({
      where: { markerId: marker.id },
    });
    await prisma.declaration.deleteMany({
      where: { markerId: marker.id },
    });
    await prisma.marker.delete({
      where: { id: marker.id },
    });
    console.log('✅ クリーンアップ完了\n');

    console.log('✨ すべてのテストが完了しました！');
  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testCouponSystem();
