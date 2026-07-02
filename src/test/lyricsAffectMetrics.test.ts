import { describe, it, expect } from 'vitest';
import { analyzeLyricAffect } from '../lib/affect/lyricsAffectMetrics';

describe('analyzeLyricAffect', () => {
  it('returns neutral safe metrics for empty text', () => {
    const metrics = analyzeLyricAffect('');

    expect(metrics.topEmotions).toHaveLength(3);
    expect(metrics.textStats.characterCount).toBe(0);
    expect(metrics.waveParameter.density).toBeGreaterThanOrEqual(0);
    expect(metrics.waveParameter.density).toBeLessThanOrEqual(1);
  });

  it('keeps all normalized values in range', () => {
    const metrics = analyzeLyricAffect('突然の光！\n怖くて震える夜でも、希望を探す');
    const values = [
      metrics.trend.arousal,
      metrics.trend.stability,
      metrics.waveParameter.amplitude,
      metrics.waveParameter.frequency,
      metrics.waveParameter.jitter,
      metrics.waveParameter.glow,
      metrics.waveParameter.afterglow,
      metrics.waveParameter.density,
      ...metrics.topEmotions.map((emotion) => emotion.score),
    ];

    expect(metrics.trend.valence).toBeGreaterThanOrEqual(-1);
    expect(metrics.trend.valence).toBeLessThanOrEqual(1);
    for (const value of values) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(1);
    }
  });

  it('surfaces positive emotions for bright lyrics', () => {
    const metrics = analyzeLyricAffect('希望の光が笑う\n君と夢を抱いて楽しく歌う');
    const names = metrics.topEmotions.map((emotion) => emotion.name);

    expect(names.slice(0, 2)).toContain('joy');
    expect(metrics.trend.valence).toBeGreaterThan(0);
  });

  it('surfaces fear or tension for anxious lyrics', () => {
    const metrics = analyzeLyricAffect('闇の影が近づく\n怖くて不安で息が震える');
    const names = metrics.topEmotions.map((emotion) => emotion.name);

    expect(names.some((name) => ['fear', 'tension', 'sadness'].includes(name))).toBe(true);
    expect(metrics.trend.valence).toBeLessThan(0);
  });

  it('reports higher density for packed emotional lyrics than sparse text', () => {
    const sparse = analyzeLyricAffect('静かな夜\n月を見る');
    const packed = analyzeLyricAffect('怖くて不安で震える鼓動が止まらない！\n怒りと涙と希望が胸の奥でぶつかり続ける！');

    expect(packed.waveParameter.density).toBeGreaterThan(sparse.waveParameter.density);
  });
});
