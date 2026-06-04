const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validators = {
  email: (v: string): string | null => {
    if (!v) return 'El correo es requerido';
    if (!EMAIL_RE.test(v)) return 'Correo inválido';
    return null;
  },
  password: (v: string): string | null => {
    if (!v) return 'La contraseña es requerida';
    if (v.length < 8) return 'Mínimo 8 caracteres';
    return null;
  },
  plantName: (v: string): string | null => {
    if (!v.trim()) return 'Dale un nombre a tu planta';
    if (v.length > 20) return 'Máximo 20 caracteres';
    return null;
  },
  godparentEmail: (email: string, userEmail: string): string | null => {
    if (!email) return 'El correo del padrino es requerido';
    if (email.toLowerCase() === userEmail.toLowerCase()) return 'No puedes ser tu propio padrino';
    if (!EMAIL_RE.test(email)) return 'Correo inválido';
    return null;
  },
  fullName: (v: string): string | null => {
    if (!v.trim()) return 'El nombre es requerido';
    if (v.trim().length < 3) return 'Nombre demasiado corto';
    return null;
  },
};
