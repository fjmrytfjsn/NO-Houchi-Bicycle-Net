export async function getMarker(code: string) {
  const res = await fetch(`/api/owner/markers/${code}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch marker: ${res.statusText}`);
  }
  return res.json();
}

export async function unlockTemp(code: string, notes?: string) {
  const res = await fetch(`/api/owner/markers/${code}/unlock-temp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: notes ? JSON.stringify({ notes }) : undefined,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error || 'Failed to unlock temporarily');
  }
  return res.json();
}

export async function unlockFinal(code: string) {
  const res = await fetch(`/api/owner/markers/${code}/unlock-final`, {
    method: 'POST',
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error || 'Failed to unlock finally');
  }
  return res.json();
}
