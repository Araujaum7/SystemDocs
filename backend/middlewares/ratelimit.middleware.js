import rateLimit from 'express-rate-limit';

export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 1000, // Limite de 1000 requisições por IP por janela de tempo
  message: { error: 'Muitas requisições deste IP, tente novamente após 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

export const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 50, // Limita 50 tentativas de login/auth por hora por IP
  message: { error: 'Muitas tentativas de login deste IP, tente novamente após 1 hora.' },
  standardHeaders: true,
  legacyHeaders: false,
});

export const documentLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutos
  max: 100, // Limita a 100 gerações de documentos a cada 10 min por IP para evitar travar a CPU
  message: { error: 'Limite de geração de documentos atingido, aguarde alguns minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});
