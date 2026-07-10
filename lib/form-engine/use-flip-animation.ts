// lib/form-engine/use-flip-animation.ts
import * as React from "react";

const ANIMATION_CONFIG: KeyframeAnimationOptions = {
  duration: 280,
  easing: "cubic-bezier(0.2, 0.8, 0.2, 1)",
  fill: "both",
};

/**
 * FLIP (First, Last, Invert, Play) animation: when an element's grid
 * position changes (tracked via `dependencyKey`, typically an
 * "x-y-w-h" string), animate it from its previous screen position to its
 * new one instead of letting it jump instantly.
 */
export function useFlipAnimation(ref: React.RefObject<HTMLElement | null>, dependencyKey: string) {
  const previousPosition = React.useRef<DOMRect | null>(null);

  React.useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;

    const firstBox = previousPosition.current;
    const lastBox = element.getBoundingClientRect();
    previousPosition.current = lastBox;

    // Nothing to animate from on first mount, or if the element has no
    // measurable size yet (e.g. still hidden/unlaid-out).
    if (!firstBox || lastBox.width === 0 || lastBox.height === 0) return;

    const deltaX = firstBox.left - lastBox.left;
    const deltaY = firstBox.top - lastBox.top;
    const scaleX = firstBox.width / lastBox.width;
    const scaleY = firstBox.height / lastBox.height;

    const isNegligible =
      Math.abs(deltaX) < 0.5 &&
      Math.abs(deltaY) < 0.5 &&
      Math.abs(scaleX - 1) < 0.01 &&
      Math.abs(scaleY - 1) < 0.01;

    if (isNegligible) return;

    // Cancel any in-flight animation on this element before starting a new
    // one, so rapid successive layout changes (e.g. fast drag reordering)
    // don't stack conflicting animations.
    element.getAnimations().forEach((anim) => anim.cancel());

    element.animate(
      [
        {
          transform: `translate(${deltaX}px, ${deltaY}px) scale(${scaleX}, ${scaleY})`,
          transformOrigin: "top left",
        },
        { transform: "translate(0, 0) scale(1, 1)", transformOrigin: "top left" },
      ],
      ANIMATION_CONFIG
    );
  }, [dependencyKey, ref]);
}