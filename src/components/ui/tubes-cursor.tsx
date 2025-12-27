"use client";

import React, { useEffect, useRef } from 'react';

declare global {
  interface Window {
    __TubesCursorLib__?: unknown;
  }
}

interface TubesCursorApp {
  dispose?: () => void;
  tubes?: {
    setColors: (colors: string[]) => void;
  };
}

export default function TubesCursor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const appRef = useRef<TubesCursorApp | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadLibrary = (): Promise<unknown> => {
      return new Promise((resolve, reject) => {
        // Check if already loaded
        if (window.__TubesCursorLib__) {
          resolve(window.__TubesCursorLib__);
          return;
        }

        // Create a script that loads the module and stores it
        const loaderScript = document.createElement('script');
        loaderScript.type = 'module';
        loaderScript.textContent = `
          import('https://cdn.jsdelivr.net/npm/threejs-components@0.0.19/build/cursors/tubes1.min.js')
            .then(module => {
              window.__TubesCursorLib__ = module.default || module;
              window.dispatchEvent(new CustomEvent('tubes-cursor-ready'));
            })
            .catch(err => {
              window.dispatchEvent(new CustomEvent('tubes-cursor-error', { detail: err }));
            });
        `;

        const onReady = () => {
          window.removeEventListener('tubes-cursor-ready', onReady);
          window.removeEventListener('tubes-cursor-error', onError);
          resolve(window.__TubesCursorLib__);
        };

        const onError = (e: Event) => {
          window.removeEventListener('tubes-cursor-ready', onReady);
          window.removeEventListener('tubes-cursor-error', onError);
          const errorEvent = e as CustomEvent;
          reject(errorEvent.detail || new Error('Failed to load TubesCursor library'));
        };

        window.addEventListener('tubes-cursor-ready', onReady);
        window.addEventListener('tubes-cursor-error', onError);

        document.head.appendChild(loaderScript);
      });
    };

    const init = async () => {
      if (!canvasRef.current) return;

      try {
        const TubesCursorLib = await loadLibrary() as (canvas: HTMLCanvasElement, options: unknown) => unknown;

        if (isMounted && canvasRef.current && TubesCursorLib) {
          appRef.current = TubesCursorLib(canvasRef.current, {
            tubes: {
              colors: ["#5e72e4", "#8965e0", "#f5365c"],
              lights: { intensity: 200, colors: ["#21d4fd", "#b721ff", "#f4d03f", "#11cdef"] }
            }
          }) as TubesCursorApp;
        }
      } catch (error) {
        console.error('Error loading TubesCursor library:', error);
      }
    };

    const timer = setTimeout(init, 100);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      if (appRef.current?.dispose) {
        appRef.current.dispose();
      }
    };
  }, []);

  return (
    <div className="relative h-screen w-screen bg-black overflow-hidden cursor-pointer" 
         onClick={() => {
           const rand = () => "#" + Math.floor(Math.random()*16777215).toString(16);
           appRef.current?.tubes?.setColors([rand(), rand(), rand()]);
         }}>
      <canvas ref={canvasRef} className="fixed inset-0 z-0" />
      <div className="relative z-10 flex h-full flex-col items-center justify-center pointer-events-none">
        <h1 className="text-white text-8xl font-black tracking-tighter uppercase drop-shadow-2xl">
          ~Orewa Zenith
        </h1>
        <p className="text-white/50 tracking-widest uppercase text-sm mt-4">
          Click anywhere to change colors
        </p>
      </div>
    </div>
  );
}
