# Royal Plate Website

A stunning, professional landing page for the Royal Plate restaurant booking and pre-ordering app, built with Vanilla JavaScript, HTML, and Tailwind CSS.

## 🎨 Design Features

- **Color Theme**: Matches the Royal Plate app perfectly with gold (`hsl(38, 92%, 50%)`) and royal blue (`hsl(215, 79%, 35%)`) color scheme
- **Typography**: Poppins font family with varying weights for professional appearance
- **Animations**: Powered by GSAP and Anime.js for smooth, interactive experiences
- **Responsive**: Fully responsive design that works on all devices

## 📁 File Structure

```
website/
├── index.html          # Main HTML file
├── styles.css          # Custom CSS styles
├── script.js           # JavaScript with GSAP & Anime.js animations
├── imgs/
│   ├── bg/            # Background images (scene1-5.jpeg)
│   └── screenshots/   # App screenshots
└── README.md          # This file
```

## 🚀 Features

### Hero Section
- Animated hero with rotating background images from `imgs/bg/`
- Floating crown logo animation
- Stats counter animation
- Smooth scroll indicators

### Features Section
- 6 feature cards with hover animations
- Icon animations on hover
- Smooth scroll-triggered entrance animations

### Screenshots Gallery
- 7 app screenshots from `imgs/screenshots/`
- Hover overlays with descriptions
- Staggered entrance animations

### How It Works
- 3-step process visualization
- Interactive step cards with hover effects
- Numbered badges with animations

### VIP Waitlist Form
- Beautiful form with validation
- Rotating background images
- Success message animations
- Email capture functionality
- VIP benefits showcase

### Footer
- Links to Mingalar Mon brand website
- Quick navigation links
- Professional layout

## 🎭 Animations

### GSAP Animations
- ScrollTrigger for scroll-based animations
- Hero content entrance sequences
- Stats counter with number animation
- Parallax effects on backgrounds
- Smooth transitions between sections

### Anime.js Animations
- Feature card entrance animations
- Screenshot card scaling effects
- Icon rotation on hover
- Background image transitions
- Form success message

## 🛠️ Technologies Used

- **HTML5**: Semantic markup
- **Tailwind CSS**: Utility-first CSS framework (via CDN)
- **Vanilla JavaScript**: No frameworks, pure JS
- **GSAP 3.12.5**: Professional-grade animation library
- **Anime.js 3.2.2**: Lightweight animation library
- **Poppins Font**: Google Fonts

## 🎯 Integration with Mingalar Mon

This website is designed to integrate with the Mingalar Mon brand ecosystem:
- Links to [www.mingalarmon.com](https://www.mingalarmon.com)
- Powered by Mingalar Mon branding in footer
- Consistent color scheme and design language

## 📱 Responsive Design

The website is fully responsive with breakpoints for:
- Mobile devices (< 768px)
- Tablets (768px - 1024px)
- Desktops (> 1024px)

## 🎨 Color Palette

```css
Gold: hsl(38, 92%, 50%)
Gold Light: hsl(38, 92%, 65%)
Gold Dark: hsl(38, 92%, 40%)

Royal Blue: hsl(215, 79%, 35%)
Royal Blue Light: hsl(215, 79%, 50%)
Royal Blue Dark: hsl(215, 79%, 25%)

Gray Scale: hsl(220, 13%, 11%) to hsl(220, 13%, 95%)
```

## 🚀 Deployment

To deploy this website:

1. **Static Hosting**: Upload all files to any static hosting service (Vercel, Netlify, GitHub Pages)
2. **CDN**: All libraries are loaded from CDN, no build process needed
3. **No Dependencies**: Pure vanilla JavaScript, no npm packages required

### Quick Start

Simply open `index.html` in a modern web browser, or serve it with any static file server:

```bash
# Using Python
python3 -m http.server 8080

# Using Node.js http-server
npx http-server

# Using PHP
php -S localhost:8080
```

Then visit `http://localhost:8080`

## ✨ Key Interactions

1. **Mobile Menu**: Hamburger menu for mobile devices
2. **Smooth Scroll**: All navigation links scroll smoothly
3. **Form Validation**: VIP waitlist form with validation
4. **Hover Effects**: Interactive cards and buttons
5. **Scroll Progress**: Progress bar at top of page
6. **Background Transitions**: Smooth image transitions in hero and waitlist sections

## 📝 VIP Waitlist Data

Form submissions are currently:
- Stored in localStorage
- Displayed with success animation
- Can be integrated with any backend API

To integrate with a real backend, modify the form submission handler in `script.js` around line 327.

## 🎁 Manual/Documentation

The website serves as both a landing page and a manual for the Royal Plate app:
- Feature explanations
- Step-by-step usage guide
- Visual demonstrations through screenshots
- Clear value propositions

## 🔗 Links

- **Brand Website**: [www.mingalarmon.com](https://www.mingalarmon.com)
- **App Features**: Documented in the Features section
- **VIP Waitlist**: Join to get early access

## 📄 License

© 2026 Royal Plate by Mingalar Mon. All rights reserved.

---

**Built with ❤️ for the Royal Plate app by Mingalar Mon**
