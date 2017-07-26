# insurance-censor

My brother worked for a company who needed to save insurance data. The insurance would send his company all the claims for all the individuals in a single file.
The employee's would then need to scan, digitize, these documents and save only that individual's insurance information in to their digital folder.

A print out would be given, in this print out would be insurance details in no specific order:
--------
David - Age 28 - Paid: $25
--------
Teresa - Age 29 - Paid: $99
--------
David - Age 28 - Paid: $799
--------

The utility in this repo is a frontend HTML/JS application. It will accept multiple upload pdfs.
Then the user can highlight sections related to an individual.
Then save the full document, with the other's blacked out.

Save David
--------
David - Age 28 - Paid: $25
--------
===========================
--------
David - Age 28 - Paid: $799
--------

Save Teresa
--------
==========================
--------
Teresa - Age 29 - Paid: $99
--------
==========================
--------
