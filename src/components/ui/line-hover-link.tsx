import * as React from "react";
import { cn } from "@/lib/utils";

const lineHoverStyles = `
.link-hover { cursor: pointer; position: relative; display: inline-flex; width: fit-content; white-space: nowrap; color: currentColor; text-decoration: none; outline: none; }
.link-hover::before, .link-hover::after { position: absolute; left: 0; top: 100%; width: 100%; height: 1px; background: currentColor; pointer-events: none; }
.link-hover::before { content: ""; }
.link-hover:focus-visible { border-radius: 0.25rem; outline: 2px solid color-mix(in srgb, currentColor 45%, transparent); outline-offset: 0.25rem; }
.link-hover--slide::before { transform: scale3d(0, 1, 1); transform-origin: 100% 50%; transition: transform 0.3s ease; }
.link-hover--slide:hover::before, .link-hover--slide:focus-visible::before { transform: scale3d(1, 1, 1); transform-origin: 0% 50%; }
.link-hover__graphic { position: absolute; left: 0; top: 0; fill: none; stroke: currentColor; stroke-width: 1px; pointer-events: none; }
.link-hover__graphic--stroke path { stroke-dasharray: 1; stroke-dashoffset: 1; }
.link-hover:hover .link-hover__graphic--stroke path, .link-hover:focus-visible .link-hover__graphic--stroke path { stroke-dashoffset: 0; }
.link-hover--arc::before { display: none; }
.link-hover__graphic--arc { left: -23%; top: 73%; }
.link-hover__graphic--arc path { transition: stroke-dashoffset 0.4s cubic-bezier(0.7, 0, 0.3, 1); }
.link-hover:hover .link-hover__graphic--arc path, .link-hover:focus-visible .link-hover__graphic--arc path { transition-duration: 0.3s; transition-timing-function: cubic-bezier(0.8, 1, 0.7, 1); }
@media (prefers-reduced-motion: reduce) { .link-hover, .link-hover *, .link-hover::before, .link-hover::after { animation: none !important; transition-duration: 0.01ms !important; } }
`;

export type LineHoverVariant = "slide" | "arc";

export interface LineHoverLinkProps
    extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
    variant?: LineHoverVariant;
    children: React.ReactNode;
    className?: string;
}

const ArcGraphic = () => (
    <svg
        className="link-hover__graphic link-hover__graphic--stroke link-hover__graphic--arc"
        width="100%"
        height="18"
        viewBox="0 0 59 18"
    >
        <path
            d="M.945.149C12.3 16.142 43.573 22.572 58.785 10.842"
            pathLength="1"
        />
    </svg>
);

export const LineHoverLink = React.forwardRef<
    HTMLAnchorElement,
    LineHoverLinkProps
>(({ variant = "arc", children, className, ...props }, ref) => {
    const needsSpan = variant === "arc";

    return (
        <>
            <style>{lineHoverStyles}</style>
            <a
                ref={ref}
                className={cn("link-hover", `link-hover--${variant}`, className)}
                {...props}
            >
                {needsSpan ? <span>{children}</span> : children}
                {variant === "arc" && <ArcGraphic />}
            </a>
        </>
    );
});

LineHoverLink.displayName = "LineHoverLink";

export default LineHoverLink;
