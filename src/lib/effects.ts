export const AI_TASK_ADDED_EVENT = 'taskhub:ai-task-added';

/**
 * Wywołuje subtelny zielony puls całego ekranu (zarówno na telefonie, jak i komputerze),
 * sygnalizujący pomyślne dodanie zadania/zlecenia przez sztuczną inteligencję (AI).
 * Na urządzeniach mobilnych dodatkowo aktywuje delikatną wibrację haptyczną.
 */
export function triggerAiTaskAddedEffect() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(AI_TASK_ADDED_EVENT));
  }

  // Subtelna wibracja haptyczna na smartfonie (jeśli wspierana przez przeglądarkę)
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate([35, 45, 35]);
    } catch {
      // Bezpieczne ignorowanie ewentualnych ograniczeń polityki przeglądarki
    }
  }
}
