# Interactive Site Tour Implementation Plan

**Issue**: LCWEB-14 - Implement interactive site tour for new users  
**Status**: Implementation Ready  
**Priority**: High - Improves new user onboarding and feature discovery  
**Created**: September 2025  

## Problem Statement

New users may find the LibraryCard interface overwhelming or miss key functionality. Currently there's no onboarding experience to guide users through the main features and workflows, leading to poor feature discovery and user activation.

## Solution: Custom Tour Implementation

### Decision: Custom Implementation vs react-joyride

**Chosen**: Custom implementation using Material-UI components
**Rationale**: 
- Perfect integration with existing design system
- Full control over styling and behavior  
- No additional dependencies (~50kb savings)
- Leverages existing Modal/Portal patterns

## Tour Flow Design

### 6-Step Tour Journey

1. **Welcome** - Introduction to LibraryCard
2. **Add Books** - Highlight "Add Books" button and scanning functionality  
3. **Search & Filters** - Show search bar and filter capabilities
4. **Book Grid** - Demonstrate book display and interaction
5. **Book Details** - Show clicking on books for more info
6. **Account & Settings** - User menu and settings access

### Detailed Step Definitions

```typescript
interface TourStep {
  id: string
  title: string
  content: string
  targetSelector: string
  placement: 'top' | 'bottom' | 'left' | 'right'
  allowClicksOnTarget?: boolean
  disableInteraction?: boolean
}

const TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to LibraryCard!',
    content: 'Let\'s take a quick tour to help you discover all the ways LibraryCard can help you manage your book collection.',
    targetSelector: '[data-tour="main-content"]',
    placement: 'bottom'
  },
  {
    id: 'add-books',
    title: 'Adding Books',
    content: 'Start building your library! Click "Add Books" to manually add books or use your camera to scan ISBN barcodes.',
    targetSelector: '[data-tour="add-books-nav"]', 
    placement: 'bottom',
    allowClicksOnTarget: true
  },
  {
    id: 'search-filters',
    title: 'Search & Organization',
    content: 'Use the search bar and filters to quickly find books. Filter by location, shelf, status, or search by title and author.',
    targetSelector: '[data-tour="search-filters"]',
    placement: 'bottom'
  },
  {
    id: 'book-grid',
    title: 'Your Book Collection',
    content: 'Here\'s where all your books appear. Each book shows its cover, title, author, and current status (available, checked out, etc.).',
    targetSelector: '[data-tour="book-grid"]',
    placement: 'top'
  },
  {
    id: 'book-interaction',
    title: 'Book Details & Actions',
    content: 'Click on any book to view details, check it out, edit information, or see its location. Try clicking on a book!',
    targetSelector: '[data-tour="book-item"]',
    placement: 'top',
    allowClicksOnTarget: true
  },
  {
    id: 'account-settings',
    title: 'Account & Settings',
    content: 'Access your profile, settings, and locations from the account menu. You can also retake this tour anytime from settings.',
    targetSelector: '[data-tour="user-menu"]',
    placement: 'bottom'
  }
]
```

## Technical Architecture

### Component Structure
```
src/components/tour/
├── TourProvider.tsx          # Context provider for tour state
├── TourOverlay.tsx          # Portal-based overlay component  
├── TourTooltip.tsx          # Material-UI based tooltip
├── TourSpotlight.tsx        # Highlighted area component
├── useTour.tsx              # Tour logic hook
└── tourSteps.ts             # Step definitions
```

### Core Components

#### 1. TourProvider (Context + State Management)
```typescript
interface TourContextType {
  isActive: boolean
  currentStepIndex: number  
  steps: TourStep[]
  startTour: () => void
  nextStep: () => void
  prevStep: () => void
  skipTour: () => void
  endTour: () => void
}
```

#### 2. TourOverlay (Portal-based Overlay)
- Dark backdrop (rgba(0, 0, 0, 0.5))
- z-index: 9999 for top-level rendering
- Click outside to skip functionality
- Escape key handling

#### 3. TourSpotlight (Element Highlighting)  
- Calculates target element dimensions and position
- Creates "cut-out" effect in overlay
- Smooth transitions between steps
- Handles scrolling to bring elements into view

#### 4. TourTooltip (Material-UI Dialog/Popover)
- Positioned relative to target element
- Progress indicator (Step X of Y)
- Navigation buttons (Next/Previous/Skip)
- Responsive positioning (adjusts for screen edges)

