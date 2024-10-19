import { createClient } from "@libsql/client";

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event);

  const client = createClient({
    url: config.turso.databaseUrl,
    authToken: config.turso.authToken,
  });

  try {
    const { rows } = await client.execute("SELECT sku, qty FROM Instances");

    return {
      data: {
        items: rows,
      },
    };
  } catch (error) {
    console.error('Error fetching products from Turso:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Error fetching products',
    });
  }
});
