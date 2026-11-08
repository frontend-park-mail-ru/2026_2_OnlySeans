export const SCORES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export const scoreWord = (value) => {
  if (value >= 9) return 'шедевр';
  if (value >= 7) return 'отлично';
  if (value >= 5) return 'неплохо';
  if (value >= 3) return 'слабо';
  return 'плохо';
};

export const formatScore = (value) => value.toLocaleString('ru', { maximumFractionDigits: 1 });
