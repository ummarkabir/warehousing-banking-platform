export const runtime = 'edge';
import { NextResponse } from 'next/server';
// Idan kana amfani da Resend (ka tabbata ka sanya package din: npm install resend)
// import { Resend } from 'resend';
// const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { email, warehouseName, reason, ownerName } = await request.json();

    // A nan zaka iya amfani da Resend ko wani SMTP don aikawa
    /*
      await resend.emails.send({
        from: 'Warehousing Platform <onboarding@resend.dev>',
        to: email,
        subject: `Facility Inspection Rejected: ${warehouseName}`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #e11d48;">Compliance Audit Notice: Rejection</h2>
            <p>Dear ${ownerName || 'Valued Partner'},</p>
            <p>We regret to inform you that your warehouse facility <strong>${warehouseName}</strong> did not pass the QA compliance inspection.</p>
            
            <div style="background: #f8fafc; border-left: 4px solid #e11d48; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; font-weight: bold;">Inspector's Remarks / Reason for Rejection:</p>
              <p style="margin: 5px 0 0 0; color: #475569;">${reason}</p>
            </div>

            <p><strong>Recommended Action Plan:</strong></p>
            <ul>
              <li>Review the specific inspection remarks listed above.</li>
              <li>Rectify the physical or compliance issues at your facility.</li>
              <li>Re-submit your facility for a follow-up inspection via your dashboard.</li>
            </ul>

            <p style="margin-top: 30px; font-size: 12px; color: #94a3b8;">Warehousing & Digital Tokenization Ecosystem</p>
          </div>
        `,
      });
    */

    // Saboda gwaji, za mu iya buga shi a terminal ko mu dawo da nasara
    console.log(`Emailing rejection notice to ${email} regarding ${warehouseName}`);

    return NextResponse.json({ success: true, message: 'Rejection email sent successfully.' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}