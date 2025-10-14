# DaisyUI Theme Implementation Guidelines

## Default Theme: Synthwave 🌈

The application uses **synthwave** as the default theme for its vibrant, neon aesthetic that provides excellent readability and visual appeal.

## Critical Rule: ALWAYS Use Semantic Classes

### ❌ WRONG - Hardcoded Colors (breaks themes)
```jsx
<div className="bg-white text-gray-900">
  <p className="text-blue-500">Text</p>
  <button className="bg-blue-600 text-white">Button</button>
</div>
```

### ✅ CORRECT - Semantic DaisyUI Classes (theme-aware)
```jsx
<div className="bg-base-100 text-base-content">
  <p className="text-primary">Text</p>
  <button className="btn btn-primary">Button</button>
</div>
```

## Semantic Class Reference

### Backgrounds
```jsx
bg-base-100    // Main background (cards, surfaces)
bg-base-200    // Secondary background (slightly darker/lighter)
bg-base-300    // Tertiary background (borders, dividers)
bg-primary     // Primary color background
bg-secondary   // Secondary color background
bg-accent      // Accent color background
bg-neutral     // Neutral color background
bg-info        // Info alerts/notifications
bg-success     // Success states
bg-warning     // Warning states
bg-error       // Error states
```

### Text Colors
```jsx
text-base-content           // Primary text (auto-adjusts for readability)
text-primary               // Primary colored text
text-primary-content       // Text on primary background (auto-contrast)
text-secondary            // Secondary colored text
text-secondary-content    // Text on secondary background
text-accent               // Accent colored text
text-accent-content       // Text on accent background
text-neutral              // Neutral text
text-neutral-content      // Text on neutral background
text-info                 // Info colored text
text-success              // Success colored text
text-warning              // Warning colored text
text-error                // Error colored text
```

### Borders
```jsx
border-base-300      // Standard border color
border-primary       // Primary colored border
border-secondary     // Secondary colored border
border-accent        // Accent colored border
border-neutral       // Neutral colored border
```

### Buttons (Always Use DaisyUI Button Classes)
```jsx
btn btn-primary      // Primary action button
btn btn-secondary    // Secondary action button
btn btn-accent       // Accent button
btn btn-neutral      // Neutral button
btn btn-ghost        // Ghost/transparent button
btn btn-outline      // Outline button (adapts to theme)
btn btn-link         // Link-style button
```

### Alerts/Notifications
```jsx
alert alert-info     // Info alert (blue tones, theme-aware)
alert alert-success  // Success alert (green tones)
alert alert-warning  // Warning alert (yellow/orange tones)
alert alert-error    // Error alert (red tones)
```

### Badges
```jsx
badge badge-primary    // Primary badge
badge badge-secondary  // Secondary badge
badge badge-accent     // Accent badge
badge badge-neutral    // Neutral badge
badge badge-info       // Info badge
badge badge-success    // Success badge
badge badge-warning    // Warning badge
badge badge-error      // Error badge
badge badge-outline    // Outline badge (theme-aware)
```

### Cards
```jsx
card bg-base-100              // Standard card
card bg-primary text-primary-content  // Colored card with auto-contrast text
```

### Gradients (Theme-Aware)
```jsx
// ✅ CORRECT - Use DaisyUI semantic color names
bg-gradient-to-r from-primary to-primary-focus
bg-gradient-to-r from-primary to-secondary
bg-gradient-to-br from-secondary to-accent
bg-gradient-to-t from-base-200 to-base-100

// ❌ WRONG - Hardcoded Tailwind colors (breaks themes)
bg-gradient-to-r from-purple-600 to-blue-600
bg-gradient-to-r from-blue-500 to-indigo-600
```

**CRITICAL**: When using gradients with colored backgrounds, always set appropriate text color:
```jsx
// Gradient navbar with text color
<div className="bg-gradient-to-r from-primary to-secondary text-primary-content">
  <p>This text is readable!</p>
</div>
```

## Common Patterns

### Header Card
```jsx
<div className="card bg-gradient-to-r from-primary to-primary-focus text-primary-content shadow-xl">
  <div className="card-body">
    <h1 className="text-2xl font-bold">Title</h1>
    <p className="text-primary-content/80">Subtitle</p>
  </div>
</div>
```

### Data Card
```jsx
<div className="card bg-base-100 shadow-xl border border-base-300">
  <div className="card-body">
    <h2 className="card-title text-base-content">Card Title</h2>
    <p className="text-base-content/70">Description text</p>
  </div>
</div>
```

### Form Input
```jsx
<input 
  type="text" 
  className="input input-bordered bg-base-100 text-base-content border-base-300 focus:border-primary"
  placeholder="Enter text..."
/>
```

### Modal
```jsx
<div className="modal-box bg-base-100">
  <h3 className="font-bold text-lg text-base-content">Modal Title</h3>
  <p className="py-4 text-base-content/80">Modal content</p>
  <div className="modal-action">
    <button className="btn btn-primary">Confirm</button>
    <button className="btn btn-ghost">Cancel</button>
  </div>
</div>
```

