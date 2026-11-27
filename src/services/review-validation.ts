export const REVIEW_LIMITS = { titleMin: 3, titleMax: 255, textMin: 50, textMax: 20000 };

/** Проверяет длину по Unicode-символам, как текущий API отзывов. */
export function reviewErrors({ title, text }: { title: string; text: string }) {
  const titleLength = Array.from(title.trim()).length;
  const textLength = Array.from(text.trim()).length;
  return {
    title:
      titleLength < REVIEW_LIMITS.titleMin
        ? 'Введите заголовок: минимум 3 символа'
        : titleLength > REVIEW_LIMITS.titleMax
          ? 'Заголовок не длиннее 255 символов'
          : '',
    text:
      textLength < REVIEW_LIMITS.textMin
        ? 'Напишите не меньше 50 символов'
        : textLength > REVIEW_LIMITS.textMax
          ? 'Отзыв не длиннее 20 000 символов'
          : '',
  };
}
