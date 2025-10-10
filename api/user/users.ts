import { VercelRequest as qww, VercelResponse } from '@vercel/node';
import { prisma } from '../lib/prisma';

export default async function users(req: qww, res: VercelResponse) {
  console.log(req.method, req.url, req.body);

  switch (req.method) {
    case 'GET':
      try {
        const data = await prisma.user.findMany();
        return res.status(200).json({ data });
      } catch (error) {
        console.log(`GET /api/user/users failed: ${error.message}`);
        return res.status(500).json({ error: 'Internal Server Error' });
      }
    case 'POST':
      try {
        const { name, phone, password } = req.body as {
          name: string;
          phone: string;
          password: string;
        };
        if (!name || !phone || !password) {
          return res.status(400).json({ error: 'name, phone and password are required' });
        }
        const user = await prisma.user.create({
          data: {
            name,
            phone,
            password,
          },
        });
        return res.status(201).json({ user });
      } catch (error) {
        console.log(`POST /api/user/users failed: ${error.message}`);
        return res.status(500).json({ error: 'Internal Server Error' });
      }
    case 'DELETE':
      try {
        const { id } = req.body;
        if (!id) return res.status(400).json({ error: 'id is required' });
        const selectedUser = await prisma.user.delete({
          where: { id },
        });
        return res.status(200).json({ selectedUser });
      } catch (error) {
        console.log(`DELETE /api/user/users failed: ${error.message}`);
        return res.status(500).json({ error: 'Internal Server Error' });
      }
    case 'PATCH':
      try {
        const { id, name, phone, password } = req.body as {
          id: string;
          name?: string;
          phone?: string;
          password?: string;
        };
        if (!id) return res.status(400).json({ error: 'id is required' });
        const data: Partial<User> = {};
        if (name) data.name = name;
        if (phone) data.phone = phone;
        if (password) data.password = password;
        const users = await prisma.user.update({
          where: { id },
          data,
        });
        return res.status(200).json({ users });
      } catch (error) {
        console.log(`PATCH /api/user/users failed: ${error.message}`);
        return res.status(500).json({ error: 'Internal Server Error' });
      }
    default:
      return res.status(404).json({ error: 'Current Method is not define' });
  }
}
