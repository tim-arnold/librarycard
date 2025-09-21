import { Env } from '../types';

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
    // If AI is not available (staging/development), allow all images
    if (!env.AI) {
      console.warn('Cloudflare AI not available - skipping image verification');
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

    // Extract classification results
    const predictions = response?.predictions || [];

    // Look for book-related classifications
    const bookRelatedLabels = [
      'book',
      'notebook',
      'magazine',
      'comic book',
      'paperback',
      'hardcover',
      'novel',
      'textbook',
      'manual',
      'dictionary',
      'encyclopedia',
      'publication'
    ];

    // Look for inappropriate content that we want to reject
    const inappropriateLabels = [
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
      'nude',
      'body',
      'skin'
    ];

    let maxBookConfidence = 0;
    let maxInappropriateConfidence = 0;
    let detectedLabels: string[] = [];
    let hasBookContent = false;
    let hasInappropriateContent = false;

    // Analyze predictions
    for (const prediction of predictions) {
      const label = prediction.label?.toLowerCase() || '';
      const confidence = prediction.score || 0;

      detectedLabels.push(`${label}:${confidence.toFixed(2)}`);

      // Check for book-related content
      for (const bookLabel of bookRelatedLabels) {
        if (label.includes(bookLabel)) {
          hasBookContent = true;
          maxBookConfidence = Math.max(maxBookConfidence, confidence);
        }
      }

      // Check for inappropriate content
      for (const inappropriateLabel of inappropriateLabels) {
        if (label.includes(inappropriateLabel)) {
          hasInappropriateContent = true;
          maxInappropriateConfidence = Math.max(maxInappropriateConfidence, confidence);
        }
      }
    }

    // Decision logic
    let isBookCover = false;
    let rejectionReason: string | undefined;
    let finalConfidence = 0;

    if (hasInappropriateContent && maxInappropriateConfidence > 0.3) {
      // High confidence inappropriate content - reject
      isBookCover = false;
      rejectionReason = 'Image appears to contain inappropriate content (people, faces, etc.)';
      finalConfidence = maxInappropriateConfidence;
    } else if (hasBookContent && maxBookConfidence > 0.2) {
      // Detected book content with reasonable confidence - accept
      isBookCover = true;
      finalConfidence = maxBookConfidence;
    } else if (!hasInappropriateContent && !hasBookContent) {
      // No clear inappropriate content, but also no book content
      // Could be objects, landscapes, etc. - be lenient for now
      isBookCover = true;
      finalConfidence = 0.5;
      rejectionReason = undefined;
    } else {
      // Unclear or low confidence - reject to be safe
      isBookCover = false;
      rejectionReason = 'Image does not appear to be a book cover';
      finalConfidence = Math.max(maxBookConfidence, maxInappropriateConfidence);
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