/**
 * Limon Bandit — order webhook for Google Sheets.
 *
 * Paste this into Extensions → Apps Script on the sheet that logistics work
 * from, then deploy it as a Web App. See scripts/SHEET-SETUP.md.
 *
 * It appends one row per order. Logistics read this top to bottom on a phone,
 * so one line per parcel is the shape that works — the basket is flattened
 * into a single cell rather than spread over a row per item.
 */

/** Must match SHEETS_WEBHOOK_SECRET in the site's .env. Change both together. */
var SHARED_SECRET = 'CHANGE-ME';

/** The tab within the spreadsheet. Created on first use if absent. */
var SHEET_NAME = 'Orders';

var HEADERS = [
  'Reference',
  'Placed at',
  'Status',
  'Name',
  'Phone',
  'Email',
  'Address',
  'City',
  'PIN',
  'Items',
  'Item count',
  'Subtotal',
  'Shipping',
  'Discount',
  'Code',
  'Total to collect',
  'Payment',
  'Payment status',
  'Note',
];

/** Contact-form enquiries get their own tab — see doPost. */
var ENQUIRY_SHEET_NAME = 'Enquiries';

var ENQUIRY_HEADERS = [
  'Reference',
  'Received at',
  'About',
  'Name',
  'Phone',
  'Email',
  'Message',
  'Sent from',
  'Status',
];

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return json({ ok: false, error: 'empty request' });
    }

    var body = JSON.parse(e.postData.contents);

    // Without this the URL is an open endpoint: anyone who learns it could
    // append rows, and logistics pack from these rows.
    if (SHARED_SECRET && body.secret !== SHARED_SECRET) {
      return json({ ok: false, error: 'bad secret' });
    }

    // Enquiries from the contact form share this URL but must never land in
    // the Orders tab: logistics pack from that tab top to bottom, and an
    // enquiry there is a row with no address and a total of zero that
    // somebody might try to ship. They get a tab of their own.
    if (body.kind === 'enquiry') {
      var enq = getTab(ENQUIRY_SHEET_NAME, ENQUIRY_HEADERS);
      if (body.reference && findRow(enq, body.reference) > 0) {
        return json({ ok: true, duplicate: true });
      }
      enq.appendRow([
        body.reference || '',
        body.received_at ? new Date(body.received_at) : new Date(),
        body.intent || '',
        body.name || '',
        body.phone ? "'" + body.phone : '',
        body.email || '',
        body.message || '',
        body.source || '',
        'new',
      ]);
      return json({ ok: true });
    }

    var sheet = getSheet();

    // Idempotent: a retried sync must not produce a second parcel.
    if (body.reference && findRow(sheet, body.reference) > 0) {
      return json({ ok: true, duplicate: true });
    }

    sheet.appendRow([
      body.reference || '',
      body.placed_at ? new Date(body.placed_at) : new Date(),
      body.status || 'received',
      body.name || '',
      // Leading apostrophe keeps +91… a string. Without it Sheets reads the
      // leading + as a formula and the cell becomes an error.
      body.phone ? "'" + body.phone : '',
      body.email || '',
      body.address || '',
      body.city || '',
      body.postcode ? "'" + body.postcode : '',
      body.items || '',
      body.item_count || 0,
      body.subtotal_inr || 0,
      body.shipping_inr || 0,
      body.discount_inr || 0,
      body.discount_code || '',
      body.total_inr || 0,
      body.payment_method || 'cod',
      body.payment_status || 'pending',
      body.note || '',
    ]);

    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

/** Deployment check — opening the /exec URL in a browser should say this. */
function doGet() {
  return json({ ok: true, service: 'limon-bandit-orders' });
}

function getSheet() {
  var sheet = getTab(SHEET_NAME, HEADERS);
  if (sheet.getLastRow() === 1) {
    sheet.setColumnWidth(10, 320); // Items — the widest cell by far
    sheet.setColumnWidth(7, 280); // Address
  }
  return sheet;
}

/** A tab by name, created with a bold frozen header row on first use. */
function getTab(name, headers) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

/** Row index of an existing reference, or -1. */
function findRow(sheet, reference) {
  var last = sheet.getLastRow();
  if (last < 2) return -1;
  var refs = sheet.getRange(2, 1, last - 1, 1).getValues();
  for (var i = 0; i < refs.length; i++) {
    if (String(refs[i][0]) === String(reference)) return i + 2;
  }
  return -1;
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON,
  );
}
