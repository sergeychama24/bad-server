import { Request, Response, NextFunction, Express } from 'express'
import multer, { FileFilterCallback } from 'multer'
import path, { join } from 'path'
import { v4 as uuidv4 } from 'uuid'
import fs, { existsSync, mkdirSync } from 'fs'
import sharp from 'sharp'
import { fileTypeFromBuffer } from 'file-type'
import BadRequestError from '../errors/bad-request-error'

type DestinationCallback = (error: Error | null, destination: string) => void
type FileNameCallback = (error: Error | null, filename: string) => void

const MIN_FILE_SIZE = 2 * 1024
const MAX_FILE_SIZE = 10 * 1024 * 1024

const storage = multer.diskStorage({
    destination: (
        _req: Request,
        _file: Express.Multer.File,
        cb: DestinationCallback
    ) => {
        const uploadPath = join(
            __dirname,
            process.env.UPLOAD_PATH_TEMP
                ? `../public/${process.env.UPLOAD_PATH_TEMP}`
                : '../public'
        )

        if (!existsSync(uploadPath)) {
            mkdirSync(uploadPath, { recursive: true })
        }

        cb(null, uploadPath)
    },

    filename: (
        _req: Request,
        file: Express.Multer.File,
        cb: FileNameCallback
    ) => {
        const ext = file.originalname.split('.').pop()
        cb(null, `${uuidv4()}.${ext}`)
    },
})

const types = [
    'image/png',
    'image/jpg',
    'image/jpeg',
    'image/gif',
    'image/svg+xml',
]

const fileFilter = async (
    _req: Request,
    file: Express.Multer.File,
    cb: FileFilterCallback
) => {
    if (!types.includes(file.mimetype)) {
        return cb(null, false)
    }

    const buffer = fs.readFileSync(file.path)
    const type = await fileTypeFromBuffer(buffer)
    if (!type || !types.includes(type.mime)) {
        return cb(null, false)
    }

    return cb(null, true)
}

export const minFileSize = (
    req: Request,
    _res: Response,
    next: NextFunction
) => {
    if (
        req.headers['content-length'] &&
        parseInt(req.headers['content-length'], 10) < MIN_FILE_SIZE
    ) {
        return next(
            new BadRequestError(
                `Размер файла должен быть больше ${MIN_FILE_SIZE} байт`
            )
        )
    }
    next()
}

export const imageContent = async (
    req: Request,
    _res: Response,
    next: NextFunction
) => {
    if (req.file) {
        const filePath = path.join(
            __dirname,
            `../public/${process.env.UPLOAD_PATH_TEMP}`,
            req.file.filename
        )
        try {
            const buffer = await fs.promises.readFile(filePath)
            const metadata = await sharp(buffer).metadata()
            if (!metadata.width || !metadata.height) {
                return next(
                    new BadRequestError('Невалидный контент изображения')
                )
            }
        } catch (error) {
            return next(new BadRequestError('Невалидный контент изображения'))
        } finally {
            await fs.promises.unlink(filePath).catch(() => {})
        }
    }
    next()
}

export const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: MAX_FILE_SIZE,
    },
})
