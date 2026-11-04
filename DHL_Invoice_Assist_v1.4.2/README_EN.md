# DHL Invoice Assist — version 1.4.2

Local independent Chrome extension with Arabic, English, French, German and Spanish interfaces and the supplied DHL visual assets.

## Invoice logic and interface

Billing recognition reads the invoice-number field and account/page structure, including CAIIR inbound invoices and their detail pages. A recognized DHL invoice has no single AWB field and needs no confirmation. Matched documents are displayed read-only. Installation instructions and optional Form Data have been removed from the extension screen; installation instructions remain in this external guide.

No review/confirmation step blocks export of imported paperwork. Unassigned pages are preserved at the end of the master and in a separate ZIP PDF, without guessing a customer or invoice. An incomplete import, damaged file or interrupted analysis still prevents complete export because preservation of the unread pages cannot be verified.

## Optional ETA

Upload DHL source files in the main field. Use Add ETA tax invoices — optional and choose separate PDF files. You may add/remove ETA before analysis or after an existing analysis. Later changes reanalyze automatically using cached readings while retaining edited customer names.

The exact complete Internal ID from ETA matches the DHL invoice number. AWBs, taxpayer numbers, customer names and suffix-only comparisons never establish ETA association. ETA is not a new DHL billing invoice, and absence of ETA is not a missing-document warning.

Order: complete DHL invoice pages, all matching ETA pages, then that invoice’s AWB paperwork in invoice-table order, then the next invoice. Multiple ETA versions for one ID remain included in source order, including a supplied Rejected version. The tool organizes documents without validating tax approval or selecting an authoritative version. This sample has 13 ETA pages for 12 unique invoice IDs, with two pages for CAIIR00237811.

Text extraction is preferred; local image OCR is a fallback. Small-print OCR retries use alternative segmentation, while the association still requires a complete labeled Internal ID matching an invoice exactly. Unmatched ETA is preserved at the end of the master and in Unmatched ETA.pdf inside customer ZIP.

## Customer ZIP and master PDF

ZIP by customer creates one company-named PDF containing all its complete invoices, optional matching ETA, and ordered AWB paperwork. Customer names come from the invoice summary, not detail-table headings, and remain editable. Case and extra whitespace are ignored when grouping; unknown names are separated by invoice number. Filenames are made filesystem-safe and collisions get a suffix.

Master and customer ZIP include every imported page. Invoice checkboxes apply only to the invoice-number ZIP. Customer index and matching report CSV files are included. If an AWB appears in multiple invoices, same-source invoice context is used only when consistent with that invoice’s table; unresolved evidence is retained separately.

## Preservation and capacity

Pages are copied intact with no cropping, enhancement, resizing, rasterization or OCR overlay. Image-reading crops are temporary. Scanned, faint and identical pages remain included. Each imported file occurrence is preserved independently. Master and customer ZIP audit every source-page occurrence exactly once.

No fixed file-size, file-count or page-count limits. Device/browser memory remains a practical limit. Automatic OCR adapts worker count to the device; PDF assembly uses a separate worker. Number readings and metadata, not documents/images, can persist locally for up to 30 days. Language choice also persists. Clear reading cache removes saved readings. No DHL connection, cookie/session reading or account downloads.

## Validation

New source: 337 pages, 12 invoices, 3 customers. ETA: 13 pages, automatically associated with 12 invoice IDs. Output: 350 pages, zero manual matches, zero unassigned pages. Removing ETA gives 337 pages. Customer outputs with ETA: IBM WTC EGYPT BRANCH 100 pages; EGYPTIAN TEXTILES FOR DYEING AND FINISHING 235 pages; T&C GARMENTS S.A.E 15 pages.

Every output page renders identically to its source; independent invoice/table parsing verifies complete invoice → ETA → AWB order. The old 153-page sample still matches the approved reference in the same rendered sequence.

Tests run in Node with a simulated DOM, real OCR and the actual export worker. Chrome installation/visual layout was not tested here. Five interface languages do not guarantee all global invoice layouts or unreadable scans are supported.

## Installation — external guide only

Extract DHL_Invoice_Assist_v1.4.2.zip. Open chrome://extensions, enable Developer mode, select Load unpacked, and choose the inner folder containing manifest.json. Disable the old version to avoid opening it by mistake. Open the extension from Chrome’s extensions menu. If updating an existing installation’s files, click Reload and reopen its tab.

Dependencies, OCR model and licenses are bundled in vendor. This is an independent tool, not an official DHL release.
