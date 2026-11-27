import { getFilmPeople, getPerson } from '../api/people.js';
import type { Film } from '../api/films.js';

export const loadFilmPeople = (film: Film) => getFilmPeople(film.id);
export const loadPerson = (id: number) => getPerson(id);
