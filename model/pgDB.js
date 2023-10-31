const { Pool } = require('pg')

let pool = new Pool({
    host: "localhost",
    user: "postgres",
    port: 5432,
    password: "123456",
    database: "ArtGallery_Project"
})

module.exports = pool