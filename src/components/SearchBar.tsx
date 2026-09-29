import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Sparkles, AlertCircle, HelpCircle, Mic, MicOff } from 'lucide-react';
import type { ParsedSearchQuery } from '../types/pipeline';

interface SearchBarProps {
  query: string;
  onQueryChange: (newQuery: string) => void;
  parsedQuery: ParsedSearchQuery;
  totalMatches: number;
}

export const PRESET_QUERIES = [
  { label: 'Fuzzy: "sharam"', query: 'Find Priya Sharma (sharam)', value: 'sharam' },
  { label: 'Who\'s in Interview right now?', query: "Who's in Interview right now?", value: "Who's in Interview right now?" },
  { label: 'Stuck in Screening > 1 week', query: 'Who has been stuck in Screening for more than a week?', value: 'Who has been stuck in Screening for more than a week?' },
  { label: 'Moved to Interview since Monday', query: 'Who moved to Interview since Monday?', value: 'Who moved to Interview since Monday?' },
  { label: 'Reached Offer but not hired', query: "Who reached the Offer stage but didn't get hired?", value: "Who reached the Offer stage but didn't get hired?" },
  { label: 'Everyone except rejected', query: 'Everyone except rejected candidates', value: 'Everyone except rejected candidates' },
];

export const SearchBar: React.FC<SearchBarProps> = ({
  query,
  onQueryChange,
  parsedQuery,
  totalMatches,
}) => {
  const isZeroMatch = query.trim().length > 0 && totalMatches === 0;
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Initialize native browser Web Speech API (Zero external APIs / tools)
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      setSpeechSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          onQueryChange(transcript.trim());
        }
        setIsListening(false);
      };

      recognition.onerror = (err: any) => {
        console.warn('Speech recognition status:', err.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, [onQueryChange]);

  const toggleVoiceSearch = () => {
    if (!speechSupported || !recognitionRef.current) {
      alert('Voice search is supported natively in Chrome, Edge, and Safari using the Web Speech API.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error('Failed to start speech recognition:', err);
        setIsListening(false);
      }
    }
  };

  return (
    <section className="search-section">
      <div className="search-bar-wrapper">
        <div className="search-icon-decor">
          <Search size={20} />
        </div>

        <input
          type="text"
          className="main-search-input"
          placeholder='Ask anything: "Who moved to Interview since Monday?", "sharam", "Stuck in Screening > 1 week"...'
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          autoFocus
        />

        {query && (
          <button
            className="clear-search-btn"
            onClick={() => onQueryChange('')}
            title="Clear search query"
          >
            <X size={18} />
          </button>
        )}

        {/* Voice Search (Browser Native Web Speech API) */}
        {speechSupported && (
          <button
            type="button"
            className={`voice-search-btn ${isListening ? 'listening' : ''}`}
            onClick={toggleVoiceSearch}
            title={isListening ? 'Listening... click to stop' : 'Voice search: Speak your query'}
            aria-label="Voice search"
          >
            {isListening ? <MicOff size={18} /> : <Mic size={18} />}
            {isListening && <span className="mic-pulse-ring" />}
          </button>
        )}

        <span className="kbd-shortcut" title="Search Shortcut">⌘K</span>
      </div>

      {/* Listening status indicator */}
      {isListening && (
        <div className="voice-listening-banner">
          <span className="voice-dot-pulse" />
          <span>Listening... speak your question (e.g. <em>&quot;Who moved to Interview since Monday?&quot;</em>)</span>
        </div>
      )}

      {/* Preset Query Chips for Quick Evaluation */}
      <div className="query-presets-container">
        <span className="query-presets-label">Prompt Questions:</span>
        {PRESET_QUERIES.map((preset) => {
          const isActive = query === preset.value;
          return (
            <button
              key={preset.label}
              className={`query-chip ${isActive ? 'active-chip' : ''}`}
              onClick={() => onQueryChange(isActive ? '' : preset.value)}
              title={`Test question: ${preset.query}`}
            >
              <span>{preset.label}</span>
            </button>
          );
        })}
      </div>

      {/* Query Interpretation & Explanation Banner */}
      {query.trim().length > 0 && (
        <div className={`query-feedback-card ${isZeroMatch ? 'query-zero-feedback' : ''}`}>
          <div className="feedback-header">
            <div className="feedback-title">
              {isZeroMatch ? <AlertCircle size={16} /> : <Sparkles size={16} />}
              <span>{isZeroMatch ? 'No Results Explanation' : 'Query Interpretation'}</span>
            </div>

            <span className="match-count-badge">
              {totalMatches} {totalMatches === 1 ? 'Candidate Matched' : 'Candidates Matched'}
            </span>
          </div>

          <p className="diagnostic-text">{parsedQuery.explanation.summary}</p>

          {parsedQuery.explanation.detectedIntents.length > 0 && (
            <div className="intent-pills-row">
              {parsedQuery.explanation.detectedIntents.map((intent, idx) => {
                let badgeClass = '';
                if (intent.includes('fuzzy') || intent.includes('Name')) badgeClass = 'fuzzy-intent';
                else if (intent.includes('since') || intent.includes('Stuck')) badgeClass = 'temporal-intent';
                else if (intent.includes('Reached') || intent.includes('Moved')) badgeClass = 'audit-intent';

                return (
                  <span key={idx} className={`intent-pill ${badgeClass}`}>
                    {intent}
                  </span>
                );
              })}
            </div>
          )}

          {isZeroMatch && parsedQuery.explanation.suggestions && parsedQuery.explanation.suggestions.length > 0 && (
            <div style={{ marginTop: '0.85rem' }}>
              <div style={{ fontSize: '0.76rem', color: '#cbd5e1', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                <HelpCircle size={13} />
                <span>Suggested alternative questions to try:</span>
              </div>
              <div className="diagnostic-suggestions">
                {parsedQuery.explanation.suggestions.slice(0, 3).map((suggestion, sIdx) => (
                  <button
                    key={sIdx}
                    className="query-chip"
                    onClick={() => onQueryChange(suggestion)}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