### State Management Pattern
```typescript
// Tour state in localStorage
interface TourState {
  completed: boolean
  lastCompletedStep?: number
  timestamp: string
}

// Tour step tracking
const TOUR_STORAGE_KEY = 'librarycard-tour-state'
```

### Integration Points

#### 1. App Layout Integration
**File**: `src/components/layout/AppLayoutWithGlobalHeader.tsx`
```typescript
// Add TourProvider wrapper
<TourProvider>
  <GlobalHeader userRole={userRole} userFirstName={userFirstName} />
  <Container>{children}</Container>
  <TourOverlay /> {/* Rendered via Portal */}
</TourProvider>
```

#### 2. Tour Trigger Logic
**Trigger Conditions:**
- New users (no tour completion in localStorage)
- User manually starts tour from settings
- Auto-start after successful signup/verification (integrates with LCWEB-169)

#### 3. Data Attributes for Target Elements
Add `data-tour` attributes to key UI elements:
```typescript
// GlobalHeader.tsx
<Button data-tour="add-books-nav" href="/add-books">Add Books</Button>

// BookLibrary.tsx  
<Box data-tour="search-filters">/* Search and filters */</Box>
<Box data-tour="book-grid">/* Book display area */</Box>

// Individual book items
<Card data-tour="book-item" className="book-card">/* Book content */</Card>
```

## User Experience Design

### Visual Design
- **Backdrop**: Semi-transparent dark overlay (rgba(0, 0, 0, 0.5))
- **Spotlight**: Clean cut-out effect around target element
- **Tooltip**: Material-UI Paper with elevation, consistent with app design
- **Typography**: Uses existing app typography scale
- **Colors**: Primary theme colors for buttons and highlights

### Interactions
- **Navigation**: Next/Previous buttons, step indicators
- **Dismissal**: Skip button, Escape key, click outside
- **Target Interaction**: Some steps allow interaction with highlighted elements
- **Smooth Transitions**: CSS transitions for spotlight movement
- **Mobile Responsive**: Touch-friendly buttons, adjusted positioning

### Accessibility
- **ARIA Labels**: Proper labeling for screen readers
- **Keyboard Navigation**: Tab through buttons, Escape to exit
- **Focus Management**: Maintains focus within tour components
- **High Contrast**: Ensure sufficient contrast for visibility
- **Motion Preferences**: Respects prefers-reduced-motion

## Implementation Phases

### Phase 1: Core Tour System
1. Create tour context and provider
2. Implement overlay with portal
3. Build spotlight highlighting system
4. Create tooltip component with navigation

### Phase 2: Content & Integration  
1. Define all tour step content
2. Add data-tour attributes to target elements
3. Integrate with app layout
4. Add localStorage tour state management

### Phase 3: Settings & Triggers
1. Add tour trigger logic for new users
2. Create settings menu option for retaking tour
3. Integrate with enhanced onboarding (LCWEB-169)
4. Add tour completion tracking

### Phase 4: Polish & Testing
1. Mobile responsive testing
2. Accessibility audit and improvements  
3. Animation and transition polishing
4. Cross-browser testing

## Performance Considerations

- **Lazy Loading**: Tour components only loaded when needed
- **Portal Rendering**: Overlay rendered outside main DOM tree
- **Event Cleanup**: Proper cleanup of event listeners
- **Memory Management**: Clear timeouts and intervals
- **Bundle Size**: Custom implementation adds ~5-10kb vs 50kb library

## Testing Strategy

### Automated Testing
- Unit tests for tour state management
- Component testing for overlay and tooltip
- Integration tests for tour flow

### Manual Testing  
- Mobile and desktop responsiveness
- Keyboard navigation and accessibility
- Different screen sizes and orientations
- Multiple browsers and devices

### User Testing
- New user onboarding experience
- Feature discovery effectiveness
- Tour completion rates and feedback

## Success Metrics

- **Tour Completion Rate**: % of users who complete the full tour
- **Feature Discovery**: Increase in usage of highlighted features
- **User Activation**: Time to first meaningful action (add book, search, etc.)
- **Support Tickets**: Reduction in "how do I..." support requests
- **User Satisfaction**: Feedback scores for onboarding experience

---

**Implementation Priority**: High - Critical for user onboarding  
**Estimated Effort**: 2-3 days (custom implementation)  
**Dependencies**: None - uses existing Material-UI and React patterns