### Stats/Metrics Card
```jsx
<div className="stats bg-base-100 shadow border border-base-300">
  <div className="stat">
    <div className="stat-title text-base-content/60">Total Users</div>
    <div className="stat-value text-primary">1,234</div>
    <div className="stat-desc text-base-content/50">↗︎ 12% increase</div>
  </div>
</div>
```

## Opacity Modifiers for Readability

Use opacity to create hierarchy without hardcoding colors:
```jsx
text-base-content       // 100% opacity (primary text)
text-base-content/80    // 80% opacity (secondary text)
text-base-content/60    // 60% opacity (tertiary text)
text-base-content/50    // 50% opacity (disabled text)

bg-primary/10           // 10% primary background (subtle highlight)
bg-primary/20           // 20% primary background (hover states)
```

## Theme-Specific Considerations

### Synthwave (Default)
- High contrast neon colors
- Dark background with bright accents
- Pink/cyan/yellow color scheme
- Excellent readability on dark backgrounds

### Corporate
- Professional blue tones
- Light background
- High readability for business use

### Emerald
- Green/teal color scheme
- Nature-inspired
- Good for eco/health apps

### Cyberpunk
- Yellow/pink/purple neon
- Dark background
- Futuristic aesthetic

## Testing Checklist

When implementing new UI:
- [ ] No hardcoded colors (no `text-gray-900`, `bg-white`, etc.)
- [ ] Uses semantic classes (`bg-base-100`, `text-base-content`)
- [ ] Buttons use DaisyUI button classes (`btn btn-primary`)
- [ ] Text has sufficient contrast against background
- [ ] Test in **synthwave** (default)
- [ ] Test in at least 2 other themes (e.g., corporate, emerald)
- [ ] Check readability in both light and dark themes
- [ ] Hover states use theme-aware colors
- [ ] Focus states visible in all themes

## Common Mistakes to Avoid

### ❌ DON'T
```jsx
// Hardcoded gray text
<p className="text-gray-600">Text</p>

// Fixed white background
<div className="bg-white">Content</div>

// Custom colored button
<button className="bg-blue-500 text-white">Click</button>

// Hardcoded border color
<div className="border-gray-300">Content</div>

// Fixed gradient
<div className="bg-gradient-to-r from-blue-500 to-purple-600">Header</div>
```

### ✅ DO
```jsx
// Semantic text color
<p className="text-base-content/70">Text</p>

// Theme-aware background
<div className="bg-base-100">Content</div>

// DaisyUI button
<button className="btn btn-primary">Click</button>

// Theme-aware border
<div className="border border-base-300">Content</div>

// Theme-aware gradient
<div className="bg-gradient-to-r from-primary to-primary-focus">Header</div>
```

## Accessibility & Contrast

DaisyUI automatically ensures sufficient contrast when using semantic classes:
- `text-base-content` on `bg-base-100` → Always readable
- `text-primary-content` on `bg-primary` → Always readable
- `text-error-content` on `bg-error` → Always readable

When using opacity modifiers, ensure:
- Primary text: 100% opacity
- Secondary text: 80% opacity minimum
- Disabled text: 50% opacity minimum

## Migration Guide (Fixing Existing Code)

### Before (Broken themes)
```jsx
<div className="bg-white text-gray-900 border border-gray-200">
  <h1 className="text-blue-600 font-bold">Title</h1>
  <p className="text-gray-600">Description</p>
  <button className="bg-blue-500 text-white px-4 py-2 rounded">
    Click me
  </button>
</div>
```

### After (Theme-aware)
```jsx
<div className="bg-base-100 text-base-content border border-base-300">
  <h1 className="text-primary font-bold">Title</h1>
  <p className="text-base-content/70">Description</p>
  <button className="btn btn-primary">
    Click me
  </button>
</div>
```

## Quick Reference Card

| Purpose | Semantic Class | Never Use |
|---------|---------------|-----------|
| Main background | `bg-base-100` | `bg-white`, `bg-gray-100` |
| Primary text | `text-base-content` | `text-black`, `text-gray-900` |
| Secondary text | `text-base-content/70` | `text-gray-600` |
| Border | `border-base-300` | `border-gray-300` |
| Button | `btn btn-primary` | `bg-blue-500` |
| Alert | `alert alert-info` | `bg-blue-100` |
| Badge | `badge badge-primary` | `bg-blue-500` |

## Summary

**Golden Rule**: If you're tempted to use a color class like `text-gray-600`, `bg-blue-500`, or `border-red-300`, STOP and use the semantic equivalent instead!

DaisyUI's semantic classes ensure:
✅ Theme compatibility
✅ Automatic readability
✅ Consistent design language
✅ Accessibility compliance
✅ User preference support (dark mode, high contrast, etc.)

**When in doubt, check DaisyUI documentation**: https://daisyui.com/docs/colors/
