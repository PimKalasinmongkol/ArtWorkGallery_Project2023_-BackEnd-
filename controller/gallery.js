const express = require('express');
const router = express.Router();
const pool = require('../model/pgDB')
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname,'../../client/src/app/img/upload')); // Define the destination folder for uploaded files
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname); // Define the filename (use a unique name to prevent overwriting)
    }
})

const upload = multer({ storage: storage });

router.get('/gallery_user/:user_username', async(request, response) => {
    let user_id = request.params.user_username

    try {
        const client = await pool.connect()
        const result = await client.query("SELECT * FROM public.gallery WHERE gallery_author = $1 ORDER BY gallery_id DESC", [user_id])
        const data = await result.rows
        client.release()
        response.status(200).json(data)
        
    } catch (error) {
        console.error('Database error:'+ error.message)
        response.status(500).json(error.message)
    }
})

router.get('/getAllUserAndGallery', async (request, response) => {
    try {
        const client = await pool.connect();
        const result = await client.query(`
        SELECT U.USER_ID, U.USER_USERNAME, U.USER_EMAIL, U.USER_PASSWORD, U.USER_ARTISTNAME, U.USER_IMAGEPROFILE, G.GALLERY_ID, G.GALLERY_TITLE, G.GALLERY_WORK, G.GALLERY_AUTHOR ,G.GALLERY_DATE FROM PUBLIC.USERS U JOIN PUBLIC.GALLERY G ON U.USER_USERNAME = G.GALLERY_AUTHOR ORDER BY gallery_id DESC`);
        const data = await result.rows;
        client.release()
        response.status(200).json(data);
    } catch (error) {
        console.error('Database error:' + error.message);
        response.status(500).json(error.message);
    }
});

router.get('/getLikeGallery/:user_id', async(request ,response) => {
    let userID = request.params.user_id
    try {
        const client = await pool.connect();
        const result = await client.query("SELECT * FROM public.gallery_like WHERE user_id = $1", [userID])
        const data = await result.rows
        client.release()
        response.status(200).json(data)
    } catch (error) {
        console.error('Database error:'+ error.message)
        response.status(500).json(error.message)
    }
})

router.get('/getAllLike', async(request,response) => {
    try {
        const client = await pool.connect();
        const result = await client.query("SELECT * FROM public.gallery_like")
        const data = await result.rows
        client.release()
        response.status(200).json(data)
    } catch (error) {
        console.error('Database error:'+ error.message)
        response.status(500).json(error.message)
    }
})

router.post('/add_like', async(request, response) => {
    let gallery_id = request.body.gallery_id
    let user_id = request.body.user_id

    try {
        const client = await pool.connect()
        const result = await client.query("INSERT INTO public.gallery_like(gallery_id, user_id ,like_date) VALUES ($1,$2,NOW())", [gallery_id, user_id])
        client.release()
    } catch (error) {
        console.error('Database error:'+ error.message)
        response.status(500).json(error.message)
    }
})

router.post('/undo_like', async(request, response) => {
    let gallery_id = request.body.gallery_id
    let user_id = request.body.user_id

    try {
        const client = await pool.connect()
        const result = await client.query("DELETE FROM public.gallery_like WHERE gallery_id = $1 AND user_id = $2",[gallery_id, user_id])
        client.release()
    } catch (error) {
        console.error('Database error:'+ error.message)
        response.status(500).json(error.message)
    }
})

router.get('/getAllComment', async(request, response) => {
    try {
        const client = await pool.connect()
        const result = await client.query("SELECT comment_id, user_id, gallery_id, comment_content, comment_date FROM public.gallery_comment")
        const data = await result.rows
        client.release()
        response.status(200).json(data)
    } catch (error) {
        console.error('Database error:'+ error.message)
        response.status(500).json(error.message)
    }
})

router.post('/add_comment', async(request, response) => {
    let gallery_id = request.body.gallery_id
    let user_id = request.body.user_id
    let comment = request.body.comment_content

    try {
        const client = await pool.connect()
        const result = await client.query("INSERT INTO public.gallery_comment(gallery_id, user_id, comment_content, comment_date) VALUES ($1 ,$2, $3, NOW())", [gallery_id, user_id, comment])
        client.release()
        response.status(200).json({
            message: 'Comment added successfully'
        })
    } catch (error) {
        console.error('Database error:'+ error.message)
        response.status(500).json(error.message)
    }
})

router.get('/all/:category', async(request, response) => {
    let filter_keyword = request.params.category

    if (filter_keyword === 'now') {
        filter_keyword = ''
        let sqlCommand = 'SELECT * FROM gallery ORDER BY gallery_id DESC';

        try {
            const client = await pool.connect()
            const result = await client.query(sqlCommand)
            const data = await result.rows
            client.release()
            response.status(200).json(data)
            
        } catch (error) {
            console.error('Database error:'+ error.message)
            response.status(500).json(error.message)
        }
    } else if (filter_keyword == 'hot') {
        filter_keyword = ''
        let sqlCommand = 'SELECT * FROM gallery';
        
        try {
            const client = await pool.connect()
            const result = await client.query(sqlCommand)
            const data = await result.rows
            client.release()
            response.status(200).json(data)
        } catch (error) {
            console.error('Database error:'+ error.message)
            response.status(500).json(error.message)
        }
    } else if (filter_keyword == 'older') {
        filter_keyword = ''
        let sqlCommand = 'SELECT * FROM gallery ORDER BY gallery_id';
        
        try {
            const client = await pool.connect()
            const result = await client.query(sqlCommand)
            const data = await result.rows
            client.release()
            response.status(200).json(data)
        } catch (error) {
            console.error('Database error:'+ error.message)
            response.status(500).json(error.message)
        }
    }
})

router.post('/createArtWork' ,upload.single('work') ,async(request ,response) => {
    let title = request.body.title
    let author = request.body.author
    let userID = request.body.userID
    let work = request.file.originalname

    try {
        const client = await pool.connect()
        const result = await client.query("INSERT INTO public.gallery(gallery_title, gallery_author, gallery_work, user_id ,gallery_date) VALUES ($1 ,$2 ,$3 ,$4 ,NOW()) RETURNING *", [title ,author ,work ,userID])
        client.release()
        response.status(200).json({
            message: 'Artwork created successfully'
        })

    } catch (error) {
        console.error('Database error: '+ error.message)
        response.status(500).json(error.message)
    }
})


module.exports = router;