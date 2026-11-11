import React, { useState } from 'react';
import type { Note } from '../types';
import { Plus, Trash2, StickyNote, Calendar } from 'lucide-react';

interface QuickNotesProps {
  notes: Note[];
  onAddNote: (note: Omit<Note, 'id' | 'updatedAt'>) => void;
  onUpdateNote: (id: string, content: string, title: string) => void;
  onDeleteNote: (id: string) => void;
}

export const QuickNotes: React.FC<QuickNotesProps> = ({
  notes,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
}) => {
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() && !newContent.trim()) return;

    onAddNote({
      title: newTitle.trim() || 'Bez tytułu',
      content: newContent.trim(),
    });
    setNewTitle('');
    setNewContent('');
    setIsAdding(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-light text-[#f5ede4] flex items-center gap-2">
            <StickyNote className="w-5 h-5 text-[#d99b5a]" />
            To-Do & Szybkie Notatki
          </h2>
          <p className="text-xs text-[#9e8f82] mt-0.5 font-light">
            Zapisuj luźne myśli, pomysły, linki i szkice powiązane z AI
          </p>
        </div>

        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#f5ede4] hover:bg-white text-[#120e0a] text-xs font-semibold shadow-md transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            Nowa notatka
          </button>
        )}
      </div>

      {isAdding && (
        <form
          onSubmit={handleCreate}
          className="glass-panel border border-[#3d2f24] rounded-3xl p-6 shadow-2xl space-y-4 animate-scale-in"
        >
          <input
            type="text"
            placeholder="Tytuł notatki..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="w-full px-4 py-2.5 rounded-2xl glass-input text-sm placeholder-[#7a6b5e]"
            autoFocus
          />
          <textarea
            rows={4}
            placeholder="Wpisz treść notatki..."
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            className="w-full px-4 py-2.5 rounded-2xl glass-input text-sm resize-none placeholder-[#7a6b5e]"
          />
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 rounded-full text-[#9e8f82] hover:text-[#f5ede4] text-xs transition-colors"
            >
              Anuluj
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-full bg-[#f5ede4] hover:bg-white text-[#120e0a] text-xs font-semibold shadow-md"
            >
              Dodaj notatkę
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {notes.length === 0 ? (
          <div className="col-span-full py-16 text-center border border-dashed border-[#2e231c] rounded-3xl text-[#7a6b5e] text-sm">
            Brak notatek. Kliknij "Nowa notatka", aby dodać pierwszy wpis!
          </div>
        ) : (
          notes.map((note) => (
            <div
              key={note.id}
              className="glass-panel border border-[#2b211a] hover:border-[#3d2f24] rounded-3xl p-5 flex flex-col justify-between shadow-xl group transition-all duration-200 card-hover-lift"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <input
                    type="text"
                    value={note.title}
                    onChange={(e) => onUpdateNote(note.id, note.content, e.target.value)}
                    className="font-medium text-sm text-[#f5ede4] bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-[#d99b5a]/40 rounded px-1 -mx-1 w-full"
                  />
                  <button
                    onClick={() => onDeleteNote(note.id)}
                    className="text-[#7a6b5e] hover:text-[#e07a68] p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Usuń notatkę"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <textarea
                  value={note.content}
                  onChange={(e) => onUpdateNote(note.id, e.target.value, note.title)}
                  rows={5}
                  className="w-full bg-[#140f0c]/60 border border-[#2e231c] rounded-2xl p-3 text-xs text-[#dcd1c7] focus:outline-none focus:border-[#d99b5a]/50 resize-none font-mono"
                />
              </div>

              <div className="mt-4 pt-3 border-t border-[#2e231c] flex items-center justify-between text-[11px] text-[#7a6b5e] font-mono">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3 h-3 text-[#9e8f82]" />
                  {new Date(note.updatedAt).toLocaleDateString('pl-PL')}
                </span>
                <span>Zapisano w chmurze</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
