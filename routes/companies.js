"use strict";

const express = require("express");
const router = new express.Router();
const db = require("../db");
const { NotFoundError, BadRequestError } = require("../expressError");

/**
 * Queries database for all companies and returns JSON object like
 * { companies: {
 *     [{code, name}, ...]
 *   }
 * }
 */
// ordering large quantity of data
router.get('/', async function (req, res) {
  const result = await db.query(
    `SELECT code, name
      FROM companies
      ORDER BY name
    `
  );

  const companies = result.rows;
  return res.json({ companies });
});

/**
 * Queries database for company and all of its invoices
 * matching query string and returns JSON object like
 * { company:
 *     {code, name, description,
 *      invoices: [id,......]}}
 */

router.get('/:code', async function (req, res) {
  const code = req.params.code;

  const cResult = await db.query(
    `SELECT code, name, description
      FROM companies
      WHERE code = $1
    `, [code]
  );

  const company = cResult.rows[0];
  if (!company) throw new NotFoundError('Company does not exist');

  const iResults = await db.query(
    `
    SELECT id, amt, paid, add_date, paid_date
      FROM invoices
        JOIN companies ON comp_code = code
      WHERE code = $1
    `, [code]
  );

  company.invoices = iResults.rows;
  return res.json({ company });
});

/**
 * Inserts new row into database and returns JSON Object
 * Input: (JSON Object)
 *  {code, name, description}
 * Output: (JSON Object)
 *  {company: {code, name, description}}
 */
// return a 201, linebreaks
router.post('/', async function (req, res) {
  if (req.body === undefined) throw new BadRequestError();

  const { code, name, description } = req.body;

  const result = await db.query(
    `INSERT INTO companies
      VALUES ($1, $2, $3)
      RETURNING code, name, description
    `, [code, name, description]
  );

  const company = result.rows[0];
  return res.status(201).json({ company });
});

/*
 * Modify company data based on given code
 * Input: (JSON Object)
 *   {name, description}
 *  Output: (JSON Object)
 *  {company: {code, name, description}}
*/
router.put('/:code', async function (req, res) {
  if (req.body === undefined) throw new BadRequestError();

  const code = req.params.code;
  const { name, description } = req.body;

  const result = await db.query(
    `UPDATE companies
      SET name = $2 , description = $3
      WHERE code = $1
      RETURNING code, name, description
    `, [code, name, description]
  );

  const company = result.rows[0];

  if (!company) throw new NotFoundError(`Not found: ${code}`);
  return res.json({ company });
});

/*
 * Delete company data based on given code
 *  Output: (JSON Object)
 *  {status: deleted}
*/
// return company of code you deleted, returning keyword in updating data
router.delete('/:code', async function (req, res) {

  const code = req.params.code;

  const result = await db.query(
    `DELETE FROM companies
   WHERE code= $1
    RETURNING code, name, description`,
    [code]
  );

  if (!result.rows[0]) {
    throw new NotFoundError(`Not found: ${code}`);
  }
  return res.json({ "status": "deleted" });
});



module.exports = router;