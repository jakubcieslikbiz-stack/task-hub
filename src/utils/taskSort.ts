import type { Task } from '../types';

/**
 * Sortuje zadania domyślnie od najbliższego terminu (DDL):
 * 1. Zadania aktywne (w toku / do zrobienia) z najbliższym terminem na samej górze
 *    (przeterminowane i dzisiejsze na początku listy)
 * 2. W ramach tego samego dnia decyduje godzina (dueTime), a następnie priorytet (urgent > high > medium > low)
 * 3. Zadania bez podanego terminu na końcu listy zadań aktywnych
 * 4. Zadania zakończone/opłacone (done/paid) na końcu (również posortowane od najbliższego terminu)
 */
export function sortTasksByClosestDeadline(tasksList: Task[]): Task[] {
  const priorityWeight: Record<string, number> = {
    urgent: 0,
    high: 1,
    medium: 2,
    low: 3,
  };

  return [...tasksList].sort((a, b) => {
    // 1. Aktywne zadania przed ukończonymi/opłaconymi
    const aIsActive = a.status !== 'done' && a.status !== 'paid';
    const bIsActive = b.status !== 'done' && b.status !== 'paid';
    if (aIsActive !== bIsActive) {
      return aIsActive ? -1 : 1;
    }

    // 2. Zadania z terminem przed zadaniami bez terminu
    const aHasDue = Boolean(a.dueDate && a.dueDate.trim());
    const bHasDue = Boolean(b.dueDate && b.dueDate.trim());
    if (aHasDue && !bHasDue) return -1;
    if (!aHasDue && bHasDue) return 1;

    // 3. Od najbliższego terminu (rosnąco po dacie: przeterminowane -> dzisiaj -> jutro -> kolejne dni)
    if (aHasDue && bHasDue) {
      const dateCmp = a.dueDate!.localeCompare(b.dueDate!);
      if (dateCmp !== 0) return dateCmp;

      // 4. Jeśli ta sama data, porównaj godzinę
      const aTime = a.dueTime?.trim();
      const bTime = b.dueTime?.trim();
      if (aTime && bTime) {
        const timeCmp = aTime.localeCompare(bTime);
        if (timeCmp !== 0) return timeCmp;
      } else if (aTime && !bTime) {
        return -1;
      } else if (!aTime && bTime) {
        return 1;
      }
    }

    // 5. Priorytet (Pilne -> Wysoki -> Średni -> Niski)
    const aPrio = priorityWeight[a.priority] ?? 2;
    const bPrio = priorityWeight[b.priority] ?? 2;
    if (aPrio !== bPrio) return aPrio - bPrio;

    // 6. Data utworzenia
    return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
  });
}
