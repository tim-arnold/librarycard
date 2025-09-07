import { TourStep } from './tourTypes'

export const TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to LibraryCard!',
    content: 'Let\'s take a quick tour to help you discover all the ways LibraryCard can help you manage your book collection. This tour will only take a minute!',
    targetSelector: '[data-tour="main-content"]',
    placement: 'bottom'
  },
  {
    id: 'add-books',
    title: 'Adding Books to Your Library',
    content: 'Start building your collection! Click "Add Books" to manually add books or use your camera to scan ISBN barcodes for instant book information.',
    targetSelector: '[data-tour="add-books-nav"]',
    placement: 'bottom',
    allowClicksOnTarget: false // Prevent navigation during tour
  },
  {
    id: 'search-filters',
    title: 'Search & Organization',
    content: 'Use the search bar and filters to quickly find books in your collection. Filter by location, shelf, status, or search by title, author, and genre.',
    targetSelector: '[data-tour="search-filters"]',
    placement: 'bottom'
  },
  {
    id: 'book-grid',
    title: 'Your Book Collection',
    content: 'Here\'s where all your books appear in an organized grid. Each book shows its cover, title, author, and current status (available, checked out, etc.).',
    targetSelector: '[data-tour="book-grid"]',
    placement: 'top'
  },
  {
    id: 'book-interaction',
    title: 'Book Details & Actions',
    content: 'Click on any book to view detailed information, check it out, edit details, move between shelves, or see its current location.',
    targetSelector: '[data-tour="book-item"]',
    placement: 'top',
    allowClicksOnTarget: true // Allow interaction with books
  },
  {
    id: 'account-settings',
    title: 'Account & Settings',
    content: 'Access your profile, settings, locations, and more from the account menu. You can also retake this tour anytime from your settings.',
    targetSelector: '[data-tour="user-menu"]',
    placement: 'bottom'
  }
]