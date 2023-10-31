const express = require('express');
const cors = require('cors');
const session = require('express-session');
const app = express();

const PORT = 4000

const artworkController = require('./controller/gallery');
const userController = require('./controller/user');

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: 'user_session',
    resave: false,
    saveUninitialized: true,
}))

app.use('/gallery', artworkController);
app.use('/user', userController);

app.get('/', (req, res) => {
    res.send('<h1>Hello Express Server</h1>');
});

app.listen(PORT, () => {
    console.log(`Artwork API Server listening on port ${PORT}`);
})