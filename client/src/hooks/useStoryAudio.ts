import { useCallback, useEffect, useRef, useState } from 'react';
import { requestSpeech } from '../api';

export type PlayerState = 'idle' | 'loading' | 'playing' | 'paused';

interface Options {
  /** Changes whenever a new story is shown; old audio is discarded. */
  storyKey: string;
  /** Verbatim text to read aloud. */
  text: string;
  onNotice?: (message: string) => void;
}

interface CachedAudio {
  key: string;
  blob: Blob;
  url: string;
}

type PlayerMode = 'gemini' | 'browser' | null;

/**
 * Play/pause/stop for the current story. Gemini WAV audio is preferred and
 * cached for instant replay; browser speechSynthesis is the fallback.
 */
export function useStoryAudio({ storyKey, text, onNotice }: Options) {
  const [state, setState] = useState<PlayerState>('idle');
  const [usedFallback, setUsedFallback] = useState(false);
  const stateRef = useRef<PlayerState>('idle');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const cacheRef = useRef<CachedAudio | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const modeRef = useRef<PlayerMode>(null);
  const fallbackRef = useRef<SpeechSynthesisUtterance | null>(null);
  const noticeRef = useRef(onNotice);
  noticeRef.current = onNotice;

  const setPlayerState = useCallback((next: PlayerState) => {
    stateRef.current = next;
    setState(next);
  }, []);

  const clearAudioElement = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.removeAttribute('src');
    audio.load();
    audioRef.current = null;
  }, []);

  const stopBrowser = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    fallbackRef.current = null;
  }, []);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    clearAudioElement();
    stopBrowser();
    modeRef.current = null;
    setPlayerState('idle');
  }, [clearAudioElement, setPlayerState, stopBrowser]);

  const releaseCache = useCallback(() => {
    if (!cacheRef.current) return;
    URL.revokeObjectURL(cacheRef.current.url);
    cacheRef.current = null;
  }, []);

  // A new story means a new key: stop playback and drop the old audio blob.
  useEffect(() => {
    stop();
    releaseCache();
    setUsedFallback(false);
  }, [storyKey, stop, releaseCache]);

  useEffect(
    () => () => {
      stop();
      releaseCache();
    },
    [stop, releaseCache],
  );

  const startBrowserFallback = useCallback(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      noticeRef.current?.('Read aloud is not supported in this browser.');
      setPlayerState('idle');
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.92;
    utterance.pitch = 1;
    utterance.lang = 'en-US';

    const englishVoice = window.speechSynthesis
      .getVoices()
      .find((voice) => voice.lang.toLowerCase().startsWith('en'));
    if (englishVoice) utterance.voice = englishVoice;

    utterance.onend = () => {
      fallbackRef.current = null;
      modeRef.current = null;
      setPlayerState('idle');
    };
    utterance.onerror = () => {
      fallbackRef.current = null;
      modeRef.current = null;
      setPlayerState('idle');
      noticeRef.current?.('Browser speech stopped unexpectedly.');
    };

    fallbackRef.current = utterance;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    modeRef.current = 'browser';
    setUsedFallback(true);
    setPlayerState('playing');
    noticeRef.current?.('Using your browser voice for reading aloud.');
  }, [setPlayerState, text]);

  const playFromUrl = useCallback(
    (url: string) => {
      clearAudioElement();
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.addEventListener(
        'ended',
        () => {
          modeRef.current = null;
          setPlayerState('idle');
        },
        { once: true },
      );

      void audio.play().then(
        () => {
          modeRef.current = 'gemini';
          setPlayerState('playing');
        },
        () => {
          audioRef.current = null;
          startBrowserFallback();
        },
      );
    },
    [clearAudioElement, setPlayerState, startBrowserFallback],
  );

  const play = useCallback(() => {
    stop();

    const cached = cacheRef.current;
    if (cached?.key === storyKey) {
      playFromUrl(cached.url);
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    setPlayerState('loading');

    requestSpeech(text, controller.signal)
      .then((blob) => {
        if (controller.signal.aborted) return;
        const url = URL.createObjectURL(blob);
        cacheRef.current = { key: storyKey, blob, url };
        playFromUrl(url);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        console.warn('[tts] Gemini audio unavailable; using browser fallback.', error);
        startBrowserFallback();
      })
      .finally(() => {
        if (abortRef.current === controller) abortRef.current = null;
      });
  }, [playFromUrl, setPlayerState, startBrowserFallback, stop, storyKey, text]);

  const pause = useCallback(() => {
    if (modeRef.current === 'gemini') audioRef.current?.pause();
    if (modeRef.current === 'browser' && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.pause();
    }
    setPlayerState('paused');
  }, [setPlayerState]);

  const resume = useCallback(() => {
    if (modeRef.current === 'gemini' && audioRef.current) {
      void audioRef.current.play().then(
        () => setPlayerState('playing'),
        () => setPlayerState('idle'),
      );
      return;
    }
    if (modeRef.current === 'browser' && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.resume();
      setPlayerState('playing');
      return;
    }
    play();
  }, [play, setPlayerState]);

  const toggle = useCallback(() => {
    if (stateRef.current === 'playing') {
      pause();
      return;
    }
    if (stateRef.current === 'paused') {
      resume();
      return;
    }
    if (stateRef.current === 'loading') return;
    play();
  }, [pause, play, resume]);

  return { state, usedFallback, toggle, stop };
}
