import { describe, it, expect } from 'vitest';
import {
  OCRService,
  calculateConfidence,
  extractRegistrationNumber,
} from '../src/services/ocrService';

describe('OCRService', () => {
  describe('extractRegistrationNumber', () => {
    it('8桁の防犯登録番号を抽出できる', () => {
      const testText = '自転車の防犯登録番号は 12345678 です';
      const result = extractRegistrationNumber(testText);
      expect(result).toBe('12345678');
    });

    it('10桁の防犯登録番号を抽出できる', () => {
      const testText = '登録番号: 1234567890';
      const result = extractRegistrationNumber(testText);
      expect(result).toBe('1234567890');
    });

    it('複数の数字がある場合は最初の8~10桁を返す', () => {
      const testText = '前回: 11111111 今回: 22222222';
      const result = extractRegistrationNumber(testText);
      expect(result).toBe('11111111');
    });

    it('防犯登録番号がない場合はnullを返す', () => {
      const testText = 'これは防犯登録番号を含まないテキストです';
      const result = extractRegistrationNumber(testText);
      expect(result).toBeNull();
    });

    it('7桁の数字は抽出しない', () => {
      const testText = '番号は 1234567 です';
      const result = extractRegistrationNumber(testText);
      expect(result).toBeNull();
    });

    it('11桁以上の数字は抽出しない', () => {
      const testText = '番号は 12345678901 です';
      const result = extractRegistrationNumber(testText);
      expect(result).toBeNull();
    });

    it('大阪府シール形式から末尾6桁を抽出できる', () => {
      const testText = '識別子 a217123456789a を読み取りました';
      const result = extractRegistrationNumber(testText);
      expect(result).toBe('456789');
    });
  });

  describe('calculateConfidence', () => {
    it('ページが空の場合は0を返す', () => {
      const result = calculateConfidence([]);
      expect(result).toBe(0);
    });

    it('単語の信頼度から平均を計算する', () => {
      const mockPages = [
        {
          lines: [
            {
              words: [
                { confidence: 0.95 },
                { confidence: 0.90 },
              ],
            },
          ],
        },
      ];
      const result = calculateConfidence(mockPages);
      expect(result).toBe(0.925); // (0.95 + 0.90) / 2
    });

    it('複数のページから信頼度を計算する', () => {
      const mockPages = [
        {
          lines: [
            {
              words: [{ confidence: 1.0 }],
            },
          ],
        },
        {
          lines: [
            {
              words: [{ confidence: 0.8 }],
            },
          ],
        },
      ];
      const result = calculateConfidence(mockPages);
      expect(result).toBe(0.9); // (1.0 + 0.8) / 2
    });
  });

  describe('recognizeRegistrationNumber', () => {
    it('ファイルが存在しない場合はエラーを返す', async () => {
      const ocrService = new OCRService({
        analyzeDocument: async () => ({
          content: '防犯登録 12345678',
          pages: [],
        }),
      });

      const result = await ocrService.recognizeRegistrationNumber('/nonexistent/path.jpg');
      expect(result.success).toBe(false);
      expect(result.registrationNumber).toBeNull();
      expect(result.error).toBeDefined();
    });

    it('分析結果から registrationNumber と confidence を返す', async () => {
      const ocrService = new OCRService(
        {
          analyzeDocument: async () => ({
            content: '防犯登録 12345678',
            pages: [
              {
                lines: [
                  {
                    words: [{ confidence: 0.8 }, { confidence: 1.0 }],
                  },
                ],
              },
            ],
          }),
        },
        () => Buffer.from('test-image')
      );

      const result = await ocrService.recognizeRegistrationNumber('/tmp/image.jpg');
      expect(result).toEqual({
        success: true,
        registrationNumber: '12345678',
        confidence: 0.9,
        rawText: '防犯登録 12345678',
      });
    });
  });
});
