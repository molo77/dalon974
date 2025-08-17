import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../lib/prismaClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid id' });
  }
  if (req.method === 'DELETE') {
    try {
      await prisma.colocProfile.delete({ where: { id } });
      return res.status(200).json({ success: true });
    } catch (e) {
      return res.status(500).json({ error: 'Server error', details: (e as Error).message });
    }
  }
  if (req.method === 'PUT') {
    try {
      const data = req.body;
      const updated = await prisma.colocProfile.update({ where: { id }, data });
      return res.status(200).json(updated);
    } catch (e) {
      return res.status(500).json({ error: 'Server error', details: (e as Error).message });
    }
  }
  if (req.method === 'GET') {
    try {
      const profile = await prisma.colocProfile.findUnique({
        where: { id },
        include: { images: true },
      });
      if (!profile) {
        return res.status(404).json({ error: 'Not found' });
      }
      return res.status(200).json(profile);
    } catch (e) {
      return res.status(500).json({ error: 'Server error', details: (e as Error).message });
    }
  }
  res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
