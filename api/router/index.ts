// router/index.ts
import { Router, type RequestHandler } from 'express';
import login from '../auth/login';
import me from '../auth/me';
import logout from '../auth/logout';
import items from '../item/item';
import users from '../user/users';
import userInventories from '../user/user_inventories';
import recipes from '../recipes/recipes';
import roles from '../roles/roles';
import transfer from '../transfer/transfer';
import bootstrap from '../services/bootstrap';

const r = Router();

// Global CORS for all routes under this router
const CORS_ORIGIN = process.env.CORS_ORIGIN || '';
const normalizeOrigin = (s: string) => s.replace(/\/$/, '').trim();
const allowedOrigins = CORS_ORIGIN
  .split(',')
  .map((s) => normalizeOrigin(s))
  .filter(Boolean);
r.use((req, res, next) => {
  const reqOriginRaw = req.headers.origin as string | undefined;
  const reqOrigin = reqOriginRaw ? normalizeOrigin(reqOriginRaw) : undefined;
  if (allowedOrigins.length && reqOrigin && allowedOrigins.includes(reqOrigin)) {
    res.header('Access-Control-Allow-Origin', reqOrigin);
    res.header('Vary', 'Origin');
  } else if (allowedOrigins.length === 1) {
    res.header('Access-Control-Allow-Origin', allowedOrigins[0]);
  }
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(204).end();
  next();
});

// Adapter to align vercel-style handlers to express types
const wrap = (fn: any) => (fn as unknown) as RequestHandler;

// Auth
r.post('/login', wrap(login));
r.get('/me', wrap(me));
r.post('/logout', wrap(logout));

// Items
r.get('/item', wrap(items));
r.get('/items', wrap(items));
r.delete('/items', wrap(items));
r.post('/items', wrap(items));
r.patch('/items', wrap(items));

// Users
r.post('/users', wrap(users));
r.get('/users', wrap(users));
r.delete('/users', wrap(users));
r.patch('/users', wrap(users));
// User inventories
r.get('/users/:id/inventories', wrap(userInventories));

// Recipes
r.get('/recipes', wrap(recipes));
r.post('/recipes', wrap(recipes));

// Transfers
r.get('/transfer', wrap(transfer));
r.post('/transfer', wrap(transfer));
r.patch('/transfer', wrap(transfer));
r.delete('/transfer', wrap(transfer));

// Roles
r.get('/roles', wrap(roles));

// Bootstrap
r.get('/bootstrap', wrap(bootstrap));

export default r;


