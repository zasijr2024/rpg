import { useRef, useState, type KeyboardEvent } from "react";

export interface CompactStepperControl {
  key: string;
  label: string;
  disabled: boolean;
  onClick: () => void;
  className: string;
}

interface CompactStepperProps {
  label: string;
  className: string;
  controls: CompactStepperControl[];
}

/** A four-action compact control with one tab stop and arrow-key navigation. */
export function CompactStepper({
  label,
  className,
  controls,
}: CompactStepperProps) {
  const [activeIndex, setActiveIndex] = useState(() =>
    controls.findIndex((control) => !control.disabled),
  );
  const buttons = useRef<Array<HTMLButtonElement | null>>([]);
  const firstEnabledIndex = controls.findIndex((control) => !control.disabled);
  const activeControl = controls[activeIndex];
  const rovingIndex =
    !activeControl || activeControl.disabled ? firstEnabledIndex : activeIndex;

  const moveFocus = (
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    const enabled = controls
      .map((control, controlIndex) => (!control.disabled ? controlIndex : -1))
      .filter((controlIndex) => controlIndex >= 0);
    if (enabled.length === 0) return;

    let next: number | undefined;
    switch (event.key) {
      case "ArrowUp":
      case "ArrowLeft":
        next =
          enabled[
            (enabled.indexOf(index) - 1 + enabled.length) % enabled.length
          ];
        break;
      case "ArrowDown":
      case "ArrowRight":
        next = enabled[(enabled.indexOf(index) + 1) % enabled.length];
        break;
      case "Home":
        next = enabled[0];
        break;
      case "End":
        next = enabled.at(-1);
        break;
      default:
        return;
    }

    event.preventDefault();
    if (next === undefined) return;
    setActiveIndex(next);
    buttons.current[next]?.focus();
  };

  return (
    <span className={className} role="group" aria-label={label}>
      {controls.map((control, index) => (
        <button
          key={control.key}
          ref={(element) => {
            buttons.current[index] = element;
          }}
          type="button"
          className={control.className}
          aria-label={control.label}
          disabled={control.disabled}
          tabIndex={!control.disabled && index === rovingIndex ? 0 : -1}
          onFocus={() => setActiveIndex(index)}
          onKeyDown={(event) => moveFocus(event, index)}
          onClick={control.onClick}
        />
      ))}
    </span>
  );
}
