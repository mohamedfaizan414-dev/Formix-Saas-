import * as React from "react";

const ANIMATION_CONFIG = {
  duration: 280,
  easing: "cubic-bezier(0.2, 0.8, 0.2, 1)",
  fill: "both",
};

export function useFlipAnimation(ref, dependencyKey) {
  const previousPosition = React.useRef(null);

  React.useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;

    const firstBox = previousPosition.current;
    const lastBox = element.getBoundingClientRect();
    previousPosition.current = lastBox;

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
