export function combineDateAndTime(date: string, time: string): Date {
  return new Date(`${date}T${time}`);
}

export function splitScheduledTime(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  const date = [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
  const time = [
    String(d.getHours()).padStart(2, "0"),
    String(d.getMinutes()).padStart(2, "0"),
  ].join(":");
  return { date, time };
}

export function formatScheduledDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function getDefaultScheduleValues(): { date: string; time: string } {
  const d = new Date();
  d.setHours(d.getHours() + 1);
  d.setMinutes(0);
  d.setSeconds(0);
  return splitScheduledTime(d.toISOString());
}

export function minScheduleDateString(): string {
  const d = new Date();
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}
