'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface GlowBorderCardProps extends React.HTMLAttributes<HTMLDivElement> {
    children?: React.ReactNode;
    width?: string;
    height?: string;
    aspectRatio?: string;
    borderRadius?: string;
    animationDuration?: number;
    gradientColors?: string[];
    borderWidth?: string;
    blurAmount?: string;
    inset?: string;
    colorPreset?: 'nature' | 'ocean' | 'sunset' | 'aurora' | 'custom' | 'mono';
    paused?: boolean;
}

const colorPresets: Record<string, string[]> = {
    nature: ['#669900', '#88bb22', '#99cc33', '#aaddaa', '#ccee66', '#006699', '#228888', '#3399cc', '#55aacc', '#669900'],
    ocean: ['#006699', '#1177aa', '#2288bb', '#3399cc', '#44aadd', '#55bbee', '#66ccff', '#44bbee', '#2299cc', '#006699'],
    sunset: ['#ff6600', '#ff7711', '#ff8822', '#ff9900', '#ffaa22', '#ffbb44', '#ffcc00', '#ff9933', '#ff7722', '#ff6600'],
    aurora: ['#00ff87', '#22ffaa', '#44ffcc', '#60efff', '#88ddff', '#bb99ff', '#dd77ee', '#ff68f0', '#ff55cc', '#00ff87'],
    custom: ['#669900', '#99cc33', '#ccee66', '#006699', '#3399cc', '#990066', '#cc3399', '#ff6600', '#ff9900', '#ffcc00'],
    mono: ['#e2e8f0', '#94a3b8', '#cbd5e1', '#64748b', '#f1f5f9', '#94a3b8', '#e2e8f0', '#64748b', '#cbd5e1', '#e2e8f0'],
};

export const GlowBorderCard = React.forwardRef<HTMLDivElement, GlowBorderCardProps>(
    (
        {
            children,
            className,
            width = '100%',
            height,
            aspectRatio = 'auto',
            borderRadius = '1rem',
            animationDuration = 6,
            gradientColors,
            borderWidth = '1px',
            blurAmount = '6px',
            inset = '0px',
            colorPreset = 'mono',
            paused = false,
            style,
            ...props
        },
        ref
    ) => {
        const colors = gradientColors || colorPresets[colorPreset] || colorPresets.mono;

        const colorVars: Record<string, string> = {};
        for (let i = 0; i < 10; i++) {
            colorVars[`--glow-color-${i + 1}`] = colors[i % colors.length];
        }

        return (
            <div
                ref={ref}
                className={cn(
                    "relative overflow-hidden grid place-content-center isolate",
                    "bg-slate-950/60 backdrop-blur-md",
                    className
                )}
                style={{
                    width: width,
                    height: height || 'auto',
                    aspectRatio: height ? 'unset' : aspectRatio,
                    borderRadius: borderRadius,
                    '--glow-animation-duration': `${animationDuration}s`,
                    ...colorVars,
                    ...style,
                } as React.CSSProperties}
                {...props}
            >
                <div
                    className={cn(
                        "absolute -z-10",
                        "border-solid rounded-[inherit]",
                        "glow-conic",
                        paused && "[animation-play-state:paused]"
                    )}
                    style={{
                        inset: inset,
                        borderWidth: borderWidth,
                        filter: `blur(${blurAmount})`
                    }}
                />

                <div
                    className="relative z-10 w-full h-full bg-transparent flex items-center justify-center"
                >
                    {children}
                </div>
            </div>
        );
    }
);

GlowBorderCard.displayName = 'GlowBorderCard';

export default GlowBorderCard;
