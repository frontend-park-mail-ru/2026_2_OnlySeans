const movies = [
  { id: 1, title: 'Майор Гром: Чумной Доктор', year: 2021, rating: 7.2, country: 'russia', type: 'movie', genres: ['action', 'adventure'], description: 'Петербургский следователь против загадочного мстителя.' },
  { id: 2, title: 'Мир! Дружба! Жвачка!', year: 2020, rating: 8.2, country: 'russia', type: 'series', genres: ['drama', 'comedy'], description: 'Дружба и взросление на фоне перемен девяностых.' },
  { id: 3, title: 'Вампиры средней полосы', year: 2021, rating: 8.3, country: 'russia', type: 'series', genres: ['fantasy', 'comedy', 'detective'], description: 'Необычная смоленская семья хранит очень давний секрет.' },
  { id: 4, title: 'Движение вверх', year: 2017, rating: 7.6, country: 'russia', type: 'movie', genres: ['drama', 'sport'], description: 'Команда, которой предстоит поверить в невозможное.' },
  { id: 5, title: 'Чебурашка', year: 2023, rating: 7.1, country: 'russia', type: 'movie', genres: ['family', 'comedy'], description: 'Маленький гость с большими ушами находит новый дом.' },
  { id: 6, title: 'Эпидемия', year: 2019, rating: 7.8, country: 'russia', type: 'series', genres: ['thriller', 'drama'], description: 'Группа людей отправляется на север в поисках спасения.' },
  { id: 7, title: 'Холоп', year: 2019, rating: 7.0, country: 'russia', type: 'movie', genres: ['comedy'], description: 'Привычная жизнь заканчивается неожиданным путешествием.' },
  { id: 8, title: 'Метод', year: 2015, rating: 8.0, country: 'russia', type: 'series', genres: ['detective', 'thriller'], description: 'Молодая выпускница становится напарницей необычного следователя.' },
  { id: 9, title: 'Интерстеллар', year: 2014, rating: 8.6, country: 'foreign', type: 'movie', genres: ['scifi', 'drama', 'adventure'], description: 'Путешествие за пределы знакомого мира ради будущего человечества.' },
  { id: 10, title: 'Отель «Гранд Будапешт»', year: 2014, rating: 8.0, country: 'foreign', type: 'movie', genres: ['comedy', 'adventure'], description: 'Консьерж и его ученик оказываются в центре невероятной истории.' },
  { id: 11, title: 'Очень странные дела', year: 2016, rating: 8.4, country: 'foreign', type: 'series', genres: ['scifi', 'thriller', 'fantasy'], description: 'Исчезновение мальчика открывает дверь в другой мир.' },
  { id: 12, title: 'Тед Лассо', year: 2020, rating: 8.5, country: 'foreign', type: 'series', genres: ['comedy', 'sport'], description: 'Тренер с большим сердцем меняет жизнь английского клуба.' },
  { id: 13, title: 'Дюна', year: 2021, rating: 7.9, country: 'foreign', type: 'movie', genres: ['scifi', 'adventure'], description: 'Наследник великого дома отправляется на пустынную планету.' },
  { id: 14, title: 'Шерлок', year: 2010, rating: 8.8, country: 'foreign', type: 'series', genres: ['detective', 'thriller'], description: 'Знаменитый сыщик разгадывает загадки современного Лондона.' },
  { id: 15, title: 'Душа', year: 2020, rating: 8.2, country: 'foreign', type: 'movie', genres: ['family', 'fantasy', 'comedy'], description: 'Музыкант ищет ответ на вопрос, что делает жизнь особенной.' },
  { id: 16, title: 'Ход королевы', year: 2020, rating: 8.3, country: 'foreign', type: 'series', genres: ['drama', 'sport'], description: 'Шахматный талант ищет своё место за доской и за её пределами.' },
];


movies.push(
  { id: 17, title: 'Легенда №17', year: 2013, rating: 8.0, country: 'russia', type: 'movie', genres: ['drama', 'sport'], description: 'Хоккеист Валерий Харламов идёт к главному матчу своей жизни.' },
  { id: 18, title: 'Кухня', year: 2012, rating: 8.1, country: 'russia', type: 'series', genres: ['comedy'], description: 'Большие амбиции и маленькие катастрофы на кухне московского ресторана.' },
  { id: 19, title: 'Иван Васильевич меняет профессию', year: 1973, rating: 8.7, country: 'russia', type: 'movie', genres: ['comedy', 'scifi', 'adventure'], description: 'Машина времени соединяет московскую квартиру с царскими палатами.' },
  { id: 20, title: 'Брат', year: 1997, rating: 8.2, country: 'russia', type: 'movie', genres: ['action', 'drama'], description: 'Данила Багров приезжает в Петербург к старшему брату.' },
  { id: 21, title: 'Начало', year: 2010, rating: 8.7, country: 'foreign', type: 'movie', genres: ['scifi', 'thriller', 'action'], description: 'Команда специалистов отправляется в путешествие по чужим снам.' },
  { id: 22, title: '1+1', year: 2011, rating: 8.8, country: 'foreign', type: 'movie', genres: ['comedy', 'drama'], description: 'Встреча двух совершенно разных людей становится началом дружбы.' },
  { id: 23, title: 'Друзья', year: 1994, rating: 8.9, country: 'foreign', type: 'series', genres: ['comedy'], description: 'Шестеро друзей делят радости, неудачи и любимую кофейню.' },
  { id: 24, title: 'Матрица', year: 1999, rating: 8.5, country: 'foreign', type: 'movie', genres: ['scifi', 'action'], description: 'Программист Нео узнаёт, как устроен мир за пределами привычной реальности.' },
);

