export function formatDuration(ms: number) {
  if (ms <= 0) return '0秒';

  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const remainingSeconds = seconds % 60;
  const remainingMinutes = minutes % 60;

  if (hours > 0) {
    if (remainingMinutes > 0) {
      return `${hours}時間 ${remainingMinutes}分 ${remainingSeconds}秒`;
    }
    return `${hours}時間 ${remainingSeconds}秒`;
  }

  if (minutes > 0) return `${minutes}分 ${remainingSeconds}秒`;
  return `${remainingSeconds}秒`;
}

export function getUnlockTiming(
  nowTime: number,
  eligibleFinalAt: string,
  expiresAt: string
) {
  const eligibleAt = new Date(eligibleFinalAt).getTime();
  const expiresAtTime = new Date(expiresAt).getTime();

  return {
    eligible: nowTime >= eligibleAt,
    timeToEligible: eligibleAt - nowTime,
    timeToExpires: expiresAtTime - nowTime,
  };
}
