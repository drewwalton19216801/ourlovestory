export interface EmailTemplateData {
  [key: string]: string;
}

export function generateVerificationEmail(data: {
  userName: string;
  verificationUrl: string;
  siteName?: string;
}): string {
  const siteName = data.siteName || 'Our Love Story';
  
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your Email - ${siteName}</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          background-color: #f8fafc;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
          background: linear-gradient(135deg, #8b5cf6, #ec4899);
          color: white;
          padding: 40px 30px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 600;
        }
        .content {
          padding: 40px 30px;
        }
        .greeting {
          font-size: 18px;
          margin-bottom: 20px;
          color: #1f2937;
        }
        .message {
          color: #4b5563;
          margin-bottom: 30px;
          line-height: 1.7;
        }
        .button-container {
          text-align: center;
          margin: 40px 0;
        }
        .verify-button {
          display: inline-block;
          background: linear-gradient(135deg, #8b5cf6, #ec4899);
          color: #ffffff !important;
          text-decoration: none;
          padding: 16px 32px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 16px;
          transition: transform 0.2s ease;
          border: none;
          mso-line-height-rule: exactly;
        }
        .verify-button:hover {
          transform: translateY(-2px);
          color: #ffffff !important;
        }
        .verify-button:visited {
          color: #ffffff !important;
        }
        .verify-button:active {
          color: #ffffff !important;
        }
        .alternative-link {
          margin-top: 30px;
          padding: 20px;
          background: #f3f4f6;
          border-radius: 8px;
          font-size: 14px;
          color: #6b7280;
        }
        .alternative-link a {
          color: #8b5cf6;
          word-break: break-all;
        }
        .footer {
          background: #f9fafb;
          padding: 30px;
          text-align: center;
          border-top: 1px solid #e5e7eb;
        }
        .footer p {
          margin: 0;
          color: #6b7280;
          font-size: 14px;
        }
        .footer .social-links {
          margin-top: 20px;
        }
        .footer .social-links a {
          color: #8b5cf6;
          text-decoration: none;
          margin: 0 10px;
        }
        .heart {
          color: #ec4899;
          font-size: 20px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1><span class="heart">💕</span> ${siteName}</h1>
        </div>
        
        <div class="content">
          <div class="greeting">Hello ${data.userName}!</div>
          
          <div class="message">
            <p>Welcome to ${siteName}! We're excited to have you join our community of couples sharing their beautiful love stories.</p>
            
            <p>To complete your account setup and start creating memories, please verify your email address by clicking the button below:</p>
          </div>
          
          <div class="button-container">
            <a href="${data.verificationUrl}" class="verify-button" style="color: #ffffff !important; text-decoration: none;">
              Verify My Email Address
            </a>
          </div>
          
          <div class="alternative-link">
            <strong>Button not working?</strong> Copy and paste this link into your browser:<br>
            <a href="${data.verificationUrl}">${data.verificationUrl}</a>
          </div>
          
          <div class="message">
            <p><strong>What's next?</strong></p>
            <ul>
              <li>Create your first memory together</li>
              <li>Connect with your partner</li>
              <li>Build your digital love story timeline</li>
              <li>Share special moments and milestones</li>
            </ul>
            
            <p>If you didn't create an account with us, you can safely ignore this email.</p>
          </div>
        </div>
        
        <div class="footer">
          <p>This verification link will expire in 24 hours for security purposes.</p>
          <p>Need help? Contact our support team at support@ourlovestory.app</p>
          
          <div class="social-links">
            <a href="#">Privacy Policy</a> |
            <a href="#">Terms of Service</a> |
            <a href="#">Support</a>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function generateRelationshipRequestEmail(data: {
  receiverName: string;
  requesterName: string;
  relationshipType: string;
  appUrl: string;
  siteName?: string;
}): string {
  const siteName = data.siteName || 'Our Love Story';
  const relationshipTypeDisplay = data.relationshipType.replace('_', ' ');
  
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Connection Request - ${siteName}</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          background-color: #f8fafc;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
          background: linear-gradient(135deg, #8b5cf6, #ec4899);
          color: white;
          padding: 40px 30px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 600;
        }
        .content {
          padding: 40px 30px;
        }
        .greeting {
          font-size: 18px;
          margin-bottom: 20px;
          color: #1f2937;
        }
        .message {
          color: #4b5563;
          margin-bottom: 30px;
          line-height: 1.7;
        }
        .highlight-box {
          background: linear-gradient(135deg, #f3e8ff, #fce7f3);
          border: 1px solid #d8b4fe;
          border-radius: 12px;
          padding: 24px;
          margin: 30px 0;
          text-align: center;
        }
        .highlight-box .requester {
          font-size: 24px;
          font-weight: 600;
          color: #7c3aed;
          margin-bottom: 8px;
        }
        .highlight-box .relationship-type {
          color: #be185d;
          font-weight: 500;
          text-transform: capitalize;
        }
        .button-container {
          text-align: center;
          margin: 40px 0;
        }
        .action-button {
          display: inline-block;
          background: linear-gradient(135deg, #8b5cf6, #ec4899);
          color: #ffffff !important;
          text-decoration: none;
          padding: 16px 32px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 16px;
          transition: transform 0.2s ease;
          border: none;
          mso-line-height-rule: exactly;
        }
        .action-button:hover {
          transform: translateY(-2px);
          color: #ffffff !important;
        }
        .action-button:visited {
          color: #ffffff !important;
        }
        .action-button:active {
          color: #ffffff !important;
        }
        .info-section {
          background: #f0f9ff;
          border: 1px solid #bae6fd;
          border-radius: 8px;
          padding: 20px;
          margin: 30px 0;
        }
        .info-section h3 {
          margin: 0 0 15px 0;
          color: #0369a1;
          font-size: 16px;
        }
        .info-section ul {
          margin: 0;
          padding-left: 20px;
          color: #0c4a6e;
        }
        .footer {
          background: #f9fafb;
          padding: 30px;
          text-align: center;
          border-top: 1px solid #e5e7eb;
        }
        .footer p {
          margin: 0;
          color: #6b7280;
          font-size: 14px;
        }
        .footer .social-links {
          margin-top: 20px;
        }
        .footer .social-links a {
          color: #8b5cf6;
          text-decoration: none;
          margin: 0 10px;
        }
        .heart {
          color: #ec4899;
          font-size: 20px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1><span class="heart">💕</span> ${siteName}</h1>
        </div>
        
        <div class="content">
          <div class="greeting">Hello ${data.receiverName}!</div>
          
          <div class="message">
            <p>You have a new connection request on ${siteName}!</p>
          </div>
          
          <div class="highlight-box">
            <div class="requester">${data.requesterName}</div>
            <div class="relationship-type">wants to connect as your ${relationshipTypeDisplay}</div>
          </div>
          
          <div class="message">
            <p>Once you accept this connection, you'll be able to:</p>
          </div>
          
          <div class="info-section">
            <h3>✨ What you can do together:</h3>
            <ul>
              <li>Share private memories and moments</li>
              <li>Tag each other in special posts</li>
              <li>React and comment on each other's memories</li>
              <li>Build your shared timeline together</li>
            </ul>
          </div>
          
          <div class="button-container">
            <a href="${data.appUrl}" class="action-button" style="color: #ffffff !important; text-decoration: none;">
              View & Respond to Request
            </a>
          </div>
          
          <div class="message">
            <p>You can accept or decline this request in your account settings. If you don't recognize ${data.requesterName}, you can safely decline the request.</p>
            
            <p>This request will remain pending until you respond to it.</p>
          </div>
        </div>
        
        <div class="footer">
          <p>You received this email because someone tried to connect with your ${siteName} account.</p>
          <p>If you didn't expect this request, you can safely ignore this email.</p>
          
          <div class="social-links">
            <a href="#">Privacy Policy</a> |
            <a href="#">Terms of Service</a> |
            <a href="#">Support</a>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function generateWelcomeEmail(data: {
  userName: string;
  appUrl: string;
  siteName?: string;
}): string {
  const siteName = data.siteName || 'Our Love Story';
  
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to ${siteName}!</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          background-color: #f8fafc;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
          background: linear-gradient(135deg, #8b5cf6, #ec4899);
          color: white;
          padding: 40px 30px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 600;
        }
        .content {
          padding: 40px 30px;
        }
        .greeting {
          font-size: 20px;
          margin-bottom: 20px;
          color: #1f2937;
          text-align: center;
        }
        .message {
          color: #4b5563;
          margin-bottom: 30px;
          line-height: 1.7;
        }
        .feature-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin: 30px 0;
        }
        .feature-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 20px;
          text-align: center;
        }
        .feature-card .icon {
          font-size: 24px;
          margin-bottom: 10px;
        }
        .feature-card h3 {
          margin: 0 0 10px 0;
          color: #1f2937;
          font-size: 16px;
        }
        .feature-card p {
          margin: 0;
          color: #6b7280;
          font-size: 14px;
        }
        .button-container {
          text-align: center;
          margin: 40px 0;
        }
        .action-button {
          display: inline-block;
          background: linear-gradient(135deg, #8b5cf6, #ec4899);
          color: #ffffff !important;
          text-decoration: none;
          padding: 16px 32px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 16px;
          transition: transform 0.2s ease;
          border: none;
          mso-line-height-rule: exactly;
        }
        .action-button:hover {
          transform: translateY(-2px);
          color: #ffffff !important;
        }
        .action-button:visited {
          color: #ffffff !important;
        }
        .action-button:active {
          color: #ffffff !important;
        }
        .footer {
          background: #f9fafb;
          padding: 30px;
          text-align: center;
          border-top: 1px solid #e5e7eb;
        }
        .footer p {
          margin: 0;
          color: #6b7280;
          font-size: 14px;
        }
        .heart {
          color: #ec4899;
          font-size: 20px;
        }
        @media (max-width: 600px) {
          .feature-grid {
            grid-template-columns: 1fr;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1><span class="heart">💕</span> Welcome to ${siteName}!</h1>
        </div>
        
        <div class="content">
          <div class="greeting">Hello ${data.userName}!</div>
          
          <div class="message">
            <p>Welcome to ${siteName}! Your email has been verified and your account is now active. We're thrilled to have you join our community of couples who are creating beautiful digital timelines of their love stories.</p>
          </div>
          
          <div class="feature-grid">
            <div class="feature-card">
              <div class="icon">📸</div>
              <h3>Share Memories</h3>
              <p>Upload photos and create beautiful memory posts</p>
            </div>
            <div class="feature-card">
              <div class="icon">👥</div>
              <h3>Connect</h3>
              <p>Invite your partner and friends to share in your journey</p>
            </div>
            <div class="feature-card">
              <div class="icon">📅</div>
              <h3>Timeline</h3>
              <p>Build a chronological story of your relationship</p>
            </div>
            <div class="feature-card">
              <div class="icon">❤️</div>
              <h3>React & Comment</h3>
              <p>Engage with each other's posts and memories</p>
            </div>
          </div>
          
          <div class="message">
            <p><strong>Ready to get started?</strong> Here are some things you can do right now:</p>
            <ul>
              <li>Create your first memory post</li>
              <li>Customize your profile settings</li>
              <li>Send a connection request to your partner</li>
              <li>Explore the timeline to see how it works</li>
            </ul>
          </div>
          
          <div class="button-container">
            <a href="${data.appUrl}" class="action-button" style="color: #ffffff !important; text-decoration: none;">
              Start Creating Your Story
            </a>
          </div>
        </div>
        
        <div class="footer">
          <p>We're here to help you create something beautiful together.</p>
          <p>If you have any questions, feel free to reach out to our support team.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}