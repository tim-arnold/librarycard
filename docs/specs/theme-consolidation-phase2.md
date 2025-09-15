# Theme Consolidation - Phase 2: Component Migration

## Overview

Phase 2 focuses on migrating marketing components to use Material-UI theme directly instead of CSS variables where beneficial, while maintaining backward compatibility.

## Migration Strategy

### Components to Migrate (Priority Order)

1. **GlobalHeader** - Already uses marketing variables, good test case
2. **Button** - Most used component, high impact  
3. **Typography components** - Text, Heading, etc.
4. **Container/Grid/Flex** - Layout components
5. **Card components** - Feature cards, pricing cards
6. **Form components** - ContactForm, inputs

### Migration Approach

**Hybrid Strategy**: Components will accept both:
- Material-UI theme via `useTheme()` hook (preferred)
- CSS variables as fallback (for backward compatibility)

This allows gradual migration without breaking existing implementations.

### Example Migration Pattern

```typescript
// Before (CSS variables only)
const Button = ({ variant, children }) => (
  <button className={`marketing-button marketing-button-${variant}`}>
    {children}
  </button>
)

// After (Theme + CSS variables hybrid)  
const Button = ({ variant, children }) => {
  const theme = useTheme()
  
  return (
    <button
      className={`marketing-button marketing-button-${variant}`}
      style={{
        // Theme-aware styles override CSS variables
        '--marketing-primary': theme.palette.primary.main,
        '--marketing-text-primary': theme.palette.text.primary,
      }}
    >
      {children}
    </button>
  )
}
```

## Benefits of Component Migration

1. **Better TypeScript Support** - Theme properties are typed
2. **Runtime Theme Access** - Components can adapt behavior based on theme
3. **Reduced CSS Bundle** - Less CSS variables needed over time
4. **Material-UI Integration** - Better integration with MUI ecosystem
5. **Dynamic Styling** - More flexible styling based on theme state

## Phase 2 Tasks

### Task 1: Migrate GlobalHeader
- ✅ Already uses marketing variables
- ✅ Add direct theme usage for colors
- ❌ **BLOCKED**: Reduce dependency on marketing CSS classes

### Task 2: Migrate Button Component
- ❌ **NOT STARTED**: Add useTheme hook integration
- ❌ **NOT STARTED**: Add theme-aware style overrides
- ❌ **NOT STARTED**: Maintain CSS class fallbacks

### Task 3: Migrate Typography Components
- ❌ **NOT STARTED**: Text component theme integration
- ❌ **NOT STARTED**: Heading component theme integration
- ❌ **NOT STARTED**: Dynamic font family/sizing from theme

### Task 4: Test Migration
- ❌ **NOT STARTED**: Verify all marketing pages still work
- ❌ **NOT STARTED**: Test theme switching functionality
- ❌ **NOT STARTED**: Check for visual regressions

## Implementation Notes

### Import Pattern
```typescript
import { useTheme } from '@mui/material/styles'
// or for marketing-only components:
import { useTheme } from '@/lib/ThemeContext'
```

### Style Override Pattern
```typescript
// CSS custom properties for immediate override
style={{
  '--marketing-primary': theme.palette.primary.main,
  backgroundColor: theme.palette.background.paper,
  color: theme.palette.text.primary,
}}
```

### Conditional Styling Pattern
```typescript
// Different styles based on theme mode
const isDark = theme.palette.mode === 'dark'
const styles = {
  backgroundColor: isDark ? theme.palette.background.paper : '#ffffff',
  boxShadow: isDark ? '0 4px 6px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.1)'
}
```

## Success Criteria

- [ ] All marketing components work with theme switching
- [ ] No visual regressions on marketing pages
- [ ] Improved theme consistency across app/marketing
- [ ] Reduced reliance on static CSS variables
- [ ] Maintained backward compatibility

## Current Blockers (September 2025)

### Primary Issue
**Marketing components are not migrated** - The Button component (`src/components/marketing/ui/Button.tsx`) still uses pure CSS classes without any theme integration. This means:

1. Marketing pages don't respect user theme preferences
2. Dark mode doesn't work on marketing pages
3. Theme color variants don't apply to marketing content
4. The infrastructure is ready but components aren't using it

### Specific Tasks Needed
1. **Update Button component** to use `useTheme()` and inject CSS custom properties
2. **Verify and migrate Card component** if it exists
3. **Find and migrate Typography components** (Text, Heading)
4. **Update any other marketing UI components** to use theme system
5. **Test marketing pages** (`/`, `/pricing`, `/features`, etc.) with theme switching

## Rollback Plan

If issues arise:
1. Individual components can be reverted to CSS-only approach
2. Phase 1 dynamic variables still provide theme consistency
3. Gradual rollback possible component by component

---

**Next Steps**: Start with GlobalHeader migration as proof of concept, then move to Button component.