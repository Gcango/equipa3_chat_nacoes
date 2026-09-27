const WEEKDAYS = ["", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"] as const;

export function weekdayLabel(day: number) {
  return WEEKDAYS[day] ?? `Dia ${day}`;
}
