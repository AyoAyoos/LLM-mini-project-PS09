import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError, requestStory } from './api';
import { TTS_VOICE_LABEL } from './constants';
import { DetailPanel } from './components/DetailPanel';
import { ErrorCard } from './components/ErrorCard';
import { LoadingCard } from './components/LoadingCard';
import { Sidebar } from './components/Sidebar';
import { StoryForm } from './components/StoryForm';
import { StoryView } from './components/StoryView';
import { SubHeader } from './components/SubHeader';
import { TipsCard } from './components/TipsCard';
import { Toast } from './components/Toast';
import { Topbar } from './components/Topbar';
import { useStoryAudio } from './hooks/useStoryAudio';
import type { AppStatus, Story, StoryRequest, ToastMessage, ToastTone } from './types';

const INITIAL_AGE = 6;

export default function App() {
  const [status, setStatus] = useState<AppStatus>('form');
  const [age, setAge] = useState(INITIAL_AGE);
  const [characters, setCharacters] = useState<string[]>([]);
  const [moral, setMoral] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [moralFilter, setMoralFilter] = useState('');
  const [story, setStory] = useState<Story | null>(null);
  const [lastRequest, setLastRequest] = useState<StoryRequest | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [showTips, setShowTips] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const storyAbortRef = useRef<AbortController | null>(null);

  const notify = useCallback((message: string, tone: ToastTone = 'info') => {
    setToast({ id: Date.now() + Math.random(), message, tone });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 4_000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const storyKey = story ? `${story.title}\n${story.story}\n${story.moral}` : '';
  const ttsText = story
    ? `${story.title}. ${story.story.replace(/\s+/g, ' ')} ${story.moral}`
    : '';

  const audio = useStoryAudio({
    storyKey,
    text: ttsText,
    onNotice: (message) => notify(message),
  });

  const generate = useCallback(
    async (request: StoryRequest) => {
      storyAbortRef.current?.abort();
      const controller = new AbortController();
      storyAbortRef.current = controller;

      audio.stop();
      setStatus('loading');
      setError(null);
      setSidebarOpen(false);

      try {
        const result = await requestStory(request, controller.signal);
        setStory(result);
        setLastRequest(request);
        setStatus('story');
        notify('Your story is ready.', 'success');
      } catch (caught) {
        if (controller.signal.aborted) return;
        const message =
          caught instanceof ApiError
            ? caught.message
            : 'We could not make a story just now. Please try again.';
        setError(message);
        setStatus('error');
        notify(message, 'error');
      } finally {
        if (storyAbortRef.current === controller) storyAbortRef.current = null;
      }
    },
    [audio.stop, notify],
  );

  const handleNewStory = useCallback(() => {
    storyAbortRef.current?.abort();
    storyAbortRef.current = null;
    audio.stop();
    setStory(null);
    setLastRequest(null);
    setError(null);
    setStatus('form');
    setSidebarOpen(false);
  }, [audio.stop]);

  const handleRetry = useCallback(() => {
    const request = lastRequest ?? { age, characters, moral: moral.trim() };
    void generate(request);
  }, [age, characters, generate, lastRequest, moral]);

  const handleClearForm = useCallback(() => {
    storyAbortRef.current?.abort();
    storyAbortRef.current = null;
    audio.stop();
    setAge(INITIAL_AGE);
    setCharacters([]);
    setMoral('');
    setSelectedPreset(null);
    setMoralFilter('');
    setStory(null);
    setLastRequest(null);
    setError(null);
    setStatus('form');
    setSidebarOpen(false);
  }, [audio.stop]);

  const handleSelectMoralFromSidebar = useCallback(
    (value: string) => {
      handleNewStory();
      setMoral(value);
      setSelectedPreset(value);
    },
    [handleNewStory],
  );

  const handleSelectPreset = useCallback((value: string) => {
    setMoral(value);
    setSelectedPreset(value);
  }, []);

  const handleMoralChange = useCallback((value: string) => {
    setMoral(value);
    setSelectedPreset(null);
  }, []);

  const handleCopyVoice = useCallback(async () => {
    try {
      if (!navigator.clipboard) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(TTS_VOICE_LABEL);
      notify('Voice name copied.', 'success');
    } catch {
      notify('Could not copy the voice name.');
    }
  }, [notify]);

  return (
    <div className="app-frame">
      <div className="app-panel">
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          moralFilter={moralFilter}
          onMoralFilterChange={setMoralFilter}
          selectedMoral={selectedPreset ?? ''}
          onSelectMoral={handleSelectMoralFromSidebar}
          onShowForm={handleNewStory}
          showTips={showTips}
          onToggleTips={() => setShowTips((current) => !current)}
          onNotify={(message) => notify(message)}
        />

        <div className="main">
          <Topbar
            onToggleSidebar={() => setSidebarOpen((current) => !current)}
            onToggleTips={() => setShowTips((current) => !current)}
            onNotify={(message) => notify(message)}
          />
          <SubHeader onClear={handleClearForm} onToggleTips={() => setShowTips((current) => !current)} />

          <div className="workspace">
            <DetailPanel
              age={age}
              characters={characters}
              moral={selectedPreset ?? moral}
              onCopyVoice={() => void handleCopyVoice()}
              onToggleTips={() => setShowTips((current) => !current)}
            />

            <main className="content-column">
              {(status === 'form' || status === 'loading') && (
                <>
                  <StoryForm
                    age={age}
                    characters={characters}
                    moral={moral}
                    selectedPreset={selectedPreset}
                    moralFilter={moralFilter}
                    loading={status === 'loading'}
                    onAgeChange={setAge}
                    onCharactersChange={setCharacters}
                    onMoralChange={handleMoralChange}
                    onSelectPreset={handleSelectPreset}
                    onSubmit={(request) => void generate(request)}
                  />
                  {status === 'loading' && <LoadingCard />}
                </>
              )}

              {status === 'story' && story && (
                <StoryView
                  story={story}
                  audioState={audio.state}
                  usedFallback={audio.usedFallback}
                  onToggleAudio={audio.toggle}
                  onStopAudio={audio.stop}
                  onNewStory={handleNewStory}
                  onRegenerate={handleRetry}
                />
              )}

              {status === 'error' && (
                <ErrorCard
                  message={error ?? 'Something went wrong. Please try again.'}
                  onRetry={handleRetry}
                  onChangeDetails={handleNewStory}
                />
              )}

              {showTips && <TipsCard />}
            </main>
          </div>
        </div>
      </div>

      {toast && <Toast toast={toast} onDismiss={() => setToast(null)} />}
    </div>
  );
}