movies.push(...[
  {
    "id": 25,
    "title": "Брат 2",
    "year": 2000,
    "rating": 8.1,
    "country": "russia",
    "type": "movie",
    "genres": [
      "action",
      "drama"
    ],
    "description": "Данила Багров отправляется в Америку, чтобы помочь другу."
  },
  {
    "id": 26,
    "title": "Левиафан",
    "year": 2014,
    "rating": 7.1,
    "country": "russia",
    "type": "movie",
    "genres": [
      "drama"
    ],
    "description": "Человек пытается отстоять свой дом в маленьком северном городе."
  },
  {
    "id": 27,
    "title": "Нелюбовь",
    "year": 2017,
    "rating": 7.4,
    "country": "russia",
    "type": "movie",
    "genres": [
      "drama"
    ],
    "description": "Исчезновение сына заставляет родителей взглянуть на свою жизнь."
  },
  {
    "id": 28,
    "title": "Жуки",
    "year": 2019,
    "rating": 7.8,
    "country": "russia",
    "type": "series",
    "genres": [
      "comedy"
    ],
    "description": "Трое разработчиков меняют столичную жизнь на приключения в деревне."
  },
  {
    "id": 29,
    "title": "Полицейский с Рублёвки",
    "year": 2016,
    "rating": 7.9,
    "country": "russia",
    "type": "series",
    "genres": [
      "comedy",
      "detective"
    ],
    "description": "Необычные будни полицейского в самом обеспеченном районе."
  },
  {
    "id": 30,
    "title": "Триггер",
    "year": 2018,
    "rating": 8.2,
    "country": "russia",
    "type": "series",
    "genres": [
      "drama"
    ],
    "description": "Психолог использует провокацию, чтобы помочь своим пациентам."
  },
  {
    "id": 31,
    "title": "Мажор",
    "year": 2014,
    "rating": 8.1,
    "country": "russia",
    "type": "series",
    "genres": [
      "drama",
      "detective"
    ],
    "description": "Наследник богатой семьи начинает работать в полиции."
  },
  {
    "id": 32,
    "title": "Ликвидация",
    "year": 2007,
    "rating": 8.6,
    "country": "russia",
    "type": "series",
    "genres": [
      "detective",
      "drama"
    ],
    "description": "Одесский сыщик расследует преступления в послевоенном городе."
  },
  {
    "id": 33,
    "title": "Форрест Гамп",
    "year": 1994,
    "rating": 8.9,
    "country": "foreign",
    "type": "movie",
    "genres": [
      "drama",
      "comedy"
    ],
    "description": "Простой человек с большим сердцем проживает удивительную жизнь."
  },
  {
    "id": 34,
    "title": "Побег из Шоушенка",
    "year": 1994,
    "rating": 8.9,
    "country": "foreign",
    "type": "movie",
    "genres": [
      "drama"
    ],
    "description": "Дружба и надежда помогают человеку не потерять себя."
  },
  {
    "id": 35,
    "title": "Зелёная миля",
    "year": 1999,
    "rating": 8.9,
    "country": "foreign",
    "type": "movie",
    "genres": [
      "drama",
      "fantasy"
    ],
    "description": "Надзиратель встречает заключённого с необыкновенным даром."
  },
  {
    "id": 36,
    "title": "Во все тяжкие",
    "year": 2008,
    "rating": 8.8,
    "country": "foreign",
    "type": "series",
    "genres": [
      "drama",
      "thriller"
    ],
    "description": "Учитель химии принимает решение, которое меняет всю его жизнь."
  },
  {
    "id": 37,
    "title": "Игра престолов",
    "year": 2011,
    "rating": 8.7,
    "country": "foreign",
    "type": "series",
    "genres": [
      "fantasy",
      "drama",
      "adventure"
    ],
    "description": "Великие дома борются за власть, пока на севере растёт новая угроза."
  },
  {
    "id": 38,
    "title": "Чернобыль",
    "year": 2019,
    "rating": 8.8,
    "country": "foreign",
    "type": "series",
    "genres": [
      "drama"
    ],
    "description": "Люди пытаются остановить последствия катастрофы на атомной станции."
  },
  {
    "id": 39,
    "title": "Офис",
    "year": 2005,
    "rating": 8.5,
    "country": "foreign",
    "type": "series",
    "genres": [
      "comedy"
    ],
    "description": "Повседневная жизнь сотрудников бумажной компании."
  },
  {
    "id": 40,
    "title": "Настоящий детектив",
    "year": 2014,
    "rating": 8.6,
    "country": "foreign",
    "type": "series",
    "genres": [
      "detective",
      "thriller",
      "drama"
    ],
    "description": "Сложные расследования и судьбы людей, которые за них берутся."
  }
]);
const posterIds = [1109271, 1306638, 1224067, 840817, 4370148, 1108682, 1183582, 838050, 258687, 683999, 915196, 1309707, 409424, 502838, 775273, 1253633, 601564, 687595, 42664, 41519, 447301, 535341, 77044, 301, 41520, 705356, 963346, 1231407, 913033, 1100777, 820638, 378244, 448, 326, 435, 404900, 464963, 1227803, 253245, 681831];
export const getMovies = async () => movies.map((movie, index) => ({
  ...movie, genres: [...movie.genres], poster: '/src/assets/posters/' + posterIds[index] + '.jpg',
}));
