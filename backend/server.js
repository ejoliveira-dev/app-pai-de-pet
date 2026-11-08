
const express = require("express");
const cors = require("cors");
const crypto = require("crypto");

require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Servidor do Tutus funcionando!");
});

async function enviarEmailBrevo({ to, subject, text, html }) {
  const resposta = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      accept: "application/json",
      "api-key": process.env.BREVO_API_KEY,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      sender: {
        name: "Tutus",
        email: process.env.EMAIL_FROM,
      },
      to: [{ email: to }],
      subject,
      textContent: text,
      htmlContent: html,
    }),
  });

  const dados = await resposta.json();

  if (!resposta.ok) {
    throw new Error(dados.message || `Erro HTTP ${resposta.status}`);
  }

  return dados;
}

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
    const info = await enviarEmailBrevo({
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

    console.log("E-mail enviado pela API do Brevo:", info.messageId);

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

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor iniciado na porta ${PORT}`);
});
