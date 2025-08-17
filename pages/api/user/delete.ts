import type { NextApiRequest, NextApiResponse } from 'next';
import { deleteUserDoc } from '@/lib/services/userService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { id } = req.body;
  if (!id) {
    return res.status(400).json({ error: 'Missing id' });
  }
  try {
    await deleteUserDoc(id);
    return res.status(200).json({ ok: true });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete user' });
  }
}
