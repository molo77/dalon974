import type { NextApiRequest, NextApiResponse } from 'next';
import { updateUserDoc } from '@/lib/services/userService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { id, email, displayName, role, ville, telephone } = req.body;
  if (!id || !email || !role) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    await updateUserDoc(id, { email, displayName, role, ville, telephone });
    return res.status(200).json({ ok: true });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update user' });
  }
}
