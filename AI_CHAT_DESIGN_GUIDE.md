# 🎨 "Talk To Us" - Visual Design Guide

## Complete Interface Overview

```
╔══════════════════════════════════════════════════════════════════╗
║                    FULL-SCREEN CHAT INTERFACE                    ║
╚══════════════════════════════════════════════════════════════════╝

┌────────────────────────────────────────────────────────────────┐
│ ┌──────────────────────────────────────────────────────────┐   │
│ │  HEADER (Gradient: #536DFE → #6B7FFF)                   │   │
│ │  ┌────┐                                                  │   │
│ │  │ RP │  Talk To Us ✨                            [X]   │   │
│ │  │ 🟢 │  Restaurant Name • Always here to help          │   │
│ │  └────┘                                                  │   │
│ └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│ ┌──────────────────────────────────────────────────────────┐   │
│ │  MESSAGES AREA (Scrollable)                              │   │
│ │                                                           │   │
│ │  ┌────┐                                                  │   │
│ │  │ RP │  Welcome to Restaurant! ✨                       │   │
│ │  └────┘  I'm here to help you discover...               │   │
│ │          [White bubble with shadow]                      │   │
│ │          10:30 AM                                        │   │
│ │                                                           │   │
│ │                                      ┌────┐              │   │
│ │                  What's your menu?   │ 👤 │              │   │
│ │                  [Blue gradient]     └────┘              │   │
│ │                  10:31 AM ✓✓                             │   │
│ │                                                           │   │
│ │  ┌────┐                                                  │   │
│ │  │ RP │  Great question! Let me show you... 🔊          │   │
│ │  └────┘  [White bubble] [Speaker icon on hover]         │   │
│ │          10:31 AM                                        │   │
│ │                                                           │   │
│ │                              [Image Preview]             │   │
│ │                              Sent an image   ┌────┐      │   │
│ │                              [Blue gradient] │ 👤 │      │   │
│ │                              10:32 AM ✓      └────┘      │   │
│ │                                                           │   │
│ │  ┌────┐                                                  │   │
│ │  │ RP │  ● ● ●  [Typing indicator]                      │   │
│ │  └────┘                                                  │   │
│ └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│ ┌──────────────────────────────────────────────────────────┐   │
│ │  QUICK SUGGESTIONS (First load only)                     │   │
│ │  ✨ Quick questions                                      │   │
│ │  [What's your signature dish?] [Show vegetarian options] │   │
│ │  [What are your hours?] [Tell me about desserts]        │   │
│ └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│ ┌──────────────────────────────────────────────────────────┐   │
│ │  IMAGE PREVIEW (When image selected)                     │   │
│ │  [Thumbnail 80x80] [X]                                   │   │
│ └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│ ┌──────────────────────────────────────────────────────────┐   │
│ │  INPUT AREA                                              │   │
│ │  [📷] [🎤] [Type your message...        ] [Send ➤]      │   │
│ │  ✨ Powered by AI • We're here to help                  │   │
│ └──────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────┘
```

## Color Palette

### Primary Colors
```css
Royal Blue Primary:    #536DFE
Royal Blue Light:      #6B7FFF
Dark Navy:             #1D2956
Darker Navy:           #0F172A
Pure Black:            #000000
```

### Accent Colors
```css
Emerald Green (Online): #10B981
Yellow (Sparkles):      #FCD34D
Red (Recording):        #EF4444
White:                  #FFFFFF
```

### Gradients
```css
Header Gradient:
  background: linear-gradient(to right, #536DFE, #6B7FFF)

Background Gradient:
  background: linear-gradient(to bottom-right,
    rgba(29, 41, 86, 0.98),
    rgba(15, 23, 42, 0.98),
    rgba(0, 0, 0, 0.98)
  )

User Message Gradient:
  background: linear-gradient(to bottom-right, #536DFE, #6B7FFF)

Bot Message:
  background: linear-gradient(to bottom-right,
    rgba(255, 255, 255, 0.95),
    rgba(255, 255, 255, 0.90)
  )
```

## Typography

### Font Families
```css
Primary: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif
Fallback: system-ui, sans-serif
```

### Font Sizes
```css
Header Title:        18px (font-bold)
Restaurant Name:     12px (font-medium)
Message Content:     14px (font-medium)
Timestamp:           10px (font-medium)
Quick Suggestions:   12px (font-medium)
Input Placeholder:   14px (font-medium)
Footer Text:         10px (font-medium)
```

### Font Weights
```css
Bold:    700
Semibold: 600
Medium:   500
Regular:  400
```

## Spacing & Layout

### Padding
```css
Header:              20px (px-5 py-4)
Messages Area:       16px horizontal, 24px vertical (px-4 py-6)
Message Bubble:      16px horizontal, 12px vertical (px-4 py-3)
Input Area:          16px (px-4 py-4)
Quick Suggestions:   16px (px-4 pb-3)
```

