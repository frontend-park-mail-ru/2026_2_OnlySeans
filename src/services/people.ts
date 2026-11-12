import { getFilmPeople, getPerson } from '../api/people.js';

export const loadFilmPeople = (film) => getFilmPeople(film.id);
export const loadPerson = (id) => getPerson(id);
