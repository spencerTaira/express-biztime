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
 *    id, amt, paid, add_date, paid_date, company: {
 * code, name, description}}
 */
module.exports = router;