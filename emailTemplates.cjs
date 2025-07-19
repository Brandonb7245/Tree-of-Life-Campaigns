// emailTemplates.js - Professional email templates for Tree of Life Agencies
const fs = require('fs');

// Professional Emergency Wealth Plan Email Template
const emergencyWealthPlanTemplate = (recipientName, customContent = null) => {
  const name = recipientName || 'Valued Client';
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Emergency Wealth Plan - Tree of Life Agencies</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f4f4f4;
        }
        
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
        }
        
        .header {
            background: linear-gradient(135deg, #2c5530 0%, #4a7c59 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
        }
        
        .logo {
            max-width: 300px;
            height: auto;
            margin-bottom: 10px;
            filter: brightness(0) invert(1);
        }
        
        .tagline {
            font-size: 14px;
            opacity: 0.9;
            font-style: italic;
        }
        
        .content {
            padding: 40px 30px;
        }
        
        .greeting {
            font-size: 18px;
            color: #2c5530;
            margin-bottom: 20px;
            font-weight: 600;
        }
        
        .main-message {
            font-size: 16px;
            line-height: 1.8;
            margin-bottom: 30px;
            color: #444;
        }
        
        .highlight-box {
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            border-left: 4px solid #2c5530;
            padding: 20px;
            margin: 25px 0;
            border-radius: 0 8px 8px 0;
        }
        
        .highlight-title {
            color: #2c5530;
            font-weight: bold;
            font-size: 18px;
            margin-bottom: 15px;
        }
        
        .benefits-list {
            margin: 20px 0;
            padding-left: 0;
        }
        
        .benefits-list li {
            list-style: none;
            padding: 8px 0;
            position: relative;
            padding-left: 30px;
        }
        
        .benefits-list li:before {
            content: "✓";
            position: absolute;
            left: 0;
            color: #2c5530;
            font-weight: bold;
            font-size: 16px;
        }
        
        .cta-section {
            text-align: center;
            margin: 40px 0;
        }
        
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #2c5530 0%, #4a7c59 100%);
            color: white !important;
            padding: 18px 35px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: bold;
            font-size: 18px;
            box-shadow: 0 4px 15px rgba(44, 85, 48, 0.3);
            transition: all 0.3s ease;
            border: 2px solid transparent;
            text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
        }
        
        .cta-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(44, 85, 48, 0.4);
            background: linear-gradient(135deg, #1a3d1e 0%, #2c5530 100%);
            border: 2px solid #4a7c59;
        }
        
        .urgency-text {
            color: #d63384;
            font-weight: 600;
            font-size: 14px;
            margin-top: 15px;
        }
        
        .contact-info {
            background-color: #f8f9fa;
            padding: 25px;
            border-radius: 8px;
            margin: 30px 0;
        }
        
        .contact-title {
            color: #2c5530;
            font-weight: bold;
            margin-bottom: 15px;
            font-size: 16px;
        }
        
        .contact-details {
            font-size: 14px;
            line-height: 1.8;
        }
        
        .contact-details a {
            color: #2c5530;
            text-decoration: none;
            font-weight: 600;
        }
        
        .footer {
            background-color: #2c5530;
            color: white;
            padding: 30px 20px;
            text-align: center;
        }
        
        .footer-content {
            font-size: 14px;
            line-height: 1.6;
        }
        
        .footer-links {
            margin: 20px 0;
        }
        
        .footer-links a {
            color: #ffffff;
            text-decoration: none;
            margin: 0 15px;
            opacity: 0.9;
        }
        
        .footer-links a:hover {
            opacity: 1;
            text-decoration: underline;
        }
        
        .disclaimer {
            font-size: 12px;
            opacity: 0.8;
            margin-top: 20px;
            border-top: 1px solid rgba(255, 255, 255, 0.2);
            padding-top: 20px;
        }
        
        @media (max-width: 600px) {
            .container {
                margin: 0;
                box-shadow: none;
            }
            
            .content {
                padding: 30px 20px;
            }
            
            .header {
                padding: 25px 15px;
            }
            
            .logo {
                font-size: 24px;
            }
            
            .cta-button {
                padding: 12px 25px;
                font-size: 14px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <img src="https://tree-of-life-agencies.replit.app/tree-of-life-logo.jpg" 
                 alt="Tree of Life Agencies" 
                 class="logo" />
            <div class="tagline">Protecting Your Family's Financial Future</div>
        </div>
        
        <!-- Main Content -->
        <div class="content">
            <div class="greeting">Dear ${name},</div>
            
            <div class="main-message">
                <strong>What would happen to your family's financial security if something unexpected happened to you tomorrow?</strong>
            </div>
            
            <div class="main-message">
                This isn't about being pessimistic – it's about being prepared. Too many families discover too late that their loved ones are left struggling financially during their most vulnerable time.
            </div>
            
            <div class="highlight-box">
                <div class="highlight-title">The 7 Hidden Threats to Your Family's Wealth</div>
                <p>Most people think they're financially protected, but there are critical gaps that could devastate your family's future. Our Emergency Wealth Plan reveals:</p>
                
                <ul class="benefits-list">
                    <li>The #1 mistake that leaves 73% of families financially vulnerable</li>
                    <li>How to protect your assets from unexpected medical expenses</li>
                    <li>The legal loophole that could cost your family thousands</li>
                    <li>Simple strategies to ensure your wealth transfers smoothly</li>
                    <li>Tax-efficient ways to preserve more for your beneficiaries</li>
                    <li>How to create multiple income streams for your family</li>
                    <li>The insurance gap that most families don't know exists</li>
                </ul>
            </div>
            
            <div class="main-message">
                As a trusted financial professional with Guardian Life and Tree of Life Agencies, I've helped hundreds of families secure their financial future. I've seen firsthand what happens when families are prepared – and when they're not.
            </div>
            
            <div class="cta-section">
                <a href="https://treeoflifeagencies.com" class="cta-button">
                    Get Your Emergency Wealth Plan
                </a>
                <div class="urgency-text">⚡ Limited Time: Free Consultation Available</div>
            </div>
            
            <div class="contact-info">
                <div class="contact-title">Ready to Protect Your Family's Future?</div>
                <div class="contact-details">
                    <strong>Brandon Burke</strong><br>
                    Licensed Insurance Professional<br>
                    Tree of Life Agencies | Guardian Life<br><br>
                    
                    📞 Direct: <a href="tel:+13344673090">(334) 467-3090</a><br>
                    📧 Email: <a href="mailto:brandonb@treeoflifeagencies.com">brandonb@treeoflifeagencies.com</a><br>
                    🌐 Website: <a href="https://treeoflifeagencies.com">treeoflifeagencies.com</a>
                </div>
            </div>
            
            <div class="main-message">
                Don't wait until it's too late. The best time to protect your family's financial future is now, while you still can.
            </div>
            
            <div class="main-message">
                <em>Your family's security is worth a 15-minute conversation.</em>
            </div>
        </div>
        
        <!-- Footer -->
        <div class="footer">
            <div class="footer-content">
                <strong>Tree of Life Agencies</strong><br>
                Partnered with Guardian Life Insurance Company of America<br><br>
                <img src="https://treeoflifeagencies.com/assets/tree-of-life-guardian-logo.png" alt="Tree of Life Agencies - Guardian Life Co." style="max-width: 300px; height: auto; margin: 10px 0;" />
            </div>
            
            <div class="footer-links">
                <a href="https://treeoflifeagencies.com">Our Services</a>
                <a href="https://treeoflifeagencies.com/about">About Us</a>
                <a href="mailto:brandonb@treeoflifeagencies.com">Contact</a>
            </div>
            
            <div class="disclaimer">
                This communication is for informational purposes only. Guardian Life Insurance Company of America and its subsidiaries do not provide tax, legal, or accounting advice. Please consult with your tax, legal, or accounting professional regarding your individual situation.
                
                <br><br>
                
                Guardian® and the Guardian logo are registered trademarks of Guardian Life Insurance Company of America. Tree of Life Agencies is not an affiliate or subsidiary of Guardian Life Insurance Company of America.
                
                <div style="border-top: 1px solid rgba(255,255,255,0.3); padding-top: 15px; margin-top: 15px;">
                    <span style="font-size: 11px; color: #b8e6b8;">
                        If you no longer wish to receive these emails, you can 
                        <a href="https://treeoflifeagencies.com/unsubscribe?email=" 
                           style="color: #b8e6b8; text-decoration: underline;">unsubscribe here</a>
                    </span>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
  `.trim();
};

// Professional Follow-up Email Template
const followUpTemplate = (recipientName, emailNumber = 1) => {
  const name = recipientName || 'Valued Client';
  
  const subjects = [
    "Don't Let Your Family's Financial Future Be Left to Chance",
    "The One Decision That Could Save Your Family Thousands",
    "Final Reminder: Your Family's Financial Protection Plan"
  ];
  
  const messages = [
    {
      opening: "I reached out a few days ago about protecting your family's financial future, and I wanted to follow up because this is too important to ignore.",
      focus: "Time is often our biggest enemy when it comes to financial planning. Every day you wait is a day your family remains vulnerable to financial uncertainty."
    },
    {
      opening: "Most people think they have time to figure out their financial protection later. But 'later' isn't guaranteed for any of us.",
      focus: "The families who are most prepared aren't the ones who had the most time – they're the ones who took action when they had the chance."
    },
    {
      opening: "This is my final personal outreach about your Emergency Wealth Plan. After this, I'll respect your decision and won't contact you again about this opportunity.",
      focus: "I genuinely care about helping families protect their financial future. If you're ready to take action, I'm here to help. If not, I understand."
    }
  ];
  
  const currentMessage = messages[emailNumber - 1] || messages[0];
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${subjects[emailNumber - 1] || subjects[0]}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f4f4f4;
        }
        
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
        }
        
        .header {
            background: linear-gradient(135deg, #2c5530 0%, #4a7c59 100%);
            color: white;
            padding: 25px 20px;
            text-align: center;
        }
        
        .logo {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 8px;
        }
        
        .content {
            padding: 35px 30px;
        }
        
        .greeting {
            font-size: 18px;
            color: #2c5530;
            margin-bottom: 20px;
            font-weight: 600;
        }
        
        .main-message {
            font-size: 16px;
            line-height: 1.8;
            margin-bottom: 25px;
            color: #444;
        }
        
        .cta-section {
            text-align: center;
            margin: 35px 0;
            padding: 25px;
            background-color: #f8f9fa;
            border-radius: 8px;
        }
        
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #2c5530 0%, #4a7c59 100%);
            color: white !important;
            padding: 18px 35px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: bold;
            font-size: 18px;
            box-shadow: 0 4px 15px rgba(44, 85, 48, 0.3);
            border: 2px solid transparent;
            text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
        }
        
        .signature {
            margin-top: 30px;
            padding-top: 25px;
            border-top: 1px solid #eee;
            font-size: 14px;
            line-height: 1.6;
        }
        
        .signature strong {
            color: #2c5530;
        }
        
        .signature a {
            color: #2c5530;
            text-decoration: none;
        }
        
        .footer {
            background-color: #2c5530;
            color: white;
            padding: 20px;
            text-align: center;
            font-size: 12px;
        }
        
        @media (max-width: 600px) {
            .container {
                margin: 0;
                box-shadow: none;
            }
            
            .content {
                padding: 25px 20px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="https://tree-of-life-agencies.replit.app/tree-of-life-logo.jpg" 
                 alt="Tree of Life Agencies" 
                 class="logo" />
        </div>
        
        <div class="content">
            <div class="greeting">Dear ${name},</div>
            
            <div class="main-message">
                ${currentMessage.opening}
            </div>
            
            <div class="main-message">
                <strong>${currentMessage.focus}</strong>
            </div>
            
            <div class="main-message">
                Your Emergency Wealth Plan takes just 15 minutes to review, but it could save your family from years of financial hardship.
            </div>
            
            <div class="cta-section">
                <div style="margin-bottom: 15px; font-weight: 600; color: #2c5530;">
                    Ready to protect your family's future?
                </div>
                <a href="https://treeoflifeagencies.com" class="cta-button">
                    Schedule Your Free Consultation
                </a>
            </div>
            
            <div class="main-message">
                Simply reply to this email or call me directly at (334) 467-3090. I'm here to help you make the right decision for your family.
            </div>
            
            <div class="signature">
                <strong>Brandon Burke</strong><br>
                Licensed Insurance Professional<br>
                Tree of Life Agencies | Guardian Life<br><br>
                
                📞 <a href="tel:+13344673090">(334) 467-3090</a><br>
                📧 <a href="mailto:brandonb@treeoflifeagencies.com">brandonb@treeoflifeagencies.com</a>
            </div>
        </div>
        
        <div class="footer" style="text-align: center; padding: 20px;">
            Tree of Life Agencies | Partnered with Guardian Life Insurance Company of America<br><br>
            <img src="https://treeoflifeagencies.com/assets/tree-of-life-guardian-logo.png" alt="Tree of Life Agencies - Guardian Life Co." style="max-width: 300px; height: auto; margin: 10px 0;" />
            <div style="border-top: 1px solid rgba(255,255,255,0.3); padding-top: 15px; margin-top: 15px;">
                <span style="font-size: 11px; color: #b8e6b8;">
                    If you no longer wish to receive these emails, you can 
                    <a href="https://treeoflifeagencies.com/unsubscribe?email=" 
                       style="color: #b8e6b8; text-decoration: underline;">unsubscribe here</a>
                </span>
            </div>
        </div>
    </div>
</body>
</html>
  `.trim();
};

// Generate professional email content
function generateProfessionalEmail(type = 'initial', recipientName = null, emailNumber = 1) {
  switch (type) {
    case 'initial':
      return emergencyWealthPlanTemplate(recipientName);
    case 'followup':
      return followUpTemplate(recipientName, emailNumber);
    default:
      return emergencyWealthPlanTemplate(recipientName);
  }
}

// Save template to file
function saveTemplateToFile(template, filename) {
  fs.writeFileSync(filename, template);
  console.log(`Template saved to ${filename}`);
}

// Export functions
module.exports = {
  emergencyWealthPlanTemplate,
  followUpTemplate,
  generateProfessionalEmail,
  saveTemplateToFile
};

// CLI usage
if (require.main === module) {
  const type = process.argv[2] || 'initial';
  const name = process.argv[3] || 'Valued Client';
  const emailNumber = parseInt(process.argv[4]) || 1;
  
  console.log('Professional Email Template Generator');
  console.log('===================================');
  console.log('');
  console.log('Generating professional email template...');
  
  const template = generateProfessionalEmail(type, name, emailNumber);
  const filename = `professional_email_${type}_${Date.now()}.html`;
  
  saveTemplateToFile(template, filename);
  
  console.log(`Template type: ${type}`);
  console.log(`Recipient: ${name}`);
  if (type === 'followup') {
    console.log(`Email number: ${emailNumber}`);
  }
  console.log('');
  console.log('Features:');
  console.log('- Professional Tree of Life Agencies branding');
  console.log('- Responsive design for all devices');
  console.log('- Clear call-to-action buttons');
  console.log('- Professional contact information');
  console.log('- Compliance disclaimer');
  console.log('- Gradient design elements');
  console.log('- Mobile-optimized layout');
}