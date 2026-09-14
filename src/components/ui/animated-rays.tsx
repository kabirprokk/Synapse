import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface AnimatedRaysProps {
    className?: string;
    children?: React.ReactNode;
}

export function AnimatedRays({
    className = "",
    children,
}: AnimatedRaysProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    const stripes = `repeating-linear-gradient(
        100deg,
        var(--stripe-color) 0%,
        var(--stripe-color) 7%,
        transparent 10%,
        transparent 12%,
        var(--stripe-color) 16%
    )`;
    const rainbow = `repeating-linear-gradient(
        100deg,
        #60a5fa 10%,
        #e879f9 15%,
        #60a5fa 20%,
        #5eead4 25%,
        #60a5fa 30%
    )`;

    return (
        <section className={cn("relative w-full h-full overflow-hidden", className)}>
            <div
                className="absolute inset-0"
                style={{
                    ["--stripe-color" as string]: "rgba(148,163,184,0.25)",
                    backgroundImage: `${stripes}, ${rainbow}`,
                    backgroundSize: "300%, 200%",
                    backgroundPosition: "50% 50%, 50% 50%",
                    filter: "blur(10px) opacity(50%) saturate(200%)",
                    maskImage: "radial-gradient(ellipse at 100% 0%, black 40%, transparent 70%)",
                    WebkitMaskImage: "radial-gradient(ellipse at 100% 0%, black 40%, transparent 70%)",
                } as React.CSSProperties}
            >
                <div
                    className="absolute inset-0 animate-aurora-bg"
                    style={{
                        backgroundImage: `${stripes}, ${rainbow}`,
                        backgroundSize: "200%, 100%",
                        backgroundAttachment: "fixed",
                        mixBlendMode: "difference",
                    }}
                />
            </div>

            {children && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center">
                    {children}
                </div>
            )}
        </section>
    );
}

export default AnimatedRays;
