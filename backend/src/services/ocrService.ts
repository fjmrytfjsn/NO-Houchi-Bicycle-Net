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
   * 6桁の数字パターンを検索（大阪府の防犯登録番号）
   */
  private extractRegistrationNumber(text: string): string | null {
    // パターン1: "防犯登録" の後に続く6桁の数字を優先的に抽出
    const afterRegistrationPattern = /防犯登録[\s\S]{0,50}?(\d{6})\b/;
    const afterMatch = text.match(afterRegistrationPattern);
    
    if (afterMatch && afterMatch[1]) {
      return afterMatch[1];
    }

    // パターン2: a217XXXXXXXXX のようなパターンから6桁部分を抽出
    // （大阪府の防犯登録番号シール形式）
    const osakaPattern = /a\d{11,12}a/gi;
    const osakaMatches = text.match(osakaPattern);
    
    if (osakaMatches && osakaMatches.length > 0) {
      // a217XXXXXX から最後の6桁を抽出
      const numbers = osakaMatches[0].match(/\d+/);
      if (numbers && numbers[0].length >= 6) {
        const fullNumber = numbers[0];
        return fullNumber.substring(fullNumber.length - 6); // 最後の6桁
      }
    }

    // パターン3: 単独の6桁の数字
    const directPattern = /\b\d{6}\b/g;
    const directMatches = text.match(directPattern);
    
    if (directMatches && directMatches.length > 0) {
      // 複数ある場合は、"防犯登録" や "大阪府警察" に近いものを優先
      for (const match of directMatches) {
        const index = text.indexOf(match);
        const before = text.substring(Math.max(0, index - 50), index);
        const after = text.substring(index, Math.min(text.length, index + 50));
        
        if (before.includes('防犯登録') || before.includes('大阪府警察') || 
            after.includes('大阪府警察')) {
          return match;
        }
      }
      
      // 見つからなければ最初のマッチを返す
      return directMatches[0];
    }

    return null;
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
      if (page.lines && Array.isArray(page.lines)) {
        for (const line of page.lines) {
          // line自体の信頼度がある場合
          if (line.confidence !== undefined) {
            totalConfidence += line.confidence;
            wordCount++;
          }
          // wordsが配列の場合
          if (line.words && Array.isArray(line.words)) {
            for (const word of line.words) {
              if (word.confidence !== undefined) {
                totalConfidence += word.confidence;
                wordCount++;
              }
            }
          }
        }
      }
      // ページレベルの信頼度もチェック
      if (page.confidence !== undefined) {
        totalConfidence += page.confidence;
        wordCount++;
      }
    }

    return wordCount > 0 ? totalConfidence / wordCount : 0.95; // デフォルト値
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
