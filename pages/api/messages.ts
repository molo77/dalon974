import type { NextApiRequest, NextApiResponse } from 'next';
import { listMessagesForOwner } from '@/lib/services/messageService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { owner } = req.query;
  if (!owner || typeof owner !== 'string') {
    return res.status(400).json({ error: 'Missing owner parameter' });
  }
  try {
    const messages = await listMessagesForOwner(owner);
    return res.status(200).json({ messages });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch messages' });
  }
}
