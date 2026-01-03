---
name: ios-design
description: Create distinctive, production-grade iOS interfaces following Apple's Human Interface Guidelines. Use this skill when the user asks to build iOS components, screens, or applications. Generates polished SwiftUI/UIKit code with exceptional attention to platform conventions and design quality.
---

This skill guides creation of distinctive, production-grade iOS interfaces that feel native to Apple's ecosystem while avoiding generic or uninspired implementations. Implement real working code with exceptional attention to platform conventions, aesthetic details, and thoughtful design choices.

The user provides iOS design requirements: a component, screen, flow, or application to build. They may include context about the purpose, audience, or technical constraints.

## Design Thinking

Before coding, understand the context and commit to a clear aesthetic direction within Apple's design language:
- **Purpose**: What problem does this interface solve? Who uses it? What's the primary user task?
- **Tone**: Within iOS conventions, pick a direction: content-focused minimal, information-dense utility, playful and expressive, premium/luxury, editorial/magazine-style, productivity-focused, immersive media, social/community, health/wellness calm, or bold brand-forward. Use these for inspiration but design one true to the app's identity.
- **Constraints**: iOS version targets, device support (iPhone/iPad/Vision Pro), accessibility requirements, system integration needs.
- **Differentiation**: What makes this app feel special while still feeling like it belongs on iOS? What moment will users remember?

**CRITICAL**: iOS design excellence comes from mastering the platform's conventions, then knowing exactly when and how to express personality within them. The best iOS apps feel inevitable—like Apple might have designed them.

Then implement working code (SwiftUI preferred, UIKit when needed) that is:
- Production-grade and functional
- Native-feeling with appropriate use of system components
- Visually refined with a clear aesthetic point-of-view
- Meticulously polished in every interaction detail

## Apple Human Interface Guidelines Principles

**Always respect these foundations:**
- **Clarity**: Content is paramount. Negative space, color, fonts, and graphics highlight what matters. Functionality motivates design.
- **Deference**: Fluid motion and crisp interfaces help users understand content without competing with it.
- **Depth**: Visual layers and realistic motion convey hierarchy and facilitate understanding.

## Liquid Glass (iOS 26+)

Liquid Glass is Apple's design language introduced in iOS 26—a translucent, dynamic material that reflects and refracts surrounding content. It is the preferred visual treatment for modern iOS apps.

**Key principle**: Liquid Glass is exclusively for the navigation layer (toolbars, tab bars, floating buttons, sheets, menus). Never apply it to content itself (lists, tables, media, cards). This separation keeps content primary while controls float above.

The material features real-time light bending, specular highlights that respond to device motion, and gel-like interactive feedback. Apps compiled with Xcode 26 adopt Liquid Glass automatically. The system handles accessibility adaptations for reduced transparency, increased contrast, and reduced motion.

## iOS Design Guidelines

Focus on:

### Typography
- **System Fonts**: Use SF Pro, SF Compact, SF Mono, and New York strategically. These fonts are optimized for legibility and feel unmistakably Apple.
- **Dynamic Type**: Always support Dynamic Type for accessibility. Use semantic text styles (.largeTitle, .headline, .body, .caption) rather than fixed sizes.
- **Typographic Hierarchy**: Create clear visual hierarchy through weight and size contrast. SF Pro's variable weights enable nuanced expression.
- **Custom Fonts**: When brand requires it, pair custom display fonts with SF Pro for body text. Ensure they complement rather than clash with iOS aesthetics.

### Color & Theme
- **System Colors**: Leverage semantic colors (.label, .secondaryLabel, .systemBackground, .tint) that automatically adapt to light/dark mode and accessibility settings.
- **Accent Colors**: Choose a distinctive tint color that works in both light and dark modes. Test at various saturations and against system backgrounds.
- **Vibrancy & Materials**: Use materials for depth effects. On iOS 26+, Liquid Glass supersedes materials for navigation elements.
- **Dark Mode**: Design for both appearances from the start. Dark mode isn't inverted light mode—it requires intentional contrast and hierarchy decisions.

### Motion & Haptics
- **Spring Animations**: Use spring timing over linear/easeInOut for natural-feeling motion. iOS physics feel alive.
- **Meaningful Transitions**: Animations should communicate—elements morph, expand from their origin, maintain spatial consistency.
- **Haptic Feedback**: Integrate haptics at key moments. They make interfaces feel tangible.
- **Restraint**: Not everything needs to animate. Reserve motion for moments that benefit from it—state changes, confirmations, reveals.

### Layout & Composition
- **Safe Areas**: Always respect safe area insets. Content should breathe, not fight device geometry.
- **Consistent Margins**: Use system-standard margins (16pt on iPhone, adaptive on iPad). Consistency with the platform creates comfort.
- **Adaptive Layouts**: Design for all screen sizes. Prefer flexible stacks and grids that naturally adapt.
- **Information Density**: Balance content density with touch target sizes (minimum 44x44pt). Scrolling is natural on iOS—don't cram.
- **Layer Separation**: Maintain clear distinction between content layer and navigation layer.

### Components & Patterns
- **Native Components**: Use system components (NavigationStack, TabView, List, Form, Sheet) as your foundation. Users already know how they work.
- **Custom Components**: When creating custom UI, study Apple's implementations closely. Match interaction patterns, timing, and feedback.
- **Navigation**: Follow platform conventions—push for drill-down, sheets for focused tasks, full-screen covers for immersive content.
- **Gestures**: Support expected gestures (swipe-to-go-back, pull-to-refresh, swipe actions) before adding custom ones.

### Visual Refinement
- **SF Symbols**: Use SF Symbols extensively. They're designed to harmonize with SF Pro and support multiple weights/scales. Prefer symbols over custom icons when possible.
- **Corner Radii**: Match system corner radii with continuous corners. iOS corners have a specific curve profile.
- **Shadows & Depth**: Use subtle shadows—soft, diffuse, suggesting elevation rather than dramatic drop shadows.
- **Blur & Transparency**: Use blur effects intentionally to create iOS's signature layered depth.

## What to Avoid

NEVER create interfaces that feel like:
- Android/Material Design ported to iOS (wrong shadows, wrong motion, wrong navigation patterns)
- Web apps wrapped in a native shell (non-native scrolling feel, wrong typography, missing platform behaviors)
- Generic cross-platform designs that ignore iOS conventions
- Over-designed interfaces that compete with content
- Skeuomorphism (unless deliberately retro)—iOS moved past this in 2013
- Ignoring accessibility (Dynamic Type, VoiceOver, color contrast)
- Applying Liquid Glass to content elements instead of navigation

## Implementation Notes

- **SwiftUI First**: Prefer SwiftUI for modern, declarative code. Use UIKit only when SwiftUI lacks capability.
- **Modern Observation**: Use the `@Observable` macro (iOS 17+) instead of the deprecated `ObservableObject` protocol.
- **Preview-Driven**: Build with Xcode previews. Test light/dark, different Dynamic Type sizes, device sizes, and accessibility settings constantly.

Remember: The best iOS apps feel like natural extensions of the platform—respectful of conventions yet full of personality. They're opinionated within Apple's constraints, not despite them. Show what's possible when deep platform knowledge meets creative vision.
