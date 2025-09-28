import { Env } from '../types';

/**
 * Get allowed AI classification labels from database
 * Includes caching for performance
 */
interface CachedAllowlistData {
  labels: string[];
  confidence_thresholds: [string, number][];
}

async function getAllowedLabels(env: Env): Promise<{ labels: string[], confidence_thresholds: Map<string, number> }> {
  try {
    // Try to get from cache first
    const cacheKey = 'ai_allowlist_v1';
    let allowlistData: CachedAllowlistData | null = null;

    if (env.CACHE) {
      const cached = await env.CACHE.get(cacheKey);
      if (cached) {
        allowlistData = JSON.parse(cached);
      }
    }

    // If not in cache, fetch from database
    if (!allowlistData) {
      const stmt = env.DB.prepare(`
        SELECT label, confidence_threshold
        FROM ai_classification_allowlist
        WHERE is_active = TRUE
      `);

      const result = await stmt.all();
      const labels: string[] = [];
      const thresholdsMap = new Map<string, number>();

      if (result.results) {
        for (const row of result.results as any[]) {
          labels.push(row.label.toLowerCase());
          thresholdsMap.set(row.label.toLowerCase(), row.confidence_threshold || 0.2);
        }
      }

      allowlistData = {
        labels,
        confidence_thresholds: Array.from(thresholdsMap.entries())
      };

      // Cache for 1 hour
      if (env.CACHE) {
        await env.CACHE.put(cacheKey, JSON.stringify(allowlistData), { expirationTtl: 3600 });
      }
    }

    // Convert confidence_thresholds back to Map if it was serialized
    const confidence_thresholds = new Map(allowlistData.confidence_thresholds);

    return {
      labels: allowlistData.labels,
      confidence_thresholds
    };
  } catch (error) {
    console.error('Error fetching allowed labels from database:', error);

    // Fallback to static list if database fails
    const fallbackLabels = [
      'book', 'book jacket', 'notebook', 'magazine', 'comic book',
      'paperback', 'hardcover', 'novel', 'textbook', 'manual',
      'dictionary', 'encyclopedia', 'publication', 'cover', 'jacket', 'spine',
      'doormat', 'door mat'
    ];

    const fallbackThresholds = new Map<string, number>();
    fallbackLabels.forEach(label => fallbackThresholds.set(label, 0.2));

    return {
      labels: fallbackLabels,
      confidence_thresholds: fallbackThresholds
    };
  }
}

/**
 * Image Verification for Book Covers
 * Uses Cloudflare AI to verify that uploaded images are actually book covers
 * and not inappropriate content like selfies or other non-book images
 */

export interface ImageVerificationResult {
  isBookCover: boolean;
  confidence: number;
  rejectionReason?: string;
  detectedLabels?: string[];
}

/**
 * Verify that an image is a book cover using Cloudflare AI
 * Returns true if the image appears to be a book cover, false otherwise
 */
export async function verifyBookCoverImage(
  imageBuffer: Uint8Array,
  env: Env
): Promise<ImageVerificationResult> {
  try {
    // If AI is not available (staging/development), simulate verification for testing
    if (!env.AI) {
      console.warn('Cloudflare AI not available - using local test simulation');

      // For local testing: allow legitimate cover uploads by default
      // Only simulate rejection if specifically testing appeals system

      // Default: allow images when AI not available
      return {
        isBookCover: true,
        confidence: 1.0,
        rejectionReason: undefined,
        detectedLabels: ['ai-not-available']
      };
    }

    // Use Cloudflare AI's image classification model
    // The model we'll use is '@cf/microsoft/resnet-50' for object classification
    const response = await env.AI.run('@cf/microsoft/resnet-50', {
      image: Array.from(imageBuffer)
    });

    console.log('AI Classification Response:', response);

    // Extract classification results - the response IS the predictions array
    const predictions = Array.isArray(response) ? response : (response?.predictions || []);

    // Get dynamic allowlist from database
    const { labels: allowedLabels, confidence_thresholds } = await getAllowedLabels(env);

    // Only reject obvious human/person indicators
    const personIndicators = [
      'person',
      'face',
      'human',
      'selfie',
      'portrait',
      'people',
      'man',
      'woman',
      'child',
      'adult',
      // Strong clothing indicators that almost always mean a person is present
      'sunglasses',
      'lab coat',
      'bow tie',
      'windsor tie',
      'neck brace',
      'seat belt',
      // Body parts that clearly indicate a person
      'nipple',
      'breast',
      'torso',
      'chest',
      'arm',
      'hand',
      'finger',
      'leg',
      'foot'
    ];

    let maxAllowedConfidence = 0;
    let maxPersonConfidence = 0;
    let detectedLabels: string[] = [];
    let hasAllowedContent = false;
    let hasPersonContent = false;

    // Analyze predictions
    for (const prediction of predictions) {
      const label = prediction.label?.toLowerCase() || '';
      const confidence = prediction.score || 0;

      detectedLabels.push(`${label}:${confidence.toFixed(2)}`);

      // Check for explicitly allowed content with dynamic thresholds
      for (const allowedLabel of allowedLabels) {
        if (label.includes(allowedLabel)) {
          const threshold = confidence_thresholds.get(allowedLabel) || 0.2;
          if (confidence >= threshold) {
            hasAllowedContent = true;
            maxAllowedConfidence = Math.max(maxAllowedConfidence, confidence);
          }
        }
      }

      // Check for person indicators
      for (const personLabel of personIndicators) {
        if (label.includes(personLabel)) {
          hasPersonContent = true;
          maxPersonConfidence = Math.max(maxPersonConfidence, confidence);
        }
      }
    }

    // Decision logic: ONLY allow if we detect book-related content
    let isBookCover = false;
    let rejectionReason: string | undefined;
    let finalConfidence = 0;

    if (hasAllowedContent) {
      // Detected book-related content above dynamic thresholds - accept
      isBookCover = true;
      finalConfidence = maxAllowedConfidence;
    } else {
      // No book-related content detected - reject everything else
      isBookCover = false;
      rejectionReason = 'Image does not appear to be a book cover. Please upload a clear photo of a book cover with the title and author visible.';
      finalConfidence = 0;
    }

    return {
      isBookCover,
      confidence: finalConfidence,
      rejectionReason,
      detectedLabels
    };

  } catch (error) {
    console.error('Error during image verification:', error);

    // If AI verification fails, be permissive in development/staging
    // but more restrictive in production
    const isProduction = env.ENVIRONMENT === 'production';

    return {
      isBookCover: !isProduction, // Allow in dev/staging, reject in production if AI fails
      confidence: 0,
      rejectionReason: isProduction
        ? 'Unable to verify image content - please try again'
        : undefined,
      detectedLabels: ['verification-error']
    };
  }
}

/**
 * Convert a base64 data URL to a Uint8Array buffer
 */
export function dataUrlToBuffer(dataUrl: string): Uint8Array {
  const dataUrlMatch = dataUrl.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
  if (!dataUrlMatch) {
    throw new Error('Invalid data URL format');
  }

  const [, , base64Data] = dataUrlMatch;
  return Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
}