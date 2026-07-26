// Consent disclosure texts and versions.
// The `hash` field is a stable identifier for the exact text a signer saw.
// It's computed at first-use runtime and cached in memory; the server also
// re-computes it from `text` to verify what was signed.

export type ConsentKind =
  | "fcra_disclosure"
  | "fcra_summary_of_rights"
  | "background_check_authorization"
  | "investigative_consumer_report"
  | "continuous_monitoring"
  | "mvr_authorization"
  | "state_addendum_ca"
  | "state_addendum_ny"
  | "state_addendum_wa"
  | "state_addendum_ma"
  | "state_addendum_nj"
  | "state_addendum_mn";

export type ConsentDoc = {
  kind: ConsentKind;
  version: string;
  title: string;
  state?: string;
  required: boolean;
  onlyIf?: "driver";
  text: string;
};

const FCRA_DISCLOSURE = `DISCLOSURE REGARDING BACKGROUND INVESTIGATION

CareMatch ("the Company") may obtain information about you from a consumer reporting agency for employment and eligibility-to-serve purposes. Thus, you may be the subject of a "consumer report" and/or an "investigative consumer report" which may include information about your character, general reputation, personal characteristics, and/or mode of living, and which can involve personal interviews with sources such as your neighbors, friends, or associates. These reports may contain information regarding your criminal history, social security verification, motor vehicle records, verification of your education or employment history, or other background checks.

You have the right, upon written request made within a reasonable time, to request whether a consumer report has been run about you, and disclosure of the nature and scope of any investigative consumer report and to request a copy of your report. Please be advised that the nature and scope of the most common form of investigative consumer report obtained with regard to applicants for employment is an investigation into your education and/or employment history conducted by CareMatch's chosen background check vendor or another outside organization.

The scope of this notice and authorization is all-encompassing, allowing CareMatch to obtain from any outside organization all manner of consumer reports and investigative consumer reports now and, if you are engaged, throughout the course of your engagement to the extent permitted by law.`;

const FCRA_SUMMARY = `A SUMMARY OF YOUR RIGHTS UNDER THE FAIR CREDIT REPORTING ACT

The federal Fair Credit Reporting Act (FCRA) promotes the accuracy, fairness, and privacy of information in the files of consumer reporting agencies. There are many types of consumer reporting agencies, including credit bureaus and specialty agencies (such as agencies that sell information about check writing histories, medical records, and rental history records). Here is a summary of your major rights under the FCRA. For more information, including information about additional rights, go to www.consumerfinance.gov/learnmore or write to: Consumer Financial Protection Bureau, 1700 G Street N.W., Washington, DC 20552.

- You must be told if information in your file has been used against you.
- You have the right to know what is in your file.
- You have the right to ask for a credit score.
- You have the right to dispute incomplete or inaccurate information.
- Consumer reporting agencies must correct or delete inaccurate, incomplete, or unverifiable information.
- Consumer reporting agencies may not report outdated negative information.
- Access to your file is limited.
- You must give your consent for reports to be provided to employers.
- You may limit "prescreened" offers of credit and insurance you get based on information in your credit report.
- You have a right to place a "security freeze" on your credit report.
- You may seek damages from violators.
- Identity theft victims and active duty military personnel have additional rights.

States may enforce the FCRA, and many states have their own consumer reporting laws. In some cases, you may have more rights under state law. For more information, contact your state or local consumer protection agency or your state Attorney General.`;

const BACKGROUND_CHECK_AUTH = `AUTHORIZATION OF BACKGROUND INVESTIGATION

I acknowledge receipt of the separate document entitled DISCLOSURE REGARDING BACKGROUND INVESTIGATION and A SUMMARY OF YOUR RIGHTS UNDER THE FAIR CREDIT REPORTING ACT and certify that I have read and understood both of those documents. I hereby authorize CareMatch and its designated background check vendor to obtain and use consumer reports and investigative consumer reports about me for employment / eligibility-to-serve purposes throughout my relationship with CareMatch, to the extent permitted by law.

By signing below, I authorize the release to CareMatch and its background check vendor of any and all information concerning my previous employment, education, and other information they may have about me, from other individuals and sources including but not limited to former employers, educational institutions, and courts of record. I also agree that a facsimile ("fax"), electronic, or photographic copy of this Authorization shall be as valid as the original.`;

const INVESTIGATIVE_NOTICE = `NOTICE REGARDING INVESTIGATIVE CONSUMER REPORTS

The report obtained about you may be an "investigative consumer report" that includes information as to your character, general reputation, personal characteristics, and mode of living. This information may be obtained through personal interviews with sources such as your neighbors, friends, associates, current or former employers, or others with whom you are acquainted. You have the right to request additional information concerning the nature and scope of the investigation.`;

const CONTINUOUS_MONITORING = `CONTINUOUS CRIMINAL MONITORING CONSENT

I authorize CareMatch and its background check vendor to continuously monitor public criminal records databases for new records associated with my identity for as long as I am an active caregiver on the platform. I understand that this is a distinct check from my initial background report and that I may withdraw this consent at any time by contacting CareMatch, after which I understand my active status on the platform may be affected.`;

