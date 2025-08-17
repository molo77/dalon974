import type { NextApiRequest, NextApiResponse } from 'next';
import { createUserDoc } from '@/lib/services/userService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { email, displayName, role, ville, telephone } = req.body;
  if (!email || !role) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    const user = await createUserDoc({ email, displayName, role, ville, telephone });
    return res.status(200).json({ user });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to create user' });
  }
}
