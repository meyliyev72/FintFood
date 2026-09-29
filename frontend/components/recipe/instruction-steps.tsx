import Image from "next/image";

import { mediaUrl } from "@/lib/api/client";
import type { InstructionStep } from "@/types";

/**
 * Numbered instruction list (§7).
 *
 * Rendered on the server: it is static content once the recipe is loaded, so
 * there is no reason to ship it as a client component.
 */
export function InstructionSteps({
  steps,
  className,
}: {
  steps: InstructionStep[];
  className?: string;
}) {
  return (
    <ol className={`m-0 list-none space-y-6 p-0 ${className ?? ""}`}>
      {steps.map((step) => {
        const image = mediaUrl(step.image);
        return (
          <li key={step.step_number} className="flex gap-4">
            <span
              aria-hidden
              className="grid size-8 shrink-0 place-items-center rounded-full bg-brand-soft text-sm font-bold text-fg-brand"
            >
              {step.step_number}
            </span>

            <div className="min-w-0 flex-1 space-y-3">
              <p className="text-[15px] leading-relaxed text-fg">{step.instruction}</p>
              {image ? (
                <div className="relative aspect-video max-w-md overflow-hidden rounded-[12px] border border-border bg-surface-sunken">
                  <Image
                    src={image}
                    alt=""
                    fill
                    sizes="(max-width: 768px) 100vw, 28rem"
                    className="object-cover"
                  />
                </div>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
