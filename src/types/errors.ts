export class AppError extends Error {
  code: string;
  userMessage: string;
  recoverable: boolean;

  constructor(
    message: string,
    code: string,
    userMessage: string,
    recoverable: boolean = true
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.userMessage = userMessage;
    this.recoverable = recoverable;
  }
}

export class GeolocationError extends AppError {
  constructor(code: string, message: string) {
    const userMessages: Record<string, string> = {
      PERMISSION_DENIED: '위치 권한이 거부되었습니다. 설정에서 위치 권한을 허용해주세요.',
      POSITION_UNAVAILABLE: 'GPS 신호를 수신할 수 없습니다. 실외에서 다시 시도해주세요.',
      TIMEOUT: '위치 측정 시간이 초과되었습니다. 다시 시도해주세요.',
      NETWORK_ERROR: '네트워크 연결을 확인해주세요.',
      DEFAULT: '위치 정보를 가져오지 못했습니다.',
    };

    super(message, code, userMessages[code] || userMessages.DEFAULT);
    this.name = 'GeolocationError';
  }
}

export class NetworkError extends AppError {
  constructor(message: string) {
    super(message, 'NETWORK_ERROR', '네트워크 연결을 확인해주세요.', true);
    this.name = 'NetworkError';
  }
}

export class StorageError extends AppError {
  constructor(message: string) {
    super(message, 'STORAGE_ERROR', '데이터 저장에 실패했습니다.', true);
    this.name = 'StorageError';
  }
}