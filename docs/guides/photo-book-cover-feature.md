# Photo Book Cover Feature Guide

**Feature Status**: ✅ **ACTIVE** - Fully implemented with AI verification and R2 storage
**Updated**: September 2025

## Overview

The Photo Book Cover feature allows users to take photos of their physical book covers and upload them as custom cover images. This replaces the default Google Books cover images with actual photos of the books in your library, providing a more accurate visual representation of your collection.

## Key Features

- **Camera Integration**: Take photos directly from your device's camera
- **AI Verification**: Automatic verification that uploaded images are actual book covers
- **Image Cropping**: Automatic cropping to proper book proportions (2:3 ratio)
- **Cloud Storage**: Images stored in Cloudflare R2 with global CDN distribution
- **Format Optimization**: Automatic WebP/JPEG format selection for optimal file sizes
- **Mobile Optimized**: Touch-friendly interface with safe area support

## How to Use

### 1. Taking a Photo

1. **Navigate to a book** in your library
2. **Open book details** by clicking on a book or using the three-dot menu
3. **Click "Photo Cover"** or similar button (look for camera icon)
4. **Position your book** within the camera frame
5. **Tap "Capture"** when the book cover is clearly visible
6. **Adjust the crop area** to frame just the book cover
7. **Click "Use Cover"** to save the image

### 2. Best Practices for Photos

**Lighting**:
- Use natural light when possible
- Avoid shadows and glare
- Ensure the book title and author are clearly visible

**Positioning**:
- Hold the book flat and straight
- Fill most of the camera frame with the book
- Avoid including background distractions

**Image Quality**:
- Keep the camera steady
- Ensure the book cover is in focus
- Take multiple shots if needed

### 3. What Gets Verified

The AI verification system checks for:

**✅ Accepted Content**:
- Book covers and spines
- Magazines and publications
- Notebooks and journals
- Comic books and graphic novels
- Textbooks and manuals

**❌ Rejected Content**:
- Photos of people or faces
- Clothing or accessories
- Non-book objects
- Inappropriate content

### 4. Image Requirements

**File Formats**: JPEG, PNG, WebP
**Maximum Size**: 5MB per image
**Recommended Resolution**: 800x1200 pixels or higher
**Aspect Ratio**: Automatically cropped to 2:3 (book proportions)

## Managing Custom Covers

### Viewing Current Covers
- Custom covers automatically replace default Google Books images
- Original covers remain available as fallbacks
- Custom covers display throughout the library interface

### Deleting Custom Covers
1. Open book details modal
2. Look for cover management options
3. Select "Remove Custom Cover" or similar option
4. Confirm deletion to revert to original cover

### Replacing Custom Covers
1. Follow the same process as adding a new cover
2. New image will replace the existing custom cover
3. Previous custom image is automatically deleted

## Technical Details

### Storage & Performance
- **Storage**: Cloudflare R2 buckets with global distribution
- **CDN**: Images served via Cloudflare's edge network
- **Caching**: 1-year cache headers for optimal performance
- **Optimization**: WebP format preferred, JPEG fallback

### Security & Privacy
- **AI Verification**: All images verified before storage
- **User Isolation**: Images scoped to individual users
- **Secure URLs**: Environment-specific URL generation
- **Access Control**: Only book owners can upload/delete covers

### Environment Behavior

**Local Development**:
- Uses data URLs (no cloud storage required)
- AI verification disabled with warnings
- Full functionality available offline

**Staging Environment**:
- Full R2 and AI integration for testing
- Public Cloudflare URLs
- Comprehensive error logging

**Production Environment**:
- Custom domain image serving
- Strict AI verification enforcement
- Performance monitoring and alerting

## Troubleshooting

### Camera Issues
**Camera won't start**:
- Check browser permissions for camera access
- Ensure you're using HTTPS (required for camera API)
- Try refreshing the page
- Check if other apps are using the camera

**Poor image quality**:
- Clean your camera lens
- Improve lighting conditions
- Move closer to the book
- Hold the device steady

### Upload Issues
**Image rejected by AI**:
- Ensure the image clearly shows a book cover
- Avoid images with people or non-book content
- Try retaking the photo with better lighting
- Make sure the book title is visible

**Upload fails**:
- Check your internet connection
- Ensure image is under 5MB
- Try a different image format
- Refresh the page and try again

### Display Issues
**Custom cover not showing**:
- Allow a few minutes for CDN propagation
- Try refreshing the page
- Check if the upload was successful
- Verify you have the correct permissions

## Browser Compatibility

**Full Support**:
- Chrome/Chromium (Desktop & Mobile)
- Safari (Desktop & Mobile)
- Firefox (Desktop & Mobile)
- Edge (Desktop & Mobile)

**Fallback Support**:
- Older browsers without camera API
- Progressive enhancement ensures core functionality

## Mobile Optimization

### Touch Interface
- Touch-optimized camera controls
- Swipe gestures for crop adjustment
- Haptic-like visual feedback
- Safe area inset support

### Viewport Adaptation
- Dynamic toolbar positioning
- Browser UI change adaptation
- Orientation change support
- Keyboard navigation accessibility

## Administrator Guide

### Feature Management
- No admin configuration required
- Feature enabled by default for all users
- AI verification runs automatically
- Storage quotas managed at infrastructure level

### Monitoring
- Upload success/failure rates
- AI verification statistics
- Storage usage analytics
- Performance metrics available

### Content Moderation
- AI automatically filters inappropriate content
- Manual review not typically required
- Clear user feedback for rejected images
- Audit trail for all uploads

## API Integration

For developers integrating with the LibraryCard API:

### Upload Endpoint
```
POST /api/books/images/upload
Content-Type: application/json
Authorization: Bearer {session.user.email}

{
  "bookId": 123,
  "image": "data:image/jpeg;base64,/9j/4AAQ...",
  "metadata": {
    "width": 800,
    "height": 1200,
    "size": 245760,
    "format": "jpeg"
  }
}
```

### Response Format
```json
{
  "success": true,
  "imageUrl": "https://images.domain.com/covers/user123/1640995200000-abc123.webp",
  "metadata": {
    "key": "covers/user123/1640995200000-abc123.webp",
    "size": 245760,
    "format": "webp",
    "width": 800,
    "height": 1200
  },
  "verification": {
    "isBookCover": true,
    "confidence": 0.85,
    "detectedLabels": ["book:0.85", "publication:0.72"]
  }
}
```

## Future Enhancements

### Planned Features
- Bulk cover upload for multiple books
- Cover history and versioning
- Community cover sharing
- Enhanced AI model training

### Integration Opportunities
- Publisher API cover sources
- Library catalog integrations
- OCR for automatic metadata extraction
- Machine learning recommendations

---

**Need Help?** Contact support or check the [main documentation](../README.md) for additional resources.