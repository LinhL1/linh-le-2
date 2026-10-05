'use client';
import { useEffect, useRef } from 'react';

export function CursorEffect() {
  const dotRef  = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches) return;
    document.documentElement.classList.add('custom-cursor');

    let mouseX = 0, mouseY = 0;
    let ringX  = 0, ringY  = 0;
    let rafId: number;
    let visible = false;

    const isDark = () => document.documentElement.classList.contains('dark');

    const updateBlend = () => {
    if (ringRef.current) {
        ringRef.current.style.mixBlendMode = 'difference';
        ringRef.current.style.background   = isDark() ? 'hsl(40 25% 90%)' : 'hsl(40 33% 96%)';
        ringRef.current.style.borderColor  = isDark() ? 'hsl(40 25% 90%)' : 'hsl(160 10% 12%)';
    }
    if (dotRef.current) {
        dotRef.current.style.background = isDark() ? 'hsl(40 25% 90%)' : 'hsl(160 10% 12%)';
    }
    };

    const show = () => {
      if (!visible) {
        visible = true;
        dotRef.current?.style.setProperty('opacity', '1');
        ringRef.current?.style.setProperty('opacity', '1');
      }
    };

    const onMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      show();
      if (dotRef.current) {
        dotRef.current.style.left = mouseX + 'px';
        dotRef.current.style.top  = mouseY + 'px';
      }
    };

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

    const animate = () => {
      ringX = lerp(ringX, mouseX, 0.14);
      ringY = lerp(ringY, mouseY, 0.14);
      if (ringRef.current) {
        ringRef.current.style.left = ringX + 'px';
        ringRef.current.style.top  = ringY + 'px';
      }
      rafId = requestAnimationFrame(animate);
    };
    animate();
    updateBlend();

    const hoverIn = (e: MouseEvent) => {
      const el = e.target as Element;
      if (el.closest('a, button, [role="button"]')) {
        ringRef.current?.classList.add('hovering');
        dotRef.current?.classList.add('hovering');
      }
    };

    const hoverOut = (e: MouseEvent) => {
      const el = e.target as Element;
      if (el.closest('a, button, [role="button"]')) {
        ringRef.current?.classList.remove('hovering');
        dotRef.current?.classList.remove('hovering');
      }
    };

    const onDown = () => ringRef.current?.classList.add('clicking');
    const onUp   = () => ringRef.current?.classList.remove('clicking');

    const onLeave = () => {
      dotRef.current?.style.setProperty('opacity', '0');
      ringRef.current?.style.setProperty('opacity', '0');
      visible = false;
    };

    // Watch for dark mode class changes
    const observer = new MutationObserver(updateBlend);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseover', hoverIn);
    document.addEventListener('mouseout',  hoverOut);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('mouseup',   onUp);
    document.addEventListener('mouseleave', onLeave);

    return () => {
      document.documentElement.classList.remove('custom-cursor');
      cancelAnimationFrame(rafId);
      observer.disconnect();
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseover', hoverIn);
      document.removeEventListener('mouseout',  hoverOut);
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('mouseup',   onUp);
      document.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  return (
    <>
      <div id="cursor-dot"  ref={dotRef}  style={{ opacity: 0 }} />
      <div id="cursor-ring" ref={ringRef} style={{ opacity: 0 }} />
    </>
  );
}