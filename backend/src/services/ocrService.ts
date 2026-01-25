import { DocumentAnalysisClient, AzureKeyCredential } from '@azure/ai-form-recognizer';
import { readFileSync } from 'fs';
import { resolve } from 'path';

interface OCRResult {
  registrationNumber: string | null;
  confidence: number;
  rawText: string;
  success: boolean;
  error?: string;
}

/**
 * OCRサービス - 防犯登録番号をAzure Form Recognizerで認識
 */
export class OCRService {
  private client: DocumentAnalysisClient;

  constructor(endpoint: string, apiKey: string) {
    this.client = new DocumentAnalysisClient(endpoint, new AzureKeyCredential(apiKey));
  }

  /**
   * 画像ファイルから防犯登録番号を抽出
   * @param imagePath - ローカルファイルパス（FTPから取得したファイルなど）
   * @returns OCR結果（登録番号、信頼度スコア、生テキスト）
   */
  async recognizeRegistrationNumber(imagePath: string): Promise<OCRResult> {
    try {
      // ローカルファイルを読み込み
      const absolutePath = resolve(imagePath);
      const imageBuffer = readFileSync(absolutePath);

      // Azure Form Recognizerで文書分析
      const poller = await this.client.beginAnalyzeDocument('prebuilt-read', imageBuffer);

      const result = await poller.pollUntilDone();

      // 抽出テキストから防犯登録番号を抽出
      const fullText = result.content;
      const registrationNumber = this.extractRegistrationNumber(fullText);
      const confidence = this.calculateConfidence(result.pages || []);

      return {
        registrationNumber,
        confidence,
        rawText: fullText,
        success: registrationNumber !== null,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        registrationNumber: null,
        confidence: 0,
        rawText: '',
        success: false,
        error: `OCR処理に失敗しました: ${errorMessage}`,
      };
    }
  }

  /**
   * テキストから防犯登録番号を抽出
   * 8~10桁の数字パターンを検索
   */
  private extractRegistrationNumber(text: string): string | null {
    // 8~10桁の連続した数字を抽出
    const registrationPattern = /\b\d{8,10}\b/g;
    const matches = text.match(registrationPattern);

    if (!matches || matches.length === 0) {
      return null;
    }

    // 最初にマッチした8~10桁の数字を返す
    return matches[0];
  }

  /**
   * 信頼度スコアを計算（0.0-1.0）
   * ページの認識精度から推定
   */
  private calculateConfidence(pages: any[]): number {
    if (!pages || pages.length === 0) {
      return 0;
    }

    // 簡易的な信頼度計算：ページ内の単語の信頼度平均
    let totalConfidence = 0;
    let wordCount = 0;

    for (const page of pages) {
      if (page.lines) {
        for (const line of page.lines) {
          if (line.words) {
            for (const word of line.words) {
              if (word.confidence !== undefined) {
                totalConfidence += word.confidence;
                wordCount++;
              }
            }
          }
        }
      }
    }

    return wordCount > 0 ? totalConfidence / wordCount : 0;
  }
}

/**
 * OCRサービスシングルトンインスタンス
 */
let ocrServiceInstance: OCRService | null = null;

export function getOCRService(): OCRService {
  if (!ocrServiceInstance) {
    const endpoint = process.env.AZURE_FORM_RECOGNIZER_ENDPOINT;
    const apiKey = process.env.AZURE_FORM_RECOGNIZER_KEY;

    if (!endpoint || !apiKey) {
      throw new Error(
        'OCRサービスの初期化に失敗しました: AZURE_FORM_RECOGNIZER_ENDPOINT, AZURE_FORM_RECOGNIZER_KEY を設定してください'
      );
    }

    ocrServiceInstance = new OCRService(endpoint, apiKey);
  }

  return ocrServiceInstance;
}
