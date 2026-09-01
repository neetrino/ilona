function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export type CvApplicationEmailPayload = {
  fullName: string;
  email: string;
  phone: string;
  message: string;
  fileNames: string[];
};

function fileRowsHtml(fileNames: string[]): string {
  return fileNames
    .map(
      (name) => `
        <tr>
          <td style="padding: 10px 14px; border: 1px solid #e5e7eb; border-radius: 10px; background: #fafafa;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td width="28" valign="middle" style="padding-right: 10px;">
                  <div style="width: 28px; height: 28px; border-radius: 8px; background: #fee2e2; color: #fb2c36; text-align: center; line-height: 28px; font-family: Arial, Helvetica, sans-serif; font-size: 11px; font-weight: 700;">
                    CV
                  </div>
                </td>
                <td valign="middle" style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; line-height: 20px; color: #101828; font-weight: 600;">
                  ${escapeHtml(name)}
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr><td style="height: 8px; font-size: 0; line-height: 0;">&nbsp;</td></tr>
      `,
    )
    .join('');
}

function infoRow(label: string, valueHtml: string): string {
  return `
    <tr>
      <td style="padding: 0 0 14px 0;">
        <div style="font-family: Arial, Helvetica, sans-serif; font-size: 12px; line-height: 16px; letter-spacing: 0.04em; text-transform: uppercase; color: #6a7282; margin-bottom: 4px;">
          ${label}
        </div>
        <div style="font-family: Arial, Helvetica, sans-serif; font-size: 16px; line-height: 24px; color: #101828; font-weight: 600;">
          ${valueHtml}
        </div>
      </td>
    </tr>
  `;
}

export function buildCvApplicationEmailHtml(payload: CvApplicationEmailPayload): string {
  const safeName = escapeHtml(payload.fullName);
  const safeEmail = escapeHtml(payload.email);
  const safePhone = escapeHtml(payload.phone);
  const safeMessage = escapeHtml(payload.message).replaceAll('\n', '<br />');
  const year = new Date().getFullYear();

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>New CV Application</title>
</head>
<body style="margin: 0; padding: 0; background: #eef2f8;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background: #eef2f8; padding: 28px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 600px; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 8px 30px rgba(16, 24, 40, 0.08);">
          <tr>
            <td style="background: #1b3ba4; padding: 28px 32px;">
              <div style="font-family: Arial, Helvetica, sans-serif; font-size: 13px; line-height: 18px; letter-spacing: 0.08em; text-transform: uppercase; color: rgba(255,255,255,0.75);">
                Ilona English Center
              </div>
              <div style="font-family: Arial, Helvetica, sans-serif; font-size: 24px; line-height: 32px; font-weight: 700; color: #ffffff; margin-top: 6px;">
                New CV Application
              </div>
              <div style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; line-height: 20px; color: rgba(255,255,255,0.85); margin-top: 8px;">
                A candidate applied through the website career form.
              </div>
            </td>
          </tr>

          <tr>
            <td style="padding: 28px 32px 8px 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background: #f5f8fd; border: 1px solid #dbe4f5; border-radius: 12px;">
                <tr>
                  <td style="padding: 18px 20px;">
                    <div style="font-family: Arial, Helvetica, sans-serif; font-size: 12px; line-height: 16px; letter-spacing: 0.04em; text-transform: uppercase; color: #6a7282;">
                      Candidate
                    </div>
                    <div style="font-family: Arial, Helvetica, sans-serif; font-size: 22px; line-height: 30px; font-weight: 700; color: #1b3ba4; margin-top: 4px;">
                      ${safeName}
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding: 20px 32px 8px 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                ${infoRow(
                  'Email',
                  `<a href="mailto:${safeEmail}" style="color: #1b3ba4; text-decoration: none;">${safeEmail}</a>`,
                )}
                ${infoRow(
                  'Phone',
                  `<a href="tel:${safePhone}" style="color: #1b3ba4; text-decoration: none;">${safePhone}</a>`,
                )}
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding: 8px 32px 20px 32px;">
              <div style="font-family: Arial, Helvetica, sans-serif; font-size: 12px; line-height: 16px; letter-spacing: 0.04em; text-transform: uppercase; color: #6a7282; margin-bottom: 8px;">
                Cover letter
              </div>
              <div style="font-family: Arial, Helvetica, sans-serif; font-size: 15px; line-height: 24px; color: #364153; background: #fafafa; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px 18px;">
                ${safeMessage}
              </div>
            </td>
          </tr>

          <tr>
            <td style="padding: 0 32px 28px 32px;">
              <div style="font-family: Arial, Helvetica, sans-serif; font-size: 12px; line-height: 16px; letter-spacing: 0.04em; text-transform: uppercase; color: #6a7282; margin-bottom: 10px;">
                Attached CV files (${payload.fileNames.length})
              </div>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                ${fileRowsHtml(payload.fileNames)}
              </table>
              <div style="font-family: Arial, Helvetica, sans-serif; font-size: 13px; line-height: 18px; color: #6a7282; margin-top: 4px;">
                Files are attached to this email.
              </div>
            </td>
          </tr>

          <tr>
            <td style="background: #f8fafc; border-top: 1px solid #e5e7eb; padding: 18px 32px;">
              <div style="font-family: Arial, Helvetica, sans-serif; font-size: 12px; line-height: 18px; color: #6a7282; text-align: center;">
                Reply directly to this email to contact the candidate.<br />
                © ${year} Ilona English Center
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export function buildCvApplicationEmailText(payload: CvApplicationEmailPayload): string {
  return [
    'New CV application — Ilona English Center',
    '',
    `Name: ${payload.fullName}`,
    `Email: ${payload.email}`,
    `Phone: ${payload.phone}`,
    '',
    'Cover letter:',
    payload.message,
    '',
    `CV files: ${payload.fileNames.join(', ')}`,
  ].join('\n');
}