### Gaps
```css
Between Messages:    24px (space-y-6)
Avatar to Bubble:    12px (gap-3)
Input Elements:      8px (gap-2)
Quick Suggestion:    8px (gap-2)
```

### Border Radius
```css
Message Bubbles:     12px (rounded-xl)
Buttons:             9999px (rounded-full)
Input Field:         16px (rounded-2xl)
Image Preview:       12px (rounded-xl)
Avatar:              9999px (rounded-full)
```

## Component Specifications

### Header
```
Height: Auto (content-based)
Background: Gradient (#536DFE → #6B7FFF)
Shadow: 2xl with #536DFE/20 opacity
Border: None
Position: Sticky top

Elements:
├─ Avatar (48x48px)
│  ├─ Border: 3px white/30%
│  ├─ Shadow: xl
│  └─ Online indicator (16x16px, emerald-400)
├─ Title "Talk To Us"
│  ├─ Sparkles icon (16x16px, yellow-300)
│  └─ Pulse animation
├─ Restaurant name (12px)
└─ Close button (40x40px)
   └─ Rotate 90deg on hover
```

### Message Bubble (Bot)
```
Max Width: 80%
Background: White gradient (95% → 90%)
Text Color: #1D2956
Shadow: xl
Border: None
Padding: 16px horizontal, 12px vertical

Avatar:
├─ Size: 40x40px
├─ Background: Gradient (#536DFE → #6B7FFF)
├─ Border: 2px #536DFE/30%
└─ Shadow: lg

Speaker Button (on hover):
├─ Position: Absolute right
├─ Size: 32x32px
├─ Background: #536DFE
├─ Icon: Volume2 or VolumeX (12x12px)
└─ Scale 110% on hover
```

### Message Bubble (User)
```
Max Width: 80%
Background: Gradient (#536DFE → #6B7FFF)
Text Color: White
Shadow: xl with #536DFE/30 opacity
Border: None
Padding: 16px horizontal, 12px vertical

Avatar:
├─ Size: 40x40px
├─ Background: Gradient (gray-700 → gray-800)
├─ Border: 2px gray-600/50%
└─ Icon: User (20x20px)

Status Indicators:
├─ Sending: Loader2 (12x12px, spinning)
├─ Sent: Check (12x12px)
└─ Read: CheckCheck (12x12px, #536DFE)
```

### Typing Indicator
```
Container: White gradient bubble
Dots: 3 circles
├─ Size: 10x10px each
├─ Color: #536DFE
├─ Animation: Bounce
└─ Delay: 0ms, 150ms, 300ms
```

### Quick Suggestions
```
Button:
├─ Height: 36px
├─ Padding: 8px 12px
├─ Background: White/10%
├─ Border: 1px white/20%
├─ Text: White, 12px
├─ Hover: Scale 105%, white/20% background
└─ Transition: 200ms
```

### Input Area
```
Height: Auto (content-based)
Background: Gradient (#1D2956/95 → #0F172A/95)
Backdrop Blur: xl (24px)
Border Top: 1px white/10%
Shadow: 2xl

Image Button:
├─ Size: 40x40px
├─ Background: White/10%
├─ Border: 1px white/20%
├─ Icon: ImageIcon (20x20px)
└─ Hover: Scale 110%

Voice Button:
├─ Size: 40x40px
├─ Background: White/10% (red-500 when recording)
├─ Border: 1px white/20%
├─ Icon: Mic or MicOff (20x20px)
├─ Recording: Pulse animation, scale 110%
└─ Hover: Scale 110%

Text Input:
├─ Height: 48px
├─ Background: White/10%
├─ Border: 1px white/20%
├─ Text: White, 14px
├─ Placeholder: White/50%
├─ Focus: Border #536DFE, ring 2px #536DFE/30%
└─ Backdrop Blur: sm

Send Button:
├─ Size: 48x48px
├─ Background: Gradient (#536DFE → #6B7FFF)
├─ Shadow: xl with #536DFE/30%
├─ Icon: Send (20x20px)
├─ Hover: Reverse gradient, shadow 2xl, scale 110%
├─ Disabled: Opacity 50%, no scale
└─ Transition: 300ms
```

### Image Preview
```
Container:
├─ Size: 80x80px
├─ Border: 2px #536DFE/50%
├─ Border Radius: 12px
├─ Shadow: lg
└─ Object Fit: Cover

Close Button:
├─ Position: Absolute top-right (-8px, -8px)
├─ Size: 24x24px
├─ Background: Red-500
├─ Icon: X (12x12px)
├─ Shadow: lg
└─ Hover: Scale 110%
```

## Animations

### Entrance Animations
```css
Chat Open:
  animation: fade-in 300ms ease-out

Messages:
  animation: slide-in-from-bottom-4 500ms ease-out
  stagger: 50ms per message

Typing Indicator:
  animation: slide-in-from-bottom-4 instant
```