const MVR_AUTH = `MOTOR VEHICLE RECORD (MVR) AUTHORIZATION

I authorize CareMatch and its background check vendor to obtain my motor vehicle record from the state in which I hold a driver's license, for the purpose of evaluating my eligibility to provide transportation and errand services on the platform. I understand this authorization will remain in effect for the duration of my active relationship with CareMatch to the extent permitted by law.`;

const STATE_CA = `CALIFORNIA APPLICANT NOTICE (Investigative Consumer Reporting Agencies Act — ICRAA)

CareMatch may obtain an investigative consumer report on you from an investigative consumer reporting agency. The reporting agency is Checkr, Inc., One Montgomery St., Suite 2400, San Francisco, CA 94104, https://checkr.com. The report may include information on your character, general reputation, personal characteristics, and mode of living. You have the right, upon written request made within a reasonable time, to receive a copy of any such report at no charge, and to visually inspect the reporting agency's files, at no charge, upon reasonable notice. Please check the box below if you would like to receive a copy of any report prepared about you.`;

const STATE_NY = `NEW YORK APPLICANT NOTICE

By signing below, you acknowledge that you have received Article 23-A of the New York Correction Law, which governs the use of criminal history information in employment decisions in New York. You have the right, upon request, to receive a copy of any consumer report or investigative consumer report obtained about you.`;

const STATE_WA = `WASHINGTON APPLICANT NOTICE

You have the right, upon request, to receive from CareMatch a written summary of the nature and scope of the background check to be performed. If you would like to receive this summary, please contact CareMatch.`;

const STATE_MA = `MASSACHUSETTS APPLICANT NOTICE

Massachusetts law affords you the right to know that CareMatch may request a CORI (Criminal Offender Record Information) report about you. If a CORI report is obtained, you will receive a copy before any decision is made based upon it. You may request a copy of CareMatch's CORI policy at any time.`;

const STATE_NJ = `NEW JERSEY APPLICANT NOTICE (Opportunity to Compete Act)

Under New Jersey law, CareMatch will not inquire about your criminal record during the initial application process. If a background check is later obtained and reveals a criminal record, you will have the opportunity to review and respond to that information before any final decision is made.`;

const STATE_MN = `MINNESOTA APPLICANT NOTICE

Under Minnesota law you have the right to obtain, from the consumer reporting agency, a copy of any consumer report prepared about you. Please check the box on the authorization form if you would like a copy of that report sent to you.`;

export const CONSENT_DOCS: ConsentDoc[] = [
  { kind: "fcra_disclosure", version: "2024-01", title: "Disclosure regarding background investigation", required: true, text: FCRA_DISCLOSURE },
  { kind: "fcra_summary_of_rights", version: "2018-09", title: "Summary of your rights under the FCRA", required: true, text: FCRA_SUMMARY },
  { kind: "background_check_authorization", version: "2024-01", title: "Authorization for background check", required: true, text: BACKGROUND_CHECK_AUTH },
  { kind: "investigative_consumer_report", version: "2024-01", title: "Investigative consumer report notice", required: true, text: INVESTIGATIVE_NOTICE },
  { kind: "continuous_monitoring", version: "2024-01", title: "Continuous criminal monitoring", required: true, text: CONTINUOUS_MONITORING },
  { kind: "mvr_authorization", version: "2024-01", title: "Motor vehicle record authorization", required: false, onlyIf: "driver", text: MVR_AUTH },
  { kind: "state_addendum_ca", version: "2024-01", state: "CA", title: "California applicant notice", required: true, text: STATE_CA },
  { kind: "state_addendum_ny", version: "2024-01", state: "NY", title: "New York applicant notice", required: true, text: STATE_NY },
  { kind: "state_addendum_wa", version: "2024-01", state: "WA", title: "Washington applicant notice", required: true, text: STATE_WA },
  { kind: "state_addendum_ma", version: "2024-01", state: "MA", title: "Massachusetts applicant notice", required: true, text: STATE_MA },
  { kind: "state_addendum_nj", version: "2024-01", state: "NJ", title: "New Jersey applicant notice", required: true, text: STATE_NJ },
  { kind: "state_addendum_mn", version: "2024-01", state: "MN", title: "Minnesota applicant notice", required: true, text: STATE_MN },
];

export function findConsentDoc(kind: ConsentKind, version: string): ConsentDoc | undefined {
  return CONSENT_DOCS.find((d) => d.kind === kind && d.version === version);
}

/** SHA-256 hex of a UTF-8 string. Works in Node and browser (Web Crypto). */
export async function hashConsentText(text: string): Promise<string> {
  const enc = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Docs the caregiver must sign, given the state they operate in and whether they'll drive. */
export function requiredConsents(state: string | null, isDriver: boolean): ConsentDoc[] {
  const out: ConsentDoc[] = [];
  for (const d of CONSENT_DOCS) {
    if (d.onlyIf === "driver" && !isDriver) continue;
    if (d.state && d.state !== (state ?? "").toUpperCase()) continue;
    out.push(d);
  }
  return out;
}
