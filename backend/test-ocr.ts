import 'dotenv/config';
import { getOCRService } from './src/services/ocrService';
import { join } from 'path';

async function testOCR() {
  try {
    console.log('OCRテストを開始します...\n');

    const ocrService = getOCRService();
    
    const imagePaths = [
      join(__dirname, 'samples', '防犯登録番号1.jpg'),
      join(__dirname, 'samples', '防犯登録番号2.jpg'),
    ];

    for (const imagePath of imagePaths) {
      console.log(`\n📸 画像: ${imagePath}`);
      console.log('処理中...');
      
      const result = await ocrService.recognizeRegistrationNumber(imagePath);
      
      console.log('結果:', JSON.stringify(result, null, 2));
      
      if (result.success) {
        console.log('✅ OCR成功！');
        console.log(`  防犯登録番号: ${result.registrationNumber}`);
        console.log(`  信頼度スコア: ${(result.confidence * 100).toFixed(2)}%`);
        console.log(`  生テキスト（抜粋）: ${result.rawText.substring(0, 100)}...`);
      } else {
        console.log('❌ OCR失敗');
        console.log(`  エラー: ${result.error}`);
      }
    }
    
    console.log('\n✅ すべてのテストが完了しました！');
  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
    process.exit(1);
  }
}

testOCR();
