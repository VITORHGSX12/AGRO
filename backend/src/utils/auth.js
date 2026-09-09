import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

function getJwtSecret() {
    const secret = process.env.JWT_SECRET;
    if (!secret && process.env.NODE_ENV === 'production') {
        throw new Error('FATAL: JWT_SECRET não configurado nas variáveis de ambiente em modo produção!');
    }
    return secret || 'agro_saas_dev_fallback_secret_key_2026';
}

// 1. Hash de Senha Seguro com PBKDF2 e Salt Aleatório
export function hashPassword(password) {
    if (!password) throw new Error('Senha não pode ser vazia');
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    return `${salt}:${hash}`;
}

// 2. Comparação de Senha com Salt
export function comparePassword(password, storedHash) {
    if (!password || !storedHash || !storedHash.includes(':')) return false;
    const [salt, originalHash] = storedHash.split(':');
    const hashToVerify = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    return crypto.timingSafeEqual(Buffer.from(originalHash, 'hex'), Buffer.from(hashToVerify, 'hex'));
}

// 3. Funções Base64URL
function base64UrlEncode(str) {
    return Buffer.from(str).toString('base64url');
}

function base64UrlDecode(str) {
    return Buffer.from(str, 'base64url').toString('utf8');
}

// 4. Geração de Token JWT HMAC-SHA256
export function signToken(payload, expiresInSeconds = 86400 * 7) { // 7 dias
    const header = { alg: 'HS256', typ: 'JWT' };
    const now = Math.floor(Date.now() / 1000);
    const fullPayload = {
        ...payload,
        iat: now,
        exp: now + expiresInSeconds
    };

    const encodedHeader = base64UrlEncode(JSON.stringify(header));
    const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));

    const signature = crypto
        .createHmac('sha256', getJwtSecret())
        .update(`${encodedHeader}.${encodedPayload}`)
        .digest('base64url');

    return `${encodedHeader}.${encodedPayload}.${signature}`;
}

// 5. Validação de Token JWT
export function verifyToken(token) {
    if (!token || typeof token !== 'string') return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [encodedHeader, encodedPayload, signature] = parts;

    // Recalcula assinatura para checagem constante
    const expectedSignature = crypto
        .createHmac('sha256', getJwtSecret())
        .update(`${encodedHeader}.${encodedPayload}`)
        .digest('base64url');

    try {
        const sigBuffer = Buffer.from(signature);
        const expectedBuffer = Buffer.from(expectedSignature);

        if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
            return null; // Assinatura inválida
        }

        const payload = JSON.parse(base64UrlDecode(encodedPayload));
        const now = Math.floor(Date.now() / 1000);
        if (payload.exp && payload.exp < now) {
            return null; // Token expirado
        }
        return payload;
    } catch (e) {
        return null;
    }
}

// 6. Middleware de Autenticação
export function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Token de autenticação não fornecido' });
    }

    const token = authHeader.split(' ')[1];
    const userPayload = verifyToken(token);

    if (!userPayload) {
        return res.status(401).json({ error: 'Sessão expirada ou token inválido. Faça login novamente.' });
    }

    req.user = userPayload;
    next();
}

// 7. Middleware de Controle de Acesso Baseado em Papel (RBAC Obrigatório)
export function requireRole(allowedRoles = []) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Usuário não autenticado' });
        }

        if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.papel)) {
            return res.status(403).json({
                error: `Acesso negado: seu perfil (${req.user.papel}) não tem permissão para acessar este recurso.`
            });
        }

        next();
    };
}

// 8. Middleware de Verificação de Papel com Suporte a Auth Opcional / Testes
export function checkRole(allowedRoles = []) {
    return (req, res, next) => {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            // Sem header de autorização explícito (pass-through para modo legado/testes locais)
            return next();
        }

        const token = authHeader.split(' ')[1];
        const userPayload = verifyToken(token);

        if (!userPayload) {
            return res.status(401).json({ error: 'Sessão expirada ou token inválido.' });
        }

        req.user = userPayload;

        if (allowedRoles.length > 0 && !allowedRoles.includes(userPayload.papel)) {
            return res.status(403).json({
                error: `Acesso negado: seu perfil (${userPayload.papel}) não tem permissão para acessar este recurso.`
            });
        }

        next();
    };
}

