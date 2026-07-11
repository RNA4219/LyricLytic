import { describe, it, expect } from 'vitest';
import {
  analyzeLyricAffect,
  analyzeLyricAffectInsight,
  compareLyricAffectVersions,
} from '../lib/affect/lyricsAffectMetrics';
import { affectGoldenLyrics } from './fixtures/affectGoldenLyrics';

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

  it('returns section metrics and wave points for tagged lyrics', () => {
    const insight = analyzeLyricAffectInsight({ fullText: affectGoldenLyrics.sparseBallad });

    expect(insight.sections.map((section) => section.displayName)).toEqual([
      'Verse',
      'Pre',
      'Chorus',
      'Bridge',
    ]);
    expect(insight.wave).toHaveLength(4);
    for (const point of insight.wave) {
      expect(point.valence).toBeGreaterThanOrEqual(-1);
      expect(point.valence).toBeLessThanOrEqual(1);
      expect(point.arousal).toBeGreaterThanOrEqual(0);
      expect(point.arousal).toBeLessThanOrEqual(1);
      expect(point.density).toBeGreaterThanOrEqual(0);
      expect(point.density).toBeLessThanOrEqual(1);
      expect(point.tension).toBeGreaterThanOrEqual(0);
      expect(point.tension).toBeLessThanOrEqual(1);
    }
  });

  it('returns evidence with emotion, marker, and line context', () => {
    const metrics = analyzeLyricAffect(affectGoldenLyrics.dark);

    expect(metrics.evidence.length).toBeGreaterThan(0);
    expect(metrics.evidence[0]).toEqual(expect.objectContaining({
      emotion: expect.any(String),
      marker: expect.any(String),
      lineNumber: expect.any(Number),
      lineText: expect.any(String),
    }));
  });

  it('raises production alerts for low chorus density and flat waves', () => {
    const lowChorus = analyzeLyricAffectInsight({ fullText: affectGoldenLyrics.lowChorusDensity });
    const flatBallad = analyzeLyricAffectInsight({ fullText: affectGoldenLyrics.sparseBallad });

    expect(lowChorus.alerts.map((alert) => alert.kind)).toContain('chorus_density_below_verse');
    expect(flatBallad.alerts.map((alert) => alert.kind)).toContain('flat_late_wave');
  });

  it('keeps golden lyric tendencies stable', () => {
    const bright = analyzeLyricAffect(affectGoldenLyrics.bright);
    const dark = analyzeLyricAffect(affectGoldenLyrics.dark);
    const denseRap = analyzeLyricAffect(affectGoldenLyrics.denseRap);
    const sparseBallad = analyzeLyricAffect(affectGoldenLyrics.sparseBallad);

    expect(bright.topEmotions[0].name).toBe('joy');
    expect(dark.topEmotions.map((emotion) => emotion.name)).toContain('fear');
    expect(dark.trend.valence).toBeLessThan(bright.trend.valence);
    expect(denseRap.waveParameter.density).toBeGreaterThan(sparseBallad.waveParameter.density);
    expect(denseRap.derived.tension).toBeGreaterThan(sparseBallad.derived.tension);
  });

  it('compares snapshot lyrics with deltas and notes', () => {
    const comparison = compareLyricAffectVersions(
      affectGoldenLyrics.bright,
      affectGoldenLyrics.dark,
    );

    expect(comparison.delta.valence).toBeLessThan(0);
    expect(comparison.delta.tension).toBeGreaterThan(0);
    expect(comparison.notes.map((note) => note.kind)).toContain('valence_down');
    expect(comparison.sectionDeltas.length).toBeGreaterThan(0);
  });
});
