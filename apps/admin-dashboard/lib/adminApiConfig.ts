export function getAdminApiBaseUrl() {
  return (
    process.env.ADMIN_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    'http://localhost:3000'
  ).replace(/\/$/, '');
}
