import mysql from 'mysql2/promise';
import * as bcrypt from 'bcrypt';

async function createAdmin(): Promise<void> {
  const name = process.env.ADMIN_NAME?.trim();
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!name || !email || !password) {
    throw new Error(
      'Faltan variables de entorno: ADMIN_NAME, ADMIN_EMAIL o ADMIN_PASSWORD.',
    );
  }

  if (password.length < 12 || password.length > 72) {
    throw new Error(
      'La contraseña debe tener entre 12 y 72 caracteres.',
    );
  }

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
  });

  try {
    const [existingUsers] = await connection.execute(
      'SELECT id FROM users WHERE email = ? LIMIT 1',
      [email],
    );

    if ((existingUsers as mysql.RowDataPacket[]).length > 0) {
      console.log(
        'Ya existe un usuario con ese email. No se realizaron cambios.',
      );
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await connection.execute(
      `INSERT INTO users
        (name, email, password_hash, role, is_active)
       VALUES (?, ?, ?, 'admin', TRUE)`,
      [name, email, passwordHash],
    );

    console.log('Administrador creado correctamente.');
    console.log(`Email registrado: ${email}`);
  } finally {
    await connection.end();
  }
}

createAdmin().catch((error: unknown) => {
  console.error(
    'No se pudo crear el administrador:',
    error instanceof Error ? error.message : 'Error desconocido.',
  );

  process.exitCode = 1;
});