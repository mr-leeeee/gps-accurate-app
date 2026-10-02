import { describe, it, expect, vi, afterEach } from 'vitest';

async function loadBaseTileLayer(key: string) {
  vi.resetModules();
  vi.stubEnv('VITE_VWORLD_TILE_KEY', key);
  const { BASE_TILE_LAYER } = await import('./constants');
  return BASE_TILE_LAYER;
}

describe('BASE_TILE_LAYER', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  describe('인증키가 있을 때', () => {
    it('VWorld WMTS 경로 템플릿을 사용한다', async () => {
      const layer = await loadBaseTileLayer('TEST-KEY-1234');

      expect(layer.url).toBe(
        'https://api.vworld.kr/req/wmts/1.0.0/TEST-KEY-1234/Base/{z}/{y}/{x}.png',
      );
    });

    // 순서를 관례적인 {z}/{x}/{y}로 "정정"하면 404가 나고 지도가 조용히 깨진다.
    it('경로 순서가 {z}/{y}/{x}이다', async () => {
      const { url } = await loadBaseTileLayer('TEST-KEY-1234');
      const [, tilePath] = url.split('/Base/');

      expect(tilePath).toBe('{z}/{y}/{x}.png');
    });

    it('쿼리 파라미터가 없다', async () => {
      const { url } = await loadBaseTileLayer('TEST-KEY-1234');

      expect(url).not.toContain('?');
    });

    it('zoom 범위가 6~19다', async () => {
      const layer = await loadBaseTileLayer('TEST-KEY-1234');

      expect(layer.minZoom).toBe(6);
      expect(layer.maxZoom).toBe(19);
    });

    it('출처 표기가 포함된다', async () => {
      const { attribution } = await loadBaseTileLayer('TEST-KEY-1234');

      expect(attribution).toContain('국토교통부');
    });
  });

  describe('인증키가 없을 때', () => {
    it('CartoDB Voyager로 폴백한다', async () => {
      const layer = await loadBaseTileLayer('');

      expect(layer.url).toBe(
        'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      );
    });

    it('zoom 범위가 0~19다', async () => {
      const layer = await loadBaseTileLayer('');

      expect(layer.minZoom).toBe(0);
      expect(layer.maxZoom).toBe(19);
    });

    it('VWorld URL을 사용하지 않는다', async () => {
      const { url } = await loadBaseTileLayer('');

      expect(url).not.toContain('vworld');
    });
  });
});