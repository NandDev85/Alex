// server.js
require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'))); // supondo que index.html e pasta css/images estejam em public/

// Configure o transporte do Nodemailer
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,      // ex: 'smtp.gmail.com'
  port: process.env.SMTP_PORT,      // ex: 587
  secure: process.env.SMTP_SECURE === 'true', // true para 465, false para outras portas
  auth: {
    user: process.env.SMTP_USER,    // seu e-mail
    pass: process.env.SMTP_PASS     // sua senha ou app password
  }
});

// Rota para envio de e-mail
app.post('/send-email', async (req, res) => {
  const { nome, email, mensagem } = req.body;
  try {
    await transporter.sendMail({
      from: `"${nome}" <${email}>`,
      to: process.env.TO_EMAIL, // e-mail que vai receber as mensagens
      subject: `Contato do site - ${nome}`,
      text: mensagem,
      html: `<p>${mensagem}</p><hr><p>Enviado por: ${nome} - ${email}</p>`
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao enviar e-mail:', error);
    res.status(500).json({ success: false });
  }
});

// Inicia o servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta: https://localhost:${PORT}`));