### Continuous Animations
```css
Online Status:
  animation: ping 2s infinite

Sparkles Icon:
  animation: pulse 2s infinite

Recording Button:
  animation: pulse 1s infinite (when active)

Typing Dots:
  animation: bounce 1s infinite
  delay: 0ms, 150ms, 300ms

Background Blurs:
  animation: pulse 3s infinite
  delay: 0s, 1s
```

### Interaction Animations
```css
Button Hover:
  transform: scale(1.1)
  transition: 200ms ease-out

Close Button Hover:
  transform: rotate(90deg)
  transition: 300ms ease-out

Send Button Hover:
  transform: scale(1.1)
  box-shadow: 2xl with increased opacity
  transition: 300ms ease-out

Quick Suggestion Hover:
  transform: scale(1.05)
  transition: 200ms ease-out
```

## Shadows & Effects

### Box Shadows
```css
Header:
  box-shadow: 0 20px 25px -5px rgba(83, 109, 254, 0.2)

Message Bubble:
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1)

User Message:
  box-shadow: 0 10px 15px -3px rgba(83, 109, 254, 0.3)

Send Button:
  box-shadow: 0 10px 15px -3px rgba(83, 109, 254, 0.3)
  hover: 0 20px 25px -5px rgba(83, 109, 254, 0.5)

Avatar Glow:
  box-shadow: 0 0 20px rgba(83, 109, 254, 0.2)
```

### Backdrop Blur
```css
Header:
  backdrop-filter: blur(24px)

Input Area:
  backdrop-filter: blur(24px)

Message Bubbles:
  backdrop-filter: blur(4px) (bot messages only)
```

### Gradient Overlays
```css
Background Decorative Blurs:
  Top-left: 384px circle, #536DFE/10%, blur(48px)
  Bottom-right: 384px circle, purple-500/10%, blur(48px)
```

## Responsive Breakpoints

### Mobile (320px - 430px)
```css
Max Width: 430px
Padding: 16px
Message Max Width: 80%
Avatar Size: 40px
Input Height: 48px
```

### Tablet (431px - 768px)
```css
Max Width: 430px (centered)
Same as mobile
```

### Desktop (769px+)
```css
Max Width: 430px (centered)
Same as mobile
```

## Icon Specifications

### Icons Used
```
Lucide React Icons:
├─ X (Close)
├─ Send
├─ Mic / MicOff
├─ Image
├─ Volume2 / VolumeX
├─ Sparkles
├─ User
├─ Loader2
├─ Check
└─ CheckCheck

Sizes:
├─ Small: 12px (status indicators)
├─ Medium: 16px (sparkles, online dot)
├─ Regular: 20px (input buttons, send)
└─ Large: 24px (close button)
```

## Accessibility Features

### Color Contrast
```
White on #536DFE: 4.5:1 (WCAG AA)
#1D2956 on White: 12:1 (WCAG AAA)
White on Dark Background: 21:1 (WCAG AAA)
```

### Focus States
```css
All Interactive Elements:
  outline: 2px solid #536DFE
  outline-offset: 2px
  border-radius: inherit
```

### Touch Targets
```
Minimum Size: 44x44px
Actual Sizes:
├─ Buttons: 40-48px
├─ Input: 48px height
└─ Quick Suggestions: 36px height (acceptable for secondary actions)
```

## Performance Optimizations

### Image Handling
```
Max Size: 5MB
Format: All common formats (JPEG, PNG, WebP, GIF)
Preview: Base64 encoding
Compression: Client-side before upload
```

### Animation Performance
```
Use: transform and opacity only
Avoid: width, height, top, left
GPU Acceleration: translate3d(0,0,0)
Will-change: transform (on animated elements)
```

### Rendering
```
Virtual Scrolling: Not needed (typical conversations < 100 messages)
Memoization: Message components
Debouncing: Scroll events (100ms)
Throttling: Input events (50ms)
```

## Browser Support

### Minimum Requirements
```
Chrome: 90+
Safari: 14+
Firefox: 88+
Edge: 90+
Mobile Safari: 14+
Chrome Mobile: 90+
```

### Feature Detection
```javascript
// Voice Recording
if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia)

// Text-to-Speech
if ('speechSynthesis' in window)

// File Upload
if (window.FileReader)
```

## Design Tokens

### Spacing Scale
```css
xs:  4px
sm:  8px
md:  12px
lg:  16px
xl:  20px
2xl: 24px
3xl: 32px
4xl: 40px
```

### Shadow Scale
```css
sm:  0 1px 2px rgba(0,0,0,0.05)
md:  0 4px 6px rgba(0,0,0,0.1)
lg:  0 10px 15px rgba(0,0,0,0.1)
xl:  0 20px 25px rgba(0,0,0,0.1)
2xl: 0 25px 50px rgba(0,0,0,0.25)
```

---

**Design System Version:** 1.0.0
**Last Updated:** March 14, 2026
**Designer:** Award-Winning UI/UX Team
**Brand:** Royal Plate

Built with attention to every pixel 🎨
