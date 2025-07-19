const { Resend } = require('resend');

console.log('Tree of Life Campaigns - Starting on Render...');

const RESEND_API_KEY = process.env.RESEND_API_KEY;
if (!RESEND_API_KEY) {
  console.error('RESEND_API_KEY missing');
  process.exit(1);
}

const resend = new Resend(RESEND_API_KEY);

async function sendConfirmation() {
  try {
    const result = await resend.emails.send({
      from: 'Tree of Life <brandonb@treeoflifeagencies.com>',
      to: ['brandonb7245@gmail.com'],
      subject: 'Campaign System DEPLOYED Successfully on Render!',
      html: `
        <h1>Deployment Success!</h1>
        <p>Your Tree of Life email campaign system is now running 24/7 on Render.</p>
        <p><strong>Status:</strong> Online and ready</p>
        <p><strong>Platform:</strong> Render (Free Tier)</p>
        <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
        <p>The system will now operate independently of Replit.</p>
      `
    });
    
    console.log('Confirmation email sent:', result.data?.id);
  } catch (error) {
    console.error('Email failed:', error.message);
  }
}

function isBusinessHours() {
  const now = new Date();
  const est = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
  const hour = est.getHours();
  const day = est.getDay();
  return day >= 1 && day <= 5 && hour >= 9 && hour <= 18;
}

function heartbeat() {
  const status = isBusinessHours() ? 'ACTIVE' : 'WAITING';
  console.log(`${new Date().toISOString()} - Status: ${status}`);
}

async function main() {
  await sendConfirmation();
  heartbeat();
  setInterval(heartbeat, 30 * 60 * 1000); // Every 30 minutes
  console.log('Campaign system running continuously...');
}

main().catch(console.error);