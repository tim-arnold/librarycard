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

    // Extract classification results - the response IS the predictions array
    const predictions = Array.isArray(response) ? response : (response?.predictions || []);

    // Allowlist approach: what we explicitly allow
    const allowedLabels = [
      // Books and book-related items
      'book',
      'book jacket',
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
      'publication',
      'cover',
      'jacket',
      'spine',
      // Common misclassifications that are actually fine
      'doormat',
      'door mat'
    ];

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

      // Check for explicitly allowed content
      for (const allowedLabel of allowedLabels) {
        if (label.includes(allowedLabel)) {
          hasAllowedContent = true;
          maxAllowedConfidence = Math.max(maxAllowedConfidence, confidence);
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

    if (hasAllowedContent && maxAllowedConfidence > 0.2) {
      // Detected book-related content - accept
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