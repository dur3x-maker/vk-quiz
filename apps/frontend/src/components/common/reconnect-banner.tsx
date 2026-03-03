'use client';

import { useEffect, useRef, useState } from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { useGameStore } from '@/store/game';

const DISCONNECT_THRESHOLD_MS = 3000;
const FADE_OUT_MS = 300;

const TRANSPORT_REASONS = new Set([
  'transport close',
  'transport error',
  'ping timeout',
  'connect_error',
]);

export function ReconnectBanner() {
  const { isSocketConnected, isReconnecting, disconnectReason } = useGameStore();
  const [visible, setVisible] = useState(false);
  const [fading, setFading] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const isTransportDisconnect = !isSocketConnected
    && disconnectReason !== null
    && TRANSPORT_REASONS.has(disconnectReason);

  useEffect(() => {
    if (isTransportDisconnect) {
      timerRef.current = setTimeout(() => {
        setFading(false);
        setVisible(true);
      }, DISCONNECT_THRESHOLD_MS);
    } else {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (visible) {
        setFading(true);
        const fadeTimer = setTimeout(() => {
          setVisible(false);
          setFading(false);
        }, FADE_OUT_MS);
        return () => clearTimeout(fadeTimer);
      }
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isTransportDisconnect, visible]);

  if (!visible) return null;

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 transition-opacity duration-300 ${
        fading ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div className="bg-amber-600 text-white">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center justify-center gap-2 text-sm">
            {isReconnecting ? (
              <>
                <Wifi className="w-4 h-4 animate-pulse" />
                <span>Переподключение к серверу...</span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4" />
                <span>Нет соединения с сервером</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
