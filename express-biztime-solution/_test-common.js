/** code common to tests. */

const db = require("./db");


async function createData() {
  await db.query("DELETE FROM invoices");
  await db.query("DELETE FROM companies");
  // force reset the invoice id serial to start w/1
  await db.query("SELECT setval('invoices_id_seq', 1, false)");

  await db.query(`
    INSERT INTO companies (code, name, description)
    VALUES ('apple', 'Apple', 'Maker of OSX.'),
           ('ibm', 'IBM', 'Big blue.')`);

  const inv = await db.query(`
    INSERT INTO invoices (comp_code, amt, paid, add_date, paid_date)
    VALUES ('apple', '100.00', FALSE, '2018-01-01', NULL),
           ('apple', '200.00', TRUE, '2018-02-01', '2018-02-02'),
           ('ibm', '300.00', FALSE, '2018-03-01', NULL)
    RETURNING id`);
}


module.exports = { createData };
