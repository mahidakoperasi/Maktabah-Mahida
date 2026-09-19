import nodemailer from 'nodemailer';

function getSmtpConfig() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? '465');
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || (user ? `Mahida Digital <${user}>` : undefined);

  if (!host || !user || !pass || !from) {
    throw new Error('SMTP configuration is incomplete');
  }

  return { host, port, user, pass, from };
}

export async function sendVerificationEmail(to: string, code: string) {
  const { host, port, user, pass, from } = getSmtpConfig();

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  });

  await transporter.sendMail({
    from,
    to,
    subject: 'Kode Verifikasi Mahida Digital',
    text: [
      'Assalamualaikum.',
      '',
      'Kode verifikasi akun Mahida Digital Anda adalah:',
      code,
      '',
      'Kode ini berlaku selama 15 menit.',
      'Jika Anda tidak merasa mendaftar, abaikan email ini.',
      '',
      'Mahida Digital',
    ].join('\n'),
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#1f2933">
        <div style="background:#174c3a;padding:24px 28px;color:#ffffff">
          <div style="font-size:12px;letter-spacing:.16em;text-transform:uppercase;opacity:.8">Mahida Digital</div>
          <h1 style="font-size:24px;margin:8px 0 0">Verifikasi Email</h1>
        </div>
        <div style="padding:28px;border:1px solid #e5e1d8;border-top:0;background:#fffdf8">
          <p style="margin-top:0">Assalamualaikum.</p>
          <p>Gunakan kode berikut untuk memverifikasi akun Mahida Digital Anda:</p>
          <div style="font-size:32px;font-weight:700;letter-spacing:.22em;text-align:center;padding:18px;margin:24px 0;background:#f3efe5;color:#174c3a">
            ${code}
          </div>
          <p>Kode ini berlaku selama <strong>15 menit</strong>.</p>
          <p style="color:#68736d;font-size:13px;margin-bottom:0">Jika Anda tidak merasa mendaftar, abaikan email ini.</p>
        </div>
      </div>
    `,
  });
}
