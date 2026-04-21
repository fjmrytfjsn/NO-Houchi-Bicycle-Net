import {
  DocumentAnalysisClient,
  AzureKeyCredential,
  type AnalyzeResult,
  type AnalyzedDocument,
} from '@azure/ai-form-recognizer';
import { readFileSync } from 'fs';
import { resolve } from 'path';

export interface OCRResult {
  registrationNumber: string | null;
  confidence: number;
  rawText: string;
  success: boolean;
  error?: string;
}

export type OCRLine = {
  confidence?: number;
  words?: Array<{ confidence?: number }>;
};

export type OCRPage = {
  confidence?: number;
  lines?: OCRLine[];
};

type OCRAnalysis = {
  content: string;
  pages?: OCRPage[];
};

export interface DocumentAnalyzer {
  analyzeDocument(buffer: Buffer): Promise<OCRAnalysis>;
}

class AzureDocumentAnalyzer implements DocumentAnalyzer {
  private readonly client: DocumentAnalysisClient;

  constructor(endpoint: string, apiKey: string) {
    this.client = new DocumentAnalysisClient(endpoint, new AzureKeyCredential(apiKey));
  }

  async analyzeDocument(buffer: Buffer): Promise<OCRAnalysis> {
    const poller = await this.client.beginAnalyzeDocument('prebuilt-read', buffer);
    const result = await poller.pollUntilDone();
    return normalizeAnalysis(result);
  }
}

function normalizeAnalysis(result: AnalyzeResult<AnalyzedDocument>): OCRAnalysis {
  return {
    content: result.content ?? '',
    pages: result.pages?.map((page) => ({
      lines: page.lines?.map((line) => ({
        words: Array.from(line.words?.() ?? []).map((word) => ({
          confidence: word.confidence,
        })),
      })),
    })),
  };
}

export function extractRegistrationNumber(text: string): string | null {
  const prioritizedMatch = text.match(/防犯登録[\s\S]{0,50}?(\d{8,10})\b/u);
  if (prioritizedMatch?.[1]) {
    return prioritizedMatch[1];
  }

  const directMatches = Array.from(text.matchAll(/\b\d{8,10}\b/g)).map((match) => ({
    value: match[0],
    index: match.index ?? 0,
  }));

  if (directMatches.length > 0) {
    const contextualMatch = directMatches.find(({ index }) => {
      const before = text.slice(Math.max(0, index - 50), index);
      const after = text.slice(index, Math.min(text.length, index + 50));
      return (
        before.includes('防犯登録') ||
        before.includes('大阪府警察') ||
        after.includes('大阪府警察')
      );
    });

    return contextualMatch?.value ?? directMatches[0].value;
  }

  const osakaPattern = text.match(/a(\d{11,12})a/gi);
  if (osakaPattern?.[0]) {
    const numericPart = osakaPattern[0].match(/\d+/)?.[0];
    if (numericPart && numericPart.length >= 6) {
      return numericPart.slice(-6);
    }
  }

  return null;
}

export function calculateConfidence(pages: OCRPage[]): number {
  if (pages.length === 0) {
    return 0;
  }

  let totalConfidence = 0;
  let count = 0;

  for (const page of pages) {
    if (typeof page.confidence === 'number') {
      totalConfidence += page.confidence;
      count += 1;
    }

    for (const line of page.lines ?? []) {
      if (typeof line.confidence === 'number') {
        totalConfidence += line.confidence;
        count += 1;
      }

      for (const word of line.words ?? []) {
        if (typeof word.confidence === 'number') {
          totalConfidence += word.confidence;
          count += 1;
        }
      }
    }
  }

  return count > 0 ? totalConfidence / count : 0.95;
}

export class OCRService {
  constructor(
    private readonly analyzer: DocumentAnalyzer,
    private readonly readBuffer: (imagePath: string) => Buffer = (imagePath) =>
      readFileSync(resolve(imagePath))
  ) {}

  async recognizeRegistrationNumber(imagePath: string): Promise<OCRResult> {
    try {
      const imageBuffer = this.readBuffer(imagePath);
      const result = await this.analyzer.analyzeDocument(imageBuffer);
      const rawText = result.content ?? '';
      const registrationNumber = extractRegistrationNumber(rawText);
      const confidence = calculateConfidence(result.pages ?? []);

      return {
        registrationNumber,
        confidence,
        rawText,
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
}

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

    ocrServiceInstance = new OCRService(new AzureDocumentAnalyzer(endpoint, apiKey));
  }

  return ocrServiceInstance;
}
