import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Pin the tracing root to this folder so a lockfile in a parent dir doesn't
  // confuse the build (silences the "inferred workspace root" warning).
  outputFileTracingRoot: here,
};

export default nextConfig;
