// PEOPLE — биографические сведения (необязательные поля), PRODUCERS — продюсеры по id фильма каталога.
const PEOPLE = {
 "Фрэнк Дарабонт": {
  "originalName": "Frank Darabont",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/19/Frank_Darabont_at_the_PaleyFest_2011_-_The_Walking_Dead_panel.jpg/250px-Frank_Darabont_at_the_PaleyFest_2011_-_The_Walking_Dead_panel.jpg",
  "birthDate": "1959-01-28",
  "countries": [
   "США"
  ],
  "birthplace": "Монбельяр"
 },
 "Ники Марвин": {
  "originalName": "Niki Marvin",
  "countries": [
   "США"
  ]
 },
 "Дэвид Вальдес": {
  "originalName": "David Valdes",
  "birthDate": "1950-08-12",
  "countries": [
   "США"
  ],
  "birthplace": "Лос-Анджелес"
 },
 "Роберт Земекис": {
  "originalName": "Robert Zemeckis",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d7/Robert_Zemeckis_%22The_Walk%22_at_Opening_Ceremony_of_the_28th_Tokyo_International_Film_Festival_%2821835891403%29_%28cropped%29.jpg/250px-Robert_Zemeckis_%22The_Walk%22_at_Opening_Ceremony_of_the_28th_Tokyo_International_Film_Festival_%2821835891403%29_%28cropped%29.jpg",
  "birthDate": "1952-05-14",
  "countries": [
   "США"
  ],
  "birthplace": "Чикаго"
 },
 "Венди Файнерман": {
  "originalName": "Wendy Finerman",
  "birthDate": "1961-08-02",
  "countries": [
   "США"
  ],
  "birthplace": "Калифорния"
 },
 "Стив Старки": {
  "originalName": "Steve Starkey",
  "countries": [
   "США"
  ]
 },
 "Чарльз Ньюирт": {
  "originalName": "Charles Newirth",
  "birthDate": "1955-08-22",
  "countries": [
   "США"
  ],
  "birthplace": "Нью-Йорк"
 },
 "Стив Тиш": {
  "originalName": "Steve Tisch",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/4/47/Steve_Tisch_2018_%28cropped2%29.jpg/250px-Steve_Tisch_2018_%28cropped2%29.jpg",
  "birthDate": "1949-02-14",
  "countries": [
   "США"
  ],
  "birthplace": "Лейквуд"
 },
 "Кристофер Нолан": {
  "originalName": "Christopher Nolan",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/05/Christopher_Nolan.jpg/250px-Christopher_Nolan.jpg",
  "birthDate": "1970-07-30",
  "countries": [
   "Великобритания",
   "США"
  ],
  "birthplace": "Лондон"
 },
 "Эмма Томас": {
  "originalName": "Emma Thomas",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/5/52/EmmaThomas-byPhilipRomano.jpg/250px-EmmaThomas-byPhilipRomano.jpg",
  "birthDate": "1971-12-09",
  "countries": [
   "Великобритания"
  ],
  "birthplace": "Лондон"
 },
 "Линда Обст": {
  "birthDate": "1950-04-14",
  "deathYear": "2024",
  "countries": [
   "США"
  ],
  "birthplace": "Нью-Йорк"
 },
 "Мартин Скорсезе": {
  "originalName": "Martin Scorsese",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/c/ce/Martin_Scorsese_MFF_2023.jpg/250px-Martin_Scorsese_MFF_2023.jpg",
  "birthDate": "1942-11-17",
  "countries": [
   "Италия",
   "США"
  ],
  "birthplace": "Куинс"
 },
 "Майк Медавой": {
  "originalName": "Mike Medavoy",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/2/27/Michael_Medavoy_2012_Shankbone.JPG/250px-Michael_Medavoy_2012_Shankbone.JPG",
  "birthDate": "1941-01-21",
  "countries": [
   "США"
  ],
  "birthplace": "Хункоу"
 },
 "Брэд Фишер": {
  "originalName": "Bradley J. Fischer",
  "birthDate": "1976-09-08",
  "countries": [
   "США"
  ],
  "birthplace": "Нью-Йорк"
 },
 "Роджер Аллерс": {
  "originalName": "Roger Allers",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/ae/Roger_Allers%2C_34th_Annie_Awards%2C_2007.jpg/250px-Roger_Allers%2C_34th_Annie_Awards%2C_2007.jpg",
  "birthDate": "1949-06-29",
  "deathYear": "2026",
  "countries": [
   "США"
  ],
  "birthplace": "Рай"
 },
 "Роб Минкофф": {
  "originalName": "Rob Minkoff",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/8/8d/Rob_Minkoff.jpg/250px-Rob_Minkoff.jpg",
  "birthDate": "1962-08-11",
  "countries": [
   "США"
  ],
  "birthplace": "Пало-Алто"
 },
 "Дон Хан": {
  "originalName": "Don Hahn",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/5/52/DonHahnByPhilKonstantin.jpg/250px-DonHahnByPhilKonstantin.jpg",
  "birthDate": "1955-11-26",
  "countries": [
   "США"
  ],
  "birthplace": "Чикаго"
 },
 "Крис Коламбус": {
  "originalName": "Chris Columbus",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7c/Chris_Columbus_-_Home_Alone_35th.jpg/250px-Chris_Columbus_-_Home_Alone_35th.jpg",
  "birthDate": "1958-09-10",
  "countries": [
   "США"
  ],
  "birthplace": "Спенглер"
 },
 "Джон Хьюз": {
  "originalName": "John Hughes",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/2/27/John_Hughes%2C_1967_HS_Yearbook.jpg/250px-John_Hughes%2C_1967_HS_Yearbook.jpg",
  "birthDate": "1950-02-18",
  "deathYear": "2009",
  "countries": [
   "США"
  ],
  "birthplace": "Лансинг"
 },
 "Леонид Гайдай": {
  "originalName": "Leonid Gaidai",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a3/%D0%9B%D0%B5%D0%BE%D0%BD%D0%B8%D0%B4_%D0%93%D0%B0%D0%B9%D0%B4%D0%B0%D0%B9_%281974%29_%28cropped%29.jpg/250px-%D0%9B%D0%B5%D0%BE%D0%BD%D0%B8%D0%B4_%D0%93%D0%B0%D0%B9%D0%B4%D0%B0%D0%B9_%281974%29_%28cropped%29.jpg",
  "birthDate": "1923-01-30",
  "deathYear": "1993",
  "countries": [
   "Россия"
  ],
  "birthplace": "Свободный"
 },
 "Гай Ричи": {
  "originalName": "Guy Ritchie",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/14/GuyRitchiebyKathyHutchins.jpg/250px-GuyRitchiebyKathyHutchins.jpg",
  "birthDate": "1968-09-10",
  "countries": [
   "Великобритания"
  ],
  "birthplace": "Хатфилд"
 },
 "Рэйчел Талалэй": {
  "originalName": "Rachel Talalay",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/5/56/Rachel_Talalay.jpg/250px-Rachel_Talalay.jpg",
  "birthDate": "1958-08-16",
  "countries": [
   "США"
  ],
  "birthplace": "Чикаго"
 },
 "Пол Макгиган": {
  "originalName": "Paul McGuigan",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e8/SDCC_2015_-_Paul_McGuigan_%2819740488065%29_%28cropped%29.jpg/250px-SDCC_2015_-_Paul_McGuigan_%2819740488065%29_%28cropped%29.jpg",
  "birthDate": "1963-09-19",
  "countries": [
   "Великобритания"
  ],
  "birthplace": "Белсхилл"
 },
 "Эйрос Лин": {
  "originalName": "Euros Lyn",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c5/Euros_Lyn.jpg/250px-Euros_Lyn.jpg",
  "birthDate": "1971-03-28",
  "countries": [
   "Великобритания"
  ],
  "birthplace": "Кардифф"
 },
 "Ник Харран": {
  "originalName": "Nick Hurran",
  "birthDate": "1959",
  "countries": [
   "Великобритания"
  ],
  "birthplace": "Лондон"
 },
 "Сью Верчью": {
  "originalName": "Sue Vertue",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/4/4e/Sue_Vertue_by_Gage_Skidmore.jpg/250px-Sue_Vertue_by_Gage_Skidmore.jpg",
  "birthDate": "1960-09-21",
  "countries": [
   "Великобритания"
  ],
  "birthplace": "Суррей"
 },
 "Винс Гиллиган": {
  "originalName": "Vince Gilligan",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/3d/Vince_Gilligan_at_53rd_Saturn_Awards_2026-03.jpg/250px-Vince_Gilligan_at_53rd_Saturn_Awards_2026-03.jpg",
  "birthDate": "1967-02-10",
  "countries": [
   "США"
  ],
  "birthplace": "Ричмонд"
 },
 "Брайан Крэнстон": {
  "originalName": "Bryan Cranston",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/9/95/BryanCranston-byPhilipRomano_%28cropped%29.jpg/250px-BryanCranston-byPhilipRomano_%28cropped%29.jpg",
  "birthDate": "1956-03-07",
  "countries": [
   "США"
  ],
  "birthplace": "Голливуд"
 },
 "Мишель Макларен": {
  "originalName": "Michelle MacLaren",
  "birthDate": "1965",
  "countries": [
   "Канада"
  ],
  "birthplace": "Ванкувер"
 },
 "Дэвид Слэйд": {
  "originalName": "David Slade",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/0d/David_slade_eclipse_premiere.jpg/250px-David_slade_eclipse_premiere.jpg",
  "birthDate": "1969-09-26",
  "countries": [
   "Великобритания"
  ]
 },
 "Феликс Энрикез Алькала": {
  "originalName": "Félix Enríquez Alcalá",
  "birthDate": "1951-03-07",
  "countries": [
   "США"
  ],
  "birthplace": "Бейкерсфилд"
 },
 "Тим Хантер": {
  "originalName": "Tim Hunter",
  "birthDate": "1947-06-15",
  "countries": [
   "США"
  ],
  "birthplace": "Лос-Анджелес"
 },
 "Райан Джонсон": {
  "originalName": "Rian Johnson",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/79/Rian_Johnson_by_Gage_Skidmore_%28cropped%29.jpg/250px-Rian_Johnson_by_Gage_Skidmore_%28cropped%29.jpg",
  "birthDate": "1973-12-17",
  "countries": [
   "США"
  ],
  "birthplace": "Силвер-Спринг"
 },
 "Питер Медак": {
  "originalName": "Peter Medak",
  "birthDate": "1937-12-23",
  "countries": [
   "Венгрия"
  ],
  "birthplace": "Будапешт"
 },
 "Чарльз Хейд": {
  "originalName": "Charles Haid",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/6/66/Haid%2C_Charles_%282007%29_2.jpg/250px-Haid%2C_Charles_%282007%29_2.jpg",
  "birthDate": "1943-06-02",
  "countries": [
   "США"
  ],
  "birthplace": "Сан-Франциско"
 },
 "Йохан Ренк": {
  "originalName": "Johan Renck",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/5/55/Johan_Renck_at_Berlinale_2024.jpg/250px-Johan_Renck_at_Berlinale_2024.jpg",
  "birthDate": "1966-12-05",
  "countries": [
   "Швеция"
  ],
  "birthplace": "Уппсала"
 },
 "Джон Дал": {
  "originalName": "John Dahl",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/d/df/JohnDahlJun07.jpg/250px-JohnDahlJun07.jpg",
  "birthDate": "1956-12-11",
  "countries": [
   "США"
  ],
  "birthplace": "Биллингс"
 },
 "Адам Бернстайн": {
  "originalName": "Adam Bernstein",
  "birthDate": "1960-05-07",
  "countries": [
   "США"
  ],
  "birthplace": "Принстон"
 },
 "Скотт Винант": {
  "originalName": "Scott Winant",
  "countries": [
   "США"
  ]
 },
 "Бронуэн Хьюз": {
  "originalName": "Bronwen Hughes",
  "birthDate": "1967-10-17",
  "countries": [
   "Канада"
  ],
  "birthplace": "Торонто"
 },
 "Колин Бакси": {
  "originalName": "Colin Bucksey",
  "birthDate": "1946",
  "countries": [
   "США"
  ],
  "birthplace": "Камберуэлл"
 },
 "Джордж Мастрас": {
  "originalName": "George Mastras",
  "birthDate": "1945-11-03",
  "countries": [
   "США"
  ],
  "birthplace": "Бостон"
 },
 "Джим МакКэй": {
  "originalName": "Jim McKay",
  "birthDate": "1962",
  "countries": [
   "США"
  ],
  "birthplace": "Энглвуд"
 },
 "Майкл Словис": {
  "originalName": "Michael Slovis",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f3/Michael_Slovis.jpg/250px-Michael_Slovis.jpg",
  "countries": [
   "США"
  ],
  "birthplace": "Плейнфилд"
 },
 "Питер Гулд": {
  "originalName": "Peter Gould",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/00/Peter_Gould_%2825866430973%29.jpg/250px-Peter_Gould_%2825866430973%29.jpg",
  "birthDate": "1962",
  "countries": [
   "США"
  ],
  "birthplace": "Нью-Йорк"
 },
 "Фил Абрахам": {
  "originalName": "Phil Abraham",
  "countries": [
   "США"
  ]
 },
 "Сэм Кэтлин": {
  "originalName": "Sam Catlin",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/5/51/Sam_Catlin_by_Gage_Skidmore.jpg/250px-Sam_Catlin_by_Gage_Skidmore.jpg",
  "birthDate": "1950",
  "countries": [
   "США"
  ]
 },
 "Терри МакДонаф": {
  "originalName": "Terry McDonough",
  "countries": [
   "Великобритания"
  ]
 },
 "Тришиа Брок": {
  "originalName": "Tricia Brock",
  "birthDate": "1950",
  "countries": [
   "США"
  ],
  "birthplace": "Миссури"
 },
 "Джон Шибан": {
  "originalName": "John Shiban",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d8/John_Shiban_by_Gage_Skidmore.jpg/250px-John_Shiban_by_Gage_Skidmore.jpg",
  "birthDate": "1953",
  "countries": [
   "США"
  ]
 },
 "Томас Шнауз": {
  "originalName": "Thomas Schnauz",
  "birthDate": "1966-12-02",
  "countries": [
   "США"
  ],
  "birthplace": "Нью-Джерси"
 },
 "Мойра Уолли": {
  "originalName": "Moira Walley-Beckett",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/00/Moira_Walley-Beckett_on_the_%E2%80%9CFlesh_and_Bone%E2%80%9D_Red_Carpet.jpg/250px-Moira_Walley-Beckett_on_the_%E2%80%9CFlesh_and_Bone%E2%80%9D_Red_Carpet.jpg",
  "countries": [
   "Канада"
  ]
 },
 "Фрэнсис Форд Коппола": {
  "originalName": "Francis Ford Coppola",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/0b/Francis_Ford_Coppola_on_December_8%2C_2024_in_the_White_House_Oval_Office_%28cropped%29.jpg/250px-Francis_Ford_Coppola_on_December_8%2C_2024_in_the_White_House_Oval_Office_%28cropped%29.jpg",
  "birthDate": "1939-04-07",
  "countries": [
   "США"
  ],
  "birthplace": "Детройт"
 },
 "Альберт С. Радди": {
  "originalName": "Albert S. Ruddy",
  "birthDate": "1930-03-28",
  "deathYear": "2024",
  "countries": [
   "Канада"
  ],
  "birthplace": "Монреаль"
 },
 "Чарльз Ровен": {
  "originalName": "Charles Roven",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e5/Charles_Roven_%28cropped%29.JPG/250px-Charles_Roven_%28cropped%29.JPG",
  "birthDate": "1949-08-02",
  "countries": [
   "США"
  ],
  "birthplace": "Лос-Анджелес"
 },
 "Дэвид Финчер": {
  "originalName": "David Fincher",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/6/67/David_Fincher_%282012%29_3.jpg/250px-David_Fincher_%282012%29_3.jpg",
  "birthDate": "1962-05-10",
  "countries": [
   "США"
  ],
  "birthplace": "Денвер"
 },
 "Арт Линсон": {
  "originalName": "Art Linson",
  "birthDate": "1942-03-16",
  "countries": [
   "США"
  ],
  "birthplace": "Чикаго"
 },
 "Кин Чеффин": {
  "originalName": "Ceán Chaffin",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/4/4e/CeanChaffin.jpg/250px-CeanChaffin.jpg",
  "birthDate": "1957-06-26",
  "countries": [
   "США"
  ],
  "birthplace": "Лос-Анджелес"
 },
 "Квентин Тарантино": {
  "originalName": "Quentin Tarantino",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/0b/Quentin_Tarantino_by_Gage_Skidmore.jpg/250px-Quentin_Tarantino_by_Gage_Skidmore.jpg",
  "birthDate": "1963-03-27",
  "countries": [
   "США"
  ],
  "birthplace": "Ноксвилл"
 },
 "Лоренс Бендер": {
  "originalName": "Lawrence Bender",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f9/LawrenceBenderIBAug09.jpg/250px-LawrenceBenderIBAug09.jpg",
  "birthDate": "1957-10-17",
  "countries": [
   "США"
  ],
  "birthplace": "Бронкс"
 },
 "Дэмьен Шазелл": {
  "originalName": "Damien Chazelle",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/5/54/Damien_Chazelle_%28cropped%29.jpg/250px-Damien_Chazelle_%28cropped%29.jpg",
  "birthDate": "1985-01-19",
  "countries": [
   "Франция",
   "США"
  ],
  "birthplace": "Провиденс"
 },
 "Джейсон Блум": {
  "originalName": "Jason Blum",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b7/2025_Jason_Blum_%28cropped%29.jpg/250px-2025_Jason_Blum_%28cropped%29.jpg",
  "birthDate": "1969-02-20",
  "countries": [
   "США"
  ],
  "birthplace": "Лос-Анджелес"
 },
 "Хелен Эстабрук": {
  "originalName": "Helen Estabrook",
  "countries": [
   "США"
  ],
  "birthplace": "Шампейн"
 },
 "Дэвид Ланкастер": {
  "originalName": "David Lancaster",
  "countries": [
   "США"
  ]
 },
 "Михаил Литвак": {
  "originalName": "Michel Litvak",
  "countries": [
   "США"
  ]
 },
 "Питер Уир": {
  "originalName": "Peter Weir",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/2/29/PeterWeirApr2011_%28cropped%29.jpg/250px-PeterWeirApr2011_%28cropped%29.jpg",
  "birthDate": "1944-08-21",
  "countries": [
   "Австралия"
  ],
  "birthplace": "Сидней"
 },
 "Эндрю Никкол": {
  "originalName": "Andrew Niccol",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/12/Andrew_Niccol_by_Gage_Skidmore.jpg/250px-Andrew_Niccol_by_Gage_Skidmore.jpg",
  "birthDate": "1964-06-10",
  "countries": [
   "Новая Зеландия"
  ],
  "birthplace": "Парапарауму"
 },
 "Скотт Рудин": {
  "originalName": "Scott Rudin",
  "birthDate": "1958-07-14",
  "countries": [
   "США"
  ],
  "birthplace": "Болдуин"
 },
 "Адам Шрёдер": {
  "originalName": "Adam Schroeder",
  "countries": [
   "США"
  ]
 },
 "Эдвард С. Фельдман": {
  "originalName": "Edward S. Feldman",
  "birthDate": "1929-09-05",
  "deathYear": "2020",
  "countries": [
   "США"
  ],
  "birthplace": "Бронкс"
 },
 "Гари Гилберт": {
  "originalName": "Gary Gilbert",
  "birthDate": "1965",
  "countries": [
   "США"
  ],
  "birthplace": "Детройт"
 },
 "Марк Платт": {
  "originalName": "Marc Platt",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/39/Marc_Platt_-_Wicked.jpg/250px-Marc_Platt_-_Wicked.jpg",
  "birthDate": "1957",
  "countries": [
   "США"
  ],
  "birthplace": "Пайксвилл"
 },
 "Фред Бергер": {
  "originalName": "Fred Berger",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/d/de/Fred_Berger_at_the_2024_Toronto_International_Film_Festival_2.jpg/250px-Fred_Berger_at_the_2024_Toronto_International_Film_Festival_2.jpg",
  "birthDate": "1981",
  "countries": [
   "США"
  ],
  "birthplace": "Нью-Йорк"
 },
 "Джордан Горовиц": {
  "originalName": "Jordan Horowitz",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/c/cd/Jordan_Horowitz_2016.png/250px-Jordan_Horowitz_2016.png",
  "birthDate": "1980-04-10",
  "countries": [
   "США"
  ],
  "birthplace": "Нью-Йорк"
 },
 "Уэс Андерсон": {
  "originalName": "Wes Anderson",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/6/68/Wes_Anderson-7541.jpg/250px-Wes_Anderson-7541.jpg",
  "birthDate": "1969-05-01",
  "countries": [
   "США"
  ],
  "birthplace": "Хьюстон"
 },
 "Чарли Вобкен": {
  "originalName": "Carl Woebcken",
  "birthDate": "1956-10-25",
  "countries": [
   "Германия"
  ]
 },
 "Christoph Fisser": {
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b0/Christoph_Fisser%2C_February_2015.jpg/250px-Christoph_Fisser%2C_February_2015.jpg",
  "birthDate": "1960",
  "countries": [
   "Германия"
  ]
 },
 "Хеннинг Мольфентер": {
  "originalName": "Henning Molfenter",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c1/Henning_Molfenter_%28Studio_Babelsberg%29_2015_%28cropped%29.JPG/250px-Henning_Molfenter_%28Studio_Babelsberg%29_2015_%28cropped%29.JPG",
  "birthDate": "1967",
  "countries": [
   "Германия"
  ]
 },
 "Стивен М. Рэйлс": {
  "originalName": "Steven Rales",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f4/Steven_Rales.jpg/250px-Steven_Rales.jpg",
  "birthDate": "1951-03-31",
  "countries": [
   "США"
  ],
  "birthplace": "Бетесда"
 },
 "Джереми Даусон": {
  "originalName": "Jeremy Dawson",
  "countries": [
   "США"
  ]
 },
 "Пон Джун Хо": {
  "originalName": "Bong Joon-ho",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/19/Bong_Joon_Ho_-_Okja.jpg/250px-Bong_Joon_Ho_-_Okja.jpg",
  "birthDate": "1969-09-14",
  "countries": [
   "Республика Корея"
  ],
  "birthplace": "Тэгу"
 },
 "Kwak Sin-ae": {
  "birthDate": "1968-10-23",
  "countries": [
   "Республика Корея"
  ],
  "birthplace": "Пусан"
 },
 "Жан-Пьер Жёне": {
  "originalName": "Jean-Pierre Jeunet",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/4/48/Jean-Pierre_Jeunet_M%C3%BCnchen_2014_%28cropped%29.JPG/250px-Jean-Pierre_Jeunet_M%C3%BCnchen_2014_%28cropped%29.JPG",
  "birthDate": "1953-09-03",
  "countries": [
   "Франция"
  ],
  "birthplace": "Ле-Кото"
 },
 "Клоди Оссард": {
  "originalName": "Claudie Ossard",
  "birthDate": "1943-12-16",
  "countries": [
   "Франция"
  ],
  "birthplace": "Париж"
 },
 "Гас Ван Сент": {
  "originalName": "Gus Van Sant",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/06/Gus_Van_Sant_at_82nd_Venice_International_Film_Festival-1.jpg/250px-Gus_Van_Sant_at_82nd_Venice_International_Film_Festival-1.jpg",
  "birthDate": "1952-07-24",
  "countries": [
   "Королевство Нидерландов",
   "США"
  ],
  "birthplace": "Луисвилл"
 },
 "Оливье Накаш": {
  "originalName": "Olivier Nakache",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b5/Olivier_Nakache_d%C3%A9jeuner_C%C3%A9sar_2018.jpg/250px-Olivier_Nakache_d%C3%A9jeuner_C%C3%A9sar_2018.jpg",
  "birthDate": "1973-04-15",
  "countries": [
   "Франция"
  ],
  "birthplace": "Сюрен"
 },
 "Эрик Толедано": {
  "originalName": "Éric Toledano",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/fa/Eric_Toledano_d%C3%A9jeuner_C%C3%A9sar_2018.jpg/250px-Eric_Toledano_d%C3%A9jeuner_C%C3%A9sar_2018.jpg",
  "birthDate": "1971-07-03",
  "countries": [
   "Франция"
  ],
  "birthplace": "Париж"
 },
 "Лоран Зейтун": {
  "originalName": "Laurent Zeitoun",
  "birthDate": "1973-06-16",
  "countries": [
   "Франция"
  ],
  "birthplace": "Париж"
 },
 "Янн Зену": {
  "originalName": "Yann Zenou",
  "birthDate": "1974-10-28",
  "countries": [
   "Франция"
  ]
 },
 "Nicolas Duval Adassovsky": {
  "birthDate": "1958-01-26",
  "countries": [
   "Франция"
  ]
 },
 "Хаяо Миядзаки": {
  "originalName": "Hayao Miyazaki",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/ff/HayaoMiyazakiCCJuly09.jpg/250px-HayaoMiyazakiCCJuly09.jpg",
  "birthDate": "1941-01-05",
  "countries": [
   "Япония"
  ],
  "birthplace": "Бункё"
 },
 "Тосио Судзуки": {
  "originalName": "Toshio Suzuki",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/9/97/Toshio_Suzuki%2C_Howl%27s_Moving_Castle_premiere.jpg/250px-Toshio_Suzuki%2C_Howl%27s_Moving_Castle_premiere.jpg",
  "birthDate": "1948-08-19",
  "countries": [
   "Япония"
  ],
  "birthplace": "Нагоя"
 },
 "Тоору Хара": {
  "originalName": "Tōru Hara",
  "birthDate": "1935-12-26",
  "deathYear": "2021",
  "countries": [
   "Япония"
  ],
  "birthplace": "Китакюсю"
 },
 "Эндрю Стэнтон": {
  "originalName": "Andrew Stanton",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/b/bc/Andrew_Stanton_at_the_2026_Sundance_Film_Festival_for_In_the_Blink_of_an_Eye_%2801%29_%28cropped%29.jpg/250px-Andrew_Stanton_at_the_2026_Sundance_Film_Festival_for_In_the_Blink_of_an_Eye_%2801%29_%28cropped%29.jpg",
  "birthDate": "1965-12-03",
  "countries": [
   "США"
  ],
  "birthplace": "Рокпорт"
 },
 "Джим Моррис": {
  "originalName": "Jim Morris",
  "birthDate": "1940",
  "countries": [
   "США"
  ]
 },
 "Линдси Коллинз": {
  "originalName": "Lindsey Collins",
  "countries": [
   "США"
  ]
 },
 "Брэд Бёрд": {
  "originalName": "Brad Bird",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/3a/Brad_bird_cropped_2009.jpg/250px-Brad_bird_cropped_2009.jpg",
  "birthDate": "1957-09-24",
  "countries": [
   "США"
  ],
  "birthplace": "Калиспелл"
 },
 "Ян Пинкава": {
  "originalName": "Jan Pinkava",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/d/df/JanPinkavaHeadShot.JPG/250px-JanPinkavaHeadShot.JPG",
  "birthDate": "1963-06-21",
  "countries": [
   "Чехия"
  ],
  "birthplace": "Прага"
 },
 "Брэд Льюис": {
  "originalName": "Brad Lewis",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/1a/Brad_Lewis.jpg/250px-Brad_Lewis.jpg",
  "birthDate": "1958-04-29",
  "countries": [
   "США"
  ],
  "birthplace": "Сакраменто"
 },
 "Ли Анкрич": {
  "originalName": "Lee Unkrich",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/05/Lee_Unkrich_cropped_2009.jpg/250px-Lee_Unkrich_cropped_2009.jpg",
  "birthDate": "1967-08-08",
  "countries": [
   "США"
  ],
  "birthplace": "Кливленд"
 },
 "Эдриан Молина": {
  "originalName": "Adrian Molina",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d9/Adrian_Molina_2017.jpg/250px-Adrian_Molina_2017.jpg",
  "birthDate": "1985-08-23",
  "countries": [
   "США"
  ],
  "birthplace": "Юба-Сити"
 },
 "Дарла К. Андерсон": {
  "originalName": "Darla K. Anderson",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/6/60/Darla_K._Anderson.jpg/250px-Darla_K._Anderson.jpg",
  "birthDate": "1970-08-22",
  "countries": [
   "США"
  ],
  "birthplace": "Глендейл"
 },
 "Пит Доктер": {
  "originalName": "Pete Docter",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/fd/Pete_Docter_cropped_2009.jpg/250px-Pete_Docter_cropped_2009.jpg",
  "birthDate": "1968-10-09",
  "countries": [
   "США"
  ],
  "birthplace": "Блумингтон"
 },
 "Ронни Дель Кармен": {
  "originalName": "Ronnie del Carmen",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/8/84/Ronnie_del_Carmen.jpg/250px-Ronnie_del_Carmen.jpg",
  "birthDate": "1959-12-31",
  "countries": [
   "Филиппины"
  ],
  "birthplace": "Кавит-сити"
 },
 "Джон Лассетер": {
  "originalName": "John Lasseter",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b0/JohnLasseterOct2011.jpg/250px-JohnLasseterOct2011.jpg",
  "birthDate": "1957-01-12",
  "countries": [
   "США"
  ],
  "birthplace": "Голливуд"
 },
 "Джонас Ривера": {
  "originalName": "Jonas Rivera",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a6/Jonas_Rivera_2009.jpg/250px-Jonas_Rivera_2009.jpg",
  "birthDate": "1971",
  "countries": [
   "США"
  ],
  "birthplace": "Кастро-Валли"
 },
 "Питер Рэмси": {
  "originalName": "Peter Ramsey",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f1/Peter_Ramsey%2C_director%2C_Rise_of_the_Guardians_premiere%2C_Mill_Valley_Film_Festival.jpg/250px-Peter_Ramsey%2C_director%2C_Rise_of_the_Guardians_premiere%2C_Mill_Valley_Film_Festival.jpg",
  "birthDate": "1962-12-23",
  "countries": [
   "США"
  ]
 },
 "Родни Ротман": {
  "originalName": "Rodney Rothman",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/4/4b/Rodney_Rothman_by_Gage_Skidmore.jpg/250px-Rodney_Rothman_by_Gage_Skidmore.jpg",
  "countries": [
   "США"
  ]
 },
 "Боб Персичетти": {
  "originalName": "Bob Persichetti",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/8/83/Bob_Persichetti_by_Gage_Skidmore.jpg/250px-Bob_Persichetti_by_Gage_Skidmore.jpg",
  "birthDate": "1973-01-17",
  "countries": [
   "США"
  ],
  "birthplace": "Сан-Диего"
 },
 "Эми Паскаль": {
  "originalName": "Amy Pascal",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d6/Amy_Pascal_Jay_Kelly-26_%28cropped%29.jpg/250px-Amy_Pascal_Jay_Kelly-26_%28cropped%29.jpg",
  "birthDate": "1958-03-25",
  "countries": [
   "США"
  ],
  "birthplace": "Лос-Анджелес"
 },
 "Ави Арад": {
  "originalName": "Avi Arad",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/5/5d/Avi_Arad_by_Gage_Skidmore.jpg/250px-Avi_Arad_by_Gage_Skidmore.jpg",
  "birthDate": "1948-08-01",
  "countries": [
   "Израиль",
   "США"
  ],
  "birthplace": "Рамат-Ган"
 },
 "Эндрю Адамсон": {
  "originalName": "Andrew Adamson",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/1a/Andrew_Adamson_%28cropped%29.jpg/250px-Andrew_Adamson_%28cropped%29.jpg",
  "birthDate": "1966-12-01",
  "countries": [
   "Новая Зеландия"
  ],
  "birthplace": "Окленд"
 },
 "Вики Дженсон": {
  "originalName": "Vicky Jenson",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/ac/Vicky_Jenson.jpg/250px-Vicky_Jenson.jpg",
  "birthDate": "1960-03-04",
  "countries": [
   "США"
  ],
  "birthplace": "Лос-Анджелес"
 },
 "Стивен Спилберг": {
  "originalName": "Steven Spielberg",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/3e/Steven_Spielberg_2025.jpg/250px-Steven_Spielberg_2025.jpg",
  "birthDate": "1946-12-18",
  "countries": [
   "США"
  ],
  "birthplace": "Цинциннати"
 },
 "Джеффри Катценберг": {
  "originalName": "Jeffrey Katzenberg",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/3c/Jeffrey_Katzenberg%2C_World_Travel_%26_Tourism_Council%2C_Global_Summit_2014-1_%28cropped%29.jpg/250px-Jeffrey_Katzenberg%2C_World_Travel_%26_Tourism_Council%2C_Global_Summit_2014-1_%28cropped%29.jpg",
  "birthDate": "1950-12-21",
  "countries": [
   "США"
  ],
  "birthplace": "Нью-Йорк"
 },
 "Арон Уорнер": {
  "originalName": "Aron Warner",
  "birthDate": "1961-03-25",
  "countries": [
   "США"
  ],
  "birthplace": "Пасадина"
 },
 "Джон Уильямс": {
  "originalName": "John H. Williams",
  "birthDate": "1953-06-17",
  "countries": [
   "США"
  ]
 },
 "Эд Катмулл": {
  "originalName": "Edwin Catmull",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/aa/VES_Awards_89_cropped.jpg/250px-VES_Awards_89_cropped.jpg",
  "birthDate": "1945-03-31",
  "countries": [
   "США"
  ],
  "birthplace": "Паркерсберг"
 },
 "Бонни Арнольд": {
  "originalName": "Bonnie Arnold",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/34/ThatXmasBFILFF191024_%2835_of_119%29_%2854100311801%29_%28Bonnie_Arnold%29.jpg/250px-ThatXmasBFILFF191024_%2835_of_119%29_%2854100311801%29_%28Bonnie_Arnold%29.jpg",
  "birthDate": "1955",
  "countries": [
   "США"
  ],
  "birthplace": "Атланта"
 },
 "Ральф Гуггенхейм": {
  "originalName": "Ralph Guggenheim",
  "birthDate": "1951-06-06",
  "countries": [
   "США"
  ],
  "birthplace": "Нью-Рошелл"
 },
 "Ридли Скотт": {
  "originalName": "Ridley Scott",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/5/58/Ridley_Scott_At_BFI_-_BFI_Southbank_-_Saturday_4th_October_2025.jpg/250px-Ridley_Scott_At_BFI_-_BFI_Southbank_-_Saturday_4th_October_2025.jpg",
  "birthDate": "1937",
  "countries": [
   "Великобритания"
  ],
  "birthplace": "Саут-Шилдс"
 },
 "Уолтер Хилл": {
  "originalName": "Walter Hill",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/1e/Walter_Hill_1137_%28cropped%29.jpg/250px-Walter_Hill_1137_%28cropped%29.jpg",
  "birthDate": "1942-01-10",
  "countries": [
   "США"
  ],
  "birthplace": "Лонг-Бич"
 },
 "Гордон Кэрролл": {
  "originalName": "Gordon Carroll",
  "birthDate": "1928-02-02",
  "deathYear": "2005",
  "countries": [
   "США"
  ],
  "birthplace": "Балтимор"
 },
 "Дэвид Гилер": {
  "originalName": "David Giler",
  "birthDate": "1943-07-23",
  "deathYear": "2020",
  "countries": [
   "США"
  ],
  "birthplace": "Нью-Йорк"
 },
 "Стэнли Кубрик": {
  "originalName": "Stanley Kubrick",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/8/87/Stanley_Kubrick_%281949_portrait_by_Phillip_Harrington_-_cropped%29.jpg/250px-Stanley_Kubrick_%281949_portrait_by_Phillip_Harrington_-_cropped%29.jpg",
  "birthDate": "1928-07-26",
  "deathYear": "1999",
  "countries": [
   "Великобритания",
   "США"
  ],
  "birthplace": "Бронкс"
 },
 "Джон Карпентер": {
  "originalName": "John Carpenter",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/2/27/Portrait_of_John_Carpenter.jpg/250px-Portrait_of_John_Carpenter.jpg",
  "birthDate": "1948-01-16",
  "countries": [
   "США"
  ],
  "birthplace": "Джефферсон"
 },
 "Дэвид Фостер": {
  "originalName": "David Foster",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/35/David_Foster_by_Gage_Skidmore.jpg/250px-David_Foster_by_Gage_Skidmore.jpg",
  "birthDate": "1949-11-01",
  "countries": [
   "Канада"
  ],
  "birthplace": "Виктория"
 },
 "Лоуренс Турман": {
  "originalName": "Lawrence Turman",
  "birthDate": "1926-11-28",
  "deathYear": "2023",
  "countries": [
   "США"
  ],
  "birthplace": "Лос-Анджелес"
 },
 "Джордан Пил": {
  "originalName": "Jordan Peele",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/30/Jordan_Peele_Peabody_2014_%28cropped%29.jpg/250px-Jordan_Peele_Peabody_2014_%28cropped%29.jpg",
  "birthDate": "1979-02-21",
  "countries": [
   "США"
  ],
  "birthplace": "Нью-Йорк"
 },
 "Шон МакКиттрик": {
  "originalName": "Sean McKittrick",
  "birthDate": "1975-03-20",
  "countries": [
   "США"
  ],
  "birthplace": "Беркли"
 },
 "Тед Хэмм": {
  "originalName": "Edward H. Hamm Jr."
 },
 "Джеймс Ван": {
  "originalName": "James Wan",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/9/94/James_Wan_at_Sundance_Film_Festival_2026.jpg/250px-James_Wan_at_Sundance_Film_Festival_2026.jpg",
  "birthDate": "1977-02-26",
  "countries": [
   "Австралия",
   "Малайзия",
   "США"
  ],
  "birthplace": "Кучинг"
 },
 "Питер Сафран": {
  "originalName": "Peter Safran",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f7/Superman_Red_Carpet-7891_%28cropped%29.jpg/250px-Superman_Red_Carpet-7891_%28cropped%29.jpg",
  "birthDate": "1965-11-22",
  "countries": [
   "Великобритания"
  ],
  "birthplace": "Лондон"
 },
 "Джон Красински": {
  "originalName": "John Krasinski",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/2/22/John_Krasinski_at_TIFF_2025_02_%28cropped%29.jpg/250px-John_Krasinski_at_TIFF_2025_02_%28cropped%29.jpg",
  "birthDate": "1979-10-20",
  "countries": [
   "США"
  ],
  "birthplace": "Ньютон"
 },
 "Майкл Бэй": {
  "originalName": "Michael Bay",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d4/MichaelBay08.jpg/250px-MichaelBay08.jpg",
  "birthDate": "1965-02-17",
  "countries": [
   "США"
  ],
  "birthplace": "Лос-Анджелес"
 },
 "Брэдли Фуллер": {
  "originalName": "Bradley Fuller",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/75/Brad_Fuller_%2815164454905%29.jpg/250px-Brad_Fuller_%2815164454905%29.jpg",
  "birthDate": "1965",
  "countries": [
   "США"
  ]
 },
 "Эндрю Форм": {
  "originalName": "Andrew Form",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/5/57/Andrew_Form.jpg/250px-Andrew_Form.jpg",
  "birthDate": "1969",
  "countries": [
   "США"
  ],
  "birthplace": "Лонг-Айленд"
 },
 "Баран бо Одар": {
  "originalName": "Baran bo Odar",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/ae/AV0A2925_Jantje_Friese_und_Baran_bo_Odar_%28Dark%29_%28cropped%292.jpg/250px-AV0A2925_Jantje_Friese_und_Baran_bo_Odar_%28Dark%29_%28cropped%292.jpg",
  "birthDate": "1978-04-18",
  "countries": [
   "Германия"
  ],
  "birthplace": "Ольтен"
 },
 "Макс Видеман": {
  "originalName": "Max Wiedemann",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f1/Max_Wiedemann_2012.jpg/250px-Max_Wiedemann_2012.jpg",
  "birthDate": "1977-12-22",
  "countries": [
   "Германия"
  ],
  "birthplace": "Мюнхен"
 },
 "Квирин Берг": {
  "originalName": "Quirin Berg",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f5/2016_Quirin_Berg_-_by_2eight_-_8SC2268.jpg/250px-2016_Quirin_Berg_-_by_2eight_-_8SC2268.jpg",
  "birthDate": "1978-03-01",
  "countries": [
   "Германия"
  ],
  "birthplace": "Мюнхен"
 },
 "Янтье Фризе": {
  "originalName": "Jantje Friese",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/9/95/Grimmepreis_2018_027_%28cropped%29_-_Jantje_Friese.jpg/250px-Grimmepreis_2018_027_%28cropped%29_-_Jantje_Friese.jpg",
  "birthDate": "1977",
  "countries": [
   "Германия"
  ],
  "birthplace": "Марбург"
 },
 "Шон Леви": {
  "originalName": "Shawn Levy",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/4/43/Shawn_Levy_by_Gage_Skidmore_2.jpg/250px-Shawn_Levy_by_Gage_Skidmore_2.jpg",
  "birthDate": "1968-07-23",
  "countries": [
   "США"
  ],
  "birthplace": "Монреаль"
 },
 "Ричард Гринберг": {
  "originalName": "Richard Alan Greenberg",
  "birthDate": "1947-01-21",
  "deathYear": "2018",
  "countries": [
   "США"
  ],
  "birthplace": "Чикаго"
 },
 "Мэтт Даффер": {
  "originalName": "Matt Duffer",
  "birthDate": "1984-02-15",
  "countries": [
   "США"
  ],
  "birthplace": "Дарем"
 },
 "Росс Даффер": {
  "originalName": "Ross Duffer",
  "birthDate": "1984-02-15",
  "countries": [
   "США"
  ],
  "birthplace": "Дарем"
 },
 "Кэри Фукунага": {
  "originalName": "Cary Joji Fukunaga",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e0/Cary_Joji_Fukunaga_%22Beast_Of_No_Nation%22_at_Opening_Ceremony_of_the_28th_Tokyo_International_Film_Festival_%2821806112494%29_%28cropped%29.jpg/250px-Cary_Joji_Fukunaga_%22Beast_Of_No_Nation%22_at_Opening_Ceremony_of_the_28th_Tokyo_International_Film_Festival_%2821806112494%29_%28cropped%29.jpg",
  "birthDate": "1977-07-10",
  "countries": [
   "США"
  ],
  "birthplace": "Окленд"
 },
 "Сэнна Уоленберг": {
  "originalName": "Sanne Wohlenberg",
  "birthDate": "1968-08-09",
  "countries": [
   "Германия"
  ],
  "birthplace": "Вольфсбург"
 },
 "Чэд Оукс": {
  "originalName": "Chad Oakes",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/5/5c/Fargo_-_et_lite_stykke_Norge_-_NMD_2015_%2816798117894%29.jpg/250px-Fargo_-_et_lite_stykke_Norge_-_NMD_2015_%2816798117894%29.jpg",
  "birthDate": "1968-05-27",
  "countries": [
   "Канада"
  ],
  "birthplace": "Калгари"
 },
 "Дэвид Линч": {
  "originalName": "David Lynch",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/d/de/David_Lynch_at_the_1990_Emmy_Awards.jpg/250px-David_Lynch_at_the_1990_Emmy_Awards.jpg",
  "birthDate": "1946-01-20",
  "deathYear": "2025",
  "countries": [
   "США"
  ],
  "birthplace": "Мизула"
 },
 "Марк Фрост": {
  "originalName": "Mark Frost",
  "birthDate": "1953-11-25",
  "countries": [
   "США"
  ],
  "birthplace": "Бруклин"
 },
 "Бен Стиллер": {
  "originalName": "Ben Stiller",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/5/56/Ben_Stiller_at_the_2024_Toronto_International_Film_Festival_%28cropped%29.jpg/250px-Ben_Stiller_at_the_2024_Toronto_International_Film_Festival_%28cropped%29.jpg",
  "birthDate": "1965-11-30",
  "countries": [
   "США"
  ],
  "birthplace": "Нью-Йорк"
 },
 "Аойф Макардл": {
  "originalName": "Aoife McArdle",
  "birthplace": "Ома"
 },
 "Крэйг Мэйзин": {
  "originalName": "Craig Mazin",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/5/51/Craig_Mazin%2C_MovieZine_interview_%28cropped%29.png/250px-Craig_Mazin%2C_MovieZine_interview_%28cropped%29.png",
  "birthDate": "1971-04-08",
  "countries": [
   "США"
  ],
  "birthplace": "Бруклин"
 },
 "Нил Дракманн": {
  "originalName": "Neil Druckmann",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e8/Neil_Druckmann%2C_co-director%2C_at_SXSW_2025_01_%28cropped%29.jpg/250px-Neil_Druckmann%2C_co-director%2C_at_SXSW_2025_01_%28cropped%29.jpg",
  "birthDate": "1978-12-05",
  "countries": [
   "Израиль",
   "США"
  ],
  "birthplace": "Тель-Авив"
 },
 "Кантемир Балагов": {
  "originalName": "Kantemir Balagov",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/6/6a/Kantemir_Balagov_at_the_2026_Cannes_Film_Festival_01_%28cropped%29.jpg/250px-Kantemir_Balagov_at_the_2026_Cannes_Film_Festival_01_%28cropped%29.jpg",
  "birthDate": "1991-07-28",
  "countries": [
   "Россия"
  ],
  "birthplace": "Нальчик"
 },
 "Марта Кауффман": {
  "originalName": "Marta Kauffman",
  "birthDate": "1956-09-21",
  "countries": [
   "США"
  ],
  "birthplace": "Филадельфия"
 },
 "Дэвид Крейн": {
  "originalName": "David Crane",
  "birthDate": "1957-08-13",
  "countries": [
   "США"
  ],
  "birthplace": "Филадельфия"
 },
 "Паскаль Чаррю": {
  "originalName": "Pascal Charrue"
 },
 "Арно Делор": {
  "originalName": "Arnaud Delord"
 },
 "Аарон Спрингер": {
  "originalName": "Aaron Springer",
  "birthDate": "1973-09-05",
  "countries": [
   "США"
  ],
  "birthplace": "Сан-Франциско"
 },
 "Роб Ренцетти": {
  "originalName": "Rob Renzetti",
  "birthDate": "1967-09-12",
  "countries": [
   "США"
  ],
  "birthplace": "Чикаго"
 },
 "Стивен Сандовал": {
  "originalName": "Stephen Sandoval",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/10/Stephen_Sandoval_%287600935084%29.jpg/250px-Stephen_Sandoval_%287600935084%29.jpg",
  "countries": [
   "США"
  ],
  "birthplace": "Фресно"
 },
 "Мэтт Брэли": {
  "originalName": "Matt Braly",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/8/82/Matt_Braly%2C_During_Interview.png/250px-Matt_Braly%2C_During_Interview.png",
  "birthDate": "1988-11-08",
  "countries": [
   "США"
  ],
  "birthplace": "Сакраменто"
 },
 "Питер Джексон": {
  "originalName": "Peter Jackson",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c9/Peter_Jackson_ONZ_%28cropped%29.jpg/250px-Peter_Jackson_ONZ_%28cropped%29.jpg",
  "birthDate": "1961-10-31",
  "countries": [
   "Новая Зеландия"
  ],
  "birthplace": "Веллингтон"
 },
 "Фрэн Уолш": {
  "originalName": "Fran Walsh",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/5/51/Fran_Walsh_DNZM_%28cropped%29.jpg/250px-Fran_Walsh_DNZM_%28cropped%29.jpg",
  "birthDate": "1959-01-10",
  "countries": [
   "Новая Зеландия"
  ],
  "birthplace": "Веллингтон"
 },
 "Барри М. Осборн": {
  "originalName": "Barrie M. Osborne",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/3e/Barrie_Osborne_%28cropped%29.jpg/250px-Barrie_Osborne_%28cropped%29.jpg",
  "birthDate": "1944-02-07",
  "countries": [
   "США"
  ],
  "birthplace": "Нью-Йорк"
 },
 "Тим Сандерс": {
  "originalName": "Tim Sanders",
  "birthplace": "Аделаида"
 },
 "Дэвид Хейман": {
  "originalName": "David Heyman",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/1c/David_Heyman_Jay_Kelly-54_%28cropped%29.jpg/250px-David_Heyman_Jay_Kelly-54_%28cropped%29.jpg",
  "birthDate": "1961-07-26",
  "countries": [
   "Великобритания"
  ],
  "birthplace": "Лондон"
 },
 "Альфонсо Куарон": {
  "originalName": "Alfonso Cuarón",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c7/DisclaimerBFILFF101024_%2888_of_113%29_%2854062275143%29_%28cropped%29.jpg/250px-DisclaimerBFILFF101024_%2888_of_113%29_%2854062275143%29_%28cropped%29.jpg",
  "birthDate": "1961",
  "countries": [
   "Мексика"
  ],
  "birthplace": "Мехико"
 },
 "Марк Рэдклифф": {
  "originalName": "Mark Radcliffe",
  "birthDate": "1952-10-07",
  "countries": [
   "США"
  ],
  "birthplace": "Талса"
 },
 "Майк Ньюэлл": {
  "originalName": "Mike Newell",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/5/58/Mike_Newell.jpg/250px-Mike_Newell.jpg",
  "birthDate": "1942-03-28",
  "countries": [
   "Великобритания"
  ],
  "birthplace": "Сент-Олбанс"
 },
 "Дэвид Йейтс": {
  "originalName": "David Yates",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f2/David_Yates_2010_Cropped.jpg/250px-David_Yates_2010_Cropped.jpg",
  "birthDate": "1963-10-08",
  "countries": [
   "Великобритания"
  ],
  "birthplace": "Сент-Хеленс"
 },
 "Дэвид Баррон": {
  "originalName": "David Barron",
  "birthDate": "1954-02-21",
  "countries": [
   "Великобритания"
  ],
  "birthplace": "Ипсден"
 },
 "Джоан Роулинг": {
  "originalName": "J. K. Rowling",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/5/5d/J._K._Rowling_2010.jpg/250px-J._K._Rowling_2010.jpg",
  "birthDate": "1965-07-31",
  "countries": [
   "Великобритания"
  ],
  "birthplace": "Йейт"
 },
 "Кэролинн Каннингем": {
  "originalName": "Carolynne Cunningham",
  "countries": [
   "Австралия"
  ],
  "birthplace": "Сидней"
 },
 "Зейн Уэйнер": {
  "originalName": "Zane Weiner",
  "birthDate": "1963-03-11",
  "countries": [
   "Новая Зеландия"
  ],
  "birthplace": "Окленд"
 },
 "Марк Ордески": {
  "originalName": "Mark Ordesky",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c1/MarkOrdesky2009.jpg/250px-MarkOrdesky2009.jpg",
  "birthDate": "1963-04-22",
  "countries": [
   "США"
  ],
  "birthplace": "Сакраменто"
 },
 "Гор Вербински": {
  "originalName": "Gore Verbinski",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7a/Gore_Verbinski-4342.jpg/250px-Gore_Verbinski-4342.jpg",
  "birthDate": "1964-03-16",
  "countries": [
   "США"
  ],
  "birthplace": "Ок-Ридж"
 },
 "Джерри Брукхаймер": {
  "originalName": "Jerry Bruckheimer",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d5/JerryBruckheimerHWOFJune2013.jpg/250px-JerryBruckheimerHWOFJune2013.jpg",
  "birthDate": "1943-09-21",
  "countries": [
   "США"
  ],
  "birthplace": "Детройт"
 },
 "Лилли Вачовски": {
  "originalName": "Lilly Wachowski",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/d/de/Lily_Wachowski%2C_London%2C_2018_by_Christa_Holka.jpg/250px-Lily_Wachowski%2C_London%2C_2018_by_Christa_Holka.jpg",
  "birthDate": "1967-12-29",
  "countries": [
   "США"
  ],
  "birthplace": "Чикаго"
 },
 "Лана Вачовски": {
  "originalName": "Lana Wachowski",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/00/Lana_Wachowski%2C_Fantastic_Fest%2C_Cloud_Atlas.jpg/250px-Lana_Wachowski%2C_Fantastic_Fest%2C_Cloud_Atlas.jpg",
  "birthDate": "1965-06-21",
  "countries": [
   "США"
  ],
  "birthplace": "Чикаго"
 },
 "Джоэл Сильвер": {
  "originalName": "Joel Silver",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/fb/Joel_Silver_in_New_York_City_2008.jpg/250px-Joel_Silver_in_New_York_City_2008.jpg",
  "birthDate": "1952-07-14",
  "countries": [
   "США"
  ],
  "birthplace": "Саут-Ориндж"
 },
 "Бад Йоркин": {
  "originalName": "Bud Yorkin",
  "birthDate": "1926-02-22",
  "deathYear": "2015",
  "countries": [
   "США"
  ],
  "birthplace": "Вашингтон"
 },
 "Майкл Дили": {
  "originalName": "Michael Deeley",
  "birthDate": "1932-08-06",
  "countries": [
   "Великобритания"
  ],
  "birthplace": "Лондон"
 },
 "Джерри Перенчио": {
  "originalName": "Jerry Perenchio",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/4/42/AJP_2016.jpg/250px-AJP_2016.jpg",
  "birthDate": "1930-12-20",
  "deathYear": "2017",
  "countries": [
   "США"
  ],
  "birthplace": "Фресно"
 },
 "Дени Вильнёв": {
  "originalName": "Denis Villeneuve",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/5/5a/DVilleneuveRFH121024_%2812_of_23%29_%2854061976489%29_%28cropped%29.jpg/250px-DVilleneuveRFH121024_%2812_of_23%29_%2854061976489%29_%28cropped%29.jpg",
  "birthDate": "1967-10-03",
  "countries": [
   "Канада"
  ],
  "birthplace": "Беканкур"
 },
 "Эндрю Косов": {
  "originalName": "Andrew Kosove",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/b/be/Andrew_Kosove_at_San_Diego_Comic_Con_2026.jpg/250px-Andrew_Kosove_at_San_Diego_Comic_Con_2026.jpg",
  "birthDate": "1970",
  "countries": [
   "США"
  ],
  "birthplace": "Филадельфия"
 },
 "Бродерик Джонсон": {
  "originalName": "Broderick Johnson",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d5/Broderick_Johnson_at_San_Diego_Comic_Con_2026.jpg/250px-Broderick_Johnson_at_San_Diego_Comic_Con_2026.jpg",
  "countries": [
   "США"
  ],
  "birthplace": "Атенс"
 },
 "Синтия Сайкс": {
  "originalName": "Cynthia Sikes",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c6/Cynthia_Sikes_Yorkin_%28cropped%29.jpg/250px-Cynthia_Sikes_Yorkin_%28cropped%29.jpg",
  "birthDate": "1954-01-02",
  "countries": [
   "США"
  ],
  "birthplace": "Коффивилл"
 },
 "Ричард П. Рубинштейн": {
  "originalName": "Richard P. Rubinstein",
  "birthDate": "1947-06-15",
  "countries": [
   "США"
  ],
  "birthplace": "Бруклин"
 },
 "Мэри Пэрент": {
  "originalName": "Mary Parent",
  "birthDate": "1968",
  "countries": [
   "США"
  ]
 },
 "Томас Тулл": {
  "originalName": "Thomas Tull",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/35/Thomas_Tull_SDCC_2014.jpg/250px-Thomas_Tull_SDCC_2014.jpg",
  "birthDate": "1970-06-11",
  "countries": [
   "США"
  ]
 },
 "Дэнни Де Вито": {
  "originalName": "Danny DeVito",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/8/88/Danny_DeVito_cropped_and_edited_for_brightness.jpg/250px-Danny_DeVito_cropped_and_edited_for_brightness.jpg",
  "birthDate": "1944-11-17",
  "countries": [
   "США"
  ],
  "birthplace": "Нептьюн Тауншип"
 },
 "Стейси Шер": {
  "originalName": "Stacey Sher",
  "birthDate": "1962-11-30",
  "countries": [
   "США"
  ],
  "birthplace": "Нью-Йорк"
 },
 "Гэйл Лион": {
  "originalName": "Gail Lyon",
  "countries": [
   "США"
  ]
 },
 "Мишель Гондри": {
  "originalName": "Michel Gondry",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/4/48/Michel_Gondry_Deauville_2012.jpg/250px-Michel_Gondry_Deauville_2012.jpg",
  "birthDate": "1963-05-08",
  "countries": [
   "Франция"
  ],
  "birthplace": "Версаль"
 },
 "Стив Голин": {
  "originalName": "Steve Golin",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/35/Stevegolin2015.png/250px-Stevegolin2015.png",
  "birthDate": "1955-03-06",
  "deathYear": "2019",
  "countries": [
   "США"
  ],
  "birthplace": "Дженива"
 },
 "Энтони Брегман": {
  "originalName": "Anthony Bregman"
 },
 "Алекс Гарленд": {
  "originalName": "Alex Garland",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/4/45/2024-03-14_Alex_Garland_SXSW_Civil-War_3_%28cropped%29.jpg/250px-2024-03-14_Alex_Garland_SXSW_Civil-War_3_%28cropped%29.jpg",
  "birthDate": "1970-05-26",
  "countries": [
   "Великобритания"
  ],
  "birthplace": "Лондон"
 },
 "Эндрю Макдональд": {
  "originalName": "Andrew Macdonald",
  "birthDate": "1966",
  "countries": [
   "Великобритания"
  ],
  "birthplace": "Глазго"
 },
 "Данкан Джонс": {
  "originalName": "Duncan Jones",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/4/40/Duncan_Jones_by_Gage_Skidmore_3.jpg/250px-Duncan_Jones_by_Gage_Skidmore_3.jpg",
  "birthDate": "1971-05-30",
  "countries": [
   "Великобритания"
  ]
 },
 "Труди Стайлер": {
  "originalName": "Trudie Styler",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/2/24/Cast_of_Up_Against_It_at_TIFF_2026_%28cropped_Trudie_Styler%29.jpg/250px-Cast_of_Up_Against_It_at_TIFF_2026_%28cropped_Trudie_Styler%29.jpg",
  "birthDate": "1954-01-06",
  "countries": [
   "Великобритания"
  ],
  "birthplace": "Бромсгроув"
 },
 "Нил Бломкамп": {
  "originalName": "Neill Blomkamp",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/ad/NeillBlomkampCCJuly09.jpg/250px-NeillBlomkampCCJuly09.jpg",
  "birthDate": "1979-09-17",
  "countries": [
   "ЮАР",
   "Канада"
  ],
  "birthplace": "Йоханнесбург"
 },
 "Боб Гейл": {
  "originalName": "Bob Gale",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/c/cd/BobGale2024.jpg/250px-BobGale2024.jpg",
  "birthDate": "1951-05-25",
  "countries": [
   "США"
  ],
  "birthplace": "Юниверсити-Сити"
 },
 "Нил Кэнтон": {
  "originalName": "Neil Canton",
  "birthDate": "1948-05-30",
  "countries": [
   "США"
  ],
  "birthplace": "Нью-Йорк"
 },
 "Джеймс Кэмерон": {
  "originalName": "James Cameron",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/4/4f/James_Cameron_at_53rd_Saturn_Awards_2026-01_%28cropped%29.jpg/250px-James_Cameron_at_53rd_Saturn_Awards_2026-01_%28cropped%29.jpg",
  "birthDate": "1954-08-16",
  "countries": [
   "Новая Зеландия",
   "Канада"
  ],
  "birthplace": "Капускейсинг"
 },
 "Гейл Энн Хёрд": {
  "originalName": "Gale Anne Hurd",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/9/90/Gale_Anne_Hurd_at_53rd_Saturn_Awards_2026.jpg/250px-Gale_Anne_Hurd_at_53rd_Saturn_Awards_2026.jpg",
  "birthDate": "1955-10-25",
  "countries": [
   "США"
  ],
  "birthplace": "Лос-Анджелес"
 },
 "Марио Кассар": {
  "originalName": "Mario Kassar",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/2/20/Basic_Instinct_Cannes_1992.jpg/250px-Basic_Instinct_Cannes_1992.jpg",
  "birthDate": "1951-10-10",
  "countries": [
   "Ливан"
  ],
  "birthplace": "Бейрут"
 },
 "Джон Мактирнан": {
  "originalName": "John McTiernan",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b2/John_McTiernan_Deauville_2014_3.jpg/250px-John_McTiernan_Deauville_2014_3.jpg",
  "birthDate": "1951-01-08",
  "countries": [
   "США"
  ],
  "birthplace": "Олбани"
 },
 "Лоуренс Гордон": {
  "originalName": "Lawrence Gordon",
  "birthDate": "1936-03-25",
  "countries": [
   "США"
  ],
  "birthplace": "Язу-Сити"
 },
 "Джон Дэвис": {
  "originalName": "John Davis",
  "birthDate": "1954",
  "countries": [
   "США"
  ],
  "birthplace": "Денвер"
 },
 "Джордж Лукас": {
  "originalName": "George Lucas",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b2/George_Lucas_2024.jpg/250px-George_Lucas_2024.jpg",
  "birthDate": "1944-05-14",
  "countries": [
   "США"
  ],
  "birthplace": "Модесто"
 },
 "Рик Маккаллум": {
  "originalName": "Rick McCallum",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/e/ed/Rick_McCallum.jpg/250px-Rick_McCallum.jpg",
  "birthDate": "1954-08-22",
  "countries": [
   "США"
  ],
  "birthplace": "Гейдельберг"
 },
 "Гэри Курц": {
  "originalName": "Gary Kurtz",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/3c/GaryKurtz2012.jpg/250px-GaryKurtz2012.jpg",
  "birthDate": "1940-07-27",
  "deathYear": "2018",
  "countries": [
   "США"
  ],
  "birthplace": "Лос-Анджелес"
 },
 "Ирвин Кершнер": {
  "originalName": "Irvin Kershner",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/5/5c/Irvin_Kershner_%282004%29.jpg/250px-Irvin_Kershner_%282004%29.jpg",
  "birthDate": "1923-04-29",
  "deathYear": "2010",
  "countries": [
   "США"
  ],
  "birthplace": "Филадельфия"
 },
 "Ричард Маркуанд": {
  "originalName": "Richard Marquand",
  "birthDate": "1937-09-22",
  "deathYear": "1987",
  "countries": [
   "Великобритания"
  ]
 },
 "Ховард Казанджян": {
  "originalName": "Howard Kazanjian",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/78/Howard_kazanjian_2019.jpg/250px-Howard_kazanjian_2019.jpg",
  "birthDate": "1942",
  "countries": [
   "США"
  ],
  "birthplace": "Лос-Анджелес"
 },
 "Фрэнк Маршалл": {
  "originalName": "Frank Marshall",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f4/Frank_Marshall_Deauville_2012.jpg/250px-Frank_Marshall_Deauville_2012.jpg",
  "birthDate": "1946-09-13",
  "countries": [
   "США"
  ],
  "birthplace": "Глендейл"
 },
 "Роберт Уоттс": {
  "originalName": "Robert Watts",
  "birthDate": "1938-05-23",
  "deathYear": "2024",
  "countries": [
   "Великобритания"
  ],
  "birthplace": "Лондон"
 },
 "Кэтлин Кеннеди": {
  "originalName": "Kathleen Kennedy",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/6/6f/Kathleen_Kennedy_by_Gage_Skidmore_%28cropped%29.jpg/250px-Kathleen_Kennedy_by_Gage_Skidmore_%28cropped%29.jpg",
  "birthDate": "1953",
  "countries": [
   "США"
  ],
  "birthplace": "Беркли"
 },
 "Джералд Молен": {
  "originalName": "Gerald R. Molen",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/6/6e/Gerald_R._Molen_by_Gage_Skidmore.jpg/250px-Gerald_R._Molen_by_Gage_Skidmore.jpg",
  "birthDate": "1935-01-06",
  "countries": [
   "США"
  ],
  "birthplace": "Грейт-Фолс"
 },
 "Джон Ландау": {
  "originalName": "Jon Landau",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/2/26/Avatar-_The_Way_of_Water_Tokyo_Press_Conference-_Jon_Landau_%28cropped%29.jpg/250px-Avatar-_The_Way_of_Water_Tokyo_Press_Conference-_Jon_Landau_%28cropped%29.jpg",
  "birthDate": "1960-07-23",
  "deathYear": "2024",
  "countries": [
   "США"
  ],
  "birthplace": "Нью-Йорк"
 },
 "Джордж Миллер": {
  "originalName": "George Miller",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/13/George_Miller_%2835706244922%29.jpg/250px-George_Miller_%2835706244922%29.jpg",
  "birthDate": "1945-03-03",
  "countries": [
   "Австралия"
  ]
 },
 "Иэн Смит": {
  "originalName": "Iain Smith",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/8/83/IainSmithwolrdintellectualproperty.png/250px-IainSmithwolrdintellectualproperty.png",
  "birthDate": "1949",
  "countries": [
   "Великобритания"
  ],
  "birthplace": "Глазго"
 },
 "Брюс Берман": {
  "originalName": "Bruce Berman",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f1/Bruce_Berman_2011.jpg/250px-Bruce_Berman_2011.jpg",
  "birthDate": "1952-04-25",
  "countries": [
   "США"
  ],
  "birthplace": "Нью-Йорк"
 },
 "Кристофер ДеФариа": {
  "originalName": "Christopher DeFaria",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/2/20/Chris_DeFaria.jpg/250px-Chris_DeFaria.jpg",
  "birthDate": "1959-05-20",
  "countries": [
   "США"
  ],
  "birthplace": "Аламида"
 },
 "Даг Митчелл": {
  "originalName": "Doug Mitchell",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/fa/Doug_Mitchell_2015.jpg/250px-Doug_Mitchell_2015.jpg",
  "birthDate": "1952-09-19",
  "countries": [
   "Великобритания"
  ]
 },
 "Бранко Лустиг": {
  "originalName": "Branko Lustig",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/6/6e/Branko_Lustig_%282009%29-1.jpg/250px-Branko_Lustig_%282009%29-1.jpg",
  "birthDate": "1932-06-10",
  "deathYear": "2019",
  "countries": [
   "Хорватия",
   "США"
  ],
  "birthplace": "Осиек"
 },
 "Дэвид Францони": {
  "originalName": "David Franzoni",
  "birthDate": "1947-03-04",
  "countries": [
   "США"
  ],
  "birthplace": "Вермонт"
 },
 "Дуглас Уик": {
  "originalName": "Douglas Wick",
  "birthDate": "1954",
  "countries": [
   "США"
  ]
 },
 "Терри Нидэм": {
  "originalName": "Terry Needham"
 },
 "Мел Гибсон": {
  "originalName": "Mel Gibson",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/9/95/Mel_Gibson_Cannes_2016_2.jpg/250px-Mel_Gibson_Cannes_2016_2.jpg",
  "birthDate": "1956-01-03",
  "countries": [
   "Ирландия",
   "США"
  ],
  "birthplace": "Пикскилл"
 },
 "Алан Лэдд": {
  "originalName": "Alan Ladd Jr.",
  "birthDate": "1937-10-22",
  "deathYear": "2022",
  "countries": [
   "США"
  ],
  "birthplace": "Лос-Анджелес"
 },
 "Брюс Дейви": {
  "originalName": "Bruce Davey",
  "birthDate": "1950",
  "countries": [
   "Австралия"
  ],
  "birthplace": "Сидней"
 },
 "Стефен Макэвити": {
  "originalName": "Stephen McEveety",
  "birthDate": "1954-11-04",
  "countries": [
   "США"
  ],
  "birthplace": "Лос-Анджелес"
 },
 "Вольфганг Петерсен": {
  "originalName": "Wolfgang Petersen",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/d/de/Wolfgang_Petersen_-_Poseidon_Premiere_%28cropped%29.jpg/250px-Wolfgang_Petersen_-_Poseidon_Premiere_%28cropped%29.jpg",
  "birthDate": "1941-03-14",
  "deathYear": "2022",
  "countries": [
   "Германия"
  ],
  "birthplace": "Эмден"
 },
 "Колин Уилсон": {
  "originalName": "Colin Wilson",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c1/Colin_Wilson.jpg/250px-Colin_Wilson.jpg",
  "birthDate": "1931-06-26",
  "deathYear": "2013",
  "countries": [
   "Великобритания"
  ],
  "birthplace": "Лестер"
 },
 "Эдвард Цвик": {
  "originalName": "Edward Zwick",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f5/Edward_Zwick_2016.jpg/250px-Edward_Zwick_2016.jpg",
  "birthDate": "1952-10-08",
  "countries": [
   "США"
  ],
  "birthplace": "Чикаго"
 },
 "Том Круз": {
  "originalName": "Tom Cruise",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/2/23/Tom_Cruise_at_53rd_Saturn_Awards_2026-01.jpg/250px-Tom_Cruise_at_53rd_Saturn_Awards_2026-01.jpg",
  "birthDate": "1962-07-03",
  "countries": [
   "США"
  ],
  "birthplace": "Сиракьюс"
 },
 "Пола Вагнер": {
  "originalName": "Paula Wagner",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/6/6e/Paula_Wagner.jpg/250px-Paula_Wagner.jpg",
  "birthDate": "1946-12-12",
  "countries": [
   "США"
  ],
  "birthplace": "Янгстаун"
 },
 "Маршалл Херсковиц": {
  "originalName": "Marshall Herskovitz",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/2/2b/MarshallHerskovitz.jpg/250px-MarshallHerskovitz.jpg",
  "birthDate": "1952-02-23",
  "countries": [
   "США"
  ],
  "birthplace": "Филадельфия"
 },
 "Йен Брайс": {
  "originalName": "Ian Bryce",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/9/99/Ian_Bryce_scouts_flight_deck_of_USS_John_C._Stennis_%28CVN_74%29_for_Transformers_-_Revenge_of_the_Fallen_2008-09-27.jpg/250px-Ian_Bryce_scouts_flight_deck_of_USS_John_C._Stennis_%28CVN_74%29_for_Transformers_-_Revenge_of_the_Fallen_2008-09-27.jpg",
  "birthDate": "1956",
  "countries": [
   "Великобритания"
  ],
  "birthplace": "Тотнес"
 },
 "Гари Левинсон": {
  "originalName": "Gary Levinsohn",
  "birthDate": "1959",
  "countries": [
   "ЮАР"
  ]
 },
 "Марк Гордон": {
  "originalName": "Mark Gordon",
  "birthDate": "1956-10-10",
  "countries": [
   "США"
  ],
  "birthplace": "Ньюпорт-Ньюс"
 },
 "Сэм Мендес": {
  "originalName": "Sam Mendes",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/4/4f/Sam_Mendes_in_2022_%28cropped%29.jpg/250px-Sam_Mendes_in_2022_%28cropped%29.jpg",
  "birthDate": "1965-08-01",
  "countries": [
   "Великобритания"
  ],
  "birthplace": "Рединг"
 },
 "Пиппа Харрис": {
  "originalName": "Pippa Harris",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/8/85/EmpireOfLightBFI121022_%2832_of_33%29_%2852448235600%29_%28cropped%29.jpg/250px-EmpireOfLightBFI121022_%2832_of_33%29_%2852448235600%29_%28cropped%29.jpg",
  "birthDate": "1967-03-27",
  "countries": [
   "Великобритания"
  ],
  "birthplace": "Лондон"
 },
 "Каллум МакДаголл": {
  "originalName": "Callum McDougall"
 },
 "Джейн-Энн Тенггрен": {
  "originalName": "Jayne-Ann Tenggren",
  "birthDate": "1967"
 },
 "Роман Полански": {
  "originalName": "Roman Polanski",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/6/67/Roman_Polanski_Cannes_2013.jpg/250px-Roman_Polanski_Cannes_2013.jpg",
  "birthDate": "1933-08-18",
  "countries": [
   "Франция",
   "Польша"
  ],
  "birthplace": "Париж"
 },
 "Ален Сард": {
  "originalName": "Alain Sarde",
  "birthDate": "1952-03-28",
  "countries": [
   "Франция"
  ],
  "birthplace": "Булонь-Бийанкур"
 },
 "Робер Бенмусса": {
  "originalName": "Robert Benmussa",
  "birthDate": "1953",
  "countries": [
   "Франция"
  ]
 },
 "Роберто Бениньи": {
  "originalName": "Roberto Benigni",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e4/Roberto_Benigni-5274.jpg/250px-Roberto_Benigni-5274.jpg",
  "birthDate": "1952-10-27",
  "countries": [
   "Италия"
  ],
  "birthplace": "Кастильон-Фьорентино"
 },
 "Эльда Ферри": {
  "originalName": "Elda Ferri",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/2/22/Eldaferri.jpg/250px-Eldaferri.jpg",
  "birthDate": "1937-11-12",
  "countries": [
   "Италия"
  ],
  "birthplace": "Болонья"
 },
 "Джанлуиджи Браски": {
  "originalName": "Gianluigi Braschi",
  "birthDate": "1963-07-02",
  "deathYear": "2008",
  "countries": [
   "Италия"
  ],
  "birthplace": "Чезена"
 },
 "Марк Херман": {
  "originalName": "Mark Herman",
  "birthDate": "1954",
  "countries": [
   "Великобритания"
  ],
  "birthplace": "Бридлингтон"
 },
 "Майкл Кёртис": {
  "originalName": "Michael Curtiz",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/9/9e/Curtiz_1928_portrait_%28cropped%29.jpg/250px-Curtiz_1928_portrait_%28cropped%29.jpg",
  "birthDate": "1886-12-25",
  "deathYear": "1962",
  "countries": [
   "Венгрия",
   "США"
  ],
  "birthplace": "Будапешт"
 },
 "Хэл Уоллис": {
  "originalName": "Hal B. Wallis",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/4/40/Hal_B._Wallis_-_Universal_Pictures%2C_c._1971.jpg/250px-Hal_B._Wallis_-_Universal_Pictures%2C_c._1971.jpg",
  "birthDate": "1899-09-14",
  "deathYear": "1986",
  "countries": [
   "США"
  ],
  "birthplace": "Чикаго"
 },
 "Джордж Кьюкор": {
  "originalName": "George Cukor",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/2/2b/George_Cukor_Allan_Warren.jpg/250px-George_Cukor_Allan_Warren.jpg",
  "birthDate": "1899-07-07",
  "deathYear": "1983",
  "countries": [
   "США"
  ],
  "birthplace": "Нью-Йорк"
 },
 "Виктор Флеминг": {
  "originalName": "Victor Fleming",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f3/Victor_Fleming_%281927_headshot%29.jpg/250px-Victor_Fleming_%281927_headshot%29.jpg",
  "birthDate": "1889-02-23",
  "deathYear": "1949",
  "countries": [
   "США"
  ],
  "birthplace": "Пасадина"
 },
 "Сэм Вуд": {
  "originalName": "Sam Wood",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/0f/Sam_Wood.croop.jpg/250px-Sam_Wood.croop.jpg",
  "birthDate": "1883-07-10",
  "deathYear": "1949",
  "countries": [
   "США"
  ],
  "birthplace": "Филадельфия"
 },
 "Дэвид О. Селзник": {
  "originalName": "David O. Selznick",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c4/DavidSelznick.jpg/250px-DavidSelznick.jpg",
  "birthDate": "1902-05-10",
  "deathYear": "1965",
  "countries": [
   "США"
  ],
  "birthplace": "Питтсбург"
 },
 "Уильям Уайлер": {
  "originalName": "William Wyler",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/c/cd/William_Wyler_portrait.jpg/250px-William_Wyler_portrait.jpg",
  "birthDate": "1902-07-01",
  "deathYear": "1981",
  "countries": [
   "Швейцария",
   "США"
  ],
  "birthplace": "Мюлуз"
 },
 "Билли Уайлдер": {
  "originalName": "Billy Wilder",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/6/6e/BW1989_crop.jpg/250px-BW1989_crop.jpg",
  "birthDate": "1906-06-22",
  "deathYear": "2002",
  "countries": [
   "Австрия",
   "США"
  ],
  "birthplace": "Суха-Бескидзка"
 },
 "Блэйк Эдвардс": {
  "originalName": "Blake Edwards",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/4/45/Blake_Edwards_1966.jpg/250px-Blake_Edwards_1966.jpg",
  "birthDate": "1922-06-26",
  "deathYear": "2010",
  "countries": [
   "США"
  ],
  "birthplace": "Талса"
 },
 "Ричард Шеперд": {
  "originalName": "Richard Shepherd",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f1/RichardShepherdMP.jpg/250px-RichardShepherdMP.jpg",
  "birthDate": "1942-12-06",
  "deathYear": "2022",
  "countries": [
   "Великобритания"
  ],
  "birthplace": "Абердин"
 },
 "Мартин Джуроу": {
  "originalName": "Martin Jurow",
  "birthDate": "1911-12-14",
  "deathYear": "2004",
  "countries": [
   "США"
  ],
  "birthplace": "Бруклин"
 },
 "Стэнли Донен": {
  "originalName": "Stanley Donen",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/07/Stanley_Donen.jpg/250px-Stanley_Donen.jpg",
  "birthDate": "1924-04-13",
  "deathYear": "2019",
  "countries": [
   "США"
  ],
  "birthplace": "Колумбия"
 },
 "Джин Келли": {
  "originalName": "Gene Kelly",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/4/40/Gene_kelly.jpg/250px-Gene_kelly.jpg",
  "birthDate": "1912-08-23",
  "deathYear": "1996",
  "countries": [
   "США"
  ],
  "birthplace": "Питтсбург"
 },
 "Артур Фрид": {
  "originalName": "Arthur Freed",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/6/67/Arthur_Freed_receiving_the_Screen_Producers_Guild%27s_Milestone_Award_%28cropped%29.jpg/250px-Arthur_Freed_receiving_the_Screen_Producers_Guild%27s_Milestone_Award_%28cropped%29.jpg",
  "birthDate": "1894-09-09",
  "deathYear": "1973",
  "countries": [
   "США"
  ],
  "birthplace": "Чарлстон"
 },
 "Гарольд Рамис": {
  "originalName": "Harold Ramis",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/4/40/HaroldRamisOct2009.jpg/250px-HaroldRamisOct2009.jpg",
  "birthDate": "1944-11-21",
  "deathYear": "2014",
  "countries": [
   "США"
  ],
  "birthplace": "Чикаго"
 },
 "Чак Рассел": {
  "originalName": "Chuck Russell",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/d/dd/Chuck_Russell%2C_26_July_2024.jpg/250px-Chuck_Russell%2C_26_July_2024.jpg",
  "birthDate": "1952-05-09",
  "deathYear": "2026",
  "countries": [
   "США"
  ],
  "birthplace": "Парк-Ридж"
 },
 "Роберт Энгельман": {
  "originalName": "Robert Engelman",
  "birthDate": "1958-03-15",
  "countries": [
   "США"
  ],
  "birthplace": "Элко"
 },
 "Том Шедьяк": {
  "originalName": "Tom Shadyac",
  "birthDate": "1958-12-11",
  "countries": [
   "США"
  ],
  "birthplace": "Фолс-Черч"
 },
 "Джеймс Джи Робинсон": {
  "originalName": "James G. Robinson",
  "birthDate": "1935-12-16",
  "deathYear": "2026",
  "countries": [
   "США"
  ],
  "birthplace": "Балтимор"
 },
 "Гэри Барбер": {
  "originalName": "Gary Barber",
  "birthDate": "1957-01-01",
  "countries": [
   "ЮАР",
   "США"
  ],
  "birthplace": "Йоханнесбург"
 },
 "Аарон Райдер": {
  "originalName": "Aaron Ryder",
  "birthDate": "1950",
  "countries": [
   "США"
  ],
  "birthplace": "Бостон"
 },
 "Нил Бёргер": {
  "originalName": "Neil Burger",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d3/Neil_Burger_%28cropped%29.jpg/250px-Neil_Burger_%28cropped%29.jpg",
  "birthDate": "1963",
  "countries": [
   "США"
  ],
  "birthplace": "Гринуич"
 },
 "Кэти Шульман": {
  "originalName": "Cathy Schulman",
  "birthDate": "1965",
  "countries": [
   "США"
  ]
 },
 "Боб Яри": {
  "originalName": "Bob Yari",
  "birthDate": "1961-05-30",
  "countries": [
   "США"
  ],
  "birthplace": "Иран"
 },
 "Брайан Коппельман": {
  "originalName": "Brian Koppelman",
  "birthDate": "1966-04-27",
  "countries": [
   "США"
  ]
 },
 "Дэвид Левиен": {
  "originalName": "David Levien",
  "birthDate": "1967-12-09",
  "countries": [
   "США"
  ],
  "birthplace": "Грейт-Нек"
 },
 "Майкл Лондон": {
  "originalName": "Michael London",
  "countries": [
   "США"
  ],
  "birthplace": "Нью-Хейвен"
 },
 "Дженнифер Тодд": {
  "originalName": "Jennifer Todd",
  "birthDate": "1969-10-03",
  "countries": [
   "США"
  ],
  "birthplace": "Лос-Анджелес"
 },
 "Сюзанн Тодд": {
  "originalName": "Suzanne Todd",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/00/Suzanne_Todd_Alice_Through_The_Looking_Glass.jpg/250px-Suzanne_Todd_Alice_Through_The_Looking_Glass.jpg",
  "birthDate": "1965-06-01",
  "countries": [
   "США"
  ],
  "birthplace": "Шерман-Окс"
 },
 "Арнольд Копельсон": {
  "originalName": "Arnold Kopelson",
  "birthDate": "1935-02-14",
  "deathYear": "2018",
  "countries": [
   "США"
  ],
  "birthplace": "Нью-Йорк"
 },
 "Джеймс Вандербилт": {
  "originalName": "James Vanderbilt",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/c/cf/2025_James_Vanderbilt_-_cropped.jpg/250px-2025_James_Vanderbilt_-_cropped.jpg",
  "birthDate": "1975-11-17",
  "countries": [
   "США"
  ],
  "birthplace": "Норуолк"
 },
 "Риз Уизерспун": {
  "originalName": "Reese Witherspoon",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/35/Reese_Witherspoon_at_Nashville_Film_Festival_2026.jpg/250px-Reese_Witherspoon_at_Nashville_Film_Festival_2026.jpg",
  "birthDate": "1976-03-22",
  "countries": [
   "США"
  ],
  "birthplace": "Новый Орлеан"
 },
 "Лесли Диксон": {
  "originalName": "Leslie Dixon",
  "birthDate": "1954",
  "countries": [
   "США"
  ]
 },
 "Арнон Милчен": {
  "originalName": "Arnon Milchan",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f7/Arnon_Milchan_%28990040376210205171%29.jpg/250px-Arnon_Milchan_%28990040376210205171%29.jpg",
  "birthDate": "1944-12-06",
  "countries": [
   "Израиль",
   "Монако"
  ],
  "birthplace": "Реховот"
 },
 "Бруна Папандреа": {
  "originalName": "Bruna Papandrea",
  "birthDate": "1971-07-26",
  "countries": [
   "Австралия"
  ],
  "birthplace": "Аделаида"
 },
 "Кира Дэвис": {
  "originalName": "Kira Davis",
  "countries": [
   "США"
  ]
 },
 "Кеннет Брана": {
  "originalName": "Kenneth Branagh",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/d/de/Kenneth_Branagh_portrait_at_TIFF_2026.jpg/250px-Kenneth_Branagh_portrait_at_TIFF_2026.jpg",
  "birthDate": "1960-12-10",
  "countries": [
   "Великобритания"
  ],
  "birthplace": "Белфаст"
 },
 "Саймон Кинберг": {
  "originalName": "Simon Kinberg",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/1f/Simon_Kinberg_Press_Conference_Logan_Berlinale_2017_%28cropped%29.jpg/250px-Simon_Kinberg_Press_Conference_Logan_Berlinale_2017_%28cropped%29.jpg",
  "birthDate": "1973-08-02",
  "countries": [
   "Великобритания",
   "США"
  ],
  "birthplace": "Лондон"
 },
 "Рэм Бергман": {
  "originalName": "Ram Bergman",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/2/23/Star_Wars-_The_Last_Jedi_Japan_Premiere_Red_Carpet-_Ram_Bergman%2C_Rian_Johnson_%26_Mark_Hamill_%2824076407357%29_%28cropped%29.jpg/250px-Star_Wars-_The_Last_Jedi_Japan_Premiere_Red_Carpet-_Ram_Bergman%2C_Rian_Johnson_%26_Mark_Hamill_%2824076407357%29_%28cropped%29.jpg",
  "birthDate": "1970",
  "countries": [
   "Израиль"
  ],
  "birthplace": "Ришон-ле-Цион"
 },
 "Меган Эллисон": {
  "originalName": "Megan Ellison",
  "birthDate": "1986-01-31",
  "countries": [
   "США"
  ],
  "birthplace": "Санта-Клара"
 },
 "Аллисон Аббате": {
  "originalName": "Allison Abbate",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/af/Allison_Abbate.jpg/250px-Allison_Abbate.jpg",
  "countries": [
   "США"
  ],
  "birthplace": "Бруклин"
 },
 "Генри Селик": {
  "originalName": "Henry Selick",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/73/Henry_Selick_2009_%28cropped%29.jpg/250px-Henry_Selick_2009_%28cropped%29.jpg",
  "birthDate": "1952-11-30",
  "countries": [
   "США"
  ],
  "birthplace": "Глен-Ридж"
 },
 "Билл Микэник": {
  "originalName": "Bill Mechanic",
  "birthDate": "1949-11-30",
  "countries": [
   "США"
  ],
  "birthplace": "Детройт"
 },
 "Тим Бёртон": {
  "originalName": "Tim Burton",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/9/95/Tim_Burton-63605.jpg/250px-Tim_Burton-63605.jpg",
  "birthDate": "1958-08-25",
  "countries": [
   "США"
  ],
  "birthplace": "Бербанк"
 },
 "Дэнни Эльфман": {
  "originalName": "Danny Elfman",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/4/40/20220610_dannyelfman_by_sachynmital_%28cropped%29.jpg/250px-20220610_dannyelfman_by_sachynmital_%28cropped%29.jpg",
  "birthDate": "1953-05-29",
  "countries": [
   "США"
  ],
  "birthplace": "Лос-Анджелес"
 },
 "Дениз Ди Нови": {
  "originalName": "Denise Di Novi",
  "birthDate": "1956-03-21",
  "countries": [
   "США"
  ],
  "birthplace": "Шерман-Окс"
 },
 "Майк Джонсон": {
  "originalName": "Mike Johnson",
  "countries": [
   "США"
  ],
  "birthplace": "Остин"
 },
 "Джо Рэнфт": {
  "originalName": "Joe Ranft",
  "birthDate": "1960-03-13",
  "deathYear": "2005",
  "countries": [
   "США"
  ],
  "birthplace": "Пасадина"
 },
 "Байрон Ховард": {
  "originalName": "Byron Howard",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/9/99/Byron_Howard.jpg/250px-Byron_Howard.jpg",
  "birthDate": "1968-12-26",
  "countries": [
   "США"
  ],
  "birthplace": "Мисава"
 },
 "Рич Мур": {
  "originalName": "Rich Moore",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/19/Rich_Moore.jpg/250px-Rich_Moore.jpg",
  "birthDate": "1963-05-10",
  "countries": [
   "США"
  ]
 },
 "Джаред Буш": {
  "originalName": "Jared Bush",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/fc/Jared_Bush.jpg/250px-Jared_Bush.jpg",
  "birthDate": "1974-06-12",
  "countries": [
   "США"
  ],
  "birthplace": "Гейтерсберг"
 },
 "Кларк Спенсер": {
  "originalName": "Clark Spencer",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a1/Clark_Spencer.jpg/250px-Clark_Spencer.jpg",
  "birthDate": "1963-04-06",
  "countries": [
   "США"
  ],
  "birthplace": "Сиэтл"
 },
 "Джон Маскер": {
  "originalName": "John Musker",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/2/20/John_Musker_01.jpg/250px-John_Musker_01.jpg",
  "birthDate": "1953-11-08",
  "countries": [
   "США"
  ],
  "birthplace": "Чикаго"
 },
 "Рон Клементс": {
  "originalName": "Ron Clements",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e2/Ron_Clements_2.jpg/250px-Ron_Clements_2.jpg",
  "birthDate": "1953-04-25",
  "countries": [
   "США"
  ],
  "birthplace": "Су-Сити"
 },
 "Крис Уильямс": {
  "originalName": "Chris Williams",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/8/85/Chris_Williams_2022.jpg/250px-Chris_Williams_2022.jpg",
  "birthDate": "1968-04-23",
  "countries": [
   "Канада"
  ],
  "birthplace": "Миссури"
 },
 "Дон Холл": {
  "originalName": "Don Hall",
  "birthDate": "1969",
  "countries": [
   "США"
  ],
  "birthplace": "Гленвуд"
 },
 "Оснат Шурер": {
  "originalName": "Osnat Shurer",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/ab/Osnat_Shurer.jpg/250px-Osnat_Shurer.jpg",
  "birthDate": "1958",
  "countries": [
   "Израиль"
  ],
  "birthplace": "Кфар-Сава"
 },
 "Крис Бак": {
  "originalName": "Chris Buck",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/14/Chris_Buck%2C_Frozen_premiere%2C_2013.jpg/250px-Chris_Buck%2C_Frozen_premiere%2C_2013.jpg",
  "birthDate": "1960-10-25",
  "countries": [
   "США"
  ],
  "birthplace": "Уичито"
 },
 "Дженнифер Ли": {
  "originalName": "Jennifer Lee",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f7/Jennifer_Lee_%28cropped%29.jpg/250px-Jennifer_Lee_%28cropped%29.jpg",
  "birthDate": "1971-10-22",
  "countries": [
   "США"
  ],
  "birthplace": "Ист-Провиденс"
 },
 "Питер Дель Вечо": {
  "originalName": "Peter Del Vecho",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e9/Frozen_premier_Peter_Del_Vecho.jpg/250px-Frozen_premier_Peter_Del_Vecho.jpg",
  "birthDate": "1966-04-18",
  "countries": [
   "США"
  ],
  "birthplace": "Бостон"
 },
 "Нэйтан Грено": {
  "originalName": "Nathan Greno",
  "birthDate": "1975-03-22",
  "countries": [
   "США"
  ],
  "birthplace": "Кеноша"
 },
 "Глен Кин": {
  "originalName": "Glen Keane",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/13/GlenKeane.JPG/250px-GlenKeane.JPG",
  "birthDate": "1954-04-13",
  "countries": [
   "США"
  ],
  "birthplace": "Филадельфия"
 },
 "Кирк Уайз": {
  "originalName": "Kirk Wise",
  "birthDate": "1963-08-24",
  "countries": [
   "США"
  ],
  "birthplace": "Сан-Франциско"
 },
 "Гари Труздейл": {
  "originalName": "Gary Trousdale",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d7/Gary_Trousdale.jpg/250px-Gary_Trousdale.jpg",
  "birthDate": "1960-06-08",
  "countries": [
   "США"
  ],
  "birthplace": "Лос-Анджелес"
 },
 "Дональд У. Эрнст": {
  "originalName": "Donald W. Ernst",
  "birthDate": "1934-01-25",
  "deathYear": "2023",
  "countries": [
   "США"
  ]
 },
 "Эми Пелл": {
  "originalName": "Amy Pell"
 },
 "Тони Бэнкрофт": {
  "originalName": "Tony Bancroft",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/8/82/Tony_Bancroft_at_Animation_Y%27all_2026-7_%28cropped%29.jpg/250px-Tony_Bancroft_at_Animation_Y%27all_2026-7_%28cropped%29.jpg",
  "birthDate": "1967-07-31",
  "countries": [
   "США"
  ],
  "birthplace": "Ориндж"
 },
 "Бэрри Кук": {
  "originalName": "Barry Cook",
  "birthDate": "1958-08-12",
  "countries": [
   "США"
  ],
  "birthplace": "Нашвилл"
 },
 "Пэм Коутс": {
  "originalName": "Pam Coats",
  "birthDate": "1957-07-06",
  "countries": [
   "США"
  ],
  "birthplace": "Юта"
 },
 "Марк Осборн": {
  "originalName": "Mark Osborne",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f4/Mark_Osborne_on_Dulce_Osuna.jpg/250px-Mark_Osborne_on_Dulce_Osuna.jpg",
  "birthDate": "1970-09-17",
  "countries": [
   "США"
  ],
  "birthplace": "Трентон"
 },
 "Джон Стивенсон": {
  "originalName": "John Stevenson",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/5/52/John_Stevenson_%28director%29_%28cropped%29.jpg/250px-John_Stevenson_%28director%29_%28cropped%29.jpg",
  "birthDate": "1958",
  "countries": [
   "Великобритания"
  ],
  "birthplace": "Лондон"
 },
 "Ханс Циммер": {
  "originalName": "Hans Zimmer",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/2/2b/Hans-Zimmer-profile.jpg/250px-Hans-Zimmer-profile.jpg",
  "birthDate": "1957-09-12",
  "countries": [
   "Германия",
   "США"
  ],
  "birthplace": "Франкфурт-на-Майне"
 },
 "Джон Пауэлл": {
  "originalName": "John Powell",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/ac/John_Powell_with_his_Score_%28cropped%2C_denoised%29.jpg/250px-John_Powell_with_his_Score_%28cropped%2C_denoised%29.jpg",
  "birthDate": "1963-09-18",
  "countries": [
   "Великобритания"
  ],
  "birthplace": "Лондон"
 },
 "Билл Дамашке": {
  "originalName": "Bill Damaschke",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/00/Bill_Damaschke%2C_Mill_Valley_Film_Festival%2C_Rise_of_the_Guardians.jpg/250px-Bill_Damaschke%2C_Mill_Valley_Film_Festival%2C_Rise_of_the_Guardians.jpg",
  "birthDate": "1963-11-20",
  "countries": [
   "США"
  ],
  "birthplace": "Чикаго"
 },
 "Джонатан Айбел": {
  "originalName": "Jonathan Aibel",
  "birthDate": "1969-08-06",
  "countries": [
   "США"
  ]
 },
 "Гленн Бергер": {
  "originalName": "Glenn Berger",
  "birthDate": "1969",
  "countries": [
   "США"
  ],
  "birthplace": "Смиттаун"
 },
 "Крис Сандерс": {
  "originalName": "Chris Sanders",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d2/Chris_Sanders_2012.jpg/250px-Chris_Sanders_2012.jpg",
  "birthDate": "1962-03-12",
  "countries": [
   "США"
  ],
  "birthplace": "Колорадо-Спрингс"
 },
 "Дин Деблуа": {
  "originalName": "Dean DeBlois",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/d/db/Dean_DeBlois%2C_2014_WonderCon-3.jpg/250px-Dean_DeBlois%2C_2014_WonderCon-3.jpg",
  "birthDate": "1970-06-07",
  "countries": [
   "Канада"
  ],
  "birthplace": "Эйлмер"
 },
 "Том МакГрат": {
  "originalName": "Tom McGrath",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a4/Tom_McGrath_by_Gage_Skidmore_2.jpg/250px-Tom_McGrath_by_Gage_Skidmore_2.jpg",
  "birthDate": "1964-08-07",
  "countries": [
   "США"
  ],
  "birthplace": "Линвуд"
 },
 "Эрик Дарнелл": {
  "originalName": "Eric Darnell",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/fe/Eric_Darnell.png/250px-Eric_Darnell.png",
  "birthDate": "1960",
  "countries": [
   "США"
  ]
 },
 "Мирей Сория": {
  "originalName": "Mireille Soria",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/16/Mireille_Soria_by_Gage_Skidmore.jpg/250px-Mireille_Soria_by_Gage_Skidmore.jpg",
  "birthDate": "1970-04-22",
  "countries": [
   "США"
  ],
  "birthplace": "Лас-Вегас"
 },
 "Крис Уэдж": {
  "originalName": "Chris Wedge",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/71/Chris_Wedge_2014.jpg/250px-Chris_Wedge_2014.jpg",
  "birthDate": "1957-03-20",
  "countries": [
   "США"
  ],
  "birthplace": "Бингемтон"
 },
 "Карлус Салданья": {
  "originalName": "Carlos Saldanha",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/8/82/Carlos_Saldanha.jpg/250px-Carlos_Saldanha.jpg",
  "birthDate": "1965-01-24",
  "countries": [
   "Бразилия"
  ],
  "birthplace": "Рио-де-Жанейро"
 },
 "Катрин Уиндер": {
  "originalName": "Catherine Winder",
  "countries": [
   "США"
  ],
  "birthplace": "Торонто"
 },
 "Лори Форте": {
  "originalName": "Lori Forte",
  "countries": [
   "США"
  ]
 },
 "Graham Walters": {
  "birthDate": "1976-07-09",
  "countries": [
   "Франция",
   "США"
  ],
  "birthplace": "Париж"
 },
 "Кэтрин Сарафян": {
  "originalName": "Katherine Sarafian",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/31/Katherine_Sarafian_4342.JPG/250px-Katherine_Sarafian_4342.JPG",
  "birthDate": "1970",
  "countries": [
   "США"
  ],
  "birthplace": "Сан-Леандро"
 },
 "Джонни Уокер": {
  "originalName": "John Walker",
  "birthDate": "1956-04-21",
  "countries": [
   "США"
  ],
  "birthplace": "Элджин"
 },
 "Кори Рэй": {
  "originalName": "Kori Rae",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f8/Kori_Rae.jpg/250px-Kori_Rae.jpg",
  "birthDate": "1977-06-10",
  "countries": [
   "США"
  ],
  "birthplace": "Сан-Франциско"
 },
 "Дэвид Силверман": {
  "originalName": "David Silverman",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/c/ce/David_Silverman_in_2007-cropped.JPG/250px-David_Silverman_in_2007-cropped.JPG",
  "birthDate": "1957-03-15",
  "countries": [
   "США"
  ],
  "birthplace": "Нью-Йорк"
 },
 "Дана Мюрей": {
  "originalName": "Dana Murray",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7d/Dana_Murray.jpg/250px-Dana_Murray.jpg",
  "birthDate": "1950",
  "countries": [
   "США"
  ],
  "birthplace": "Пласервилл"
 },
 "Боб Питерсон": {
  "originalName": "Bob Peterson",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/10/Bob_Peterson.jpg/250px-Bob_Peterson.jpg",
  "birthDate": "1961-01-18",
  "countries": [
   "США"
  ],
  "birthplace": "Вустер"
 },
 "Кристина Рид": {
  "originalName": "Kristina Reed",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/9/94/Kristina_Reed.jpg/250px-Kristina_Reed.jpg",
  "countries": [
   "США"
  ]
 },
 "Рой Конли": {
  "originalName": "Roy Conli",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/e/ec/Roy_Conli.jpg/250px-Roy_Conli.jpg",
  "birthDate": "1971",
  "countries": [
   "США"
  ],
  "birthplace": "Лонг-Бич"
 },
 "Исао Такахата": {
  "originalName": "Isao Takahata",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b6/Isao_Takahata.jpg/250px-Isao_Takahata.jpg",
  "birthDate": "1935-10-29",
  "deathYear": "2018",
  "countries": [
   "Япония"
  ],
  "birthplace": "Исэ"
 },
 "Макото Синкай": {
  "originalName": "Makoto Shinkai",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/4/4e/Makoto_Shinkai%2C_2023.jpg/250px-Makoto_Shinkai%2C_2023.jpg",
  "birthDate": "1973-02-09",
  "countries": [
   "Япония"
  ],
  "birthplace": "Коуми"
 },
 "Гэнки Кавамура": {
  "originalName": "Genki Kawamura",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/ad/Genki_Kawamura_at_2025_Cannes_Red_Carpet_1.jpg/250px-Genki_Kawamura_at_2025_Cannes_Red_Carpet_1.jpg",
  "birthDate": "1979",
  "countries": [
   "Япония"
  ],
  "birthplace": "Иокогама"
 },
 "Kōichirō Itō": {
  "countries": [
   "Япония"
  ]
 },
 "Кацухиро Такеи": {
  "originalName": "Katsuhiro Takei",
  "birthDate": "1984-07-09",
  "countries": [
   "Япония"
  ],
  "birthplace": "Токио"
 },
 "Наоко Ямада": {
  "originalName": "Naoko Yamada",
  "birthDate": "1984-11-28",
  "countries": [
   "Япония"
  ],
  "birthplace": "Киото"
 },
 "Кацухиро Отомо": {
  "originalName": "Katsuhiro Otomo",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/2/2d/FIBD2016OtomoHermann_%28cropped%29.jpg/250px-FIBD2016OtomoHermann_%28cropped%29.jpg",
  "birthDate": "1954-04-14",
  "countries": [
   "Япония"
  ],
  "birthplace": "Томе"
 },
 "Сюндзо Като": {
  "originalName": "Shunzō Katō",
  "birthDate": "1946-11-09",
  "countries": [
   "Япония"
  ]
 },
 "Мамору Осии": {
  "originalName": "Mamoru Oshii",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/b/bc/Mamoru_Oshii_-_Lucca_Comics_%26_Games_2015.JPG/250px-Mamoru_Oshii_-_Lucca_Comics_%26_Games_2015.JPG",
  "birthDate": "1951-08-08",
  "countries": [
   "Япония"
  ],
  "birthplace": "Ота"
 },
 "Мицухиса Исикава": {
  "originalName": "Mitsuhisa Ishikawa",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/ac/Mitsuhisa_Ishikawa_at_Production_I.G_headquarters_20101016.jpg/250px-Mitsuhisa_Ishikawa_at_Production_I.G_headquarters_20101016.jpg",
  "birthDate": "1958-10-30",
  "countries": [
   "Япония"
  ],
  "birthplace": "Хатиодзи"
 },
 "Сатоси Кон": {
  "originalName": "Satoshi Kon",
  "birthDate": "1963-10-12",
  "deathYear": "2010",
  "countries": [
   "Япония"
  ],
  "birthplace": "Кусиро"
 },
 "Дзюнго Марута": {
  "originalName": "Jungo Maruta",
  "birthDate": "1963-01-22",
  "countries": [
   "Япония"
  ]
 },
 "Масао Маруяма": {
  "originalName": "Masao Maruyama",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/9/94/Masao_Maruyama.jpg/250px-Masao_Maruyama.jpg",
  "birthDate": "1941-06-19",
  "countries": [
   "Япония"
  ],
  "birthplace": "Сиогама"
 },
 "Хироаки Иноэ": {
  "originalName": "Hiroaki Inoue",
  "birthDate": "1958",
  "countries": [
   "Япония"
  ],
  "birthplace": "Токио"
 },
 "Питер Фаррелли": {
  "originalName": "Peter Farrelly",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/2/29/Peter_Farrelly_at_TIFF_2026_02_%28cropped%29.jpg/250px-Peter_Farrelly_at_TIFF_2026_02_%28cropped%29.jpg",
  "birthDate": "1956-12-17",
  "countries": [
   "США"
  ],
  "birthplace": "Финиксвилл"
 },
 "Джим Бёрк": {
  "originalName": "Jim Burke",
  "birthDate": "1957-12-11",
  "countries": [
   "США"
  ],
  "birthplace": "Миннеаполис"
 },
 "Чарльз Б. Уэсслер": {
  "originalName": "Charles B. Wessler",
  "birthDate": "1955-05-16",
  "countries": [
   "США"
  ],
  "birthplace": "Лос-Анджелес"
 },
 "Ник Валлелонга": {
  "originalName": "Nick Vallelonga",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/73/Nick_Vallelonga_%282026%29_%28cropped%29.jpg/250px-Nick_Vallelonga_%282026%29_%28cropped%29.jpg",
  "birthDate": "1959-09-13",
  "countries": [
   "США"
  ],
  "birthplace": "Нью-Йорк"
 },
 "Брайан Хэйс Керри": {
  "originalName": "Brian Currie",
  "birthDate": "1961",
  "countries": [
   "США"
  ]
 },
 "Тед Мелфи": {
  "originalName": "Theodore Melfi",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c3/Theodore_Melfi_%28cropped%29.jpg/250px-Theodore_Melfi_%28cropped%29.jpg",
  "birthDate": "1970-10-27",
  "countries": [
   "США"
  ],
  "birthplace": "Бруклин"
 },
 "Фаррелл Уильямс": {
  "originalName": "Pharrell Williams",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/4/4f/Pharrell_Williams_2024_%2854133384149%29.jpg/250px-Pharrell_Williams_2024_%2854133384149%29.jpg",
  "birthDate": "1973-04-05",
  "countries": [
   "США"
  ],
  "birthplace": "Верджиния-Бич"
 },
 "Донна Джильотти": {
  "originalName": "Donna Gigliotti",
  "birthDate": "1955",
  "countries": [
   "США"
  ]
 },
 "Питер Чернин": {
  "originalName": "Peter Chernin",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f7/Peter_Chernin_-_World_Economic_Forum_Annual_Meeting_Davos_2009.jpg/250px-Peter_Chernin_-_World_Economic_Forum_Annual_Meeting_Davos_2009.jpg",
  "birthDate": "1951",
  "countries": [
   "США"
  ],
  "birthplace": "Харрисон"
 },
 "Рон Ховард": {
  "originalName": "Ron Howard",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/2/2e/Ron_Howard_at_the_2024_Toronto_International_Film_Festival_05_%28cropped%29.jpg/250px-Ron_Howard_at_the_2024_Toronto_International_Film_Festival_05_%28cropped%29.jpg",
  "birthDate": "1954-03-01",
  "countries": [
   "США"
  ],
  "birthplace": "Дункан"
 },
 "Брайан Грейзер": {
  "originalName": "Brian Grazer",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/9/92/Brian_Grazer_2011_Shankbone.JPG/250px-Brian_Grazer_2011_Shankbone.JPG",
  "birthDate": "1951-07-12",
  "countries": [
   "США"
  ],
  "birthplace": "Лос-Анджелес"
 },
 "Джеймс Марш": {
  "originalName": "James Marsh",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/6/68/James_Marsh_seminar_%283890686677%29.jpg/250px-James_Marsh_seminar_%283890686677%29.jpg",
  "birthDate": "1963-04-30",
  "countries": [
   "Великобритания"
  ],
  "birthplace": "Труро"
 },
 "Энтони МакКартен": {
  "originalName": "Anthony McCarten",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/6/64/Anthony_McCarten_2012.jpg/250px-Anthony_McCarten_2012.jpg",
  "birthDate": "1961-04-28",
  "countries": [
   "Новая Зеландия"
  ],
  "birthplace": "Нью-Плимут"
 },
 "Эрик Феллнер": {
  "originalName": "Eric Fellner",
  "birthDate": "1959-10-10",
  "countries": [
   "Великобритания"
  ],
  "birthplace": "Лондон"
 },
 "Тим Беван": {
  "originalName": "Tim Bevan",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f5/Tim_Bevan_%28cropped%29.jpg/250px-Tim_Bevan_%28cropped%29.jpg",
  "birthDate": "1957",
  "countries": [
   "Новая Зеландия"
  ],
  "birthplace": "Куинстаун"
 },
 "Лиза Брюс": {
  "originalName": "Lisa Bruce",
  "countries": [
   "США"
  ],
  "birthplace": "Монтерей"
 },
 "Кевин Спейси": {
  "originalName": "Kevin Spacey",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/e/ec/Kevin_Spacey-9243_%28cropped%29.jpg/250px-Kevin_Spacey-9243_%28cropped%29.jpg",
  "birthDate": "1959-07-26",
  "countries": [
   "США"
  ],
  "birthplace": "Саут-Ориндж"
 },
 "Майкл Де Лука": {
  "originalName": "Michael De Luca",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b6/Michael_De_Luca_2012.jpg/250px-Michael_De_Luca_2012.jpg",
  "birthDate": "1965-08-13",
  "countries": [
   "США"
  ],
  "birthplace": "Бруклин"
 },
 "Дэна Брунетти": {
  "originalName": "Dana Brunetti",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/2/29/Dana.png/250px-Dana.png",
  "birthDate": "1973-06-11",
  "countries": [
   "США"
  ],
  "birthplace": "Виргиния"
 },
 "Джон Ли Хэнкок": {
  "originalName": "John Lee Hancock",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/30/John_Hancock_and_Dog_%28cropped%29.jpg/250px-John_Hancock_and_Dog_%28cropped%29.jpg",
  "birthDate": "1956-12-15",
  "countries": [
   "США"
  ],
  "birthplace": "Лонгвью"
 },
 "Адам Маккей": {
  "originalName": "Adam McKay",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/ae/Adam_McKay-7784_%28cropped%29.jpg/250px-Adam_McKay-7784_%28cropped%29.jpg",
  "birthDate": "1968-04-17",
  "countries": [
   "США"
  ],
  "birthplace": "Филадельфия"
 },
 "Брэд Питт": {
  "originalName": "Brad Pitt",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/9/90/Brad_Pitt-69858.jpg/250px-Brad_Pitt-69858.jpg",
  "birthDate": "1963-12-18",
  "countries": [
   "США"
  ],
  "birthplace": "Шони"
 },
 "Деде Гарднер": {
  "originalName": "Dede Gardner",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/0b/Dede_Gardner_%282017%29.jpg/250px-Dede_Gardner_%282017%29.jpg",
  "birthDate": "1967",
  "countries": [
   "США"
  ],
  "birthplace": "Уиннетка"
 },
 "Джереми Клейнер": {
  "originalName": "Jeremy Kleiner",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a4/Jeremy_Kleiner_%282017%29.jpg/250px-Jeremy_Kleiner_%282017%29.jpg",
  "birthDate": "1976",
  "countries": [
   "США"
  ]
 },
 "Леонардо Ди Каприо": {
  "originalName": "Leonardo DiCaprio",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d0/Leonardo_DiCaprio_-_BFI_Southbank_3_%28crop%29.jpg/250px-Leonardo_DiCaprio_-_BFI_Southbank_3_%28crop%29.jpg",
  "birthDate": "1974-11-11",
  "countries": [
   "США"
  ],
  "birthplace": "Лос-Анджелес"
 },
 "Джои МакФарлэнд": {
  "originalName": "Joey McFarland",
  "birthDate": "1972-04-30",
  "countries": [
   "США"
  ],
  "birthplace": "Луисвилл"
 },
 "Эмма Тиллинджер Коскофф": {
  "originalName": "Emma Tillinger Koskoff",
  "birthDate": "1972",
  "countries": [
   "США"
  ]
 },
 "Риза Азиз": {
  "originalName": "Riza Aziz",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/ff/Riza_Aziz%2C_Producer_from_Red_Granite_Pictures.jpg/250px-Riza_Aziz%2C_Producer_from_Red_Granite_Pictures.jpg",
  "birthDate": "1953",
  "countries": [
   "Малайзия",
   "США"
  ],
  "birthplace": "Мири"
 },
 "Уолтер Ф. Паркс": {
  "originalName": "Walter F. Parkes",
  "birthDate": "1951-04-15",
  "countries": [
   "США"
  ],
  "birthplace": "Бейкерсфилд"
 },
 "Лори Макдональд": {
  "originalName": "Laurie MacDonald",
  "birthDate": "1953-12-19",
  "countries": [
   "США"
  ],
  "birthplace": "Уотсонвилл"
 },
 "Мишель Шэйн": {
  "originalName": "Michel Shane",
  "birthDate": "1955-10-08",
  "countries": [
   "Канада"
  ],
  "birthplace": "Монреаль"
 },
 "Том Хэнкс": {
  "originalName": "Tom Hanks",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e7/Tom_Hanks_at_the_Elvis_Premiere_2022.jpg/250px-Tom_Hanks_at_the_Elvis_Premiere_2022.jpg",
  "birthDate": "1956-07-09",
  "countries": [
   "Греция",
   "США"
  ],
  "birthplace": "Конкорд"
 },
 "Джек Рапке": {
  "originalName": "Jack Rapke",
  "birthDate": "1950",
  "countries": [
   "США"
  ],
  "birthplace": "Нью-Йорк"
 },
 "Сэмюэл Голдуин мл.": {
  "originalName": "Samuel Goldwyn Jr.",
  "birthDate": "1926-09-07",
  "deathYear": "2015",
  "countries": [
   "США"
  ],
  "birthplace": "Лос-Анджелес"
 },
 "Джон Голдвин": {
  "originalName": "John Goldwyn",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/8/8a/John_Goldwyn%2C_Sara_Colleton%2C_Jeff_Lindsay_and_Jonathan_Estrin%2C_June_2008_%282%29_%28cropped%29.jpg/250px-John_Goldwyn%2C_Sara_Colleton%2C_Jeff_Lindsay_and_Jonathan_Estrin%2C_June_2008_%282%29_%28cropped%29.jpg",
  "birthDate": "1958-08-10",
  "countries": [
   "США"
  ],
  "birthplace": "Лос-Анджелес"
 },
 "Ричард Дэррил Занук": {
  "originalName": "Richard D. Zanuck",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/6/62/Richard_D._Zanuck_%28cropped%29.jpg/250px-Richard_D._Zanuck_%28cropped%29.jpg",
  "birthDate": "1934-12-13",
  "deathYear": "2012",
  "countries": [
   "США"
  ],
  "birthplace": "Лос-Анджелес"
 },
 "Брюс Коуэн": {
  "originalName": "Bruce Cohen",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/d/db/Bruce_Cohen.jpg/250px-Bruce_Cohen.jpg",
  "birthDate": "1961-09-23",
  "countries": [
   "США"
  ],
  "birthplace": "Фолс-Черч"
 },
 "Дэн Джинкс": {
  "originalName": "Dan Jinks",
  "countries": [
   "США"
  ],
  "birthplace": "Майами"
 },
 "Владимир Меньшов": {
  "originalName": "Vladimir Menshov",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/08/%D0%92%D0%BB%D0%B0%D0%B4%D0%B8%D0%BC%D0%B8%D1%80_%D0%9C%D0%B5%D0%BD%D1%8C%D1%88%D0%BE%D0%B2_2018_%28cropped%29.jpg/250px-%D0%92%D0%BB%D0%B0%D0%B4%D0%B8%D0%BC%D0%B8%D1%80_%D0%9C%D0%B5%D0%BD%D1%8C%D1%88%D0%BE%D0%B2_2018_%28cropped%29.jpg",
  "birthDate": "1939-09-17",
  "deathYear": "2021",
  "countries": [
   "СССР",
   "Россия"
  ],
  "birthplace": "Баку"
 },
 "Эльдар Рязанов": {
  "originalName": "Eldar Ryazanov",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/8/89/Eldar_Ryazanov_1990s_%28cropped%29.jpg/250px-Eldar_Ryazanov_1990s_%28cropped%29.jpg",
  "birthDate": "1927-11-18",
  "deathYear": "2015",
  "countries": [
   "Россия"
  ],
  "birthplace": "Самара"
 },
 "Александр Серый": {
  "originalName": "Aleksandr Seryj",
  "birthDate": "1927-10-27",
  "deathYear": "1987",
  "countries": [
   "СССР"
  ],
  "birthplace": "Рамонь"
 },
 "Андрей Тарковский": {
  "originalName": "Andrei Tarkovsky",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f6/Andrei_Tarkovsky_by_Boris_Baldin.jpg/250px-Andrei_Tarkovsky_by_Boris_Baldin.jpg",
  "birthDate": "1932-04-04",
  "deathYear": "1986",
  "countries": [
   "СССР",
   "Франция",
   "Италия"
  ],
  "birthplace": "Завражье"
 },
 "Даниэль Тоскан дю Плантье": {
  "originalName": "Daniel Toscan du Plantier",
  "birthDate": "1941-04-07",
  "deathYear": "2003",
  "countries": [
   "Франция"
  ],
  "birthplace": "Шамбери"
 },
 "Алексей Балабанов": {
  "originalName": "Aleksei Balabanov",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/17/Aleksei_Balabanov.JPG/250px-Aleksei_Balabanov.JPG",
  "birthDate": "1959-02-25",
  "deathYear": "2013",
  "countries": [
   "СССР",
   "Россия"
  ],
  "birthplace": "Екатеринбург"
 },
 "Сергей Сельянов": {
  "originalName": "Sergey Selyanov",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f1/%D0%A1%D0%B5%D1%80%D0%B3%D0%B5%D0%B9_%D0%A1%D0%B5%D0%BB%D1%8C%D1%8F%D0%BD%D0%BE%D0%B2_%2823-06-2022%29_%28cropped%29.jpg/250px-%D0%A1%D0%B5%D1%80%D0%B3%D0%B5%D0%B9_%D0%A1%D0%B5%D0%BB%D1%8C%D1%8F%D0%BD%D0%BE%D0%B2_%2823-06-2022%29_%28cropped%29.jpg",
  "birthDate": "1955-08-21",
  "countries": [
   "СССР",
   "Россия"
  ],
  "birthplace": "Олонец"
 },
 "Андрей Звягинцев": {
  "originalName": "Andrey Zvyagintsev",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a2/Andre%C3%AF_Zviaguintsev-_2016_%28cropped%29.jpg/250px-Andre%C3%AF_Zviaguintsev-_2016_%28cropped%29.jpg",
  "birthDate": "1964-02-06",
  "countries": [
   "СССР",
   "Россия"
  ],
  "birthplace": "Новосибирск"
 },
 "Дмитрий Лесневский": {
  "originalName": "Dmitry Lesnevsky",
  "image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/ab/Lesnevsky.jpg/250px-Lesnevsky.jpg",
  "birthDate": "1970-02-02",
  "countries": [
   "СССР",
   "Россия",
   "США"
  ],
  "birthplace": "Москва"
 }
};

