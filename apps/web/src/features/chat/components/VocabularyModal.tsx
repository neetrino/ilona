'use client';

import { useState } from 'react';

interface VocabularyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (words: string[]) => void;
  isSubmitting: boolean;
}

export function VocabularyModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
}: VocabularyModalProps) {
  const [words, setWords] = useState<string[]>(['', '', '', '', '']);

  const handleWordChange = (index: number, value: string) => {
    const newWords = [...words];
    newWords[index] = value;
    setWords(newWords);
  };

  const handleAddWord = () => {
    setWords([...words, '']);
  };

  const handleRemoveWord = (index: number) => {
    if (words.length > 1) {
      setWords(words.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = () => {
    const filteredWords = words.filter((w) => w.trim());
    if (filteredWords.length > 0) {
      onSubmit(filteredWords);
      setWords(['', '', '', '', '']);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-gradient-to-r from-purple-600 to-purple-700">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <span>📚</span>
            Send Vocabulary (Բառեր)
          </h3>
          <p className="text-sm text-purple-200 mt-1">
            Add today's vocabulary words for your students
          </p>
        </div>

        <div className="p-4 max-h-[400px] overflow-y-auto">
          <div className="space-y-2">
            {words.map((word, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="text-sm text-slate-500 w-6">{index + 1}.</span>
                <input
                  type="text"
                  value={word}
                  onChange={(e) => handleWordChange(index, e.target.value)}
                  placeholder="Enter word or phrase..."
                  className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                />
                <button
                  onClick={() => handleRemoveWord(index)}
                  className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                  disabled={words.length === 1}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={handleAddWord}
            className="mt-3 text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add another word
          </button>
        </div>

        <div className="p-4 border-t border-slate-200 bg-slate-50 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || words.every((w) => !w.trim())}
            className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <span>📤</span>
                Send Vocabulary
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

