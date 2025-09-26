// auth/router.ts
import { Router } from 'express'
import login from '../auth/login'
import me from '../auth/me'
import items from '../item/item'
import createUser from '../user/createUser'
import getUsers from '../user/getUsers'
import getUser from '../user/getUsers'        // если хочешь получать одного
import deleteUser from '../user/deleteUser' // наш новый обработчик удаления
import item from '../item/item'

const r = Router()

r.post('/login', login)
r.get('/me', me)
r.get('/item', items)

// USERS
r.post('/users', createUser)       // создание -> POST
r.get('/users', getUsers)          // список -> GET
r.get('/users/:id', getUser)       // получить одного -> GET
r.delete('/users/:id', deleteUser) // удалить -> DELETE


// ITEM
r.get('/items', item)

export default r
