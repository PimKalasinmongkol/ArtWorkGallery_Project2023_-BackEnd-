const express = require('express')
const router = express.Router()
const bcrypt = require('bcrypt')
const pool = require('../model/pgDB')
const multer = require('multer')
const path = require('path')


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname ,'../../client/src/app/img/upload')); // Define the destination folder for uploaded files
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname); // Define the filename (use a unique name to prevent overwriting)
    }
});

const upload = multer({ storage: storage });

var user_session_ = {}
var loggedIn_session_ = false

router.post('/login' ,async(request ,response) => {
    let {username, password} = request.body

    try {
        const client = await pool.connect()
        const result = await client.query("SELECT * FROM public.users WHERE user_username = $1", [username])
        client.release()
        if (result.rows.length > 0) {
            const user = result.rows[0]
            const passwordMatch = await bcrypt.compare(password, user.user_password)

            if (passwordMatch) {
                request.session.user_session = user
                request.session.loggedIn_session = true
                user_session_ = request.session.user_session
                loggedIn_session_ = request.session.loggedIn_session
                response.status(200).json({
                    message: 'User logged in successfully',
                    success: true
                })
            } else {
                response.status(401).json({
                    message: 'Invalid password',
                    success: false
                })
            }
        } else {
            response.status(401).json({
                message: 'User not found',
            })
        }
    } catch (error) {
        console.error('Database error: '+ error.message)
        response.status(500).json(error.message)
    }
})

router.post('/register',async(request,response) => {
    let username = request.body.username
    let email = request.body.email
    let password = request.body.password

    password = await bcrypt.hash(password ,10)

    try {
        const client = await pool.connect()
        const result = await client.query("INSERT INTO public.users(user_username, user_email, user_password) VALUES ($1,$2,$3) RETURNING *", [username,email,password])
        client.release()
    } catch (error) {
        console.error('Database error: '+ error.message)
        response.status(500).json(error.message)
    }
})

router.get('/logout',(request,response) => {
    request.session.destroy()
    user_session_ = {}
    loggedIn_session_ = false
    response.redirect('/')
})

router.get('/session' ,(request ,response) => {
    if (loggedIn_session_ == true) {
        response.status(200).json({
            user_session: user_session_,
            loggedIn: loggedIn_session_
        })
    } else {
        response.status(401).json({
            user_session: {},
            loggedIn: loggedIn_session_
        })
    }
})

router.post('/editUserData' ,upload.single('imageprofile') ,async(request,response) => {
    let {username, email, password ,artistname ,id} = request.body

    if (password.length < 20) {
        password = await bcrypt.hash(password,10)
    }
    
    // if user is not upload file
    if (request.file == undefined) {
        try {
            const client = await pool.connect()
            const result = await client.query("UPDATE public.users SET user_username = $1, user_email = $2, user_password = $3, user_artistname = $4 WHERE user_id = $5", [username, email, password, artistname, parseInt(id)])
            const changeUserNameInGallery = await client.query("UPDATE public.gallery SET gallery_author = $1 WHERE user_id = $2", [username, id])
            client.release()
            response.status(200).json({
                message: 'User updated successfully',
                update_data: result.rows[0]
            })
        } catch (error) {
            console.error('Database error: '+ error.message)
            response.status(500).json(error.message)
        }
    } else {
        let imageprofile = request.file.originalname

        try {
            const client = await pool.connect()
            const result = await client.query("UPDATE public.users SET user_username = $1, user_email = $2, user_password = $3, user_artistname = $4, user_imageprofile = $5 WHERE user_id = $6", [username, email, password, artistname, imageprofile, parseInt(id)])
            client.release()
        } catch (error) {
            console.error('Database error: '+ error.message)
            response.status(500).json(error.message)
        }
    }
})

router.get('/getUserIdAndUserArtistname', async(request, response) => {
    try {
        const client = await pool.connect()
        const result = await client.query('SELECT user_id, user_artistname FROM public.users')
        const data = await result.rows
        client.release()
        response.status(200).json(data)
    } catch (error) {
        console.error('Database error:'+ error.message)
    }
})

module.exports = router