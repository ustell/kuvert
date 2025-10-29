// auth/router.ts
import transfer from '../transfer/transfet';
import { Router } from 'express';
import login from '../auth/login';
import me from '../auth/me';
import logout from '../auth/logout';
import items from '../item/item';
import users from '../user/users';
import item from '../item/item';
import recipes from '../recipes/recipes';
import roles from '../roles/roles.ts';

const r = Router();

r.post('/login', login);
r.get('/me', me);
r.post('/logout', logout);
r.get('/item', items);

// USERS
r.post('/users', users);
r.get('/users', users);
r.delete('/users', users);
r.patch('/users', users);

// ITEM
r.get('/items', item);
r.delete('/items', item);
r.post('/items', item);
r.patch('/items', item);

r.get('/recipes', recipes);
r.post('/recipes', recipes);

r.get('/transfer', transfer);
r.post('/transfer', transfer);
r.patch('/transfer', transfer);
r.delete('/transfer', transfer);

r.get('/roles', roles);

export default r;
