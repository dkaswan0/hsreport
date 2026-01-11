# Design Guidelines: Car Inspection Application (Arabic RTL)

## Design Approach
**Material Design-Based System** - Ideal for data-heavy professional applications with clear visual hierarchy and robust component patterns. Drawing inspiration from Linear's typography clarity and Notion's organizational structure.

## Core Design Principles
- Professional automotive industry aesthetic with technical precision
- RTL (Right-to-Left) layout throughout entire application
- Clear data hierarchy for inspection records and fault tracking
- Efficient scanning patterns for automotive technicians

---

## Typography System (RTL-Optimized)

**Primary Font**: IBM Plex Sans Arabic (Google Fonts) - excellent Arabic support with professional appearance
**Secondary/English**: Inter (for technical terms/codes)

**Hierarchy**:
- Hero Headlines: 3xl to 5xl, font-semibold
- Section Titles: 2xl to 3xl, font-semibold
- Card Titles: xl, font-medium
- Body Text: base, font-normal
- Labels/Meta: sm, font-medium
- Technical Data: mono (for VIN numbers, codes)

---

## Layout System

**Spacing Primitives**: Use Tailwind units of **2, 4, 6, 8, 12, 16, 20**
- Component padding: p-6 or p-8
- Section spacing: py-16 or py-20
- Card gaps: gap-6
- Form field spacing: space-y-4

**Grid Strategy**:
- Dashboard: 3-column grid (inspection stats cards)
- Fault List: 2-column on desktop, stacked mobile
- Inspection Details: Single column with nested grids for fault items

---

## Component Library

### Navigation
**Top Header (RTL)**:
- Logo positioned right side
- Main navigation items flow right-to-left
- User profile/settings on far left
- Search bar with icon on right side
- Height: h-16, with subtle bottom border

**Sidebar (Optional for Dashboard)**:
- Right-aligned sidebar for quick filters
- Width: w-64
- Collapsible on mobile

### Data Display Components

**Inspection Cards**:
- Rounded corners: rounded-xl
- Padding: p-6
- Shadow: shadow-md with subtle hover lift
- Status badge in top-right corner
- Vehicle image thumbnail (if available)
- Key info: VIN, Date, Inspector, Fault Count

**Fault Status Indicators**:
- Critical: Red badge with alert icon
- Warning: Amber badge with warning icon
- Passed: Green badge with check icon
- Pill-shaped badges: rounded-full, px-4, py-1

**Data Tables**:
- Striped rows for readability
- Sticky headers for long lists
- RTL-aligned columns (align text right for Arabic)
- Action buttons in leftmost column
- Row height: h-16 for comfortable scanning

### Forms

**Inspection Entry Forms**:
- Two-column layout on desktop (vehicle info | inspection details)
- Right-aligned labels above inputs
- Input fields: h-12, rounded-lg
- Dropdowns for fault categories
- Multi-select checkboxes for common issues
- Text areas: min-h-32 for detailed notes
- File upload for photos (drag-and-drop zone)

**Search & Filters**:
- Prominent search bar in header
- Filter chips below search (removable tags)
- Date range picker
- Status filter dropdown

### Action Elements

**Buttons**:
- Primary: Large (h-12), rounded-lg, font-medium
- Secondary: Outlined variant
- Icon buttons: square (w-10, h-10) for actions
- FAB (Floating Action Button): Fixed bottom-left for "New Inspection" (reversed for RTL)

**Buttons on Images** (Hero section):
- Backdrop blur effect: backdrop-blur-md
- Semi-transparent background with high contrast text
- No additional hover states needed

---

## Page Layouts

### Landing Page (Marketing)

**Hero Section**:
- Height: 85vh minimum
- Large hero image: Modern automotive workshop with inspection equipment
- Overlay gradient for text readability
- Headline emphasizing "Comprehensive Vehicle Inspection Tracking"
- Subheadline in Arabic highlighting efficiency
- Dual CTA buttons with backdrop blur
- Trust indicator: "Used by 500+ Automotive Centers"

**Features Section** (3-column grid):
- Digital inspection forms
- Photo documentation
- Fault history tracking
Each with icon, title, brief description

**Benefits Section** (2-column alternating):
- Left: Feature description, Right: Interface preview screenshot
- Alternates for visual rhythm

**CTA Section**:
- Centered call-to-action with demo request form
- Contact information and support hours

### Dashboard (Application)

**Stats Overview** (3-column grid):
- Total Inspections Today
- Critical Faults Pending
- Completion Rate
Each card with large number, label, trend indicator

**Recent Inspections Table**:
- Full-width below stats
- Sortable columns (RTL headers)
- Quick action buttons per row

**Fault Summary Chart**:
- Visual breakdown by category
- Bar chart or donut chart showing distribution

### Inspection Detail View

**Vehicle Header Card**:
- Vehicle photo left (mirrored for RTL: right side)
- VIN, Make, Model, Year stacked
- Status badge prominently displayed

**Fault Checklist**:
- Grouped by system (Engine, Brakes, Electrical, etc.)
- Expandable sections
- Checkbox items with severity indicators
- Photo thumbnails inline

---

## Images

**Hero Image**: Modern, well-lit automotive workshop showing professional technician using tablet for vehicle inspection. Clean, organized environment. High-quality, wide-angle shot.

**Feature Section Icons**: Use Material Icons or Heroicons - car, clipboard-check, camera, chart-bar

**Dashboard Thumbnails**: Small vehicle silhouettes or actual car photos (120x80px thumbnails)

**Inspection Detail**: Full-width vehicle photo at top, inspection point photos (grid layout, 200x200px)

---

## Accessibility & RTL Considerations

- All interactive elements: minimum 44x44px touch targets
- ARIA labels in Arabic
- Logical tab order (right to left)
- Form validation messages right-aligned
- Icons mirror where directional (arrows, chevrons)
- Numbers remain LTR even in RTL context

---

## Professional Polish

- Consistent spacing rhythm throughout
- Data tables with zebra striping
- Loading states for async operations
- Empty states with helpful guidance
- Success confirmations after actions
- Micro-interactions on card hovers (subtle lift + shadow increase)