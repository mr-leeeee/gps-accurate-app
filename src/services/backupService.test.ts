import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { exportBackup } from './backupService';
import { AppError } from '../types/errors';

vi.mock('@capacitor/filesystem', () => ({
  Directory: { Documents: 'DOCUMENTS' },
  Encoding: { UTF8: 'utf8' },
  Filesystem: { writeFile: vi.fn() },
}));

vi.mock('@capacitor/share', () => ({
  Share: { share: vi.fn() },
}));

const mockWriteFile = vi.mocked(Filesystem.writeFile);
const mockShare = vi.mocked(Share.share);

const PLACES = [
  { id: 'a', customName: '집', originalAddress: '서울시', latitude: 37.5, longitude: 127, timestamp: 1 },
];

describe('backupService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWriteFile.mockResolvedValue({ uri: 'file:///Documents/backup.json' });
    mockShare.mockResolvedValue({ activityType: 'com.google.android.gm' });
  });

  it('Documents 폴더에 JSON 파일을 UTF8로 저장한다', async () => {
    await exportBackup(JSON.stringify(PLACES));

    expect(mockWriteFile).toHaveBeenCalledTimes(1);
    const arg = mockWriteFile.mock.calls[0][0];
    expect(arg.directory).toBe(Directory.Documents);
    expect(arg.encoding).toBe(Encoding.UTF8);
    expect(arg.path).toMatch(/^GPS_장소목록_\d{8}-\d{4}\.json$/);
  });

  it('저장한 파일 URI를 files 배열로 공유 시트에 전달한다', async () => {
    await exportBackup(JSON.stringify(PLACES));

    expect(mockShare).toHaveBeenCalledTimes(1);
    expect(mockShare.mock.calls[0][0].files).toEqual(['file:///Documents/backup.json']);
  });

  it('장소 개수와 파일명을 결과로 반환한다', async () => {
    const result = await exportBackup(JSON.stringify([...PLACES, ...PLACES]));

    expect(result.count).toBe(2);
    expect(result.fileName).toMatch(/\.json$/);
    expect(result.path).toBe('file:///Documents/backup.json');
    expect(result.folderName).toBe('Documents');
    expect(result.shareCompleted).toBe(true);
  });

  it('JSON이 아니면 파일을 쓰지 않고 AppError를 던진다', async () => {
    await expect(exportBackup('not-json')).rejects.toThrow(AppError);
    expect(mockWriteFile).not.toHaveBeenCalled();
  });

  it('파일 저장 실패 시 AppError를 던진다', async () => {
    mockWriteFile.mockRejectedValueOnce(new Error('권한 없음'));

    await expect(exportBackup(JSON.stringify(PLACES))).rejects.toThrow(AppError);
  });

  it('공유 시트를 닫아도 저장은 성공으로 처리한다', async () => {
    mockShare.mockRejectedValueOnce(new Error('Share canceled'));

    const result = await exportBackup(JSON.stringify(PLACES));

    expect(result.shareCompleted).toBe(false);
    expect(result.path).toBe('file:///Documents/backup.json');
  });

  it('공유 자체가 실패하면 AppError를 던진다', async () => {
    mockShare.mockRejectedValueOnce(new Error('Activity not found'));

    await expect(exportBackup(JSON.stringify(PLACES))).rejects.toThrow(AppError);
  });
});