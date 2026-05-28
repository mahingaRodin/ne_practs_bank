# Figma Mockup — User Registration / Signup Form

> **Note:** Recreate this single-page mockup in Figma using the specifications below. The implemented React `SignupPage` matches this design.

## Page: User Registration

### Layout
- **Canvas:** 1440 × 900 px (desktop), responsive down to 375 px (mobile)
- **Background:** Linear gradient `#0f172a` → `#1e3a5f` (dark blue)
- **Card:** Centered, 420 px wide, white `#ffffff`, border-radius 16 px, shadow `0 25px 50px rgba(0,0,0,0.25)`

### Header (inside card)
- Logo icon: parking "P" badge, 48×48, background `#2563eb`, white text
- Title: **"Create Account"** — Inter Bold 28 px, `#0f172a`
- Subtitle: **"Join XWZ Parking Management"** — Inter Regular 14 px, `#64748b`

### Form Fields (vertical stack, 16 px gap)

| Field | Label | Placeholder | Type |
|-------|-------|-------------|------|
| firstName | First Name | Enter first name | text |
| lastName | Last Name | Enter last name | text |
| email | Email Address | you@example.com | email |
| password | Password | Min. 8 characters | password |
| role | Role | Select role | dropdown |

- Label: Inter Medium 13 px, `#334155`
- Input: height 44 px, border 1 px `#e2e8f0`, radius 8 px, focus ring `#2563eb`
- Role options: **Parking Attendant**, **Admin**

### Primary Button
- Text: **"Sign Up"**
- Full width, height 48 px
- Background `#2563eb`, hover `#1d4ed8`
- Text white, Inter SemiBold 15 px, radius 8 px

### Footer Link
- Text: "Already have an account? **Log in**"
- 14 px, `#64748b`, link `#2563eb`

### Spacing
- Card padding: 40 px
- Field internal padding: 12 px 16 px
- Button margin-top: 8 px

### Mobile (375 px)
- Card full width minus 32 px margin
- Same vertical stack, touch-friendly 44 px inputs

## Figma Layers Structure

```
Signup Page
├── Background (gradient frame)
└── Signup Card
    ├── Logo + Title Group
    ├── Form
    │   ├── First Name Input
    │   ├── Last Name Input
    │   ├── Email Input
    │   ├── Password Input
    │   └── Role Select
    ├── Sign Up Button
    └── Login Link
```

## Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| Primary | #2563eb | Buttons, links, focus |
| Primary Dark | #1d4ed8 | Button hover |
| Background | #0f172a | Page background |
| Surface | #ffffff | Card |
| Text Primary | #0f172a | Headings |
| Text Secondary | #64748b | Subtitles, hints |
| Border | #e2e8f0 | Input borders |
| Error | #ef4444 | Validation messages |
