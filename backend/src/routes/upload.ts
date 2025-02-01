import { Router } from 'express'
import { uploadFile } from '../controllers/upload'
import { upload, minFileSize, imageContent } from '../middlewares/file'

const uploadRouter = Router()
uploadRouter.post(
    '/',
    minFileSize,
    upload.single('file'),
    imageContent,
    uploadFile
)

export default uploadRouter
