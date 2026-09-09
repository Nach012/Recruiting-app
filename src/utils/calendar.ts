export interface GoogleCalendarParams {
  title: string;
  startDate: Date;
  endDate: Date;
  description?: string;
  location?: string;
  attendeeEmail?: string;
}

/**
 * Convierte un objeto Date al formato UTC compacto requerido por Google Calendar: YYYYMMDDTHHmmssZ
 */
function formatGoogleCalendarDate(date: Date): string {
  return date.toISOString().replace(/-|:|\.\d{3}/g, '');
}

/**
 * Genera la URL oficial de Google Calendar para precargar el evento con título, fecha, hora e invitado.
 */
export function getGoogleCalendarUrl({
  title,
  startDate,
  endDate,
  description = '',
  location = 'Google Meet',
  attendeeEmail = ''
}: GoogleCalendarParams): string {
  const dates = `${formatGoogleCalendarDate(startDate)}/${formatGoogleCalendarDate(endDate)}`;

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: dates,
    details: description,
    location: location
  });

  if (attendeeEmail && attendeeEmail.trim()) {
    params.set('add', attendeeEmail.trim());
  }

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