const PRODUCERS = {"1": ["Ники Марвин"], "2": ["Фрэнк Дарабонт", "Дэвид Вальдес"], "3": ["Венди Файнерман", "Стив Старки", "Чарльз Ньюирт", "Стив Тиш"], "4": ["Кристофер Нолан", "Эмма Томас", "Линда Обст"], "5": ["Кристофер Нолан", "Эмма Томас"], "6": ["Мартин Скорсезе", "Майк Медавой", "Брэд Фишер"], "7": ["Дон Хан"], "8": ["Джон Хьюз"], "10": ["Гай Ричи"], "11": ["Сью Верчью"], "12": ["Винс Гиллиган", "Джордж Мастрас", "Питер Гулд", "Сэм Кэтлин", "Джон Шибан", "Мойра Уолли", "Томас Шнауз"], "13": ["Альберт С. Радди"], "14": ["Кристофер Нолан", "Эмма Томас", "Чарльз Ровен"], "15": ["Арт Линсон", "Кин Чеффин"], "16": ["Лоренс Бендер"], "17": ["Джейсон Блум", "Хелен Эстабрук", "Дэвид Ланкастер", "Михаил Литвак"], "18": ["Эндрю Никкол", "Скотт Рудин", "Адам Шрёдер", "Эдвард С. Фельдман"], "19": ["Гари Гилберт", "Марк Платт", "Фред Бергер", "Джордан Горовиц"], "20": ["Чарли Вобкен", "Уэс Андерсон", "Скотт Рудин", "Christoph Fisser", "Хеннинг Мольфентер", "Стивен М. Рэйлс", "Джереми Даусон"], "21": ["Kwak Sin-ae", "Пон Джун Хо"], "22": ["Клоди Оссард"], "23": ["Лоренс Бендер"], "24": ["Лоран Зейтун", "Янн Зену", "Nicolas Duval Adassovsky"], "25": ["Тосио Судзуки"], "26": ["Тоору Хара"], "27": ["Тосио Судзуки"], "28": ["Джим Моррис", "Линдси Коллинз"], "29": ["Брэд Льюис"], "30": ["Дарла К. Андерсон"], "31": ["Джон Лассетер", "Эндрю Стэнтон", "Джонас Ривера"], "32": ["Эми Паскаль", "Ави Арад", "Фил Лорд", "Крис Миллер"], "33": ["Стивен Спилберг", "Джеффри Катценберг", "Арон Уорнер", "Джон Уильямс"], "34": ["Эд Катмулл", "Бонни Арнольд", "Ральф Гуггенхейм"], "35": ["Уолтер Хилл", "Гордон Кэрролл", "Дэвид Гилер"], "36": ["Стэнли Кубрик"], "37": ["Дэвид Фостер", "Лоуренс Турман"], "38": ["Джейсон Блум", "Шон МакКиттрик", "Тед Хэмм"], "39": ["Питер Сафран"], "40": ["Майкл Бэй", "Брэдли Фуллер", "Эндрю Форм"], "41": ["Макс Видеман", "Квирин Берг", "Баран бо Одар", "Янтье Фризе"], "44": ["Сэнна Уоленберг"], "46": ["Чэд Оукс"], "47": ["Дэвид Линч"], "50": ["Марта Кауффман", "Дэвид Крейн"], "53": ["Питер Джексон", "Фрэн Уолш", "Барри М. Осборн", "Тим Сандерс"], "54": ["Питер Джексон", "Фрэн Уолш", "Барри М. Осборн"], "55": ["Питер Джексон", "Фрэн Уолш", "Барри М. Осборн"], "56": ["Дэвид Хейман"], "57": ["Дэвид Хейман"], "58": ["Крис Коламбус", "Дэвид Хейман", "Марк Рэдклифф"], "59": ["Дэвид Хейман"], "60": ["Дэвид Хейман", "Дэвид Баррон"], "61": ["Дэвид Хейман", "Дэвид Баррон"], "62": ["Джоан Роулинг", "Дэвид Хейман", "Дэвид Баррон"], "63": ["Джоан Роулинг", "Дэвид Хейман", "Дэвид Баррон"], "64": ["Питер Джексон", "Фрэн Уолш", "Кэролинн Каннингем", "Зейн Уэйнер"], "65": ["Питер Джексон", "Фрэн Уолш", "Кэролинн Каннингем"], "66": ["Питер Джексон", "Фрэн Уолш", "Кэролинн Каннингем", "Марк Ордески"], "67": ["Джерри Брукхаймер"], "68": ["Джерри Брукхаймер"], "69": ["Джерри Брукхаймер"], "70": ["Джоэл Сильвер"], "71": ["Джоэл Сильвер"], "72": ["Джоэл Сильвер"], "73": ["Бад Йоркин", "Майкл Дили", "Джерри Перенчио"], "74": ["Бад Йоркин", "Эндрю Косов", "Бродерик Джонсон", "Синтия Сайкс"], "75": ["Дени Вильнёв", "Ричард П. Рубинштейн", "Мэри Пэрент", "Томас Тулл"], "76": ["Мэри Пэрент"], "77": ["Шон Леви"], "78": ["Ридли Скотт"], "79": ["Альфонсо Куарон", "Дэвид Хейман"], "80": ["Стив Старки", "Линда Обст"], "81": ["Дэнни Де Вито", "Стейси Шер", "Гэйл Лион"], "82": ["Стив Голин", "Энтони Брегман"], "83": ["Скотт Рудин", "Эндрю Макдональд"], "84": ["Труди Стайлер"], "85": ["Питер Джексон", "Кэролинн Каннингем"], "86": ["Боб Гейл", "Нил Кэнтон"], "87": ["Боб Гейл", "Нил Кэнтон"], "88": ["Боб Гейл", "Нил Кэнтон"], "89": ["Гейл Энн Хёрд"], "90": ["Джеймс Кэмерон", "Гейл Энн Хёрд", "Марио Кассар"], "91": ["Гейл Энн Хёрд", "Уолтер Хилл", "Гордон Кэрролл", "Дэвид Гилер"], "92": ["Джоэл Сильвер", "Лоуренс Гордон", "Джон Дэвис"], "93": ["Джордж Лукас", "Рик Маккаллум", "Гэри Курц"], "94": ["Гэри Курц"], "95": ["Рик Маккаллум", "Ховард Казанджян"], "96": ["Джордж Лукас", "Фрэнк Маршалл", "Ховард Казанджян"], "97": ["Джордж Лукас", "Роберт Уоттс"], "98": ["Стивен Спилберг", "Кэтлин Кеннеди", "Джералд Молен"], "99": ["Джеймс Кэмерон", "Джон Ландау"], "100": ["Джеймс Кэмерон", "Джон Ландау"], "101": ["Джордж Миллер", "Иэн Смит", "Брюс Берман", "Кристофер ДеФариа", "Даг Митчелл"], "102": ["Бранко Лустиг", "Дэвид Францони", "Дуглас Уик", "Терри Нидэм"], "103": ["Мел Гибсон", "Алан Лэдд", "Брюс Дейви", "Стефен Макэвити"], "104": ["Колин Уилсон"], "105": ["Том Круз", "Эдвард Цвик", "Пола Вагнер", "Маршалл Херсковиц"], "106": ["Стивен Спилберг", "Йен Брайс", "Гари Левинсон", "Марк Гордон"], "107": ["Сэм Мендес", "Пиппа Харрис", "Каллум МакДаголл", "Джейн-Энн Тенггрен"], "108": ["Кристофер Нолан", "Эмма Томас"], "109": ["Фрэнсис Форд Коппола"], "110": ["Стэнли Кубрик"], "111": ["Стивен Спилберг", "Кэтлин Кеннеди", "Бранко Лустиг", "Джералд Молен"], "112": ["Роман Полански", "Ален Сард", "Робер Бенмусса"], "113": ["Эльда Ферри", "Джанлуиджи Браски"], "114": ["Дэвид Хейман"], "115": ["Хэл Уоллис"], "116": ["Дэвид О. Селзник"], "117": ["Уильям Уайлер"], "118": ["Билли Уайлдер"], "119": ["Билли Уайлдер"], "120": ["Ричард Шеперд", "Мартин Джуроу"], "121": ["Артур Фрид"], "122": ["Гарольд Рамис"], "123": ["Роберт Энгельман"], "124": ["Джеймс Джи Робинсон", "Гэри Барбер"], "125": ["Кристофер Нолан", "Эмма Томас", "Аарон Райдер"], "126": ["Кэти Шульман", "Боб Яри", "Брайан Коппельман", "Дэвид Левиен", "Майкл Лондон"], "127": ["Дженнифер Тодд", "Сюзанн Тодд"], "128": ["Арнольд Копельсон"], "129": ["Майк Медавой", "Джеймс Вандербилт", "Кин Чеффин"], "130": ["Риз Уизерспун", "Лесли Диксон", "Арнон Милчен", "Кин Чеффин", "Бруна Папандреа"], "131": ["Эндрю Косов", "Бродерик Джонсон", "Кира Дэвис"], "132": ["Кеннет Брана", "Ридли Скотт", "Саймон Кинберг", "Марк Гордон"], "133": ["Райан Джонсон", "Рэм Бергман"], "134": ["Райан Джонсон", "Рэм Бергман"], "135": ["Уэс Андерсон", "Скотт Рудин", "Меган Эллисон", "Джереми Даусон"], "136": ["Уэс Андерсон", "Скотт Рудин", "Аллисон Аббате"], "137": ["Генри Селик", "Билл Микэник"], "138": ["Тим Бёртон", "Дэнни Эльфман", "Дениз Ди Нови"], "139": ["Тим Бёртон", "Джо Рэнфт", "Аллисон Аббате"], "140": ["Кларк Спенсер"], "141": ["Оснат Шурер"], "142": ["Джон Лассетер", "Питер Дель Вечо"], "143": ["Джон Лассетер", "Глен Кин"], "144": ["Дон Хан"], "145": ["Джон Маскер", "Рон Клементс", "Дональд У. Эрнст", "Эми Пелл"], "146": ["Пэм Коутс"], "147": ["Ханс Циммер", "Джон Пауэлл", "Билл Дамашке", "Джонатан Айбел", "Гленн Бергер"], "148": ["Бонни Арнольд"], "149": ["Мирей Сория"], "150": ["Катрин Уиндер", "Лори Форте"], "151": ["Джон Лассетер", "Graham Walters"], "152": ["Джон Лассетер", "Кэтрин Сарафян", "Джонни Уокер", "Кори Рэй"], "153": ["Джон Лассетер", "Дарла К. Андерсон"], "154": ["Дана Мюрей"], "155": ["Джонас Ривера"], "156": ["Кристина Рид", "Рой Конли"], "157": ["Кларк Спенсер"], "158": ["Джон Маскер", "Рон Клементс", "Рой Конли"], "159": ["Дон Хан"], "160": ["Тосио Судзуки"], "161": ["Исао Такахата"], "162": ["Исао Такахата"], "163": ["Хаяо Миядзаки", "Тоору Хара"], "164": ["Тосио Судзуки"], "165": ["Гэнки Кавамура", "Kōichirō Itō", "Кацухиро Такеи"], "166": ["Kōichirō Itō"], "168": ["Сюндзо Като"], "169": ["Мицухиса Исикава"], "170": ["Дзюнго Марута"], "171": ["Масао Маруяма", "Хироаки Иноэ"], "172": ["Масао Маруяма"], "174": ["Питер Фаррелли", "Джим Бёрк", "Чарльз Б. Уэсслер", "Ник Валлелонга", "Брайан Хэйс Керри"], "175": ["Фаррелл Уильямс", "Донна Джильотти", "Питер Чернин", "Тед Мелфи"], "176": ["Рон Ховард", "Брайан Грейзер"], "177": ["Энтони МакКартен", "Эрик Феллнер", "Тим Беван", "Лиза Брюс"], "178": ["Кевин Спейси", "Скотт Рудин", "Майкл Де Лука", "Кин Чеффин", "Дэна Брунетти"], "180": ["Брэд Питт", "Арнон Милчен", "Деде Гарднер", "Джереми Клейнер"], "181": ["Леонардо Ди Каприо", "Мартин Скорсезе", "Джои МакФарлэнд", "Эмма Тиллинджер Коскофф", "Риза Азиз"], "182": ["Уолтер Ф. Паркс", "Лори Макдональд", "Мишель Шэйн"], "183": ["Стивен Спилберг", "Эндрю Никкол", "Уолтер Ф. Паркс", "Лори Макдональд"], "184": ["Том Хэнкс", "Роберт Земекис", "Стив Старки", "Джек Рапке"], "185": ["Сэмюэл Голдуин мл.", "Джон Голдвин"], "186": ["Ричард Дэррил Занук", "Брюс Коуэн", "Дэн Джинкс"], "197": ["Даниэль Тоскан дю Плантье"], "198": ["Сергей Сельянов"], "199": ["Сергей Сельянов"], "200": ["Дмитрий Лесневский"]};

/** Единое написание имени: «Фамилия, Имя Отчество» → «Имя Фамилия», без отчества и неразрывных пробелов. */
export const normalizePersonName = value => {
  let name = String(value || '').replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
  const reversed = name.match(/^([^,]+),\s*(.+)$/);
  if (reversed) name = `${reversed[2]} ${reversed[1]}`;
  const parts = name.split(' ');
  if (parts.length === 3 && /(ович|евич|ич|овна|евна|ична|инична)$/.test(parts[1])) name = `${parts[0]} ${parts[2]}`;
  return name;
};

export const findPersonBio = name => {
  const key = normalizePersonName(name);
  return Object.hasOwn(PEOPLE, key) ? PEOPLE[key] : null;
};

export const getFilmProducers = movie => (PRODUCERS[movie?.id] || []).map(normalizePersonName);
