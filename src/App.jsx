import { useState } from "react";

export default function App() {
  const [cedula, setCedula] = useState("");
  const [tipoIncapacidad, setTipoIncapacidad] = useState("");
  const [file, setFile] = useState(null);
  const [mensaje, setMensaje] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!cedula || !tipoIncapacidad || !file) {
      setMensaje("Por favor completa todos los campos y selecciona un archivo.");
      return;
    }

    const formData = new FormData();
    formData.append("cedula", cedula);
    formData.append("tipo_incapacidad", tipoIncapacidad);
    formData.append("archivo", file);

    try {
      const res = await fetch("https://backend-incapacidades.onrender.com/validar-incapacidad", {
        method: "POST",
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        setMensaje(`✅ ${data.mensaje || "Envío exitoso"}`);
      } else {
        setMensaje("❌ Error al enviar la incapacidad.");
      }
    } catch (error) {
      console.error(error);
      setMensaje("❌ Error de conexión con el servidor.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-lg">
        <h1 className="text-2xl font-bold text-center text-blue-600 mb-6">
          Plataforma de Validación de Incapacidades
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 font-medium">Cédula</label>
            <input
              type="text"
              value={cedula}
              onChange={(e) => setCedula(e.target.value)}
              className="w-full border rounded-lg p-2"
              placeholder="Ingrese número de cédula"
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">Tipo de Incapacidad</label>
            <select
              value={tipoIncapacidad}
              onChange={(e) => setTipoIncapacidad(e.target.value)}
              className="w-full border rounded-lg p-2"
            >
              <option value="">Seleccione...</option>
              <option value="enfermedad">Enfermedad General</option>
              <option value="maternidad">Licencia de Maternidad</option>
              <option value="paternidad">Licencia de Paternidad</option>
              <option value="accidente">Accidente de Tránsito</option>
            </select>
          </div>

          <div>
            <label className="block mb-1 font-medium">Archivo de Incapacidad</label>
            <input
              type="file"
              onChange={(e) => setFile(e.target.files[0])}
              className="w-full"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Enviar
          </button>
        </form>

        {mensaje && (
          <div className="mt-4 text-center text-sm text-gray-700">
            {mensaje}
          </div>
        )}
      </div>
    </div>
  );
}
