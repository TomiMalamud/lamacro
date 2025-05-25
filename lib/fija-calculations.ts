export function calculateDaysDifference(
  endDate: Date,
  startDate: Date,
): number {
  const timeDiff = endDate.getTime() - startDate.getTime();
  return Math.ceil(timeDiff / (1000 * 3600 * 24));
}

export function calculateDays360(endDate: Date, startDate: Date): number {
  const startYear = startDate.getFullYear();
  const startMonth = startDate.getMonth() + 1;
  const startDay = startDate.getDate();

  const endYear = endDate.getFullYear();
  const endMonth = endDate.getMonth() + 1;
  const endDay = endDate.getDate();

  const adjustedStartDay = startDay === 31 ? 30 : startDay;
  const adjustedEndDay = endDay === 31 && adjustedStartDay >= 30 ? 30 : endDay;

  return (
    (endYear - startYear) * 360 +
    (endMonth - startMonth) * 30 +
    (adjustedEndDay - adjustedStartDay)
  );
}

export function calculateTNA(
  pagoFinal: number,
  px: number,
  dias: number,
): number {
  return ((pagoFinal / px - 1) / dias) * 365;
}

export function calculateTEM(
  pagoFinal: number,
  px: number,
  meses: number,
): number {
  return Math.pow(pagoFinal / px, 1 / meses) - 1;
}

export function calculateTEA(
  pagoFinal: number,
  px: number,
  dias: number,
): number {
  return Math.pow(pagoFinal / px, 365 / dias) - 1;
}
