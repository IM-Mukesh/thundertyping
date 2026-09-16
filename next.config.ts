import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * Lets a phone on the same Wi-Fi load the dev server for real-device testing.
   *
   * Next blocks cross-origin requests to dev-only assets (HMR, the error
   * overlay) by default, allowing only localhost and the hostname the server
   * started with. Hitting the machine's LAN IP from a phone is a different
   * hostname, so HMR is refused and the page loads but never hot-reloads.
   *
   * Only the Origin/Referer *hostname* is matched — scheme, port, path and
   * query are ignored — so these entries carry no `http://` and no port, and
   * stay correct regardless of which port `next dev` lands on. A single `*`
   * stands in for exactly one label, so each entry below covers every host on
   * that private subnet and survives a DHCP lease change.
   *
   * Dev-only: this has no effect on `next build` or the Vercel deployment.
   * The ranges are the RFC 1918 private ones, so it cannot expose the dev
   * server to a public origin.
   */
  allowedDevOrigins: ["10.254.181.*", "192.168.0.*", "192.168.1.*"],
};

export default nextConfig;
