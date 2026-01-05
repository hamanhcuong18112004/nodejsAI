const mysql = require("mysql2/promise");

async function testConnection() {
    try {
        const pool = mysql.createPool({
            host: "localhost",
            port: 13306,
            user: "root",
            password: "root",
            database: "lab_iot",
            connectTimeout: 10000,
        });

        const conn = await pool.getConnection();
        console.log("✅ MySQL connection successful!");

        const [rows] = await conn.query("SELECT 1 as result");
        console.log("✅ Query result:", rows);

        conn.release();
        await pool.end();
    } catch (error) {
        console.error("❌ Error:", error.message);
        console.error("Full error:", error);
    }
}

testConnection();
