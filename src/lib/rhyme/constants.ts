/**
 * Romanization constants for Japanese text
 */

export const LATIN_VOWELS = new Set(['a', 'e', 'i', 'o', 'u', 'y']);

export const KANA_ROMAJI_MAP: Record<string, string> = {
  // Basic vowels
  あ: 'a', い: 'i', う: 'u', え: 'e', お: 'o',
  // K-row
  か: 'ka', き: 'ki', く: 'ku', け: 'ke', こ: 'ko',
  // S-row
  さ: 'sa', し: 'shi', す: 'su', せ: 'se', そ: 'so',
  // T-row
  た: 'ta', ち: 'chi', つ: 'tsu', て: 'te', と: 'to',
  // N-row
  な: 'na', に: 'ni', ぬ: 'nu', ね: 'ne', の: 'no',
  // H-row
  は: 'ha', ひ: 'hi', ふ: 'fu', へ: 'he', ほ: 'ho',
  // M-row
  ま: 'ma', み: 'mi', む: 'mu', め: 'me', も: 'mo',
  // Y-row
  や: 'ya', ゆ: 'yu', よ: 'yo',
  // R-row
  ら: 'ra', り: 'ri', る: 'ru', れ: 're', ろ: 'ro',
  // W-row
  わ: 'wa', を: 'o', ん: 'n',
  // G-row (voiced)
  が: 'ga', ぎ: 'gi', ぐ: 'gu', げ: 'ge', ご: 'go',
  // Z-row (voiced)
  ざ: 'za', じ: 'ji', ず: 'zu', ぜ: 'ze', ぞ: 'zo',
  // D-row (voiced)
  だ: 'da', ぢ: 'ji', づ: 'zu', で: 'de', ど: 'do',
  // B-row (voiced)
  ば: 'ba', び: 'bi', ぶ: 'bu', べ: 'be', ぼ: 'bo',
  // P-row (semi-voiced)
  ぱ: 'pa', ぴ: 'pi', ぷ: 'pu', ぺ: 'pe', ぽ: 'po',
  // Small vowels
  ぁ: 'a', ぃ: 'i', ぅ: 'u', ぇ: 'e', ぉ: 'o',
  // V-sound
  ゔ: 'vu',
};

export const DIGRAPH_MAP: Record<string, string> = {
  // Ky-
  きゃ: 'kya', きゅ: 'kyu', きょ: 'kyo',
  // Sh-
  しゃ: 'sha', しゅ: 'shu', しょ: 'sho',
  // Ch-
  ちゃ: 'cha', ちゅ: 'chu', ちょ: 'cho',
  // Ny-
  にゃ: 'nya', にゅ: 'nyu', にょ: 'nyo',
  // Hy-
  ひゃ: 'hya', ひゅ: 'hyu', ひょ: 'hyo',
  // My-
  みゃ: 'mya', みゅ: 'myu', みょ: 'myo',
  // Ry-
  りゃ: 'rya', りゅ: 'ryu', りょ: 'ryo',
  // Gy-
  ぎゃ: 'gya', ぎゅ: 'gyu', ぎょ: 'gyo',
  // J-
  じゃ: 'ja', じゅ: 'ju', じょ: 'jo',
  // Dj-
  ぢゃ: 'ja', ぢゅ: 'ju', ぢょ: 'jo',
  // By-
  びゃ: 'bya', びゅ: 'byu', びょ: 'byo',
  // Py-
  ぴゃ: 'pya', ぴゅ: 'pyu', ぴょ: 'pyo',
  // W-
  うぁ: 'wa', うぃ: 'wi', うぇ: 'we', うぉ: 'wo',
  // F-
  ふぁ: 'fa', ふぃ: 'fi', ふぇ: 'fe', ふぉ: 'fo',
  // Ti/Di
  てぃ: 'ti', でぃ: 'di',
  // Tu/Du
  とぅ: 'tu', どぅ: 'du',
  // V-
  ゔぁ: 'va', ゔぃ: 'vi', ゔぇ: 've', ゔぉ: 'vo',
};