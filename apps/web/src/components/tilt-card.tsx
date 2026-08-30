'use client';

import Link from 'next/link';
import {
  useCallback,
  useEffect,
  useRef,
  type ComponentPropsWithoutRef,
  type ElementType,
  type MouseEvent,
  type ReactNode,
} from 'react';

type TiltCardProps<T extends ElementType = 'div'> = {
  children: ReactNode;
  className?: string;
  href?: string;
  as?: T;
  disableTilt?: boolean;
} & Omit<ComponentPropsWithoutRef<T>, 'as' | 'children' | 'className'>;

const MAX_TILT = 16;
const PERSPECTIVE = 650;

export function TiltCard<T extends ElementType = 'div'>({
  children,
  className = '',
  href,
  as,
  onClick,
  disableTilt = false,
  ...rest
}: TiltCardProps<T>) {
  const Component = (as ?? 'div') as ElementType;
  const reducedMotionRef = useRef(false);

  useEffect(() => {
    reducedMotionRef.current = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
  }, []);

  const applyTilt = useCallback((root: HTMLElement, x: number, y: number) => {
    const rotateY = (x - 0.5) * MAX_TILT * 2;
    const rotateX = (0.5 - y) * MAX_TILT * 2;
    root.style.transition = 'none';
    root.style.transform = `perspective(${PERSPECTIVE}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  }, []);

  const resetTilt = useCallback((root: HTMLElement) => {
    root.style.transition = 'transform 0.25s ease-out';
    root.style.transform = '';
    root.classList.remove('tilt-card--active');
  }, []);

  const handleMouseMove = useCallback(
    (event: MouseEvent<HTMLElement>) => {
      if (disableTilt || reducedMotionRef.current) return;
      const root = event.currentTarget;
      const rect = root.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      applyTilt(root, x, y);
    },
    [applyTilt, disableTilt],
  );

  const handleMouseEnter = useCallback(
    (event: MouseEvent<HTMLElement>) => {
      if (disableTilt || reducedMotionRef.current) return;
      event.currentTarget.classList.add('tilt-card--active');
    },
    [disableTilt],
  );

  const handleMouseLeave = useCallback(
    (event: MouseEvent<HTMLElement>) => {
      if (disableTilt || reducedMotionRef.current) return;
      resetTilt(event.currentTarget);
    },
    [disableTilt, resetTilt],
  );

  const classes = `tilt-card card ${className}`.trim();
  const handlers = disableTilt
    ? {}
    : {
        onMouseMove: handleMouseMove,
        onMouseEnter: handleMouseEnter,
        onMouseLeave: handleMouseLeave,
      };

  const content = <div className="tilt-card__content">{children}</div>;

  if (href) {
    return (
      <Link href={href} className={classes} {...handlers} {...rest}>
        {content}
      </Link>
    );
  }

  return (
    <Component className={classes} onClick={onClick} {...handlers} {...rest}>
      {content}
    </Component>
  );
}
