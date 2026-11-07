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
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <StickyNote className="w-5 h-5 text-indigo-400" />
            Szybkie Notatki
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Zapisuj luźne myśli, pomysły, linki i szkice
          </p>
        </div>

        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Nowa notatka
          </button>
        )}
      </div>

      {isAdding && (
        <form
          onSubmit={handleCreate}
          className="bg-slate-900 border border-indigo-500/40 rounded-2xl p-4 shadow-xl space-y-3"
        >
          <input
            type="text"
            placeholder="Tytuł notatki..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="w-full px-3 py-2 bg-slate-800/80 rounded-xl border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500"
            autoFocus
          />
          <textarea
            rows={4}
            placeholder="Wpisz treść notatki..."
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            className="w-full px-3 py-2 bg-slate-800/80 rounded-xl border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500 resize-none"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white text-xs"
            >
              Anuluj
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
            >
              Dodaj notatkę
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {notes.length === 0 ? (
          <div className="col-span-full py-16 text-center border border-dashed border-slate-800 rounded-2xl text-slate-500 text-sm">
            Brak notatek. Kliknij "Nowa notatka", aby dodać pierwszy wpis!
          </div>
        ) : (
          notes.map((note) => (
            <div
              key={note.id}
              className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 flex flex-col justify-between shadow-lg group transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <input
                    type="text"
                    value={note.title}
                    onChange={(e) => onUpdateNote(note.id, note.content, e.target.value)}
                    className="font-semibold text-sm text-slate-200 bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-indigo-500/40 rounded px-1 -mx-1 w-full"
                  />
                  <button
                    onClick={() => onDeleteNote(note.id)}
                    className="text-slate-500 hover:text-rose-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Usuń notatkę"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <textarea
                  value={note.content}
                  onChange={(e) => onUpdateNote(note.id, e.target.value, note.title)}
                  rows={5}
                  className="w-full bg-slate-950/40 border border-slate-800/80 rounded-xl p-2.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500/50 resize-none font-mono"
                />
              </div>

              <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(note.updatedAt).toLocaleDateString('pl-PL')}
                </span>
                <span>Zapisano automatycznie</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
