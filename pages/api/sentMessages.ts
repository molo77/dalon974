import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prismaClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { from } = req.query;
  if (!from || typeof from !== 'string') {
    return res.status(400).json({ error: 'Missing from parameter' });
  }
  try {
    const sentMessages = await prisma.message.findMany({
      where: { senderId: from }, // Replace 'senderId' with the actual field name in your schema
      orderBy: { createdAt: 'desc' },
    });
    return res.status(200).json({ sentMessages });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch sent messages' });
  }
}
