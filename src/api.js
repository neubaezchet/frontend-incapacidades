export async function validarIncapacidad(data) {
  try {
    const response = await fetch(${import.meta.env.VITE_API_URL}/validar, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Error al conectar con el backend');
    }

    return await response.json();
  } catch (error) {
    console.error('Error:', error);
    return { error: 'No se pudo validar la incapacidad' };
  }
}
