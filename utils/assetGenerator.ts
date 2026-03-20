
export const generateEmailSignature = (name: string, title: string, phone: string, email: string, website: string, imageUrl: string) => {
  return `
    <table cellpadding="0" cellspacing="0" border="0" style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.5; color: #333333; max-width: 500px; padding: 15px; border: 1px solid #eeeeee; border-radius: 12px; background-color: #ffffff;">
      <tr>
        <td style="vertical-align: top; padding-right: 20px;">
          <img src="${imageUrl}" alt="${name}" width="100" height="100" style="border-radius: 50%; object-fit: cover; border: 3px solid #3b82f6;">
        </td>
        <td style="vertical-align: top;">
          <strong style="font-size: 18px; color: #1e293b; display: block; margin-bottom: 4px;">${name}</strong>
          <span style="font-size: 14px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 12px;">${title}</span>
          
          <table cellpadding="0" cellspacing="0" border="0" style="font-size: 13px;">
            <tr>
              <td style="padding-bottom: 4px;"><span style="color: #3b82f6; font-weight: bold; width: 20px; display: inline-block;">P</span> ${phone}</td>
            </tr>
            <tr>
              <td style="padding-bottom: 4px;"><span style="color: #3b82f6; font-weight: bold; width: 20px; display: inline-block;">E</span> ${email}</td>
            </tr>
            <tr>
              <td><span style="color: #3b82f6; font-weight: bold; width: 20px; display: inline-block;">W</span> <a href="${website}" style="color: #333333; text-decoration: none;">${website}</a></td>
            </tr>
          </table>
          
          <div style="margin-top: 15px; padding-top: 10px; border-top: 1px solid #f1f5f9;">
             <span style="font-size: 11px; font-weight: bold; color: #94a3b8; text-transform: uppercase;">PROPHOTO AI ELITE • CERTIFIED PROFESSIONAL</span>
          </div>
        </td>
      </tr>
    </table>
  `;
};

export const generateBusinessCardHtml = (name: string, title: string, imageUrl: string) => {
  return `
    <div style="width: 350px; height: 200px; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); border-radius: 16px; padding: 25px; color: #ffffff; position: relative; overflow: hidden; font-family: 'Inter', sans-serif;">
       <div style="position: absolute; right: -50px; bottom: -50px; width: 200px; height: 200px; background: radial-gradient(circle, rgba(59, 130, 246, 0.2) 0%, transparent 70%); border-radius: 50%;"></div>
       
       <div style="display: flex; height: 100%; gap: 20px; align-items: center; position: relative; z-index: 1;">
          <div style="flex-shrink: 0; width: 100px; height: 100px; border-radius: 50%; border: 4px solid rgba(255,191,36, 0.4); overflow: hidden; background: #000;">
             <img src="${imageUrl}" style="width: 100%; height: 100%; object-fit: cover;">
          </div>
          
          <div style="flex-grow: 1;">
             <div style="font-size: 24px; font-weight: 800; letter-spacing: -0.5px; margin-bottom: 2px;">${name}</div>
             <div style="font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 2px; color: #fbbf24; margin-bottom: 15px;">${title}</div>
             
             <div style="font-size: 11px; opacity: 0.6; line-height: 1.6;">
                PROFESSIONALLY AI-CRAFTED<br>
                POWERED BY PROPHOTO ELITE STUDIO
             </div>
          </div>
       </div>
       
       <div style="position: absolute; top: 20px; right: 20px; font-weight: 900; skew: -10deg; opacity: 0.1; font-size: 60px;">AI</div>
    </div>
  `;
};
