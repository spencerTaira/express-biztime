"use strict";
const express = require("express");
const router = new express.Router();
const db = require("../db");
const { NotFoundError, BadRequestError } = require("../expressError");

/**
 * Queries database for all invoices and returns JSON object like
 * { invoices: {
 *     [{id, comp_code}, ...]
 *   }
 * }
 */
router.get('/', async function (req, res) {

  const result = await db.query(
    `SELECT id, comp_code
      FROM invoices
      ORDER BY comp_code
    `
  );

  const invoices = result.rows;
  return res.json({ invoices });
});

/**
 * Returns an object of a given invoice with JSON object like
 * {
 *  invoice: {
 *    id, amt, paid, add_date, paid_date,
 *    company: {
 *      code, name, description
 *    }
 *  }
 * }
 * If invoice cannot be found returns 404
 */

router.get('/:id', async function (req, res) {

  const id = req.params.id;

  const iResult = await db.query(
    `
    SELECT id, amt, paid, add_date, paid_date
      FROM invoices
      WHERE id = $1
    `, [id]
  );

  const invoice = iResult.rows[0];

  if (!invoice) throw new NotFoundError(`Invoice id ${id} Not Found`);

  const cResult = await db.query(
    `
    SELECT code, name, description
      FROM invoices
        JOIN companies ON comp_code = code
      WHERE id = $1
    `, [id]
  );

  invoice.company = cResult.rows[0];
  return res.json({ invoice });

});

/**
 * Adds a new record to the invoice table
 *  Input: JSON Object
 *    {comp_code, amt}
 *  Output: JSON Object
 *    {
 *      invoice: {
 *        id, comp_code, amt, paid, add_date, paid_date
 *      }
 *    }
 */
// Mispell name of company when adding an invoice, it'll raise 500 code
// 1. Precheck if company code is valid
// 2. Try try catch to check if inputs are valid
router.post('/', async function (req, res) {

  if (req.body === undefined) throw new BadRequestError();

  const { comp_code, amt } = req.body;
  try{
    const result = await db.query(
      `
      INSERT INTO invoices (comp_code, amt)
      VALUES ($1, $2)
      RETURNING id, comp_code, amt, paid, add_date, paid_date
      `, [comp_code, amt]
    );
    const invoice = result.rows[0];
    return res.json({ invoice });
  } catch (error) {
    console.log(error)
    throw new NotFoundError(error.detail) // not found error
  }
});

/**
 * Modify data based on invoice ID
 *  Input: JSON Object
 *    {amt}
 *  Output: JSON Object
 *    {
 *      invoice: {
 *        id, comp_code, amt, paid, add_date, paid_date
 *      }
 *    }
 */
router.put('/:id', async function (req, res) {

  const id = Number(req.params.id);

  if (req.body === undefined) throw new BadRequestError();

  const { amt } = req.body;

  const result = await db.query(
    `UPDATE invoices
    SET amt = $2
    WHERE id = $1
    RETURNING id, comp_code, amt, paid, add_date, paid_date
    `, [id, amt]
  );

  const invoice = result.rows[0];

  if (!invoice) throw new NotFoundError(`Invoice id ${id} Not Found`);

  return res.json({ invoice });
});


/*
 * Delete company data based on given code
 *  Output: (JSON Object)
 *  {status: deleted}
*/
router.delete('/:id', async function (req, res) {

  const id = Number(req.params.id);

  const result = await db.query(
    `DELETE FROM invoices
   WHERE id = $1
   RETURNING id, comp_code, amt, paid, add_date, paid_date `,
    [id]
  );

  if (!result.rows[0]) {
    throw new NotFoundError(`Not found: ${id}`);
  }
  return res.json({ "status": "deleted" });
});




module.exports = router;