type HeadersLike = {
  get(name: string): string | null;
};

export function getClientIp(headers: HeadersLike): string {
  const directIp =
    headers.get("cf-connecting-ip") ||
    headers.get("true-client-ip") ||
    headers.get("x-real-ip");

  if (directIp) return directIp.trim();

  const forwardedFor = headers.get("x-forwarded-for");
  const firstForwardedIp = forwardedFor?.split(",")[0]?.trim();
  return firstForwardedIp || "unknown";
}
