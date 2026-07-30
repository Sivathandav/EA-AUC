'use client';

import React, { useMemo } from 'react';
import { generateFluidTypography } from '../lib/designTokens';

/**
 * ResponsiveText Component
 * Implements fluid typography that scales smoothly from 320px to 3840px
 * Uses CSS clamp() for automatic sizing without media queries
 */
export default function ResponsiveText({
  variant = 'body',
  size = 'md',
  weight = 400,
  as: Component = 'p',
  children,
  className = '',
  minVw = 320,
  maxVw = 3840,
  ...props
}) {
  // Map semantic sizes to actual pixel values
  const sizeMap = {
    xs: { min: '12px', max: '14px' },
    sm: { min: '13px', max: '16px' },
    md: { min: '14px', max: '18px' },
    lg: { min: '16px', max: '20px' },
    xl: { min: '18px', max: '24px' },
    '2xl': { min: '20px', max: '28px' },
    '3xl': { min: '24px', max: '36px' },
    '4xl': { min: '32px', max: '48px' },
    '5xl': { min: '40px', max: '64px' },
  };

  // Heading scale (larger)
  const headingSizeMap = {
    sm: { min: '18px', max: '24px' },
    md: { min: '24px', max: '32px' },
    lg: { min: '32px', max: '48px' },
    xl: { min: '48px', max: '64px' },
    '2xl': { min: '56px', max: '80px' },
    '3xl': { min: '64px', max: '96px' },
  };

  const displaySizeMap = {
    sm: { min: '32px', max: '48px' },
    md: { min: '48px', max: '72px' },
    lg: { min: '64px', max: '96px' },
    xl: { min: '80px', max: '128px' },
  };

  const getSize = () => {
    if (variant === 'heading') return headingSizeMap[size] || headingSizeMap.md;
    if (variant === 'display') return displaySizeMap[size] || displaySizeMap.md;
    if (variant === 'mono') return sizeMap[size] || sizeMap.md;
    return sizeMap[size] || sizeMap.md;
  };

  const { min, max } = getSize();
  const fluidSize = useMemo(() => generateFluidTypography(minVw, maxVw, min, max), [minVw, maxVw, min, max]);

  const fontFamily = {
    body: 'var(--font-body)',
    heading: 'var(--font-heading)',
    display: '"Bebas Neue", sans-serif',
    mono: 'var(--font-mono)',
  }[variant] || 'var(--font-body)';

  const trackingClass = {
    body: '',
    heading: 'tracking-wide',
    display: 'tracking-widest',
    mono: 'tracking-wide',
  }[variant] || '';

  const lineHeightClass = {
    body: 'leading-relaxed',
    heading: 'leading-tight',
    display: 'leading-none',
    mono: 'leading-normal',
  }[variant] || 'leading-relaxed';

  return (
    <Component
      className={`${trackingClass} ${lineHeightClass} ${className}`}
      style={{
        fontSize: fluidSize,
        fontWeight: weight,
        fontFamily,
      }}
      {...props}
    >
      {children}
    </Component>
  );
}

/**
 * Predefined heading size components for convenience
 */
export function H1({ children, className = '', ...props }) {
  return (
    <ResponsiveText as="h1" variant="display" size="lg" weight={700} className={className} {...props}>
      {children}
    </ResponsiveText>
  );
}

export function H2({ children, className = '', ...props }) {
  return (
    <ResponsiveText as="h2" variant="heading" size="lg" weight={700} className={className} {...props}>
      {children}
    </ResponsiveText>
  );
}

export function H3({ children, className = '', ...props }) {
  return (
    <ResponsiveText as="h3" variant="heading" size="md" weight={600} className={className} {...props}>
      {children}
    </ResponsiveText>
  );
}

export function Body({ children, className = '', ...props }) {
  return (
    <ResponsiveText as="p" variant="body" size="md" weight={400} className={className} {...props}>
      {children}
    </ResponsiveText>
  );
}

export function Mono({ children, className = '', ...props }) {
  return (
    <ResponsiveText as="code" variant="mono" size="sm" weight={400} className={className} {...props}>
      {children}
    </ResponsiveText>
  );
}
