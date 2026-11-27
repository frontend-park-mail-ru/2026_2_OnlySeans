import { AuthScene } from './AuthScene.js';
import templateSource from './AuthFilmScene.hbs';
import { loadAssets } from '../../../core/assets.js';

const template = await loadAssets({ template: templateSource });
const asset = (name: string) =>
  String(new URL(`../../../assets/images/auth/centered-${name}.svg`, import.meta.url));
const posters = [
  [195.1, -126.36],
  [271.17, 415.08],
  [347.41, 956.53],
  [608.13, -61.69],
  [684.21, 479.76],
  [760.29, 1021.2],
  [994.77, -183.38],
  [1071, 358.07],
  [1147.08, 899.51],
];
const captions = [
  [265.18, 413.55, 442.1, 391.91, '5013-03'],
  [341.41, 954.99, 518.18, 933.35, '5013-04'],
  [678.21, 478.22, 854.98, 456.42, '5023-01'],
  [754.29, 1019.66, 931.21, 997.87, '5023-02'],
  [1064.85, 356.53, 1241.77, 334.89, '5033-03'],
  [1141.08, 897.97, 1317.85, 876.33, '5033-04'],
] as const;

export class AuthFilmScene extends AuthScene {
  static template = template;
  context() {
    const films = this.props.films ?? [];
    return {
      sceneClass: this.props.centered ? 'auth-centered-scene' : 'auth-scene auth-scene--frame',
      split: !this.props.centered,
      strip: asset('strip'),
      strips: [
        [5.78, -1214.41],
        [310.24, 951.37],
        [570.97, -67.01],
        [805.6, -1271.43],
        [1109.91, 894.35],
      ].map(([left, top]) => ({ left, top, src: asset('strip') })),
      posters: posters.map(([left, top], index) => ({
        left,
        top,
        src: films[index % films.length]?.poster,
      })),
      captions: captions.flatMap(([left, top, codeLeft, codeTop, code]) => [
        { left, top, src: asset('35mm') },
        { left: codeLeft, top: codeTop, src: asset(code) },
      ]),
    };
  }
}
