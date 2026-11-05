const dateTime = new Intl.DateTimeFormat('ru-RU', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

const dateOnly = new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' });

export function formatDateTime(value: string): string {
  return dateTime.format(new Date(value));
}

export function formatDate(value: string): string {
  return dateOnly.format(new Date(value));
}

export function initials(fullName: string): string {
  return fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}
