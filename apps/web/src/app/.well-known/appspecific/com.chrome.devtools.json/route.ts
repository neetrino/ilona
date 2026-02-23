/**
 * Chrome DevTools requests this URL; returning 200 with empty JSON
 * silences the 404 warning in the console.
 */
export async function GET() {
  return Response.json({});
}
