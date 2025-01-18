import {Router} from 'express'
import fs from 'fs'
import {
    registerUser,
    loginUser } from '../controller/user.controller.js'
import upload from '../middleware/multer.middleware.js'