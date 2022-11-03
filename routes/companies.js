"user strict";

const express = require("express");
const router = new express.Router();
const db = require("../db");
const { NotFoundError } = require("../expressError");

/**
 * Queries database for all companies and returns JSON object like
 * { companies: {
 *     [{code, name}, ...]
 *   }
 * }
 */
router.get('/', async function(req, res) {
  const result = await db.query(
    `SELECT code, name
      FROM companies
    `
  );
  const companies = result.rows;
  return res.json({companies});
});

/**
 * Queries database for company matching query string and returns JSON object like
 * { company:
 *     {code, name}
 * }
 */
router.get('/:code', async function(req, res) {
  const code = req.params.code;
  const result = await db.query(
    `SELECT code, name, description
      FROM companies
      WHERE code = $1
    `, [code]
  );

  if (result.rows.length === 0) throw new NotFoundError('Company does not exist');

  const company = result.rows[0];
  return res.json({company})
});

/**
 * Inserts new row into database and returns JSON Object
 * Input: (JSON Object)
 *  {code, name, description}
 * Output: (JSON Object)
 *  {company: {code, name, description}}
 */
router.post('/', async function(req, res) {
  const {code, name, description} = req.body;
  const result = await db.query(
    `INSERT INTO companies
      VALUES ($1, $2, $3)
      RETURNING code, name, description
    `, [code, name, description]
  );
  const company = result.rows[0];
  return res.json({company});
});


module.exports = router;