import React, { useState, useEffect } from "react";

function Equipos() {
  const [equipos, setEquipos] = useState([]);
  const [formValues, setFormValues] = useState({
    nombre: "",
    tipo: "",
    ubicacion: "",
    estado: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [deletingId, setDeletingId] = useState(null); // Nuevo estado para saber cuál se está eliminando

  const baseUrl = "https://apex.oracle.com/pls/apex/rogelioaluminios/equipos/";

  useEffect(() => {
    fetchEquipos();
  }, []);

  const fetchEquipos = async () => {
    try {
      setLoading(true);
      const response = await fetch(baseUrl);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Error al cargar equipos");
      }

      setEquipos(data.items || []);
      setError(null);
    } catch (error) {
      setEquipos([]); // Asegura que la tabla se limpie si hay error
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Validación
      if (
        !formValues.nombre ||
        !formValues.tipo ||
        !formValues.ubicacion ||
        !formValues.estado
      ) {
        throw new Error("Todos los campos son obligatorios");
      }

      // Crear FormData
      const formData = new FormData();
      formData.append("nombre", formValues.nombre);
      formData.append("tipo", formValues.tipo);
      formData.append("ubicacion", formValues.ubicacion);
      formData.append("estado", formValues.estado);

      // Enviar datos
      const response = await fetch(baseUrl, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        // Manejar errores específicos de ORDS
        if (response.status === 555) {
          throw new Error(data.message || "Error en el servidor ORDS (555)");
        }
        throw new Error(data.message || `Error ${response.status}`);
      }

      // Éxito
      setSuccess("Equipo registrado correctamente");
      setFormValues({ nombre: "", tipo: "", ubicacion: "", estado: "" });
      await fetchEquipos(); // Actualizar lista
    } catch (error) {
      setError(error.message);
      if (error.message.includes("555")) {
        setError(
          (prev) => `${prev} - Verifica la configuración del endpoint REST`
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Estás seguro de eliminar este equipo?")) return;

    try {
      setDeletingId(id);
      setError(null);
      setSuccess(null);

      // ORDS: POST con _method=DELETE y ?id=...
      const formData = new FormData();
      formData.append("_method", "DELETE");
      formData.append("id", id);

      const response = await fetch(`${baseUrl}?id=${id}`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Error al eliminar equipo");
      }

      setSuccess("Equipo eliminado correctamente");
      // Elimina el equipo del estado antes de refrescar la lista
      setEquipos((prev) => prev.filter((e) => e.id !== id));
      await fetchEquipos(); // Refresca la lista para evitar filas en blanco
    } catch (error) {
      setError(error.message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Gestión de Equipos</h1>
      {/* Formulario */}
      <div style={styles.card}>
        <h2 style={styles.subtitle}>Registrar Nuevo Equipo</h2>
        <form onSubmit={handleSubmit}>
          {["nombre", "tipo", "ubicacion"].map((field) => (
            <div key={field} style={styles.formGroup}>
              <label style={styles.label}>
                {field.charAt(0).toUpperCase() + field.slice(1)}:
              </label>
              <input
                type="text"
                name={field}
                value={formValues[field]}
                onChange={handleChange}
                required
                style={styles.input}
              />
            </div>
          ))}

          <div style={styles.formGroup}>
            <label style={styles.label}>Estado:</label>
            <select
              name="estado"
              value={formValues.estado}
              onChange={handleChange}
              required
              style={styles.input}
            >
              <option value="">Seleccionar...</option>
              <option value="Activo">Activo</option>
              <option value="Inactivo">Inactivo</option>
              <option value="Mantenimiento">Mantenimiento</option>
            </select>
          </div>

          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? "Guardando..." : "Guardar Equipo"}
          </button>
        </form>
      </div>

      {/* Mensajes */}
      {error && <div style={styles.error}>{error}</div>}
      {success && <div style={styles.success}>{success}</div>}

      {/* Lista */}
      <div style={styles.card}>
        <h2 style={styles.subtitle}>Equipos Registrados</h2>
        {loading && equipos.length === 0 ? (
          <p>Cargando...</p>
        ) : equipos.length === 0 ? (
          <p>No hay equipos registrados</p>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                {["Nombre", "Tipo", "Ubicación", "Estado", "Eliminar"].map(
                  (header) => (
                    <th key={header} style={styles.th}>
                      {header}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {equipos.map((equipo) => (
                <tr key={equipo.id} style={styles.tr}>
                  <td style={styles.td}>{equipo.nombre}</td>
                  <td style={styles.td}>{equipo.tipo}</td>
                  <td style={styles.td}>{equipo.ubicacion}</td>
                  <td style={styles.td}>{equipo.estado}</td>
                  <td style={styles.td}>
                    <button
                      onClick={() => handleDelete(equipo.id)}
                      disabled={!!deletingId}
                      style={styles.deleteButton}
                    >
                      {deletingId === equipo.id ? "Eliminando..." : "Eliminar"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// Estilos (puedes moverlos a un archivo CSS separado)
const styles = {
  container: {
    maxWidth: "700px",
    margin: "40px auto",
    padding: "32px 18px",
    fontFamily: "Segoe UI, Arial, sans-serif",
    background: "#f7f9fa",
    borderRadius: "14px",
    boxShadow: "0 2px 16px rgba(0,0,0,0.08)",
  },
  title: {
    color: "#1d3557",
    textAlign: "center",
    fontWeight: 700,
    fontSize: "2.2rem",
    letterSpacing: "1px",
    marginBottom: "24px",
  },
  card: {
    background: "#fff",
    padding: "22px",
    borderRadius: "10px",
    marginBottom: "22px",
    boxShadow: "0 1px 6px rgba(0,0,0,0.04)",
  },
  subtitle: {
    marginTop: 0,
    color: "#457b9d",
    fontWeight: 600,
    fontSize: "1.15rem",
    marginBottom: "18px",
  },
  formGroup: {
    marginBottom: "14px",
  },
  label: {
    display: "block",
    marginBottom: "4px",
    fontWeight: 500,
    color: "#495057",
    fontSize: "1rem",
  },
  input: {
    width: "100%",
    padding: "9px",
    borderRadius: "5px",
    border: "1px solid #bfc9d1",
    boxSizing: "border-box",
    fontSize: "1rem",
    background: "#f1f3f6",
    transition: "border 0.2s",
    outline: "none",
  },
  button: {
    background: "linear-gradient(90deg, #457b9d 0%, #1d3557 100%)",
    color: "white",
    padding: "10px 0",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "1.05rem",
    fontWeight: 600,
    width: "100%",
    boxShadow: "0 1px 6px rgba(0,0,0,0.06)",
    marginTop: "8px",
    transition: "background 0.2s",
  },
  error: {
    background: "#ffeaea",
    color: "#e63946",
    padding: "10px",
    borderRadius: "5px",
    marginBottom: "16px",
    fontWeight: 500,
    border: "1px solid #f8bbd0",
    textAlign: "center",
  },
  success: {
    background: "#e6f9f2",
    color: "#2dce89",
    padding: "10px",
    borderRadius: "5px",
    marginBottom: "16px",
    fontWeight: 500,
    border: "1px solid #b2f2e5",
    textAlign: "center",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: "12px",
    background: "#fff",
    borderRadius: "8px",
    overflow: "hidden",
    boxShadow: "0 1px 6px rgba(0,0,0,0.04)",
  },
  th: {
    background: "#1d3557",
    color: "white",
    padding: "10px",
    textAlign: "left",
    fontWeight: 600,
    fontSize: "0.98rem",
    borderBottom: "2px solid #457b9d",
  },
  tr: {
    background: "#f7f9fa",
  },
  td: {
    padding: "10px",
    fontSize: "0.98rem",
    color: "#222",
    borderBottom: "1px solid #e9ecef",
  },
  deleteButton: {
    background: "linear-gradient(90deg, #e63946 0%, #f3722c 100%)",
    color: "white",
    padding: "6px 14px",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: "0.98rem",
    boxShadow: "0 1px 6px rgba(0,0,0,0.06)",
    transition: "background 0.2s",
  },
};

export default Equipos;
