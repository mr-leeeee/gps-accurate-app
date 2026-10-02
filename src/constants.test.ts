import { describe, it, expect, vi, afterEach } from 'vitest';

async function loadBaseTileLayer(key: string) {
  vi.resetModules();
  vi.stubEnv('VITE_VWORLD_TILE_KEY', key);
  const { BASE_TILE_LAYER } = await import('./constants');
  return BASE_TILE_LAYER;
}

async function loadResolved(buildTimeKey: string, userKey: string, hasUserRecord: boolean) {
  vi.resetModules();
  vi.stubEnv('VITE_VWORLD_TILE_KEY', buildTimeKey);
  const { resolveBaseTileLayer } = await import('./constants');
  return resolveBaseTileLayer(userKey, hasUserRecord);
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

describe('resolveBaseTileLayer', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('앱 저장 키가 빌드타임 키보다 우선한다', async () => {
    const layer = await loadResolved('BUILD-TIME-KEY', 'USER-SAVED-KEY', true);

    expect(layer.url).toContain('/USER-SAVED-KEY/');
    expect(layer.url).not.toContain('BUILD-TIME-KEY');
  });

  it('저장 기록이 없으면 빌드타임 키를 사용한다', async () => {
    const layer = await loadResolved('BUILD-TIME-KEY', '', false);

    expect(layer.url).toBe(
      'https://api.vworld.kr/req/wmts/1.0.0/BUILD-TIME-KEY/Base/{z}/{y}/{x}.png',
    );
  });

  it('만료돼서 키가 비어도 빌드타임 키로 되돌아가지 않고 OSM으로 폴백한다', async () => {
    const layer = await loadResolved('BUILD-TIME-KEY', '', true);

    expect(layer.url).toContain('basemaps.cartocdn.com');
    expect(layer.isVWorld).toBe(false);
  });

  it('저장 기록도 빌드타임 키도 없으면 OSM으로 폴백한다', async () => {
    const layer = await loadResolved('', '', false);

    expect(layer.url).toContain('basemaps.cartocdn.com');
    expect(layer.isVWorld).toBe(false);
  });
});