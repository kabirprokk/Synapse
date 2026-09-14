import React, { useState } from "react";
import { cn } from "@/lib/utils";

export interface FaqItem {
  question: string;
  answer: React.ReactNode;
}

export interface FaqAccordionProps extends React.HTMLAttributes<HTMLDivElement> {
  items?: FaqItem[];
  title?: string;
  className?: string;
}

export function FaqAccordion({
  items = [],
  title = "Questions",
  className,
  ...props
}: FaqAccordionProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const toggleItem = (index: number) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <div className={cn("w-full max-w-3xl mx-auto py-8 relative font-sans", className)} {...props}>
      {title && (
        <h2 className="text-center font-bold text-2xl md:text-3xl mb-10 text-slate-200">
          {title}
        </h2>
      )}

      <ul className="w-full mx-auto list-none p-0 flex flex-col">
        {items.map((item, index) => {
          const isActive = activeIndex === index;
          return (
            <li
              key={index}
              className={cn(
                "w-full relative transition-all duration-300 ease-in",
                "border-b border-white/10",
                "last:border-b-0"
              )}
            >
              <button
                className={cn(
                  "flex flex-row items-center justify-start w-full min-h-[60px] py-4 relative m-0 px-4 pl-14 cursor-pointer",
                  "border-l-2 transition-colors duration-200 text-left outline-none text-base md:text-lg",
                  isActive
                    ? "border-l-white bg-white/5 text-white font-semibold"
                    : "border-l-white/15 bg-transparent text-slate-400 hover:border-l-white/50 hover:text-white hover:bg-white/[0.02]"
                )}
                onClick={() => toggleItem(index)}
                aria-expanded={isActive}
              >
                <span
                  className={cn(
                    "absolute left-4 md:left-5 top-1/2 -translate-y-1/2 transition-all duration-200 leading-none",
                    isActive ? "text-[28px] md:text-[32px] font-light text-white" : "text-[22px] md:text-[26px] font-light text-slate-500"
                  )}
                >
                  {isActive ? "−" : "+"}
                </span>

                <span className="pr-8">{item.question}</span>
              </button>

              <div
                className={cn(
                  "grid transition-all duration-300 ease-in-out w-full",
                  "border-l-2",
                  isActive ? "grid-rows-[1fr] border-l-white bg-white/[0.03]" : "grid-rows-[0fr] border-l-white/15 bg-transparent"
                )}
              >
                <div className="overflow-hidden">
                  <div className="flex flex-row items-start justify-start w-full px-4 pl-14 pb-6 pt-2 text-sm md:text-base font-normal text-slate-400">
                    <span className="opacity-90">{item.answer}</span>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default FaqAccordion;
