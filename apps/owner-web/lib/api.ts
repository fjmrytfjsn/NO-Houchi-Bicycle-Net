export async function getMarker(code: string) {
  const res = await fetch(`/api/owner/markers/${code}`);
  return res.json();
}

export async function unlockTemp(code: string, notes?: string) {
  const res = await fetch(`/api/owner/markers/${code}/unlock-temp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: notes ? JSON.stringify({ notes }) : undefined,
  });
  return res.json();
}

export async function unlockFinal(code: string) {
  const res = await fetch(`/api/owner/markers/${code}/unlock-final`, {
    method: 'POST',
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error?.message || 'unlock-final failed');
  }
  return res.json();
}
