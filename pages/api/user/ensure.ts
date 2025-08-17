import type { NextApiRequest, NextApiResponse } from 'next';
import { ensureUserDoc } from '@/lib/services/userService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { uid, email, displayName, role, providerId } = req.body;
  if (!uid || !email || !role || !providerId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    await ensureUserDoc(uid, { email, displayName, role, providerId });
    return res.status(200).json({ ok: true });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to ensure user doc' });
  }
}
