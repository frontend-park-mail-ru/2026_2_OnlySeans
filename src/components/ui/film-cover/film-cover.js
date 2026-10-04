const TONES = 6;

window.Handlebars.registerPartial('filmCover', `
  <span class="film-cover film-cover--tone-{{tone}}">
    <span class="film-cover__letter" aria-hidden="true">{{letter}}</span>
    {{#if poster}}<img class="film-cover__image" src="{{poster}}" alt="Постер: {{title}}" loading="lazy" decoding="async">{{/if}}
  </span>
`);

export const coverProps = ({ id, title, poster }) => ({
  title,
  poster,
  letter: title.charAt(0),
  tone: id % TONES,
});

export const watchCovers = (root) => {
  root.querySelectorAll('.film-cover__image').forEach((image) => {
    image.addEventListener('error', () => image.remove());
  });
};
