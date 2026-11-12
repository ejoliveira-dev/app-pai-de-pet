
const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const { Pool } = require("pg");
const multer = require("multer");
const sharp = require("sharp");

require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const app = express();

app.use(cors());
app.use(express.json());

// Configuração para receber imagens na memória
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // Máximo de 5 MB
    files: 1,
  },
  fileFilter: (req, file, callback) => {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)) {
      return callback(new Error("Formato de imagem não permitido."));
    }

    callback(null, true);
  },
});

app.get("/", (req, res) => {
  res.send("Servidor do Tutus funcionando!");
});

// Testar conexão com o PostgreSQL
app.get("/teste-banco", async (req, res) => {
  try {
    await pool.query("SELECT 1");

    res.json({
      mensagem: "Banco de dados conectado com sucesso!",
    });
  } catch (erro) {
    console.error("Erro na conexão com o banco:", erro.message);

    res.status(500).json({
      mensagem: "Erro ao conectar ao banco de dados.",
    });
  }
});

// Buscar publicações de todos os usuários
app.get("/publicacoes", async (req, res) => {
  try {
    const resultado = await pool.query(`
      SELECT *
      FROM publicacoes
      ORDER BY criado_em DESC, id DESC
      LIMIT 100
    `);

    res.json(resultado.rows);
  } catch (erro) {
    console.error("Erro ao buscar publicações:", erro.message);

    res.status(500).json({
      mensagem: "Erro ao carregar o feed."
    });
  }
});

// Criar publicação com legenda e imagem
app.post("/publicacoes", async (req, res) => {
  try {
    const { id_pet, nome_pet, legenda, imagem_id } = req.body;

    const texto = typeof legenda === "string" ? legenda.trim() : "";
    const idImagem = imagem_id == null ? null : Number(imagem_id);

    if (
      typeof id_pet !== "string" ||
      !id_pet.trim() ||
      typeof nome_pet !== "string" ||
      !nome_pet.trim() ||
      texto.length > 500 ||
      (!texto && idImagem === null) ||
      (idImagem !== null &&
        (!Number.isSafeInteger(idImagem) || idImagem <= 0))
    ) {
      return res.status(400).json({
        mensagem: "Dados da publicação inválidos."
      });
    }

    if (idImagem !== null) {
      const imagem = await pool.query(
        "SELECT id FROM imagens_feed WHERE id = $1",
        [idImagem]
      );

      if (imagem.rows.length === 0) {
        return res.status(400).json({
          mensagem: "Imagem não encontrada."
        });
      }
    }

    const resultado = await pool.query(
      `INSERT INTO publicacoes
       (id_pet, nome_pet, legenda, imagem_id)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [id_pet.trim(), nome_pet.trim(), texto, idImagem]
    );

    return res.status(201).json(resultado.rows[0]);

  } catch (erro) {
    console.error("Erro ao publicar:", erro.message);

    return res.status(500).json({
      mensagem: "Erro ao salvar publicação."
    });
  }
});

app.post("/upload-foto", upload.single("foto"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        mensagem: "Nenhuma foto enviada."
      });
    }

    const imagemComprimida = await sharp(req.file.buffer)
      .rotate()
      .resize({
        width: 800,
        height: 800,
        fit: "inside",
        withoutEnlargement: true
      })
      .jpeg({ quality: 70 })
      .toBuffer();

    const resultado = await pool.query(
      `INSERT INTO imagens_feed (dados, tipo)
       VALUES ($1, $2)
       RETURNING id`,
      [imagemComprimida, "image/jpeg"]
    );

    return res.status(201).json({
      mensagem: "Imagem enviada com sucesso!",
      imagem_id: resultado.rows[0].id
    });

  } catch (erro) {
    console.error("Erro ao enviar imagem:", erro.message);

    return res.status(500).json({
      mensagem: "Erro ao enviar imagem."
    });
  }
});

app.get("/imagens/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(400).json({
        mensagem: "ID de imagem inválido."
      });
    }

    const resultado = await pool.query(
      "SELECT dados, tipo FROM imagens_feed WHERE id = $1",
      [id]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({
        mensagem: "Imagem não encontrada."
      });
    }

    const imagem = resultado.rows[0];

    res.setHeader("Content-Type", imagem.tipo);
    res.setHeader("Cache-Control", "public, max-age=3600");

    return res.send(imagem.dados);

  } catch (erro) {
    console.error("Erro ao buscar imagem:", erro.message);

    return res.status(500).json({
      mensagem: "Erro ao carregar imagem."
    });
  }
});



// Criar tabela de publicações do feed
async function criarTabelaPublicacoes() {
  try {

      await pool.query(`
        CREATE TABLE IF NOT EXISTS imagens_feed (
          id SERIAL PRIMARY KEY,
          dados BYTEA NOT NULL,
          tipo TEXT NOT NULL,
          criado_em TIMESTAMPTZ DEFAULT NOW()
        )
      `);
     await pool.query(`
      CREATE TABLE IF NOT EXISTS publicacoes (
        id SERIAL PRIMARY KEY,
        id_pet TEXT NOT NULL,
        nome_pet TEXT NOT NULL,
        foto_pet TEXT,
        foto_uri TEXT,
        legenda TEXT,
        imagem_id INTEGER REFERENCES imagens_feed(id),
        criado_em TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    
     await pool.query(`
      ALTER TABLE publicacoes
      ALTER COLUMN foto_uri DROP NOT NULL
    `);

     await pool.query(`
      ALTER TABLE publicacoes
      ADD COLUMN IF NOT EXISTS imagem_id INTEGER REFERENCES imagens_feed(id)
    `);

    console.log("Tabela de publicações pronta!");
  } catch (erro) {
    console.error("Erro ao criar tabela de publicações:", erro.message);
    throw erro;
  }
}

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

async function iniciarServidor() {
  try {
    await criarTabelaPublicacoes();

    app.listen(PORT, () => {
      console.log(`Servidor iniciado na porta ${PORT}`);
    });
  } catch (erro) {
    console.error("Erro ao iniciar servidor:", erro.message);
    process.exit(1);
  }
}

iniciarServidor();