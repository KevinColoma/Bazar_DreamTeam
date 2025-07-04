const express = require('express');
const passport = require('../config/passport');
const jwt = require('jsonwebtoken');
const router = express.Router();

// Ruta para iniciar autenticación con Google
router.get('/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Callback de Google OAuth
router.get('/google/callback',
    passport.authenticate('google', { failureRedirect: '/login' }),
    (req, res) => {
        // Generar JWT token
        const token = jwt.sign(
            { 
                id: req.user.id, 
                email: req.user.email, 
                name: req.user.name 
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        // Redirigir con el token
        res.redirect(`/auth/success?token=${token}`);
    }
);

// Ruta de éxito después del login
router.get('/success', (req, res) => {
    const token = req.query.token;
    
    if (!token) {
        return res.status(400).send(`
            <html>
                <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                    <h1 style="color: red;">❌ Error de autenticación</h1>
                    <p>No se recibió el token de autenticación.</p>
                    <a href="/auth/google" style="background: #4285f4; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Intentar de nuevo</a>
                </body>
            </html>
        `);
    }
    
    res.send(`
        <html>
            <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                <h1 style="color: green;">✅ ¡Autenticación exitosa!</h1>
                <p>Tu token de acceso es:</p>
                <div style="background: #f0f0f0; padding: 20px; margin: 20px; border-radius: 5px; word-break: break-all; font-family: monospace;">
                    ${token}
                </div>
                <h3>📝 Cómo usar tu token:</h3>
                <p>Incluye este token en el header de tus requests a la API:</p>
                <div style="background: #e8f5e8; padding: 15px; margin: 20px; border-radius: 5px; text-align: left;">
                    <strong>Authorization:</strong> Bearer ${token}
                </div>
                
                <h3>🔗 APIs disponibles:</h3>
                <ul style="text-align: left; max-width: 500px; margin: 0 auto;">
                    <li>GET /api/products - Ver productos</li>
                    <li>GET /api/categories - Ver categorías</li>
                    <li>GET /api/clients - Ver clientes</li>
                    <li>GET /api/sales - Ver ventas</li>
                </ul>
                
                <div style="margin-top: 30px;">
                    <button onclick="copyToken()" style="background: #28a745; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer;">
                        📋 Copiar Token
                    </button>
                    <a href="/auth/logout" style="background: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-left: 10px;">
                        🚪 Cerrar Sesión
                    </a>
                </div>
                
                <script>
                    function copyToken() {
                        navigator.clipboard.writeText('${token}');
                        alert('Token copiado al portapapeles!');
                    }
                </script>
            </body>
        </html>
    `);
});

// Ruta para logout
router.get('/logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            return res.status(500).json({ message: 'Error al cerrar sesión' });
        }
        res.json({ message: 'Sesión cerrada exitosamente' });
    });
});

// Ruta para verificar si el usuario está autenticado
router.get('/verify', (req, res) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
        return res.status(401).json({ authenticated: false });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        res.json({ 
            authenticated: true, 
            user: {
                id: decoded.id,
                email: decoded.email,
                name: decoded.name
            }
        });
    } catch (error) {
        res.status(403).json({ authenticated: false });
    }
});

module.exports = router;
