/** Routes for companies. */

const express = require("express");
const slugify = require("slugify");
const { NotFoundError, BadRequestError } = require("../expressError");

const db = require("../db");

let router = new express.Router();


/** GET / => list of companies.
 *
 * =>  {companies: [{code, name, descrip}, {code, name, descrip}, ...]}
 *
 * */

router.get("/", async function (req, res, next) {
  const results = await db.query(`
      SELECT code, name
      FROM companies
      ORDER BY name`,
  );
  const companies = results.rows;

  return res.json({ companies });
});


/** GET /[code] => detail on company
 *
 * =>  {company: {code, name, descrip, invoices: [id, ...]}}
 *
 * */

router.get("/:code", async function (req, res, next) {
  let code = req.params.code;

  const compResults = await db.query(`
          SELECT code, name, description
          FROM companies
          WHERE code = $1`,
    [code],
  );
  const company = compResults.rows[0];

  if (!company) throw new NotFoundError(`No such company: ${code}`);

  const invResults = await db.query(`
          SELECT id
          FROM invoices
          WHERE comp_code = $1`,
    [code],
  );
  const invoices = invResults.rows;

  company.invoices = invoices.map(inv => inv.id);
  return res.json({ "company": company });
});


/** POST / => add new company
 *
 * {name, descrip}  =>  {company: {code, name, descrip}}
 *
 * */

router.post("/", async function (req, res, next) {
  if(req.body === undefined){
    throw new BadRequestError();
  }
  let { name, description } = req.body;
  let code = slugify(name, { lower: true });

  const results = await db.query(
    `INSERT INTO companies (code, name, description)
           VALUES ($1, $2, $3)
           RETURNING code, name, description`,
    [code, name, description]);
  const company = results.rows[0];

  return res.status(201).json({ company });
});


/** PUT /[code] => update company
 *
 * {name, descrip}  =>  {company: {code, name, descrip}}
 *
 * */

router.put("/:code", async function (req, res, next) {
  if(req.body === undefined){
    throw new BadRequestError();
  }
  let { name, description } = req.body;
  let code = req.params.code;

  const results = await db.query(
    `UPDATE companies
           SET name=$1,
               description=$2
           WHERE code = $3
           RETURNING code, name, description`,
    [name, description, code]);
  const company = results.rows[0];

  if (!company) throw new NotFoundError(`No such company: ${code}`);

  return res.json({ company });
});


/** DELETE /[code] => delete company
 *
 * => {status: "added"}
 *
 */

router.delete("/:code", async function (req, res, next) {
  let code = req.params.code;

  const results = await db.query(
    `DELETE
           FROM companies
           WHERE code = $1
           RETURNING code`,
    [code]);
  const company = results.rows[0];

  if (!company) throw new NotFoundError(`No such company: ${code}`);

  return res.json({ "status": "deleted" });
});


module.exports = router;