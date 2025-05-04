// server.js melhorado
require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const path = require('path');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');

const app = express();

// Middlewares de segurança
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          'https://cdn.jsdelivr.net',
          'https://cdnjs.cloudflare.com',
          'https://maps.googleapis.com',
          'https://www.google.com'
        ],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          'https://cdn.jsdelivr.net',
          'https://cdnjs.cloudflare.com',
          'https://fonts.googleapis.com'
        ],
        imgSrc: [
          "'self'",
          'data:',
          'https://maps.gstatic.com',
          'https://maps.googleapis.com',
          'https://www.google.com'
        ],
        fontSrc: [
          "'self'",
          'https://cdnjs.cloudflare.com',
          'https://fonts.gstatic.com',
          'data:'
        ],
        connectSrc: [
          "'self'",
          'https://maps.googleapis.com'
        ],
        frameSrc: [
          "'self'",
          'https://www.google.com',
          'https://www.google.com/maps'
        ],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: []
      }
    }
  })
);

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS || '*'
}));

// Limitar requisições para evitar spam
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100 // limite de 100 requisições por IP
});
app.use(limiter);

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Validação de e-mail
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false, // true para porta 465, false para outras
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Rota para envio de e-mail com validação
app.post('/send-email', async (req, res) => {
  const { nome, email, mensagem } = req.body;
  
  // Validação simples
  if (!nome || !email || !mensagem) {
    return res.status(400).json({ success: false, error: 'Todos os campos são obrigatórios' });
  }
  
  if (!validateEmail(email)) {
    return res.status(400).json({ success: false, error: 'E-mail inválido' });
  }
  
  if (mensagem.length < 10) {
    return res.status(400).json({ success: false, error: 'Mensagem muito curta' });
  }

  try {
    await transporter.sendMail({
      from: `"${nome}" <${email}>`,
      to: process.env.TO_EMAIL,
      subject: `Novo contato do site - ${nome}`,
      text: mensagem,
      html: `
        <h2>Nova mensagem de contato</h2>
        <p><strong>Nome:</strong> ${nome}</p>
        <p><strong>E-mail:</strong> ${email}</p>
        <p><strong>Mensagem:</strong></p>
        <p>${mensagem}</p>
        <hr>
        <p>Enviado em: ${new Date().toLocaleString()}</p>
      `
    });
    
    // Envia confirmação para o cliente
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: email,
      subject: 'Confirmação de recebimento',
      text: `Olá ${nome},\n\nAgradecemos seu contato. Responderemos em breve.\n\nMensagem enviada:\n${mensagem}`,
      html: `
        <h2>Olá ${nome},</h2>
        <p>Agradecemos seu contato. Responderemos em breve.</p>
        <p><strong>Sua mensagem:</strong></p>
        <p>${mensagem}</p>
        <hr>
        <p>Atenciosamente,<br>Equipe Alex Ferreira - Psicólogo Clínico</p>
      `
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao enviar e-mail:', error);
    res.status(500).json({ success: false, error: 'Erro interno ao enviar mensagem' });
  }
});

// Inicia o servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta: http://localhost:${PORT}`);
  console.log('Ambiente:', process.env.NODE_ENV || 'development');
});