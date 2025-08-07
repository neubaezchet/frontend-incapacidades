import React, { useState } from 'react';
import {
  FileText,
  User,
  Stethoscope,
  Baby,
  UserCheck,
  CheckCircle,
  AlertTriangle,
  X,
  File,
  ChevronDown,
  Upload,
  Loader2
} from 'lucide-react';

// API functions
const API_BASE_URL = 'https://backend-incapacidades.onrender.com';

const validateUser = async (cedula) => {
  try {
    const response = await fetch(`${API_BASE_URL}/validar-usuario/${cedula}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error validating user:', error);
    throw error;
  }
};

const submitIncapacity = async (formData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/validar-incapacidad`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error submitting incapacity:', error);
    throw error;
  }
};

// Datos para la lógica de los requisitos dinámicos
const getIncapacityRequirements = (type, subType = null, days = 0, motherWorking = null) => {
  if (type === 'Licencia de maternidad') {
    return [
      'Licencia o incapacidad de maternidad',
      'Epicrisis o resumen clínico',
      'Cédula de la madre',
      'Registro civil',
      'Certificado de nacido vivo',
    ];
  }
  if (type === 'Licencia de paternidad') {
    const requirements = [
      'Epicrisis o resumen clínico',
      'Cédula del padre',
      'Registro civil',
      'Certificado de nacido vivo',
    ];
    if (motherWorking === 'Sí') {
      requirements.unshift('Licencia o incapacidad de maternidad');
    }
    return requirements;
  }
  if (type === 'Otro tipo de incapacidad' && subType) {
    if (subType === 'Enfermedad general o especial') {
      return parseInt(days) <= 2
        ? ['Incapacidad médica']
        : ['Incapacidad médica', 'Epicrisis/resumen clínico'];
    }
    if (subType === 'Accidente de trabajo o enfermedad laboral') {
      return parseInt(days) <= 2
        ? ['Incapacidad médica']
        : ['Incapacidad médica', 'Epicrisis/resumen clínico'];
    }
    if (subType === 'Accidente de tránsito') {
      return ['Incapacidad médica', 'Epicrisis/resumen clínico', 'FURIPS', 'SOAT (si aplica)'];
    }
  }
  return [];
};

// Componente principal de la aplicación
const App = () => {
  // Estados de la aplicación
  const [cedula, setCedula] = useState('');
  const [userData, setUserData] = useState(null);
  const [isUserConfirmed, setIsUserConfirmed] = useState(false);
  const [selectedIncapacityType, setSelectedIncapacityType] = useState(null);
  const [subIncapacityType, setSubIncapacityType] = useState(null);
  const [incapacityDays, setIncapacityDays] = useState('');
  const [motherWorking, setMotherWorking] = useState(null);
  const [liveBirths, setLiveBirths] = useState('');
  const [uploadedDocuments, setUploadedDocuments] = useState({});
  const [documentFiles, setDocumentFiles] = useState({});
  const [missingDocumentAlert, setMissingDocumentAlert] = useState(null);
  const [isFormValidated, setIsFormValidated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

  // Función para validar la cédula con el backend real
  const handleCedulaSubmit = async () => {
    if (!cedula) return;

    setLoading(true);
    try {
      const result = await validateUser(cedula);
      
      if (result.success) {
        setUserData({
          name: result.data.nombre,
          docType: result.data.tipo_documento,
          company: result.data.empresa,
          status: result.data.estado,
        });
      } else {
        setMissingDocumentAlert(result.message || 'Usuario no encontrado');
      }
    } catch (error) {
      setMissingDocumentAlert('Error al conectar con el servidor. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  // Función para manejar la selección del tipo de incapacidad
  const handleIncapacitySelect = (type) => {
    setSelectedIncapacityType(type);
    setUploadedDocuments({});
    setDocumentFiles({});
    setMissingDocumentAlert(null);
    setIsFormValidated(false);
    setSubIncapacityType(null);
    setIncapacityDays('');
    setMotherWorking(null);
    setLiveBirths('');
    setSubmitMessage('');
  };

  // Función para manejar la carga de documentos
  const handleDocumentUpload = (docName, file) => {
    if (!file) return;
    
    setUploadedDocuments((prev) => ({ ...prev, [docName]: true }));
    setDocumentFiles((prev) => ({ ...prev, [docName]: file }));
  };

  // Función para validar documentos
  const handleValidateDocuments = () => {
    if (!selectedIncapacityType) return;

    const requiredDocs = getIncapacityRequirements(
      selectedIncapacityType,
      subIncapacityType,
      incapacityDays,
      motherWorking
    );

    const missingDocs = requiredDocs.filter((doc) => !uploadedDocuments[doc]);

    if (missingDocs.length > 0) {
      setMissingDocumentAlert(`Faltan los siguientes documentos: ${missingDocs.join(', ')}`);
    } else {
      setMissingDocumentAlert(null);
      setIsFormValidated(true);
    }
  };

  // Función para enviar el formulario completo
  const handleFinalSubmit = async () => {
    if (!isFormValidated) return;

    setLoading(true);
    setSubmitMessage('');
    
    try {
      const formData = new FormData();
      formData.append('cedula', cedula);
      formData.append('tipo_incapacidad', selectedIncapacityType);
      
      if (subIncapacityType) {
        formData.append('subtipo_incapacidad', subIncapacityType);
      }
      if (incapacityDays) {
        formData.append('dias_incapacidad', incapacityDays);
      }
      if (motherWorking) {
        formData.append('madre_trabajando', motherWorking);
      }
      if (liveBirths) {
        formData.append('nacidos_vivos', liveBirths);
      }

      // Agregar archivos
      Object.entries(documentFiles).forEach(([docName, file]) => {
        formData.append('archivo', file);
      });

      const result = await submitIncapacity(formData);
      
      if (result.success) {
        setSubmitMessage(`✅ ${result.mensaje || 'Incapacidad enviada exitosamente'}`);
      } else {
        setSubmitMessage(`❌ ${result.mensaje || 'Error al enviar la incapacidad'}`);
      }
    } catch (error) {
      setSubmitMessage('❌ Error de conexión con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  // Lógica para obtener la lista de documentos según el estado actual
  const currentRequirements = getIncapacityRequirements(
    selectedIncapacityType,
    subIncapacityType,
    incapacityDays,
    motherWorking
  );

  // Componente de alerta reutilizable
  const Alert = ({ message, type = 'error', onClose }) => (
    <div
      className={`p-4 rounded-lg shadow-md flex items-center ${
        type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
      }`}
    >
      {type === 'error' ? (
        <AlertTriangle className="w-5 h-5 mr-3" />
      ) : (
        <CheckCircle className="w-5 h-5 mr-3" />
      )}
      <span className="flex-1 text-sm font-medium">{message}</span>
      {onClose && (
        <button onClick={onClose} className="ml-4 text-gray-500 hover:text-gray-700">
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-8 flex items-center justify-center font-sans text-gray-800">
      <div className="w-full max-w-2xl bg-white p-6 sm:p-8 rounded-xl shadow-2xl border border-gray-200">
        <header className="mb-8 text-center">
          <div className="flex items-center justify-center mb-4">
            <FileText className="w-10 h-10 text-blue-600 mr-4" />
            <h1 className="text-3xl font-extrabold text-gray-900">
              Validación de incapacidades
            </h1>
          </div>
          <p className="text-center text-gray-600">
            Ingresa tu cédula para iniciar el proceso de registro.
          </p>
        </header>

        {/* Paso 1: Ingreso de Cédula y Confirmación */}
        {!isUserConfirmed && (
          <div className="mb-8">
            <label htmlFor="cedula" className="block text-sm font-medium text-gray-700 mb-2">
              Número de cédula
            </label>
            <div className="flex flex-col sm:flex-row gap-4">
              <input
                id="cedula"
                type="text"
                value={cedula}
                onChange={(e) => setCedula(e.target.value)}
                placeholder="Ej: 1085043374"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                onKeyPress={(e) => e.key === 'Enter' && handleCedulaSubmit()}
              />
              <button
                onClick={handleCedulaSubmit}
                className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                disabled={!cedula || loading}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Validar'
                )}
              </button>
            </div>
          </div>
        )}

        {missingDocumentAlert && !userData && (
          <div className="mb-4">
            <Alert
              message={missingDocumentAlert}
              onClose={() => setMissingDocumentAlert(null)}
            />
          </div>
        )}

        {userData && !isUserConfirmed && (
          <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg shadow-sm mb-8">
            <div className="flex items-center gap-4 mb-4">
              <UserCheck className="w-8 h-8 text-blue-600" />
              <div>
                <p className="font-semibold text-blue-800 text-lg">
                  ¿Eres {userData.name} identificado con {userData.docType} vinculado a {userData.company}?
                </p>
                <p className="text-blue-700 text-sm">Estado: {userData.status}</p>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsUserConfirmed(false);
                  setUserData(null);
                  setCedula('');
                  setMissingDocumentAlert(null);
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
              >
                No, no soy yo
              </button>
              <button
                onClick={() => setIsUserConfirmed(true)}
                className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
              >
                Sí, soy yo
              </button>
            </div>
          </div>
        )}

        {/* Paso 2: Selección del tipo de Incapacidad */}
        {isUserConfirmed && (
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4 text-gray-800 text-center sm:text-left">
              Selecciona el tipo de incapacidad que deseas registrar:
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button
                onClick={() => handleIncapacitySelect('Licencia de maternidad')}
                className={`flex flex-col items-center p-6 border-2 rounded-xl shadow-md transition-all duration-300
                  ${selectedIncapacityType === 'Licencia de maternidad' ? 'border-blue-500 bg-blue-50 scale-105' : 'border-gray-200 hover:border-gray-400 hover:bg-gray-50'}`}
              >
                <Baby className="w-12 h-12 mb-2 text-gray-600" />
                <span className="text-sm font-semibold text-gray-700 text-center">Licencia de maternidad</span>
              </button>
              <button
                onClick={() => handleIncapacitySelect('Licencia de paternidad')}
                className={`flex flex-col items-center p-6 border-2 rounded-xl shadow-md transition-all duration-300
                  ${selectedIncapacityType === 'Licencia de paternidad' ? 'border-blue-500 bg-blue-50 scale-105' : 'border-gray-200 hover:border-gray-400 hover:bg-gray-50'}`}
              >
                <User className="w-12 h-12 mb-2 text-gray-600" />
                <span className="text-sm font-semibold text-gray-700 text-center">Licencia de paternidad</span>
              </button>
              <button
                onClick={() => handleIncapacitySelect('Otro tipo de incapacidad')}
                className={`flex flex-col items-center p-6 border-2 rounded-xl shadow-md transition-all duration-300
                  ${selectedIncapacityType === 'Otro tipo de incapacidad' ? 'border-blue-500 bg-blue-50 scale-105' : 'border-gray-200 hover:border-gray-400 hover:bg-gray-50'}`}
              >
                <Stethoscope className="w-12 h-12 mb-2 text-gray-600" />
                <span className="text-sm font-semibold text-gray-700 text-center">Otro tipo de incapacidad</span>
              </button>
            </div>
          </div>
        )}

        {/* Paso 3: Requisitos dinámicos por tipo de evento */}
        {selectedIncapacityType && isUserConfirmed && (
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4 text-gray-800">
              Requisitos para {selectedIncapacityType}
            </h2>

            {/* Campos dinámicos */}
            {selectedIncapacityType === 'Otro tipo de incapacidad' && (
              <div className="grid sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="subType" className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de evento
                  </label>
                  <div className="relative">
                    <select
                      id="subType"
                      value={subIncapacityType || ''}
                      onChange={(e) => setSubIncapacityType(e.target.value)}
                      className="block w-full px-4 py-2 border border-gray-300 rounded-lg bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                    >
                      <option value="" disabled>Selecciona...</option>
                      <option>Enfermedad general o especial</option>
                      <option>Accidente de trabajo o enfermedad laboral</option>
                      <option>Accidente de tránsito</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
                {subIncapacityType !== 'Accidente de tránsito' && (
                  <div>
                    <label htmlFor="days" className="block text-sm font-medium text-gray-700 mb-1">
                      Días
                    </label>
                    <input
                      id="days"
                      type="number"
                      value={incapacityDays}
                      onChange={(e) => setIncapacityDays(e.target.value)}
                      placeholder="Ej: 5"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                    />
                  </div>
                )}
              </div>
            )}

            {(selectedIncapacityType === 'Licencia de maternidad' || selectedIncapacityType === 'Licencia de paternidad') && (
              <div className="mb-4">
                <label htmlFor="liveBirths" className="block text-sm font-medium text-gray-700 mb-1">
                  Número de nacidos vivos
                </label>
                <input
                  id="liveBirths"
                  type="number"
                  value={liveBirths}
                  onChange={(e) => setLiveBirths(e.target.value)}
                  placeholder="Ej: 1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                />
              </div>
            )}

            {selectedIncapacityType === 'Licencia de paternidad' && (
              <div className="mb-4">
                <label htmlFor="motherWorking" className="block text-sm font-medium text-gray-700 mb-1">
                  ¿La madre del hijo se encuentra laborando actualmente?
                </label>
                <div className="relative">
                  <select
                    id="motherWorking"
                    value={motherWorking || ''}
                    onChange={(e) => setMotherWorking(e.target.value)}
                    className="block w-full px-4 py-2 border border-gray-300 rounded-lg bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                  >
                    <option value="" disabled>Selecciona...</option>
                    <option>Sí</option>
                    <option>No</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            )}

            {/* Lista de documentos requeridos */}
            <ul className="space-y-3 mb-6">
              {currentRequirements.length > 0 ? (
                currentRequirements.map((docName, index) => (
                  <li
                    key={index}
                    className="flex items-center bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200"
                  >
                    <File className="w-5 h-5 text-gray-500 mr-3" />
                    <span className="flex-1 text-gray-700">{docName}</span>
                    {uploadedDocuments[docName] ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <label htmlFor={`upload-${index}`}
                        className="px-4 py-1 text-xs font-semibold bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors cursor-pointer flex items-center"
                      >
                        <Upload className="w-3 h-3 mr-1" />
                        Subir
                      </label>
                    )}
                    {/* Input de archivo oculto */}
                    <input
                      id={`upload-${index}`}
                      type="file"
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      onChange={(e) => handleDocumentUpload(docName, e.target.files[0])}
                    />
                  </li>
                ))
              ) : (
                <p className="text-center text-gray-500 p-4">
                  Selecciona las opciones para ver los requisitos.
                </p>
              )}
            </ul>

            {missingDocumentAlert && (
              <div className="mb-4">
                <Alert
                  message={missingDocumentAlert}
                  onClose={() => setMissingDocumentAlert(null)}
                />
              </div>
            )}
            
            {isFormValidated && (
              <div className="mb-4">
                <Alert
                  message="¡Validación exitosa! Todos los documentos requeridos han sido adjuntados."
                  type="success"
                  onClose={() => setIsFormValidated(false)}
                />
              </div>
            )}

            {submitMessage && (
              <div className="mb-4">
                <Alert
                  message={submitMessage}
                  type={submitMessage.includes('✅') ? 'success' : 'error'}
                  onClose={() => setSubmitMessage('')}
                />
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={handleValidateDocuments}
                className="flex-1 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={currentRequirements.length === 0}
              >
                Validar documentos
              </button>
              
              {isFormValidated && (
                <button
                  onClick={handleFinalSubmit}
                  className="flex-1 px-6 py-3 bg-green-600 text-white font-semibold rounded-lg shadow-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  Enviar incapacidad
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;