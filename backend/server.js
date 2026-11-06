
const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Servidor do Tutus funcionando!");
});

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const codigos = new Map();

app.post("/solicitar-codigo", async (req, res) => {
  const email = req.body.email?.trim().toLowerCase();

  if (!email) {
    return res.status(400).json({
      mensagem: "Informe seu e-mail.",
    });
  }

  const agora = Date.now();
  const codigoAnterior = codigos.get(email);

  if (
    codigoAnterior &&
    agora - codigoAnterior.criadoEm < 60000
  ) {
    return res.status(429).json({
      mensagem: "Aguarde um minuto para solicitar outro código.",
    });
  }

  const codigo = crypto.randomInt(100000, 1000000).toString();

  try {
    
 
const info = await transporter.sendMail({
  from: `"Tutus" <${process.env.EMAIL_FROM}>`,
  to: email,
  subject: "Seu código de recuperação | Tutus",

  text: `Seu código de recuperação é: ${codigo}. Ele é válido por 10 minutos.`,

  html: `
    <!DOCTYPE html>
    <html>
      <body style="background-color: #FFFDF8; padding: 35px 15px; font-family: Arial, sans-serif;">

        <div style="max-width: 450px; margin: auto; background: white; border-radius: 20px; padding: 30px; border: 1px solid #FFEAC8; text-align: center;">

          <h1 style="color: #332716;">Tutus</h1>

          <h2 style="color: #332716;">Recuperação de senha</h2>

          <p style="color: #75571F;">
            Recebemos uma solicitação para redefinir sua senha.
            Utilize o código abaixo:
          </p>

          <div style="background: #FFF3DF; border-radius: 15px; padding: 20px; margin: 25px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #332716;">
              ${codigo}
            </span>
          </div>

          <p style="color: #75571F;">
            Este código é válido por <strong>10 minutos</strong>.
          </p>

          <p style="color: #999; font-size: 12px;">
            Se você não solicitou a recuperação, ignore este e-mail.
          </p>

          <hr style="border: 0; border-top: 1px solid #FFEAC8;">

          <p style="color: #75571F; font-size: 13px;">
            com carinho, tutus!
          </p>

        </div>
      </body>
    </html>
  `,
});

console.log("E-mail enviado:", info.messageId);
console.log("Tipo de conteúdo:", info.accepted);

    codigos.set(email, {
      codigo,
      criadoEm: agora,
      expiraEm: agora + 10 * 60 * 1000,
      tentativas: 0,
    });

    return res.json({
      mensagem: "Código enviado com sucesso!",
    });

  } catch (erro) {
    console.log("Erro ao enviar e-mail:", erro.message);

    return res.status(500).json({
      mensagem: "Não foi possível enviar o código.",
    });
  }
});

app.post("/verificar-codigo", (req, res) => {
  const email = req.body.email?.trim().toLowerCase();
  const codigo = req.body.codigo?.trim();

  const registro = codigos.get(email);

  if (!registro) {
    return res.status(400).json({
      mensagem: "Solicite um novo código.",
    });
  }

  if (Date.now() > registro.expiraEm) {
    codigos.delete(email);

    return res.status(400).json({
      mensagem: "Código expirado. Solicite outro.",
    });
  }

  if (registro.tentativas >= 5) {
    codigos.delete(email);

    return res.status(400).json({
      mensagem: "Limite de tentativas atingido. Solicite outro código.",
    });
  }

  registro.tentativas++;

  if (codigo !== registro.codigo) {
    return res.status(400).json({
      mensagem: "Código incorreto.",
    });
  }

  codigos.delete(email);

  return res.json({
    mensagem: "Código verificado com sucesso!",
    valido: true,
  });
});

const PORT = 3000;

app.listen(PORT, async () => {
  console.log(`Servidor iniciado na porta ${PORT}`);

  try {
    await transporter.verify();
    console.log("Conexão com o Brevo realizada com sucesso!");
  } catch (erro) {
    console.log("Erro na conexão com o Brevo:", erro.message);
  }
});
