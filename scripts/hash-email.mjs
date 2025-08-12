#!/usr/bin/env node

import { Bytes, Checksum256 } from '@wharfkit/antelope';

function normalizeEmail(email) {
  if (typeof email !== 'string') {
    throw new TypeError('Email must be a string');
  }
  return email.trim().toLowerCase();
}

function hashEmail(email) {
  const normalized = normalizeEmail(email);
  const digest = Checksum256.hash(Bytes.from(normalized, 'utf8'));
  return digest.hexString;
}

function printUsage(exitCode = 0) {
  console.error('Usage: bun run hash:email <email>');
  process.exit(exitCode);
}

const arg = process.argv[2];

if (!arg || arg === '-h' || arg === '--help') {
  printUsage(arg ? 0 : 1);
}

try {
  const result = hashEmail(arg);
  console.log(result);
} catch (err) {
  console.error(String(err?.message || err));
  process.exit(1);
}


