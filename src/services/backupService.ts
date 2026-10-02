import { Directory, Encoding, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { AppError } from '../types/errors';
import { logger } from '../utils/logger';

export interface BackupResult {
  fileName: string;
  path: string;
  folderName: string;
  count: number;
  shareCompleted: boolean;
}

/** 사용자가 공유 시트를 닫으면 Share 플러그인이 이 메시지로 거부한다 */
const SHARE_CANCELED = 'Share canceled';

const isShareCanceled = (err: unknown): boolean =>
  err instanceof Error && err.message === SHARE_CANCELED;

const folderNameFromUri = (uri: string): string => {
  const segments = uri.replace(/^file:\/\//, '').split('/').filter(Boolean);
  segments.pop();
  return segments.pop() ?? '';
};

const buildFileName = (): string => {
  const now = new Date();
  const stamp = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
    '-',
    String(now.getHours()).padStart(2, '0'),
    String(now.getMinutes()).padStart(2, '0'),
  ].join('');
  return `GPS_장소목록_${stamp}.json`;
};

/**
 * 저장된 파일을 공유 시트로 보낸다.
 * 공유 시트를 닫아도 파일은 이미 저장되어 있으므로 오류로 취급하지 않는다.
 */
async function openShareSheet(uri: string, count: number): Promise<boolean> {
  try {
    await Share.share({
      title: 'GPS 장소 목록 백업',
      text: `저장된 장소 목록 ${count}개를 백업했습니다.`,
      files: [uri],
      dialogTitle: '백업 파일 저장 또는 전송',
    });
    return true;
  } catch (err) {
    if (isShareCanceled(err)) {
      logger.warn('Share sheet dismissed by user; file is already saved');
      return false;
    }
    logger.error('Failed to open share sheet', err);
    throw new AppError(
      'Failed to share backup file',
      'BACKUP_SHARE_ERROR',
      '백업 파일 공유에 실패했습니다.',
      true
    );
  }
}

/**
 * 장소 목록을 JSON 파일로 Documents에 저장하고 공유 시트를 연다.
 * 파일 저장에 성공하면 공유 시트 종료 여부와 무관하게 성공으로 간주한다.
 */
export async function exportBackup(json: string): Promise<BackupResult> {
  const fileName = buildFileName();

  let count: number;
  try {
    const parsed: unknown = JSON.parse(json);
    count = Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    throw new AppError(
      'Backup payload is not valid JSON',
      'BACKUP_INVALID_JSON',
      '백업할 장소 목록을 읽지 못했습니다.',
      false
    );
  }

  let uri: string;
  try {
    const written = await Filesystem.writeFile({
      path: fileName,
      data: json,
      directory: Directory.Documents,
      encoding: Encoding.UTF8,
      recursive: true,
    });
    uri = written.uri;
  } catch (err) {
    logger.error('Failed to write backup file', err);
    throw new AppError(
      'Failed to write backup file',
      'BACKUP_WRITE_ERROR',
      '백업 파일을 저장하지 못했습니다.',
      true
    );
  }

  const shareCompleted = await openShareSheet(uri, count);

  return { fileName, path: uri, folderName: folderNameFromUri(uri), count, shareCompleted };
}