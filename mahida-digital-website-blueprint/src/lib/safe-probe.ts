import { lookup } from 'node:dns/promises';
import { request } from 'node:https';
import { BlockList, isIP } from 'node:net';
const blocked = new BlockList();
for (const [ip, prefix] of [
  ['0.0.0.0', 8],
  ['10.0.0.0', 8],
  ['100.64.0.0', 10],
  ['127.0.0.0', 8],
  ['169.254.0.0', 16],
  ['172.16.0.0', 12],
  ['192.0.0.0', 24],
  ['192.0.2.0', 24],
  ['192.168.0.0', 16],
  ['198.18.0.0', 15],
  ['198.51.100.0', 24],
  ['203.0.113.0', 24],
  ['224.0.0.0', 4],
  ['240.0.0.0', 4],
] as const)
  blocked.addSubnet(ip, prefix, 'ipv4');
for (const [ip, prefix] of [
  ['2001:db8::', 32],
  ['2001::', 32],
  ['2002::', 16],
] as const)
  blocked.addSubnet(ip, prefix, 'ipv6');
export function publicAddress(ip: string) {
  const family = isIP(ip);
  return family === 4
    ? !blocked.check(ip, 'ipv4')
    : family === 6 && /^[23]/i.test(ip) && !blocked.check(ip, 'ipv6');
}
export type ProbeResult = {
  status: number;
  size?: number;
  type: string;
  redirected: boolean;
};
// DNS is checked and pinned separately at every redirect. Only response headers
// are read: no credentials, cookies, full media download or private-IP access.
export async function probeHttps(input: string): Promise<ProbeResult> {
  let url = new URL(input),
    redirected = false;
  const signal = AbortSignal.timeout(6000);
  for (let hop = 0; hop < 4; hop++) {
    signal.throwIfAborted();
    if (
      url.protocol !== 'https:' ||
      url.username ||
      url.password ||
      (url.port && url.port !== '443')
    )
      throw Error('Gunakan HTTPS publik tanpa kredensial atau port khusus.');
    const hostname = url.hostname.replace(/^\[|\]$/g, '');
    const addresses = isIP(hostname)
      ? [{ address: hostname, family: isIP(hostname) }]
      : await Promise.race([
          lookup(hostname, { all: true, verbatim: true }),
          new Promise<never>((_, reject) =>
            signal.addEventListener(
              'abort',
              () => reject(Error('Waktu pemeriksaan habis')),
              { once: true },
            ),
          ),
        ]);
    if (!addresses.length || addresses.some((a) => !publicAddress(a.address)))
      throw Error('Alamat lokal atau jaringan privat tidak diperiksa.');
    const address = addresses[0];
    const head = async (method: 'HEAD' | 'GET') =>
      new Promise<{
        status: number;
        headers: import('node:http').IncomingHttpHeaders;
      }>((resolve, reject) => {
        const req = request(
          url,
          {
            method,
            agent: false,
            signal,
            headers: {
              'User-Agent': 'Mahida-Link-Check/1.0',
              ...(method === 'GET' ? { Range: 'bytes=0-0' } : {}),
            },
            lookup: ((
              _host: string,
              options: { all?: boolean },
              callback: (...args: unknown[]) => void,
            ) => {
              callback(
                null,
                options.all
                  ? [{ address: address.address, family: address.family }]
                  : address.address,
                address.family,
              );
            }) as import('node:net').LookupFunction,
          },
          (res) => {
            resolve({ status: res.statusCode ?? 0, headers: res.headers });
            res.destroy();
          },
        );
        req.on('error', reject);
        req.end();
      });
    let response = await head('HEAD');
    if ([405, 501].includes(response.status)) response = await head('GET');
    if (
      [301, 302, 303, 307, 308].includes(response.status) &&
      response.headers.location
    ) {
      url = new URL(response.headers.location, url);
      redirected = true;
      continue;
    }
    const range = /\/(\d+)$/.exec(
      String(response.headers['content-range'] ?? ''),
    );
    const length = Number(range?.[1] ?? response.headers['content-length']);
    return {
      status: response.status,
      size: Number.isSafeInteger(length) && length >= 0 ? length : undefined,
      type: String(response.headers['content-type'] ?? '').split(';')[0],
      redirected,
    };
  }
  throw Error('Terlalu banyak pengalihan. Periksa alamat tujuan.');
}
