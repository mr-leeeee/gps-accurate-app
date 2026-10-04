/**
 * 저장 장소의 기본 이름에 쓸 짧은 주소 조각 추출
 *
 * 역지오코딩 주소는 "대한민국 인천광역시 서구 검단동 검단로"처럼
 * 앞에서부터 넓은 단위로 나열되므로, 뒤쪽 2토큰(동 + 도로명)이
 * 장소를 구분하기에 가장 짧고 정확하다. 토큰 순서가 바뀌어도
 * 뒤쪽이 가장 구체적이라는 가정은 유지된다.
 */
export function extractShortAddress(
  address: string | undefined | null
): string {
  if (!address) return '';
  const tokens = address.trim().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return '';
  return tokens.slice(-2).join(' ').slice(0, 20);
}

/**
 * 새로 저장하는 장소의 기본 이름 생성
 *
 * 주소가 있으면 "불로대곡동 검단로 (08:19)"처럼 식별 가능하게,
 * 주소가 없으면 기존 형식 "장소 N (08:19)"으로 폴백한다.
 */
export function buildDefaultPlaceName(
  address: string | undefined | null,
  count: number,
  timeStr: string
): string {
  const short = extractShortAddress(address);
  if (short) return `${short} (${timeStr})`;
  return `장소 ${count} (${timeStr})`;
}
