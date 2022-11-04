/** Routes for invoices. */


const express = require("express");
const { NotFoundError, BadRequestError } = require("../expressError");
const db = require("../db");

let router = new express.Router();


/** GET / => list of invoices.
 *
 * =>  {invoices: [{id, comp_code}, ...]}
 *
 * */

router.get("/", async function (req, res, next) {
  const results = await db.query(
    `SELECT id, comp_code
         FROM invoices
         ORDER BY id`,
  );
  const invoices = results.rows;

  return res.json({ invoices });
});


/** GET /[id] => detail on invoice
 *
 * =>  {invoices: {id,
 *                amt,
 *                paid,
 *                add_date,
 *                paid_date,
 *                company: {code, name, description}}}
 *
 * */

router.get("/:id", async function (req, res, next) {
  let id = req.params.id;

  const results = await db.query(
    `SELECT i.id,
                i.comp_code,
                i.amt,
                i.paid,
                i.add_date,
                i.paid_date,
                c.name,
                c.description
         FROM invoices AS i
                  INNER JOIN companies AS c ON (i.comp_code = c.code)
         WHERE id = $1`,
    [id]);
  const data = results.rows[0];

  if (!data) throw new NotFoundError(`No such invoice: ${id}`);

  const invoice = {
    id: data.id,
    company: {
      code: data.comp_code,
      name: data.name,
      description: data.description,
    },
    amt: data.amt,
    paid: data.paid,
    add_date: data.add_date,
    paid_date: data.paid_date,
  };

  return res.json({ "invoice": invoice });
});


/** POST / => add new invoice
 *
 * {comp_code, amt}  =>  {id, comp_code, amt, paid, add_date, paid_date}
 *
 * */

router.post("/", async function (req, res, next) {
  if(req.body === undefined){
    throw new BadRequestError();
  }
  let { comp_code, amt } = req.body;

  const results = await db.query(
    `INSERT INTO invoices (comp_code, amt)
         VALUES ($1, $2)
         RETURNING id, comp_code, amt, paid, add_date, paid_date`,
    [comp_code, amt]);
  const invoice = results.rows[0];

  return res.json({ invoice });
});


/** PUT /[code] => update invoice
 *
 * {amt, paid}  =>  {id, comp_code, amt, paid, add_date, paid_date}
 *
 * If paying unpaid invoice, set paid_date; if marking as unpaid, clear paid_date.
 * */

router.put("/:id", async function (req, res, next) {
  if(req.body === undefined){
    throw new BadRequestError();
  }
  let { amt, paid } = req.body;
  let id = req.params.id;

  const currResults = await db.query(
    `SELECT paid, paid_date
         FROM invoices
         WHERE id = $1`,
    [id]);
  const currInvoice = currResults.rows[0];

  if (!currInvoice) throw new NotFoundError(`No such invoice: ${id}`);

  let paidDate;
  if (!currInvoice.paid_date && paid) {
    paidDate = new Date();
  } else if (!paid) {
    paidDate = null;
  } else {
    paidDate = currInvoice.paid_date;
  }

  const results = await db.query(
    `UPDATE invoices
         SET amt=$1,
             paid=$2,
             paid_date=$3
         WHERE id = $4
         RETURNING id, comp_code, amt, paid, add_date, paid_date`,
    [amt, paid, paidDate, id]);
  const invoice = results.rows[0];

  return res.json({ invoice });
});


/** DELETE /[code] => delete invoice
 *
 * => {status: "deleted"}
 *
 */

router.delete("/:id", async function (req, res, next) {
  let id = req.params.id;

  const results = await db.query(
    `DELETE
         FROM invoices
         WHERE id = $1
         RETURNING id`,
    [id]);
  const invoice = results.rows[0];

  if (!invoice) throw new NotFoundError(`No such invoice: ${id}`);

  return res.json({ status: "deleted" });
});


module.exports = router;